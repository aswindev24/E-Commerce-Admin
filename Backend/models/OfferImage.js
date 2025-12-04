const mongoose = require('mongoose');

const offerImageSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
offerImageSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('OfferImage', offerImageSchema);
