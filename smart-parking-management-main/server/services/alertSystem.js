import SecurityAlert from '../models/SecurityAlert.js';
import ParkingSlot from '../models/ParkingSlot.js';
import History from '../models/History.js';
import nodemailer from 'nodemailer';

// Email transporter (configure with your SMTP settings)
let emailTransporter = null;
try {
    emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} catch (error) {
    console.warn('⚠️ Email not configured. Alert emails will be skipped.');
}

/**
 * Check for vehicles overstaying (>24 hours)
 */
export async function checkOverstayVehicles(io) {
    try {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        // Find vehicles that checked in more than 24 hours ago and haven't checked out
        const overstayVehicles = await History.find({
            checkInTime: { $lte: twentyFourHoursAgo },
            checkOutTime: null,
            alertGenerated: { $ne: true }
        });

        for (const vehicle of overstayVehicles) {
            // Create alert
            const alert = await SecurityAlert.create({
                alertType: 'overstay',
                severity: 'medium',
                vehiclePlate: vehicle.licensePlate,
                slotNumber: vehicle.slotUsed,
                description: `Xe ${vehicle.licensePlate} đã ở bãi quá 24 giờ (vào lúc ${new Date(vehicle.checkInTime).toLocaleString('vi-VN')})`,
                metadata: {
                    checkInTime: vehicle.checkInTime,
                    elapsedHours: Math.floor((Date.now() - new Date(vehicle.checkInTime).getTime()) / (1000 * 60 * 60))
                }
            });

            // Mark as alert generated
            vehicle.alertGenerated = true;
            await vehicle.save();

            // Emit real-time alert
            if (io) {
                io.emit('new_alert', {
                    id: alert._id,
                    type: alert.alertType,
                    severity: alert.severity,
                    message: alert.description,
                    timestamp: alert.createdAt
                });
            }

            // Send email notification
            await sendAlertEmail(alert);

            console.log(`🚨 Alert created: Overstay vehicle ${vehicle.licensePlate}`);
        }

        return overstayVehicles.length;
    } catch (error) {
        console.error('Error checking overstay vehicles:', error);
        return 0;
    }
}

/**
 * Check for unauthorized vehicles (in slots but no check-in record)
 */
export async function checkUnauthorizedVehicles(io) {
    try {
        // Find occupied slots
        const occupiedSlots = await ParkingSlot.find({ status: 'occupied' });

        let unauthorizedCount = 0;

        for (const slot of occupiedSlots) {
            if (!slot.currentVehicle) continue;

            // Check if there's a valid check-in record
            const validRecord = await History.findOne({
                licensePlate: slot.currentVehicle,
                slotUsed: slot.slotNumber,
                checkOutTime: null
            });

            if (!validRecord) {
                // Check if alert already exists
                const existingAlert = await SecurityAlert.findOne({
                    alertType: 'unauthorized',
                    vehiclePlate: slot.currentVehicle,
                    slotNumber: slot.slotNumber,
                    status: { $ne: 'resolved' }
                });

                if (!existingAlert) {
                    // Create unauthorized vehicle alert
                    const alert = await SecurityAlert.create({
                        alertType: 'unauthorized',
                        severity: 'high',
                        vehiclePlate: slot.currentVehicle,
                        slotNumber: slot.slotNumber,
                        description: `Phát hiện xe lạ ${slot.currentVehicle} tại vị trí ${slot.slotNumber} không có bản ghi check-in`,
                        metadata: {
                            detectedAt: new Date()
                        }
                    });

                    // Emit real-time alert
                    if (io) {
                        io.emit('new_alert', {
                            id: alert._id,
                            type: alert.alertType,
                            severity: alert.severity,
                            message: alert.description,
                            timestamp: alert.createdAt
                        });
                    }

                    await sendAlertEmail(alert);
                    unauthorizedCount++;

                    console.log(`🚨 Alert created: Unauthorized vehicle ${slot.currentVehicle}`);
                }
            }
        }

        return unauthorizedCount;
    } catch (error) {
        console.error('Error checking unauthorized vehicles:', error);
        return 0;
    }
}

/**
 * Create manual security incident alert
 */
export async function createSecurityIncident(data, io) {
    try {
        const alert = await SecurityAlert.create({
            alertType: 'security_incident',
            severity: data.severity || 'medium',
            vehiclePlate: data.vehiclePlate || null,
            slotNumber: data.slotNumber || null,
            description: data.description,
            metadata: data.metadata || {}
        });

        // Emit real-time alert
        if (io) {
            io.emit('new_alert', {
                id: alert._id,
                type: alert.alertType,
                severity: alert.severity,
                message: alert.description,
                timestamp: alert.createdAt
            });
        }

        await sendAlertEmail(alert);

        return alert;
    } catch (error) {
        console.error('Error creating security incident:', error);
        throw error;
    }
}

/**
 * Send email notification for alert
 */
async function sendAlertEmail(alert) {
    if (!emailTransporter || !process.env.ALERT_EMAIL_TO) {
        return; // Skip if email not configured
    }

    try {
        const severityEmoji = {
            low: '🟢',
            medium: '🟡',
            high: '🟠',
            critical: '🔴'
        };

        await emailTransporter.sendMail({
            from: process.env.SMTP_USER,
            to: process.env.ALERT_EMAIL_TO,
            subject: `${severityEmoji[alert.severity]} Cảnh báo: ${alert.alertType.toUpperCase()}`,
            html: `
                <h2>Cảnh báo An ninh Bãi xe</h2>
                <p><strong>Loại:</strong> ${alert.alertType}</p>
                <p><strong>Mức độ:</strong> ${alert.severity}</p>
                <p><strong>Mô tả:</strong> ${alert.description}</p>
                ${alert.vehiclePlate ? `<p><strong>Biển số:</strong> ${alert.vehiclePlate}</p>` : ''}
                ${alert.slotNumber ? `<p><strong>Vị trí:</strong> ${alert.slotNumber}</p>` : ''}
                <p><strong>Thời gian:</strong> ${new Date(alert.createdAt).toLocaleString('vi-VN')}</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    Email tự động từ Hệ thống Quản lý Bãi xe
                </p>
            `
        });

        console.log(`📧 Alert email sent for ${alert.alertType}`);
    } catch (error) {
        console.error('Error sending alert email:', error);
    }
}

/**
 * Clean up old resolved alerts (older than 30 days)
 */
export async function cleanupOldAlerts() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await SecurityAlert.deleteMany({
            status: 'resolved',
            resolvedAt: { $lte: thirtyDaysAgo }
        });

        console.log(`🧹 Cleaned up ${result.deletedCount} old alerts`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up alerts:', error);
        return 0;
    }
}
