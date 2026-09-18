import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

export const InviteSetupPage: React.FC<{ token: string }> = ({ token }) => {
  const [info, setInfo] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { apiClient.getInvitation(token).then((value) => { setInfo(value); setName(value.name || ''); setPhone(value.phone || ''); setEmail(value.email || ''); }).catch((err) => setError(err.message)); }, [token]);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); try { await apiClient.completeUserInvitation(token, { name, phone, email, username, password }); setMessage('حساب شما ساخته شد. اکنون می‌توانید وارد شوید.'); } catch (err: any) { setError(err.message); } };
  if (message) return <div dir="rtl" className="min-h-screen bg-[#F7F8F3] flex items-center justify-center p-6"><div className="rounded-3xl bg-white p-8 shadow-lg text-center"><h1 className="text-xl font-black">{message}</h1><button className="mt-5 rounded-xl bg-[#4A6741] px-6 py-3 font-bold text-white" onClick={() => { window.history.replaceState({}, '', '/'); window.location.reload(); }}>ورود به سامانه</button></div></div>;
  return <div dir="rtl" className="min-h-screen bg-[#F7F8F3] flex items-center justify-center p-6"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg space-y-4"><h1 className="text-xl font-black">تکمیل دعوتنامه کلینیک مهرگان</h1>{info && <div className="rounded-xl bg-[#E9EFE6] px-3 py-2 text-sm">نقش اختصاص‌یافته: <strong>{info.role}</strong></div>}<input required value={name} onChange={e => setName(e.target.value)} placeholder="نام و نام خانوادگی" className="w-full rounded-xl border px-3 py-2" /><input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="شماره موبایل" className="w-full rounded-xl border px-3 py-2" /><input value={email} onChange={e => setEmail(e.target.value)} placeholder="ایمیل" type="email" className="w-full rounded-xl border px-3 py-2" /><input required value={username} onChange={e => setUsername(e.target.value)} placeholder="نام کاربری دلخواه" className="w-full rounded-xl border px-3 py-2" dir="ltr" /><input required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="رمز عبور دلخواه (حداقل ۶ حرف)" type="password" className="w-full rounded-xl border px-3 py-2" dir="ltr" />{error && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}<button disabled={!info} className="w-full rounded-xl bg-[#4A6741] py-3 font-bold text-white disabled:opacity-50">ثبت اطلاعات و فعال‌سازی حساب</button></form></div>;
};
