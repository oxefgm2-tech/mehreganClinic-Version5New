import React, { useState } from 'react';
import { X, User as UserIcon, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { apiClient } from '../services/apiClient';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onSaved: (user: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose, onSaved }) => {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [specialty, setSpecialty] = useState(user.specialty || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const updates: Record<string, string> = {
        name,
        phone,
        email,
        specialty,
      };
      if (password.trim()) {
        updates.password = password.trim();
      }
      const updatedUser = await apiClient.updateCurrentUser(updates);
      setSuccess(true);
      setTimeout(() => {
        onSaved({
          ...user,
          name,
          phone,
          email,
          specialty,
          ...(updatedUser || {}),
        });
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'خطا در ذخیره مشخصات پروفایل');
    } finally {
      setIsSaving(false);
    }
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
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#2D3A27]">ویرایش پروفایل کاربری</h2>
            <p className="text-xs text-[#5C7457]">نام کاربری: <span className="font-mono font-bold" dir="ltr">{user.username}</span></p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>اطلاعات پروفایل با موفقیت به‌روزرسانی شد.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">نام و نام خانوادگی</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">شماره تماس همراه</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] font-mono text-left"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
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
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] text-left"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">تخصص یا عنوان شغلی</label>
            <div className="relative">
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="مثلاً متخصص جراحی دام کوچک"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
              />
              <Award className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">تغییر رمز عبور (اختیاری)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="در صورت عدم تغییر، خالی بگذارید"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741]"
            />
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
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-[#4A6741] hover:bg-[#3d5535] rounded-xl transition-colors disabled:opacity-50"
            >
              {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
