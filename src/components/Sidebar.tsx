import React from 'react';
import {
  LayoutDashboard,
  Mic,
  PawPrint,
  CalendarCheck,
  Stethoscope,
  Building2,
  ReceiptText,
  Clock3,
  Camera,
  Printer,
  Sparkles,
  Video,
  CloudUpload,
  User,
  LogOut,
  ChevronLeft,
  ShoppingBag,
  Code2,
  Layers,
} from 'lucide-react';
import { UserRole } from '../types';

export type TabId =
  | 'dashboard'
  | 'surgery_suite'
  | 'grooming_suite'
  | 'pet_shop'
  | 'voice_secretary'
  | 'reception_pets'
  | 'appointments'
  | 'medical_records'
  | 'boarding'
  | 'cashier'
  | 'it_dev_ide'
  | 'attendance'
  | 'visitor_camera'
  | 'print_templates'
  | 'ai_vet_assistant'
  | 'dvr_cctv'
  | 'cloud_migration'
  | 'owner_portal';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  userRole: UserRole;
  pendingBoardingTasks: number;
  waitingPetsCount: number;
  unreadAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  pendingBoardingTasks,
  waitingPetsCount,
  unreadAlertsCount,
}) => {
  // Keep the first operational release focused on stable clinic workflows.
  // Experimental suites remain in the codebase but are not exposed to users.
  const hiddenUntilReady = new Set<TabId>([
    'surgery_suite',
    'grooming_suite',
    'pet_shop',
    'it_dev_ide',
    'boarding',
    'cashier',
    'attendance',
    'visitor_camera',
    'print_templates',
    'ai_vet_assistant',
    'dvr_cctv',
    'cloud_migration',
  ]);
  const menuItems = [
    {
      id: 'dashboard' as TabId,
      label: 'میز کار و داشبورد',
      icon: LayoutDashboard,
      roles: ['admin', 'it_developer', 'senior_veterinarian', 'veterinarian', 'groomer', 'receptionist', 'cashier', 'petshop_purchasing', 'petshop_sales', 'owner'],
    },
    {
      id: 'surgery_suite' as TabId,
      label: 'اتاق عمل و جراحی OR',
      icon: Stethoscope,
      badge: 'پایش صوتی & حیاتی',
      badgeColor: 'bg-rose-200 text-rose-950 font-bold',
      roles: ['admin', 'it_developer', 'senior_veterinarian', 'veterinarian', 'receptionist'],
    },
    {
      id: 'grooming_suite' as TabId,
      label: 'استایلینگ و گرومینگ',
      icon: Sparkles,
      badge: 'ژورنال + پورتفولیو',
      badgeColor: 'bg-teal-200 text-teal-950 font-bold',
      roles: ['admin', 'it_developer', 'groomer', 'receptionist', 'cashier'],
    },
    {
      id: 'pet_shop' as TabId,
      label: 'پت‌شاپ، تامین و انبارداری (MDI)',
      icon: ShoppingBag,
      badge: 'چندتب + Vision AI',
      badgeColor: 'bg-amber-100 text-amber-900 font-bold',
      roles: ['admin', 'it_developer', 'petshop_purchasing', 'petshop_sales', 'receptionist', 'cashier', 'veterinarian'],
    },
    {
      id: 'it_dev_ide' as TabId,
      label: 'محیط توسعه و کدنویسی IT',
      icon: Code2,
      badge: 'IDE + SQL Server',
      badgeColor: 'bg-emerald-200 text-emerald-950 font-bold',
      roles: ['admin', 'it_developer'],
    },
    {
      id: 'voice_secretary' as TabId,
      label: 'منشی صوتی هوشمند',
      icon: Mic,
      badge: 'هسته صوتی',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      roles: ['admin', 'it_developer', 'veterinarian', 'groomer', 'receptionist', 'cashier', 'petshop_purchasing', 'petshop_sales'],
    },
    {
      id: 'reception_pets' as TabId,
      label: 'پذیرش و پرونده بیماران',
      icon: PawPrint,
      badge: waitingPetsCount > 0 ? `${waitingPetsCount} حاضر` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
      roles: ['admin', 'it_developer', 'senior_veterinarian', 'veterinarian', 'groomer', 'receptionist', 'cashier'],
    },
    {
      id: 'appointments' as TabId,
      label: 'صف‌ها و نوبت‌دهی (با بیعانه)',
      icon: CalendarCheck,
      badge: 'گیت بیعانه',
      badgeColor: 'bg-teal-100 text-teal-900',
      roles: ['admin', 'it_developer', 'veterinarian', 'receptionist', 'groomer', 'owner'],
    },
    {
      id: 'medical_records' as TabId,
      label: 'سوابق بالینی و نسخه‌نویسی',
      icon: Stethoscope,
      roles: ['admin', 'it_developer', 'senior_veterinarian', 'veterinarian'],
    },
    {
      id: 'boarding' as TabId,
      label: 'پانسیون و بستری VIP',
      icon: Building2,
      badge: pendingBoardingTasks > 0 ? `${pendingBoardingTasks} وظیفه` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
      roles: ['admin', 'it_developer', 'veterinarian', 'groomer', 'receptionist'],
    },
    {
      id: 'cashier' as TabId,
      label: 'صندوق و فاکتورها',
      icon: ReceiptText,
      roles: ['admin', 'it_developer', 'cashier', 'petshop_sales', 'receptionist'],
    },
    {
      id: 'attendance' as TabId,
      label: 'حضور و غیاب Wi-Fi',
      icon: Clock3,
      roles: ['admin', 'it_developer', 'veterinarian', 'groomer', 'receptionist', 'cashier', 'petshop_purchasing', 'petshop_sales'],
    },
    {
      id: 'visitor_camera' as TabId,
      label: 'دوربین ورودی و تشخیص AI',
      icon: Camera,
      roles: ['admin', 'it_developer', 'receptionist', 'veterinarian'],
    },
    {
      id: 'print_templates' as TabId,
      label: 'طراحی شناسنامه و چاپ فاکتور',
      icon: Printer,
      roles: ['admin', 'it_developer', 'veterinarian', 'receptionist', 'cashier'],
    },
    {
      id: 'ai_vet_assistant' as TabId,
      label: 'دستیار بالینی هوش مصنوعی',
      icon: Sparkles,
      badge: 'Gemini + VetNLP',
      badgeColor: 'bg-purple-100 text-purple-800',
      roles: ['admin', 'it_developer', 'veterinarian', 'receptionist'],
    },
    {
      id: 'dvr_cctv' as TabId,
      label: 'دوربین مداربسته و DVR',
      icon: Video,
      roles: ['admin', 'it_developer', 'receptionist'],
    },
    {
      id: 'cloud_migration' as TabId,
      label: 'همگام ابری و مهاجرت داده',
      icon: CloudUpload,
      roles: ['admin', 'it_developer', 'cashier', 'receptionist', 'veterinarian', 'groomer', 'petshop_purchasing', 'petshop_sales', 'owner'],
    },
  ];

  // Filter based on active role
  const filteredItems = menuItems.filter(item => item.roles.includes(userRole) && !hiddenUntilReady.has(item.id));

  return (
    <aside id="app-sidebar" className="w-64 bg-[#4A6741] text-white border-l border-[#3D5535] flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-3.5 flex-1 overflow-y-auto space-y-1">
        
        {/* Role Notice */}
        <div className="px-3.5 py-2.5 bg-white/10 border border-white/15 rounded-2xl mb-3">
          <div className="text-[11px] text-[#D4E0CD] font-medium">نقش جاری و دسترسی فعال:</div>
          <div className="text-xs font-bold text-white flex items-center justify-between mt-0.5">
            <span>
              {(userRole === 'admin' || userRole === 'senior_veterinarian') && 'مدیر ارشد و پزشک ارشد'}
              {userRole === 'it_developer' && 'کارشناس آی‌تی و توسعه (IDE + کدنویسی)'}
              {userRole === 'veterinarian' && 'دامپزشک (بالینی و جراحی)'}
              {userRole === 'receptionist' && 'پذیرش (پرونده و نوبت)'}
              {userRole === 'groomer' && 'آرایشگر (گرومینگ و پانسیون)'}
              {userRole === 'cashier' && 'صندوقدار (امور مالی)'}
              {userRole === 'petshop_purchasing' && 'مسئول خرید پت‌شاپ (انبار و اسکن)'}
              {userRole === 'petshop_sales' && 'مسئول فروش پت‌شاپ (صندوق و مشاوره)'}
              {userRole === 'owner' && 'سرپرست پت (پورتال اختصاصی)'}
            </span>
          </div>
        </div>

        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white/20 text-white shadow-xs'
                  : 'text-[#D4E0CD] hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#D4E0CD]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-lg shrink-0 font-bold ${isActive ? 'bg-[#D4E0CD] text-[#2D3A27]' : 'bg-white/15 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-white/10 text-[11px] text-[#D4E0CD] bg-black/10">
        <div className="flex items-center justify-between font-medium">
          <span>نسخه سیستم: ۳.۱.۰</span>
          <span className="text-white font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LAN آماده
          </span>
        </div>
        <div className="mt-1 text-[10px] text-[#D4E0CD]/80">
          کلینیک اختصاصی حیوانات خانگی مهرگان • VetCloud Pro
        </div>
      </div>
    </aside>
  );
};
