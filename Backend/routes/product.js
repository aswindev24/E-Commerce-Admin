const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/multer-config');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { categoryId, subCategoryId, search, page = 1, limit = 10 } = req.query;
        let filter = {};

        if (categoryId) filter.category = categoryId;
        if (subCategoryId) filter.subCategory = subCategoryId;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Convert to numbers
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limitNum);

        // Get paginated products
        const products = await Product.find(filter)
            .populate('category', 'name')
            .populate('subCategory', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.json({
            success: true,
            products,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalProducts,
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

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('subCategory', 'name');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', upload.array('images', 10), async (req, res) => {
    try {
        console.log('=== POST /api/products DEBUG ===');
        console.log('req.body:', JSON.stringify(req.body, null, 2));
        console.log('req.files:', req.files);
        console.log('req.body.images exists?:', 'images' in req.body);
        console.log('req.body.images value:', req.body.images);

        const { name, description, price, category, subCategory, stock, status } = req.body;

        if (!category || !subCategory) {
            return res.status(400).json({ message: 'Category and SubCategory are required' });
        }

        // Get uploaded image paths from multer files ONLY
        // NEVER use req.body.images
        const imagePaths = req.files && req.files.length > 0
            ? req.files.map(file => `/uploads/products/${file.filename}`)
            : [];

        console.log('imagePaths to save:', imagePaths);

        const product = await Product.create({
            name,
            description,
            price,
            category,
            subCategory,
            stock: stock || 0,
            images: imagePaths,
            status: status || 'active'
        });

        const populatedProduct = await Product.findById(product._id)
            .populate('category', 'name')
            .populate('subCategory', 'name');

        res.status(201).json({ success: true, product: populatedProduct });
    } catch (error) {
        console.error('POST /api/products error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', upload.array('images', 10), async (req, res) => {
    try {
        const { name, description, price, category, subCategory, stock, status, existingImages } = req.body;

        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Get new uploaded image paths
        const newImagePaths = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

        // Parse existing images (sent as JSON string from frontend)
        let existingImagePaths = [];
        if (existingImages) {
            try {
                existingImagePaths = JSON.parse(existingImages);
            } catch (e) {
                existingImagePaths = [];
            }
        }

        // Combine existing and new images
        const allImages = [...existingImagePaths, ...newImagePaths];

        product.name = name || product.name;
        product.description = description !== undefined ? description : product.description;
        product.price = price !== undefined ? price : product.price;
        product.category = category || product.category;
        product.subCategory = subCategory || product.subCategory;
        product.stock = stock !== undefined ? stock : product.stock;
        product.images = allImages.length > 0 ? allImages : product.images;
        product.status = status || product.status;

        await product.save();

        const populatedProduct = await Product.findById(product._id)
            .populate('category', 'name')
            .populate('subCategory', 'name');

        res.json({ success: true, product: populatedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.deleteOne();

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
