"""
Download License Plate Detection Model - Alternative Method
Uses public dataset without API key
"""

import urllib.request
import os
import shutil

print("🤖 Downloading License Plate Detection Model...")
print("📦 Using alternative public source...")

# Try downloading from GitHub releases or public links
model_urls = [
    # Option 1: Ultralytics pretrained on COCO (fallback)
    "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx",
    
    # Option 2: Could add more URLs if available
]

def download_file(url, filename):
    print(f"\n📥 Downloading from: {url}")
    try:
        urllib.request.urlretrieve(url, filename)
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

# Try each URL
model_downloaded = False
temp_file = "temp_model.onnx"

for url in model_urls:
    if download_file(url, temp_file):
        model_downloaded = True
        break

if not model_downloaded:
    print("\n❌ Could not download model automatically")
    print("\n📋 Manual steps:")
    print("1. Visit: https://universe.roboflow.com/mohamed-traore-2ekkp/license-plate-recognition-rxg4e")
    print("2. Click 'Download Dataset'")
    print("3. Select format: YOLOv8 ONNX")
    print("4. Save the .onnx file")
    print("5. Run this command:")
    print('   Copy-Item "Downloads\\model.onnx" "client\\public\\models\\yolov8n.onnx"')
    exit(1)

# Move to correct location
target_path = "client/public/models/yolov8n.onnx"

# Backup old model
if os.path.exists(target_path):
    backup_path = "client/public/models/yolov8n_backup.onnx"
    shutil.copy(target_path, backup_path)
    print(f"💾 Backed up old model to: {backup_path}")

# Copy new model
os.makedirs(os.path.dirname(target_path), exist_ok=True)
shutil.move(temp_file, target_path)

# Show file size
size_mb = os.path.getsize(target_path) / (1024 * 1024)
print(f"\n✅ Model installed to: {target_path}")
print(f"📦 Model size: {size_mb:.2f} MB")

print("\n🎉 SUCCESS!")
print("🔄 Reload your app: http://localhost:5173")
print("\nℹ️  Note: This is YOLOv8n general model.")
print("   For better accuracy, manually download license plate specific model from Roboflow.")
