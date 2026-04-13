import express from 'express';
import jwt from 'jsonwebtoken';
import RemoteCustomer from '../models/RemoteCustomer.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'parking-secret-key-2026';

// POST /api/remote-auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, fullName, dateOfBirth, phone, password } = req.body;

        if (!email || !fullName || !dateOfBirth || !password) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Địa chỉ email không hợp lệ' });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        // Check if email already exists
        const existing = await RemoteCustomer.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: 'Email này đã được đăng ký' });
        }

        // Validate dateOfBirth
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
            return res.status(400).json({ error: 'Ngày sinh không hợp lệ' });
        }

        const customer = new RemoteCustomer({
            email: email.toLowerCase(),
            fullName,
            dateOfBirth: dob,
            phone: phone || '',
            password
        });

        await customer.save();

        res.json({
            success: true,
            message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.'
        });

    } catch (error) {
        console.error('Remote customer register error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// POST /api/remote-auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
        }

        const customer = await RemoteCustomer.findOne({ email: email.toLowerCase(), isActive: true });
        if (!customer) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        const isMatch = await customer.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        const token = jwt.sign(
            {
                remoteCustomerId: customer._id,
                email: customer.email,
                fullName: customer.fullName,
                role: 'remote_customer'
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            customer: {
                id: customer._id,
                email: customer.email,
                fullName: customer.fullName
            }
        });

    } catch (error) {
        console.error('Remote customer login error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// POST /api/remote-auth/verify
router.post('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Không có token' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== 'remote_customer') {
            return res.status(403).json({ error: 'Quyền truy cập bị từ chối' });
        }

        const customer = await RemoteCustomer.findById(decoded.remoteCustomerId).select('-password');

        if (!customer || !customer.isActive) {
            return res.status(401).json({ error: 'Token không hợp lệ' });
        }

        res.json({
            success: true,
            customer: {
                id: customer._id,
                email: customer.email,
                fullName: customer.fullName
            }
        });

    } catch (error) {
        res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
});

export default router;
