import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
    licensePlate: {
        type: String,
        required: true
    },
    checkInTime: {
        type: Date,
        required: true
    },
    checkOutTime: {
        type: Date,
        default: null
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    fee: {
        type: Number, // in VND
        default: 0
    },
    slotUsed: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'unpaid'],
        default: 'unpaid'
    },
    paymentQR: {
        type: String,
        default: null
    },
    evidenceImage: {
        type: String, // base64 or URL
        default: null
    },
    alertGenerated: {
        type: Boolean,
        default: false
    },
    isOverstay: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for analytics queries
historySchema.index({ checkInTime: 1 });
historySchema.index({ licensePlate: 1 });
historySchema.index({ paymentStatus: 1 });

// Compound index for checkout queries (prevents race conditions)
historySchema.index({ licensePlate: 1, checkOutTime: 1, paymentStatus: 1 });

// Index for finding active parking sessions
historySchema.index({ licensePlate: 1, checkOutTime: 1 });

export default mongoose.model('History', historySchema);
