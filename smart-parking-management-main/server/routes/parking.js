import express from 'express';
import ParkingSlot from '../models/ParkingSlot.js';

const router = express.Router();

// GET /api/parking/slots - Get all parking slots
router.get('/slots', async (req, res) => {
    try {
        const slots = await ParkingSlot.find().sort({ slotId: 1 });
        res.json({ slots });
    } catch (error) {
        console.error('Get slots error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/parking/find-car - Find car by license plate
router.get('/find-car', async (req, res) => {
    try {
        const { plate } = req.query;

        if (!plate) {
            return res.status(400).json({ error: 'License plate is required' });
        }

        const slot = await ParkingSlot.findOne({
            licensePlate: plate,
            status: 'occupied'
        });

        if (!slot) {
            return res.status(404).json({
                found: false,
                message: 'Không tìm thấy xe với biển số này'
            });
        }

        res.json({
            found: true,
            slotId: slot.slotId,
            position: slot.position,
            checkInTime: slot.checkInTime,
            message: `Xe của quý khách ở khu ${slot.slotId[0]}, ô số ${slot.slotId.slice(1)}`
        });

    } catch (error) {
        console.error('Find car error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/parking/initialize - Initialize parking slots
router.post('/initialize', async (req, res) => {
    try {
        const rows = parseInt(process.env.PARKING_ROWS) || 8;
        const cols = parseInt(process.env.PARKING_COLS) || 6;

        // Clear existing slots
        await ParkingSlot.deleteMany({});

        const slots = [];
        for (let row = 0; row < rows; row++) {
            const rowLabel = String.fromCharCode(65 + row); // A, B, C...
            for (let col = 0; col < cols; col++) {
                slots.push({
                    slotId: `${rowLabel}${col + 1}`,
                    status: 'empty',
                    position: { row, col }
                });
            }
        }

        await ParkingSlot.insertMany(slots);

        res.json({
            success: true,
            message: `Initialized ${slots.length} parking slots`,
            rows,
            cols
        });

    } catch (error) {
        console.error('Initialize error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
