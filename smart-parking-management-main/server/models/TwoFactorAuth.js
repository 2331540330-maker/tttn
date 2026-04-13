import mongoose from 'mongoose';

const twoFactorAuthSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    secret: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        default: false
    },
    backupCodes: [{
        code: String,
        used: {
            type: Boolean,
            default: false
        }
    }],
    lastUsedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for quick lookups
twoFactorAuthSchema.index({ userId: 1 });

export default mongoose.model('TwoFactorAuth', twoFactorAuthSchema);
