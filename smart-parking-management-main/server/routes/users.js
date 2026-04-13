import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET /api/users - Get all users (employees)
router.get('/', async (req, res) => {
    try {
        const users = await User.find({ isActive: true })
            .select('-password')
            .sort({ fullName: 1 });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
    try {
        const { username, password, fullName, role, avatarUrl } = req.body;

        // Check if username exists
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: 'Username đã tồn tại' });
        }

        const user = new User({
            username,
            password,
            fullName,
            role: role || 'employee',
            avatarUrl: avatarUrl || null
        });

        await user.save();

        res.json({
            success: true,
            message: 'Tạo nhân viên thành công',
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                avatarUrl: user.avatarUrl
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
    try {
        const { fullName, username, role, avatarUrl, password } = req.body;

        const updateData = {
            fullName,
            username,
            role,
            avatarUrl
        };

        // Only update password if provided
        if (password) {
            updateData.password = password;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
        }

        res.json({
            success: true,
            message: 'Cập nhật thành công',
            user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// DELETE /api/users/:id - Delete (soft delete) user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
        }

        res.json({
            success: true,
            message: 'Xóa nhân viên thành công'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

export default router;
