import mongoose from 'mongoose';

const parkingSlotSchema = new mongoose.Schema({
    slotId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['empty', 'occupied'],
        default: 'empty'
    },
    licensePlate: {
        type: String,
        default: null
    },
    checkInTime: {
        type: Date,
        default: null
    },
    position: {
        row: Number,
        col: Number
    }
}, {
    timestamps: true
});

// Index for faster queries
parkingSlotSchema.index({ slotId: 1 });
parkingSlotSchema.index({ licensePlate: 1 });
parkingSlotSchema.index({ status: 1 });

export default mongoose.model('ParkingSlot', parkingSlotSchema);
