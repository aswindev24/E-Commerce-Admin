const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { status, paymentStatus, page = 1, limit = 10, startDate, endDate } = req.query;
        let filter = {};

        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        // Add date filtering
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                console.log('Start Date received:', startDate);
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                console.log('End Date received:', endDate);
                filter.createdAt.$lt = new Date(endDate);
            }
        }

        console.log('Filter being used:', JSON.stringify(filter, null, 2));

        // Convert to numbers
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get total count for pagination
        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limitNum);

        // Get paginated orders
        const orders = await Order.find(filter)
            .populate('user', 'firstName lastName email phoneNumber')
            .populate('address')
            .populate('items.product', 'name price images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.json({
            success: true,
            orders,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalOrders,
                limit: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'firstName lastName email phoneNumber')
            .populate('address')
            .populate('items.product', 'name price images');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/orders/:id
// @desc    Update order status
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { status, paymentStatus } = req.body;

        let order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;

        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'firstName lastName email phoneNumber')
            .populate('address')
            .populate('items.product', 'name price images');

        res.json({ success: true, order: populatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/orders/:id
// @desc    Delete order
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await order.deleteOne();

        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
