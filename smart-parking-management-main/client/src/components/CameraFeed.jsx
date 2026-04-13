import { useState, useRef, useEffect } from 'react';
import { detectLicensePlate } from '../services/detection';
import { speakText } from '../services/voiceAssistant';
import './CameraFeed.css';

function CameraFeed({ onCheckIn }) {
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectedPlate, setDetectedPlate] = useState('');
    const [manualPlate, setManualPlate] = useState('');
    const [confidence, setConfidence] = useState(0);
    const [status, setStatus] = useState('Sẵn s\u00e0ng');
    const [mode, setMode] = useState('manual'); // 'auto' or 'manual'
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (mode === 'auto') {
            startCamera();
        }
        return () => stopCamera();
    }, [mode]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
            setStatus('Camera đã sẵn sàng');
        } catch (error) {
            console.error('Camera error:', error);
            setStatus('Lỗi camera - Chuyển sang chế độ thủ công');
            setMode('manual');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    const handleManualCheckIn = async (e) => {
        e.preventDefault();
        if (!manualPlate.trim()) return;

        setIsDetecting(true);
        setStatus('Đang xử lý...');

        try {
            const plate = manualPlate.toUpperCase().trim();
            setDetectedPlate(plate);
            setConfidence(1.0);

            // Voice assistant
            speakText(`Xin chào, mời xe ${plate} vào bãi`);

            // Call check-in API
            const response = await fetch('/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    licensePlate: plate,
                    evidenceImage: null
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onCheckIn(data);
                speakText(data.message);
                setStatus('✅ Check-in thành công');
                setManualPlate('');
                setDetectedPlate('');
            } else {
                const errorMsg = data.error || 'Có lỗi xảy ra';
                setStatus('❌ ' + errorMsg);
                speakText(errorMsg);
            }
        } catch (error) {
            console.error('Check-in error:', error);
            const errorMsg = error.message === 'Failed to fetch'
                ? 'Không kết nối được server. Vui lòng kiểm tra kết nối mạng'
                : 'Lỗi kết nối server';
            setStatus('❌ ' + errorMsg);
            speakText(errorMsg);
        } finally {
            setIsDetecting(false);
        }
    };

    const handleDetect = async () => {
        if (!videoRef.current || isDetecting) return;

        setIsDetecting(true);
        setStatus('Đang nhận diện...');

        try {
            // Capture frame from video
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            const imageData = canvas.toDataURL('image/jpeg');

            // Detect license plate (simulated - in real app, use ONNX + Tesseract)
            const result = await detectLicensePlate(imageData);

            if (result.plate) {
                setDetectedPlate(result.plate);
                setConfidence(result.confidence);
                setStatus(`Phát hiện: ${result.plate}`);

                // Voice assistant
                speakText(`Xin chào, mời xe ${result.plate} vào bãi`);

                // Call check-in API
                const response = await fetch('/api/checkin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        licensePlate: result.plate,
                        evidenceImage: imageData
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    onCheckIn(data);
                    speakText(data.message);
                    setStatus('✅ Check-in thành công');
                } else {
                    const errorMsg = data.error || 'Có lỗi xảy ra';
                    setStatus('❌ ' + errorMsg);
                    speakText(errorMsg);
                }
            } else {
                setStatus('Không phát hiện biển số. Vui lòng thử lại');
                speakText('Không phát hiện biển số');
            }
        } catch (error) {
            console.error('Detection error:', error);
            const errorMsg = error.message === 'Failed to fetch'
                ? 'Không kết nối được server. Vui lòng kiểm tra kết nối mạng'
                : 'Lỗi nhận diện';
            setStatus('❌ ' + errorMsg);
        } finally {
            setIsDetecting(false);
        }
    };

    return (
        <div className="camera-feed card">
            <h2>Check-in xe vào bãi</h2>

            <div className="mode-toggle">
                <button
                    className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
                    onClick={() => setMode('manual')}
                >
                    Thủ công
                </button>
                <button
                    className={`mode-btn ${mode === 'auto' ? 'active' : ''}`}
                    onClick={() => setMode('auto')}
                >
                    Tự động (AI)
                </button>
            </div>

            {mode === 'manual' ? (
                <div className="manual-input-section">
                    <form onSubmit={handleManualCheckIn}>
                        <div className="input-group">
                            <label>Nhập biển số xe:</label>
                            <input
                                type="text"
                                value={manualPlate}
                                onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                                placeholder="VD: 59-P1 123.45"
                                className="plate-input"
                                disabled={isDetecting}
                                pattern="[0-9]{2}[-]?[A-Z]{1,2}[0-9][\s.-]*[0-9]{3}[\s.-]*[0-9]{2}"
                                title="Format: XX-YZ NNN.NN (VD: 59-P1 123.45)"
                            />
                        </div>

                        <div className="status-bar">
                            <span className={`status-text ${isDetecting ? 'detecting' : ''}`}>
                                {status}
                            </span>
                        </div>

                        {detectedPlate && (
                            <div className="detected-info">
                                <span className="icon">🚗</span>
                                <span className="plate-display">{detectedPlate}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary detect-btn"
                            disabled={isDetecting || !manualPlate.trim()}
                        >
                            {isDetecting ? 'Đang xử lý...' : 'Check-in'}
                        </button>

                        <div className="instructions">
                            <p><strong>Hướng dẫn:</strong></p>
                            <ul>
                                <li>Nhập biển số theo format: <code>XX-YZ NNN.NN</code></li>
                                <li>VD: <code>59-P1 123.45</code> hoặc <code>30-A2 456.78</code></li>
                                <li>Hệ thống sẽ tự động gợi ý vị trí đỗ</li>
                            </ul>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="auto-detection-section">
                    <div className="video-container">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="video-feed"
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {detectedPlate && (
                            <div className="detection-overlay">
                                <div className="detection-box">
                                    <span className="plate-text">{detectedPlate}</span>
                                    <span className="confidence">{Math.round(confidence * 100)}%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="status-bar">
                        <span className={`status-text ${isDetecting ? 'detecting' : ''}`}>
                            {status}
                        </span>
                    </div>

                    <button
                        className="btn btn-primary detect-btn"
                        onClick={handleDetect}
                        disabled={isDetecting}
                    >
                        {isDetecting ? 'Đang xử lý...' : 'Nhận diện AI (Demo)'}
                    </button>

                    <div className="instructions">
                        <p><strong>Lưu ý:</strong></p>
                        <ul>
                            <li>Chế độ AI đang dùng dữ liệu demo (random)</li>
                            <li>Để test chính xác, dùng chế độ <strong>Thủ công</strong></li>
                            <li>Production: Tích hợp ONNX + Tesseract thật</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CameraFeed;
