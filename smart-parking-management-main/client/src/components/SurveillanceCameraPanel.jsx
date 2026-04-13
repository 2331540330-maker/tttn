import { useState, useRef, useEffect, useCallback } from 'react';
import { detectLicensePlate } from '../services/detection';
import './SurveillanceCameraPanel.css';

const SURVEILLANCE_SLOT = 'C3';
const SCAN_INTERVAL_MS = 60000; // 60 giây

function SurveillanceCameraPanel({ onSlotUpdate }) {
    const [cameraActive, setCameraActive]   = useState(false);
    const [cameraError, setCameraError]     = useState('');
    const [countdown, setCountdown]         = useState(SCAN_INTERVAL_MS / 1000);
    const [isScanning, setIsScanning]       = useState(false);
    const [scanLogs, setScanLogs]           = useState([]);
    const [lastResult, setLastResult]       = useState(null);
    const [c3Status, setC3Status]           = useState(null);
    const [devices, setDevices]             = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [aiConfidence, setAiConfidence]   = useState(null);

    const videoRef     = useRef(null);
    const canvasRef    = useRef(null);
    const streamRef    = useRef(null);
    const countdownRef = useRef(null);

    // ── Fetch trạng thái ô C3 ──────────────────────────────
    const fetchC3Status = useCallback(async () => {
        try {
            const res  = await fetch('/api/surveillance/status');
            const data = await res.json();
            if (data.success) setC3Status(data);
        } catch (e) {
            console.error('C3 status error:', e);
        }
    }, []);

    useEffect(() => {
        fetchC3Status();
        // Liệt kê camera thiết bị
        navigator.mediaDevices.enumerateDevices()
            .then(devs => {
                const cams = devs.filter(d => d.kind === 'videoinput');
                setDevices(cams);
                if (cams.length > 1) setSelectedDevice(cams[1].deviceId);
                else if (cams.length === 1) setSelectedDevice(cams[0].deviceId);
            })
            .catch(() => {});
    }, []);

    const addLog = useCallback((entry) => {
        setScanLogs(prev => [entry, ...prev].slice(0, 50));
    }, []);

    // ── Camera controls ────────────────────────────────────
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    const startCamera = useCallback(async (deviceId) => {
        try {
            stopCamera();
            const constraints = {
                video: deviceId
                    ? { deviceId: { exact: deviceId }, width: 1280, height: 720 }
                    : { facingMode: 'environment', width: 1280, height: 720 }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
            setCameraActive(true);
            setCameraError('');
            addLog({ type: 'info', text: `📷 Camera C3 đã bật — AI sẵn sàng giám sát`, time: new Date() });
        } catch (err) {
            setCameraError('Không thể mở camera: ' + err.message);
            setCameraActive(false);
            addLog({ type: 'error', text: '❌ Lỗi camera: ' + err.message, time: new Date() });
        }
    }, [addLog, stopCamera]);

    // ── QUÁ TRÌNH QUÉT AI 2 BƯỚC ──────────────────────────
    const doScan = useCallback(async () => {
        if (isScanning) return;
        setIsScanning(true);
        setAiConfidence(null);
        addLog({ type: 'scan', text: '📸 Chụp ảnh gửi sang Python AI (port 8000)...', time: new Date() });

        try {
            // ── BƯỚC 1: Chụp frame và gửi Python AI ──
            let imageData = null;
            if (videoRef.current && canvasRef.current) {
                const canvas = canvasRef.current;
                const video  = videoRef.current;
                canvas.width  = video.videoWidth  || 640;
                canvas.height = video.videoHeight || 480;
                canvas.getContext('2d').drawImage(video, 0, 0);
                imageData = canvas.toDataURL('image/jpeg', 0.85);
            }

            const aiResult = await detectLicensePlate(imageData);

            if (!aiResult?.plate) {
                // AI không đọc được — không làm phiền Node.js
                addLog({
                    type: 'warn',
                    text: '🤖 AI không nhận diện được biển số trong ảnh này',
                    time: new Date()
                });
                setIsScanning(false);
                return;
            }

            // AI đọc được — ghi nhận
            const conf = Math.round((aiResult.confidence || 0.9) * 100);
            setAiConfidence(conf);
            addLog({
                type: 'ai',
                text: `🤖 AI đọc được: "${aiResult.plate}" (${conf}% tin cậy). Đang đối chiếu DB...`,
                time: new Date()
            });

            // ── BƯỚC 2: Gửi biển số lên Node.js Backend ──
            const res = await fetch('/api/surveillance/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: null,                   // node không cần xử lý ảnh nữa
                    licensePlate: aiResult.plate,  // AI đã đọc, gửi thẳng
                    slotId: SURVEILLANCE_SLOT
                })
            });

            const data = await res.json();
            setLastResult({ ...data, aiConfidence: conf });

            // ── BƯỚC 3: Xử lý kết quả ──
            if (data.success && data.detected && data.moved) {
                // 🚗 XE DI CHUYỂN — core feature
                addLog({
                    type: 'alert',
                    text: `🚨 PHÁT HIỆN DI CHUYỂN: ${data.licensePlate} | ${data.oldSlot} → ${data.newSlot}`,
                    time: new Date()
                });
                if (onSlotUpdate) onSlotUpdate();
                fetchC3Status();

            } else if (data.success && data.detected && !data.moved) {
                // Xe đang ở đúng chỗ
                addLog({
                    type: 'info',
                    text: `✅ ${data.licensePlate} đang đúng vị trí ${SURVEILLANCE_SLOT} — không thay đổi`,
                    time: new Date()
                });

            } else if (data.success && data.detected && data.notInSystem) {
                // Xe lạ chưa có trong DB
                addLog({
                    type: 'warn',
                    text: `⚠️ Biển ${data.licensePlate} không có trong hệ thống — xe ngoài bãi hoặc chưa check-in`,
                    time: new Date()
                });

            } else if (data.targetOccupied) {
                // C3 đang bị xe khác chiếm
                addLog({
                    type: 'warn',
                    text: `⚠️ Ô C3 đang có xe khác (${data.occupiedBy}) — không thể chuyển ${data.licensePlate}`,
                    time: new Date()
                });

            } else {
                addLog({
                    type: 'warn',
                    text: '⚠️ ' + (data.message || data.error || 'Không rõ trạng thái'),
                    time: new Date()
                });
            }

        } catch (err) {
            addLog({ type: 'error', text: '❌ Lỗi hệ thống: ' + err.message, time: new Date() });
        } finally {
            setIsScanning(false);
        }
    }, [isScanning, addLog, onSlotUpdate, fetchC3Status]);

    // ── Countdown + auto-scan ──────────────────────────────
    useEffect(() => {
        if (!cameraActive) {
            clearInterval(countdownRef.current);
            setCountdown(SCAN_INTERVAL_MS / 1000);
            return;
        }
        setCountdown(SCAN_INTERVAL_MS / 1000);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    doScan();
                    return SCAN_INTERVAL_MS / 1000;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(countdownRef.current);
    }, [cameraActive, doScan]);

    const handleToggleCamera = () => {
        if (cameraActive) stopCamera();
        else startCamera(selectedDevice);
    };

    const progressPercent = ((SCAN_INTERVAL_MS / 1000 - countdown) / (SCAN_INTERVAL_MS / 1000)) * 100;

    // ── Render ────────────────────────────────────────────
    return (
        <div className="surveillance-panel">

            {/* ── HEADER ── */}
            <div className="surv-header">
                <div className="surv-title-row">
                    <span className="surv-icon">📷</span>
                    <div>
                        <h2 className="surv-title">Camera Giám sát – Ô {SURVEILLANCE_SLOT}</h2>
                        <p className="surv-subtitle">
                            Python AI tự động nhận diện biển số mỗi 60s
                            {aiConfidence !== null && (
                                <span className="ai-badge">🤖 AI {aiConfidence}%</span>
                            )}
                        </p>
                    </div>
                    <div className={`surv-badge ${cameraActive ? 'live' : 'offline'}`}>
                        {cameraActive ? '🔴 LIVE' : '⚫ OFFLINE'}
                    </div>
                </div>
            </div>

            <div className="surv-body">

                {/* ── STATUS ROW: C3 hiện tại + kết quả quét gần nhất ── */}
                <div className="surv-top-row">
                    {/* C3 status */}
                    <div className="c3-status-card">
                        <div className="c3-label">📍 Ô {SURVEILLANCE_SLOT} hiện tại</div>
                        {c3Status ? (
                            <div className={`c3-status ${c3Status.slotStatus}`}>
                                {c3Status.slotStatus === 'occupied'
                                    ? <><span className="c3-car-icon">🚗</span><span className="c3-plate">{c3Status.licensePlate}</span></>
                                    : <span className="c3-empty">Trống</span>}
                            </div>
                        ) : <span className="c3-loading">Đang tải...</span>}
                    </div>

                    {/* Kết quả quét cuối */}
                    {lastResult?.detected && (
                        <div className={`last-result ${lastResult.moved ? 'moved' : 'no-move'}`}>
                            <div className="result-title">🔎 Lần quét gần nhất:</div>
                            <div className="result-plate">🚗 {lastResult.licensePlate}</div>
                            {lastResult.aiConfidence && (
                                <div className="result-conf">AI: {lastResult.aiConfidence}% chính xác</div>
                            )}
                            {lastResult.moved && (
                                <div className="result-move">
                                    <span className="old-slot">{lastResult.oldSlot}</span>
                                    <span className="arrow"> → </span>
                                    <strong className="new-slot">{lastResult.newSlot}</strong>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── MAIN: Camera (trái) + Log (phải) ── */}
                <div className="surv-main-area">

                    {/* ── CỘT TRÁI: Camera ── */}
                    <div className="surv-left">

                        {/* Chọn thiết bị */}
                        {devices.length > 1 && (
                            <div className="device-selector">
                                <label>🎥 Chọn camera:</label>
                                <select
                                    value={selectedDevice}
                                    onChange={e => {
                                        setSelectedDevice(e.target.value);
                                        if (cameraActive) startCamera(e.target.value);
                                    }}
                                >
                                    {devices.map((d, i) => (
                                        <option key={d.deviceId} value={d.deviceId}>
                                            {d.label || `Camera ${i + 1}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Video feed */}
                        <div className="video-wrapper">
                            <video
                                ref={videoRef}
                                autoPlay playsInline muted
                                className={`surv-video ${cameraActive ? 'active' : 'inactive'}`}
                            />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            {/* Placeholder khi tắt */}
                            {!cameraActive && (
                                <div className="video-placeholder">
                                    <span>📷</span>
                                    <p>Camera chưa bật</p>
                                    <small>Bấm "Bật Camera" để bắt đầu giám sát AI</small>
                                </div>
                            )}

                            {/* Overlay quét AI */}
                            {isScanning && (
                                <div className="scan-overlay">
                                    <div className="scan-line" />
                                    <span className="scan-label">🤖 Python AI đang phân tích...</span>
                                </div>
                            )}

                            {/* Badge ô */}
                            <div className="slot-badge">Ô {SURVEILLANCE_SLOT}</div>

                            {/* Badge AI engine */}
                            {cameraActive && (
                                <div className="ai-engine-badge">🤖 YOLOv8 + EasyOCR</div>
                            )}
                        </div>

                        {cameraError && <div className="surv-error">{cameraError}</div>}

                        {/* Countdown */}
                        {cameraActive && (
                            <div className="countdown-section">
                                <div className="countdown-row">
                                    <span>⏱ Quét tiếp theo:</span>
                                    <span className="countdown-num">{countdown}s</span>
                                </div>
                                <div className="countdown-bar">
                                    <div className="countdown-fill" style={{ width: `${progressPercent}%` }} />
                                </div>
                            </div>
                        )}

                        {/* Điều khiển */}
                        <div className="surv-controls">
                            <button
                                className={`btn-surv ${cameraActive ? 'btn-stop' : 'btn-start'}`}
                                onClick={handleToggleCamera}
                            >
                                {cameraActive ? '⏹ Tắt Camera' : '▶ Bật Camera'}
                            </button>
                            <button
                                className="btn-surv btn-scan"
                                onClick={doScan}
                                disabled={!cameraActive || isScanning}
                            >
                                {isScanning ? '🔄 AI đang xử lý...' : '🔍 Quét AI ngay'}
                            </button>
                        </div>
                    </div>

                    {/* ── CỘT PHẢI: Nhật ký AI ── */}
                    <div className="surv-right">
                        <div className="log-header">
                            <h3>📋 Nhật ký AI</h3>
                            <button className="btn-clear" onClick={() => setScanLogs([])}>Xóa</button>
                        </div>

                        {/* Legend */}
                        <div className="log-legend">
                            <span className="legend-item log-ai">🤖 AI</span>
                            <span className="legend-item log-alert">🚨 Di chuyển</span>
                            <span className="legend-item log-info">✅ OK</span>
                            <span className="legend-item log-warn">⚠️ Cảnh báo</span>
                        </div>

                        <div className="log-list">
                            {scanLogs.length === 0 && (
                                <div className="log-empty">
                                    Chưa có sự kiện nào.<br />
                                    Bật camera để AI bắt đầu giám sát.
                                </div>
                            )}
                            {scanLogs.map((log, i) => (
                                <div key={i} className={`log-item log-${log.type}`}>
                                    <span className="log-time">
                                        {log.time.toLocaleTimeString('vi-VN')}
                                    </span>
                                    <span className="log-text">{log.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SurveillanceCameraPanel;
