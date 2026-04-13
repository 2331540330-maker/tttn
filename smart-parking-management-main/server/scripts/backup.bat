@echo off
echo ========================================
echo MongoDB Backup Script
echo ========================================
echo.

set BACKUP_DIR=backups
set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_PATH=%BACKUP_DIR%\parking_db_%TIMESTAMP%

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

echo [+] Starting backup...
echo [+] Backup location: %BACKUP_PATH%
echo.

mongodump --db parking_db --out %BACKUP_PATH%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [✓] Backup completed successfully!
    echo [+] Saved to: %BACKUP_PATH%
) else (
    echo.
    echo [X] Backup failed!
)

echo.
pause
