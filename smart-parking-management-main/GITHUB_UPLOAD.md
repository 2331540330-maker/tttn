# Upload Dự án lên GitHub

## Bước 1: Chuẩn bị (Đã làm)
✅ File `.gitignore` đã được tạo
✅ README.md đã có

## Bước 2: Khởi tạo Git

Mở terminal trong thư mục dự án và chạy:

```bash
# Khởi tạo Git repository
git init

# Kiểm tra status
git status
```

## Bước 3: Add files và commit

```bash
# Add tất cả files (trừ những file trong .gitignore)
git add .

# Commit lần đầu
git commit -m "Initial commit: Smart Parking Management System v1.0.0"
```

## Bước 4: Tạo Repository trên GitHub

1. Truy cập: https://github.com/new
2. Điền thông tin:
   - **Repository name:** `smart-parking-management`
   - **Description:** AI-Powered Parking System với License Plate Recognition
   - **Public** hoặc **Private**
   - ❌ **KHÔNG** tick "Add README" (đã có rồi)
3. Click **Create repository**

## Bước 5: Link local repo với GitHub

GitHub sẽ hiển thị các lệnh, copy và chạy:

```bash
# Thêm remote origin
git remote add origin https://github.com/YOUR_USERNAME/smart-parking-management.git

# Đổi tên branch sang main (nếu cần)
git branch -M main

# Push lên GitHub
git push -u origin main
```

**Thay `YOUR_USERNAME` bằng username GitHub của bạn**

## Bước 6: Push thành công!

Refresh trang GitHub, dự án của bạn đã được upload! 🎉

---

## Các lệnh Git hữu ích

```bash
# Xem status
git status

# Add file mới
git add filename.js

# Add tất cả thay đổi
git add .

# Commit
git commit -m "Your message"

# Push
git push

# Pull changes
git pull

# Xem lịch sử commit
git log --oneline
```

---

## Lưu ý quan trọng

⚠️ **KHÔNG commit:**
- `.env` file (chứa secrets)
- `node_modules/` (vì quá lớn)
- AI models `*.pt`, `*.onnx` (quá lớn)

✅ **ĐÃ được .gitignore tự động loại bỏ**

---

## Nếu gặp lỗi

### Lỗi: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/smart-parking-management.git
```

### Lỗi: "failed to push"
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## Clone dự án (cho người khác)

```bash
git clone https://github.com/YOUR_USERNAME/smart-parking-management.git
cd smart-parking-management
npm install
cd client && npm install
cd ../server && npm install
```

---

## Cập nhật sau này

```bash
# Sau khi sửa code
git add .
git commit -m "Mô tả thay đổi"
git push
```
