import express from 'express';
import History from '../models/History.js';
import ParkingSlot from '../models/ParkingSlot.js';

const router = express.Router();

// GET /api/stats/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Total vehicles today
        const totalToday = await History.countDocuments({
            checkInTime: { $gte: today }
        });

        // Total revenue today
        const revenueData = await History.aggregate([
            { $match: { checkInTime: { $gte: today }, paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$fee' } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        // Occupancy rate
        const totalSlots = await ParkingSlot.countDocuments();
        const occupiedSlots = await ParkingSlot.countDocuments({ status: 'occupied' });
        const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots * 100).toFixed(1) : 0;

        // Peak hour (hourly traffic)
        const hourlyTraffic = await History.aggregate([
            { $match: { checkInTime: { $gte: today } } },
            {
                $group: {
                    _id: { $hour: '$checkInTime' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const peakHour = hourlyTraffic.length > 0 ? `${hourlyTraffic[0]._id}:00` : 'N/A';

        // Hourly traffic for chart
        const hourlyData = await History.aggregate([
            { $match: { checkInTime: { $gte: today } } },
            {
                $group: {
                    _id: { $hour: '$checkInTime' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Daily revenue for last 7 days
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyRevenue = await History.aggregate([
            { $match: { checkInTime: { $gte: sevenDaysAgo }, paymentStatus: 'paid' } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' } },
                    revenue: { $sum: '$fee' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            summary: {
                totalVehiclesToday: totalToday,
                totalRevenue,
                occupancyRate: parseFloat(occupancyRate),
                peakHour,
                currentOccupied: occupiedSlots
            },
            charts: {
                hourlyTraffic: hourlyData,
                dailyRevenue
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
