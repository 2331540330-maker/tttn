import mongoose from 'mongoose';

// Import all models to ensure indexes are created
import User from '../models/User.js';
import ParkingSlot from '../models/ParkingSlot.js';
import History from '../models/History.js';
import Attendance from '../models/Attendance.js';
import SecurityAlert from '../models/SecurityAlert.js';
import TwoFactorAuth from '../models/TwoFactorAuth.js';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parking-system');

async function createIndexes() {
    console.log('🔍 Creating database indexes...\n');

    try {
        // User indexes
        await User.collection.createIndex({ username: 1 }, { unique: true });
        await User.collection.createIndex({ role: 1 });
        console.log('✅ User indexes created');

        // ParkingSlot indexes
        await ParkingSlot.collection.createIndex({ slotId: 1 }, { unique: true });
        await ParkingSlot.collection.createIndex({ isOccupied: 1 });
        await ParkingSlot.collection.createIndex({ area: 1, row: 1 });
        console.log('✅ ParkingSlot indexes created');

        // History indexes
        await History.collection.createIndex({ licensePlate: 1 });
        await History.collection.createIndex({ checkInTime: -1 });
        await History.collection.createIndex({ paymentStatus: 1 });
        await History.collection.createIndex({ slotId: 1 });
        console.log('✅ History indexes created');

        // Attendance indexes
        await Attendance.collection.createIndex({ userId: 1, date: 1 }, { unique: true });
        await Attendance.collection.createIndex({ date: -1 });
        await Attendance.collection.createIndex({ status: 1 });
        console.log('✅ Attendance indexes created');

        // SecurityAlert indexes
        await SecurityAlert.collection.createIndex({ severity: 1 });
        await SecurityAlert.collection.createIndex({ isResolved: 1 });
        await SecurityAlert.collection.createIndex({ timestamp: -1 });
        console.log('✅ SecurityAlert indexes created');

        // TwoFactorAuth indexes
        await TwoFactorAuth.collection.createIndex({ userId: 1 }, { unique: true });
        console.log('✅ TwoFactorAuth indexes created');

        console.log('\n🎉 All indexes created successfully!');

        // Show index stats
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📊 Database Collections:');
        for (const coll of collections) {
            const indexes = await mongoose.connection.db.collection(coll.name).indexes();
            console.log(`\n  ${coll.name}:`);
            indexes.forEach(idx => {
                console.log(`    - ${idx.name}`);
            });
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    }
}

createIndexes();
