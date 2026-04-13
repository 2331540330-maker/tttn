import { useState } from 'react';
import './FindCarPanel.css';

function FindCarPanel({ slots }) {
    const [searchPlate, setSearchPlate] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch(`/api/parking/find-car?plate=${encodeURIComponent(searchPlate)}`);
            const data = await response.json();
            setResult(data);

            if (data.found) {
                // Speak location
                const synth = window.speechSynthesis;
                const utterance = new SpeechSynthesisUtterance(data.message);
                utterance.lang = 'vi-VN';
                synth.speak(utterance);
            }
        } catch (error) {
            setResult({
                found: false,
                message: 'Lỗi kết nối server'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="find-car-panel">
            <div className="search-card card">
                <h2>Tìm xe trong bãi</h2>

                <form onSubmit={handleSearch}>
                    <div className="search-box">
                        <input
                            type="text"
                            value={searchPlate}
                            onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                            placeholder="Nhập biển số (VD: 59-P1 123.45)"
                            required
                            disabled={loading}
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                        </button>
                    </div>
                </form>
            </div>

            {result && (
                <div className={`result-card card fade-in ${result.found ? 'found' : 'not-found'}`}>
                    {result.found ? (
                        <>
                            <div className="success-icon"></div>
                            <h3>Đã tìm thấy xe!</h3>

                            <div className="location-map">
                                <h4>📍 Vị trí trên bản đồ:</h4>
                                <div className="mini-map">
                                    {slots.map(slot => (
                                        <div
                                            key={slot.slotId}
                                            className={`mini-slot ${slot.slotId === result.slotId ? 'highlight' :
                                                slot.status === 'occupied' ? 'occupied' : 'empty'
                                                }`}
                                            title={slot.slotId}
                                        >
                                            {slot.slotId === result.slotId && '★'}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="result-details">
                                <div className="detail-item">
                                    <span className="icon">📍</span>
                                    <div>
                                        <span className="label">Vị trí:</span>
                                        <span className="value">{result.slotId}</span>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <span className="icon"></span>
                                    <div>
                                        <span className="label">Giờ vào:</span>
                                        <span className="value">
                                            {new Date(result.checkInTime).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="directions">
                                <p className="direction-text">{result.message}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="error-icon"></div>
                            <h3>Không tìm thấy xe</h3>
                            <p className="not-found-message">{result.message}</p>
                            <p className="suggestion">Vui lòng kiểm tra lại biển số hoặc liên hệ bảo vệ</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default FindCarPanel;
