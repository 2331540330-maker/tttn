import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/stats/dashboard');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="dashboard loading">Đang tải dữ liệu...</div>;
    }

    if (!stats) {
        return <div className="dashboard error">Không thể tải dữ liệu</div>;
    }

    const hourlyData = {
        labels: ['7h', '8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'],
        datasets: [{
            label: 'Lượt xe vào',
            data: stats.charts.hourlyTraffic.map(item => item.count),
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 2
        }]
    };

    const revenueData = {
        labels: stats.charts.dailyRevenue.map(item => {
            const date = new Date(item._id);
            return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
            label: 'Doanh thu (VNĐ)',
            data: stats.charts.dailyRevenue.map(item => item.revenue),
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#f1f5f9' }
            }
        },
        scales: {
            x: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(51, 65, 85, 0.3)' }
            },
            y: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(51, 65, 85, 0.3)' }
            }
        }
    };

    return (
        <div className="dashboard">
            <h2>Dashboard Thống kê</h2>

            <div className="stats-cards">
                <div className="stat-card card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <span className="stat-label">Tổng lượt xe hôm nay</span>
                        <span className="stat-value">{stats.summary.totalVehiclesToday}</span>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <span className="stat-label">Doanh thu hôm nay</span>
                        <span className="stat-value success">
                            {stats.summary.totalRevenue.toLocaleString('vi-VN')} đ
                        </span>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon"></div>
                    <div className="stat-info">
                        <span className="stat-label">Giờ cao điểm</span>
                        <span className="stat-value primary">{stats.summary.peakHour}</span>
                    </div>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-info">
                        <span className="stat-label">Tỷ lệ lấp đầy</span>
                        <span className="stat-value warning">{stats.summary.occupancyRate}%</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card card">
                    <h3>Lưu lượng xe theo giờ</h3>
                    <div className="chart-container">
                        <Bar data={hourlyData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card card">
                    <h3>💹 Doanh thu 7 ngày qua</h3>
                    <div className="chart-container">
                        <Line data={revenueData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
