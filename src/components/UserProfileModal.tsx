import React, { useState } from 'react';
import { User } from '../types';
import { apiClient } from '../services/apiClient';

export const UserProfileModal: React.FC<{ user: User; onClose: () => void; onSaved: (user: User) => void }> = ({ user, onClose, onSaved }) => {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const updated = await apiClient.updateCurrentUser({ name, email, phone, ...(password ? { password } : {}) });
      onSaved(updated as User);
      onClose();
    } catch (err: any) { setError(err?.message || 'ذخیرهٔ پروفایل ناموفق بود.'); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
    <form onSubmit={save} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-black text-[#2D3A27]">پروفایل من</h2><button type="button" onClick={onClose} className="text-slate-500">×</button></div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="نام و نام خانوادگی" className="w-full rounded-xl border px-3 py-2" required />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="ایمیل" className="w-full rounded-xl border px-3 py-2" type="email" />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="شماره موبایل" className="w-full rounded-xl border px-3 py-2" inputMode="tel" required />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="رمز جدید (اختیاری)" className="w-full rounded-xl border px-3 py-2" type="password" autoComplete="new-password" />
      {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <button disabled={saving} className="w-full rounded-xl bg-[#4A6741] py-3 font-bold text-white disabled:opacity-50">{saving ? 'در حال ذخیره…' : 'ذخیره پروفایل'}</button>
    </form>
  </div>;
};
