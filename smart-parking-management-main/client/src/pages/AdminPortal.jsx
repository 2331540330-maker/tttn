import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { authService } from '../services/auth';
import CameraFeed from '../components/CameraFeed';
import ParkingMap from '../components/ParkingMap';
import Dashboard from '../components/Dashboard';
import CheckoutPanel from '../components/CheckoutPanel';
import FindCarPanel from '../components/FindCarPanel';
import AttendancePanel from '../components/AttendancePanel';
import AlertPanel from '../components/AlertPanel';
import ReportsPanel from '../components/ReportsPanel';
import SurveillanceCameraPanel from '../components/SurveillanceCameraPanel';
import './AdminPortal.css';

const socket = io('http://localhost:5000');

function AdminPortal() {
    const [activeTab, setActiveTab] = useState('parking');
    const [slots, setSlots] = useState([]);
    const [checkInData, setCheckInData] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = authService.getUser();
        setUser(currentUser);

        fetchSlots();

        socket.on('slot-update', (data) => {
            console.log('Slot update:', data);
            fetchSlots();
        });

        return () => {
            socket.off('slot-update');
        };
    }, []);

    const fetchSlots = async () => {
        try {
            const response = await fetch('/api/parking/slots');
            const data = await response.json();
            setSlots(data.slots);
        } catch (error) {
            console.error('Error fetching slots:', error);
        }
    };

    const handleCheckIn = (data) => {
        setCheckInData(data);
        fetchSlots();
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/admin/login');
    };

    return (
        <div className="admin-portal">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h2>Admin Panel</h2>
                    <p className="user-info">{user?.fullName}</p>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-btn ${activeTab === 'parking' ? 'active' : ''}`}
                        onClick={() => setActiveTab('parking')}
                    >
                        Bãi xe
                    </button>
                    <button
                        className={`sidebar-btn ${activeTab === 'checkout' ? 'active' : ''}`}
                        onClick={() => setActiveTab('checkout')}
                    >
                        Check-out
                    </button>
                    <button
                        className={`sidebar-btn ${activeTab === 'find' ? 'active' : ''}`}
                        onClick={() => setActiveTab('find')}
                    >
                        Tìm xe
                    </button>
                    <button
                        className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        Thống kê
                    </button>
                    <button
                        className={`sidebar-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('attendance')}
                    >
                        Chấm công
                    </button>
                    <button
                        className={`sidebar-btn ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        Báo cáo
                    </button>
                    <button
                        className={`sidebar-btn ${activeTab === 'alerts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('alerts')}
                    >
                        Cảnh báo
                    </button>
                    <button
                        className={`sidebar-btn ${activeTab === 'surveillance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('surveillance')}
                    >
                        📷 Camera C3
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="btn btn-danger" onClick={handleLogout}>
                        🚪 Đăng xuất
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1>Hệ thống Quản lý Bãi xe AI</h1>
                </header>

                <div className="admin-content">
                    {activeTab === 'parking' && (
                        <div className="parking-view">
                            <div className="left-panel">
                                <CameraFeed onCheckIn={handleCheckIn} />
                                {checkInData && (
                                    <div className="checkin-success card fade-in">
                                        <h3>Check-in thành công</h3>
                                        <p><strong>Biển số:</strong> {checkInData.licensePlate}</p>
                                        <p><strong>Vị trí:</strong> {checkInData.slotId}</p>
                                        <p><strong>Giờ vào:</strong> {new Date(checkInData.checkInTime).toLocaleTimeString('vi-VN')}</p>
                                    </div>
                                )}
                            </div>
                            <div className="right-panel">
                                <ParkingMap slots={slots} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'checkout' && <CheckoutPanel onComplete={fetchSlots} />}

                    {activeTab === 'find' && <FindCarPanel slots={slots} />}

                    {activeTab === 'dashboard' && <Dashboard />}

                    {activeTab === 'attendance' && <AttendancePanel />}

                    {activeTab === 'reports' && <ReportsPanel />}

                    {activeTab === 'alerts' && <AlertPanel socket={socket} />}

                    {activeTab === 'surveillance' && (
                        <div className="parking-view">
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <SurveillanceCameraPanel onSlotUpdate={fetchSlots} />
                            </div>
                            <div className="right-panel">
                                <ParkingMap slots={slots} surveillanceSlot="C3" />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminPortal;
