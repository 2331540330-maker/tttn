import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parking_db')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

async function initializeAdmin() {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ username: 'admin' });

        if (adminExists) {
            console.log('ℹ️  Admin account already exists');
            process.exit(0);
        }

        // Create admin account
        const admin = new User({
            username: 'admin',
            password: 'admin123', // Will be hashed by pre-save hook
            fullName: 'Quản Lý Hệ Thống',
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin account created successfully!');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('   Role: admin');

        // Create a sample employee
        const employee = new User({
            username: 'nhanvien01',
            password: 'nv123',
            fullName: 'Nguyễn Văn A',
            role: 'employee'
        });

        await employee.save();
        console.log('✅ Sample employee created!');
        console.log('   Username: nhanvien01');
        console.log('   Password: nv123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating accounts:', error);
        process.exit(1);
    }
}

initializeAdmin();
