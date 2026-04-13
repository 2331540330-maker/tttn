import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="home-page">
            <div className="home-container">
                <div className="home-header">
                    <h1>Hệ thống Quản lý Bãi xe AI</h1>
                    <p className="subtitle">Nhận diện biển số tự động • Bản đồ 2D realtime</p>
                </div>

                <div className="option-cards">
                    <div className="option-card admin-card" onClick={() => navigate('/admin/login')}>
                        <div className="card-icon"></div>
                        <h2>Quản trị viên</h2>
                        <p>Đăng nhập để quản lý hệ thống</p>
                        <ul className="features">
                            <li>✓ Quản lý bãi xe</li>
                            <li>✓ Check-in/out</li>
                            <li>✓ Thống kê doanh thu</li>
                            <li>✓ Chấm công nhân viên</li>
                        </ul>
                        <button className="btn btn-primary">Đăng nhập Admin</button>
                    </div>

                    <div className="option-card customer-card" onClick={() => navigate('/customer')}>
                        <div className="card-icon"></div>
                        <h2>Khách hàng</h2>
                        <p>Vào ngay không cần đăng ký</p>
                        <ul className="features">
                            <li>✓ Check-out xe</li>
                            <li>✓ Tìm vị trí xe</li>
                            <li>✓ Thanh toán QR</li>
                        </ul>
                        <button className="btn btn-success">Vào ngay</button>
                    </div>
                </div>

                <div className="home-footer">
                    <p>Hệ thống bãi xe thông minh với AI nhận diện biển số</p>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
