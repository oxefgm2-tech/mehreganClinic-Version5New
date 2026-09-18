# README - Deploy quick start

این پروندهٔ راهنما برای دیدن "اولین اجرا" سریع طراحی شده است. فایل‌های مهم:

- deploy/deploy.env.template  -> الگوی متغیرهای محیطی برای deploy
- deploy/deploy.sh            -> اسکریپت deploy (بسته‌بندی و آپلود و راه‌ر‌اندازی systemd)
- seed/seed_clinic_master_data.json -> داده‌های اولیه با مقادیر فرضی
- scripts/seedDatabase.ts     -> اسکریپت تبدیل seed به data/ و خروجی SQL نمونه

مراحل سریع برای "اولین اجرا":

1) اطمینان از وجود node و npm بر روی ماشین محلی یا VPS.
2) اجرای اسکریپت سید محلی (اختیاری):
   - npm install fs-extra
   - npx ts-node scripts/seedDatabase.ts seed/seed_clinic_master_data.json
   - خروجی در data/clinic_seed.json و output/seed.sql قرار می‌گیرد.

3) آماده‌سازی فایل deploy.env:
   - cp deploy/deploy.env.template deploy/deploy.env
   - اگر می‌خواهید از کلید SSH استفاده کنید، SSH_KEY_PATH را تنظیم کنید؛ در غیر اینصورت SSH_PASS را پر کنید.

4) اجرای اسکریپت deploy (روی لوکال):
   - ./deploy/deploy.sh
   - اسکریپت پروژه را روی REMOTE_DIR آپلود و systemd unit را نصب و سرویس را ری‌استارت می‌کند.

5) بررسی سرویس در VPS:
   - ssh vpsuser@203.0.113.12
   - sudo systemctl status vet-clinic.service
   - sudo journalctl -u vet-clinic.service -n 200

## PostgreSQL staging

قبل از فعال‌کردن `DATABASE_PROVIDER=postgres`، مقدار `DATABASE_URL` را تنظیم کنید و schema را روی دیتابیس staging اعمال کنید:

```bash
DATABASE_URL="postgresql://user:password@127.0.0.1:5432/mehregan_vet" npm run db:apply-schema
```

در صورت نبودن `DATABASE_URL`، این دستور هیچ تغییری ایجاد نمی‌کند و با خطا خارج می‌شود.

نکته‌ها:
- برای اولین اجرا ممکن است نصب بسته‌ها با مشکل اتصال مواجه شود. در این صورت از registry mirror یا VPN استفاده کنید.
- پس از بالا آمدن سرویس، آدرس ورود وب‌اپ را بررسی کنید (پورت و تنظیمات وب‌سرور در پروژه شما معتبر است).
