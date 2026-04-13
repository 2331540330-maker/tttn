import express from 'express';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import TwoFactorAuth from '../models/TwoFactorAuth.js';
import User from '../models/User.js';

const router = express.Router();

// POST /api/2fa/setup - Generate 2FA secret and QR code
router.post('/setup', async (req, res) => {
    try {
        const { userId } = req.body; // In production, get from JWT token

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if 2FA already exists
        let twoFA = await TwoFactorAuth.findOne({ userId });

        if (twoFA && twoFA.enabled) {
            return res.status(400).json({ error: '2FA đã được kích hoạt' });
        }

        // Generate new secret
        const secret = speakeasy.generateSecret({
            name: `Parking System (${user.email || user.username})`,
            issuer: 'Parking Management'
        });

        // Generate QR code
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        // Save or update 2FA record (not enabled yet)
        if (twoFA) {
            twoFA.secret = secret.base32;
            twoFA.enabled = false;
            await twoFA.save();
        } else {
            twoFA = await TwoFactorAuth.create({
                userId,
                secret: secret.base32,
                enabled: false
            });
        }

        res.json({
            success: true,
            secret: secret.base32,
            qrCode: qrCodeUrl,
            message: 'Quét mã QR bằng Google Authenticator để tiếp tục'
        });
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ error: 'Failed to setup 2FA' });
    }
});

// POST /api/2fa/verify - Verify TOTP code
router.post('/verify', async (req, res) => {
    try {
        const { userId, token } = req.body;

        const twoFA = await TwoFactorAuth.findOne({ userId });
        if (!twoFA) {
            return res.status(404).json({ error: '2FA chưa được setup' });
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: twoFA.secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps before/after
        });

        if (!verified) {
            return res.status(400).json({ error: 'Mã xác thực không đúng' });
        }

        res.json({
            success: true,
            message: 'Xác thực thành công'
        });
    } catch (error) {
        console.error('2FA verify error:', error);
        res.status(500).json({ error: 'Failed to verify 2FA' });
    }
});

// POST /api/2fa/enable - Enable 2FA after verification
router.post('/enable', async (req, res) => {
    try {
        const { userId, token } = req.body;

        const twoFA = await TwoFactorAuth.findOne({ userId });
        if (!twoFA) {
            return res.status(404).json({ error: '2FA chưa được setup' });
        }

        // Verify token first
        const verified = speakeasy.totp.verify({
            secret: twoFA.secret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({ error: 'Mã xác thực không đúng' });
        }

        // Generate backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            backupCodes.push({
                code: Math.random().toString(36).substring(2, 10).toUpperCase(),
                used: false
            });
        }

        twoFA.enabled = true;
        twoFA.backupCodes = backupCodes;
        await twoFA.save();

        res.json({
            success: true,
            message: '2FA đã được kích hoạt',
            backupCodes: backupCodes.map(bc => bc.code)
        });
    } catch (error) {
        console.error('2FA enable error:', error);
        res.status(500).json({ error: 'Failed to enable 2FA' });
    }
});

// POST /api/2fa/disable - Disable 2FA
router.post('/disable', async (req, res) => {
    try {
        const { userId, token } = req.body;

        const twoFA = await TwoFactorAuth.findOne({ userId });
        if (!twoFA || !twoFA.enabled) {
            return res.status(400).json({ error: '2FA không được kích hoạt' });
        }

        // Verify token before disabling
        const verified = speakeasy.totp.verify({
            secret: twoFA.secret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({ error: 'Mã xác thực không đúng' });
        }

        twoFA.enabled = false;
        await twoFA.save();

        res.json({
            success: true,
            message: '2FA đã được tắt'
        });
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ error: 'Failed to disable 2FA' });
    }
});

// GET /api/2fa/status - Check 2FA status
router.get('/status/:userId', async (req, res) => {
    try {
        const twoFA = await TwoFactorAuth.findOne({ userId: req.params.userId });

        res.json({
            enabled: twoFA ? twoFA.enabled : false,
            setupComplete: twoFA ? true : false
        });
    } catch (error) {
        console.error('2FA status error:', error);
        res.status(500).json({ error: 'Failed to get 2FA status' });
    }
});

// POST /api/2fa/backup-code - Use backup code
router.post('/backup-code', async (req, res) => {
    try {
        const { userId, code } = req.body;

        const twoFA = await TwoFactorAuth.findOne({ userId });
        if (!twoFA || !twoFA.enabled) {
            return res.status(400).json({ error: '2FA không được kích hoạt' });
        }

        // Find unused backup code
        const backupCode = twoFA.backupCodes.find(
            bc => bc.code === code.toUpperCase() && !bc.used
        );

        if (!backupCode) {
            return res.status(400).json({ error: 'Backup code không hợp lệ hoặc đã được sử dụng' });
        }

        // Mark as used
        backupCode.used = true;
        twoFA.lastUsedAt = new Date();
        await twoFA.save();

        res.json({
            success: true,
            message: 'Backup code hợp lệ',
            remainingCodes: twoFA.backupCodes.filter(bc => !bc.used).length
        });
    } catch (error) {
        console.error('Backup code error:', error);
        res.status(500).json({ error: 'Failed to verify backup code' });
    }
});

export default router;
