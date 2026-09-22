# TODO اجرای امن همگام‌سازی با نسخهٔ Google AI Studio

## هدف این سند

این سند برای مدل زبانی اجراکننده نوشته شده است. مدل اجراکننده باید طبق مراحل زیر عمل کند و از تصمیم‌گیری حدسی خودداری نماید.

هدف، جایگزین‌کردن پروژهٔ اصلی با نسخهٔ Google Studio نیست؛ هدف، شناسایی قابلیت‌های بهتر نسخهٔ Google Studio و انتقال انتخابی آن‌ها به پروژهٔ اصلی، بدون خراب‌کردن دادهٔ واقعی، PostgreSQL، احراز هویت، migration و deploy است.

## منابع و مرزهای قطعی

### پروژهٔ اصلی و منبع حقیقت

```text
Z:\Projects\mehreganClinic\Version5New
```

این پروژه منبع حقیقت عملیاتی است و باید مبنای backend، API، احراز هویت، RBAC، PostgreSQL، migration، تست و deploy باقی بماند.

### نسخهٔ Google Studio / کپی version8

```text
Z:\Projects\vps_remote\4Sites\version8
```

مخزن مرتبط با Google Studio:

```text
https://github.com/oxefgm2-tech/vet-Clinic
```

نسخهٔ منتشرشده برای بررسی رفتاری:

```text
https://mehreganpetclinic.ai.studio/
```

### قانون مالکیت

- `Version5New` پروژهٔ اصلی و عملیاتی است.
- `version8` و `vet-Clinic` منبع پیشنهادها و قابلیت‌های قابل‌انتقال هستند.
- هیچ‌گاه کل `version8` را روی `Version5New` کپی نکن.
- هیچ‌گاه `main` پروژهٔ اصلی را مستقیم overwrite نکن.
- هیچ‌گاه دادهٔ واقعی، `.env`، token، password، `uu.txt` یا فایل‌های احراز هویت را چاپ، commit یا جابه‌جا نکن.

## قوانین توقف فوری

اگر هرکدام از موارد زیر رخ داد، کار را متوقف کن و فقط گزارش بده:

1. مسیر فعال با `Z:\Projects\mehreganClinic\Version5New` یکسان نیست.
2. مخزن یا کپی Google Studio روی فایل‌های پروژهٔ اصلی قرار گرفته است.
3. برای ادامه نیاز به رمز، token، اتصال VPS یا تغییر دیتابیس واقعی داری.
4. تفاوت دو نسخه باعث تغییر در schema، API یا احراز هویت می‌شود اما قرارداد آن روشن نیست.
5. تست پایه شکست خورده و علت آن هنوز مشخص نیست.
6. تغییر پیشنهادی ممکن است دادهٔ واقعی را حذف، overwrite یا migrate کند.

در این وضعیت، حدس نزن و خودسرانه fallback نساز.

## مرحلهٔ صفر: شناسایی و ثبت وضعیت

قبل از هر تغییر، در هر دو مسیر جداگانه این موارد را ثبت کن:

- مسیر مطلق پروژه
- وجود یا نبود `.git`
- شاخه و commit فعلی، اگر Git وجود دارد
- `git status --short --branch`
- وجود `package.json`, `server.ts`, `src`, `config`, `scripts`, `db`, `deploy`
- زمان آخرین تغییر فایل‌های اصلی
- تعداد فایل‌های source، بدون اسکن `node_modules`, `dist` و داده‌های حساس

دستورات مجاز read-only:

```powershell
Get-Location
Get-ChildItem -Force
git status --short --branch
git log -8 --oneline --decorate
npm run lint
```

خروجی این مرحله باید فقط شامل مسیر، وضعیت Git، آزمون‌ها و blockerها باشد؛ secrets و دادهٔ بالینی را گزارش نکن.

### معیار عبور

- مسیر پروژهٔ اصلی تأیید شده باشد.
- وضعیت Git هر دو نسخه ثبت شده باشد.
- تغییرات محلی قبلی حفظ شده باشند.
- هیچ فایل حساس در گزارش ظاهر نشده باشد.

## مرحلهٔ یک: خواندن اسناد پروژهٔ اصلی

این فایل‌ها را به همین ترتیب بخوان:

1. `AGENTS.md`
2. `WORKSPACE_GUIDE_FOR_NEXT_MODEL.md`
3. `PROJECT_CONTEXT_COMPACT.md`
4. `NEXT_MODEL_TODO_PHASE_ALPHA.md`
5. `HANDOFF_VERSION5_NEXT_AGENT.md`
6. `package.json`
7. `server.ts`
8. `src/services/apiClient.ts`
9. `src/App.tsx`
10. `config/roles.json`

سپس این قراردادها را استخراج کن:

- روش احراز هویت و session
- middlewareهای `requireAuth` و `requirePermission`
- endpointهای login، logout و me
- منبع داده و مقدار `DATABASE_PROVIDER`
- قرارداد `DATABASE_URL`
- جداول PostgreSQL و migrationها
- تست‌های lint، build، smoke و production smoke
- روش deploy و rollback

### معیار عبور

مدل باید بتواند در گزارش خود دقیقاً توضیح دهد هر قابلیت اصلی از کدام API، نقش، منبع داده و تست استفاده می‌کند. اگر نتوانست، هنوز اجازهٔ تغییر ندارد.

## مرحلهٔ دو: ممیزی نسخهٔ Google Studio

در `version8` فقط این موارد را بررسی کن:

- تفاوت `vite.config.ts`
- تفاوت `package.json`
- تفاوت `server.ts`
- تفاوت `src/App.tsx`
- اجزای جدید frontend
- APIهای جدید یا حذف‌شده
- auth و RBAC
- PostgreSQL و fallback JSON
- migration و schema
- PWA، service worker و cache
- deploy و health check

اسکن `node_modules`, `dist`, فایل‌های backup و داده‌های واقعی ممنوع است.

برای هر تفاوت آن را فقط در یکی از این چهار گروه قرار بده:

| گروه | معنی | اقدام |
|---|---|---|
| A | قابلیت سالم و قابل‌انتقال | انتقال انتخابی پس از تست |
| B | قابلیت مفید ولی وابسته به API/DB | ابتدا سازگار‌سازی قرارداد، سپس انتقال |
| C | mock، نمایشی، آزمایشی یا بدون backend واقعی | انتقال نده یا hidden نگه دار |
| D | خطر امنیتی، cache، secret یا داده | رد کن و blocker گزارش بده |

### نکتهٔ اجباری دربارهٔ Vite/PWA

اگر `vite.config.ts` شامل cache برای `/api/*` است، بررسی کن که پاسخ‌های authenticated بین کاربران یا sessionها مشترک نشوند. cache یک‌روزهٔ دادهٔ درمانی بدون user/session isolation قابل‌قبول نیست.

## مرحلهٔ سه: ساخت ماتریس مقایسه

برای هر قابلیت جدول زیر را تکمیل کن:

| قابلیت | نسخهٔ اصلی | version8/Google Studio | تصمیم | دلیل | تست پذیرش |
|---|---|---|---|---|---|
| ورود و خروج | | | | | |
| نقش و مجوز | | | | | |
| جستجوی پرونده | | | | | |
| پذیرش | | | | | |
| پروندهٔ پزشکی | | | | | |
| واکسیناسیون | | | | | |
| نوبت | | | | | |
| جراحی | | | | | |
| وظایف | | | | | |
| صندوق و فاکتور | | | | | |
| پت‌شاپ | | | | | |
| PWA و cache | | | | | |
| deploy | | | | | |

هیچ قابلیت را فقط به دلیل ظاهر بهتر version8 انتخاب نکن. قابلیت فقط وقتی قابل‌انتقال است که backend، permission، persistence و test آن مشخص باشد.

## مرحلهٔ چهار: انتخاب ترتیب ادغام

ترتیب مجاز ادغام:

1. اصلاحات UI بدون تغییر قرارداد API
2. componentهای مستقل و قابل‌آزمون
3. بهبودهای UX که با `apiClient` فعلی سازگارند
4. قابلیت‌های frontend وابسته به endpointهای موجود
5. قابلیت‌هایی که نیاز به API جدید دارند، فقط پس از طراحی قرارداد و تست
6. تغییرات schema یا migration، فقط با تأیید جداگانه و rollback

ترتیب ممنوع:

- جایگزینی کامل `server.ts`
- جایگزینی کامل `src`
- جایگزینی کامل `vite.config.ts`
- جایگزینی auth یا RBAC
- جایگزینی schema یا migration
- فعال‌کردن قابلیت mock در production

## مرحلهٔ پنج: روش تغییر فایل

برای هر قابلیت فقط کمترین مجموعهٔ فایل را تغییر بده.

قبل از تغییر ثبت کن:

- هدف تغییر
- فایل‌های تحت‌تأثیر
- API یا typeهای تحت‌تأثیر
- خطر احتمالی
- روش rollback
- آزمون پذیرش

هر تغییر باید یک commit مستقل و قابل rollback داشته باشد. پیام commit باید روشن باشد، مانند:

```text
feat(ui): adopt Google Studio clinic landing page
fix(pwa): prevent authenticated API cache leakage
```

اگر پروژهٔ اصلی تغییر محلی دارد، آن تغییرات را overwrite نکن و ابتدا وضعیت را گزارش کن.

## مرحلهٔ شش: قرارداد API و داده

قبل از افزودن یا تغییر endpoint، این موارد را مشخص کن:

- method و path
- request body و validation
- response موفق
- response خطا
- permission لازم
- مالکیت داده
- منبع ذخیره‌سازی
- رفتار JSON fallback
- رفتار PostgreSQL
- تست smoke یا integration

هر endpoint درمانی باید احراز هویت و permission مناسب داشته باشد. endpoint نمایشی یا simulated نباید به‌عنوان قابلیت واقعی معرفی شود.

## مرحلهٔ هفت: آزمون اجباری پس از هر گروه تغییر

پس از تغییرات frontend:

```powershell
npm run lint
npm run build
```

پس از تغییرات API، auth یا داده:

```powershell
npm run lint
npm run build
npm run test:smoke
npm run production:smoke
```

اگر تست production به محیط معتبر نیاز دارد و در دسترس نیست، آن را skipped اعلام کن؛ موفقیت جعلی اعلام نکن.

### آزمون دستی حداقلی

با دادهٔ واقعی و بدون ساخت رکورد نمایشی بررسی کن:

1. ورود کاربر
2. مشاهدهٔ نقش و مجوز
3. جستجوی سرپرست و پت
4. مشاهدهٔ پرونده
5. ثبت پذیرش یا تغییر مجاز
6. مشاهدهٔ نتیجه توسط نقش مجاز
7. رد درخواست غیرمجاز با ۴۰۳
8. خروج و بی‌اعتبارشدن session
9. عدم نمایش دادهٔ کاربر قبلی پس از logout/login

## مرحلهٔ هشت: کنترل PWA و cache

این موارد باید جداگانه بررسی شوند:

- service worker قدیمی باعث نمایش نسخهٔ قدیمی نشود.
- cache پاسخ‌های API احراز‌شده را بین کاربران مخلوط نکند.
- logout باعث پاک‌شدن cache کاربر یا بی‌اعتبارشدن آن شود.
- تغییر `data-version` باعث refresh کنترل‌شده شود.
- دادهٔ درمانی در cache عمومی browser یا service worker بدون isolation ذخیره نشود.

در صورت تردید، cache API را غیرفعال کن و blocker را گزارش بده؛ امنیت داده بر offline بودن مقدم است.

## مرحلهٔ نه: آماده‌سازی deploy

قبل از deploy:

- build جدید از source فعلی ساخته شود.
- `dist/server.cjs` مربوط به همان source باشد.
- متغیرهای محیطی بدون نمایش مقدار بررسی شوند.
- schema و migration فقط روی staging آزمایش شوند.
- backup و rollback تأیید شوند.
- health endpoint بررسی شود.
- سرویس قبلی تا تأیید نسخهٔ جدید حذف نشود.

هیچ دستور deploy، restart، migration commit یا تغییر VPS را بدون اجازهٔ صریح مالک اجرا نکن.

## مرحلهٔ ده: قالب گزارش نهایی

گزارش باید با این قالب تحویل شود:

```text
عنوان مرحله:
نتیجه:
فایل‌های تغییرکرده:
قابلیت‌های منتقل‌شده:
قابلیت‌های ردشده:
آزمون‌ها:
Blockerها:
ریسک‌های باقی‌مانده:
روش rollback:
قدم بعدی:
```

در گزارش هرگز این موارد را چاپ نکن:

- مقدار `.env`
- password یا token
- دادهٔ خام بیمار یا سرپرست
- خروجی کامل دیتابیس
- محتوای فایل‌های authentication
- مسیر یا نام backup محرمانه

## تعریف پایان موفق

کار فقط زمانی موفق است که همهٔ موارد زیر برقرار باشند:

- `Version5New` همچنان منبع اصلی باقی مانده باشد.
- هیچ تغییر ناخواسته‌ای در دادهٔ واقعی ایجاد نشده باشد.
- auth و RBAC قبلی حفظ شده باشد.
- PostgreSQL و migration خراب نشده باشند.
- قابلیت منتقل‌شده با API واقعی کار کند.
- قابلیت mock در production فعال نشده باشد.
- `npm run lint` و `npm run build` موفق باشند.
- تست‌های مرتبط موفق یا با blocker مستند شده باشند.
- تغییرات قابل rollback و قابل توضیح باشند.
- گزارش نهایی شامل شواهد، blockerها و قدم بعدی باشد.

## دستور آغاز برای مدل اجراکننده

```text
ابتدا همین فایل را کامل بخوان. سپس فقط مرحلهٔ صفر و یک را انجام بده. هیچ فایل کدی را تغییر نده. وضعیت Git، مسیرها، اسناد، معماری، auth، PostgreSQL و تست‌ها را read-only بررسی کن. گزارش را طبق قالب نهایی بده و تا زمانی که blockerها و ماتریس مقایسه روشن نشده‌اند، وارد ادغام یا تغییر کد نشو.
```
