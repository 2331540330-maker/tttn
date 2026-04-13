import express from 'express';
import { generateExcelReport, generatePDFReport, generateTaxReport } from '../services/reportGenerator.js';
import { predictTraffic, analyzePeakHours } from '../services/mlPredictor.js';
import History from '../models/History.js';

const router = express.Router();

// GET /api/reports/revenue/export - Export revenue report
router.get('/revenue/export', async (req, res) => {
    try {
        const { format = 'excel', range = 'today' } = req.query;

        // Calculate date range
        let startDate = new Date();
        let endDate = new Date();

        switch (range) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'custom':
                if (req.query.startDate) startDate = new Date(req.query.startDate);
                if (req.query.endDate) endDate = new Date(req.query.endDate);
                break;
        }

        if (format === 'excel') {
            const buffer = await generateExcelReport(startDate, endDate);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${range}.xlsx`);
            res.send(buffer);
        } else if (format === 'pdf') {
            // Use simple PDF for now
            const { generateSimplePDF } = await import('../services/simplePDF.js');
            const buffer = await generateSimplePDF(startDate, endDate);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${range}.pdf`);
            res.send(buffer);
        } else {
            res.status(400).json({ error: 'Invalid format. Use excel or pdf' });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// GET /api/reports/peak-hours - Analyze peak hours
router.get('/peak-hours', async (req, res) => {
    try {
        const { range = 'week' } = req.query;

        let startDate = new Date();
        const endDate = new Date();

        switch (range) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
        }

        const analysis = await analyzePeakHours(startDate, endDate);
        res.json(analysis);
    } catch (error) {
        console.error('Peak hours analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze peak hours' });
    }
});

// GET /api/reports/predictions - ML traffic predictions
router.get('/predictions', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const predictions = await predictTraffic(parseInt(days));

        res.json({
            predictions,
            generatedAt: new Date(),
            daysAhead: parseInt(days)
        });
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Failed to generate predictions' });
    }
});

// GET /api/reports/tax - Tax report
router.get('/tax', async (req, res) => {
    try {
        const { range = 'month' } = req.query;

        let startDate = new Date();
        const endDate = new Date();

        switch (range) {
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'quarter':
                startDate.setMonth(startDate.getMonth() - 3);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        const taxReport = await generateTaxReport(startDate, endDate);
        res.json(taxReport);
    } catch (error) {
        console.error('Tax report error:', error);
        res.status(500).json({ error: 'Failed to generate tax report' });
    }
});

// GET /api/reports/overview - Quick overview stats
router.get('/overview', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);

        const thisMonth = new Date(today);
        thisMonth.setMonth(thisMonth.getMonth() - 1);

        // Parallel queries
        const [todayData, weekData, monthData] = await Promise.all([
            History.aggregate([
                { $match: { checkInTime: { $gte: today }, paymentStatus: 'paid' } },
                { $group: { _id: null, revenue: { $sum: '$fee' }, count: { $sum: 1 } } }
            ]),
            History.aggregate([
                { $match: { checkInTime: { $gte: thisWeek }, paymentStatus: 'paid' } },
                { $group: { _id: null, revenue: { $sum: '$fee' }, count: { $sum: 1 } } }
            ]),
            History.aggregate([
                { $match: { checkInTime: { $gte: thisMonth }, paymentStatus: 'paid' } },
                { $group: { _id: null, revenue: { $sum: '$fee' }, count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            today: todayData[0] || { revenue: 0, count: 0 },
            thisWeek: weekData[0] || { revenue: 0, count: 0 },
            thisMonth: monthData[0] || { revenue: 0, count: 0 }
        });
    } catch (error) {
        console.error('Overview error:', error);
        res.status(500).json({ error: 'Failed to get overview' });
    }
});

export default router;
