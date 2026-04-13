import mongoose from 'mongoose';
import History from '../models/History.js';
import ParkingSlot from '../models/ParkingSlot.js';

mongoose.connect('mongodb://localhost:27017/parking_db')
    .then(() => console.log('✅ Connected'))
    .catch(err => console.error('❌ Error:', err));

async function checkVehicleStatus() {
    try {
        console.log('\n🔍 Checking 59-P1 123.45 status...\n');

        // Find history
        const history = await History.findOne({
            licensePlate: '59-P1 123.45',
            checkOutTime: null
        }).sort({ checkInTime: -1 });

        if (history) {
            console.log('✅ Vehicle is checked in!');
            console.log('Slot:', history.slotId);
            console.log('Check-in:', history.checkInTime);
            console.log('Payment Status:', history.paymentStatus);
        } else {
            console.log('❌ Vehicle NOT checked in!');
            console.log('\n📌 To fix: Check-in the vehicle first from Admin Panel\n');
        }

        // Check slot status
        const slot = await ParkingSlot.findOne({ licensePlate: '59-P1 123.45' });
        if (slot) {
            console.log('\n🅿️ Slot:', slot.slotId);
            console.log('Status:', slot.status);
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkVehicleStatus();
