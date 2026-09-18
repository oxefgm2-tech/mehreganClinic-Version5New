@echo off
chcp 65001 >nul
title کلاینت پذیرش کلینیک اختصاصی حیوانات خانگی مهرگان (اتصال به سرور مرکزی VPS)

echo ====================================================================
echo    🐾 کلاینت دسکتاپ ویندوز - کلینیک اختصاصی حیوانات خانگی مهرگان
echo    Mehregan Veterinary Clinic - Windows Client Launcher
echo    (اتصال مستقیم به سرور مرکزی VPS و دستگاه‌های محلی)
echo ====================================================================
echo.

:: ۱. بررسی فایل تنظیمات نشانی سرور مرکزی
set CENTRAL_VPS_URL=
if exist ".env" (
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="VITE_API_BASE_URL" set CENTRAL_VPS_URL=%%b
    )
)

if "%CENTRAL_VPS_URL%"=="" (
    if exist "deploy.env" (
        for /f "tokens=1,2 delims==" %%a in (deploy.env) do (
            if "%%a"=="SERVER_IP" set CENTRAL_VPS_URL=http://%%b:3000
            if "%%a"=="DOMAIN_OR_IP" set CENTRAL_VPS_URL=https://%%b
        )
    )
)

if "%CENTRAL_VPS_URL%"=="" (
    echo [راهنما] نشانی سرور مرکزی VPS کلینیک در تنظیمات یافت نشد.
    echo لطفاً نشانی سرور یا دامنه VPS خود را وارد کنید (مثال: https://mehregan-vet.ir یا http://194.5.200.15:3000)
    set /p CENTRAL_VPS_URL="آدرس سرور VPS: "
    if not "%CENTRAL_VPS_URL%"=="" (
        echo VITE_API_BASE_URL=%CENTRAL_VPS_URL%>> .env
        echo [ذخیره] نشانی سرور در فایل .env ذخیره گردید.
    )
)

echo [تأیید] نشانی سرور مرکزی فعال: %CENTRAL_VPS_URL%
echo.

:: ۲. بررسی وجود بیلد فرانت‌اند
if not exist "dist\index.html" (
    echo [اطلاع] فایل‌های کلاینت هنوز کامپایل نشده‌اند. در حال اجرای بیلد اولیه (npm run build)...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo [خطا] کامپایل کلاینت ناموفق بود.
        pause
        exit /b 1
    )
)

:: ۳. راه‌اندازی کلاینت محلی روی پورت 3000
echo.
echo ====================================================================
echo 🚀 کلاینت با موفقیت آماده شد!
echo    سامانه به سرور مرکزی متصل است: %CENTRAL_VPS_URL%
echo    آدرس اجرای کلاینت محلی:        http://localhost:3000
echo ====================================================================
echo.

:: تلاش برای باز کردن در حالت نرم‌افزاری تمام‌صفحه با اج یا کروم
where msedge >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start msedge --app=http://localhost:3000
) else (
    where chrome >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        start chrome --app=http://localhost:3000
    ) else (
        start http://localhost:3000
    )
)

set PORT=3000
set NODE_ENV=production
node dist\server.cjs

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo کلاینت متوقف شد.
    pause
)
