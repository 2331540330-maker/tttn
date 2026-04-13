import mongoose from 'mongoose';
import ParkingSlot from '../models/ParkingSlot.js';

mongoose.connect('mongodb://localhost:27017/parking_db')
    .then(() => console.log('✅ Connected'))
    .catch(err => console.error('❌ Error:', err));

async function resetToOriginal() {
    try {
        console.log('🔄 Resetting to original 48-slot configuration...\n');

        // Clear ALL slots
        await ParkingSlot.deleteMany({});
        console.log('Cleared existing slots');

        // Create 48 slots with ORIGINAL schema (position.row, position.col)
        const slots = [];
        const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
        const slotsPerRow = 8;

        for (let i = 0; i < rows.length; i++) {
            for (let j = 1; j <= slotsPerRow; j++) {
                slots.push({
                    slotId: `${rows[i]}${j}`,
                    status: 'empty',
                    licensePlate: null,
                    checkInTime: null,
                    position: {
                        row: i,
                        col: j - 1
                    }
                });
            }
        }

        const result = await ParkingSlot.insertMany(slots);
        console.log(`\n✅ Created ${result.length} slots with ORIGINAL schema!`);
        console.log('\nLayout: 6 rows x 8 slots');
        console.log('Schema: position = { row: Number, col: Number }');
        console.log('Total: 48 slots\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetToOriginal();
