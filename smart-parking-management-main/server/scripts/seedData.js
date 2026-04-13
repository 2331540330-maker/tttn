import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import User from '../models/User.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Attendance from '../models/Attendance.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parking-system')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err));

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data
        await User.deleteMany({});
        await ParkingSlot.deleteMany({});
        await Attendance.deleteMany({});

        console.log('🗑️  Cleared existing data');

        // 1. Create Admin User
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            username: 'admin',
            password: hashedPassword,
            fullName: 'Quản Lý Hệ Thống',
            role: 'admin',
            avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff'
        });
        console.log('✅ Admin created');

        // 2. Create Sample Employees
        const employees = await User.insertMany([
            {
                username: 'kiet',
                password: await bcrypt.hash('kiet123', 10),
                fullName: 'Nguyễn Văn Kiệt',
                role: 'employee',
                avatarUrl: 'https://ui-avatars.com/api/?name=Kiet&background=10b981&color=fff'
            },
            {
                username: 'mai',
                password: await bcrypt.hash('mai123', 10),
                fullName: 'Trần Thị Mai',
                role: 'employee',
                avatarUrl: 'https://ui-avatars.com/api/?name=Mai&background=f59e0b&color=fff'
            },
            {
                username: 'long',
                password: await bcrypt.hash('long123', 10),
                fullName: 'Lê Văn Long',
                role: 'manager',
                avatarUrl: 'https://ui-avatars.com/api/?name=Long&background=8b5cf6&color=fff'
            }
        ]);
        console.log(`✅ Created ${employees.length} employees`);

        // 3. Create Parking Slots (50 slots)
        const slots = [];
        const areas = ['A', 'B', 'C', 'D', 'E'];

        for (let area of areas) {
            for (let i = 1; i <= 10; i++) {
                slots.push({
                    slotId: `${area}${i}`,
                    area: area,
                    row: Math.ceil(i / 5),
                    position: i,
                    isOccupied: false,
                    vehicleType: 'car'
                });
            }
        }

        await ParkingSlot.insertMany(slots);
        console.log(`✅ Created ${slots.length} parking slots`);

        // 4. Create Sample Attendance for Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendances = [
            {
                userId: employees[0]._id,
                date: today,
                checkIn: new Date(today.getTime() + 7.5 * 3600000), // 7:30 AM
                status: 'on-time',
                lateMinutes: 0
            },
            {
                userId: employees[1]._id,
                date: today,
                checkIn: new Date(today.getTime() + 8.2 * 3600000), // 8:12 AM
                checkOut: new Date(today.getTime() + 17 * 3600000), // 5:00 PM
                status: 'late',
                lateMinutes: 12,
                workHours: 8.8
            },
            {
                userId: employees[2]._id,
                date: today,
                checkIn: new Date(today.getTime() + 7.8 * 3600000), // 7:48 AM
                status: 'on-time',
                lateMinutes: 0
            }
        ];

        await Attendance.insertMany(attendances);
        console.log(`✅ Created ${attendances.length} attendance records`);

        console.log('\n🎉 Database seeding completed!');
        console.log('\n📋 Login Credentials:');
        console.log('════════════════════════════════════');
        console.log('👨‍💼 Admin:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('\n👥 Employees:');
        console.log('   1. kiet / kiet123');
        console.log('   2. mai / mai123');
        console.log('   3. long / long123');
        console.log('════════════════════════════════════\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedDatabase();
