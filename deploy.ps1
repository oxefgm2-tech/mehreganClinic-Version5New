# ====================================================================
# VetClinic Pro - اسکریپت خودکار دیپلوی از ویندوز به اوبونتو ۲۲.۰۴ (Ubuntu 22.04 LTS)
# زبان: PowerShell (سازگار با ویندوز ۱۰ و ۱۱ و سرور)
# ====================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   🚀 آغاز دیپلوی خودکار از ویندوز به لینوکس اوبونتو ۲۲.۰۴   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

# ۱. بارگذاری فایل متغیرهای محیطی deploy.env
$EnvFile = Join-Path $PSScriptRoot "deploy.env"
if (-not (Test-Path $EnvFile)) {
    $EnvExample = Join-Path $PSScriptRoot "deploy.env.example"
    if (Test-Path $EnvExample) {
        Copy-Item $EnvExample $EnvFile
        Write-Host "⚠️ فایل deploy.env یافت نشد؛ یک نمونه از روی deploy.env.example ساخته شد." -ForegroundColor Yellow
        Write-Host "لطفاً ابتدا آدرس SERVER_IP و مشخصات سرور را در deploy.env تکمیل کرده و سپس اسکریپت را مجدداً اجرا کنید." -ForegroundColor Red
        Exit 1
    } else {
        Write-Host "❌ خطا: فایل تنظیمات deploy.env موجود نیست." -ForegroundColor Red
        Exit 1
    }
}

# خواندن امن تنظیمات
$Config = @{}
Get-Content $EnvFile -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line.Split("=", 2)
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            $Config[$key] = $val
        }
    }
}

$ServerIP     = $Config["SERVER_IP"]
$ServerPort   = if ($Config["SERVER_PORT"]) { $Config["SERVER_PORT"] } else { "22" }
$ServerUser   = if ($Config["SERVER_USER"]) { $Config["SERVER_USER"] } else { "root" }
$RemoteAppDir = if ($Config["REMOTE_APP_DIR"]) { $Config["REMOTE_APP_DIR"] } else { "/var/www/vetclinic" }
$AppPort      = if ($Config["APP_PORT"]) { $Config["APP_PORT"] } else { "3000" }
$GeminiApiKey = if ($Config["GEMINI_API_KEY"]) { $Config["GEMINI_API_KEY"] } else { "" }
$DomainName   = if ($Config["DOMAIN_OR_IP"]) { $Config["DOMAIN_OR_IP"] } else { "_" }

if (-not $ServerIP -or $ServerIP -eq "192.168.1.100") {
    Write-Host "❌ لطفاً آدرس واقعی SERVER_IP سرور را در فایل deploy.env وارد فرمایید." -ForegroundColor Red
    Exit 1
}

Write-Host "📡 سرور مقصد: ${ServerUser}@${ServerIP}:${ServerPort}" -ForegroundColor Yellow
Write-Host "📂 مسیر نصب در سرور: ${RemoteAppDir}" -ForegroundColor Yellow
Write-Host "🌐 پورت برنامه: ${AppPort}" -ForegroundColor Yellow

# ۲. ساخت پکیج فشرده پروژه
$ArchivePath = Join-Path $env:TEMP "vetclinic-release.tar.gz"
if (Test-Path $ArchivePath) { Remove-Item $ArchivePath -Force }

Write-Host "📦 در حال ساخت بسته فشرده پروژه..." -ForegroundColor Cyan

# بررسی وجود tar در ویندوز (ویندوز ۱۰ و ۱۱ به صورت پیش‌فرض دارند)
$hasTar = Get-Command "tar.exe" -ErrorAction SilentlyContinue
if ($hasTar) {
    & tar.exe --exclude="node_modules" --exclude="dist" --exclude=".git" --exclude="*.tar.gz" --exclude="*.zip" -czf $ArchivePath -C $PSScriptRoot .
} else {
    $ZipFallback = Join-Path $env:TEMP "vetclinic-release.zip"
    if (Test-Path $ZipFallback) { Remove-Item $ZipFallback -Force }
    $items = Get-ChildItem -Path $PSScriptRoot | Where-Object { $_.Name -notin @("node_modules", "dist", ".git") -and $_.Extension -notin @(".zip", ".tar", ".gz") }
    Compress-Archive -Path $items.FullName -DestinationPath $ZipFallback -Force
    $ArchivePath = $ZipFallback
}

$archiveSize = [Math]::Round((Get-Item $ArchivePath).Length / 1MB, 2)
Write-Host "✅ بسته پروژه با حجم $archiveSize مگابایت آماده شد." -ForegroundColor Green

# ۳. ارسال بسته به سرور لینوکس
Write-Host "📤 در حال ارسال فایل به سرور لینوکس با SCP..." -ForegroundColor Cyan
scp -P $ServerPort -o StrictHostKeyChecking=no $ArchivePath "${ServerUser}@${ServerIP}:/tmp/vetclinic-release.tar.gz"
Remove-Item $ArchivePath -Force

# ۴. اجرای پیکربندی کامل، بیلد و فعال‌سازی در سرور
Write-Host "⚙️ در حال اجرای فرآیند استقرار در اوبونتو ۲۲.۰۴..." -ForegroundColor Cyan

$RemoteScript = @"
#!/usr/bin/env bash
set -eo pipefail

APP_DIR="${RemoteAppDir}"
APP_PORT="${AppPort}"
SERVER_USER="${ServerUser}"
DOMAIN="${DomainName}"
GEMINI_KEY="${GeminiApiKey}"

echo "=== [۱/۶] نصب پکیج‌های پایه‌ای سیستم‌عامل ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl wget git unzip tar build-essential ca-certificates gnupg nginx ufw

echo "=== [۲/۶] بررسی و نصب Node.js v20 LTS ==="
NODE_NEEDS_INSTALL=false
if ! command -v node &> /dev/null; then
    NODE_NEEDS_INSTALL=true
else
    NODE_VER=`$(node -v | tr -d 'v' | cut -d'.' -f1)
    if [ "`$NODE_VER" -lt 18 ]; then
        NODE_NEEDS_INSTALL=true
    fi
fi

if [ "`$NODE_NEEDS_INSTALL" = true ]; then
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
    apt-get update -qq
    apt-get install -y -qq nodejs
fi

NODE_EXEC=`$(which node)
NPM_EXEC=`$(which npm)
echo "Node.js: `$(`$NODE_EXEC -v) | npm: `$(`$NPM_EXEC -v)"

echo "=== [۳/۶] استخراج پروژه در `$APP_DIR ==="
mkdir -p "`$APP_DIR"
mkdir -p "`$APP_DIR/data"

if [ -f "`$APP_DIR/data/clinic_store.json" ]; then
    cp "`$APP_DIR/data/clinic_store.json" "/tmp/clinic_store.json.bak" || true
fi

if [ -f "/tmp/vetclinic-release.tar.gz" ]; then
    tar -xzf /tmp/vetclinic-release.tar.gz -C "`$APP_DIR"
    rm -f /tmp/vetclinic-release.tar.gz
elif [ -f "/tmp/vetclinic-release.zip" ]; then
    unzip -o /tmp/vetclinic-release.zip -d "`$APP_DIR"
    rm -f /tmp/vetclinic-release.zip
fi

if [ -f "/tmp/clinic_store.json.bak" ] && [ ! -f "`$APP_DIR/data/clinic_store.json" ]; then
    cp "/tmp/clinic_store.json.bak" "`$APP_DIR/data/clinic_store.json"
    rm -f "/tmp/clinic_store.json.bak"
fi

cat << EOF_ENV > "`$APP_DIR/.env"
PORT=`$APP_PORT
NODE_ENV=production
GEMINI_API_KEY=`$GEMINI_KEY
EOF_ENV

chown -R `$SERVER_USER:`$SERVER_USER "`$APP_DIR"
chmod -R 755 "`$APP_DIR"

echo "=== [۴/۶] نصب وابستگی‌ها و کامپایل بیلد پروداکشن ==="
cd "`$APP_DIR"
export NODE_ENV=development
`$NPM_EXEC install --include=dev --no-audit --no-fund
export NODE_ENV=production
`$NPM_EXEC run build

echo "=== [۵/۶] پیکربندی سرویس پایدار Systemd ==="
cat << EOF_SVC > /etc/systemd/system/vetclinic.service
[Unit]
Description=Mehregan Veterinary Clinic Management System
After=network.target

[Service]
Type=simple
User=`$SERVER_USER
WorkingDirectory=`$APP_DIR
ExecStart=`$NODE_EXEC `$APP_DIR/dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=`$APP_PORT
Environment=GEMINI_API_KEY=`$GEMINI_KEY

LimitNOFILE=65536
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vetclinic

[Install]
WantedBy=multi-user.target
EOF_SVC

systemctl daemon-reload
systemctl enable vetclinic
systemctl restart vetclinic

echo "=== [۶/۶] تنظیم Nginx و فایروال ==="
cat << EOF_NGX > /etc/nginx/sites-available/vetclinic
server {
    listen 80;
    server_name `$DOMAIN;

    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    location / {
        proxy_pass http://127.0.0.1:`$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_cache_bypass `$http_upgrade;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;

        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }
}
EOF_NGX

ln -sf /etc/nginx/sites-available/vetclinic /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp >/dev/null 2>&1 || true
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
    ufw allow `$APP_PORT/tcp >/dev/null 2>&1 || true
    ufw --force enable >/dev/null 2>&1 || true
fi

for i in {1..10}; do
    CODE=`$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:`$APP_PORT/api/health || echo "000")
    if [ "`$CODE" -eq 200 ]; then
        echo "✅ سرویس روی پورت `$APP_PORT فعال شد."
        break
    fi
    sleep 2
done
"@

$RemoteScriptUnix = $RemoteScript -replace "`r`n", "`n"
$Base64Command = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($RemoteScriptUnix))

ssh -p $ServerPort -o StrictHostKeyChecking=no "${ServerUser}@${ServerIP}" "echo '$Base64Command' | base64 -d | bash"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎉 دیپلوی روی لینوکس با موفقیت به پایان رسید!" -ForegroundColor Green
Write-Host "🌐 نشانی دسترسی: http://${ServerIP}" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
