#!/usr/bin/env bash
# ====================================================================
# VetClinic Pro - اسکریپت اجرای کلاینت لینوکس (اتصال به سرور مرکزی VPS)
# ====================================================================

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo -e "${GREEN}====================================================================${NC}"
echo -e "${CYAN}   🐾 اجرای کلاینت دسکتاپ کلینیک مهرگان (اتصال به VPS مرکزی)      ${NC}"
echo -e "${GREEN}====================================================================${NC}"

# بررسی Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ خطا: Node.js نصب نیست.${NC}"
    exit 1
fi

# بررسی تنظیمات VPS
CENTRAL_VPS_URL=""
if [ -f ".env" ]; then
    CENTRAL_VPS_URL=$(grep "^VITE_API_BASE_URL=" .env | cut -d '=' -f2- || true)
fi

if [ -z "$CENTRAL_VPS_URL" ] && [ -f "deploy.env" ]; then
    SERVER_IP=$(grep "^SERVER_IP=" deploy.env | cut -d '=' -f2- || true)
    if [ -n "$SERVER_IP" ]; then
        CENTRAL_VPS_URL="http://${SERVER_IP}:3000"
    fi
fi

if [ -z "$CENTRAL_VPS_URL" ]; then
    echo -e "${YELLOW}لطفاً نشانی سرور مرکزی VPS کلینیک را وارد نمایید (مثال: https://mehregan-vet.ir):${NC}"
    read -r -p "آدرس سرور: " INPUT_URL
    if [ -n "$INPUT_URL" ]; then
        CENTRAL_VPS_URL="$INPUT_URL"
        echo "VITE_API_BASE_URL=${CENTRAL_VPS_URL}" >> .env
        echo -e "${GREEN}✅ ذخیره در .env انجام شد.${NC}"
    fi
fi

echo -e "${GREEN}✅ نشانی سرور متمرکز فعال: ${CYAN}${CENTRAL_VPS_URL:-مسیر نسبی}${NC}"

if [ ! -f "dist/index.html" ]; then
    echo -e "${YELLOW}⚙️ در حال ساخت بیلد کلاینت...${NC}"
    npm run build
fi

echo -e "\n${GREEN}====================================================================${NC}"
echo -e "🚀 کلاینت آماده است:"
echo -e "   دسترسی کلاینت:   ${CYAN}http://localhost:3000${NC}"
echo -e "   متصل به سرور:    ${CYAN}${CENTRAL_VPS_URL}${NC}"
echo -e "${GREEN}====================================================================${NC}\n"

# باز کردن مرورگر
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000" &
fi

export PORT=3000
export NODE_ENV=production
exec node dist/server.cjs
