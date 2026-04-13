// Calculate parking fee based on duration
export function calculateFee(durationMinutes) {
    const pricePerMinute = parseInt(process.env.PRICE_PER_MINUTE) || 50;

    if (durationMinutes <= 30) {
        return 2000; // First 30 minutes flat rate
    } else if (durationMinutes <= 120) {
        return 5000; // Up to 2 hours
    } else {
        // More than 2 hours: 5000 base + 3000 per extra hour
        const extraHours = Math.ceil((durationMinutes - 120) / 60);
        return 5000 + (extraHours * 3000);
    }
}

// Format duration for display
export function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
        return `${mins} phút`;
    } else if (mins === 0) {
        return `${hours} giờ`;
    } else {
        return `${hours} giờ ${mins} phút`;
    }
}
