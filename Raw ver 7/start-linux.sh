#!/usr/bin/env bash
# ====================================================================
# VetClinic Pro - اسکریپت اجرای محلی سامانه روی لینوکس (Desktop / Server)
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
echo -e "${CYAN}   🐾 اجرای محلی سامانه کلینیک اختصاصی حیوانات خانگی مهرگان (نسخه لینوکس) ${NC}"
echo -e "${GREEN}====================================================================${NC}"

# ۱. بررسی Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ خطا: Node.js روی این سیستم نصب نیست.${NC}"
    echo -e "جهت نصب در اوبونتو/دبیان: sudo apt install nodejs npm"
    exit 1
fi

echo -e "${GREEN}✅ نسخه Node.js: $(node -v)${NC}"

# ۲. نصب وابستگی‌ها در صورت نبود پوشه node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 در حال نصب وابستگی‌های پروژه (npm install)...${NC}"
    npm install
fi

# ۳. بیلد پروژه در صورت نبود dist/server.cjs
if [ ! -f "dist/server.cjs" ]; then
    echo -e "${YELLOW}⚙️ در حال کامپایل بیلد پروداکشن (npm run build)...${NC}"
    npm run build
fi

# ۴. تشخیص IP محلی شبکه
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

echo -e "\n${GREEN}====================================================================${NC}"
echo -e "🚀 سرور کلینیک آماده به کار است:"
echo -e "   دسترسی محلی:            ${CYAN}http://localhost:3000${NC}"
echo -e "   دسترسی تبلت‌ها و گوشی‌ها: ${CYAN}http://${LOCAL_IP}:3000${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo -e "${YELLOW}جهت توقف سرور کلیدهای Ctrl+C را فشار دهید.${NC}\n"

export PORT=3000
export NODE_ENV=production
exec node dist/server.cjs
