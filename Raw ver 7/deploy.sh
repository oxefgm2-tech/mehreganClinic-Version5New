#!/usr/bin/env bash
# ====================================================================
# VetClinic Pro - Remote VPS Automated Deployment Script
# Target OS: Ubuntu 22.04 LTS
# Protocol: SSH / SCP with sshpass & Connection Retries
# ====================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/deploy.env"
ENV_EXAMPLE="${SCRIPT_DIR}/deploy.env.example"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}====================================================================${NC}"
echo -e "${CYAN}   🚀 آغاز دیپلوی ریموت سامانه کلینیک اختصاصی حیوانات خانگی مهرگان      ${NC}"
echo -e "${CYAN}   Remote Deployment to Ubuntu 22.04 via SSH & SCP                   ${NC}"
echo -e "${GREEN}====================================================================${NC}"

# ۱. بررسی فایل متغیرهای محیطی deploy.env
if [ ! -f "${ENV_FILE}" ]; then
    if [ -f "${ENV_EXAMPLE}" ]; then
        echo -e "${YELLOW}⚠️ فایل deploy.env یافت نشد. در حال ساخت نمونه اولیه از deploy.env.example...${NC}"
        cp "${ENV_EXAMPLE}" "${ENV_FILE}"
        echo -e "${RED}❌ لطفاً مشخصات سرور (آی‌پی SERVER_IP و رمز SERVER_PASSWORD) را در فایل deploy.env تکمیل کرده و مجدداً اجرا فرمایید.${NC}"
        exit 1
    else
        echo -e "${RED}❌ فایل‌های deploy.env و deploy.env.example یافت نشدند.${NC}"
        exit 1
    fi
fi

# خواندن امن متغیرهای محیطی خط به خط بدون کرش در فواصل یا کاراکترهای خاص
while IFS='=' read -r key val || [ -n "$key" ]; do
    key=$(echo "$key" | tr -d '\r' | xargs)
    val=$(echo "$val" | tr -d '\r')
    if [[ -n "$key" && ! "$key" =~ ^# ]]; then
        # حذف کوتیشن‌های احتمالی اطراف مقدار
        val="${val%\"}"
        val="${val#\"}"
        val="${val%\'}"
        val="${val#\'}"
        export "$key=$val"
    fi
done < "${ENV_FILE}"

SERVER_IP="${SERVER_IP:-}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_PASSWORD="${SERVER_PASSWORD:-}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-/var/www/vetclinic}"
APP_PORT="${APP_PORT:-3000}"
DOMAIN_OR_IP="${DOMAIN_OR_IP:-_}"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
NODE_ENV="${NODE_ENV:-production}"
DATABASE_URL="${DATABASE_URL:-}"
DATABASE_PROVIDER="${DATABASE_PROVIDER:-json}"

if [ -z "${SERVER_IP}" ] || [ "${SERVER_IP}" == "192.168.1.100" ]; then
    echo -e "${RED}❌ خطا: لطفاً آدرس معتبر SERVER_IP سرور لینوکس خود را در deploy.env وارد فرمایید.${NC}"
    exit 1
fi

echo -e "${CYAN}📡 سرور هدف: ${SERVER_USER}@${SERVER_IP}:${SERVER_PORT}${NC}"
echo -e "${CYAN}📂 مسیر استقرار در سرور: ${REMOTE_APP_DIR}${NC}"
echo -e "${CYAN}🌐 پورت برنامه: ${APP_PORT} | دامنه: ${DOMAIN_OR_IP}${NC}"

# ۲. بررسی پیش‌نیازهای لوکال: ssh, scp, sshpass, tar
check_local_dependency() {
    local dep=$1
    if ! command -v "$dep" &> /dev/null; then
        echo -e "${YELLOW}⚠️ ابزار ${dep} روی سیستم لوکال یافت نشد. در حال نصب...${NC}"
        if command -v apt-get &> /dev/null; then
            sudo apt-get update -qq && sudo apt-get install -y -qq "$dep"
        elif command -v brew &> /dev/null; then
            brew install "$dep"
        elif command -v apk &> /dev/null; then
            apk add --no-cache "$dep"
        elif command -v yum &> /dev/null; then
            yum install -y "$dep"
        else
            echo -e "${RED}❌ لطفاً ابزار ${dep} را نصب فرمایید.${NC}"
            exit 1
        fi
    fi
}

check_local_dependency ssh
check_local_dependency scp
check_local_dependency tar

if [ -n "${SERVER_PASSWORD}" ]; then
    check_local_dependency sshpass
fi

# توابع ارتباطی SSH و SCP با بازتلاش خودکار
run_remote_ssh() {
    local cmd="$1"
    local retries=3
    local wait_sec=3
    local attempt=1

    while [ $attempt -le $retries ]; do
        echo -e "${CYAN}[SSH] تلاش ${attempt} از ${retries}...${NC}"
        if [ -n "${SERVER_PASSWORD}" ]; then
            if sshpass -p "${SERVER_PASSWORD}" ssh -p "${SERVER_PORT}" -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${SERVER_USER}@${SERVER_IP}" "$cmd"; then
                return 0
            fi
        else
            if ssh -p "${SERVER_PORT}" -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${SERVER_USER}@${SERVER_IP}" "$cmd"; then
                return 0
            fi
        fi

        echo -e "${YELLOW}⚠️ تلاش ناموفق بود. انتظار ${wait_sec} ثانیه تا تلاش بعدی...${NC}"
        sleep $wait_sec
        attempt=$((attempt + 1))
        wait_sec=$((wait_sec * 2))
    done

    echo -e "${RED}❌ ارتباط با سرور لینوکس پس از ${retries} بار تلاش برقرار نشد.${NC}"
    return 1
}

run_scp() {
    local src="$1"
    local dest="$2"
    local retries=3
    local wait_sec=3
    local attempt=1

    while [ $attempt -le $retries ]; do
        echo -e "${CYAN}[SCP] تلاش ${attempt} جهت ارسال فایل...${NC}"
        if [ -n "${SERVER_PASSWORD}" ]; then
            if sshpass -p "${SERVER_PASSWORD}" scp -P "${SERVER_PORT}" -o StrictHostKeyChecking=no -o ConnectTimeout=20 "$src" "${SERVER_USER}@${SERVER_IP}:${dest}"; then
                return 0
            fi
        else
            if scp -P "${SERVER_PORT}" -o StrictHostKeyChecking=no -o ConnectTimeout=20 "$src" "${SERVER_USER}@${SERVER_IP}:${dest}"; then
                return 0
            fi
        fi

        echo -e "${YELLOW}⚠️ ارسال ناموفق بود. انتظار ${wait_sec} ثانیه...${NC}"
        sleep $wait_sec
        attempt=$((attempt + 1))
    done

    echo -e "${RED}❌ خطا در انتقال فایل با SCP.${NC}"
    return 1
}

# ۳. آماده‌سازی و فشرده‌سازی پکیج سورس
ARCHIVE_PATH="/tmp/vetclinic-deploy-$(date +%s).tar.gz"
echo -e "\n${YELLOW}=== در حال فشرده‌سازی و بسته‌بندی پروژه ===${NC}"
tar --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='*.tar.gz' \
    --exclude='*.zip' \
    -czf "${ARCHIVE_PATH}" -C "${SCRIPT_DIR}" .

ARCHIVE_SIZE=$(du -h "${ARCHIVE_PATH}" | cut -f1)
echo -e "${GREEN}✅ پکیج پروژه با حجم ${ARCHIVE_SIZE} آماده شد.${NC}"

# ۴. ایجاد پوشه در سرور و ارسال بسته
echo -e "\n${YELLOW}=== انتقال بسته به سرور مقصد ===${NC}"
run_remote_ssh "mkdir -p ${REMOTE_APP_DIR} /tmp"
run_scp "${ARCHIVE_PATH}" "/tmp/vetclinic-latest.tar.gz"
rm -f "${ARCHIVE_PATH}"

# ۵. اجرای پیکربندی کامل، بیلد و راه‌اندازی در سرور لینوکس
echo -e "\n${YELLOW}=== اجرای راه‌اندازی قطعی در سرور اوبونتو ===${NC}"

REMOTE_PAYLOAD=$(cat << 'EOF_REMOTE'
set -eo pipefail

APP_DIR="__REMOTE_APP_DIR__"
APP_PORT="__APP_PORT__"
SERVER_USER="__SERVER_USER__"
DOMAIN="__DOMAIN_OR_IP__"
GEMINI_KEY="__GEMINI_API_KEY__"
DATABASE_URL="__DATABASE_URL__"
DATABASE_PROVIDER="__DATABASE_PROVIDER__"

echo "=== [۱/۶] نصب پکیج‌های پایه‌ای سیستم‌عامل ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl wget git unzip tar build-essential ca-certificates gnupg nginx ufw

echo "=== [۲/۶] بررسی و نصب Node.js v20 LTS ==="
NODE_NEEDS_INSTALL=false
if ! command -v node &> /dev/null; then
    NODE_NEEDS_INSTALL=true
else
    NODE_VER=$(node -v | tr -d 'v' | cut -d'.' -f1)
    if [ "$NODE_VER" -lt 18 ]; then
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
echo "Node.js: $($NODE_EXEC -v) | npm: $($NPM_EXEC -v)"

echo "=== [۳/۶] استخراج فایل‌های پروژه در ${APP_DIR} ==="
mkdir -p "${APP_DIR}"
mkdir -p "${APP_DIR}/data"

# حفظ دیتابیس فعلی در صورت وجود
if [ -f "${APP_DIR}/data/clinic_store.json" ]; then
    cp "${APP_DIR}/data/clinic_store.json" "/tmp/clinic_store.json.bak" || true
fi

tar -xzf /tmp/vetclinic-latest.tar.gz -C "${APP_DIR}"
rm -f /tmp/vetclinic-latest.tar.gz

if [ -f "/tmp/clinic_store.json.bak" ] && [ ! -f "${APP_DIR}/data/clinic_store.json" ]; then
    cp "/tmp/clinic_store.json.bak" "${APP_DIR}/data/clinic_store.json"
    rm -f "/tmp/clinic_store.json.bak"
fi

cat << EOF_ENV > "${APP_DIR}/.env"
PORT=${APP_PORT}
NODE_ENV=production
GEMINI_API_KEY=${GEMINI_KEY}
DATA_DIR=${APP_DIR}/data
DATABASE_URL=${DATABASE_URL}
DATABASE_PROVIDER=${DATABASE_PROVIDER}
EOF_ENV

chown -R ${SERVER_USER}:${SERVER_USER} "${APP_DIR}"
chmod -R 755 "${APP_DIR}"

echo "=== [۴/۶] نصب وابستگی‌های npm و کامپایل بیلد پروداکشن ==="
cd "${APP_DIR}"
export NODE_ENV=development
$NPM_EXEC install --include=dev --no-audit --no-fund
export NODE_ENV=production
$NPM_EXEC run build

echo "=== [۵/۶] پیکربندی سرویس دائمی Systemd ==="
cat << EOF_SVC > /etc/systemd/system/vetclinic.service
[Unit]
Description=Mehregan Veterinary Clinic Management System
After=network.target

[Service]
Type=simple
User=${SERVER_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${NODE_EXEC} ${APP_DIR}/dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
Environment=DATA_DIR=${APP_DIR}/data
Environment=GEMINI_API_KEY=${GEMINI_KEY}
Environment=DATABASE_URL=${DATABASE_URL}
Environment=DATABASE_PROVIDER=${DATABASE_PROVIDER}

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

echo "=== [۶/۶] تنظیم وب‌سرور Nginx و فایروال UFW ==="
cat << EOF_NGX > /etc/nginx/sites-available/vetclinic
server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

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
    ufw allow ${APP_PORT}/tcp >/dev/null 2>&1 || true
    ufw --force enable >/dev/null 2>&1 || true
fi

# بررسی سلامت با حلقه تکرار
for i in {1..10}; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${APP_PORT}/api/health || echo "000")
    if [ "$CODE" -eq 200 ]; then
        echo "✅ سرویس با موفقیت روی پورت ${APP_PORT} پاسخ داد."
        break
    fi
    sleep 2
done
EOF_REMOTE
)

REMOTE_SCRIPT="${REMOTE_PAYLOAD//__REMOTE_APP_DIR__/$REMOTE_APP_DIR}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__APP_PORT__/$APP_PORT}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__SERVER_USER__/$SERVER_USER}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__DOMAIN_OR_IP__/$DOMAIN_OR_IP}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__GEMINI_API_KEY__/$GEMINI_API_KEY}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__DATABASE_URL__/$DATABASE_URL}"
REMOTE_SCRIPT="${REMOTE_SCRIPT//__DATABASE_PROVIDER__/$DATABASE_PROVIDER}"

run_remote_ssh "$REMOTE_SCRIPT"

echo -e "\n${GREEN}====================================================================${NC}"
echo -e "${GREEN}🎉 استقرار ریموت با موفقیت ۱۰۰٪ خاتمه یافت!                            ${NC}"
echo -e "${CYAN}🌐 نشانی دسترسی: http://${SERVER_IP} یا دامنه http://${DOMAIN_OR_IP}${NC}"
echo -e "${GREEN}====================================================================${NC}\n"
