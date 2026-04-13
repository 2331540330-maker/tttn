import { useState, useRef, useEffect, useCallback } from 'react';
import { speakText } from '../services/voiceAssistant';
import { detectLicensePlate } from '../services/detection';
import './CheckoutPanel.css';

function CheckoutPanel({ onComplete, disableCamera = false }) {
    // ── State cơ bản ──────────────────────────────────────
    const [licensePlate, setLicensePlate]   = useState('');
    const [checkoutData, setCheckoutData]   = useState(null);
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState('');

    // ── State camera AI ───────────────────────────────────
    const [mode, setMode]               = useState('manual');     // 'manual' | 'auto'
    const [cameraReady, setCameraReady] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [statusMsg, setStatusMsg]     = useState('');
    const [confidence, setConfidence]   = useState(0);

    // ── Refs ──────────────────────────────────────────────
    const videoRef  = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // ── Camera lifecycle ──────────────────────────────────
    const startCamera = useCallback(async () => {
        setCameraReady(false);
        setStatusMsg('Đang khởi động camera...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
            setCameraReady(true);
            setStatusMsg('Camera sẵn sàng — Đưa biển số vào khung hình');
        } catch (err) {
            console.error('Camera error:', err);
            setStatusMsg('⚠️ Không mở được camera — vui lòng dùng nhập tay');
            setMode('manual');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraReady(false);
        setStatusMsg('');
    }, []);

    useEffect(() => {
        if (mode === 'auto') startCamera();
        else stopCamera();
        return stopCamera;
    }, [mode]);

    // ── Nhận diện biển số qua AI ──────────────────────────
    const handleDetect = async () => {
        if (!videoRef.current || isDetecting || !cameraReady) return;

        setIsDetecting(true);
        setError('');
        setConfidence(0);
        setStatusMsg('🔍 Python AI đang phân tích ảnh...');

        try {
            // Chụp frame từ video
            const canvas = canvasRef.current;
            const video  = videoRef.current;
            canvas.width  = video.videoWidth  || 640;
            canvas.height = video.videoHeight || 480;
            canvas.getContext('2d').drawImage(video, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.92);

            // Gọi sang Python AI Server (port 8000)
            const result = await detectLicensePlate(imageData);

            if (result?.plate) {
                setLicensePlate(result.plate);
                setConfidence(Math.round((result.confidence || 0.9) * 100));
                setStatusMsg(`✅ Đọc được: ${result.plate}`);
                // Tự động tính tiền ngay
                await processCheckout(result.plate);
            } else {
                setStatusMsg('❌ Không đọc được biển số — thử lại hoặc nhập tay');
                setError('AI chưa nhận rõ, hãy đưa biển số vào gần và đúng góc hơn.');
            }
        } catch (err) {
            console.error('Detection error:', err);
            setStatusMsg('❌ Lỗi kết nối AI Server');
            setError('Mất kết nối với Python AI Server (port 8000). Hãy kiểm tra lại.');
        } finally {
            setIsDetecting(false);
        }
    };

    // ── Checkout logic ────────────────────────────────────
    const handleManualCheckout = async (e) => {
        e.preventDefault();
        if (!licensePlate.trim()) return;
        await processCheckout(licensePlate.trim());
    };

    const processCheckout = async (plate) => {
        setLoading(true);
        setError('');
        setCheckoutData(null);

        try {
            const res  = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licensePlate: plate })
            });
            const data = await res.json();

            if (data.success) {
                setCheckoutData(data);
                setStatusMsg('💳 Đã tạo bill — chờ thanh toán');
                speakText(data.message);
            } else {
                setError(data.error || 'Không tìm thấy xe trong bãi');
                setStatusMsg('Lỗi tra cứu');
                speakText(data.error);
            }
        } catch {
            setError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!checkoutData) return;
        try {
            const res  = await fetch('/api/checkout/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licensePlate: checkoutData.licensePlate })
            });
            const data = await res.json();

            if (data.success) {
                speakText(data.message);
                setCheckoutData(null);
                setLicensePlate('');
                setConfidence(0);
                setStatusMsg('Camera sẵn sàng — Đưa biển số vào khung hình');
                onComplete?.();
                alert('✅ Thanh toán thành công! Barrier đã mở.');
            } else {
                alert(data.error || 'Lỗi xác nhận thanh toán');
            }
        } catch {
            alert('Lỗi kết nối server');
        }
    };

    // ── Render ────────────────────────────────────────────
    return (
        <div className="checkout-panel">

            {/* ── FORM CHÍNH ── */}
            <div className="checkout-form card">
                <h2>Check-out &amp; Thanh toán</h2>

                {/* Nút chuyển chế độ — chỉ hiện ở Admin */}
                {!disableCamera && (
                    <div className="mode-toggle">
                        <button
                            type="button"
                            className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
                            onClick={() => setMode('manual')}
                        >
                            ⌨️ Nhập tay
                        </button>
                        <button
                            type="button"
                            className={`mode-btn ${mode === 'auto' ? 'active' : ''}`}
                            onClick={() => setMode('auto')}
                        >
                            🎥 Camera AI
                        </button>
                    </div>
                )}

                {/* ── CHẾ ĐỘ CAMERA AI — chỉ hiện ở Admin ── */}
                {!disableCamera && mode === 'auto' && (
                    <div className="auto-mode">
                        {/* Khung video */}
                        <div className="video-container">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="video-feed"
                            />

                            {/* Overlay khung ngắm */}
                            <div className="scan-overlay">
                                <div className="scan-frame">
                                    <span className="corner tl"/>
                                    <span className="corner tr"/>
                                    <span className="corner bl"/>
                                    <span className="corner br"/>
                                </div>
                                {isDetecting && <div className="scan-line"/>}
                            </div>

                            {/* Badge trạng thái góc trên */}
                            <div className={`camera-badge ${cameraReady ? 'badge-ready' : 'badge-loading'}`}>
                                <span className="badge-dot"/>
                                {cameraReady ? 'LIVE' : 'LOADING'}
                            </div>

                            <canvas ref={canvasRef} style={{ display: 'none' }}/>
                        </div>

                        {/* Thanh trạng thái */}
                        {statusMsg && (
                            <div className={`status-bar ${isDetecting ? 'status-scanning' : cameraReady ? 'status-ready' : 'status-idle'}`}>
                                {statusMsg}
                                {confidence > 0 && (
                                    <span className="confidence-badge">{confidence}%</span>
                                )}
                            </div>
                        )}

                        {/* Nút chụp */}
                        <button
                            type="button"
                            className={`btn btn-capture ${isDetecting || loading ? 'btn-scanning' : ''}`}
                            onClick={handleDetect}
                            disabled={isDetecting || loading || !cameraReady}
                        >
                            {isDetecting
                                ? <><span className="spinner-sm"/>Đang phân tích...</>
                                : '📸 Chụp &amp; Tính Tiền'}
                        </button>

                        {/* Hướng dẫn */}
                        <div className="instructions">
                            <p>💡 Hướng dẫn quét nhanh:</p>
                            <ul>
                                <li>Đặt biển số trong khung ngắm vàng</li>
                                <li>Giữ yên và đủ sáng</li>
                                <li>Bấm nút chụp — AI tự đọc và tính tiền</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* ── Ô NHẬP BIỂN SỐ (luôn hiển thị để AI điền vào hoặc nhập tay) ── */}
                <form onSubmit={handleManualCheckout} style={{ marginTop: mode === 'auto' ? '1rem' : '0' }}>
                    <div className="form-group">
                        <label>Biển số xe cần ra:</label>
                        <input
                            type="text"
                            value={licensePlate}
                            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                            placeholder="VD: 59-P1 123.45"
                            required
                            disabled={loading || (mode === 'auto' && isDetecting)}
                            className="plate-input"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {/* Nút tính phí chỉ hiện ở chế độ thủ công */}
                    {mode === 'manual' && (
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Tính phí'}
                        </button>
                    )}

                    {/* Chế độ AI: cho phép nhập tay để ghi đè nếu AI nhầm */}
                    {mode === 'auto' && licensePlate && !loading && (
                        <button type="submit" className="btn btn-outline-primary" disabled={loading}
                            style={{ marginTop: '0.5rem' }}>
                            ✏️ Tính phí với biển số trên (sửa tay)
                        </button>
                    )}
                </form>
            </div>

            {/* ── BILL THANH TOÁN ── */}
            {checkoutData && (
                <div className="payment-details card fade-in">
                    <h3>📋 Thông tin thanh toán</h3>

                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">Biển số:</span>
                            <span className="value">{checkoutData.licensePlate}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Giờ vào:</span>
                            <span className="value">
                                {new Date(checkoutData.checkInTime).toLocaleString('vi-VN')}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="label">Giờ ra:</span>
                            <span className="value">
                                {new Date(checkoutData.checkOutTime).toLocaleString('vi-VN')}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="label">Thời gian gửi:</span>
                            <span className="value">
                                {Math.floor(checkoutData.duration / 60)}h {checkoutData.duration % 60}m
                            </span>
                        </div>
                        <div className="info-item fee">
                            <span className="label">Phí gửi xe:</span>
                            <span className="value">{checkoutData.fee.toLocaleString('vi-VN')} đ</span>
                        </div>
                    </div>

                    <div className="qr-section">
                        <h4>📱 Quét mã để thanh toán</h4>
                        <img src={checkoutData.qrCode} alt="VietQR Code" className="qr-code"/>
                        <p className="qr-instruction">
                            Mở app ngân hàng → Quét mã QR → Xác nhận thanh toán
                        </p>
                    </div>

                    <button className="btn btn-success" onClick={handleConfirmPayment}>
                        ✅ Xác nhận đã thanh toán — Mở barrier
                    </button>
                </div>
            )}
        </div>
    );
}

export default CheckoutPanel;
