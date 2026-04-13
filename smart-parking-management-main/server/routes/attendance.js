import express from 'express';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

const router = express.Router();

// Check-in
router.post('/checkin', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        // Get today's date (start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in today
        let attendance = await Attendance.findOne({
            userId,
            date: today
        });

        if (attendance && attendance.checkIn) {
            return res.status(400).json({
                success: false,
                error: 'Đã check-in rồi'
            });
        }

        const checkInTime = new Date();

        // Calculate late status (assume work starts at 8:00 AM)
        const workStartHour = 8;
        const workStartMinute = 0;
        const latethreshold = 15; // 15 minutes grace period

        const workStartTime = new Date(today);
        workStartTime.setHours(workStartHour, workStartMinute, 0, 0);

        const lateMilliseconds = checkInTime - workStartTime;
        const lateMinutes = Math.floor(lateMilliseconds / 60000);

        const status = lateMinutes > latethreshold ? 'late' : 'on-time';

        if (attendance) {
            // Update existing record
            attendance.checkIn = checkInTime;
            attendance.status = status;
            attendance.lateMinutes = Math.max(0, lateMinutes);
            await attendance.save();
        } else {
            // Create new record
            attendance = await Attendance.create({
                userId,
                date: today,
                checkIn: checkInTime,
                status,
                lateMinutes: Math.max(0, lateMinutes)
            });
        }

        res.json({
            success: true,
            checkIn: checkInTime,
            status,
            lateMinutes: Math.max(0, lateMinutes)
        });

    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Check-out
router.post('/checkout', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            userId,
            date: today
        });

        if (!attendance || !attendance.checkIn) {
            return res.status(400).json({
                success: false,
                error: 'Chưa check-in'
            });
        }

        if (attendance.checkOut) {
            return res.status(400).json({
                success: false,
                error: 'Đã check-out rồi'
            });
        }

        const checkOutTime = new Date();
        const workMilliseconds = checkOutTime - attendance.checkIn;
        const workHours = workMilliseconds / 3600000; // Convert to hours

        attendance.checkOut = checkOutTime;
        attendance.workHours = parseFloat(workHours.toFixed(2));
        await attendance.save();

        res.json({
            success: true,
            checkOut: checkOutTime,
            workHours: attendance.workHours
        });

    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get today's attendance
router.get('/today', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendances = await Attendance.find({ date: today })
            .populate('userId', 'fullName username avatarUrl role')
            .sort({ checkIn: -1 });

        res.json({ success: true, attendances });

    } catch (error) {
        console.error('Fetch attendance error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get attendance history
router.get('/history', async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.query;

        const query = {};

        if (userId) {
            query.userId = userId;
        }

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const attendances = await Attendance.find(query)
            .populate('userId', 'fullName username avatarUrl role')
            .sort({ date: -1 });

        res.json({ success: true, attendances });

    } catch (error) {
        console.error('Fetch history error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Manual attendance entry (for admin)
router.post('/manual', async (req, res) => {
    try {
        const { userId, checkInTime, checkOutTime } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find or create attendance record
        let attendance = await Attendance.findOne({
            userId,
            date: today
        });

        if (!attendance) {
            attendance = new Attendance({
                userId,
                date: today
            });
        }

        // Update check-in time
        if (checkInTime) {
            const checkIn = new Date(checkInTime);
            attendance.checkIn = checkIn;

            // Calculate late status
            const workStartHour = 8;
            const lateThreshold = 15;

            const workStartTime = new Date(today);
            workStartTime.setHours(workStartHour, 0, 0, 0);

            const lateMilliseconds = checkIn - workStartTime;
            const lateMinutes = Math.floor(lateMilliseconds / 60000);

            attendance.status = lateMinutes > lateThreshold ? 'late' : 'on-time';
            attendance.lateMinutes = Math.max(0, lateMinutes);
        }

        // Update check-out time and calculate work hours
        if (checkOutTime) {
            const checkOut = new Date(checkOutTime);
            attendance.checkOut = checkOut;

            if (attendance.checkIn) {
                const workMilliseconds = checkOut - attendance.checkIn;
                const workHours = workMilliseconds / 3600000;
                attendance.workHours = parseFloat(workHours.toFixed(2));
            }
        }

        await attendance.save();

        res.json({
            success: true,
            attendance
        });

    } catch (error) {
        console.error('Manual attendance error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

export default router;
