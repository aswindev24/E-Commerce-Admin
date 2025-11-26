const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Seed default admin if not exists
        const Admin = require('../models/Admin');
        const adminExists = await Admin.findOne({ username: 'admin' });

        if (!adminExists) {
            await Admin.create({
                username: 'admin',
                password: 'admin'
            });
            console.log('Default admin created (username: admin, password: admin)');
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
