# Clean UI - Remove Emoji Icons from all files
# This script removes emoji icons from JSX files

import re
import os

files_to_clean = [
    'client/src/pages/HomePage.jsx',
    'client/src/pages/CustomerPortal.jsx',
    'client/src/pages/AdminPortal.jsx',
    'client/src/components/ParkingMap.jsx',
    'client/src/components/FindCarPanel.jsx',
    'client/src/components/Dashboard.jsx',
    'client/src/components/CheckoutPanel.jsx',
    'client/src/components/CameraFeed.jsx',
    'client/src/components/AttendancePanel.jsx',
]

# Emoji patterns to remove  
emoji_patterns = [
    r'🚗\s*',
    r'🔐\s*',
    r'👤\s*',
    r'💳\s*',
    r'🔍\s*',
    r'📊\s*',
    r'⏰\s*',
    r'🅿️\s*',
    r'✍️\s*',
    r'🤖\s*',
    r'📹\s*',
    r'⏳\s*',
    r'✅\s*',
    r'❌\s*',
    r'🔓\s*',
    r'💡\s*',
    r'➕\s*',
    r'✏️\s*',
    r'🗑️\s*',
    r'🎯\s*',
    r'🔄\s*',
    r'🗺️\s*',
]

for file_path in files_to_clean:
    if not os.path.exists(file_path):
        print(f"⚠️  Skipping {file_path} (not found)")
        continue
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Remove all emojis
        for pattern in emoji_patterns:
            content = re.sub(pattern, '', content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Cleaned: {file_path}")
        else:
            print(f"✓  No changes: {file_path}")
    
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")

print("\n🎉 UI Cleanup Complete!")
print("All emoji icons have been removed from JSX files.")
