require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Register models
require('./models/User');
require('./models/Address');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/subcategories', require('./routes/subcategory'));
app.use('/api/products', require('./routes/product'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/coupons', require('./routes/coupon'));
app.use('/api/offer-images', require('./routes/offerImage'));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
