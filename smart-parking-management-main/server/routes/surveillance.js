import express from 'express';
import ParkingSlot from '../models/ParkingSlot.js';

const router = express.Router();

/**
 * POST /api/surveillance/scan
 * Body: { licensePlate: string, slotId: string, image?: string }
 *
 * Logic:
 *  - Nhận biển số đã được Python AI đọc từ Frontend
 *  - Tìm xe đó đang ở ô nào trong DB
 *  - Nếu không ở ô C3, cập nhật vị trí → C3 (xe đã di chuyển)
 *  - Nếu đã ở C3, không làm gì
 */
router.post('/scan', async (req, res) => {
    try {
        const { licensePlate, slotId = 'C3', image } = req.body;
        const io = req.app.get('io');

        // ── Kiểm tra đầu vào ──────────────────────────────
        if (!licensePlate) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu biển số xe (licensePlate). Frontend cần gửi sau khi AI đọc xong.'
            });
        }

        const normalizedPlate = licensePlate.trim().toUpperCase();
        console.log(`📷 [Camera ${slotId}] AI gửi biển số: "${normalizedPlate}"`);

        // ── Tìm xe trong DB ───────────────────────────────
        const currentSlot = await ParkingSlot.findOne({
            licensePlate: normalizedPlate,
            status: 'occupied'
        });

        if (!currentSlot) {
            // Xe chưa check-in hoặc không tồn tại trong hệ thống
            console.log(`⚠️ [Camera ${slotId}] Biển ${normalizedPlate} không có trong DB`);

            // Emit cảnh báo để dashboard biết
            if (io) {
                io.emit('surveillance-alert', {
                    type: 'unknown-vehicle',
                    licensePlate: normalizedPlate,
                    cameraSlot: slotId,
                    timestamp: new Date(),
                    message: `📷 Camera ${slotId} thấy biển ${normalizedPlate} — xe không có trong hệ thống`
                });
            }

            return res.json({
                success: true,
                detected: true,
                notInSystem: true,
                licensePlate: normalizedPlate,
                message: `Phát hiện biển ${normalizedPlate} nhưng xe chưa check-in hoặc không trong hệ thống`,
                timestamp: new Date()
            });
        }

        // ── Xe đang ở đúng ô C3 rồi → không cần cập nhật ─
        if (currentSlot.slotId === slotId) {
            console.log(`✅ [Camera ${slotId}] ${normalizedPlate} đang đúng vị trí`);
            return res.json({
                success: true,
                detected: true,
                moved: false,
                licensePlate: normalizedPlate,
                currentSlot: slotId,
                message: `Xe ${normalizedPlate} đang ở đúng vị trí ${slotId}`,
                timestamp: new Date()
            });
        }

        // ── Xe đang ở ô KHÁC (VD: B1, D3...) → Camera C3 thấy → cập nhật ──
        const oldSlotId = currentSlot.slotId;
        console.log(`🚗 [Camera ${slotId}] Phát hiện xe ${normalizedPlate} từ ô ${oldSlotId} → đang ở trước C3`);

        // Kiểm tra ô đích (C3) có bị chiếm bởi xe khác không
        const targetSlot = await ParkingSlot.findOne({ slotId });
        if (!targetSlot) {
            return res.status(404).json({
                success: false,
                error: `Ô ${slotId} không tồn tại trong hệ thống`
            });
        }

        if (targetSlot.status === 'occupied' && targetSlot.licensePlate !== normalizedPlate) {
            const occupiedBy = targetSlot.licensePlate;
            console.log(`⚠️ [Camera ${slotId}] Ô ${slotId} đang bị chiếm bởi ${occupiedBy}`);
            return res.json({
                success: false,
                detected: true,
                targetOccupied: true,
                licensePlate: normalizedPlate,
                occupiedBy,
                message: `Ô ${slotId} đang có xe ${occupiedBy}, không thể chuyển ${normalizedPlate}`,
                timestamp: new Date()
            });
        }

        // ── Thực hiện cập nhật vị trí ─────────────────────
        // 1. Giải phóng ô cũ
        currentSlot.status      = 'empty';
        currentSlot.licensePlate = null;
        currentSlot.checkInTime  = null;
        await currentSlot.save();

        // 2. Chiếm ô mới (C3)
        targetSlot.status       = 'occupied';
        targetSlot.licensePlate  = normalizedPlate;
        targetSlot.checkInTime   = targetSlot.checkInTime || currentSlot.checkInTime || new Date();
        await targetSlot.save();

        console.log(`✅ [Camera ${slotId}] Di chuyển ${normalizedPlate}: ${oldSlotId} → ${slotId}`);

        // 3. Phát sự kiện realtime qua Socket.IO
        if (io) {
            io.emit('slot-update', { slotId: oldSlotId, status: 'empty', licensePlate: null });
            io.emit('slot-update', { slotId, status: 'occupied', licensePlate: normalizedPlate });
            io.emit('surveillance-alert', {
                type: 'vehicle-moved',
                licensePlate: normalizedPlate,
                oldSlot: oldSlotId,
                newSlot: slotId,
                cameraSlot: slotId,
                timestamp: new Date(),
                message: `📷 Camera ${slotId}: Xe ${normalizedPlate} đã di chuyển từ ${oldSlotId} → ${slotId}`
            });
        }

        return res.json({
            success: true,
            detected: true,
            moved: true,
            licensePlate: normalizedPlate,
            oldSlot: oldSlotId,
            newSlot: slotId,
            message: `✅ Cập nhật: xe ${normalizedPlate} từ ${oldSlotId} → ${slotId}`,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Surveillance scan error:', error);
        res.status(500).json({ success: false, error: 'Lỗi server khi xử lý camera' });
    }
});

/**
 * GET /api/surveillance/status
 * Trả về trạng thái hiện tại của ô C3
 */
router.get('/status', async (req, res) => {
    try {
        const c3Slot = await ParkingSlot.findOne({ slotId: 'C3' });
        res.json({
            success: true,
            cameraSlot: 'C3',
            slotStatus: c3Slot ? c3Slot.status : 'unknown',
            licensePlate: c3Slot?.licensePlate || null,
            lastChecked: new Date()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Lỗi server' });
    }
});

/**
 * GET /api/surveillance/all-slots
 * Cho Frontend biết toàn bộ xe đang có mặt trong bãi
 */
router.get('/all-slots', async (req, res) => {
    try {
        const occupied = await ParkingSlot.find({ status: 'occupied' }).select('slotId licensePlate checkInTime');
        res.json({ success: true, vehicles: occupied });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Lỗi server' });
    }
});

export default router;
