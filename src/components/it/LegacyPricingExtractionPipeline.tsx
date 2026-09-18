import React, { useState } from 'react';
import {
  Database,
  Layers,
  ArrowUpDown,
  TrendingUp,
  Calculator,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Filter,
  Check,
  RefreshCw,
  Zap,
  Sparkles,
  Search,
  Sliders,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { LegacyServicePriceItem } from '../../types';
import { initialLegacyServicePriceItems } from '../../data/mockDatabase';

interface LegacyPricingExtractionPipelineProps {
  onRegisterToNewCatalog?: (migratedItems: LegacyServicePriceItem[]) => void;
}

export const LegacyPricingExtractionPipeline: React.FC<LegacyPricingExtractionPipelineProps> = ({
  onRegisterToNewCatalog,
}) => {
  const [items, setItems] = useState<LegacyServicePriceItem[]>(initialLegacyServicePriceItems);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterOnlyActive, setFilterOnlyActive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'frequency' | 'latestPrice' | 'averagePrice' | 'title'>('frequency');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [isMigratingToast, setIsMigratingToast] = useState<boolean>(false);
  const [hasMigratedSuccessfully, setHasMigratedSuccessfully] = useState<boolean>(false);

  // Filtered & Sorted items
  const filteredItems = items
    .filter((item) => {
      const matchCat = filterCategory === 'all' || item.category === filterCategory;
      const matchActive = !filterOnlyActive || item.isActiveCurrent;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchActive && matchSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'frequency') {
        comparison = a.transactionCountInLegacy - b.transactionCountInLegacy;
      } else if (sortBy === 'latestPrice') {
        comparison = a.latestPrice - b.latestPrice;
      } else if (sortBy === 'averagePrice') {
        comparison = a.averagePrice - b.averagePrice;
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

  // Bulk pricing strategy change
  const handleApplyBulkStrategy = (strategy: 'latest' | 'average' | 'smart') => {
    setItems((prev) =>
      prev.map((item) => {
        if (strategy === 'smart') {
          // Latest for clinical services & surgeries, average for medications & goods
          const isService = item.category === 'service' || item.category === 'surgery';
          const newStrat = isService ? 'latest' : 'average';
          const newPrice = isService ? item.latestPrice : item.averagePrice;
          return { ...item, selectedStrategy: newStrat, chosenPrice: newPrice };
        } else {
          const newPrice = strategy === 'latest' ? item.latestPrice : item.averagePrice;
          return { ...item, selectedStrategy: strategy, chosenPrice: newPrice };
        }
      })
    );
  };

  // Toggle single item strategy
  const handleToggleItemStrategy = (itemId: string, strategy: 'latest' | 'average' | 'manual', manualVal?: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          let chosen = item.latestPrice;
          if (strategy === 'average') chosen = item.averagePrice;
          if (strategy === 'manual' && manualVal !== undefined) chosen = manualVal;
          return {
            ...item,
            selectedStrategy: strategy,
            chosenPrice: chosen,
          };
        }
        return item;
      })
    );
  };

  // Toggle item active state (جاری / منسوخ)
  const handleToggleActive = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isActiveCurrent: !item.isActiveCurrent } : item
      )
    );
  };

  // Execute migration to new clinic system
  const handleExecuteMigration = () => {
    setIsMigratingToast(true);
    setTimeout(() => {
      setIsMigratingToast(false);
      setHasMigratedSuccessfully(true);
      if (onRegisterToNewCatalog) {
        onRegisterToNewCatalog(items.filter((i) => i.isActiveCurrent));
      }
    }, 1200);
  };

  // Aggregate stats
  const activeCount = items.filter((i) => i.isActiveCurrent).length;
  const totalTransactions = items.reduce((sum, i) => sum + i.transactionCountInLegacy, 0);
  const totalRevenueLatest = items
    .filter((i) => i.isActiveCurrent)
    .reduce((sum, i) => sum + i.latestPrice * (i.transactionCountInLegacy / 10), 0);
  const totalRevenueChosen = items
    .filter((i) => i.isActiveCurrent)
    .reduce((sum, i) => sum + i.chosenPrice * (i.transactionCountInLegacy / 10), 0);

  const categoryLabels: Record<string, string> = {
    service: 'خدمات بالینی و پاراکلینیک',
    surgery: 'جراحی و بیهوشی',
    medication: 'داروخانه و ضد انگل',
    petshop_product: 'کالای پت‌شاپ و غذا',
    lab_test: 'آزمایشگاه و پاتولوژی',
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Header & Pipeline Info */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                پایپ‌لاین استخراج و قیمت‌گذاری کالاها و خدمات از SQL Server قدیمی
              </h2>
              <p className="text-xs text-slate-500">
                شناسایی اقلام پرکاربرد دیتابیس سابق، پالایش رکوردهای جاری، و تعیین قیمت با انتخاب آخرین نرخ یا میانگین وزنی
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csvData =
                'Code,Title,Category,Transactions,LatestPrice,AveragePrice,ChosenPrice,Strategy,IsActive\n' +
                items
                  .map(
                    (i) =>
                      `"${i.code}","${i.title}","${i.category}",${i.transactionCountInLegacy},${i.latestPrice},${i.averagePrice},${i.chosenPrice},"${i.selectedStrategy}",${i.isActiveCurrent}`
                  )
                  .join('\n');
              const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `extracted_prices_${Date.now()}.csv`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            خروجی اکسل / CSV
          </button>

          <button
            onClick={handleExecuteMigration}
            disabled={isMigratingToast}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isMigratingToast ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                در حال ثبت در پایگاه داده جدید...
              </>
            ) : hasMigratedSuccessfully ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                مهاجرت مجدد به کاتالوگ مهرگان
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                ثبت و اعمال در پایگاه داده جدید
              </>
            )}
          </button>
        </div>
      </div>

      {hasMigratedSuccessfully && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>عملیات موفقیت‌آمیز:</strong> تعداد {activeCount} قلم خدمت و کالای پرکاربرد با استراتژی‌های انتخابی کارشناس آی‌تی در دیتابیس جدید کلینیک ثبت و به صندوق و پذیرش متصل شد.
            </span>
          </div>
          <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
            SYNCED WITH SQL SERVER
          </span>
        </div>
      )}

      {/* Stats Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">کل اقلام استخراج شده</div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            {items.length} <span className="text-xs font-normal text-slate-500">مورد</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-1">
            {activeCount} قلم جاری و فعال
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">مجموع دفعات تراکنش و استفاده</div>
          <div className="text-xl font-bold text-indigo-700 mt-1">
            {totalTransactions.toLocaleString('fa-IR')}{' '}
            <span className="text-xs font-normal text-slate-500">فاکتور</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            سوابق ۳ ساله کلینیک قدیم
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">استراتژی اعمال شده قیمت‌ها</div>
          <div className="text-sm font-bold text-slate-800 mt-1.5 flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
              {items.filter((i) => i.selectedStrategy === 'latest').length} آخرین نرخ
            </span>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
              {items.filter((i) => i.selectedStrategy === 'average').length} میانگین
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            بر اساس تشخیص کارشناس آی‌تی
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">وضعیت پالایش داده‌ها (Cleansing)</div>
          <div className="text-sm font-bold text-emerald-700 mt-1.5 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {items.filter((i) => i.cleansedStatus === 'cleansed').length} از {items.length} پالایش شده
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            تطابق با کدهای نظام دامپزشکی
          </div>
        </div>
      </div>

      {/* Control Bar: Filters + Bulk Strategy buttons */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search and Filters */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="جستجو بر اساس نام خدمت، کالا یا کد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="all">همه دسته‌بندی‌ها</option>
              <option value="service">خدمات بالینی</option>
              <option value="surgery">جراحی‌ها</option>
              <option value="medication">داروها</option>
              <option value="petshop_product">کالاهای پت‌شاپ</option>
              <option value="lab_test">آزمایشگاه</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={filterOnlyActive}
                onChange={(e) => setFilterOnlyActive(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>صرفاً اقلام جاری (حذف منسوخ‌شده‌ها)</span>
            </label>
          </div>

          {/* Bulk Pricing Strategy Selector */}
          <div className="flex items-center gap-1.5 self-end md:self-auto">
            <span className="text-[11px] font-semibold text-slate-500">استراتژی گروهی:</span>
            <button
              onClick={() => handleApplyBulkStrategy('latest')}
              className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              title="اعمال آخرین قیمت برای تمام ردیف‌ها"
            >
              همه: آخرین نرخ
            </button>
            <button
              onClick={() => handleApplyBulkStrategy('average')}
              className="px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
              title="اعمال میانگین وزنی قیمت‌ها برای تمام ردیف‌ها"
            >
              همه: میانگین وزنی
            </button>
            <button
              onClick={() => handleApplyBulkStrategy('smart')}
              className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg border border-amber-200 flex items-center gap-1 transition-colors"
              title="ترکیب هوشمند: آخرین قیمت برای خدمات، میانگین برای کالاها و داروها"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              ترکیب هوشمند IT
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="p-3 text-center w-12">وضعیت</th>
                <th className="p-3">کد و عنوان خدمت / کالا</th>
                <th className="p-3">دسته‌بندی</th>
                <th
                  onClick={() => {
                    if (sortBy === 'frequency') {
                      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
                    } else {
                      setSortBy('frequency');
                      setSortDirection('desc');
                    }
                  }}
                  className="p-3 cursor-pointer hover:bg-slate-100 select-none text-indigo-900 font-bold"
                >
                  <div className="flex items-center gap-1">
                    <span>حجم تراکنش (پرکاربردترین‌ها)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 text-left">آخرین قیمت (تومان)</th>
                <th className="p-3 text-left">میانگین قیمت (تومان)</th>
                <th className="p-3 text-center">استراتژی انتخابی کارشناس</th>
                <th className="p-3 text-left font-bold text-slate-900">قیمت نهایی ثبت (تومان)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    هیچ رکوردی مطابق با فیلترها یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLatest = item.selectedStrategy === 'latest';
                  const isAvg = item.selectedStrategy === 'average';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !item.isActiveCurrent ? 'opacity-40 bg-slate-50/50' : ''
                      }`}
                    >
                      {/* Active toggle */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleActive(item.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            item.isActiveCurrent
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                          }`}
                          title={item.isActiveCurrent ? 'جاری در سیستم جدید' : 'منسوخ شده و حذف از سیستم'}
                        >
                          {item.isActiveCurrent ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-[10px] font-bold">حذف</span>
                          )}
                        </button>
                      </td>

                      {/* Code & Title */}
                      <td className="p-3">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{item.title}</span>
                          {item.cleansedStatus === 'cleansed' && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"
                              title="پالایش شده"
                            />
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          کد: {item.code} | واحد: {item.legacyUnit || 'واحد'}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                          {categoryLabels[item.category] || item.category}
                        </span>
                      </td>

                      {/* Transaction Count (Most Used) */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-indigo-700 text-sm">
                            {item.transactionCountInLegacy.toLocaleString('fa-IR')}
                          </span>
                          <span className="text-[10px] text-slate-400">تراکنش</span>
                        </div>
                        {item.transactionCountInLegacy > 1000 && (
                          <span className="inline-block px-1.5 py-0.2 text-[9px] font-semibold text-emerald-700 bg-emerald-50 rounded mt-0.5">
                            پرطرفدارترین
                          </span>
                        )}
                      </td>

                      {/* Latest Price */}
                      <td className="p-3 text-left font-mono text-slate-700">
                        {item.latestPrice.toLocaleString('fa-IR')}
                      </td>

                      {/* Average Price */}
                      <td className="p-3 text-left font-mono text-slate-500">
                        {item.averagePrice.toLocaleString('fa-IR')}
                      </td>

                      {/* Strategy Selection Buttons */}
                      <td className="p-3 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                          <button
                            onClick={() => handleToggleItemStrategy(item.id, 'latest')}
                            className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition-all ${
                              isLatest
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            آخرین نرخ
                          </button>
                          <button
                            onClick={() => handleToggleItemStrategy(item.id, 'average')}
                            className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition-all ${
                              isAvg
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            میانگین
                          </button>
                        </div>
                      </td>

                      {/* Chosen Final Price */}
                      <td className="p-3 text-left">
                        <span className="font-mono font-bold text-sm text-slate-900 bg-emerald-50/80 text-emerald-900 px-2.5 py-1 rounded-md border border-emerald-200">
                          {item.chosenPrice.toLocaleString('fa-IR')} تومان
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
