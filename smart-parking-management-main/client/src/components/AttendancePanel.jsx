import { useState, useEffect } from 'react';
import './AttendancePanel.css';

function AttendancePanel() {
    const [employees, setEmployees] = useState([]);
    const [attendances, setAttendances] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        password: '',
        role: 'employee',
        avatarUrl: ''
    });

    useEffect(() => {
        fetchEmployees();
        fetchTodayAttendance();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            setEmployees(data.users || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTodayAttendance = async () => {
        try {
            const response = await fetch('/api/attendance/today');
            const data = await response.json();

            if (data.success) {
                const attendanceMap = {};
                data.attendances.forEach(att => {
                    if (att.userId) {
                        attendanceMap[att.userId._id] = att;
                    }
                });
                setAttendances(attendanceMap);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const handleCheckIn = async (userId) => {
        try {
            const response = await fetch('/api/attendance/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Check-in thành công!\nTrạng thái: ${data.status === 'on-time' ? 'Đúng giờ' : `Trễ ${data.lateMinutes} phút`}`);
                fetchTodayAttendance();
            } else {
                alert('❌ ' + data.error);
            }
        } catch (error) {
            alert('❌ Lỗi kết nối');
        }
    };

    const handleCheckOut = async (userId) => {
        try {
            const response = await fetch('/api/attendance/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Check-out thành công!\nGiờ làm: ${data.workHours} giờ`);
                fetchTodayAttendance();
            } else {
                alert('❌ ' + data.error);
            }
        } catch (error) {
            alert('❌ Lỗi kết nối');
        }
    };

    const openAddModal = () => {
        setEditingEmployee(null);
        setFormData({
            fullName: '',
            username: '',
            password: '',
            role: 'employee',
            avatarUrl: '',
            checkInTime: '',
            checkOutTime: ''
        });
        setShowModal(true);
    };

    const openEditModal = (employee) => {
        setEditingEmployee(employee);
        const attendance = getAttendanceStatus(employee._id);

        // Format times for datetime-local input
        const formatDateTime = (date) => {
            if (!date) return '';
            const d = new Date(date);
            return d.toISOString().slice(0, 16);
        };

        setFormData({
            fullName: employee.fullName,
            username: employee.username,
            password: '',
            role: employee.role || 'employee',
            avatarUrl: employee.avatarUrl || '',
            checkInTime: attendance?.checkIn ? formatDateTime(attendance.checkIn) : '',
            checkOutTime: attendance?.checkOut ? formatDateTime(attendance.checkOut) : ''
        });
        setShowModal(true);
    };

    const handleSaveEmployee = async () => {
        try {
            // Save employee info
            const url = editingEmployee
                ? `/api/users/${editingEmployee._id}`
                : '/api/users';

            const method = editingEmployee ? 'PUT' : 'POST';

            const employeeData = {
                fullName: formData.fullName,
                username: formData.username,
                password: editingEmployee ? undefined : formData.password,
                role: formData.role,
                avatarUrl: formData.avatarUrl
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeData)
            });

            const data = await response.json();

            if (data.success || data.user) {
                // If editing and has check-in/out times, update attendance
                if (editingEmployee && (formData.checkInTime || formData.checkOutTime)) {
                    await saveAttendance(editingEmployee._id, formData.checkInTime, formData.checkOutTime);
                }

                alert(`✅ ${editingEmployee ? 'Cập nhật' : 'Thêm'} nhân viên thành công!`);
                setShowModal(false);
                fetchEmployees();
                fetchTodayAttendance();
            } else {
                alert('❌ ' + (data.error || 'Lỗi không xác định'));
            }
        } catch (error) {
            alert('❌ Lỗi kết nối');
        }
    };

    const saveAttendance = async (userId, checkInTime, checkOutTime) => {
        try {
            const response = await fetch('/api/attendance/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    checkInTime: checkInTime ? new Date(checkInTime).toISOString() : null,
                    checkOutTime: checkOutTime ? new Date(checkOutTime).toISOString() : null
                })
            });

            const data = await response.json();
            if (!data.success) {
                console.error('Failed to save attendance:', data.error);
            }
        } catch (error) {
            console.error('Error saving attendance:', error);
        }
    };

    const handleDeleteEmployee = async (id, name) => {
        if (!confirm(`Bạn có chắc muốn xóa nhân viên "${name}"?`)) return;

        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Xóa nhân viên thành công!');
                fetchEmployees();
            } else {
                alert('❌ ' + (data.error || 'Lỗi không xác định'));
            }
        } catch (error) {
            alert('❌ Lỗi kết nối');
        }
    };

    const getAttendanceStatus = (userId) => {
        return attendances[userId] || null;
    };

    const renderStatusBadge = (status) => {
        const badges = {
            'on-time': { text: 'Đúng giờ', class: 'status-ontime' },
            'late': { text: 'Trễ', class: 'status-late' },
            'absent': { text: 'Vắng', class: 'status-absent' }
        };

        const badge = badges[status] || badges['absent'];
        return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
    };

    return (
        <div className="attendance-panel">
            <div className="attendance-header">
                <div>
                    <h2>Chấm công nhân viên</h2>
                    <p>Quản lý check-in/check-out và theo dõi giờ làm việc</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    ➕ Thêm nhân viên
                </button>
            </div>

            <div className="attendance-content">
                {loading ? (
                    <div className="loading">Đang tải...</div>
                ) : (
                    <div className="employee-list">
                        {employees.length === 0 ? (
                            <div className="empty-state">
                                <p>Chưa có nhân viên nào</p>
                                <button className="btn btn-primary" onClick={openAddModal}>
                                    Thêm nhân viên đầu tiên
                                </button>
                            </div>
                        ) : (
                            employees.map(employee => {
                                const attendance = getAttendanceStatus(employee._id);

                                return (
                                    <div key={employee._id} className="employee-card card">
                                        <div className="card-actions">
                                            <button className="action-btn edit-btn" onClick={() => openEditModal(employee)} title="Sửa">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            <button className="action-btn delete-btn" onClick={() => handleDeleteEmployee(employee._id, employee.fullName)} title="Xóa">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="employee-info">
                                            <div className="employee-avatar">
                                                {employee.avatarUrl ? (
                                                    <img src={employee.avatarUrl} alt={employee.fullName} />
                                                ) : (
                                                    <div className="avatar-placeholder">👤</div>
                                                )}
                                            </div>
                                            <div className="employee-details">
                                                <h3>{employee.fullName}</h3>
                                                <p>@{employee.username}</p>
                                                <span className={`role-badge role-${employee.role || 'employee'}`}>
                                                    {employee.role === 'admin' ? '👨‍💼 Admin' : '👤 Nhân viên'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="attendance-info">
                                            {attendance && attendance.checkIn ? (
                                                <>
                                                    <div className="time-row">
                                                        <span className="time-label">Giờ vào:</span>
                                                        <span className="time-value">
                                                            {new Date(attendance.checkIn).toLocaleTimeString('vi-VN')}
                                                        </span>
                                                        {renderStatusBadge(attendance.status)}
                                                    </div>
                                                    {attendance.checkOut ? (
                                                        <div className="time-row">
                                                            <span className="time-label">Giờ ra:</span>
                                                            <span className="time-value">
                                                                {new Date(attendance.checkOut).toLocaleTimeString('vi-VN')}
                                                            </span>
                                                            <span className="hours-badge">
                                                                {attendance.workHours}h
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <button className="btn btn-danger btn-block" onClick={() => handleCheckOut(employee._id)}>
                                                            🚪 Check-out
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <button className="btn btn-success btn-block" onClick={() => handleCheckIn(employee._id)}>
                                                    ▶️ Check-in
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Modal thêm/sửa nhân viên */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingEmployee ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}</h3>

                        <div className="form-group">
                            <label>Họ tên:</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Nguyễn Văn A"
                            />
                        </div>

                        <div className="form-group">
                            <label>Username:</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="nguyenvana"
                            />
                        </div>

                        {!editingEmployee && (
                            <div className="form-group">
                                <label>Mật khẩu:</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Vai trò:</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="employee">Nhân viên</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Avatar URL:</label>
                            <input
                                type="text"
                                value={formData.avatarUrl}
                                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        {editingEmployee && (
                            <>
                                <div className="form-divider"></div>
                                <h4 className="form-section-title">⏰ Chấm công thủ công</h4>

                                <div className="form-group">
                                    <label>Giờ vào:</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.checkInTime}
                                        onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Giờ ra:</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.checkOutTime}
                                        onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Hủy
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveEmployee}>
                                {editingEmployee ? 'Cập nhật' : 'Thêm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AttendancePanel;
