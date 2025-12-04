const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const authMiddleware = require('../middleware/auth');

// Get all coupons (Admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ success: true, coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single coupon (Admin only)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.json({ success: true, coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create coupon (Admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            couponCode,
            description,
            discountPercentage,
            minOrderAmount,
            maxDiscountAmount,
            expiryDate,
            usageLimitPerUser,
            totalUsageLimit,
            isActive
        } = req.body;

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }

        const coupon = new Coupon({
            couponCode: couponCode.toUpperCase(),
            description,
            discountPercentage,
            minOrderAmount: minOrderAmount || 0,
            maxDiscountAmount: maxDiscountAmount || null,
            expiryDate,
            usageLimitPerUser: usageLimitPerUser || 1,
            totalUsageLimit: totalUsageLimit || null,
            isActive: isActive !== undefined ? isActive : true
        });

        await coupon.save();
        res.status(201).json({ success: true, coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update coupon (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const {
            couponCode,
            description,
            discountPercentage,
            minOrderAmount,
            maxDiscountAmount,
            expiryDate,
            usageLimitPerUser,
            totalUsageLimit,
            isActive
        } = req.body;

        // Check if new coupon code conflicts with existing one
        if (couponCode) {
            const existingCoupon = await Coupon.findOne({
                couponCode: couponCode.toUpperCase(),
                _id: { $ne: req.params.id }
            });
            if (existingCoupon) {
                return res.status(400).json({ success: false, message: 'Coupon code already exists' });
            }
        }

        const updateData = {};
        if (couponCode) updateData.couponCode = couponCode.toUpperCase();
        if (description) updateData.description = description;
        if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage;
        if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount;
        if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount;
        if (expiryDate) updateData.expiryDate = expiryDate;
        if (usageLimitPerUser !== undefined) updateData.usageLimitPerUser = usageLimitPerUser;
        if (totalUsageLimit !== undefined) updateData.totalUsageLimit = totalUsageLimit;
        if (isActive !== undefined) updateData.isActive = isActive;

        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        res.json({ success: true, coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete coupon (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        // Also delete all usage records for this coupon
        await CouponUsage.deleteMany({ couponId: req.params.id });

        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Validate coupon (Public - for users)
router.post('/validate', async (req, res) => {
    try {
        const { couponCode, userId, orderAmount } = req.body;

        if (!couponCode || !userId || orderAmount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code, user ID, and order amount are required'
            });
        }

        // Find coupon
        const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase() });
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        }

        // Check if active
        if (!coupon.isActive) {
            return res.status(400).json({ success: false, message: 'This coupon is no longer active' });
        }

        // Check if expired
        if (new Date() > new Date(coupon.expiryDate)) {
            return res.status(400).json({ success: false, message: 'This coupon has expired' });
        }

        // Check minimum order amount
        if (orderAmount < coupon.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount of ₹${coupon.minOrderAmount} required`
            });
        }

        // Check total usage limit
        if (coupon.totalUsageLimit && coupon.totalUsedCount >= coupon.totalUsageLimit) {
            return res.status(400).json({
                success: false,
                message: 'This coupon has reached its usage limit'
            });
        }

        // Check per-user usage limit
        const usage = await CouponUsage.findOne({ userId, couponId: coupon._id });
        if (usage && usage.usageCount >= coupon.usageLimitPerUser) {
            return res.status(400).json({
                success: false,
                message: `You have already used this coupon ${coupon.usageLimitPerUser} time(s)`
            });
        }

        // Calculate discount
        let discountAmount = (orderAmount * coupon.discountPercentage) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
        }

        const finalAmount = orderAmount - discountAmount;

        res.json({
            success: true,
            message: 'Coupon is valid',
            discount: {
                percentage: coupon.discountPercentage,
                amount: discountAmount,
                originalAmount: orderAmount,
                finalAmount: finalAmount
            },
            coupon: {
                code: coupon.couponCode,
                description: coupon.description
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Apply coupon (Public - for users, called after order placement)
router.post('/apply', async (req, res) => {
    try {
        const { couponCode, userId } = req.body;

        if (!couponCode || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code and user ID are required'
            });
        }

        const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase() });
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        }

        // Update or create usage record
        let usage = await CouponUsage.findOne({ userId, couponId: coupon._id });

        if (usage) {
            usage.usageCount += 1;
            usage.lastUsedAt = new Date();
            await usage.save();
        } else {
            usage = new CouponUsage({
                userId,
                couponId: coupon._id,
                usageCount: 1,
                lastUsedAt: new Date()
            });
            await usage.save();
        }

        // Increment total used count
        coupon.totalUsedCount += 1;
        await coupon.save();

        res.json({
            success: true,
            message: 'Coupon applied successfully',
            usageCount: usage.usageCount,
            remainingUses: coupon.usageLimitPerUser - usage.usageCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get coupon usage statistics (Admin only)
router.get('/:id/stats', authMiddleware, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        const usageRecords = await CouponUsage.find({ couponId: req.params.id })
            .populate('userId', 'name email');

        const stats = {
            couponCode: coupon.couponCode,
            totalUsedCount: coupon.totalUsedCount,
            totalUsageLimit: coupon.totalUsageLimit,
            uniqueUsers: usageRecords.length,
            usageRecords: usageRecords
        };

        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
