import React, { useState } from 'react';
import {
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Upload,
  AlertCircle,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Send,
  User,
} from 'lucide-react';
import { CloudSyncQueueItem, Pet, VisitRecord } from '../../types';
import { DeploymentTopologySwitcher } from '../it/DeploymentTopologySwitcher';
import { apiClient } from '../../services/apiClient';

interface CloudSyncMigrationTabProps {
  syncQueue: CloudSyncQueueItem[];
  pets: Pet[];
  visits: VisitRecord[];
  onTriggerSyncNow: () => void;
  onMigrationCommitted?: () => void;
  externalJsonPayload?: string;
  initialTab?: 'sync' | 'portal_preview' | 'migration' | 'deployment_topology';
}

export const CloudSyncMigrationTab: React.FC<CloudSyncMigrationTabProps> = ({
  syncQueue,
  pets,
  visits,
  onTriggerSyncNow,
  onMigrationCommitted,
  externalJsonPayload,
  initialTab = 'sync',
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'portal_preview' | 'migration' | 'deployment_topology'>(initialTab);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccessToast, setCommitSuccessToast] = useState<string | null>(null);

  // Migration State
  const [rawJsonInput, setRawJsonInput] = useState(
    externalJsonPayload ||
      JSON.stringify(
        [
          { petName: 'تامی', species: 'سگ', breed: 'پودل', owner: 'مهندس رضایی', phone: '09121112233', microchip: '985141009876543' },
          { petName: 'تامی', species: 'سگ', breed: 'پودل', owner: 'مهندس رضایی', phone: '989121112233' }, // Duplicate
          { petName: 'برفی', species: 'گربه', breed: 'پرشین', owner: 'خانم شمس', phone: '09355554433' },
        ],
        null,
        2
      )
  );

  React.useEffect(() => {
    if (externalJsonPayload) {
      setRawJsonInput(externalJsonPayload);
      setActiveTab('migration');
    }
  }, [externalJsonPayload]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const handleRunSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/trigger', { method: 'POST' });
      const data = await res.json();
      onTriggerSyncNow();
      setSyncSuccessToast(data.message || 'اطلاعات با موفقیت با سرور ابری همگام گردید.');
    } catch {
      onTriggerSyncNow();
      setSyncSuccessToast('همگام‌سازی ابری با موفقیت شبیه‌سازی شد.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncSuccessToast(null), 4000);
    }
  };

  const handleProcessMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      let parsed = [];
      try {
        parsed = JSON.parse(rawJsonInput);
      } catch {
        alert('فرمت JSON وارد شده معتبر نمی‌باشد.');
        setIsMigrating(false);
        return;
      }

      const res = await fetch('/api/migration/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawData: parsed }),
      });
      const data = await res.json();
      setMigrationResult(data);
    } catch (err) {
      console.error(err);
      alert('خطا در ارتباط با سرویس پالایش داده‌ها.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCommitToDatabase = async () => {
    if (!migrationResult || !migrationResult.cleansedSample || migrationResult.cleansedSample.length === 0) {
      alert('هیچ رکوردی برای انتقال نهایی یافت نشد.');
      return;
    }
    setIsCommitting(true);
    try {
      const res = await apiClient.commitMigrationData(migrationResult.cleansedSample);
      if (res.success) {
        setCommitSuccessToast(res.message);
        if (onMigrationCommitted) {
          onMigrationCommitted();
        }
      } else {
        alert('خطا در ثبت داده‌ها: ' + (res.message || 'نامشخص'));
      }
    } catch (e) {
      console.error(e);
      alert('خطا در اتصال به سرور جهت ذخیره پایگاه‌داده.');
    } finally {
      setIsCommitting(false);
      setTimeout(() => setCommitSuccessToast(null), 6000);
    }
  };

  return (
    <div id="tab-cloud-migration" className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Controls & Sub-tabs */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
            <CloudUpload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">همگام‌سازی ابری، پورتال مالکان و پالایش داده</h2>
            <p className="text-xs text-slate-500">پشتیبان‌گیری شبانه، اپلیکیشن صاحب حیوان و انتقال سوابق قدیمی</p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'sync' ? 'bg-white text-sky-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            همگام‌سازی ابری LAN ↔ Cloud
          </button>
          <button
            onClick={() => setActiveTab('portal_preview')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'portal_preview' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            پیش‌نمایش پورتال مالکان
          </button>
          <button
            onClick={() => setActiveTab('migration')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'migration' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            پالایش و مهاجرت داده قدیمی
          </button>
          <button
            onClick={() => setActiveTab('deployment_topology')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'deployment_topology' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            سوئیچ استقرار ۳ گانه (LAN / VPS / Cloud)
          </button>
        </div>

      </div>

      {/* Sync Success Toast */}
      {syncSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{syncSuccessToast}</span>
        </div>
      )}

      {/* TAB 1: Cloud Sync & Queue */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-sky-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>همگام‌سازی دوطرفه رمزنگاری شده (SSL/TLS)</span>
              </div>
              <h3 className="text-xl font-black text-white">اتصال پایدار سرور محلی کلینیک به کلاود</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تمام ویزیت‌ها، تراکنش‌ها و واکسن‌های ثبت شده به صورت خودکار هر شب ساعت ۰۰:۰۰ (یا به صورت دستی) به سرور ابری کلینیک منتقل می‌شوند تا مالکان به شناسنامه و سوابق دسترسی داشته باشند.
              </p>
            </div>

            <button
              onClick={handleRunSync}
              disabled={isSyncing}
              className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'در حال همگام‌سازی با کلاود...' : 'همگام‌سازی دستی فوری'}</span>
            </button>
          </div>

          {/* Sync Queue Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900">صف داده‌های محلی جهت ارسال به سرور ابری:</h4>
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl font-mono">
                {syncQueue.length} رکورد در پایگاه محلی
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">نوع رکورد</th>
                    <th className="p-3">شناسه رکورد</th>
                    <th className="p-3">زمان ثبت در LAN</th>
                    <th className="p-3">وضعیت همگام‌سازی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {syncQueue.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-bold text-slate-800">{item.recordType}</td>
                      <td className="p-3 font-mono text-slate-600">{item.recordId}</td>
                      <td className="p-3 font-mono text-slate-500">{item.createdAt}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'synced'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status === 'synced' ? 'همگام شده با ابر' : 'در صف همگام‌سازی شبانه'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Owner Cloud Portal View */}
      {activeTab === 'portal_preview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">نمای پورتال صاحب حیوان (پت‌کارت ابری):</h4>
                <p className="text-xs text-slate-500">آنچه صاحب پت پس از همگام‌سازی در موبایل خود مشاهده می‌کند</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-xl">
                پورتال ابری آنلاین
              </span>
            </div>

            <div className="max-w-md mx-auto bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border-4 border-slate-800 space-y-4 font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                    🐾
                  </div>
                  <span className="font-bold text-xs">پورتال کلینیک مهرگان</span>
                </div>
                <span className="text-[10px] text-slate-400">نسخه ابری مالکان</span>
              </div>

              {/* Pet Card */}
              <div className="bg-slate-800/80 rounded-2xl p-4 space-y-3 border border-slate-700">
                <div className="flex items-center gap-3">
                  <img
                    src={pets[0]?.photoUrl}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-600"
                  />
                  <div>
                    <h5 className="font-black text-base text-white">{pets[0]?.name}</h5>
                    <div className="text-xs text-slate-400">{pets[0]?.species} • {pets[0]?.breed}</div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                      میکروچیپ: {pets[0]?.microchipNumber}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700">
                  <div className="bg-slate-900 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400">واکسن بعدی:</span>
                    <div className="font-bold text-amber-400 mt-0.5">{pets[0]?.nextVaccineDate}</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400">انگل‌تراپی:</span>
                    <div className="font-bold text-emerald-400 mt-0.5">{pets[0]?.nextParasiteDate}</div>
                  </div>
                </div>
              </div>

              {/* Recent Visit from Cloud */}
              <div className="bg-slate-800/50 rounded-2xl p-3 text-xs space-y-1">
                <div className="text-slate-400 text-[10px]">آخرین نسخه ثبت شده پزشک:</div>
                <div className="font-bold text-slate-200">معاینه و واکسیناسیون هاری و هفت‌گانه</div>
                <div className="text-[10px] text-slate-400">پزشک معالج: دکتر کیکاووس کیانی • تاریخ: دیروز</div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Data Migration & Cleansing */}
      {activeTab === 'migration' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-900">
              ماژول هوشمند پالایش و انتقال داده‌ها از نرم‌افزارهای قدیمی (Legacy Migration)
            </h4>
            <p className="text-xs text-slate-500">
              ورودی فایل اکسل / JSON / CSV، رفع رکوردهای تکراری، اعتبارسنجی شماره‌های موبایل (09xxxxxxxxx) و تولید شناسه یکتا
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              اطلاعات خروجی نرم‌افزار قبلی (JSON یا ساختار ستونی):
            </label>
            <textarea
              rows={8}
              value={rawJsonInput}
              onChange={(e) => setRawJsonInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              الگوریتم پالایش: یکسان‌سازی پیش‌شماره‌های ۹۸+ به ۰۹، بررسی تشابه نام پت و مالک.
            </span>

            <button
              onClick={handleProcessMigration}
              disabled={isMigrating}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {isMigrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>شروع پالایش و تطبیق هوشمند داده‌ها</span>
            </button>
          </div>

          {/* Migration Output Summary */}
          {migrationResult && (
            <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl space-y-3 animate-fadeIn text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-950 font-black">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <span>{migrationResult.message}</span>
                </div>
                <div className="flex items-center gap-2 font-bold">
                  <span className="bg-purple-200 text-purple-900 px-2.5 py-1 rounded-lg">
                    تعداد رکوردهای معتبر: {migrationResult.cleansedCount}
                  </span>
                  <span className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg">
                    رکوردهای تکراری حذف شده: {migrationResult.duplicatesRemoved}
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-white rounded-xl border border-purple-100 overflow-hidden mt-2">
                <table className="w-full text-right text-xs">
                  <thead className="bg-purple-100/60 text-purple-900 font-bold">
                    <tr>
                      <th className="p-2.5">نام پت</th>
                      <th className="p-2.5">گونه و نژاد</th>
                      <th className="p-2.5">مالک</th>
                      <th className="p-2.5">شماره موبایل استاندارد</th>
                      <th className="p-2.5">میکروچیپ اختصاصی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 font-medium text-slate-800">
                    {migrationResult.cleansedSample.map((item: any) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-bold text-purple-900">{item.petName}</td>
                        <td className="p-2.5">{item.species} - {item.breed}</td>
                        <td className="p-2.5">{item.ownerName}</td>
                        <td className="p-2.5 font-mono">{item.ownerPhone}</td>
                        <td className="p-2.5 font-mono text-slate-500">{item.microchip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Commit Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-purple-200/60">
                <div className="text-[11px] text-purple-900 font-medium">
                  پس از بررسی و تایید ساختار، پرونده‌های استخراج شده را مستقیماً در پایگاه داده جدید ثبت کنید.
                </div>
                <button
                  onClick={handleCommitToDatabase}
                  disabled={isCommitting}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  <span>تأیید نهایی و وارد کردن به دیتابیس کلینیک</span>
                </button>
              </div>

              {commitSuccessToast && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold rounded-xl flex items-center gap-2 animate-fadeIn text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{commitSuccessToast}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: 3-Mode Deployment Topology Switcher */}
      {activeTab === 'deployment_topology' && (
        <DeploymentTopologySwitcher />
      )}

    </div>
  );
};
