import mongoose from 'mongoose';
import History from '../models/History.js';

mongoose.connect('mongodb://localhost:27017/parking_db')
    .then(() => console.log('✅ Connected'))
    .catch(err => console.error('❌ Error:', err));

async function clearUnpaidHistory() {
    try {
        console.log('🧹 Clearing unpaid history records...\n');

        // Find all unpaid records
        const unpaid = await History.find({
            paymentStatus: 'unpaid',
            checkOutTime: { $ne: null }
        });

        console.log(`Found ${unpaid.length} unpaid records`);

        if (unpaid.length > 0) {
            // Delete all unpaid records
            const result = await History.deleteMany({
                paymentStatus: 'unpaid',
                checkOutTime: { $ne: null }
            });

            console.log(`\n✅ Deleted ${result.deletedCount} unpaid records!`);
            console.log('\nYou can now check-in vehicles without issues.\n');
        } else {
            console.log('\n✅ No unpaid records found. Database is clean!\n');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

clearUnpaidHistory();
