import cron from 'node-cron';
import { checkOverstayVehicles, checkUnauthorizedVehicles, cleanupOldAlerts } from '../services/alertSystem.js';

/**
 * Initialize cron jobs for alert monitoring
 * @param {Object} io - Socket.IO instance for real-time alerts
 */
export function initializeAlertMonitor(io) {
    console.log('🕐 Initializing alert monitoring cron jobs...');

    // Run overstay check every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        console.log('🔍 Running overstay vehicle check...');
        const count = await checkOverstayVehicles(io);
        if (count > 0) {
            console.log(`✅ Found ${count} overstay vehicle(s)`);
        }
    });

    // Run unauthorized vehicle check every hour
    cron.schedule('0 * * * *', async () => {
        console.log('🔍 Running unauthorized vehicle check...');
        const count = await checkUnauthorizedVehicles(io);
        if (count > 0) {
            console.log(`✅ Found ${count} unauthorized vehicle(s)`);
        }
    });

    // Cleanup old alerts every day at 3 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('🧹 Running old alerts cleanup...');
        const count = await cleanupOldAlerts();
        console.log(`✅ Cleaned up ${count} old alert(s)`);
    });

    console.log('✅ Alert monitoring cron jobs initialized');
}
