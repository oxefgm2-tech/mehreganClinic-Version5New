import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Tablet,
  Laptop,
  QrCode,
  Wifi,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Share2,
  X,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  testCentralApiConnection,
  apiUrl,
} from '../services/apiClient';

interface MobileTabletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileTabletConnectModal: React.FC<MobileTabletConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'qr_mobile' | 'vps_settings' | 'windows_guide'>('qr_mobile');
  const [customServerUrl, setCustomServerUrl] = useState('');
  const [currentBaseUrl, setCurrentBaseUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; message: string } | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Determine current effective public URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const effectiveUrl = currentBaseUrl || currentOrigin;

  useEffect(() => {
    if (isOpen) {
      const current = getApiBaseUrl();
      setCurrentBaseUrl(current);
      setCustomServerUrl(current || currentOrigin);
    }
  }, [isOpen, currentOrigin]);

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(effectiveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testCentralApiConnection(customServerUrl);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'خطا در برقراری ارتباط با سرور',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveEndpoint = () => {
    setApiBaseUrl(customServerUrl);
    setCurrentBaseUrl(customServerUrl);
    setTestResult({
      success: true,
      message: 'آدرس سرور مرکزی با موفقیت ذخیره شد. کلیه درخواست‌های API از این پس به این آدرس ارسال می‌شوند.',
    });
  };

  const handleResetToDefault = () => {
    setApiBaseUrl('');
    setCurrentBaseUrl('');
    setCustomServerUrl(currentOrigin);
    setTestResult({
      success: true,
      message: 'تنظیمات به حالت پیش‌فرض (مسیر نسبی سرور فعلی) بازگردانی شد.',
    });
  };

  const handleTriggerPwaInstall = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPromptEvent(null);
    }
  };

  // Generate simple dynamic SVG QR Code placeholder pattern with embedded logo
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(effectiveUrl)}&bgcolor=ffffff&color=2D3A27&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        id="modal-mobile-connect"
        className="bg-white rounded-3xl shadow-2xl border border-[#E6E9DF] w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-[#F7F8F3] border-b border-[#E6E9DF] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4A6741] text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#2D3A27] text-base">
                  اتصال نسخه همراه موبایل، تبلت و کلاینت ویندوز
                </h3>
                <span className="text-[10px] font-bold bg-[#E9EFE6] text-[#4A6741] px-2 py-0.5 rounded-full border border-[#D5DDD0]">
                  PWA & Multi-Client
                </span>
              </div>
              <p className="text-xs text-[#5C7457] mt-0.5">
                دسترسی فوری پزشکان و دستیاران با گوشی، تبلت یا رایانه پذیرش به سرور متمرکز کلینیک
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E9DF] text-[#5C7457] hover:text-[#2D3A27] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E6E9DF] bg-[#FAFAF7] px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('qr_mobile')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'qr_mobile'
                ? 'border-[#4A6741] text-[#4A6741] bg-white'
                : 'border-transparent text-[#5C7457] hover:text-[#2D3A27]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>اسکن سریع QR Code موبایل</span>
          </button>

          <button
            onClick={() => setActiveTab('vps_settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'vps_settings'
                ? 'border-[#4A6741] text-[#4A6741] bg-white'
                : 'border-transparent text-[#5C7457] hover:text-[#2D3A27]'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>تنظیم آدرس سرور مرکزی (VPS)</span>
          </button>

          <button
            onClick={() => setActiveTab('windows_guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'windows_guide'
                ? 'border-[#4A6741] text-[#4A6741] bg-white'
                : 'border-transparent text-[#5C7457] hover:text-[#2D3A27]'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>راهنمای کلاینت ویندوز (Localhost)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: QR Code & Mobile Fast Connect */}
          {activeTab === 'qr_mobile' && (
            <div className="space-y-6">
              {/* Quick Install Banner if available */}
              {installPromptEvent && !isInstalled && (
                <div className="bg-[#E9EFE6] border border-[#D5DDD0] p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#4A6741] text-white flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#2D3A27]">
                        این دستگاه قابلیت نصب مستقیم PWA را دارد!
                      </p>
                      <p className="text-[11px] text-[#5C7457]">
                        برای باز شدن نرم‌افزار بدون نوار مرورگر و دسترسی تمام‌صفحه، روی دکمه نصب کلیک کنید.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleTriggerPwaInstall}
                    className="bg-[#4A6741] hover:bg-[#3D5535] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    نصب روی این دستگاه
                  </button>
                </div>
              )}

              {/* QR and URL Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* QR Code Card */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-[#F7F8F3] rounded-3xl border border-[#E6E9DF]">
                  <div className="p-3 bg-white rounded-2xl shadow-xs border border-[#E6E9DF] relative group">
                    <img
                      src={qrSvgUrl}
                      alt="QR Code اتصال موبایل"
                      className="w-44 h-44 object-contain rounded-lg"
                      onError={(e) => {
                        // Fallback in case of offline: show simple clean placeholder
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-9 h-9 rounded-xl bg-[#4A6741] text-white flex items-center justify-center shadow-md border-2 border-white">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#5C7457] font-semibold mt-3 text-center">
                    با دوربین گوشی یا تبلت این کد را اسکن کنید
                  </p>
                </div>

                {/* Direct Link & Instructions */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D3A27] mb-1.5">
                      نشانی مستقیم وب‌اپلیکیشن کلینیک:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#F7F8F3] border border-[#E6E9DF] px-3 py-2 rounded-xl text-xs font-mono text-[#2D3A27] truncate select-all dir-ltr text-left">
                        {effectiveUrl}
                      </div>
                      <button
                        onClick={handleCopyUrl}
                        className="bg-white hover:bg-[#F7F8F3] text-[#2D3A27] border border-[#E6E9DF] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5C7457]" />}
                        <span>{copied ? 'کپی شد' : 'کپی آدرس'}</span>
                      </button>
                      <a
                        href={effectiveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#4A6741] hover:bg-[#3D5535] text-white p-2 rounded-xl text-xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="باز کردن در تب جدید"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Android & iOS Setup Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Android Card */}
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                      <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs mb-2">
                        <Smartphone className="w-4 h-4 text-emerald-700" />
                        <span>راهنمای اندروید (Chrome)</span>
                      </div>
                      <ol className="text-[11px] text-emerald-900 space-y-1.5 list-decimal list-inside pr-1 leading-relaxed">
                        <li>اسکن QR با دوربین یا مرورگر Chrome</li>
                        <li>لمس علامت ۳ نقطه بالای مرورگر</li>
                        <li>انتخاب <strong>«افزودن به صفحه اصلی»</strong> یا <strong>Install App</strong></li>
                      </ol>
                    </div>

                    {/* iOS Card */}
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                      <div className="flex items-center gap-2 text-blue-950 font-bold text-xs mb-2">
                        <Tablet className="w-4 h-4 text-blue-700" />
                        <span>راهنمای آیفون و آیپد (Safari)</span>
                      </div>
                      <ol className="text-[11px] text-blue-900 space-y-1.5 list-decimal list-inside pr-1 leading-relaxed">
                        <li>باز کردن نشانی در مرورگر Safari</li>
                        <li>لمس دکمه <strong>اشتراک‌گذاری (Share)</strong></li>
                        <li>انتخاب <strong>Add to Home Screen</strong></li>
                      </ol>
                    </div>
                  </div>

                  <div className="bg-[#F7F8F3] border border-[#E6E9DF] p-3 rounded-2xl text-[11px] text-[#5C7457] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#4A6741] shrink-0" />
                    <span>
                      پس از نصب PWA روی موبایل، برنامه با آیکون اختصاصی کلینیک مهرگان و به صورت تمام‌صفحه (Native) اجرا خواهد شد.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VPS Central Server Endpoint Settings */}
          {activeTab === 'vps_settings' && (
            <div className="space-y-5">
              <div className="bg-[#F7F8F3] p-4 rounded-2xl border border-[#E6E9DF]">
                <h4 className="text-xs font-bold text-[#2D3A27] mb-1">
                  پیکربندی نشانی سرور مرکزی (VPS Endpoint Configuration)
                </h4>
                <p className="text-[11px] text-[#5C7457] leading-relaxed">
                  اگر فرانت‌اند را به صورت جداگانه روی کامپیوتر کلینیک (Localhost) اجرا کرده‌اید، نشانی سرور VPS خود را در این کادر وارد نمایید تا تمام درخواست‌های ثبت پرونده، نوبت‌دهی و مالی مستقیماً به پایگاه‌داده سرور مرکزی شما ارسال شوند.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D3A27] mb-1.5">
                  نشانی سرور مرکزی API (شامل http:// یا https://):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customServerUrl}
                    onChange={(e) => setCustomServerUrl(e.target.value)}
                    placeholder="مثال: https://api.mehregan-vet.ir یا http://194.5.200.15:3000"
                    className="flex-1 bg-white border border-[#D5DDD0] focus:border-[#4A6741] rounded-xl px-3.5 py-2.5 text-xs text-[#2D3A27] font-mono dir-ltr outline-none transition-colors"
                  />
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'در حال تست...' : 'تست پینگ'}</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.latencyMs !== undefined && (
                      <p className="text-[11px] mt-0.5 opacity-85">
                        زمان پاسخگویی شبکه: {testResult.latencyMs} میلی‌ثانیه
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#E6E9DF]">
                <button
                  onClick={handleResetToDefault}
                  className="text-xs text-[#5C7457] hover:text-[#2D3A27] font-semibold underline underline-offset-4 cursor-pointer"
                >
                  بازنشانی به مسیر پیش‌فرض لوکال
                </button>

                <button
                  onClick={handleSaveEndpoint}
                  className="bg-[#4A6741] hover:bg-[#3D5535] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>ذخیره و اتصال به سرور مرکزی</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Windows Client Guide */}
          {activeTab === 'windows_guide' && (
            <div className="space-y-4">
              <div className="bg-[#F7F8F3] p-4 rounded-2xl border border-[#E6E9DF]">
                <h4 className="text-xs font-bold text-[#2D3A27] mb-1">
                  راه‌اندازی کلاینت پذیرش روی ویندوز (Windows Client Launcher)
                </h4>
                <p className="text-[11px] text-[#5C7457] leading-relaxed">
                  برای رایانه پذیرش یا صندوقدار کلینیک، فایل راه‌انداز <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E6E9DF]">start-client-windows.bat</code> طراحی شده است. این اسکریپت سبک، فرانت‌اند محلی را بالا آورده و با پرینتر حرارتی و بارکدخوان تعامل می‌کند.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-white border border-[#E6E9DF] rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2D3A27]">
                    <span className="w-5 h-5 rounded-full bg-[#4A6741] text-white flex items-center justify-center text-[10px]">۱</span>
                    <span>تنظیم آدرس VPS در فایل محیطی (deploy.env یا VITE_API_BASE_URL)</span>
                  </div>
                  <pre className="bg-[#2D3A27] text-white p-3 rounded-xl text-[11px] font-mono dir-ltr overflow-x-auto select-all">
                    VITE_API_BASE_URL=https://api.mehregan-vet.ir
                  </pre>
                </div>

                <div className="p-3.5 bg-white border border-[#E6E9DF] rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2D3A27]">
                    <span className="w-5 h-5 rounded-full bg-[#4A6741] text-white flex items-center justify-center text-[10px]">۲</span>
                    <span>اجرای راه‌انداز یک‌کلیکه کلاینت ویندوز:</span>
                  </div>
                  <pre className="bg-[#2D3A27] text-white p-3 rounded-xl text-[11px] font-mono dir-ltr overflow-x-auto select-all">
                    start-client-windows.bat
                  </pre>
                  <p className="text-[11px] text-[#5C7457]">
                    اسکریپت به صورت هوشمند مرورگر پیش‌فرض سیستم را باز کرده و مستقیماً پنل پذیرش را نمایش می‌دهد.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F7F8F3] border-t border-[#E6E9DF] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[#5C7457]">
            <Wifi className="w-3.5 h-3.5 text-[#4A6741]" />
            <span>پشتیبانی هم‌زمان از کلاینت ویندوز، مک، لینوکس، اندروید و آیفون</span>
          </div>
          <button
            onClick={onClose}
            className="bg-white hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF] px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
