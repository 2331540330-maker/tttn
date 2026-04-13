// Voice Assistant using Web Speech API

/**
 * Speak text using browser's Text-to-Speech
 * @param {string} text - Text to speak
 * @param {string} lang - Language code (default: 'vi-VN')
 */
export function speakText(text, lang = 'vi-VN') {
    // Check if browser supports Speech Synthesis
    if (!('speechSynthesis' in window)) {
        console.warn('Speech Synthesis not supported');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0; // Speed
    utterance.pitch = 1.0; // Pitch
    utterance.volume = 1.0; // Volume

    // Speak
    window.speechSynthesis.speak(utterance);
}

/**
 * Stop current speech
 */
export function stopSpeaking() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Get available voices
 */
export function getAvailableVoices() {
    return new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();

        if (voices.length) {
            resolve(voices);
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                resolve(voices);
            };
        }
    });
}

/**
 * Predefined messages for common scenarios
 */
export const VOICE_MESSAGES = {
    WELCOME: 'Xin chào, chào mừng đến với bãi giữ xe',
    CHECKIN_SUCCESS: (plate, slot) => `Mời xe ${plate} vào bãi, vị trí ${slot}`,
    PARKING_FULL: 'Xin lỗi, bãi xe hiện đã đầy',
    CHECKOUT: (plate, fee) => `Xe ${plate}. Phí gửi là ${fee} đồng. Vui lòng quét mã QR`,
    PAYMENT_SUCCESS: 'Cảm ơn quý khách. Hẹn gặp lại',
    THEFT_ALERT: (slot) => `Cảnh báo! Xe tại vị trí ${slot} đang bị di chuyển trái phép`,
    CAR_FOUND: (slot) => `Xe của quý khách ở khu ${slot[0]}, ô số ${slot.slice(1)}`,
    CAR_NOT_FOUND: 'Không tìm thấy xe với biển số này'
};
