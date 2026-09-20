@echo off
chcp 65001 >nul
title سامانه کلینیک اختصاصی حیوانات خانگی مهرگان - سرور محلی ویندوز

echo ====================================================================
echo    🐾 راه‌اندازی سامانه یکپارچه کلینیک اختصاصی حیوانات خانگی مهرگان (نسخه ویندوز)
echo    Mehregan Veterinary Clinic - Windows Local Server Launcher
echo ====================================================================
echo.

:: ۱. بررسی نصب بودن Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [خطا] موتور Node.js روی این سیستم نصب نیست یا در PATH قرار ندارد!
    echo لطفاً Node.js نسخه 20 LTS را از وب‌سایت رسمی دانلود و نصب فرمایید:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [تأیید] نسخه Node.js شناسایی شد: %NODE_VER%

:: ۲. بررسی پوشه وابستگی‌های npm
if not exist "node_modules\" (
    echo.
    echo [اطلاع] پکیج‌های پیش‌نیاز یافت نشدند. در حال نصب خودکار وابستگی‌ها (npm install)...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [خطا] نصب وابستگی‌ها با مشکل مواجه شد. لطفاً اتصال اینترنت خود را بررسی کنید.
        pause
        exit /b 1
    )
)

:: ۳. بررسی و کامپایل بیلد پروداکشن در صورت نیاز
if not exist "dist\server.cjs" (
    echo.
    echo [اطلاع] در حال کامپایل پروژه برای حالت پروداکشن (npm run build)...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo [خطا] کامپایل پروژه ناموفق بود!
        pause
        exit /b 1
    )
    echo [تأیید] کامپایل بیلد پروداکشن با موفقیت انجام شد.
)

:: ۴. استخراج آی‌پی لوکال شبکه جهت اتصال تبلت‌ها و گوشی‌ها
set LOCAL_IP=127.0.0.1
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"آدرس IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
    )
)

echo.
echo ====================================================================
echo 🚀 سرور با موفقیت آماده اجراست:
echo    دسترسی روی این رایانه:   http://localhost:3000
echo    دسترسی تبلت‌ها و موبایل: http://%LOCAL_IP%:3000
echo ====================================================================
echo.
echo در حال باز کردن مرورگر پیش‌فرض...
start http://localhost:3000

echo.
echo [توجه] برای توقف سرور می‌توانید کلیدهای Ctrl+C را در این پنجره فشار دهید.
echo ====================================================================
echo.

set PORT=3000
set NODE_ENV=production
node dist\server.cjs

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo سرور متوقف شد.
    pause
)
