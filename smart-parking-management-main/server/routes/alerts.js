import express from 'express';
import SecurityAlert from '../models/SecurityAlert.js';
import { createSecurityIncident } from '../services/alertSystem.js';

const router = express.Router();

// GET /api/alerts - Get all alerts with filtering
router.get('/', async (req, res) => {
    try {
        const { status, severity, type, limit = 50 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (severity) query.severity = severity;
        if (type) query.alertType = type;

        const alerts = await SecurityAlert.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('resolvedBy', 'username email');

        const stats = await SecurityAlert.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            alerts,
            stats: {
                total: alerts.length,
                byStatus: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
            }
        });
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// GET /api/alerts/active - Get only active (pending/acknowledged) alerts
router.get('/active', async (req, res) => {
    try {
        const alerts = await SecurityAlert.find({
            status: { $in: ['pending', 'acknowledged'] }
        })
            .sort({ severity: -1, createdAt: -1 })
            .limit(20);

        res.json(alerts);
    } catch (error) {
        console.error('Get active alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch active alerts' });
    }
});

// POST /api/alerts - Create manual alert
router.post('/', async (req, res) => {
    try {
        const io = req.app.get('io');
        const alert = await createSecurityIncident(req.body, io);

        res.status(201).json({
            success: true,
            alert
        });
    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
});

// PUT /api/alerts/:id/acknowledge - Acknowledge alert
router.put('/:id/acknowledge', async (req, res) => {
    try {
        const alert = await SecurityAlert.findByIdAndUpdate(
            req.params.id,
            { status: 'acknowledged' },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        // Emit update via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('alert_updated', {
                id: alert._id,
                status: alert.status
            });
        }

        res.json({ success: true, alert });
    } catch (error) {
        console.error('Acknowledge alert error:', error);
        res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
});

// PUT /api/alerts/:id/resolve - Resolve alert
router.put('/:id/resolve', async (req, res) => {
    try {
        const { userId } = req.body; // In production, get from auth token

        const alert = await SecurityAlert.findByIdAndUpdate(
            req.params.id,
            {
                status: 'resolved',
                resolvedBy: userId || null,
                resolvedAt: new Date()
            },
            { new: true }
        ).populate('resolvedBy', 'username email');

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        // Emit update via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('alert_updated', {
                id: alert._id,
                status: alert.status
            });
        }

        res.json({ success: true, alert });
    } catch (error) {
        console.error('Resolve alert error:', error);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
});

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', async (req, res) => {
    try {
        const alert = await SecurityAlert.findByIdAndDelete(req.params.id);

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.json({ success: true, message: 'Alert deleted' });
    } catch (error) {
        console.error('Delete alert error:', error);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
});

// GET /api/alerts/stats - Get alert statistics
router.get('/statistics', async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const stats = await SecurityAlert.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        type: '$alertType',
                        severity: '$severity'
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const dailyStats = await SecurityAlert.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            byTypeAndSeverity: stats,
            byDay: dailyStats,
            period: {
                startDate,
                endDate: new Date(),
                days: parseInt(days)
            }
        });
    } catch (error) {
        console.error('Alert stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

export default router;
