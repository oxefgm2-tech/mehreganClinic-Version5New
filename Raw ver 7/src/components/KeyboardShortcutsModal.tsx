import React from 'react';
import {
  Keyboard,
  X,
  Command,
  CornerDownLeft,
  ScanBarcode,
  Search,
  Plus,
  Shield,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutsList = [
    {
      key: 'Alt + 1 الی Alt + 9',
      description: 'جابجایی سریع بین تب‌ها (پذیرش، پرونده، جراحی، گرومینگ، پت‌شاپ، صندوق و ...)',
      category: 'ناوبری عمومی',
    },
    {
      key: 'F2',
      description: 'فوکوس فوری روی اسکنر بارکد پت‌شاپ و صندوق',
      category: 'فروش و پت‌شاپ',
    },
    {
      key: 'F4',
      description: 'تسویه سریع فاکتور جاری و چاپ رسید',
      category: 'صندوق و مالی',
    },
    {
      key: 'F8',
      description: 'باز کردن پنجره اعزام اسنپ پت‌تاکسی',
      category: 'سرویس‌ها',
    },
    {
      key: 'Ctrl / Cmd + K',
      description: 'جستجوی سراسری بیمار، پرونده و کالا',
      category: 'جستجو',
    },
    {
      key: 'Esc',
      description: 'بستن پنجره‌های مودال و منوهای باز',
      category: 'عمومی',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#FAFBF7] w-full max-w-lg rounded-2xl shadow-2xl border border-[#E6E9DF] p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E9DF]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#4A6741] text-white flex items-center justify-center shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2D3A27]">کلیدهای میانبر سامانه مهرگان (Keyboard Shortcuts)</h3>
              <p className="text-[11px] text-[#5C7457]">کلیدهای دسترسی سریع جهت افزایش چشمگیر سرعت اپراتور</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#738A6E] hover:text-[#2D3A27] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto">
          {shortcutsList.map((sc, idx) => (
            <div
              key={idx}
              className="p-3 bg-white rounded-xl border border-[#E6E9DF] flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-[#2D3A27] block">{sc.description}</span>
                <span className="text-[10px] text-[#738A6E] bg-[#F7F8F3] px-1.5 py-0.5 rounded-sm">
                  {sc.category}
                </span>
              </div>
              <kbd className="px-2.5 py-1.5 bg-[#2D3A27] text-white rounded-lg font-mono text-[11px] font-bold shrink-0 shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>تمامی دکمه‌ها و فیلدهای کلیدی سیستم دارای تولتیپ (راهنمای شناور) هستند.</span>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#2D3A27] text-white hover:bg-[#1E271A] px-5 py-2 rounded-xl text-xs font-bold"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};
