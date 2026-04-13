import express from 'express';
import ParkingSlot from '../models/ParkingSlot.js';
import History from '../models/History.js';
import { generateVietQR } from '../services/vietqr.js';
import { calculateFee } from '../utils/pricing.js';

const router = express.Router();

// POST /api/checkout - Check-out vehicle
router.post('/', async (req, res) => {
    try {
        const { licensePlate } = req.body;

        if (!licensePlate) {
            return res.status(400).json({
                success: false,
                error: 'Biển số xe là bắt buộc'
            });
        }

        const normalizedPlate = licensePlate.trim().toUpperCase();

        // Find occupied slot
        const slot = await ParkingSlot.findOne({
            licensePlate: normalizedPlate,
            status: 'occupied'
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy xe trong bãi'
            });
        }

        // Get history record - most recent uncompleted one
        // First try with exact slot match, then fallback without slot constraint
        let history = await History.findOne({
            licensePlate: normalizedPlate,
            slotUsed: slot.slotId,
            checkOutTime: null
        }).sort({ checkInTime: -1 });

        // Fallback: find any open check-in for this plate (handles data inconsistency)
        if (!history) {
            history = await History.findOne({
                licensePlate: normalizedPlate,
                checkOutTime: null
            }).sort({ checkInTime: -1 });
        }

        if (!history) {
            // Tự động tạo bản ghi history từ thông tin slot
            // (xử lý trường hợp xe check-in qua demo/seed hoặc thiếu history)
            console.log(`⚠️ Không tìm thấy history cho ${normalizedPlate}, tự tạo từ slot data`);
            history = new History({
                licensePlate: normalizedPlate,
                slotUsed: slot.slotId,
                checkInTime: slot.checkInTime || new Date(Date.now() - 60 * 60 * 1000), // fallback: 1 giờ trước
                checkOutTime: null,
                paymentStatus: 'unpaid'
            });
            await history.save();
        }


        // Calculate duration and fee
        const checkOutTime = new Date();
        const duration = Math.ceil((checkOutTime - history.checkInTime) / 60000); // minutes
        const fee = calculateFee(duration);

        // Generate VietQR code
        let qrData;
        try {
            qrData = await generateVietQR(fee, `PAY${normalizedPlate.replace(/[^A-Z0-9]/g, '')}`);
        } catch (error) {
            console.error('QR generation error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể tạo mã QR thanh toán'
            });
        }

        // Update history
        history.checkOutTime = checkOutTime;
        history.duration = duration;
        history.fee = fee;
        history.paymentQR = qrData.qrDataURL;
        await history.save();

        res.json({
            success: true,
            licensePlate: normalizedPlate,
            checkInTime: history.checkInTime,
            checkOutTime,
            duration,
            fee,
            qrCode: qrData.qrDataURL,
            message: `Xe ${normalizedPlate}. Thời gian gửi ${Math.floor(duration / 60)} giờ ${duration % 60} phút. Phí gửi là ${fee.toLocaleString('vi-VN')} đồng`
        });

    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        });
    }
});

// POST /api/checkout/confirm - Confirm payment
router.post('/confirm', async (req, res) => {
    try {
        const { licensePlate } = req.body;

        if (!licensePlate) {
            return res.status(400).json({
                success: false,
                error: 'Biển số xe là bắt buộc'
            });
        }

        const normalizedPlate = licensePlate.trim().toUpperCase();

        // Find and update slot
        const slot = await ParkingSlot.findOne({
            licensePlate: normalizedPlate,
            status: 'occupied'
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy xe trong bãi'
            });
        }

        // Update history - find most recent unpaid checkout
        const history = await History.findOne({
            licensePlate: normalizedPlate,
            checkOutTime: { $ne: null },
            paymentStatus: 'unpaid',
            paymentQR: { $ne: null } // Must have QR code
        }).sort({ checkOutTime: -1 }); // Most recent first

        if (!history) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy bản ghi thanh toán'
            });
        }

        // Mark as paid
        history.paymentStatus = 'paid';
        await history.save();

        // Clear slot
        slot.status = 'empty';
        slot.isOccupied = false;
        slot.licensePlate = null;
        slot.checkInTime = null;
        await slot.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('slot-update', {
                slotId: slot.slotId,
                status: 'empty',
                licensePlate: null
            });
        }

        res.json({
            success: true,
            message: 'Cảm ơn quý khách. Hẹn gặp lại!'
        });

    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server'
        });
    }
});

export default router;
