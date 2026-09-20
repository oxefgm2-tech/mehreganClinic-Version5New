#!/usr/bin/env bash
# ====================================================================
# VetClinic Pro - اسکریپت نصب و راه‌اندازی قطعی روی اوبونتو ۲۲.۰۴ (Ubuntu 22.04 LTS)
# صددرصد خودکار، پایدار و قابل اعتماد جهت اجرا مستقیم روی سرور VPS
# ====================================================================

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}====================================================================${NC}"
echo -e "${CYAN}   🚀 استقرار خودکار و قطعی سامانه کلینیک اختصاصی حیوانات خانگی مهرگان  ${NC}"
echo -e "${CYAN}   Ubuntu 22.04 LTS Production Server Setup & Systemd Deployment      ${NC}"
echo -e "${GREEN}====================================================================${NC}"

# ۱. بررسی دسترسی روت یا sudo
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ خطا: این اسکریپت باید با دسترسی روت اجرا شود.${NC}"
  echo -e "${YELLOW}لطفاً دستور زیر را اجرا فرمایید:${NC}"
  echo -e "   sudo bash deploy-ubuntu22.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/var/www/vetclinic"
APP_PORT="3000"
APP_USER="root"

echo -e "${CYAN}📂 پوشه سورس فعلی: ${SCRIPT_DIR}${NC}"
echo -e "${CYAN}📂 مسیر استقرار نهایی: ${APP_DIR}${NC}"
echo -e "${CYAN}🌐 پورت برنامه: ${APP_PORT}${NC}"

# ۲. به‌روزرسانی پکیج‌ها و نصب پیش‌نیازهای ضروری سیستم
echo -e "\n${YELLOW}=== [۱/۷] نصب ابزارها و وابستگی‌های پایه‌ای سیستم‌عامل ===${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
    curl \
    wget \
    git \
    unzip \
    tar \
    build-essential \
    ca-certificates \
    gnupg \
    nginx \
    ufw

# ۳. نصب یا بررسی Node.js 20 LTS
echo -e "\n${YELLOW}=== [۲/۷] بررسی و نصب Node.js v20 LTS ===${NC}"
NODE_NEEDS_INSTALL=false
if ! command -v node &> /dev/null; then
    NODE_NEEDS_INSTALL=true
else
    NODE_VER=$(node -v | tr -d 'v' | cut -d'.' -f1)
    if [ "$NODE_VER" -lt 18 ]; then
        echo -e "${YELLOW}نسخه فعلی Node.js ($NODE_VER) قدیمی است. در حال ارتقا به نسخه 20 LTS...${NC}"
        NODE_NEEDS_INSTALL=true
    fi
fi

if [ "$NODE_NEEDS_INSTALL" = true ]; then
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
    apt-get update -qq
    apt-get install -y -qq nodejs
fi

NODE_EXEC=$(which node)
NPM_EXEC=$(which npm)
echo -e "${GREEN}✅ Node.js: $($NODE_EXEC -v) در مسیر: ${NODE_EXEC}${NC}"
echo -e "${GREEN}✅ npm: $($NPM_EXEC -v) در مسیر: ${NPM_EXEC}${NC}"

# ۴. انتقال و همگام‌سازی فایل‌های پروژه به مسیر پروداکشن
echo -e "\n${YELLOW}=== [۳/۷] انتقال و آماده‌سازی فایل‌های سورس در ${APP_DIR} ===${NC}"
mkdir -p "${APP_DIR}"
mkdir -p "${APP_DIR}/data"

# اگر سورس در پوشه دیگری غیر از /var/www/vetclinic است، آن را منتقل می‌کنیم
if [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
    echo -e "${CYAN}در حال کپی فایل‌ها از ${SCRIPT_DIR} به ${APP_DIR}...${NC}"
    # بکاپ گرفتن از دیتابیس فعلی در صورت وجود
    if [ -f "${APP_DIR}/data/clinic_store.json" ]; then
        cp "${APP_DIR}/data/clinic_store.json" "/tmp/clinic_store.json.bak" || true
    fi

    # کپی فایل‌ها با نادیده گرفتن پوشه‌های حجیم محلی
    tar --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.git' \
        -cf - -C "${SCRIPT_DIR}" . | tar -xf - -C "${APP_DIR}"

    # بازیابی دیتابیس در صورت وجود
    if [ -f "/tmp/clinic_store.json.bak" ] && [ ! -f "${APP_DIR}/data/clinic_store.json" ]; then
        cp "/tmp/clinic_store.json.bak" "${APP_DIR}/data/clinic_store.json"
        rm -f "/tmp/clinic_store.json.bak"
    fi
fi

# ایجاد فایل .env در صورت عدم وجود
if [ ! -f "${APP_DIR}/.env" ]; then
    if [ -f "${APP_DIR}/deploy.env" ]; then
        cp "${APP_DIR}/deploy.env" "${APP_DIR}/.env"
    elif [ -f "${APP_DIR}/.env.example" ]; then
        cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"
    else
        cat << EOF_ENV > "${APP_DIR}/.env"
PORT=${APP_PORT}
NODE_ENV=production
EOF_ENV
    fi
fi

chown -R ${APP_USER}:${APP_USER} "${APP_DIR}"
chmod -R 755 "${APP_DIR}"

# ۵. نصب وابستگی‌های npm و کامپایل بیلد پروداکشن
echo -e "\n${YELLOW}=== [۴/۷] نصب بسته‌های npm و کامپایل بیلد پروداکشن (Vite + esbuild) ===${NC}"
cd "${APP_DIR}"
export NODE_ENV=development
$NPM_EXEC install --include=dev --no-audit --no-fund

echo -e "${CYAN}در حال کامپایل پروژه...${NC}"
export NODE_ENV=production
$NPM_EXEC run build

if [ ! -f "${APP_DIR}/dist/server.cjs" ]; then
    echo -e "${RED}❌ خطا: فایل کامپایل‌شده dist/server.cjs یافت نشد!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ فرآیند بیلد با موفقیت به پایان رسید.${NC}"

# ۶. پیکربندی و فعال‌سازی سرویس دائمی Systemd
echo -e "\n${YELLOW}=== [۵/۷] ساخت و فعال‌سازی سرویس دائمی Systemd (vetclinic.service) ===${NC}"
cat << EOF_SERVICE > /etc/systemd/system/vetclinic.service
[Unit]
Description=Mehregan Veterinary Clinic Management System
After=network.target

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${NODE_EXEC} ${APP_DIR}/dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
Environment=DATA_DIR=${APP_DIR}/data
Environment=DATABASE_URL=${DATABASE_URL:-}
Environment=DATABASE_PROVIDER=${DATABASE_PROVIDER:-json}

# محدودیت‌های حافظه و سیستم
LimitNOFILE=65536
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vetclinic

[Install]
WantedBy=multi-user.target
EOF_SERVICE

systemctl daemon-reload
systemctl enable vetclinic
systemctl restart vetclinic

# ۷. پیکربندی وب‌سرور معکوس Nginx
echo -e "\n${YELLOW}=== [۶/۷] پیکربندی وب‌سرور معکوس Nginx و فایروال UFW ===${NC}"
cat << 'EOF_NGINX' > /etc/nginx/sites-available/vetclinic
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    # فشرده‌سازی جهت بارگذاری فوق سریع
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # تایم‌اوت‌های مناسب برای عملیات مایگریشن و پردازش‌های سنگین
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;

        # پشتیبانی از کلاینت‌های دسکتاپ ویندوز، موبایل و تبلت (CORS)
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, Origin, X-Requested-With' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
EOF_NGINX

ln -sf /etc/nginx/sites-available/vetclinic /etc/nginx/sites-enabled/vetclinic
rm -f /etc/nginx/sites-enabled/default

# تست صحت کانفیگ Nginx
nginx -t
systemctl restart nginx

# باز کردن پورت‌های امنیتی فایروال
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp >/dev/null 2>&1 || true
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
    ufw allow ${APP_PORT}/tcp >/dev/null 2>&1 || true
    ufw --force enable >/dev/null 2>&1 || true
fi

# ۸. بررسی سلامت نهایی سرور با حلقه تکرار
echo -e "\n${YELLOW}=== [۷/۷] بررسی سلامت سرویس و تأیید پاسخ‌دهی پورت ۳۰۰۰ ===${NC}"
HEALTHY=false
for i in {1..12}; do
    echo -n "تست ارتباط با سرور (تلاش $i از ۱۲)... "
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${APP_PORT}/api/health || echo "000")
    if [ "$STATUS_CODE" -eq 200 ]; then
        HEALTHY=true
        echo -e "${GREEN}موفق (کد ۲۰۰)!${NC}"
        break
    fi
    echo -e "${YELLOW}در حال انتظار (کد $STATUS_CODE)...${NC}"
    sleep 2
done

SERVER_PUBLIC_IP=$(curl -s -4 https://ifconfig.me || hostname -I | awk '{print $1}')

echo -e "\n${GREEN}====================================================================${NC}"
if [ "$HEALTHY" = true ]; then
    echo -e "${GREEN}🎉 استقرار با موفقیت ۱۰۰٪ کامل شد و سیستم عملیاتی است!              ${NC}"
else
    echo -e "${YELLOW}⚠️ برنامه راه‌اندازی شد اما پاسخ اولیه کند است. لطفاً وضعیت لاگ را بررسی کنید.${NC}"
fi
echo -e "${GREEN}====================================================================${NC}"
echo -e "${CYAN}🌐 نشانی دسترسی به پنل متمرکز کلینیک:${NC}"
echo -e "   👉 http://${SERVER_PUBLIC_IP}"
echo -e "   👉 http://localhost:${APP_PORT}"
echo -e "\n${CYAN}📱 اتصال کلاینت‌های دسکتاپ ویندوز و موبایل به این سرور:${NC}"
echo -e "   ۱. در فایل .env کلاینت ویندوز: VITE_API_BASE_URL=http://${SERVER_PUBLIC_IP}"
echo -e "   ۲. اجرای اسکریپت start-client-windows.bat روی سیستم‌های پذیرش"
echo -e "   ۳. روی گوشی/تبلت: باز کردن آدرس http://${SERVER_PUBLIC_IP} و انتخاب Add to Home Screen"
echo -e "\n${CYAN}📌 دستورات مدیریت سرویس:${NC}"
echo -e "   وضعیت سرویس:  ${YELLOW}systemctl status vetclinic${NC}"
echo -e "   مشاهده لاگ‌ها: ${YELLOW}journalctl -u vetclinic -f${NC}"
echo -e "   راه‌اندازی مجدد: ${YELLOW}systemctl restart vetclinic${NC}"
echo -e "   پوشه داده‌ها:   ${YELLOW}${APP_DIR}/data${NC}"
echo -e "${GREEN}====================================================================${NC}\n"
