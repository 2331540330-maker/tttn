import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutPanel from '../components/CheckoutPanel';
import FindCarPanel from '../components/FindCarPanel';
import './CustomerPortal.css';

function CustomerPortal() {
    const [activeTab, setActiveTab] = useState('checkout');
    const [slots, setSlots] = useState([]);
    const navigate = useNavigate();

    // Fetch slots for FindCar
    useState(() => {
        fetch('/api/parking/slots')
            .then(res => res.json())
            .then(data => setSlots(data.slots))
            .catch(console.error);
    }, []);

    return (
        <div className="customer-portal">
            <header className="customer-header">
                <div className="header-content">
                    <h1>Khu vực Khách hàng</h1>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        ← Trang chủ
                    </button>
                </div>
            </header>

            <nav className="customer-nav">
                <button
                    className={`nav-btn ${activeTab === 'checkout' ? 'active' : ''}`}
                    onClick={() => setActiveTab('checkout')}
                >
                    Check-out
                </button>
                <button
                    className={`nav-btn ${activeTab === 'find' ? 'active' : ''}`}
                    onClick={() => setActiveTab('find')}
                >
                    Tìm xe
                </button>
            </nav>

            <main className="customer-main">
                {activeTab === 'checkout' && (
                    <div className="customer-section fade-in">
                        <h2>Check-out & Thanh toán</h2>
                        <p className="section-desc">Nhập biển số xe để xem phí và thanh toán</p>
                        <CheckoutPanel onComplete={() => { }} disableCamera={true} />
                    </div>
                )}

                {activeTab === 'find' && (
                    <div className="customer-section fade-in">
                        <h2>Tìm xe trong bãi</h2>
                        <p className="section-desc">Nhập biển số để tìm vị trí xe của bạn</p>
                        <FindCarPanel slots={slots} />
                    </div>
                )}
            </main>

            <footer className="customer-footer">
                <p>Hệ thống bãi xe thông minh - Không cần đăng ký</p>
            </footer>
        </div>
    );
}

export default CustomerPortal;
