import React, { useEffect, useState } from 'react';
import { UserRole } from '../types';
import { apiClient } from '../services/apiClient';

const roles: Array<{ value: UserRole; label: string }> = [
  { value: 'veterinarian', label: 'دامپزشک' },
  { value: 'receptionist', label: 'پذیرش' },
  { value: 'groomer', label: 'آرایشگر' },
  { value: 'cashier', label: 'صندوقدار' },
  { value: 'petshop_purchasing', label: 'خرید پت‌شاپ' },
  { value: 'petshop_sales', label: 'فروش پت‌شاپ' },
  { value: 'owner', label: 'سرپرست پت' },
];

export const InviteUserModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreated: () => void }> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('veterinarian');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (isOpen) { setError(''); setSaving(false); setInviteLink(''); }
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const result = await apiClient.inviteUser({ name, phone, email, role });
      setName(''); setPhone(''); setEmail('');
      setInviteLink(`${window.location.origin}${result?.setupPath || ''}`);
      onCreated();
    } catch (err: any) { setError(err?.message || 'دعوت کاربر ناموفق بود.'); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
    <form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-black text-[#2D3A27]">دعوت کاربر و اختصاص نقش</h2><button type="button" onClick={onClose} className="text-slate-500 text-xl">×</button></div>
      <p className="text-xs text-[#5C7457]">نقش توسط شما قفل می‌شود؛ دعوت‌شده در لینک دعوت نام کاربری و رمز عبور خود را تعیین می‌کند.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="نام و نام خانوادگی *" className="rounded-xl border px-3 py-2" required />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="شماره موبایل *" className="rounded-xl border px-3 py-2" required inputMode="tel" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="ایمیل (اختیاری)" className="rounded-xl border px-3 py-2" type="email" />
        <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="rounded-xl border px-3 py-2 font-bold" aria-label="نقش دعوت‌شده">{roles.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      </div>
      {inviteLink && <div className="rounded-xl bg-[#E9EFE6] px-3 py-2 text-xs text-[#2D3A27] break-all">لینک دعوت آماده شد: <span dir="ltr">{inviteLink}</span><button type="button" className="mr-2 underline font-bold" onClick={() => navigator.clipboard?.writeText(inviteLink)}>کپی</button></div>}
      {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <button disabled={saving} className="w-full rounded-xl bg-[#4A6741] py-3 font-bold text-white disabled:opacity-50">{saving ? 'در حال ساخت دعوتنامه…' : inviteLink ? 'ساخت دعوتنامه جدید' : 'ارسال دعوتنامه با نقش قفل‌شده'}</button>
    </form>
  </div>;
};
