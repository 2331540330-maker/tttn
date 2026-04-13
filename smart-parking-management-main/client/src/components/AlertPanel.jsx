import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AlertPanel.css';

const API_URL = 'http://localhost:5000/api';

const AlertPanel = ({ socket }) => {
    const [alerts, setAlerts] = useState([]);
    const [filter, setFilter] = useState('active');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();

        // Listen for real-time alerts
        if (socket) {
            socket.on('new_alert', (alert) => {
                setAlerts(prev => [alert, ...prev]);
                showNotification(alert);
            });

            socket.on('alert_updated', ({ id, status }) => {
                setAlerts(prev => prev.map(a =>
                    a.id === id ? { ...a, status } : a
                ));
            });
        }

        return () => {
            if (socket) {
                socket.off('new_alert');
                socket.off('alert_updated');
            }
        };
    }, [socket, filter]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const endpoint = filter === 'active' ? '/alerts/active' : '/alerts';
            const response = await axios.get(`${API_URL}${endpoint}`);
            setAlerts(response.data.alerts || response.data);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (alert) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 Cảnh báo An ninh', {
                body: alert.message || alert.description,
                icon: '/icons/icon-192x192.png'
            });
        }
    };

    const handleResolve = async (alertId) => {
        try {
            await axios.put(`${API_URL}/alerts/${alertId}/resolve`, {
                userId: localStorage.getItem('userId')
            });
            fetchAlerts();
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    };

    const handleAcknowledge = async (alertId) => {
        try {
            await axios.put(`${API_URL}/alerts/${alertId}/acknowledge`);
            fetchAlerts();
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        }
    };

    const getSeverityColor = (severity) => {
        const colors = {
            low: '#4caf50',
            medium: '#ff9800',
            high: '#ff5722',
            critical: '#f44336'
        };
        return colors[severity] || '#888';
    };

    const getSeverityIcon = (severity) => {
        const icons = {
            low: '🟢',
            medium: '🟡',
            high: '🟠',
            critical: '🔴'
        };
        return icons[severity] || '⚪';
    };

    return (
        <div className="alert-panel">
            <div className="alert-header">
                <h2>🚨 Cảnh báo An ninh</h2>
                <div className="alert-filters">
                    <button
                        className={filter === 'active' ? 'active' : ''}
                        onClick={() => setFilter('active')}
                    >
                        Đang hoạt động
                    </button>
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        Tất cả
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Đang tải...</div>
            ) : alerts.length === 0 ? (
                <div className="no-alerts">✅ Không có cảnh báo</div>
            ) : (
                <div className="alerts-list">
                    {alerts.map((alert) => (
                        <div
                            key={alert._id || alert.id}
                            className={`alert-item severity-${alert.severity} status-${alert.status}`}
                        >
                            <div className="alert-icon">
                                {getSeverityIcon(alert.severity)}
                            </div>
                            <div className="alert-content">
                                <div className="alert-type">
                                    {alert.alertType?.toUpperCase().replace('_', ' ')}
                                </div>
                                <div className="alert-description">
                                    {alert.description || alert.message}
                                </div>
                                <div className="alert-meta">
                                    {alert.vehiclePlate && (
                                        <span className="meta-item">🚗 {alert.vehiclePlate}</span>
                                    )}
                                    {alert.slotNumber && (
                                        <span className="meta-item">📍 {alert.slotNumber}</span>
                                    )}
                                    <span className="meta-item">
                                        🕐 {new Date(alert.createdAt || alert.timestamp).toLocaleString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                            <div className="alert-actions">
                                {alert.status === 'pending' && (
                                    <>
                                        <button
                                            className="btn-acknowledge"
                                            onClick={() => handleAcknowledge(alert._id || alert.id)}
                                        >
                                            Xác nhận
                                        </button>
                                        <button
                                            className="btn-resolve"
                                            onClick={() => handleResolve(alert._id || alert.id)}
                                        >
                                            Giải quyết
                                        </button>
                                    </>
                                )}
                                {alert.status === 'acknowledged' && (
                                    <button
                                        className="btn-resolve"
                                        onClick={() => handleResolve(alert._id || alert.id)}
                                    >
                                        Giải quyết
                                    </button>
                                )}
                                {alert.status === 'resolved' && (
                                    <span className="status-badge">✅ Đã giải quyết</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlertPanel;
