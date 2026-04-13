# AI Server - Hướng dẫn cài đặt & sử dụng

## Yêu cầu
- Python 3.8+ đã cài đặt
- pip (Python package manager)

## Cài đặt thư viện (chỉ cần làm 1 lần)

Mở PowerShell tại thư mục dự án và chạy:

```bash
pip install fastapi uvicorn ultralytics easyocr opencv-python python-multipart pydantic
```

> ⚠️ EasyOCR sẽ tự tải ~100MB dữ liệu tiếng Anh về máy trong lần chạy đầu tiên.

## Cách khởi động toàn bộ hệ thống

Mở **3 cửa sổ PowerShell** chạy song song:

### Terminal 1 - Backend Node.js (Database)
```bash
cd c:\Users\Admin\Downloads\Baixe
npm run dev
```

### Terminal 2 - AI Server Python
```bash
cd c:\Users\Admin\Downloads\Baixe
python ai_server.py
```
Chờ thấy dòng:
```
Uvicorn running on http://0.0.0.0:8000
```

### Terminal 3 - Frontend React
```bash
cd c:\Users\Admin\Downloads\Baixe\client
npm run dev
```

## Truy cập

| Dịch vụ | URL |
|---------|-----|
| Web App | http://localhost:5173 |
| Node.js API | http://localhost:5000 |
| Python AI API | http://localhost:8000 |
| AI API Docs | http://localhost:8000/docs |

## Test nhanh AI Server

Mở PowerShell và chạy:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Method GET
```

Kết quả mong đợi:
```json
{"status":"healthy","yolo_model":true,"ocr_engine":true}
```

## Lưu ý

- Nếu không có GPU → `reader = easyocr.Reader(['en'], gpu=False)` (đã cài sẵn)
- Nếu có GPU rời (NVIDIA) → đổi thành `gpu=True` trong `ai_server.py` để nhanh hơn 5-10x
- File YOLO model tìm theo thứ tự:
  1. `client/public/models/yolov8n.onnx`
  2. `yolov8n.pt` (ở thư mục gốc)
