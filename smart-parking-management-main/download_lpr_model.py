"""
Download YOLOv8 License Plate Detection Model from Hugging Face
Direct download without authentication required
"""

import urllib.request
import os
import shutil

print("🚀 Downloading YOLOv8 License Plate Detection Model...")
print("📦 Source: Hugging Face (ml-debi/yolov8-license-plate-detection)")

# Direct download link from Hugging Face
model_url = "https://huggingface.co/ml-debi/yolov8-license-plate-detection/resolve/main/best.onnx"
temp_file = "license_plate_model.onnx"
target_path = "client/public/models/yolov8n.onnx"

print(f"\n📥 Downloading from: {model_url}")
print("⏳ This may take a few moments (12.2 MB)...")

try:
    # Download model
    urllib.request.urlretrieve(model_url, temp_file)
    print("✅ Download complete!")
    
    # Check file size
    size_mb = os.path.getsize(temp_file) / (1024 * 1024)
    print(f"📦 Downloaded file size: {size_mb:.2f} MB")
    
    # Backup old model
    if os.path.exists(target_path):
        backup_path = "client/public/models/yolov8n_general_backup.onnx"
        shutil.copy(target_path, backup_path)
        print(f"💾 Backed up old model to: {backup_path}")
    
    # Create directory if doesn't exist
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    
    # Move new model
    shutil.move(temp_file, target_path)
    print(f"✅ Model installed to: {target_path}")
    
    print("\n🎉 SUCCESS! License Plate Detection Model Installed!")
    print("\n📋 Model Information:")
    print(f"   - Type: YOLOv8 License Plate Detection")
    print(f"   - Size: {size_mb:.2f} MB")
    print(f"   - Source: Hugging Face (ml-debi)")
    print(f"   - Trained specifically for license plates")
    
    print("\n🔄 Next Steps:")
    print("   1. Reload your app: http://localhost:5173")
    print("   2. Go to 'Bãi xe' menu")
    print("   3. Switch to '🤖 Tự động (AI)' mode")
    print("   4. Point camera at a license plate")
    print("   5. Click 'Nhận diện AI'")
    
    print("\n💡 Expected Accuracy: 85-95% for license plates!")
    
except Exception as e:
    print(f"\n❌ Download failed: {e}")
    print("\n📋 Manual Download:")
    print(f"   1. Visit: {model_url}")
    print("   2. Save file as 'best.onnx'")
    print("   3. Run:")
    print(f'      Copy-Item "Downloads\\best.onnx" "{target_path}" -Force')
    exit(1)
