import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import './EmployeeAttendance.css';

function EmployeeAttendance() {
    const [user, setUser] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = authService.getUser();
        if (!currentUser) {
            navigate('/employee/login');
            return;
        }
        setUser(currentUser);
        fetchTodayAttendance(currentUser._id);
    }, [navigate]);

    const fetchTodayAttendance = async (userId) => {
        try {
            const response = await fetch('/api/attendance/today');
            const data = await response.json();

            if (data.success) {
                const myAttendance = data.attendances.find(att =>
                    att.userId && att.userId._id === userId
                );
                setAttendance(myAttendance || null);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            const response = await fetch('/api/attendance/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id })
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Check-in thành công!\nTrạng thái: ${data.status === 'on-time' ? 'Đúng giờ ✨' : `Trễ ${data.lateMinutes} phút ⚠️`}`);
                fetchTodayAttendance(user._id);
            } else {
                alert('❌ ' + data.error);
            }
        } catch (error) {
            alert('❌ Lỗi kết nối');
        }
    };

    const handleCheckOut = async () => {
        try {
            const response = await fetch('/api/attendance/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id })
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Check-out thành công!\nGiờ làm việc: ${data.workHours} giờ 🎉`);
                fetchTodayAttendance(user._id);
            } else {
                alert('❌ ' + data.error);
            }
        } catch (error) {
            alert('❌ Lỗi kết nối');
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/employee/login');
    };

    if (loading) {
        return <div className="loading-screen">Đang tải...</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="employee-attendance-page">
            <div className="attendance-container">
                <div className="attendance-card">
                    <div className="user-header">
                        <div className="user-avatar">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} />
                            ) : (
                                <div className="avatar-placeholder">👤</div>
                            )}
                        </div>
                        <div className="user-info">
                            <h2>{user.fullName}</h2>
                            <p>@{user.username}</p>
                            <span className="role-badge">
                                {user.role === 'admin' ? '👨‍💼 Admin' : '👤 Nhân viên'}
                            </span>
                        </div>
                        <button className="btn-logout" onClick={handleLogout}>
                            🚪 Đăng xuất
                        </button>
                    </div>

                    <div className="attendance-status">
                        <h3>📅 Chấm công hôm nay</h3>

                        {attendance && attendance.checkIn ? (
                            <div className="attendance-details">
                                <div className="time-display">
                                    <div className="time-item">
                                        <span className="time-label">Giờ vào</span>
                                        <span className="time-value">
                                            {new Date(attendance.checkIn).toLocaleTimeString('vi-VN')}
                                        </span>
                                        <span className={`status-badge status-${attendance.status}`}>
                                            {attendance.status === 'on-time' ? '✨ Đúng giờ' : `⚠️ Trễ ${attendance.lateMinutes}p`}
                                        </span>
                                    </div>

                                    {attendance.checkOut ? (
                                        <div className="time-item">
                                            <span className="time-label">Giờ ra</span>
                                            <span className="time-value">
                                                {new Date(attendance.checkOut).toLocaleTimeString('vi-VN')}
                                            </span>
                                            <span className="hours-badge">
                                                {attendance.workHours} giờ
                                            </span>
                                        </div>
                                    ) : (
                                        <button className="btn btn-danger btn-large" onClick={handleCheckOut}>
                                            🚪 Check-out
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="no-checkin">
                                <p>Bạn chưa check-in hôm nay</p>
                                <button className="btn btn-success btn-large" onClick={handleCheckIn}>
                                    ▶️ Check-in ngay
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmployeeAttendance;
