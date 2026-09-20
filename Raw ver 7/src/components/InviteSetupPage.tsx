import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, Phone, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface InviteSetupPageProps {
  token: string;
}

export const InviteSetupPage: React.FC<InviteSetupPageProps> = ({ token }) => {
  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiClient.getInvitation(token);
        if (!cancelled && data) {
          setInvitation(data);
          setName(data.name || '');
          setPhone(data.phone || '');
          setEmail(data.email || '');
          setUsername(data.email ? data.email.split('@')[0] : '');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'لینک دعوت نامعتبر یا منقضی شده است.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('کلمه عبور و تکرار آن یکسان نیستند.');
      return;
    }
    if (password.length < 6) {
      setError('کلمه عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.completeUserInvitation(token, {
        name,
        username,
        password,
        phone,
        email: email.trim() || undefined,
      });
      setIsCompleted(true);
      setTimeout(() => {
        window.location.href = window.location.pathname;
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'تکمیل حساب کاربری ناموفق بود.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F7F8F3] flex items-center justify-center p-6 text-[#2D3A27]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#4A6741] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#5C7457]">در حال بررسی لینک دعوت...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F7F8F3] flex items-center justify-center p-6 text-[#2D3A27]">
        <div className="w-full max-w-md bg-white border border-[#E6E9DF] rounded-3xl shadow-lg p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black">لینک دعوت نامعتبر است</h2>
          <p className="text-xs text-gray-600">{error}</p>
          <button
            onClick={() => { window.location.href = window.location.pathname; }}
            className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-[#4A6741] rounded-xl"
          >
            بازگشت به صفحه ورود
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F8F3] flex items-center justify-center p-6 text-[#2D3A27]">
      <div className="w-full max-w-md bg-white border border-[#E6E9DF] rounded-3xl shadow-lg p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#4A6741]/10 text-[#4A6741] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black">فعال‌سازی حساب کلینیک مهرگان</h1>
            <p className="text-xs text-[#5C7457]">خوش‌آمدید! لطفاً اطلاعات ورود خود را تعیین کنید.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}

        {isCompleted ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-bold">حساب شما با موفقیت فعال شد!</div>
            <p>در حال انتقال به صفحه ورود...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">نام و نام خانوادگی</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741]"
                  required
                />
                <User className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">نام کاربری جهت ورود</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                dir="ltr"
                placeholder="مثلاً dr.rezaei"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] font-mono text-left"
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
                  dir="ltr"
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] font-mono text-left"
                  required
                />
                <Phone className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">آدرس ایمیل</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] text-left"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">کلمه عبور جدید</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741]"
                  required
                />
                <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">تکرار کلمه عبور</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741]"
                  required
                />
                <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 text-xs font-bold text-white bg-[#4A6741] hover:bg-[#3d5535] rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'در حال ثبت نهایی...' : 'تکمیل و فعال‌سازی حساب'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
