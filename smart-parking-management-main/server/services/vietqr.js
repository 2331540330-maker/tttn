import QRCode from 'qrcode';
import dotenv from 'dotenv';

dotenv.config();

// Generate VietQR payment code
export async function generateVietQR(amount, content) {
    try {
        const bankId = process.env.BANK_ID || '970422'; // MB Bank
        const accountNo = process.env.ACCOUNT_NO || '0123456789';
        const accountName = process.env.ACCOUNT_NAME || 'BAI_GIU_XE';

        // VietQR format
        const qrContent = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${accountName}`;

        // Generate QR code as Data URL
        const qrDataURL = await QRCode.toDataURL(qrContent, {
            errorCorrectionLevel: 'M',
            width: 300,
            margin: 2
        });

        return {
            qrDataURL,
            amount,
            content,
            bankId,
            accountNo
        };

    } catch (error) {
        console.error('VietQR generation error:', error);
        throw error;
    }
}
