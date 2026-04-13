import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { remoteAuthService } from '../services/remoteAuth';
import CheckoutPanel from '../components/CheckoutPanel';
import FindCarPanel from '../components/FindCarPanel';
import './RemoteCustomerPortal.css';

function RemoteCustomerPortal() {
    const [activeTab, setActiveTab] = useState('checkout');
    const [slots, setSlots] = useState([]);
    const [customer, setCustomer] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const info = remoteAuthService.getCustomer();
        setCustomer(info);

        fetch('/api/parking/slots')
            .then(res => res.json())
            .then(data => setSlots(data.slots || []))
            .catch(console.error);
    }, []);

    const handleLogout = () => {
        remoteAuthService.logout();
        navigate('/remote-customer/login');
    };

    return (
        <div className="rc-portal">
            <header className="rc-portal-header">
                <div className="rc-header-left">
                    <span className="rc-header-icon">🚗</span>
                    <div>
                        <h1>Cổng Khách Hàng Từ Xa</h1>
                        <p className="rc-header-sub">Bãi xe Thông minh — Truy cập từ xa</p>
                    </div>
                </div>
                <div className="rc-header-right">
                    {customer && (
                        <div className="rc-user-info">
                            <div className="rc-avatar">
                                {customer.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="rc-user-details">
                                <span className="rc-user-name">{customer.fullName}</span>
                                <span className="rc-user-email">{customer.email}</span>
                            </div>
                        </div>
                    )}
                    <button className="rc-logout-btn" onClick={handleLogout}>
                        🚪 Đăng xuất
                    </button>
                </div>
            </header>

            <nav className="rc-portal-nav">
                <button
                    className={`rc-nav-btn ${activeTab === 'checkout' ? 'active' : ''}`}
                    onClick={() => setActiveTab('checkout')}
                >
                    💳 Check-out & Thanh toán
                </button>
                <button
                    className={`rc-nav-btn ${activeTab === 'find' ? 'active' : ''}`}
                    onClick={() => setActiveTab('find')}
                >
                    🔍 Tìm xe
                </button>
            </nav>

            <main className="rc-portal-main">
                {activeTab === 'checkout' && (
                    <div className="rc-section fade-in">
                        <div className="rc-section-header">
                            <h2>💳 Check-out & Thanh toán</h2>
                            <p>Nhập biển số xe để xem phí và thực hiện thanh toán</p>
                        </div>
                        <CheckoutPanel onComplete={() => { }} disableCamera={true} />
                    </div>
                )}

                {activeTab === 'find' && (
                    <div className="rc-section fade-in">
                        <div className="rc-section-header">
                            <h2>🔍 Tìm xe trong bãi</h2>
                            <p>Nhập biển số để tìm vị trí xe của bạn</p>
                        </div>
                        <FindCarPanel slots={slots} />
                    </div>
                )}
            </main>

            <footer className="rc-portal-footer">
                <span>🛡️ Phiên đăng nhập bảo mật — Token hết hạn sau 8 giờ</span>
                <span>🌐 Hệ thống Bãi xe Thông minh v2.0</span>
            </footer>
        </div>
    );
}

export default RemoteCustomerPortal;
