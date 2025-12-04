const express = require('express');
const router = express.Router();
const SubCategory = require('../models/SubCategory');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/subcategories
// @desc    Get all subcategories
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { categoryId } = req.query;
        const filter = categoryId ? { category: categoryId } : {};

        const subCategories = await SubCategory.find(filter)
            .populate('category', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, subCategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/subcategories/:id
// @desc    Get single subcategory
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id)
            .populate('category', 'name');

        if (!subCategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }

        res.json({ success: true, subCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/subcategories
// @desc    Create subcategory
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { name, description, category, status } = req.body;

        if (!category) {
            return res.status(400).json({ message: 'Category is required' });
        }

        const subCategory = await SubCategory.create({
            name,
            description,
            category,
            status: status || 'active'
        });

        const populatedSubCategory = await SubCategory.findById(subCategory._id)
            .populate('category', 'name');

        res.status(201).json({ success: true, subCategory: populatedSubCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/subcategories/:id
// @desc    Update subcategory
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { name, description, category, status } = req.body;

        let subCategory = await SubCategory.findById(req.params.id);

        if (!subCategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }

        subCategory.name = name || subCategory.name;
        subCategory.description = description !== undefined ? description : subCategory.description;
        subCategory.category = category || subCategory.category;
        subCategory.status = status || subCategory.status;

        await subCategory.save();

        const populatedSubCategory = await SubCategory.findById(subCategory._id)
            .populate('category', 'name');

        res.json({ success: true, subCategory: populatedSubCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/subcategories/:id
// @desc    Delete subcategory and associated products
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id);

        if (!subCategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }

        // Delete associated products
        await Product.deleteMany({ subCategory: subCategory._id });

        await subCategory.deleteOne();

        res.json({ success: true, message: 'SubCategory and associated products deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
