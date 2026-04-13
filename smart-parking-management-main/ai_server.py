"""
🤖 AI Server - Python Backend for License Plate Recognition
Sử dụng: YOLOv8 (phát hiện biển số) + EasyOCR (đọc ký tự)
Chạy: python ai_server.py
Port: 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
import easyocr
import cv2
import numpy as np
import base64
import re
import os

app = FastAPI(title="Parking AI Server", version="2.0.0")

# =====================================================
# CORS - Cho phép ReactJS (port 5173) gọi sang đây
# =====================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# Load Models khi khởi động server
# =====================================================
print("🔄 Đang tải mô hình AI... (Lần đầu có thể mất 1-2 phút)")

# Tìm YOLO model (ưu tiên file .onnx, sau đó .pt)
YOLO_MODEL_PATHS = [
    "client/public/models/yolov8n.onnx",
    "yolov8n.pt",
]

yolo_model = None
for path in YOLO_MODEL_PATHS:
    if os.path.exists(path):
        print(f"✅ Tìm thấy YOLO model tại: {path}")
        try:
            yolo_model = YOLO(path)
            print("✅ YOLO model đã sẵn sàng!")
            break
        except Exception as e:
            print(f"⚠️ Không tải được {path}: {e}")

if yolo_model is None:
    print("⚠️ Không tìm thấy YOLO model. Chạy ở chế độ OCR toàn ảnh.")

# Tải EasyOCR (lần đầu sẽ tự download ~100MB data tiếng Anh)
print("🔄 Đang khởi động EasyOCR...")
try:
    reader = easyocr.Reader(['en'], gpu=False)  # Đổi gpu=True nếu có card đồ họa rời
    print("✅ EasyOCR đã sẵn sàng!")
except Exception as e:
    print(f"❌ Lỗi khởi động EasyOCR: {e}")
    reader = None


# =====================================================
# Data Models
# =====================================================
class ImageData(BaseModel):
    image_base64: str


# =====================================================
# Utility Functions
# =====================================================
def decode_base64_image(image_base64: str) -> np.ndarray:
    """Giải mã ảnh từ chuỗi Base64"""
    # Xóa header nếu có (data:image/jpeg;base64,...)
    if ',' in image_base64:
        image_base64 = image_base64.split(',')[1]
    
    nparr = np.frombuffer(base64.b64decode(image_base64), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


def preprocess_for_ocr(img: np.ndarray) -> np.ndarray:
    """Tiền xử lý ảnh để tăng độ chính xác OCR"""
    # Tăng kích thước nếu quá nhỏ
    h, w = img.shape[:2]
    if w < 200:
        scale = 200 / w
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # Chuyển sang grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Tăng contrast bằng CLAHE
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    
    # Giảm noise nhẹ
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    
    # Threshold thích ứng
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    
    return binary


def clean_plate_text(text: str) -> str:
    """Làm sạch và chuẩn hóa chuỗi biển số Việt Nam"""
    # Chỉ giữ chữ và số
    cleaned = re.sub(r'[^0-9A-Za-z]', '', text).upper()
    
    # Sửa các lỗi OCR phổ biến
    # (chỉ sửa ở vị trí số - không sửa ký tự chữ cái)
    corrections = {
        'O': '0',  # Chữ O -> số 0 (ở vị trí số)
        'I': '1',  # Chữ I -> số 1
        'Z': '2',  # Chữ Z -> số 2
        'S': '5',  # Chữ S -> số 5
    }
    
    return cleaned


def format_vietnamese_plate(text: str) -> str:
    """Format biển số Việt Nam chuẩn: 59-P1 123.45"""
    cleaned = re.sub(r'[^0-9A-Z]', '', text.upper())
    
    # Pattern Việt Nam: 2 số + 1 chữ + 1 số + 5 số
    match = re.match(r'^(\d{2})([A-Z])(\d)(\d{3})(\d{2})$', cleaned)
    if match:
        return f"{match.group(1)}-{match.group(2)}{match.group(3)} {match.group(4)}.{match.group(5)}"
    
    # Biển 8 số: 2 số + 1 chữ + 1 số + 4 số
    match2 = re.match(r'^(\d{2})([A-Z])(\d)(\d{4})$', cleaned)
    if match2:
        return f"{match2.group(1)}-{match2.group(2)}{match2.group(3)} {match2.group(4)}"
    
    return cleaned


def merge_ocr_texts(results: list) -> str:
    """Ghép các đoạn văn bản từ EasyOCR theo thứ tự từ trái sang phải"""
    if not results:
        return ""
    
    # Sắp xếp theo tọa độ X (từ trái sang phải)
    sorted_results = sorted(results, key=lambda x: x[0][0][0])
    
    texts = [res[1] for res in sorted_results if res[2] > 0.3]  # Lọc confidence > 30%
    return " ".join(texts)


# =====================================================
# API Endpoints
# =====================================================
@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "🤖 Parking AI Server - Python Backend",
        "version": "2.0.0",
        "yolo_ready": yolo_model is not None,
        "ocr_ready": reader is not None,
        "port": 8000
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "yolo_model": yolo_model is not None,
        "ocr_engine": reader is not None,
    }


@app.post("/api/recognize")
async def recognize_plate(data: ImageData):
    """
    Endpoint chính: Nhận ảnh Base64, trả về biển số xe
    """
    if reader is None:
        raise HTTPException(status_code=503, detail="EasyOCR chưa sẵn sàng")

    try:
        # ---- Bước 1: Giải mã ảnh ----
        img = decode_base64_image(data.image_base64)
        if img is None:
            raise HTTPException(status_code=400, detail="Không thể đọc ảnh")

        plate_img = img  # Mặc định dùng toàn bộ ảnh

        # ---- Bước 2: YOLO phát hiện vùng biển số ----
        detected_by_yolo = False
        if yolo_model is not None:
            results = yolo_model(img, verbose=False)[0]
            boxes = results.boxes

            if boxes is not None and len(boxes) > 0:
                # Lấy box có confidence cao nhất
                confidences = boxes.conf.cpu().numpy()
                best_idx = np.argmax(confidences)
                best_conf = float(confidences[best_idx])

                if best_conf > 0.3:
                    xyxy = boxes.xyxy[best_idx].cpu().numpy().astype(int)
                    x1, y1, x2, y2 = xyxy

                    # Thêm padding 5% xung quanh vùng phát hiện
                    h, w = img.shape[:2]
                    pad_x = int((x2 - x1) * 0.05)
                    pad_y = int((y2 - y1) * 0.05)
                    x1 = max(0, x1 - pad_x)
                    y1 = max(0, y1 - pad_y)
                    x2 = min(w, x2 + pad_x)
                    y2 = min(h, y2 + pad_y)

                    plate_img = img[y1:y2, x1:x2]
                    detected_by_yolo = True
                    print(f"🎯 YOLO phát hiện biển số (conf: {best_conf:.2f})")

        if not detected_by_yolo:
            print("ℹ️ Không tìm thấy biển số qua YOLO, dùng toàn ảnh")

        # ---- Bước 3: Tiền xử lý ảnh cho OCR ----
        processed = preprocess_for_ocr(plate_img)

        # ---- Bước 4: EasyOCR đọc ký tự ----
        # Thử đọc trên ảnh đã xử lý
        ocr_results = reader.readtext(processed, detail=1, paragraph=False)
        
        # Nếu không đọc được, thử trên ảnh gốc (màu)
        if not ocr_results:
            ocr_results = reader.readtext(plate_img, detail=1, paragraph=False)

        if not ocr_results:
            return {
                "plate": None,
                "confidence": 0,
                "message": "Tìm thấy vùng biển số nhưng không đọc được ký tự" if detected_by_yolo else "Không phát hiện biển số",
                "yolo_detected": detected_by_yolo,
                "raw_texts": []
            }

        # ---- Bước 5: Xử lý kết quả OCR ----
        # Lấy text có confidence cao
        high_conf_texts = [
            (res[1], float(res[2])) for res in ocr_results if float(res[2]) > 0.3
        ]
        
        raw_text = merge_ocr_texts(ocr_results)
        print(f"📝 OCR raw text: '{raw_text}'")

        # Làm sạch và ghép
        combined = "".join([t[0] for t in high_conf_texts])
        cleaned = clean_plate_text(combined)
        avg_confidence = sum(t[1] for t in high_conf_texts) / len(high_conf_texts) if high_conf_texts else 0

        if not cleaned or len(cleaned) < 5:
            return {
                "plate": None,
                "confidence": 0,
                "message": f"Đọc được text nhưng không hợp lệ: '{raw_text}'",
                "yolo_detected": detected_by_yolo,
                "raw_texts": [r[1] for r in ocr_results]
            }

        # ---- Bước 6: Format biển số chuẩn Việt Nam ----
        formatted_plate = format_vietnamese_plate(cleaned)
        final_confidence = min(avg_confidence * (1.1 if detected_by_yolo else 0.9), 0.98)

        print(f"✅ Kết quả: {formatted_plate} (conf: {final_confidence:.2f})")

        return {
            "plate": formatted_plate,
            "confidence": round(final_confidence, 3),
            "message": "Thành công",
            "yolo_detected": detected_by_yolo,
            "raw_texts": [r[1] for r in ocr_results]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Lỗi xử lý: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý: {str(e)}")


# =====================================================
# Main Entry Point
# =====================================================
if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*55)
    print("🚗 PARKING AI SERVER - Python Backend")
    print("="*55)
    print("📡 URL: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    print("🔧 API: POST http://localhost:8000/api/recognize")
    print("="*55 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
