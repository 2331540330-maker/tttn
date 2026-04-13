# 🚗 Smart Parking Management System

> AI-Powered Parking System với License Plate Recognition, Real-time Monitoring, và Advanced Analytics

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Tính năng](#-tính-năng)
- [Công nghệ](#-công-nghệ-sử-dụng)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#️-cấu-hình)
- [Sử dụng](#-sử-dụng)
- [API Documentation](#-api-documentation)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## 🎯 Tổng quan

**Smart Parking Management System** là hệ thống quản lý bãi xe thông minh tích hợp AI, cho phép:

- ✅ Nhận diện biển số xe tự động (License Plate Recognition)
- ✅ Quản lý check-in/check-out real-time
- ✅ Hệ thống chấm công nhân viên
- ✅ Cảnh báo an ninh thông minh
- ✅ Báo cáo phân tích doanh thu
- ✅ Giao diện quản trị hiện đại

---

## ✨ Tính năng

### 🚘 Quản lý Bãi xe
- **Check-in/Check-out tự động** với AI biển số xe
- **Bản đồ bãi xe 2D** real-time hiển thị chỗ trống/đã đậu
- **Tìm kiếm xe** nhanh theo biển số
- **Quản lý slot** linh hoạt và trực quan

### 👥 Hệ thống Chấm công
- **CRUD nhân viên** đầy đủ (Thêm/Sửa/Xóa)
- **Check-in/Check-out** tự động hoặc thủ công
- **Tính toán tự động:**
  - Trạng thái đúng giờ/trễ (>15 phút)
  - Tổng giờ làm việc
  - Lịch sử chấm công
- **Phân quyền:** Admin, Manager, Employee
- **Login riêng** cho từng nhân viên

### 📊 Báo cáo & Phân tích
- **Dashboard thống kê** real-time
- **Phân tích giờ cao điểm** (AI powered)
- **Dự đoán lưu lượng** 7 ngày tới
- **Xuất báo cáo:**
  - Excel (.xlsx)
  - PDF
  - Báo cáo thuế VAT

### 🔐 Bảo mật & Xác thực
- **JWT Authentication**
- **Two-Factor Authentication (2FA)**
- **Role-based Access Control**
- **Rate Limiting** API
- **Helmet.js** security headers

### 🔔 Cảnh báo An ninh
- **Cảnh báo thời gian thực** qua Socket.IO
- **Email notifications**
- **Phát hiện bất thường:**
  - Xe đỗ quá lâu
  - Check-in/out lỗi
  - Hoạt động đáng ngờ

---

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** v18+ & Express.js
- **MongoDB** với Mongoose ODM
- **Socket.IO** - Real-time communication
- **ONNX Runtime** - AI License Plate Recognition
- **PDFKit** - PDF generation
- **ExcelJS** - Excel export
- **Nodemailer** - Email notifications
- **JWT** & bcrypt - Authentication
- **Helmet** - Security
- **Express Rate Limit** - DDoS protection

### Frontend
- **React** 18 với Vite
- **React Router** v6
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client
- **Chart.js** - Data visualization
- **File Saver** - Export functionality

### AI & ML
- **ONNX Runtime Web** - Browser-based inference
- **YOLOv8** - License plate detection
- **Simple Statistics** - Analytical predictions

---

## 📦 Cài đặt

### Yêu cầu hệ thống
- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm hoặc yarn
- 2GB RAM minimum
- 10GB disk space

### Bước 1: Clone dự án
```bash
git clone <repository-url>
cd Baixe
```

### Bước 2: Cài đặt dependencies

**Cài đặt tất cả (Root + Client + Server):**
```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### Bước 3: Cấu hình môi trường

Tạo file `.env` trong thư mục root:
```env
# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/parking-system

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Email (Optional - cho notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Redis (Optional - cho caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Bước 4: Download AI Models

```bash
# Download YOLOv8 model
python download_model.py

# Download License Plate Recognition model
python download_lpr_model.py
```

### Bước 5: Khởi động dự án

**Development mode (tất cả cùng lúc):**
```bash
npm run dev
```

**Hoặc chạy riêng:**
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

---

## ⚙️ Cấu hình

### Database Setup

1. **Cài đặt MongoDB:**
```bash
# Windows (with Chocolatey)
choco install mongodb

# macOS
brew install mongodb-community

# Linux
sudo apt install mongodb
```

2. **Khởi động MongoDB:**
```bash
mongod --dbpath /path/to/data
```

3. **Seed initial data (Optional):**
```bash
cd server
node scripts/seedData.js
```

### Port Configuration

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **MongoDB:** mongodb://localhost:27017

### Environment Variables

Xem file `.env.example` để biết tất cả options có sẵn.

---

## 🚀 Sử dụng

### 1. Đăng nhập Admin

**Default Admin Account:**
- URL: `http://localhost:5173/admin/login`
- Username: `admin`
- Password: `admin123`

### 2. Đăng nhập Nhân viên

- URL: `http://localhost:5173/employee/login`
- Use credentials created by Admin

### 3. Chức năng chính

#### **Admin Portal:**
1. **Bãi xe** - Xem map và quản lý slots
2. **Check-out** - Xử lý thanh toán
3. **Tìm xe** - Search theo biển số
4. **Thống kê** - Dashboard analytics
5. **Chấm công** - Quản lý nhân viên
6. **Báo cáo** - Export Excel/PDF
7. **Cảnh báo** - Xem alerts real-time

#### **Employee Portal:**
1. **Check-in** - Bắt đầu ca làm
2. **Check-out** - Kết thúc ca
3. **Xem lịch sử** - Attendance history

---

## 📚 API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "fullName": "Nguyen Van A",
  "role": "employee"
}
```

### Parking Management

#### Check-in Vehicle
```http
POST /api/checkin
Content-Type: application/json

{
  "licensePlate": "59-P1 123.45",
  "slotId": "A1",
  "vehicleType": "car"
}
```

#### Check-out Vehicle
```http
POST /api/checkout
Content-Type: application/json

{
  "licensePlate": "59-P1 123.45"
}
```

#### Get Parking Slots
```http
GET /api/parking/slots
```

#### Find Vehicle
```http
GET /api/parking/find?licensePlate=59-P1%20123.45
```

### Attendance Management

#### Check-in Employee
```http
POST /api/attendance/checkin
Content-Type: application/json

{
  "userId": "user_id_here"
}
```

#### Check-out Employee
```http
POST /api/attendance/checkout
Content-Type: application/json

{
  "userId": "user_id_here"
}
```

#### Manual Attendance Entry (Admin)
```http
POST /api/attendance/manual
Content-Type: application/json

{
  "userId": "user_id_here",
  "checkInTime": "2026-01-16T08:00:00Z",
  "checkOutTime": "2026-01-16T17:00:00Z"
}
```

### Reports

#### Export Revenue Report
```http
GET /api/reports/revenue/export?format=pdf&range=month
```

**Parameters:**
- `format`: `excel` | `pdf`
- `range`: `today` | `week` | `month`

#### Get Statistics Overview
```http
GET /api/reports/overview
```

#### Get Peak Hours Analysis
```http
GET /api/reports/peak-hours?range=week
```

#### Get Traffic Predictions
```http
GET /api/reports/predictions?days=7
```

---

## 📁 Cấu trúc dự án

```
Baixe/
├── client/                  # React Frontend
│   ├── public/
│   │   └── clear-cache.html
│   ├── src/
│   │   ├── components/      # React Components
│   │   │   ├── AttendancePanel.jsx
│   │   │   ├── CameraFeed.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FindCarPanel.jsx
│   │   │   ├── ParkingMap.jsx
│   │   │   └── ...
│   │   ├── pages/           # Page Components
│   │   │   ├── AdminPortal.jsx
│   │   │   ├── EmployeeLogin.jsx
│   │   │   ├── EmployeeAttendance.jsx
│   │   │   └── ...
│   │   ├── services/        # API Services
│   │   ├── utils/           # Utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                  # Node.js Backend
│   ├── models/              # Mongoose Models
│   │   ├── Attendance.js
│   │   ├── History.js
│   │   ├── ParkingSlot.js
│   │   ├── SecurityAlert.js
│   │   ├── TwoFactorAuth.js
│   │   └── User.js
│   ├── routes/              # Express Routes
│   │   ├── attendance.js
│   │   ├── auth.js
│   │   ├── checkin.js
│   │   ├── checkout.js
│   │   ├── parking.js
│   │   ├── reports.js
│   │   ├── stats.js
│   │   └── users.js
│   ├── services/            # Business Logic
│   │   ├── reportGenerator.js
│   │   ├── simplePDF.js
│   │   └── mlPredictor.js
│   ├── middleware/          # Express Middleware
│   ├── jobs/                # Cron Jobs
│   └── server.js            # Entry Point
│
├── .env                     # Environment Variables
├── .env.example             # Example ENV file
├── package.json             # Root Dependencies
├── README.md                # This file
└── yolov8n.pt              # AI Model
```

---

## 🔧 Troubleshooting

### Lỗi thường gặp

#### 1. MongoDB Connection Error
```bash
❌ MongoDB connection error: MongoServerError
```
**Giải pháp:**
- Kiểm tra MongoDB đã chạy: `mongod --version`
- Kiểm tra connection string trong `.env`
- Restart MongoDB service

#### 2. Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::5000
```
**Giải pháp:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

#### 3. Module Not Found
```bash
Error: Cannot find module 'express'
```
**Giải pháp:**
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 4. Cache Issues (UI không cập nhật)
**Giải pháp:**
1. Mở DevTools (F12)
2. Application tab → Clear storage
3. Hoặc truy cập: `http://localhost:5173/clear-cache.html`

#### 5. PDF Export Error
**Giải pháp:**
- Server restart: Ctrl+C, `npm run dev`
- Check logs trong console
- Verify `pdfkit` đã cài: `npm list pdfkit`

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 Changelog

### v1.0.0 (2026-01-16)
- ✅ Initial release
- ✅ Complete attendance system
- ✅ Employee management with CRUD
- ✅ Manual attendance entry
- ✅ PDF/Excel export
- ✅ Security improvements
- ✅ Bug fixes and optimizations

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Smart Parking System Team**

- 📧 Email: support@smartparking.com
- 🌐 Website: https://smartparking.com
- 📱 Support: +84 xxx xxx xxx

---

## 🙏 Acknowledgments

- YOLOv8 by Ultralytics
- React Team
- MongoDB Team
- All contributors

---

**⭐ Nếu project hữu ích, đừng quên star repo!**
