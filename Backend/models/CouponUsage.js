const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true
    },
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    lastUsedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure one record per user-coupon combination
couponUsageSchema.index({ userId: 1, couponId: 1 }, { unique: true });

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
