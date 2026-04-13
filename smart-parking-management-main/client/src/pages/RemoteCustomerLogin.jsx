import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { remoteAuthService } from '../services/remoteAuth';
import './RemoteCustomerLogin.css';

function RemoteCustomerLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await remoteAuthService.login(email, password);

        if (result.success) {
            navigate('/remote-customer/portal');
        } else {
            setError(result.error || 'Đăng nhập thất bại');
        }

        setLoading(false);
    };

    return (
        <div className="rc-login-page">
            <div className="rc-login-bg" />
            <div className="rc-login-card">
                <div className="rc-login-logo">
                    🚗
                    <div className="rc-login-logo-ring" />
                </div>
                <div className="rc-login-header">
                    <h1>Cổng Khách Hàng Từ Xa</h1>
                    <p>Hệ thống Quản lý Bãi xe Thông minh</p>
                    <span className="rc-badge">🌐 Truy cập công cộng</span>
                </div>

                <form onSubmit={handleSubmit} className="rc-login-form">
                    <div className="rc-form-group">
                        <label>📧 Địa chỉ Gmail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@gmail.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="rc-form-group">
                        <label>🔒 Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="rc-error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="rc-login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="rc-spinner">Đang xác thực...</span>
                        ) : (
                            '🔓 Đăng nhập'
                        )}
                    </button>
                </form>

                <div className="rc-login-footer">
                    <p>Chưa có tài khoản?</p>
                    <Link to="/remote-customer/register" className="rc-register-link">
                        ✨ Đăng ký ngay
                    </Link>
                </div>

                <div className="rc-security-note">
                    🛡️ Kết nối bảo mật — Dữ liệu được mã hóa
                </div>
            </div>
        </div>
    );
}

export default RemoteCustomerLogin;
