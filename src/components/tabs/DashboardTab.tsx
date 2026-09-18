import React from 'react';
import {
  PawPrint,
  Calendar,
  Building2,
  Receipt,
  Mic,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Stethoscope,
  Sparkles,
  Camera,
  Printer,
  ChevronRight,
  Eye,
  Scissors,
  DollarSign,
  Heart,
  ShieldAlert,
  Phone,
  FileText,
  BadgeCheck,
  Activity,
  Bell,
} from 'lucide-react';
import {
  Pet,
  Appointment,
  BoardingRecord,
  VisitRecord,
  Invoice,
  StaffAttendance,
  UserRole,
} from '../../types';

export interface DashboardTabProps {
  pets: Pet[];
  appointments: Appointment[];
  boardingRecords: BoardingRecord[];
  visits: VisitRecord[];
  invoices: Invoice[];
  attendance: StaffAttendance[];
  userRole: UserRole;
  onOpenVoiceSecretary: () => void;
  onOpenVisitorCamera: () => void;
  onNavigateToTab: (tabId: any) => void;
  onSelectPet: (pet: Pet) => void;
  onCheckOutPet: (petId: string) => void;
}

/**
 * RoleBasedDashboard - Component dynamically displaying customized widgets,
 * metrics, and clinical/administrative workflows tailored strictly to userRole.
 * Unauthorized sections (such as financial metrics for vets/groomers/owners,
 * or other clients' medical charts for pet owners) are completely hidden.
 */
export const RoleBasedDashboard: React.FC<DashboardTabProps> = ({
  pets = [],
  appointments = [],
  boardingRecords = [],
  visits = [],
  invoices = [],
  attendance = [],
  userRole,
  onOpenVoiceSecretary,
  onOpenVisitorCamera,
  onNavigateToTab,
  onSelectPet,
  onCheckOutPet,
}) => {
  // Safe base calculations
  const safePets = pets || [];
  const safeAppointments = appointments || [];
  const safeBoarding = boardingRecords || [];
  const safeVisits = visits || [];
  const safeInvoices = invoices || [];
  const safeAttendance = attendance || [];

  const presentPets = safePets.filter((p) => p && p.statusInClinic !== 'not_present');
  const waitingPets = safePets.filter((p) => p && (p.statusInClinic === 'waiting' || p.statusInClinic === 'in_exam'));
  const todayAppointments = safeAppointments.filter((a) => a && (a.date === 'امروز' || a.date?.includes('امروز')));
  const totalRevenueToday = safeInvoices.reduce((acc, inv) => acc + (inv?.paymentStatus === 'paid' ? (inv.finalTotal || 0) : 0), 0);
  const pendingInvoices = safeInvoices.filter((inv) => inv?.paymentStatus === 'pending' || inv?.paymentStatus === 'partially_paid');
  const pendingSpecializedDocs = safeVisits.filter((v) => v?.specializedType && v?.documentationStatus === 'pending_docs');
  const activeBoardingCount = safeBoarding.length;

  // =========================================================================
  // VIEW 1: VETERINARIAN DASHBOARD (دامپزشک - دکتر)
  // Focused on patient diagnosis, waiting exam queue, vitals, medical records.
  // Financial revenue & billing details are strictly hidden.
  // =========================================================================
  if (userRole === 'veterinarian') {
    return (
      <div id="tab-dashboard-veterinarian" className="space-y-6 animate-fadeIn pb-12">
        {/* Doctor Clinical Banner */}
        <div className="group bg-[#2D4427] text-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#22351D] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/15 text-[#D4E0CD] border border-white/20 px-3 py-1 rounded-full text-xs font-bold">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-300" />
                <span>میز کار بالینی و تخصصی دامپزشک شیفت</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                اتاق معاینه و ویزیت تخصصی
              </h2>
              <p data-hover-description className="text-xs sm:text-sm text-[#D4E0CD] leading-relaxed">
                ثبت معاینات بالینی، دستورات دارویی و ارجاع با دستیار هوشمند صوتی. دسترسی مستقیم به سوابق و علائم حیاتی بیماران حاضر در لابی.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenVoiceSecretary}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Mic className="w-5 h-5" />
                <span>دیکته صوتی شرح‌حال و نسخه</span>
              </button>
              <button
                onClick={() => onNavigateToTab('medical_records')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#D4E0CD]" />
                <span>ثبت پرونده جدید</span>
              </button>
            </div>
          </div>
        </div>

        {/* Doctor Clinical Metrics (Purely Clinical - No Financials) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigateToTab('reception_pets')}
            className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#4A6741] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C7457]">بیماران منتظر ویزیت پزشک</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2D3A27]">{waitingPets.length}</span>
              <span className="text-xs text-[#5C7457] font-bold">بیمار در لابی / معاینه</span>
            </div>
          </div>

          <div
            onClick={() => onNavigateToTab('appointments')}
            className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#4A6741] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C7457]">نوبت‌های بالینی امروز</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2D3A27]">{todayAppointments.length}</span>
              <span className="text-xs text-[#5C7457] font-bold">بیمار رزرو شده</span>
            </div>
          </div>

          <div
            onClick={() => onNavigateToTab('boarding')}
            className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#4A6741] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C7457]">بستری و تحت‌نظر پزشک</span>
              <div className="w-9 h-9 rounded-xl bg-[#F7F8F3] text-[#4A6741] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2D3A27]">{activeBoardingCount}</span>
              <span className="text-xs text-[#5C7457] font-bold">پت در پانسیون/بستری</span>
            </div>
          </div>

          <div
            onClick={() => onNavigateToTab('medical_records')}
            className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#4A6741] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C7457]">مستندات گرافی و جراحی معوق</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700">{pendingSpecializedDocs.length}</span>
              <span className="text-xs text-rose-600 font-bold">نیاز به تأیید پزشک</span>
            </div>
          </div>
        </div>

        {/* Doctor Main Grid: Patients awaiting exam + Urgent Doc checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waiting & Examination Queue */}
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-[#E6E9DF] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#2D3A27]">
                    صف بیماران آماده برای ویزیت و معاینه
                  </h3>
                  <p className="text-[11px] text-[#5C7457]">
                    انتخاب بیمار جهت بررسی پرونده سلامت، شرح حال و ثبت آزمایش
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab('reception_pets')}
                className="text-xs text-[#4A6741] hover:text-[#2D3A27] font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>کلینیک و پرونده‌ها</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presentPets.map((pet) => {
                const isDemoPet = pet.isDemo === true || pet.isVerified === false;
                return (
                <div
                  key={pet.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3 relative group ${
                    isDemoPet
                      ? 'bg-stone-100/90 border-dashed border-stone-300 text-stone-600'
                      : 'border-[#E6E9DF] bg-[#F7F8F3] hover:border-[#4A6741]'
                  }`}
                >
                  <img
                    src={pet.photoUrl}
                    alt={pet.name}
                    className={`w-14 h-14 rounded-2xl object-cover shrink-0 ${
                      isDemoPet ? 'grayscale-[75%] border border-stone-300 opacity-80' : 'border border-[#E6E9DF]'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <h4 className={`text-sm font-black truncate ${isDemoPet ? 'text-stone-700' : 'text-[#2D3A27]'}`}>{pet.name}</h4>
                        {isDemoPet && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 border border-stone-300">
                            طوسی
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDemoPet ? 'bg-stone-200 text-stone-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {pet.statusInClinic === 'in_exam' ? 'در حال معاینه' : 'در انتظار ویزیت'}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C7457] mt-0.5 truncate">{pet.breed} • {pet.ageText}</p>
                    <div className="text-[11px] text-[#5C7457] mt-1 flex items-center justify-between">
                      <span>سرپرست: {pet.ownerName}</span>
                      <span className="font-mono text-[#4A6741] font-bold">{pet.checkInTime || 'امروز'}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#E6E9DF]">
                      <button
                        onClick={() => onSelectPet(pet)}
                        className="flex-1 bg-[#4A6741] hover:bg-[#3D5535] text-white text-[11px] font-bold py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>شروع ویزیت و ثبت شرح حال</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

              {presentPets.length === 0 && (
                <div className="col-span-2 text-center py-8 text-[#5C7457] bg-[#F7F8F3] rounded-2xl border border-dashed border-[#E6E9DF]">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <p className="text-xs font-bold text-[#2D3A27]">هیچ بیماری در صف انتظار ویزیت قرار ندارد.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Medical Docs & Lab Tasks */}
          <div className="bg-white rounded-[32px] border border-[#E6E9DF] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#2D3A27]">
                  تأییدیه جراحی، رادیولوژی و سونو
                </h3>
                <p className="text-[11px] text-[#5C7457]">
                  پرونده‌های منتظر بررسی و تأیید نهایی پزشک
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {pendingSpecializedDocs.map((vis) => (
                <div
                  key={vis.id}
                  className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-rose-950">
                      {vis.petName} ({vis.procedures[0] || 'پرونده تخصصی'})
                    </span>
                    <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md font-bold">
                      نیازمند گرافی / سونو
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C7457]">
                    سرپرست: {vis.ownerName} • تاریخ: {vis.date}
                  </p>
                  <button
                    onClick={() => onNavigateToTab('medical_records')}
                    className="text-xs text-[#4A6741] hover:text-[#2D3A27] font-bold block pt-1 border-t border-rose-200/50"
                  >
                    مشاهده پرونده بالینی و الصاق مدارک ←
                  </button>
                </div>
              ))}

              {pendingSpecializedDocs.length === 0 && (
                <div className="text-center py-6 text-emerald-700 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                  <p className="text-xs font-bold">کلیه مستندات رادیولوژی و جراحی تأیید شده‌اند.</p>
                </div>
              )}
            </div>

            {/* Shift Colleagues Quick List */}
            <div className="pt-4 border-t border-[#E6E9DF]">
              <div className="text-xs font-bold text-[#2D3A27] mb-2 flex items-center justify-between">
                <span>همکاران حاضر در شیفت کلینیک:</span>
                <span className="text-[10px] text-[#4A6741] font-mono font-bold">{safeAttendance.length} نفر</span>
              </div>
              <div className="space-y-1.5">
                {safeAttendance.slice(0, 3).map((att) => (
                  <div key={att.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-[#F7F8F3] border border-[#E6E9DF]">
                    <span className="font-semibold text-[#2D3A27]">{att.staffName}</span>
                    <span className="text-[10px] text-[#5C7457]">ورود: {att.clockInTime}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: RECEPTIONIST DASHBOARD (پذیرش - آقا مهدی)
  // Focused on lobby check-in, appointments booking, visitor camera, phone queue.
  // Sensitive executive margins and surgery internal notes hidden.
  // =========================================================================
  if (userRole === 'receptionist') {
    return (
      <div id="tab-dashboard-receptionist" className="space-y-6 animate-fadeIn pb-12">
        {/* Receptionist Top Banner */}
        <div className="bg-[#3D5535] text-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#2D4427] relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/15 text-[#D4E0CD] border border-white/20 px-3 py-1 rounded-full text-xs font-bold">
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>میز پیشخوان پذیرش و ارتباط با مراجعین</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                مدیریت ورود، نوبت‌ها و مراجعین لابی
              </h2>
              <p className="text-xs sm:text-sm text-[#D4E0CD] leading-relaxed">
                ثبت ورود فوری بیماران، تخصیص به اتاق پزشک یا گرومینگ و ارسال اعلان به سرپرستان با دستیار صوتی.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenVoiceSecretary}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Mic className="w-5 h-5 text-slate-950" />
                <span>پذیرش صوتی سریع بیمار</span>
              </button>
              <button
                onClick={onOpenVisitorCamera}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>اسکن چهره / دوربین ورودی</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reception Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigateToTab('reception_pets')}
            className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#4A6741] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C7457]">حاضران در سالن انتظار</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PawPrint className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2D3A27]">{presentPets.length}</span>
              <span className="text-xs text-[#5C7457] font-bold">بیمار پذیرش شده</span>
            </div>
          </div>

          <div
            onClick={() => onNavigateToTab('appointments')}
            className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#4A6741] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C7457]">نوبت‌های رزرو امروز</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2D3A27]">{todayAppointments.length}</span>
              <span className="text-xs text-[#5C7457] font-bold">نوبت ثبت شده</span>
            </div>
          </div>

          <div
            onClick={() => onNavigateToTab('boarding')}
            className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#4A6741] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C7457]">پذیرش پانسیون فعال</span>
              <div className="w-9 h-9 rounded-xl bg-[#F7F8F3] text-[#4A6741] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2D3A27]">{activeBoardingCount}</span>
              <span className="text-xs text-[#5C7457] font-bold">پت اقامتی</span>
            </div>
          </div>

          <div
            onClick={() => onNavigateToTab('cashier')}
            className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#4A6741] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C7457]">فاکتورهای در انتظار تسویه</span>
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-orange-700">{pendingInvoices.length}</span>
              <span className="text-xs text-[#5C7457] font-bold">فاکتور باز</span>
            </div>
          </div>
        </div>

        {/* Receptionist Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waiting Lobby Management */}
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-[#E6E9DF] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#2D3A27]">
                  کنترل مراجعین و بیماران حاضر در کلینیک
                </h3>
                <p className="text-[11px] text-[#5C7457]">
                  هدایت بیمار به اتاق پزشک یا گرومینگ و تسریع ترخیص
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('reception_pets')}
                className="bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>پذیرش بیمار جدید</span>
              </button>
            </div>

            <div className="divide-y divide-[#E6E9DF]">
              {presentPets.map((pet) => {
                const isDemoPet = pet.isDemo === true || pet.isVerified === false;
                return (
                <div key={pet.id} className={`py-3 flex items-center justify-between gap-4 px-2 rounded-xl transition-all ${
                  isDemoPet ? 'bg-stone-100/70 border border-stone-200 my-1' : ''
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={pet.photoUrl}
                      alt={pet.name}
                      className={`w-11 h-11 rounded-xl object-cover ${
                        isDemoPet ? 'grayscale-[75%] border border-stone-300 opacity-80' : ''
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black ${isDemoPet ? 'text-stone-700' : 'text-[#2D3A27]'}`}>{pet.name}</span>
                        {isDemoPet && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 border border-stone-300">
                            طوسی
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          isDemoPet ? 'bg-stone-200 text-stone-700' : 'bg-[#E6E9DF] text-[#2D3A27]'
                        }`}>
                          {pet.species} • {pet.breed}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5C7457] mt-0.5">
                        سرپرست: {pet.ownerName} ({pet.ownerPhone}) • ورود: {pet.checkInTime || 'امروز'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectPet(pet)}
                      className="text-xs bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] font-bold px-3 py-1.5 rounded-xl transition-all"
                    >
                      جزئیات
                    </button>
                    <button
                      onClick={() => onCheckOutPet(pet.id)}
                      className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-xl transition-all"
                    >
                      ترخیص
                    </button>
                  </div>
                </div>
              );
            })}

              {presentPets.length === 0 && (
                <div className="text-center py-8 text-[#5C7457]">
                  <PawPrint className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#4A6741]" />
                  <p className="text-xs">در حال حاضر بیماری در لابی حضور ندارد.</p>
                </div>
              )}
            </div>
          </div>

          {/* Today's Appointments Timeline */}
          <div className="bg-white rounded-[32px] border border-[#E6E9DF] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#2D3A27]">نوبت‌های رزرو شده امروز</h3>
              <button
                onClick={() => onNavigateToTab('appointments')}
                className="text-xs text-[#4A6741] font-bold"
              >
                تقویم نوبت‌ها ←
              </button>
            </div>

            <div className="space-y-2.5">
              {todayAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF] text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#2D3A27]">
                    <span>{apt.petName} ({apt.serviceType})</span>
                    <span className="font-mono text-[#4A6741]">{apt.timeSlot}</span>
                  </div>
                  <div className="text-[11px] text-[#5C7457] flex items-center justify-between">
                    <span>سرپرست: {apt.ownerName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#2D3A27]">
                      {apt.vetName}
                    </span>
                  </div>
                </div>
              ))}

              {todayAppointments.length === 0 && (
                <div className="text-center py-6 text-xs text-[#5C7457]">
                  نوبت ثبت‌شده‌ای برای امروز یافت نشد.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: PET OWNER DASHBOARD (سرپرست پت - آرش علیزاده)
  // Dedicated Pet Parent portal: Only showing the owner's pets, their vaccines,
  // appointments, and medical passports. All other patients and internal clinic
  // metrics are 100% hidden.
  // =========================================================================
  if (userRole === 'owner') {
    // Never expose another patient's record to a pet-owner account.
    // Until an explicit account-to-owner relation exists, show no records.
    const ownerPets: Pet[] = [];

    return (
      <div id="tab-dashboard-owner" className="space-y-6 animate-fadeIn pb-12">
        {/* Pet Parent Welcome Banner */}
        <div className="bg-[#3A5534] text-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#2B4026] relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/15 text-[#D4E0CD] border border-white/20 px-3 py-1 rounded-full text-xs font-bold">
                <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
                <span>پورتال اختصاصی والدین حیوانات خانگی</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                خوش آمدید به باشگاه سلامت پت شما
              </h2>
              <p className="text-xs sm:text-sm text-[#D4E0CD] leading-relaxed">
                مشاهده پرونده الکترونیک سلامت، کارت واکسیناسیون، نوبت‌های پیش‌رو و امکان رزرو آسان ویزیت با پزشک.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateToTab('appointments')}
                className="bg-white hover:bg-[#F7F8F3] text-[#3A5534] px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>رزرو نوبت جدید</span>
              </button>
              <button
                onClick={() => onNavigateToTab('print_templates')}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>شناسنامه بهداشتی</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pet Parent Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C7457]">پت‌های من</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <PawPrint className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2D3A27]">{ownerPets.length}</span>
              <span className="text-xs text-[#5C7457] font-bold">پت ثبت شده</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C7457]">یادآور واکسن بعدی</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-lg font-black text-[#2D3A27]">{ownerPets[0]?.nextVaccineDate || '۱۴۰۳/۰۸/۱۵'}</span>
              <span className="text-xs text-blue-600 font-bold">واکسن هاری</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C7457]">وضعیت سلامت</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Heart className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-lg font-black text-emerald-700">عالی و تحت پایش</span>
              <span className="text-xs text-[#5C7457] font-bold">ویزیت دوره‌ای</span>
            </div>
          </div>
        </div>

        {/* My Pets Detailed Cards */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-[#2D3A27] flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-[#4A6741]" />
            <span>پرونده سلامت پت‌های شما</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ownerPets.map((pet) => (
              <div
                key={pet.id}
                className="bg-white rounded-[28px] border border-[#E6E9DF] p-6 shadow-xs hover:border-[#4A6741] transition-all space-y-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={pet.photoUrl}
                    alt={pet.name}
                    className="w-20 h-20 rounded-2xl object-cover border border-[#E6E9DF]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-black text-[#2D3A27]">{pet.name}</h4>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        {pet.species}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C7457] mt-1">{pet.breed} • {pet.ageText}</p>
                    <p className="text-xs text-[#5C7457] mt-0.5">وزن: {pet.weightKg} کیلوگرم</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E6E9DF] text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F7F8F3] space-y-1">
                    <span className="text-[10px] text-[#5C7457] block">واکسن بعدی:</span>
                    <span className="font-bold text-[#2D3A27] font-mono">{pet.nextVaccineDate}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F8F3] space-y-1">
                    <span className="text-[10px] text-[#5C7457] block">ضد انگل دوره‌ای:</span>
                    <span className="font-bold text-[#2D3A27] font-mono">{pet.nextParasiteDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      onSelectPet(pet);
                      onNavigateToTab('reception_pets');
                    }}
                    className="flex-1 bg-[#4A6741] hover:bg-[#3D5535] text-white font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer text-center"
                  >
                    مشاهده سوابق ویزیت
                  </button>
                  <button
                    onClick={() => onNavigateToTab('appointments')}
                    className="bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer"
                  >
                    رزرو نوبت
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency & Clinic Contact Widget */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-[28px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950">خط ویژه اورژانس و پشتیبانی ۲۴ ساعته کلینیک</h4>
              <p className="text-xs text-amber-800">در صورت هرگونه تغییر ناگهانی در علائم حیاتی یا بیحالی پت با کلینیک تماس بگیرید.</p>
            </div>
          </div>
          <a
            href="tel:02188889999"
            className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer"
          >
            تماس با اورژانس کلینیک (۰۲۱۸۸۸۸۹۹۹۹)
          </a>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: GROOMER DASHBOARD (آرایشگر - آقای سهراب منصوری)
  // Focused on grooming queue, checklist, and tip ledger.
  // =========================================================================
  if (userRole === 'groomer') {
    return (
      <div id="tab-dashboard-groomer" className="space-y-6 animate-fadeIn pb-12">
        <div className="bg-[#41563E] text-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#32452F] relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/15 text-[#D4E0CD] border border-white/20 px-3 py-1 rounded-full text-xs font-bold">
                <Scissors className="w-3.5 h-3.5 text-amber-300" />
                <span>میز کار گرومینگ و آرایشگاه تخصصی پت</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                صف اصلاح، شستشو و پاداش‌های شیفت
              </h2>
              <p className="text-xs sm:text-sm text-[#D4E0CD] leading-relaxed">
                مدیریت مراحل خدمات، چک‌لیست گام به گام و ارسال مستقیم انعام‌ها به صندوق.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('grooming')}
              className="bg-white hover:bg-[#F7F8F3] text-[#41563E] px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Scissors className="w-4 h-4" />
              <span>ورود به سالن گرومینگ</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigateToTab('grooming')}
            className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs cursor-pointer"
          >
            <span className="text-xs font-bold text-[#5C7457]">پت‌های حاضر برای گرومینگ</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2D3A27]">
                {safePets.filter((p) => p.statusInClinic === 'in_grooming' || p.statusInClinic === 'waiting').length}
              </span>
              <span className="text-xs text-[#5C7457] font-bold">پت در نوبت</span>
            </div>
          </div>

          <div
            onClick={() => onNavigateToTab('grooming')}
            className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs cursor-pointer"
          >
            <span className="text-xs font-bold text-[#5C7457]">گرومر شیفت فعال</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-lg font-black text-[#2D3A27]">آقای سهراب منصوری</span>
              <span className="text-xs text-emerald-600 font-bold">حاضر در سالن</span>
            </div>
          </div>

          <div
            onClick={() => onNavigateToTab('grooming')}
            className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs cursor-pointer"
          >
            <span className="text-xs font-bold text-[#5C7457]">انعام و پاداش ثبت‌شده</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-lg font-black text-emerald-700">کاردکس متصل به صندوق</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 5: CASHIER DASHBOARD (صندوقدار - سارا بیات)
  // Focused on invoices, payments, deposits, and daily settlement.
  // =========================================================================
  if (userRole === 'cashier') {
    return (
      <div id="tab-dashboard-cashier" className="space-y-6 animate-fadeIn pb-12">
        <div className="bg-[#2C4830] text-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#1E3321] relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/15 text-[#D4E0CD] border border-white/20 px-3 py-1 rounded-full text-xs font-bold">
                <Receipt className="w-3.5 h-3.5 text-emerald-300" />
                <span>میز صندوق و امور مالی مراجعین</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                تسویه فاکتورها، بیعانه‌ها و دریافت‌ها
              </h2>
              <p className="text-xs sm:text-sm text-[#D4E0CD] leading-relaxed">
                صدور فاکتور رسمی، پرداخت با کارتخوان متصل، و مدیریت حساب‌های باز.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('cashier')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>ورود به پیشخوان صندوق</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs">
            <span className="text-xs font-bold text-[#5C7457]">کل درآمد وصولی امروز</span>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-700">
                {totalRevenueToday.toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-[#5C7457] font-medium">تومان</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs">
            <span className="text-xs font-bold text-[#5C7457]">فاکتورهای باز در انتظار پرداخت</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{pendingInvoices.length}</span>
              <span className="text-xs text-[#5C7457] font-bold">فاکتور</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs">
            <span className="text-xs font-bold text-[#5C7457]">تراکنش‌های تسویه شده</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2D3A27]">
                {safeInvoices.filter((i) => i?.paymentStatus === 'paid').length}
              </span>
              <span className="text-xs text-[#5C7457] font-bold">تراکنش موفق</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 6: DEFAULT / ADMIN / IT DEVELOPER FULL CLINIC DASHBOARD
  // Full executive overview with all administrative, clinical and financial views.
  // =========================================================================
  return (
    <div id="tab-dashboard-admin" className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Voice Prompt Callout */}
      <div className="bg-[#4A6741] text-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#3D5535] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/15 text-[#D4E0CD] border border-white/20 px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>هوش مصنوعی بالینی و منشی صوتی آماده خدمت</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              میز کار هوشمند کلینیک اختصاصی حیوانات خانگی مهرگان
            </h2>
            <p className="text-xs sm:text-sm text-[#D4E0CD] leading-relaxed">
              ثبت ویزیت، نسخه، واکسیناسیون و خدمات صرفاً با صوت، بدون نیاز به تایپ دستی. رفع ابهام هوشمند با پت‌های حاضر در لابی.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenVoiceSecretary}
              className="bg-white hover:bg-[#F7F8F3] text-[#4A6741] px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Mic className="w-5 h-5 text-[#4A6741]" />
              <span>اجرای دستور صوتی (مثلاً: "پامر واکسن")</span>
            </button>

            <button
              onClick={onOpenVisitorCamera}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 backdrop-blur-xs transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#D4E0CD]" />
              <span>اسکن دوربین ورودی</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateToTab('reception_pets')}
          className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#8CA685] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5C7457]">بیماران حاضر در کلینیک</span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F8F3] text-[#4A6741] flex items-center justify-center group-hover:scale-110 transition-transform">
              <PawPrint className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#2D3A27]">{presentPets.length}</span>
            <span className="text-xs text-[#5C7457] font-bold">بیمار در نوبت ویزیت/خدمت</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('appointments')}
          className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#8CA685] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5C7457]">نوبت‌های امروز</span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F8F3] text-[#5C7457] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#2D3A27]">{todayAppointments.length}</span>
            <span className="text-xs text-[#5C7457] font-bold">نوبت رزرو شده</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('boarding')}
          className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#8CA685] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5C7457]">پانسیون و بستری VIP</span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F8F3] text-[#4A6741] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#2D3A27]">{activeBoardingCount}</span>
            <span className="text-xs text-[#5C7457] font-bold">پت تحت مراقبت ویژه</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('cashier')}
          className="bg-white p-5 rounded-[24px] border border-[#E6E9DF] shadow-xs hover:border-[#8CA685] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5C7457]">درآمد ثبت شده صندوق</span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F8F3] text-[#4A6741] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-[#4A6741]">
              {totalRevenueToday.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-[#5C7457] font-medium">تومان</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Waiting Room Patients & Pending Specialized Docs Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Clinic Waiting Room & Exam Hall */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-[#E6E9DF] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F7F8F3] text-[#4A6741] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#2D3A27]">
                  بیماران حاضر در لابی و سالن انتظار کلینیک
                </h3>
                <p className="text-[11px] text-[#5C7457]">
                  جهت تسریع دستورات صوتی ویزیت و پذیرش
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('reception_pets')}
              className="text-xs text-[#4A6741] hover:text-[#2D3A27] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده همه پرونده‌ها</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {presentPets.map((pet) => (
              <div
                key={pet.id}
                className="p-4 rounded-2xl border border-[#E6E9DF] bg-[#F7F8F3] hover:border-[#8CA685] transition-all flex items-start gap-3 relative group"
              >
                <img
                  src={pet.photoUrl}
                  alt={pet.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-[#E6E9DF] shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-[#2D3A27] truncate">{pet.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4E0CD] text-[#2D3A27]">
                      {pet.statusInClinic === 'waiting' && 'اتاق انتظار'}
                      {pet.statusInClinic === 'in_exam' && 'اتاق معاینه'}
                      {pet.statusInClinic === 'in_boarding' && 'بستری'}
                      {pet.statusInClinic === 'in_grooming' && 'آرایشگاه'}
                    </span>
                  </div>

                  <p className="text-xs text-[#5C7457] mt-0.5 truncate">{pet.breed} • {pet.ageText}</p>
                  
                  <div className="text-[11px] text-[#5C7457] mt-1 flex items-center justify-between">
                    <span>سرپرست: {pet.ownerName}</span>
                    <span className="font-mono text-[#4A6741] font-bold">{pet.checkInTime}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#E6E9DF]">
                    <button
                      onClick={() => onSelectPet(pet)}
                      className="flex-1 bg-white hover:bg-[#4A6741] hover:text-white border border-[#E6E9DF] hover:border-[#4A6741] text-[#2D3A27] text-[11px] font-bold py-1 px-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Stethoscope className="w-3 h-3" />
                      <span>پرونده بالینی</span>
                    </button>
                    <button
                      onClick={() => onCheckOutPet(pet.id)}
                      className="bg-[#E6E9DF] hover:bg-rose-100 hover:text-rose-700 text-[#2D3A27] text-[11px] font-bold py-1 px-2.5 rounded-xl transition-colors cursor-pointer"
                      title="ترخیص از کلینیک"
                    >
                      ترخیص
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {presentPets.length === 0 && (
              <div className="col-span-2 text-center py-8 text-[#5C7457] bg-[#F7F8F3] rounded-2xl border border-dashed border-[#E6E9DF]">
                <PawPrint className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#4A6741]" />
                <p className="text-xs">در حال حاضر بیماری در سالن انتظار ثبت نشده است.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Specialized Events & Document Upload Reminders */}
        <div className="bg-white rounded-[32px] border border-[#E6E9DF] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#2D3A27]">
                  یادآوری مستندات جراحی و رادیولوژی
                </h3>
                <p className="text-[11px] text-[#5C7457]">
                  پرونده‌های تخصصی نیازمند بارگذاری مدارک
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {pendingSpecializedDocs.map((vis) => (
              <div
                key={vis.id}
                className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-950">
                    {vis.petName} ({vis.procedures[0] || 'عمل تخصصی'})
                  </span>
                  <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md font-bold">
                    نیاز به تصویر رادیولوژی
                  </span>
                </div>

                <p className="text-[11px] text-[#5C7457] leading-relaxed">
                  پزشک ناظر: {vis.vetName} • سرپرست: {vis.ownerName}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-rose-200/60 text-xs">
                  <button
                    onClick={() => onNavigateToTab('medical_records')}
                    className="text-[#4A6741] hover:text-[#2D3A27] font-bold cursor-pointer"
                  >
                    بارگذاری فوری مستندات ←
                  </button>
                  <span className="text-[10px] text-[#5C7457] font-mono">{vis.date}</span>
                </div>
              </div>
            ))}

            {pendingSpecializedDocs.length === 0 && (
              <div className="text-center py-6 text-[#4A6741] bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF]">
                <CheckCircle2 className="w-7 h-7 mx-auto mb-1.5 text-[#4A6741]" />
                <p className="text-xs font-bold text-[#2D3A27]">تمام مستندات پرونده‌های تخصصی تکمیل است.</p>
              </div>
            )}
          </div>

          {/* Quick Staff Attendance Glance */}
          <div className="pt-4 border-t border-[#E6E9DF]">
            <div className="text-xs font-bold text-[#2D3A27] mb-2 flex items-center justify-between">
              <span>پرسنل حاضر در شیفت (اتصال خودکار Wi-Fi):</span>
              <span className="text-[10px] text-[#4A6741] font-mono font-bold">{safeAttendance.length} نفر حاضر</span>
            </div>
            <div className="space-y-1.5">
              {safeAttendance.slice(0, 3).map((att) => (
                <div key={att.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-[#F7F8F3] border border-[#E6E9DF]">
                  <span className="font-semibold text-[#2D3A27]">{att.staffName}</span>
                  <span className="text-[10px] text-[#4A6741] font-mono font-bold">ورود: {att.clockInTime}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Also export DashboardTab pointing to RoleBasedDashboard for backwards compatibility
export const DashboardTab: React.FC<DashboardTabProps> = (props) => {
  return <RoleBasedDashboard {...props} />;
};

export default RoleBasedDashboard;
