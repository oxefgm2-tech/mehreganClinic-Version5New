import React from 'react';
import {
  Mic,
  Camera,
  Bell,
  Wifi,
  Cloud,
  CheckCircle2,
  UserCheck,
  Shield,
  Clock,
  Sparkles,
  Car,
  Settings,
  ShieldCheck,
  Keyboard,
  Smartphone,
  LogOut,
} from 'lucide-react';
import { User, UserRole } from '../types';

const roleDisplayTitles: Partial<Record<UserRole, string>> = {
  admin: 'مدیر کلینیک',
  it_developer: 'کارشناس آی‌تی و توسعه',
  senior_veterinarian: 'مدیر ارشد و پزشک ارشد',
  veterinarian: 'دامپزشک',
  receptionist: 'پذیرش کلینیک',
  groomer: 'آرایشگر کلینیک',
  cashier: 'صندوقدار کلینیک',
  petshop_purchasing: 'مسئول خرید پت‌شاپ',
  petshop_sales: 'مسئول فروش پت‌شاپ',
  owner: 'سرپرست پت',
};

interface NavbarProps {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  onOpenVoiceSecretary: () => void;
  onOpenVisitorCamera?: () => void;
  onToggleNotifications: () => void;
  unreadNotifsCount: number;
  clinicPresenceCount: number;
  recordCount: number;
  onOpenSyncModal?: () => void;
  onOpenSnappTaxi?: () => void;
  onOpenClinicProfile?: () => void;
  onOpenAccessMatrix?: () => void;
  onOpenShortcuts?: () => void;
  onOpenMobileConnect?: () => void;
  onLogout: () => void;
  onOpenUserProfile: () => void;
  onOpenInviteUser?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  onOpenVoiceSecretary,
  onOpenVisitorCamera,
  onToggleNotifications,
  unreadNotifsCount,
  clinicPresenceCount,
  recordCount,
  onOpenSyncModal,
  onOpenSnappTaxi,
  onOpenClinicProfile,
  onOpenAccessMatrix,
  onOpenShortcuts,
  onOpenMobileConnect,
  onLogout,
  onOpenUserProfile,
  onOpenInviteUser,
}) => {
  const [currentDateTime, setCurrentDateTime] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      setCurrentDateTime(`${dateStr} - ساعت ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const rolesList: { role: UserRole; title: string }[] = [
    { role: 'admin', title: 'مدیر کلینیک' },
    { role: 'it_developer', title: 'کارشناس آی‌تی و توسعه' },
    { role: 'senior_veterinarian', title: 'مدیر ارشد و پزشک ارشد' },
    { role: 'veterinarian', title: 'دامپزشک' },
    { role: 'receptionist', title: 'پذیرش' },
    { role: 'groomer', title: 'آرایشگر' },
    { role: 'cashier', title: 'صندوقدار' },
    { role: 'petshop_purchasing', title: 'مسئول خرید پت‌شاپ' },
    { role: 'petshop_sales', title: 'مسئول فروش پت‌شاپ' },
    { role: 'owner', title: 'سرپرست پت' },
  ];

  return (
    <header id="app-navbar" className="bg-white border-b border-[#E6E9DF] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left / Start: Branding & Status Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#4A6741] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-[#2D3A27] text-base leading-none">
                    کلینیک دامپزشکی حیوانات خانگی مهرگان
                  </h1>
                  <span className="text-[10px] font-bold bg-[#E9EFE6] text-[#4A6741] px-2 py-0.5 rounded-full border border-[#D5DDD0]">
                    نسخه جامع کلینیکی
                  </span>
                </div>
                <p className="text-[11px] text-[#5C7457] mt-0.5 hidden sm:block">
                  اتاق عمل • استایلینگ • پت‌شاپ چندتب • اسنپ پت‌تاکسی • سرور محلی LAN
                </p>
              </div>
            </div>

            {/* Patients in clinic indicator */}
            <div className="hidden">
              <span className="w-2 h-2 rounded-full bg-[#4A6741] animate-pulse"></span>
              <span>{clinicPresenceCount} بیمار حاضر در کلینیک</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 bg-[#F7F8F3] text-[#2D3A27] border border-[#E6E9DF] px-2.5 py-1 rounded-xl text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#4A6741] animate-pulse"></span>
              <span>{recordCount} پرونده‌های موجود در سیستم</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 bg-[#F7F8F3] text-[#2D3A27] border border-[#E6E9DF] px-2.5 py-1 rounded-xl text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>{clinicPresenceCount} پت حاضر در کلینیک</span>
            </div>
          </div>

          {/* Center: Quick Action Triggers */}
          <div className="flex items-center gap-1.5">
            <button
              id="btn-voice-secretary-trigger"
              onClick={onOpenVoiceSecretary}
              className="group relative flex items-center gap-2 bg-[#4A6741] hover:bg-[#3D5535] text-white px-3.5 py-2 rounded-2xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              title="منشی صوتی کلینیک (کلید میانبر: Alt+F2)"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>منشی صوتی</span>
            </button>

            {onOpenSnappTaxi && (
              <button
                id="btn-snapp-taxi-trigger"
                onClick={onOpenSnappTaxi}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 px-3 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="درخواست اعزام اسنپ پت‌تاکسی با راننده آموزش‌دیده"
              >
                <Car className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden md:inline">اسنپ پت‌تاکسی</span>
              </button>
            )}

            {onOpenClinicProfile && (
              <button
                id="btn-clinic-profile-trigger"
                onClick={onOpenClinicProfile}
                className="flex items-center gap-1 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF] p-2 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="پیکربندی هویت کلینیک، پزشکان و پرسنل"
              >
                <Settings className="w-4 h-4 text-[#5C7457]" />
              </button>
            )}

            {onOpenAccessMatrix && (
              <button
                id="btn-rbac-matrix-trigger"
                onClick={onOpenAccessMatrix}
                className="flex items-center gap-1 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF] p-2 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="ماتریس دسترسی امنیتی RBAC و تفویض موقت"
              >
                <ShieldCheck className="w-4 h-4 text-[#5C7457]" />
              </button>
            )}

            {onOpenMobileConnect && (
              <button
                id="btn-mobile-connect-trigger"
                onClick={onOpenMobileConnect}
                className="flex items-center gap-1.5 bg-[#E9EFE6] hover:bg-[#D5DDD0] text-[#2D3A27] border border-[#D5DDD0] px-3 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="اتصال نسخه موبایل، تبلت و کلاینت ویندوز (PWA)"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#4A6741]" />
                <span className="hidden lg:inline">اتصال موبایل</span>
              </button>
            )}

            {onOpenShortcuts && (
              <button
                id="btn-shortcuts-trigger"
                onClick={onOpenShortcuts}
                className="flex items-center gap-1 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF] p-2 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="کلیدهای میانبر سامانه"
              >
                <Keyboard className="w-4 h-4 text-[#5C7457]" />
              </button>
            )}
            {onOpenInviteUser && (
              <button type="button" id="btn-invite-user" onClick={onOpenInviteUser} className="flex items-center gap-1 bg-[#E9EFE6] hover:bg-[#D5DDD0] text-[#2D3A27] border border-[#D5DDD0] px-3 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95">
                <UserCheck className="w-4 h-4 text-[#4A6741]" />
                <span className="hidden lg:inline">دعوت کاربر</span>
              </button>
            )}
          </div>

          {/* Right: Network status, Role Switcher, Notifications, Time */}
          <div className="flex items-center gap-2.5">
            {/* LAN & Cloud status badges */}
            <div className="hidden">
              <div className="flex items-center gap-1 text-[#4A6741] font-semibold">
                <Wifi className="w-3.5 h-3.5" />
                <span>LAN فعال (192.168.1.50)</span>
              </div>
              <span className="text-[#E6E9DF]">|</span>
              <button
                onClick={onOpenSyncModal}
                className={`flex items-center gap-1 text-[#5C7457] hover:text-[#2D3A27] font-semibold cursor-pointer ${!onOpenSyncModal ? 'hidden' : ''}`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>همگام</span>
              </button>
            </div>

            {/* Notifications button */}
            <button
              id="btn-notifications-toggle"
              onClick={onToggleNotifications}
              className="relative p-2 text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#F7F8F3] rounded-xl transition-colors cursor-pointer"
              title="اعلان‌ها و یادآوری‌ها"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#4A6741] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* User Profile Badge (لیست کشویی نقش‌ها از بالای صفحه طبق درخواست مخفی شد) */}
            <button type="button" id="user-profile-badge" onClick={onOpenUserProfile} className="flex items-center gap-2 bg-[#F7F8F3] px-3 py-1.5 rounded-2xl border border-[#E6E9DF] text-right">
              <div className="w-6 h-6 rounded-full bg-[#4A6741] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {currentUser.name ? currentUser.name.slice(0, 1) : 'ا'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#2D3A27] leading-none">{currentUser.name || 'کاربر'}</span>
                <span className="text-[10px] text-[#5C7457] leading-tight mt-0.5">{roleDisplayTitles[currentUser.role] || 'کاربر کلینیک'}</span>
              </div>
            </button>
            <button onClick={onLogout} className="p-2 text-[#5C7457] hover:bg-rose-50 hover:text-rose-700 rounded-xl" title="خروج از حساب">
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
