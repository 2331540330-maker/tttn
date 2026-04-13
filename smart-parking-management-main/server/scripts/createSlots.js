import mongoose from 'mongoose';
import ParkingSlot from '../models/ParkingSlot.js';

mongoose.connect('mongodb://localhost:27017/parking_db')
    .then(() => console.log('✅ Connected'))
    .catch(err => console.error('❌ Error:', err));

async function create48Slots() {
    try {
        console.log('🅿️  Creating 48 parking slots (original layout)...\n');

        // Clear existing slots
        await ParkingSlot.deleteMany({});
        console.log('Cleared existing slots');

        // Create 48 slots in 6 rows x 8 columns
        const slots = [];
        const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
        const slotsPerRow = 8;

        for (let i = 0; i < rows.length; i++) {
            for (let j = 1; j <= slotsPerRow; j++) {
                slots.push({
                    slotId: `${rows[i]}${j}`,
                    area: rows[i],
                    row: i + 1,
                    position: j,
                    status: 'empty',
                    isOccupied: false,
                    vehicleType: 'car'
                });
            }
        }

        const result = await ParkingSlot.insertMany(slots);
        console.log(`\n✅ Created ${result.length} parking slots!`);
        console.log('\nLayout: 6 rows x 8 slots');
        console.log('Rows: A, B, C, D, E, F');
        console.log('Slots per row: 8');
        console.log('Total: 48 slots\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

create48Slots();
