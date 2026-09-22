import React from 'react';
import { Clock3, MapPin, Phone, ShieldCheck, Stethoscope } from 'lucide-react';
import type { ClinicProfileConfig } from '../types';

interface ClinicPublicIntroProps {
  profile: ClinicProfileConfig;
  onLogin: () => void;
}

export const ClinicPublicIntro: React.FC<ClinicPublicIntroProps> = ({ profile, onLogin }) => {
  const phone = profile.phoneNumbers?.[0] || profile.emergencyPhone;

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F8F3] text-[#2D3A27]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D5E2CF] bg-white px-3 py-1.5 text-xs font-bold text-[#4A6741]">
            <ShieldCheck className="h-4 w-4" />
            سامانه رسمی کلینیک مهرگان
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#4A6741] text-white shadow-lg">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black leading-tight sm:text-4xl">{profile.clinicName}</h1>
              <p className="mt-2 text-base font-medium text-[#5C7457]">{profile.tagline}</p>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-8 text-[#53644E] sm:text-base">{profile.aboutUsText}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E1E8DC] bg-white p-4">
              <MapPin className="mb-2 h-5 w-5 text-[#4A6741]" />
              <div className="text-xs font-bold text-[#6B7D66]">نشانی</div>
              <div className="mt-1 text-sm font-bold leading-6">{profile.address}</div>
            </div>
            <div className="rounded-2xl border border-[#E1E8DC] bg-white p-4">
              <Phone className="mb-2 h-5 w-5 text-[#4A6741]" />
              <div className="text-xs font-bold text-[#6B7D66]">تماس</div>
              <div className="mt-1 text-sm font-bold" dir="ltr">{phone || '—'}</div>
            </div>
            <div className="rounded-2xl border border-[#E1E8DC] bg-white p-4">
              <Clock3 className="mb-2 h-5 w-5 text-[#4A6741]" />
              <div className="text-xs font-bold text-[#6B7D66]">ساعات کاری</div>
              <div className="mt-1 text-sm font-bold leading-6">{profile.workingHours?.weekdays || 'طبق برنامهٔ کلینیک'}</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#E1E8DC] bg-white p-6 shadow-xl shadow-[#30452A]/10 sm:p-8">
          <div className="mb-6">
            <div className="text-xs font-bold text-[#6B7D66]">ورود پرسنل و مدیران</div>
            <h2 className="mt-2 text-2xl font-black">ورود به سامانه</h2>
            <p className="mt-2 text-sm leading-7 text-[#64745F]">برای دسترسی به پرونده‌ها، پذیرش، نوبت‌ها و امور مالی وارد شوید.</p>
          </div>
          <button type="button" onClick={onLogin} className="w-full rounded-xl bg-[#4A6741] py-3.5 font-bold text-white transition hover:bg-[#385331]">
            ورود به پنل کلینیک
          </button>
          <div className="mt-5 rounded-2xl bg-[#F3F7F0] p-4 text-xs leading-6 text-[#5C7457]">
            دسترسی هر کاربر بر اساس نقش و مجوزهای ثبت‌شده کنترل می‌شود.
          </div>
        </section>
      </div>
    </main>
  );
};
