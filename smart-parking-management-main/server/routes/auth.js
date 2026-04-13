import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'parking-secret-key-2026';

// POST /api/auth/login - Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username và password là bắt buộc' });
        }

        // Find user
        const user = await User.findOne({ username, isActive: true });
        if (!user) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// POST /api/auth/verify - Verify token
router.post('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Không có token' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Token không hợp lệ' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role
            }
        });

    } catch (error) {
        res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
});

// POST /api/auth/register - Register new user (admin only)
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullName, role } = req.body;

        // Check if user exists
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: 'Username đã tồn tại' });
        }

        const user = new User({
            username,
            password,
            fullName,
            role: role || 'employee'
        });

        await user.save();

        res.json({
            success: true,
            message: 'Tạo tài khoản thành công',
            userId: user._id
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

export default router;
