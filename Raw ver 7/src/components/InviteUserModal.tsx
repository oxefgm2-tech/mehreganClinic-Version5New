import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, UserCheck, Copy, Check } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('veterinarian');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.inviteUser({
        name,
        phone,
        email: email.trim() || undefined,
        role,
      });
      const token = res.token || res.invitation?.token || res.data?.token;
      if (token) {
        const link = `${window.location.origin}?invite=${encodeURIComponent(token)}`;
        setInviteLink(link);
      } else {
        setInviteLink(`${window.location.origin}?invited=true`);
      }
      if (onCreated) onCreated();
    } catch (err: any) {
      setError(err?.message || 'خطا در صدور دعوت‌نامه کاربر');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E9DF] relative">
        <button
          onClick={onClose}
          className="absolute left-5 top-5 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#4A6741]/10 text-[#4A6741] flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#2D3A27]">دعوت همکار جدید</h2>
            <p className="text-xs text-[#5C7457]">ایجاد لینک دعوت برای پیوستن به کادر درمان یا اداری</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}

        {inviteLink ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 mb-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                دعوت‌نامه با موفقیت ایجاد شد!
              </div>
              این لینک یک‌بارمصرف را برای همکار خود ارسال کنید تا حساب کاربری خود را تکمیل و رمز عبور تعیین کند.
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={inviteLink}
                dir="ltr"
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono select-all text-left"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="absolute left-2 p-1.5 text-gray-500 hover:text-[#4A6741] transition-colors"
                title="کپی لینک"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-white bg-[#4A6741] hover:bg-[#3d5535] rounded-xl transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">نام و نام خانوادگی همکار</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً دکتر مریم سعیدی"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">شماره همراه</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912..."
                  dir="ltr"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] font-mono text-left"
                  required
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">آدرس ایمیل (اختیاری)</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mehreganpetclinic.ir"
                  dir="ltr"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] text-left"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">نقش سازمانی</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] bg-white"
              >
                <option value="veterinarian">دامپزشک</option>
                <option value="receptionist">پذیرش و منشی</option>
                <option value="cashier">مسئول حسابداری و صندوق</option>
                <option value="groomer">آرایشگر و گرومر</option>
                <option value="petshop_sales">فروشنده پت‌شاپ</option>
                <option value="petshop_purchasing">مامور خرید و انباردار</option>
                <option value="it_developer">کارشناس فناوری اطلاعات (IT)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-[#4A6741] hover:bg-[#3d5535] rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'در حال صدور...' : 'ایجاد لینک دعوت'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
