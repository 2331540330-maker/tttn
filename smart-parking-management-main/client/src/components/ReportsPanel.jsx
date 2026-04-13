import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { Line, Bar } from 'react-chartjs-2';
import './ReportsPanel.css';

const API_URL = 'http://localhost:5000/api';

const ReportsPanel = () => {
    const [loading, setLoading] = useState(false);
    const [overview, setOverview] = useState(null);
    const [peakHours, setPeakHours] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [taxReport, setTaxReport] = useState(null);

    useEffect(() => {
        fetchOverview();
        fetchPeakHours();
        fetchPredictions();
    }, []);

    const fetchOverview = async () => {
        try {
            const response = await axios.get(`${API_URL}/reports/overview`);
            setOverview(response.data);
        } catch (error) {
            console.error('Error fetching overview:', error);
        }
    };

    const fetchPeakHours = async () => {
        try {
            const response = await axios.get(`${API_URL}/reports/peak-hours?range=week`);
            setPeakHours(response.data);
        } catch (error) {
            console.error('Error fetching peak hours:', error);
        }
    };

    const fetchPredictions = async () => {
        try {
            const response = await axios.get(`${API_URL}/reports/predictions?days=7`);
            setPredictions(response.data);
        } catch (error) {
            console.error('Error fetching predictions:', error);
        }
    };

    const fetchTaxReport = async () => {
        try {
            const response = await axios.get(`${API_URL}/reports/tax?range=month`);
            setTaxReport(response.data);
        } catch (error) {
            console.error('Error fetching tax report:', error);
        }
    };

    const handleExport = async (format) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_URL}/reports/revenue/export?format=${format}&range=month`,
                { responseType: 'blob' }
            );

            const filename = `revenue_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            saveAs(new Blob([response.data]), filename);
            alert(`✅ Đã tải xuống ${filename}`);
        } catch (error) {
            console.error('Export error:', error);
            alert('❌ Lỗi khi xuất báo cáo');
        } finally {
            setLoading(false);
        }
    };

    const peakHoursChartData = peakHours ? {
        labels: peakHours.hourlyBreakdown.map(h => `${h._id}:00`),
        datasets: [{
            label: 'Lượng xe theo giờ',
            data: peakHours.hourlyBreakdown.map(h => h.count),
            backgroundColor: 'rgba(102, 126, 234, 0.6)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 2
        }]
    } : null;

    const predictionsChartData = predictions ? {
        labels: predictions.predictions.map(p => new Date(p.date).toLocaleDateString('vi-VN')),
        datasets: [{
            label: 'Dự đoán lượng xe',
            data: predictions.predictions.map(p => p.predicted),
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    } : null;

    return (
        <div className="reports-panel">
            <div className="reports-header">
                <h2>📊 Báo cáo Nâng cao</h2>
                <div className="export-buttons">
                    <button
                        onClick={() => handleExport('excel')}
                        disabled={loading}
                        className="btn-export excel"
                    >
                        📗 Xuất Excel
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={loading}
                        className="btn-export pdf"
                    >
                        📕 Xuất PDF
                    </button>
                    <button
                        onClick={fetchTaxReport}
                        className="btn-export tax"
                    >
                        🧾 Báo cáo Thuế
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            {overview && (
                <div className="overview-cards">
                    <div className="card">
                        <div className="card-icon">📅</div>
                        <div className="card-content">
                            <div className="card-label">Hôm nay</div>
                            <div className="card-value">{overview.today.count || 0} xe</div>
                            <div className="card-revenue">
                                {(overview.today.revenue || 0).toLocaleString('vi-VN')} VNĐ
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-icon">📆</div>
                        <div className="card-content">
                            <div className="card-label">Tuần này</div>
                            <div className="card-value">{overview.thisWeek.count || 0} xe</div>
                            <div className="card-revenue">
                                {(overview.thisWeek.revenue || 0).toLocaleString('vi-VN')} VNĐ
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-icon">📊</div>
                        <div className="card-content">
                            <div className="card-label">Tháng này</div>
                            <div className="card-value">{overview.thisMonth.count || 0} xe</div>
                            <div className="card-revenue">
                                {(overview.thisMonth.revenue || 0).toLocaleString('vi-VN')} VNĐ
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="charts-section">
                {peakHoursChartData && (
                    <div className="chart-container">
                        <h3>⏰ Phân tích Giờ Cao điểm</h3>
                        <Bar
                            data={peakHoursChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { display: false }
                                },
                                scales: {
                                    y: { beginAtZero: true }
                                }
                            }}
                        />
                        {peakHours && (
                            <div className="peak-info">
                                <span>🔥 Giờ cao điểm: {peakHours.peakHour._id}:00</span>
                                <span>📈 Ngày cao điểm: {peakHours.peakDay.day}</span>
                            </div>
                        )}
                    </div>
                )}

                {predictionsChartData && (
                    <div className="chart-container">
                        <h3>🔮 Dự đoán Lượng xe (7 ngày tới)</h3>
                        <Line
                            data={predictionsChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { display: false }
                                },
                                scales: {
                                    y: { beginAtZero: true }
                                }
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Tax Report */}
            {taxReport && (
                <div className="tax-report">
                    <h3>🧾 Báo cáo Thuế</h3>
                    <div className="tax-details">
                        <div className="tax-row">
                            <span>Tổng giao dịch:</span>
                            <strong>{taxReport.summary.totalTransactions}</strong>
                        </div>
                        <div className="tax-row">
                            <span>Tổng doanh thu:</span>
                            <strong>{taxReport.summary.totalRevenue.toLocaleString('vi-VN')} VNĐ</strong>
                        </div>
                        <div className="tax-row">
                            <span>Doanh thu trước thuế:</span>
                            <strong>{taxReport.summary.revenueBeforeVAT.toLocaleString('vi-VN')} VNĐ</strong>
                        </div>
                        <div className="tax-row highlight">
                            <span>VAT ({taxReport.summary.vatRate}):</span>
                            <strong>{taxReport.summary.vatAmount.toLocaleString('vi-VN')} VNĐ</strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPanel;
