/**
 * 🤖 Detection Service v2.0 - Python AI Backend
 * Kết nối tới Python AI Server (FastAPI + YOLOv8 + EasyOCR) chạy ở cổng 8000
 * Để khởi động AI Server: python ai_server.py
 */

const AI_SERVER_URL = 'http://localhost:8000';
const DEMO_PLATES = ['59-P1 123.45', '30-A2 456.78', '51-B3 789.01', '29-C4 234.56'];

let aiServerAvailable = false;

/**
 * Khởi tạo - Kiểm tra kết nối với Python AI Server
 */
export async function initializeAI() {
    console.log('🤖 Đang kết nối tới Python AI Server (Port 8000)...');
    
    try {
        const response = await fetch(`${AI_SERVER_URL}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // Timeout 3 giây
        });

        if (response.ok) {
            const data = await response.json();
            aiServerAvailable = true;
            console.log(`✅ Python AI Server đã sẵn sàng!`);
            console.log(`   - YOLO Model: ${data.yolo_model ? '✅' : '⚠️ Chưa tải'}`);
            console.log(`   - EasyOCR: ${data.ocr_engine ? '✅' : '⚠️ Chưa tải'}`);
        } else {
            throw new Error(`Server trả về HTTP ${response.status}`);
        }
    } catch (error) {
        aiServerAvailable = false;
        console.warn('⚠️ Không thể kết nối tới Python AI Server.');
        console.warn('   → Hãy chạy: python ai_server.py');
        console.warn('   → Sẽ dùng chế độ Demo thay thế.');
        console.warn('   Chi tiết lỗi:', error.message);
    }

    return true; // Luôn trả true để app tiếp tục chạy
}

/**
 * Nhận diện biển số xe - Gọi sang Python AI Server
 * @param {string} imageData - Ảnh dạng Base64 (data:image/...;base64,...)
 * @returns {{plate: string|null, confidence: number, demo: boolean}}
 */
export async function detectLicensePlate(imageData) {
    // Nếu server không available, dùng demo
    if (!aiServerAvailable) {
        // Thử kết nối lại trước khi dùng demo
        await initializeAI();
        if (!aiServerAvailable) {
            console.log('🎲 Dùng Demo Mode (Python AI Server chưa chạy)');
            return useDemoMode();
        }
    }

    try {
        console.log('📤 Đang gửi ảnh sang Python AI Server...');

        const response = await fetch(`${AI_SERVER_URL}/api/recognize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image_base64: imageData }),
            signal: AbortSignal.timeout(15000) // Timeout 15 giây
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.plate) {
            console.log(`✅ Python AI nhận diện được: "${data.plate}" (độ chính xác: ${(data.confidence * 100).toFixed(1)}%)`);
            if (data.yolo_detected) {
                console.log('   → YOLO đã định vị chính xác vùng biển số');
            }
            return {
                plate: data.plate,
                confidence: data.confidence,
                demo: false,
                rawTexts: data.raw_texts || []
            };
        }

        // Server chạy nhưng không đọc được biển
        console.warn(`⚠️ ${data.message || 'Không nhận diện được biển số'}`);
        return { plate: null, confidence: 0, demo: false };

    } catch (error) {
        const isTimeout = error.name === 'TimeoutError';
        if (isTimeout) {
            console.error('⏱️ Python AI Server phản hồi quá chậm (timeout 15s)');
        } else {
            console.error('❌ Lỗi kết nối Python AI Server:', error.message);
            aiServerAvailable = false; // Đánh dấu server không available
        }
        return { plate: null, confidence: 0, demo: false };
    }
}

/**
 * Demo mode fallback - Trả về biển số ngẫu nhiên khi server chưa chạy
 */
function useDemoMode() {
    const plate = DEMO_PLATES[Math.floor(Math.random() * DEMO_PLATES.length)];
    console.log(`🎲 Demo Mode: ${plate}`);
    return { plate, confidence: 0.85, demo: true };
}

/**
 * Validate biển số Việt Nam
 */
export function validateVietnamesePlate(plate) {
    if (!plate || plate.length < 7) return false;
    const patterns = [
        /^\d{2}-[A-Z]\d\s\d{3}\.\d{2}$/, // 59-P1 123.45
        /^\d{2}-[A-Z]\d\s\d{4}$/,          // 29-A1 1234 (8 số)
        /^\d{2}[A-Z]\d{5}$/,               // 59P112345 (không format)
    ];
    return patterns.some(pattern => pattern.test(plate));
}

/**
 * Dọn dẹp tài nguyên (không cần làm gì với Python backend)
 */
export async function cleanupAI() {
    aiServerAvailable = false;
    console.log('✅ Đã ngắt kết nối AI Server');
}

// Tự động kiểm tra kết nối khi load trang
if (typeof window !== 'undefined') {
    setTimeout(() => initializeAI(), 1000);
}
