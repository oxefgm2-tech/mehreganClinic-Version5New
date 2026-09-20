# شروع اجباری مدل بعدی — کلینیک مهرگان

این اولین فایلی است که مدل زبانی بعدی باید پس از ورود به workspace بخواند. هدف آن تعیین ترتیب خواندن، مرزهای ایمنی و روش جلوگیری از تصمیم‌گیری بر اساس حدس است.

تاریخ: ۱۸ سپتامبر ۲۰۲۶

## قانون اصلی

تا پایان مرحلهٔ ۴ هیچ کدی را تغییر نده و هیچ دادهٔ واقعی را ننویس. ابتدا فقط workspace را بشناس و گزارش کوتاه بده. مسیر معتبر پروژه:

```text
Z:\Projects\mehreganClinic\Version5New
```

اگر مسیر فعلی متفاوت است، ابتدا آن را اصلاح کن و در مسیر قدیمی یا sibling folder کار نکن.

## ترتیب دقیق خواندن

### مرحلهٔ ۱ — قراردادها و هدف

به همین ترتیب بخوان:

1. `AGENTS.md`
2. `START_HERE_FOR_NEXT_MODEL.md` — همین فایل
3. `WORKSPACE_GUIDE_FOR_NEXT_MODEL.md`
4. `NEXT_MODEL_TODO_PHASE_ALPHA.md`
5. `PROJECT_CONTEXT_COMPACT.md`

بعد از این پنج فایل، فقط یک گزارش وضعیت بده و این موارد را مشخص کن:

- ریشهٔ واقعی workspace
- هدف «تکامل الف»
- سه محدودیت ایمنی مهم
- تسکی که مجاز به شروع آن هستی
- هر تناقض بین اسناد

### مرحلهٔ ۲ — شکل برنامه و اجرای محلی

سپس این فایل‌ها را بخوان:

1. `package.json`
2. `.env.example` — فقط نام متغیرها و مقدارهای نمونه؛ secret واقعی را نخوان
3. `server.ts`، ابتدا بخش‌های آغازین و سپس بخش‌های routeها
4. `src/main.tsx`
5. `src/App.tsx`
6. `src/services/apiClient.ts`
7. `src/services/dataCache.ts`
8. `src/types.ts`

در این مرحله باید نقشهٔ زیر را استخراج کنی، نه اینکه هنوز کد را تغییر دهی:

| موضوع | فایل/endpoint | منبع داده | نقش مجاز | آزمون موجود |
|---|---|---|---|---|
| ورود و نشست | `/api/auth/*` | PostgreSQL/فایل auth | نقش‌ها | smoke/manual |
| پرونده و سرپرست | `/api/patients`, `/api/owners` | PostgreSQL | پذیرش/پزشک | smoke/manual |
| ویزیت و واکسن | `/api/visits`, `/api/vaccinations` | PostgreSQL | پزشک | smoke/manual |
| نوبت و صف | `/api/appointments`, `/api/queues` | PostgreSQL | پذیرش/پزشک | manual |
| مالی | `/api/invoices` | PostgreSQL | صندوق/مدیر | manual |
| وظایف | `/api/tasks` | PostgreSQL | مدیر/پرسنل | manual |
| سلامت/نسخه | `/api/health`, `/api/data-version` | سرویس/DB | IT | production smoke |

اگر هر خانه را نمی‌توانی از کد اثبات کنی، آن را «نامشخص» بنویس؛ حدس نزن.

### مرحلهٔ ۳ — رابط کاربری و امکانات فعال/مخفی

بعد این مسیرها را بخوان:

1. `src/components/tabs/MedicalRecordsTab.tsx`
2. `src/components/tabs/ReceptionPetsTab.tsx`
3. `src/components/tabs/AppointmentsTab.tsx`
4. `src/components/tabs/AttendanceTab.tsx`
5. `src/components/tabs/SurgerySuiteTab.tsx`
6. `src/components/tabs/CashierFinanceTab.tsx`
7. `src/components/tabs/BoardingTab.tsx`
8. `src/components/RemotePetSearchSelect.tsx`
9. `src/components/VoiceSecretaryModal.tsx`
10. `src/components/InviteUserModal.tsx`
11. `src/components/SeniorManagerPanel.tsx`
12. `src/components/Sidebar.tsx`

برای هر بخش سه وضعیت ثبت کن:

- `LIVE`: به API واقعی متصل، مجوزدار، ذخیره و بازخوانی‌شدنی
- `PARTIAL`: بخشی واقعی و بخشی mock/local-only
- `HIDDEN`: عمداً برای کاربر عادی پنهان یا خاموش

فقط بخش‌های `LIVE` را در مسیر اصلی فعال نگه دار. `PARTIAL` بدون تکمیل backend و آزمون نباید به کاربر عادی نمایش داده شود.

### مرحلهٔ ۴ — آزمون read-only و تشخیص نسخه

بدون چاپ secret این بررسی‌ها را انجام بده:

```text
Test-Path .env
Test-Path config/auth_users.json
Test-Path data
npm run lint
npm run build
```

برای API فقط در صورت داشتن محیط مجاز:

```text
npm run production:smoke
```

وجود `.env` یا auth را فقط به‌صورت `وجود دارد/وجود ندارد` گزارش کن. محتوای آن‌ها ممنوع است.

سپس این کنترل را انجام بده:

```text
git check-ignore -v src/data/mockDatabase.ts
git ls-files src/data
```

اگر فایل منبعی مانند `src/data/mockDatabase.ts` به‌دلیل الگوی عمومی `data/` نادیده گرفته شده بود، آن را blocker انتقال بدان و قبل از هر push، `.gitignore` و فهرست فایل‌های tracked را اصلاح و دوباره build کن. به commit فعلی به‌تنهایی اعتماد نکن.

## فایل‌هایی که نباید به‌صورت کور خوانده شوند

- `node_modules/`: هرگز برای شناخت پروژه اسکن نشود.
- `dist/`: خروجی build است، منبع حقیقت نیست.
- `.env`، `uu.txt`، `config/auth_users.json`، `config/auth_invitations.json`: فقط وجود/مسیر، نه محتوا.
- `data/` و backupها: دادهٔ بالینی واقعی‌اند؛ فقط query یا شمارش محدود و مجاز.
- `seed/seed_clinic_master_data.json`: دادهٔ مرجع/seed است، نه مجوز ساخت دادهٔ نمایشی در production.
- `HANDOFF_VERSION5_NEXT_AGENT.md`: سند تاریخی است و مسیرهای قدیمی دارد؛ فقط برای سابقه بخوان، نه به‌عنوان مسیر فعلی.

## خلأهایی که مدل باید قبل از پیاده‌سازی تکمیل کند

این موارد در دو سند اصلی به‌طور کامل مستند نیستند و باید از کد یا محیط مجاز اثبات شوند:

1. قرارداد دقیق body و response همهٔ endpointهای اصلی.
2. فهرست نهایی نقش‌ها و matrix مجوزهای واقعی.
3. وضعیت واقعی هر tab و دکمه، جدا از نام فایل.
4. وضعیت فعلی PostgreSQL، تعداد رکوردها و آخرین data version، بدون چاپ دادهٔ خام.
5. روش دقیق deploy روی VPS و مسیر rollback همان نسخه.
6. اینکه کدام امکانات فقط mock هستند و کدام به سرویس بیرونی نیاز دارند.
7. تست دستی موردنیاز برای ورود، جستجو، ثبت ورود، واکسن، وظیفه و خروج.

## ترتیب مجاز اجرای کار

پس از گزارش مرحلهٔ ۴، فقط اگر blocker بحرانی وجود نداشت:

1. تسک ۱ از `NEXT_MODEL_TODO_PHASE_ALPHA.md` را انجام بده.
2. نقشهٔ endpoint/UI را با شواهد فایل و خط تکمیل کن.
3. یک تغییر کوچک و قابل rollback انتخاب کن.
4. قبل از تغییر، diff و فایل‌های تحت تأثیر را ثبت کن.
5. تغییر را اعمال کن.
6. `npm run lint` و `npm run build` را اجرا کن؛ برای API، smoke را هم اجرا کن.
7. نتیجه را با قالب گزارش TODO اعلام کن.
8. تا تأیید مرحله یا روشن‌شدن اختیار ادامه، سراغ تغییر بزرگ بعدی نرو.

## پیام آماده برای شروع مدل

```text
وارد workspace کلینیک مهرگان شده‌ای. ابتدا فقط فایل START_HERE_FOR_NEXT_MODEL.md را بخوان و ترتیب آن را رعایت کن. سپس AGENTS.md، WORKSPACE_GUIDE_FOR_NEXT_MODEL.md، NEXT_MODEL_TODO_PHASE_ALPHA.md و PROJECT_CONTEXT_COMPACT.md را بخوان. در چهار مرحلهٔ اول هیچ کدی را تغییر نده، هیچ داده‌ای را ننویس و هیچ secret را چاپ نکن. پس از مرحلهٔ ۴ فقط یک گزارش کوتاه شامل مسیر workspace، وضعیت آزمون، blockerها و نقشهٔ اولیهٔ API/UI بده. سپس منتظر دستور ادامه بمان.
```

