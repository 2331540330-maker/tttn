import { useState } from 'react';
import './ParkingMap.css';

function ParkingMap({ slots, surveillanceSlot = 'C3' }) {
    const [highlightedSlot, setHighlightedSlot] = useState(null);

    // Group slots by row
    const groupedSlots = slots.reduce((acc, slot) => {
        const row = slot.slotId[0];
        if (!acc[row]) acc[row] = [];
        acc[row].push(slot);
        return acc;
    }, {});

    const rows = Object.keys(groupedSlots).sort();

    return (
        <div className="parking-map card">
            <div className="map-header">
                <h2>Bản đồ Bãi xe 2D</h2>
                <div className="legend">
                    <div className="legend-item">
                        <div className="legend-color empty"></div>
                        <span>Trống</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color occupied"></div>
                        <span>Có xe</span>
                    </div>
                </div>
            </div>

            <div className="map-grid">
                {rows.map(row => (
                    <div key={row} className="parking-row">
                        <div className="row-label">{row}</div>
                        <div className="row-slots">
                            {groupedSlots[row]
                                .sort((a, b) => {
                                    const numA = parseInt(a.slotId.slice(1));
                                    const numB = parseInt(b.slotId.slice(1));
                                    return numA - numB;
                                })
                                .map(slot => (
                                    <div
                                        key={slot.slotId}
                                        className={`parking-slot ${slot.status} ${highlightedSlot === slot.slotId ? 'highlighted' : ''} ${slot.slotId === surveillanceSlot ? 'camera-slot' : ''}`}
                                        onClick={() => setHighlightedSlot(slot.slotId)}
                                        title={`${slot.slotId} - ${slot.status === 'empty' ? 'Trống' : slot.licensePlate}${slot.slotId === surveillanceSlot ? ' (📷 Camera quan sát)' : ''}`}
                                    >
                                        <div className="slot-id">
                                            {slot.slotId}
                                            {slot.slotId === surveillanceSlot && <span className="cam-icon">📷</span>}
                                        </div>
                                        {slot.status === 'occupied' && slot.licensePlate && (
                                            <div className="slot-plate">{slot.licensePlate}</div>
                                        )}
                                        {slot.status === 'occupied' && (
                                            <div className="slot-icon"></div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="map-stats">
                <div className="stat-item">
                    <span className="stat-label">Tổng ô:</span>
                    <span className="stat-value">{slots.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Đang sử dụng:</span>
                    <span className="stat-value success">
                        {slots.filter(s => s.status === 'occupied').length}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Còn trống:</span>
                    <span className="stat-value primary">
                        {slots.filter(s => s.status === 'empty').length}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ParkingMap;
