import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Printer,
  Smartphone,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Utensils,
  Receipt,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { MessengerPlatform, OmnichannelMessagePayload } from '../types';

interface OmnichannelShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: OmnichannelMessagePayload;
  onConfirmSent?: () => void;
}

export const OmnichannelShareModal: React.FC<OmnichannelShareModalProps> = ({
  isOpen,
  onClose,
  payload,
  onConfirmSent,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<MessengerPlatform>(payload.platform || 'bale');
  const [isCopied, setIsCopied] = useState(false);
  const [editedBody, setEditedBody] = useState(payload.formattedBodyText);

  if (!isOpen) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(editedBody);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const getPlatformShareUrl = (platform: MessengerPlatform): string => {
    const encodedText = encodeURIComponent(editedBody);
    const cleanPhone = payload.recipientPhone ? payload.recipientPhone.replace(/^0/, '+98') : '';

    switch (platform) {
      case 'bale':
        // پیام‌رسان بله ایرانی (بر پایه پروتکل اشتراک‌گذاری)
        return `https://ble.ir/share/url?url=${encodeURIComponent('https://vetcloud.ir')}&text=${encodedText}`;
      case 'telegram':
        return `https://t.me/share/url?url=${encodeURIComponent('https://vetcloud.ir')}&text=${encodedText}`;
      case 'whatsapp':
        return cleanPhone
          ? `https://wa.me/${cleanPhone}?text=${encodedText}`
          : `https://wa.me/?text=${encodedText}`;
      default:
        return '#';
    }
  };

  const handleOpenMessenger = (platform: MessengerPlatform) => {
    const url = getPlatformShareUrl(platform);
    window.open(url, '_blank', 'noopener,noreferrer');
    if (onConfirmSent) {
      onConfirmSent();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#2D3A27]/70 backdrop-blur-xs">
      <div
        id="omnichannel-share-modal"
        className="bg-white rounded-[28px] max-w-2xl w-full text-[#2D3A27] shadow-2xl border border-[#E6E9DF] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 bg-[#F7F8F3] border-b border-[#E6E9DF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4A6741] text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2D3A27] flex items-center gap-2">
                <span>ارسال مستقیم گزارش و پیام برای سرپرست پت</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#D4E0CD] text-[#2D3A27] font-bold">
                  واتساپ • تلگرام • بله
                </span>
              </h3>
              <p className="text-xs text-[#5C7457] mt-0.5">
                گیرنده: <strong className="text-[#2D3A27]">{payload.recipientName}</strong> (شماره: {payload.recipientPhone || 'ثبت نشده'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#E6E9DF] rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Category Banner */}
          <div className="p-3.5 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-[#2D3A27]">
              {payload.type === 'invoice' && <Receipt className="w-4 h-4 text-[#4A6741]" />}
              {payload.type === 'medical_report' && <FileText className="w-4 h-4 text-[#4A6741]" />}
              {payload.type === 'nutrition_guide' && <Utensils className="w-4 h-4 text-[#5C7457]" />}
              {payload.type === 'supplement_safety' && <HeartHandshake className="w-4 h-4 text-emerald-700" />}
              {payload.type === 'personalized_offer' && <Sparkles className="w-4 h-4 text-amber-700" />}
              <span>{payload.title}</span>
            </div>
            <span className="text-[11px] text-[#5C7457]">
              قالب استاندارد و رسمی کلینیک مهرگان
            </span>
          </div>

          {/* Message Text Editor / Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#2D3A27]">
              <span>متن نهایی پیام ارسالی (امکان ویرایش قبل از ارسال):</span>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 text-[#4A6741] hover:text-[#3D5535] cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی متن</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={9}
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="w-full p-3.5 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl text-xs text-[#2D3A27] leading-relaxed focus:outline-none focus:border-[#4A6741] font-sans resize-none"
              placeholder="متن پیام را در اینجا بنویسید یا ویرایش فرمایید..."
            />
          </div>

          {/* Social Platforms Selector */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-[#2D3A27]">
              انتخاب نرم‌افزار پیام‌رسان مقصد:
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* Bale (بله) */}
              <button
                onClick={() => setSelectedPlatform('bale')}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlatform === 'bale'
                    ? 'bg-[#D4E0CD]/40 border-[#4A6741] shadow-xs'
                    : 'bg-white border-[#E6E9DF] hover:bg-[#F7F8F3]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-extrabold text-xs text-[#2D3A27]">پیام‌رسان بله (Bale)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                </div>
                <p className="text-[11px] text-[#5C7457]">
                  پشتیبانی از پروتکل بومی ایران و انتقال سریع
                </p>
              </button>

              {/* Telegram */}
              <button
                onClick={() => setSelectedPlatform('telegram')}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlatform === 'telegram'
                    ? 'bg-[#D4E0CD]/40 border-[#4A6741] shadow-xs'
                    : 'bg-white border-[#E6E9DF] hover:bg-[#F7F8F3]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-extrabold text-xs text-[#2D3A27]">تلگرام (Telegram)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                </div>
                <p className="text-[11px] text-[#5C7457]">
                  ارسال در قالب پیام و کانال کلینیک
                </p>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => setSelectedPlatform('whatsapp')}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlatform === 'whatsapp'
                    ? 'bg-[#D4E0CD]/40 border-[#4A6741] shadow-xs'
                    : 'bg-white border-[#E6E9DF] hover:bg-[#F7F8F3]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-extrabold text-xs text-[#2D3A27]">واتس‌اپ (WhatsApp)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                </div>
                <p className="text-[11px] text-[#5C7457]">
                  ارسال مستقیم به شماره همراه سرپرست
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F7F8F3] border-t border-[#E6E9DF] flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl border border-[#E6E9DF] hover:bg-[#E6E9DF] text-[#2D3A27] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#5C7457]" />
            <span>چاپ برگه / ذخیره PDF</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#5C7457] hover:bg-[#E6E9DF] transition-all cursor-pointer"
            >
              انصراف
            </button>
            <button
              onClick={() => handleOpenMessenger(selectedPlatform)}
              className="px-5 py-2.5 rounded-xl bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>
                ارسال در {selectedPlatform === 'bale' ? 'بله' : selectedPlatform === 'telegram' ? 'تلگرام' : 'واتساپ'}
              </span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
