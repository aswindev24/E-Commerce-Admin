const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscountAmount: {
        type: Number,
        default: null,
        min: 0
    },
    expiryDate: {
        type: Date,
        required: true
    },
    usageLimitPerUser: {
        type: Number,
        default: 1,
        min: 1
    },
    totalUsageLimit: {
        type: Number,
        default: null // null means unlimited
    },
    totalUsedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster lookups
couponSchema.index({ couponCode: 1 });
couponSchema.index({ isActive: 1, expiryDate: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
