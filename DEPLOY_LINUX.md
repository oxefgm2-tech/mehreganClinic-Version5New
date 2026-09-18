# راهنمای جامع و قدم‌به‌قدم استقرار (Deploy) سامانه کلینیک اختصاصی حیوانات خانگی مهرگان روی لینوکس (Ubuntu 22.04 LTS)

این راهنما شامل کلیه مراحل، دستورات، اسکریپت‌های خودکار و روش‌های دستی جهت استقرار قطعی و ۱۰۰٪ پایدار سامانه بر روی سرورهای ابری، VPS یا سرورهای محلی لینوکس است.

---

## 📋 فهرست مطالب
۱. [مشخصات فنی و حداقل سخت‌افزار مورد نیاز](#۱-مشخصات-فنی-و-حداقل-سخت‌افزار-مورد-نیاز)  
۲. [روش اول: استقرار ۱۰۰٪ خودکار مستقیم روی سرور (سریع‌ترین روش)](#۲-روش-اول-استقرار-۱۰۰-خودکار-مستقیم-روی-سرور-vps)  
۳. [روش دوم: استقرار از راه دور (Remote Deploy از ویندوز یا مک/لینوکس)](#۳-روش-دوم-استقرار-از-راه-دور-remote-deploy)  
۴. [روش سوم: استقرار دستی گام‌به‌گام (برای مدیران سیستم)](#۴-روش-سوم-استقرار-دستی-گام‌به‌گام-command-by-command)  
۵. [فعال‌سازی گواهی امنیتی SSL رایگان (HTTPS با Let's Encrypt)](#۵-فعال‌سازی-گواهی-امنیتی-ssl-رایگان-https)  
۶. [دستورات پایش، نگهداری و مشاهده لاگ‌های زنده](#۶-دستورات-پایش-نگهداری-و-مشاهده-لاگ‌های-زنده)  
۷. [پشتیبان‌گیری (Backup) و بازیابی اطلاعات کلینیک](#۷-پشتیبان‌گیری-backup-و-بازیابی-اطلاعات-کلینیک)  
۸. [عیب‌یابی خطاهای متداول (Troubleshooting)](#۸-عیب‌یابی-خطاهای-متداول-troubleshooting)  

---

## ۱. مشخصات فنی و حداقل سخت‌افزار مورد نیاز

* **سیستم‌عامل پیشنهادی:** Ubuntu 22.04 LTS (Jammy Jellyfish) یا Ubuntu 24.04 LTS یا Debian 12
* **پردازنده (CPU):** حداقل ۱ هسته (۲ هسته برای کارایی بهینه پیشنهاد می‌شود)
* **حافظه رم (RAM):** حداقل ۱ گیگابایت (در سرورهای ۱ گیگابایتی فعال‌سازی ۲ گیگابایت Swap توصیه می‌شود)
* **فضای دیسک:** حداقل ۱۰ گیگابایت SSD/NVMe
* **پورت‌های شبکه:** ۲۲ (SSH)، ۸۰ (HTTP)، ۴۴۳ (HTTPS)، ۳۰۰۰ (Application Port)

---

## ۲. روش اول: استقرار ۱۰۰٪ خودکار مستقیم روی سرور VPS

این روش سریع‌ترین و امن‌ترین شیوه نصب است؛ اسکریپت `deploy-ubuntu22.sh` کلیه مراحل شامل نصب وابستگی‌های لینوکس، Node.js 20، کامپایل Vite و esbuild، ساخت سرویس Systemd، راه‌اندازی وب‌سرور معکوس Nginx، کانفیگ فایروال UFW و تست سلامت را به شکل خودکار اجرا می‌کند.

### مراحل اجرا:
۱. وارد سرور لینوکس خود با SSH شوید:
```bash
ssh root@YOUR_SERVER_IP
```

۲. سورس پروژه را در مسیر `/var/www/vetclinic` قرار دهید (یا مخزن گیت را کلون کنید):
```bash
git clone <آدرس_مخزن_گیت> /var/www/vetclinic
cd /var/www/vetclinic
```

۳. اسکریپت استقرار را با دسترسی روت اجرا کنید:
```bash
sudo bash deploy-ubuntu22.sh
```

۴. اسکریپت تمامی مراحل را بررسی کرده و در انتها پیام موفقیت و نشانی ورود به سامانه را نمایش می‌دهد:
```text
====================================================================
🎉 استقرار با موفقیت ۱۰۰٪ کامل شد و سیستم عملیاتی است!
====================================================================
🌐 نشانی دسترسی به پنل کلینیک:
   👉 http://YOUR_SERVER_IP
   👉 http://localhost:3000
```

---

## ۳. روش دوم: استقرار از راه دور (Remote Deploy)

اگر سورس پروژه روی رایانه شما (ویندوز یا مک/لینوکس) قرار دارد و می‌خواهید مستقیماً با یک دستور پروژه را به سرور لینوکس ارسال و راه‌اندازی کنید:

### الف) از مبدأ سیستم‌های لینوکس یا مک:
۱. فایل نمونه تنظیمات را کپی کنید:
```bash
cp deploy.env.example deploy.env
```
۲. فایل `deploy.env` را باز کرده و مشخصات سرور را وارد نمایید:
```env
SERVER_IP=194.5.200.15          # آی‌پی سرور شما
SERVER_PORT=22                  # پورت اس‌اس‌اچ
SERVER_USER=root               # نام کاربر سرور
SERVER_PASSWORD=رمز_سرور_شما   # رمز عبور یا کلید SSH
REMOTE_APP_DIR=/var/www/vetclinic
APP_PORT=3000
DOMAIN_OR_IP=mehregan-vet.ir
```
۳. اسکریپت دیپلوی ریموت را اجرا کنید:
```bash
bash deploy.sh
```

### ب) از مبدأ ویندوز (PowerShell):
۱. فایل `deploy.env.example` را به نام `deploy.env` کپی و آی‌پی و مشخصات سرور را در آن ذخیره کنید.
۲. پنجره PowerShell را باز کرده و دستور زیر را اجرا کنید:
```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```
اسکریپت پروژه را به صورت هوشمند فشرده کرده، به سرور ارسال نموده و تمام دستورات سرور را از طریق کانال امن اجرا می‌کند.

---

## ۴. روش سوم: استقرار دستی گام‌به‌گام (Command-by-Command)

برای مواقعی که قصد دارید شخصاً هر مرحله را در سرور اوبونتو ۲۲ به صورت قدم‌به‌قدم کنترل کنید:

### گام اول: به‌روزرسانی سیستم‌عامل
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip tar build-essential ca-certificates gnupg nginx ufw
```

### گام دوم: نصب Node.js 20 LTS
```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install -y nodejs
```
بررسی صحت نصب:
```bash
node -v   # باید v20.x.x باشد
npm -v    # باید نسخه 10 یا بالاتر باشد
```

### گام سوم: ساخت مسیر پروژه و قرار دادن فایل‌ها
```bash
sudo mkdir -p /var/www/vetclinic/data
sudo chown -R $USER:$USER /var/www/vetclinic
cd /var/www/vetclinic
```

### گام چهارم: نصب وابستگی‌ها و کامپایل بیلد پروداکشن
```bash
export NODE_ENV=development
npm install --include=dev

export NODE_ENV=production
npm run build
```
پس از بیلد موفق، فایل `dist/server.cjs` و پوشه `dist/assets` ساخته می‌شوند.

### گام پنجم: تنظیم سرویس دائمی Systemd (سرویس خودکار در بوت)
یک فایل سرویس جدید ایجاد کنید:
```bash
sudo nano /etc/systemd/system/vetclinic.service
```
محتوای زیر را داخل آن قرار دهید:
```ini
[Unit]
Description=Mehregan Veterinary Clinic Management System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/vetclinic
ExecStart=/usr/bin/node /var/www/vetclinic/dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

# بهینه‌سازی ظرفیت کانکشن‌ها
LimitNOFILE=65536
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vetclinic

[Install]
WantedBy=multi-user.target
```
ذخیره کرده و سرویس را فعال و روشن کنید:
```bash
sudo systemctl daemon-reload
sudo systemctl enable vetclinic
sudo systemctl start vetclinic
```
بررسی وضعیت سلامت سرویس:
```bash
sudo systemctl status vetclinic
```

### گام ششم: پیکربندی وب‌سرور معکوس Nginx
فایل پیکربندی سایت را ایجاد کنید:
```bash
sudo nano /etc/nginx/sites-available/vetclinic
```
محتوای زیر را درون آن قرار دهید (اگر دامنه دارید به جای `_` نام دامنه خود را بنویسید):
```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

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

        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }
}
```
فعال‌سازی کانفیگ در Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/vetclinic /etc/nginx/sites-enabled/vetclinic
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### گام هفتم: تنظیم فایروال سرور (UFW)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable
```

اکنون مرورگر خود را باز کرده و آی‌پی سرور را وارد کنید:
`http://YOUR_SERVER_IP`

---

## ۵. فعال‌سازی گواهی امنیتی SSL رایگان (HTTPS)

اگر دامنه‌ای را به آی‌پی سرور خود متصل (A Record) کرده‌اید، با ابزار رایگان Certbot در ۳۰ ثانیه گواهی SSL معتبر بگیرید:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```
گواهی به صورت خودکار تمدید (Auto-Renew) خواهد شد.

---

## ۶. دستورات پایش، نگهداری و مشاهده لاگ‌های زنده

| عملکرد | دستور در لینوکس |
|---|---|
| مشاهده وضعیت سرویس | `sudo systemctl status vetclinic` |
| مشاهده زنده لاگ‌های برنامه | `sudo journalctl -u vetclinic -f` |
| راه‌اندازی مجدد برنامه | `sudo systemctl restart vetclinic` |
| متوقف کردن موقت برنامه | `sudo systemctl stop vetclinic` |
| راه‌اندازی مجدد Nginx | `sudo systemctl restart nginx` |
| تست صحت وب‌سرور Nginx | `sudo nginx -t` |
| مشاهده پورت‌های در حال گوش | `sudo ss -tulpn \| grep :3000` |
| بررسی پاسخ سلامت اندپوینت | `curl -s http://127.0.0.1:3000/api/health` |

---

## ۷. پشتیبان‌گیری (Backup) و بازیابی اطلاعات کلینیک

تمامی اطلاعات کلینیک (پرونده بیماران، سوابق درمانی، فاکتورها، انبار پت‌شاپ، کادر درمان و تنظیمات) در پوشه `data/clinic_store.json` نگهداری می‌شود.

### بکاپ‌گیری سریع:
```bash
sudo cp /var/www/vetclinic/data/clinic_store.json /var/backups/clinic_store_$(date +%Y%m%d_%H%M%S).json
```

### خودکارسازی بکاپ روزانه با کرون‌جاب (CronJob):
دستور `sudo crontab -e` را بزنید و خط زیر را اضافه کنید (هر روز ساعت ۲۳:۰۰ بکاپ می‌گیرد):
```cron
0 23 * * * cp /var/www/vetclinic/data/clinic_store.json /var/backups/clinic_backup_$(date +\%Y\%m\%d).json
```

### بازیابی بکاپ:
```bash
sudo systemctl stop vetclinic
sudo cp /var/backups/clinic_backup_XXXX.json /var/www/vetclinic/data/clinic_store.json
sudo systemctl start vetclinic
```

---

## ۸. عیب‌یابی خطاهای متداول (Troubleshooting)

### ۱. خطای کمبود رم هنگام بیلد در سرورهای ضعیف (Out of Memory):
اگر رم سرور ۱ گیگابایت باشد، فرآیند `npm run build` ممکن است با خطای Heap Memory مواجه شود. راهکار سریع فعال‌سازی فایل حافظه مجازی (Swap) است:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### ۲. خطای ۵۰۲ (502 Bad Gateway) در Nginx:
نشان‌دهنده این است که سرویس `vetclinic` روشن نیست یا کرش کرده است:
```bash
sudo systemctl status vetclinic
sudo journalctl -u vetclinic -n 50 --no-pager
```
اگر پورت ۳۰۰۰ اشغال شده باشد:
```bash
sudo lsof -i :3000
```

### ۳. خطای دسترسی فایل‌ها (Permission Denied):
```bash
sudo chown -R root:root /var/www/vetclinic
sudo chmod -R 755 /var/www/vetclinic
sudo chmod -R 777 /var/www/vetclinic/data
```

---

## ۹. معماری تفکیک‌شده: بک‌اند روی VPS + فرانت‌اند روی کلاینت ویندوز (Localhost) و موبایل (PWA)

در این سناریو، پایگاه‌داده و هسته بک‌اند Express روی سرور مرکزی VPS شما (با پایداری، پشتیبان‌گیری خودکار و دسترسی ۲۴ ساعته) مستقر است و سیستم‌های داخل کلینیک به همراه گوشی‌های پرسنل به عنوان کلاینت به آن متصل می‌شوند.

### مزایای این معماری:
۱. **پایداری مرکزی:** نیازی به روشن ماندن شبانه‌روزی کامپیوترهای کلینیک نیست؛ سرور VPS با آپ‌تایم ۹۹.۹٪ همیشه در دسترس است.  
۲. **اتصال سخت‌افزارهای محلی پذیرش:** کلاینت ویندوز می‌تواند مستقیماً به پرینتر حرارتی فیش، بارکدخوان و کارتخوان (POS) وصل شود.  
۳. **دسترسی پزشکان در ویزیت در محل و بخش جراحی:** پزشکان با گوشی همراه یا تبلت از طریق PWA به پرونده‌ها دسترسی لحظه‌ای دارند.  

### راهنمای راه‌اندازی کلاینت ویندوز کلینیک (پذیرش/صندوق):
۱. فایل `start-client-windows.bat` را روی رایانه کلینیک اجرا کنید.  
۲. در اولین اجرا، آدرس VPS شما (مثلاً `https://mehregan-vet.ir` یا `http://194.5.200.15:3000`) پرسیده شده و در فایل `.env` محلی ذخیره می‌شود.  
۳. نرم‌افزار به صورت خودکار در پنجره اپلیکیشن تمام‌صفحه باز می‌شود و مستقیماً به VPS متصل است.

### راهنمای راه‌اندازی نسخه موبایل و تبلت (PWA):
۱. آدرس سرور کلینیک را با مرورگر گوشی یا تبلت باز کنید (یا از طریق دکمه «اتصال موبایل» در نوار بالای نرم‌افزار، کد QR را اسکن نمایید).  
۲. **در اندروید (Chrome):** منوی ۳ نقطه را لمس کرده و گزینه **«افزودن به صفحه اصلی» (Add to Home Screen)** یا **Install App** را انتخاب کنید.  
۳. **در آیفون و آیپد (Safari):** دکمه **اشتراک‌گذاری (Share)** در پایین صفحه را لمس کرده و گزینه **Add to Home Screen** را بزنید.  
۴. اپلیکیشن با آیکون اختصاصی مهرگان روی صفحه گوشی ایجاد شده و مانند یک برنامه نیتیو تمام‌صفحه اجرا می‌شود.

---

## جمع‌بندی اسکریپت‌های اجرایی در مخزن:
* `deploy-ubuntu22.sh`: اسکریپت استقرار ۱۰۰٪ خودکار سرور بک‌اند و متمرکز روی اوبونتو ۲۲.۰۴ VPS.
* `start-client-windows.bat`: راه‌انداز کلاینت دسکتاپ ویندوز کلینیک (متصل به VPS مرکزی).
* `start-windows.bat`: راه‌اندازی ۱-کلیکی برای حالت سرور محلی یکپارچه روی ویندوز.
* `start-client-linux.sh`: راه‌انداز کلاینت لینوکس کلینیک (متصل به VPS مرکزی).
* `start-linux.sh`: راه‌اندازی سرور محلی یکپارچه روی لینوکس.
* `deploy.sh`: اسکریپت ارسال و راه‌اندازی ریموت از لینوکس/مک به سرور.
* `deploy.ps1`: اسکریپت ارسال و راه‌اندازی ریموت از ویندوز به سرور با PowerShell.
