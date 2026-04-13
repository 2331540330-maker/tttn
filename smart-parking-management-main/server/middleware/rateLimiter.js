import rateLimit from 'express-rate-limit';

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests
    skipSuccessfulRequests: true
});

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        error: 'Quá nhiều requests. Vui lòng thử lại sau.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Aggressive rate limiter for sensitive operations
export const sensitiveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: {
        error: 'Quá nhiều requests cho thao tác nhạy cảm. Vui lòng thử lại sau 1 giờ.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Payment endpoint rate limiter
export const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    message: {
        error: 'Quá nhiều requests thanh toán. Vui lòng thử lại sau.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Export/Download rate limiter (prevent abuse)
export const downloadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 downloads per hour
    message: {
        error: 'Quá nhiều downloads. Vui lòng thử lại sau 1 giờ.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
