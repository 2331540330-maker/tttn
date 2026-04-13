import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);
const IV_LENGTH = 16;

/**
 * Encrypt text using AES-256-CBC
 */
export function encrypt(text) {
    if (!text) return text;

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Store IV with encrypted data (IV:encrypted)
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        return text; // Fallback to plaintext if encryption fails
    }
}

/**
 * Decrypt text using AES-256-CBC
 */
export function decrypt(text) {
    if (!text || !text.includes(':')) return text;

    try {
        const parts = text.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];

        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY), iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return text; // Return as-is if decryption fails
    }
}

/**
 * Hash sensitive data (one-way)
 */
export function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate random token
 */
export function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypt object fields
 */
export function encryptObject(obj, fieldsToEncrypt = []) {
    const encrypted = { ...obj };

    fieldsToEncrypt.forEach(field => {
        if (encrypted[field]) {
            encrypted[field] = encrypt(encrypted[field]);
        }
    });

    return encrypted;
}

/**
 * Decrypt object fields
 */
export function decryptObject(obj, fieldsToDecrypt = []) {
    const decrypted = { ...obj };

    fieldsToDecrypt.forEach(field => {
        if (decrypted[field]) {
            decrypted[field] = decrypt(decrypted[field]);
        }
    });

    return decrypted;
}

// Warn if using default encryption key
if (!process.env.ENCRYPTION_KEY) {
    console.warn('⚠️ WARNING: Using default encryption key. Set ENCRYPTION_KEY in .env for production!');
}
