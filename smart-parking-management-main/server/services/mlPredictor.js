import { linearRegression, linearRegressionLine } from 'simple-statistics';
import History from '../models/History.js';

/**
 * Predict traffic for next 7 days using linear regression
 */
export async function predictTraffic(days = 7) {
    try {
        // Get historical data from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Aggregate daily traffic
        const historicalData = await History.aggregate([
            {
                $match: {
                    checkInTime: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        if (historicalData.length < 7) {
            // Not enough data, return average
            const avgCount = historicalData.reduce((sum, d) => sum + d.count, 0) / historicalData.length || 0;
            const predictions = [];
            const today = new Date();

            for (let i = 1; i <= days; i++) {
                const futureDate = new Date(today);
                futureDate.setDate(futureDate.getDate() + i);
                predictions.push({
                    date: futureDate.toISOString().split('T')[0],
                    predicted: Math.round(avgCount)
                });
            }

            return predictions;
        }

        // Prepare data for linear regression [x, y] where x is day index
        const dataPoints = historicalData.map((record, index) => [index, record.count]);

        // Calculate linear regression
        const regression = linearRegression(dataPoints);
        const regressionLine = linearRegressionLine(regression);

        // Generate predictions
        const predictions = [];
        const today = new Date();
        const startIndex = historicalData.length;

        for (let i = 1; i <= days; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + i);

            const predictedValue = regressionLine(startIndex + i - 1);
            predictions.push({
                date: futureDate.toISOString().split('T')[0],
                predicted: Math.max(0, Math.round(predictedValue)) // Ensure non-negative
            });
        }

        return predictions;
    } catch (error) {
        console.error('ML Prediction error:', error);
        return [];
    }
}

/**
 * Analyze peak hours with detailed breakdown
 */
export async function analyzePeakHours(startDate, endDate) {
    try {
        // Hourly breakdown
        const hourlyData = await History.aggregate([
            {
                $match: {
                    checkInTime: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $hour: '$checkInTime' },
                    count: { $sum: 1 },
                    avgFee: { $avg: '$fee' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Day of week breakdown
        const dayOfWeekData = await History.aggregate([
            {
                $match: {
                    checkInTime: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$checkInTime' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const formattedDayData = dayOfWeekData.map(d => ({
            day: dayNames[d._id - 1],
            count: d.count
        }));

        return {
            hourlyBreakdown: hourlyData,
            dayOfWeekBreakdown: formattedDayData,
            peakHour: hourlyData.reduce((max, curr) => curr.count > max.count ? curr : max, { _id: 0, count: 0 }),
            peakDay: formattedDayData.reduce((max, curr) => curr.count > max.count ? curr : max, { day: 'N/A', count: 0 })
        };
    } catch (error) {
        console.error('Peak hours analysis error:', error);
        return null;
    }
}
