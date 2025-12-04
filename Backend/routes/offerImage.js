const express = require('express');
const router = express.Router();
const OfferImage = require('../models/OfferImage');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for image upload - store in memory for processing
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Helper function to get base URL for image storage
const getImageBaseUrl = (req) => {
    // Use environment variable if set, otherwise construct from request
    if (process.env.IMAGE_STORAGE_URL) {
        return process.env.IMAGE_STORAGE_URL;
    }

    // Fallback to constructing from request
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}`;
};

// Helper function to save file to disk and return URL
const saveFileAndGetUrl = async (file, req) => {
    const fs = require('fs').promises;
    const path = require('path');

    // Create uploads directory if it doesn't exist
    const uploadDir = 'uploads/';
    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `offer-${uniqueSuffix}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file to disk
    await fs.writeFile(filepath, file.buffer);

    // Return complete URL
    const baseUrl = getImageBaseUrl(req);
    return `${baseUrl}/uploads/${filename}`;
};

// Serve uploaded folder as static URL (should be added in your main app.js/server.js)
// app.use('/uploads', express.static('uploads'));

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================

// @route   GET /api/offer-images/public
// @desc    Get all active offer images for public display
// @access  Public
router.get('/public', async (req, res) => {
    try {
        const now = new Date();

        // Find active offers that should be displayed now
        const offerImages = await OfferImage.find({
            status: 'active',
            $or: [
                // Offers with no date restrictions
                { startDate: null, endDate: null },
                // Offers with both start and end dates
                {
                    startDate: { $lte: now },
                    endDate: { $gte: now }
                },
                // Offers with only start date (started and ongoing)
                {
                    startDate: { $lte: now },
                    endDate: null
                },
                // Offers with only end date (ongoing until end date)
                {
                    startDate: null,
                    endDate: { $gte: now }
                }
            ]
        }).sort({ displayOrder: 1, createdAt: -1 });

        // Format the response
        const formattedOffers = offerImages.map(offer => ({
            _id: offer._id,
            image: offer.image,
            description: offer.description,
            displayOrder: offer.displayOrder,
            startDate: offer.startDate,
            endDate: offer.endDate,
            status: offer.status
        }));

        res.json({
            success: true,
            count: formattedOffers.length,
            offers: formattedOffers
        });
    } catch (error) {
        console.error('Error fetching public offer images:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching offers'
        });
    }
});

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// Apply auth middleware to all routes below this line
router.use(authMiddleware);

// @route   GET /api/offer-images
// @desc    Get all offer images (Admin view)
// @access  Private
router.get('/', async (req, res) => {
    try {
        const offerImages = await OfferImage.find().sort({ displayOrder: 1, createdAt: -1 });
        res.json({ success: true, offerImages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/offer-images/:id
// @desc    Get single offer image
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const offerImage = await OfferImage.findById(req.params.id);

        if (!offerImage) {
            return res.status(404).json({ message: 'Offer image not found' });
        }

        res.json({ success: true, offerImage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/offer-images
// @desc    Create offer image
// @access  Private
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { description, displayOrder, startDate, endDate, status } = req.body;

        // Check if image file is uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        // Save file and get full URL
        const imageUrl = await saveFileAndGetUrl(req.file, req);

        const offerImage = await OfferImage.create({
            image: imageUrl,
            description,
            displayOrder: displayOrder || 0,
            startDate,
            endDate,
            status: status || 'active'
        });

        res.status(201).json({ success: true, offerImage });
    } catch (error) {
        console.error('Error creating offer image:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/offer-images/:id
// @desc    Update offer image
// @access  Private
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { description, displayOrder, startDate, endDate, status } = req.body;

        let offerImage = await OfferImage.findById(req.params.id);

        if (!offerImage) {
            return res.status(404).json({ message: 'Offer image not found' });
        }

        // If new image is uploaded, save it and get URL
        if (req.file) {
            // Optional: Delete old file if you want to save disk space
            // deleteOldFile(offerImage.image);

            const imageUrl = await saveFileAndGetUrl(req.file, req);
            offerImage.image = imageUrl;
        }

        offerImage.description = description !== undefined ? description : offerImage.description;
        offerImage.displayOrder = displayOrder !== undefined ? displayOrder : offerImage.displayOrder;
        offerImage.startDate = startDate !== undefined ? startDate : offerImage.startDate;
        offerImage.endDate = endDate !== undefined ? endDate : offerImage.endDate;
        offerImage.status = status || offerImage.status;

        await offerImage.save();

        res.json({ success: true, offerImage });
    } catch (error) {
        console.error('Error updating offer image:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   DELETE /api/offer-images/:id
// @desc    Delete offer image
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const offerImage = await OfferImage.findById(req.params.id);

        if (!offerImage) {
            return res.status(404).json({ message: 'Offer image not found' });
        }

        // Optional: Delete the actual file from disk
        // deleteFileFromDisk(offerImage.image);

        await offerImage.deleteOne();

        res.json({ success: true, message: 'Offer image deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Optional: Helper function to delete old files from disk
// const deleteFileFromDisk = (imageUrl) => {
//     const fs = require('fs').promises;
//     const path = require('path');
//     
//     // Extract filename from URL
//     const filename = path.basename(imageUrl);
//     const filepath = path.join('uploads', filename);
//     
//     fs.unlink(filepath).catch(err => {
//         console.warn('Failed to delete old file:', err.message);
//     });
// };

module.exports = router;