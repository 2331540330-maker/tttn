import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { remoteAuthService } from '../services/remoteAuth';
import './RemoteCustomerRegister.css';

function RemoteCustomerRegister() {
    const [form, setForm] = useState({
        email: '',
        fullName: '',
        dateOfBirth: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.password !== form.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (form.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);

        const result = await remoteAuthService.register({
            email: form.email,
            fullName: form.fullName,
            dateOfBirth: form.dateOfBirth,
            phone: form.phone,
            password: form.password
        });

        setLoading(false);

        if (result.success) {
            setSuccess('Đăng ký thành công! Chuyển đến trang đăng nhập...');
            setTimeout(() => navigate('/remote-customer/login'), 2000);
        } else {
            setError(result.error || 'Đăng ký thất bại');
        }
    };

    return (
        <div className="rc-register-page">
            <div className="rc-register-bg" />
            <div className="rc-register-card">
                <div className="rc-register-header">
                    <div className="rc-register-icon">📋</div>
                    <h1>Đăng ký Tài khoản</h1>
                    <p>Cổng khách hàng từ xa — Nhập đầy đủ thông tin để bảo mật</p>
                </div>

                <form onSubmit={handleSubmit} className="rc-register-form">
                    <div className="rc-form-row">
                        <div className="rc-form-group">
                            <label>📧 Địa chỉ Gmail <span className="required">*</span></label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="example@gmail.com"
                                required
                            />
                        </div>
                        <div className="rc-form-group">
                            <label>👤 Họ và tên đầy đủ <span className="required">*</span></label>
                            <input
                                type="text"
                                name="fullName"
                                value={form.fullName}
                                onChange={handleChange}
                                placeholder="Nguyễn Văn A"
                                required
                            />
                        </div>
                    </div>

                    <div className="rc-form-row">
                        <div className="rc-form-group">
                            <label>🎂 Ngày / Tháng / Năm sinh <span className="required">*</span></label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={form.dateOfBirth}
                                onChange={handleChange}
                                required
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="rc-form-group">
                            <label>📱 Số điện thoại</label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="0901234567 (không bắt buộc)"
                            />
                        </div>
                    </div>

                    <div className="rc-form-row">
                        <div className="rc-form-group">
                            <label>🔒 Mật khẩu <span className="required">*</span></label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Ít nhất 6 ký tự"
                                required
                            />
                        </div>
                        <div className="rc-form-group">
                            <label>🔒 Xác nhận mật khẩu <span className="required">*</span></label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Nhập lại mật khẩu"
                                required
                            />
                        </div>
                    </div>

                    {error && <div className="rc-error-message">⚠️ {error}</div>}
                    {success && <div className="rc-success-message">✅ {success}</div>}

                    <button
                        type="submit"
                        className="rc-register-btn"
                        disabled={loading}
                    >
                        {loading ? '⏳ Đang xử lý...' : '✨ Tạo tài khoản'}
                    </button>
                </form>

                <div className="rc-register-footer">
                    <p>Đã có tài khoản?</p>
                    <Link to="/remote-customer/login" className="rc-login-link">
                        🔓 Đăng nhập ngay
                    </Link>
                </div>

                <div className="rc-security-note">
                    🛡️ Thông tin của bạn được mã hóa và bảo mật tuyệt đối
                </div>
            </div>
        </div>
    );
}

export default RemoteCustomerRegister;
