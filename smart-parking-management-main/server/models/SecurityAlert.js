import mongoose from 'mongoose';

const securityAlertSchema = new mongoose.Schema({
    alertType: {
        type: String,
        enum: ['overstay', 'unauthorized', 'security_incident', 'system'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    vehiclePlate: {
        type: String,
        default: null
    },
    slotNumber: {
        type: String,
        default: null
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'acknowledged', 'resolved'],
        default: 'pending'
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
securityAlertSchema.index({ status: 1, createdAt: -1 });
securityAlertSchema.index({ alertType: 1, severity: 1 });
securityAlertSchema.index({ vehiclePlate: 1 });

export default mongoose.model('SecurityAlert', securityAlertSchema);
