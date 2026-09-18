import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  PawPrint,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Send,
  MessageSquare,
  Sparkles,
  Check,
  X,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Copy,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Phone,
  Trash2,
  Database,
} from 'lucide-react';
import { Appointment, Pet, ClinicQueueDefinition } from '../../types';
import { RemotePetSearchSelect } from '../RemotePetSearchSelect';

interface AppointmentsTabProps {
  appointments: Appointment[];
  pets: Pet[];
  queues: ClinicQueueDefinition[];
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  onUpdateStatus: (appointmentId: string, status: 'scheduled' | 'checked_in' | 'completed' | 'cancelled') => void;
  onToggleReminder: (appointmentId: string) => void;
  onApproveOnlineRequest: (appointmentId: string, requiresDeposit: boolean, depositAmount: number) => void;
  onConfirmDepositPayment: (appointmentId: string, transactionRef?: string) => void;
  onCreateQueue?: (newQueue: Omit<ClinicQueueDefinition, 'id'>) => void;
  onUpdateQueue?: (queueId: string, updates: Partial<ClinicQueueDefinition>) => void;
  onDirectRecordImmediateService?: (petId: string, serviceTitle: string, cost: number) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({
  appointments,
  pets,
  queues,
  onAddAppointment,
  onUpdateStatus,
  onToggleReminder,
  onApproveOnlineRequest,
  onConfirmDepositPayment,
  onCreateQueue,
  onUpdateQueue,
  onDirectRecordImmediateService,
  onDeleteAppointment,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'queues_live' | 'all_appointments' | 'online_requests' | 'queue_definitions'>('queues_live');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQueue, setFilterQueue] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'tomorrow'>('all');
  
  // Registration Modals
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [isImmediateServiceModalOpen, setIsImmediateServiceModalOpen] = useState(false);
  const [isNewQueueModalOpen, setIsNewQueueModalOpen] = useState(false);

  // Link dispatch toast
  const [copiedPaymentLinkId, setCopiedPaymentLinkId] = useState<string | null>(null);
  const [dispatchedMessageAppointmentId, setDispatchedMessageAppointmentId] = useState<string | null>(null);

  // New Appointment Form State
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || '');
  const [selectedQueueCode, setSelectedQueueCode] = useState<string>('surgery');
  const [appointmentType, setAppointmentType] = useState<'future_appointment' | 'immediate_service_record'>('future_appointment');
  const [date, setDate] = useState('فردا');
  const [timeSlot, setTimeSlot] = useState('۰۹:۰۰ - ۱۰:۳۰');
  const [serviceType, setServiceType] = useState('جراحی ارتوپدی و عقیم‌سازی');
  const [vetName, setVetName] = useState('دکتر امین بیاتی (جراح)');
  const [requiresDeposit, setRequiresDeposit] = useState(true);
  const [depositAmount, setDepositAmount] = useState(2000000);
  const [notes, setNotes] = useState('');

  // Immediate Service Form State
  const [immPetId, setImmPetId] = useState<string>(pets[0]?.id || '');
  const [immServiceTitle, setImmServiceTitle] = useState('گرومینگ و اصلاح آرایشی مو');
  const [immCost, setImmCost] = useState(650000);

  // New Queue Form State
  const [newQueueTitle, setNewQueueTitle] = useState('');
  const [newQueueCode, setNewQueueCode] = useState('ultrasound');
  const [newQueueDesc, setNewQueueDesc] = useState('صف سونوگرافی و تصویربرداری تشخیصی شکمی');
  const [newQueueReqDeposit, setNewQueueReqDeposit] = useState(false);
  const [newQueueDepositAmount, setNewQueueDepositAmount] = useState(0);
  const [newQueueCapacity, setNewQueueCapacity] = useState(3);
  const [newQueueDuration, setNewQueueDuration] = useState(30);
  const [newQueueStaffRole, setNewQueueStaffRole] = useState<'veterinarian' | 'groomer' | 'receptionist'>('veterinarian');
  const [newQueueStaffName, setNewQueueStaffName] = useState('دکتر کیکاووس کیانی');

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      String(apt.petName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(apt.ownerName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(apt.serviceType ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      filterDate === 'all' ||
      (filterDate === 'today' && String(apt.date ?? '').includes('امروز')) ||
      (filterDate === 'tomorrow' && String(apt.date ?? '').includes('فردا'));

    const matchesQueue =
      filterQueue === 'all' ||
      apt.queueCode === filterQueue ||
      apt.queueId === filterQueue;

    return matchesSearch && matchesDate && matchesQueue;
  });

  const pendingOnlineRequests = appointments.filter(
    (a) => a.clientRequestedOnline && a.operatorApprovalStatus === 'pending_approval'
  );

  const handleCreateAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find((p) => p.id === selectedPetId) || pets[0];
    if (!pet) return;

    const matchedQueue = queues.find((q) => q.code === selectedQueueCode);

    onAddAppointment({
      appointmentType: 'future_appointment',
      queueId: matchedQueue?.id || 'q-surg',
      queueCode: selectedQueueCode,
      petId: pet.id,
      petName: pet.name,
      petBreed: pet.breed,
      ownerId: pet.ownerId,
      ownerName: pet.ownerName,
      ownerPhone: pet.ownerPhone,
      vetId: 'u-1',
      vetName,
      serviceType,
      date,
      timeSlot,
      status: 'scheduled',
      requiresDeposit,
      depositAmount: requiresDeposit ? depositAmount : 0,
      depositStatus: requiresDeposit ? 'pending_payment' : 'none',
      depositPaymentLink: requiresDeposit ? `https://pay.vetcloud.ir/dep/${selectedQueueCode}-${Date.now()}` : undefined,
      clientRequestedOnline: false,
      operatorApprovalStatus: 'approved_queued',
      reminder24hSent: false,
      notes,
    });

    setIsNewAppointmentModalOpen(false);
    setNotes('');
  };

  const handleImmediateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!immPetId || !onDirectRecordImmediateService) return;
    onDirectRecordImmediateService(immPetId, immServiceTitle, immCost);
    setIsImmediateServiceModalOpen(false);
  };

  const handleCreateQueueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQueueTitle.trim() || !onCreateQueue) return;

    onCreateQueue({
      code: newQueueCode,
      title: newQueueTitle.trim(),
      description: newQueueDesc.trim(),
      requiresDeposit: newQueueReqDeposit,
      defaultDepositAmountToman: newQueueReqDeposit ? newQueueDepositAmount : 0,
      avgDurationMinutes: newQueueDuration,
      maxConcurrentCapacity: newQueueCapacity,
      assignedStaffRole: newQueueStaffRole,
      assignedStaffName: newQueueStaffName,
      color: '#4A6741',
      isActive: true,
      autoSmsReminder: true,
    });

    setIsNewQueueModalOpen(false);
    setNewQueueTitle('');
  };

  const handleCopyPaymentLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedPaymentLinkId(id);
    setTimeout(() => setCopiedPaymentLinkId(null), 2500);
  };

  const handleSendMessageLink = (apt: Appointment, messenger: 'bale' | 'sms' | 'telegram' | 'whatsapp') => {
    setDispatchedMessageAppointmentId(apt.id);
    setTimeout(() => setDispatchedMessageAppointmentId(null), 3000);
  };

  return (
    <div id="tab-appointments" className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header Banner */}
      <div className="bg-white p-5 rounded-3xl border border-[#E6E9DF] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#4A6741] text-white flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-[#2D3A27]">
                سیستم جامع مدیریت صف‌ها، نوبت‌دهی و بیعانه جراحی
              </h2>
              {pendingOnlineRequests.length > 0 && (
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                  {pendingOnlineRequests.length} درخواست آنلاین در انتظار تایید
                </span>
              )}
              <div className="flex items-center gap-1.5 bg-[#F7F8F3] px-2.5 py-1 rounded-full border border-[#D4E0CD]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Database className="w-3 h-3 text-[#4A6741]" />
                <span className="text-[10px] font-bold text-[#2D3A27]">دیتابیس صف‌ها و نوبت‌ها پایدار</span>
              </div>
            </div>
            <p className="text-xs text-[#5C7457] mt-0.5">
              تفکیک صریح ثبت نوبت تقویمی از ثبت فوری خدمت • گیت بیعانه شاپرک و پیام‌رسان بله برای جراحی و گرومینگ
            </p>
          </div>
        </div>

        {/* Action Buttons: Scheduling vs Immediate Service */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsImmediateServiceModalOpen(true)}
            className="flex-1 md:flex-initial bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF] px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
            title="ثبت فوری خدمت برای بیمار حاضر در کلینیک بدون نوبت قبلی"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>ثبت خود خدمت حاضر</span>
          </button>

          <button
            onClick={() => setIsNewAppointmentModalOpen(true)}
            className="flex-1 md:flex-initial bg-[#4A6741] hover:bg-[#3D5535] text-white px-4 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>رزرو نوبت تقویمی</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="bg-white p-2 rounded-2xl border border-[#E6E9DF] shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('queues_live')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'queues_live'
              ? 'bg-[#4A6741] text-white shadow-xs'
              : 'text-[#5C7457] hover:bg-[#F7F8F3]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>صف‌های تخصصی زنده کلینیک</span>
          <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-md">
            {queues.length} صف
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('online_requests')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'online_requests'
              ? 'bg-[#4A6741] text-white shadow-xs'
              : 'text-[#5C7457] hover:bg-[#F7F8F3]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>درخواست‌های آنلاین مشترکین</span>
          {pendingOnlineRequests.length > 0 && (
            <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">
              {pendingOnlineRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('all_appointments')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'all_appointments'
              ? 'bg-[#4A6741] text-white shadow-xs'
              : 'text-[#5C7457] hover:bg-[#F7F8F3]'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>لیست تقویمی و تمام نوبت‌ها</span>
        </button>

        <button
          onClick={() => setActiveSubTab('queue_definitions')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'queue_definitions'
              ? 'bg-[#4A6741] text-white shadow-xs'
              : 'text-[#5C7457] hover:bg-[#F7F8F3]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>تنظیمات و تعریف صف‌ها</span>
        </button>
      </div>

      {/* VIEW 1: LIVE QUEUES DASHBOARD */}
      {activeSubTab === 'queues_live' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {queues.map((queue) => {
              const queueApts = appointments.filter(
                (a) => (a.queueCode === queue.code || a.queueId === queue.id) && a.status !== 'cancelled'
              );
              const checkedInCount = queueApts.filter((a) => a.status === 'checked_in').length;
              const scheduledCount = queueApts.filter((a) => a.status === 'scheduled').length;

              return (
                <div
                  key={queue.id}
                  className="bg-white rounded-3xl border border-[#E6E9DF] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#4A6741] transition-all"
                >
                  <div>
                    {/* Queue Card Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-[#E6E9DF]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: queue.color || '#4A6741' }}
                          />
                          <h3 className="text-sm font-black text-[#2D3A27]">{queue.title}</h3>
                        </div>
                        <p className="text-[11px] text-[#5C7457] mt-1 leading-relaxed">{queue.description}</p>
                      </div>

                      {queue.requiresDeposit && (
                        <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                          بیعانه الزامی: {queue.defaultDepositAmountToman.toLocaleString('fa-IR')} ت
                        </span>
                      )}
                    </div>

                    {/* Queue Metrics & Capacity */}
                    <div className="grid grid-cols-3 gap-2 my-3 text-center text-xs">
                      <div className="bg-[#F7F8F3] p-2 rounded-2xl border border-[#E6E9DF]">
                        <div className="text-[10px] text-[#5C7457]">حاضر در صف</div>
                        <div className="text-sm font-black text-[#2D3A27] mt-0.5">{checkedInCount}</div>
                      </div>
                      <div className="bg-[#F7F8F3] p-2 rounded-2xl border border-[#E6E9DF]">
                        <div className="text-[10px] text-[#5C7457]">رزرو آینده</div>
                        <div className="text-sm font-black text-[#4A6741] mt-0.5">{scheduledCount}</div>
                      </div>
                      <div className="bg-[#F7F8F3] p-2 rounded-2xl border border-[#E6E9DF]">
                        <div className="text-[10px] text-[#5C7457]">ظرفیت همزمان</div>
                        <div className="text-sm font-black text-[#2D3A27] mt-0.5">{queue.maxConcurrentCapacity}</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#5C7457] flex items-center justify-between pb-2">
                      <span>مسئول / پزشک صف:</span>
                      <span className="font-bold text-[#2D3A27]">{queue.assignedStaffName}</span>
                    </div>

                    {/* Active Patients in this Queue */}
                    <div className="space-y-2 mt-2 pt-2 border-t border-[#E6E9DF]">
                      <div className="text-[11px] font-bold text-[#2D3A27]">بیماران در این صف:</div>
                      {queueApts.length === 0 ? (
                        <div className="text-center py-4 text-[11px] text-[#5C7457] bg-[#F7F8F3] rounded-2xl">
                          در حال حاضر بیماری در این صف قرار ندارد.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {queueApts.map((apt) => (
                            <div
                              key={apt.id}
                              className="p-2.5 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF] text-xs flex items-center justify-between"
                            >
                              <div>
                                <div className="font-bold text-[#2D3A27] flex items-center gap-1.5">
                                  <span>{apt.petName}</span>
                                  <span className="text-[10px] text-[#5C7457]">({apt.petBreed})</span>
                                </div>
                                <div className="text-[10px] text-[#5C7457]">{apt.timeSlot} • {apt.date}</div>
                              </div>

                              <div className="text-left flex items-center gap-1.5">
                                {apt.requiresDeposit && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                      apt.depositStatus === 'paid'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {apt.depositStatus === 'paid' ? 'بیعانه پرداخت شد' : 'در انتظار بیعانه'}
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                    apt.status === 'checked_in'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-sky-100 text-sky-800'
                                  }`}
                                >
                                  {apt.status === 'checked_in' ? 'حاضر' : 'رزرو'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E6E9DF] flex items-center justify-between">
                    <span className="text-[11px] text-[#5C7457]">
                      میانگین زمان: <strong>{queue.avgDurationMinutes} دقیقه</strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedQueueCode(queue.code);
                        setIsNewAppointmentModalOpen(true);
                      }}
                      className="text-xs text-[#4A6741] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن به این صف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: CLIENT ONLINE REQUESTS & OPERATOR APPROVAL */}
      {activeSubTab === 'online_requests' && (
        <div className="space-y-4">
          <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-3xl text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-700 shrink-0" />
              <span>
                درخواست‌های زیر توسط مشترکین و سرپرستان پت از پورتال یا ربات بله/تلگرام ثبت شده‌اند. اپراتور پس از بررسی، نوبت را تایید کرده و لینک پرداخت بیعانه خودکار صادر می‌شود.
              </span>
            </div>
            <span className="font-bold font-mono text-sm bg-amber-200/70 px-2.5 py-1 rounded-xl">
              {pendingOnlineRequests.length} مورد معلق
            </span>
          </div>

          {pendingOnlineRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-[#E6E9DF] text-center text-[#5C7457] space-y-2">
              <CheckCircle2 className="w-12 h-12 text-[#4A6741] mx-auto" />
              <h3 className="text-sm font-bold text-[#2D3A27]">تمام درخواست‌های آنلاین تایید شده‌اند</h3>
              <p className="text-xs">هیچ درخواست جدیدی در انتظار تایید اپراتور وجود ندارد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOnlineRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl border-2 border-amber-300 p-5 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                          {req.petName.slice(0, 1)}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#2D3A27]">{req.petName}</h4>
                          <span className="text-xs text-[#5C7457]">{req.petBreed} • سرپرست: {req.ownerName}</span>
                        </div>
                      </div>

                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                        در انتظار تایید اپراتور
                      </span>
                    </div>

                    <div className="bg-[#F7F8F3] p-3 rounded-2xl border border-[#E6E9DF] space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#5C7457]">نوع خدمت درخواستی:</span>
                        <strong className="text-[#2D3A27]">{req.serviceType}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#5C7457]">تاریخ و ساعت پیشنهادی:</span>
                        <span className="font-bold text-[#4A6741]">{req.date} • {req.timeSlot}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#5C7457]">شماره تماس سرپرست:</span>
                        <span className="font-mono text-[#2D3A27]">{req.ownerPhone}</span>
                      </div>
                      {req.notes && (
                        <div className="pt-1 text-[11px] text-[#5C7457]">
                          یادداشت: {req.notes}
                        </div>
                      )}
                    </div>

                    {req.requiresDeposit && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CreditCard className="w-4 h-4 text-rose-700" />
                          <span>بیعانه الزامی رزرو جراحی/گرومینگ:</span>
                        </div>
                        <span className="font-mono font-black text-sm">
                          {req.depositAmount?.toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Operator Approval Flow Buttons */}
                  <div className="pt-3 border-t border-[#E6E9DF] flex flex-col sm:flex-row items-center gap-2">
                    <button
                      onClick={() => onApproveOnlineRequest(req.id, !!req.requiresDeposit, req.depositAmount || 0)}
                      className="w-full bg-[#4A6741] hover:bg-[#3D5535] text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>تایید نوبت و صدور لینک بیعانه</span>
                    </button>

                    <button
                      onClick={() => onUpdateStatus(req.id, 'cancelled')}
                      className="w-full sm:w-auto bg-[#F7F8F3] hover:bg-rose-100 hover:text-rose-800 text-[#5C7457] px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                    >
                      رد درخواست
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: ALL APPOINTMENTS & CALENDAR FILTER */}
      {activeSubTab === 'all_appointments' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-3xl border border-[#E6E9DF] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5C7457] absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در نام پت، سرپرست، خدمت یا شماره تماس..."
                className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl pr-10 pl-4 py-2 text-xs text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterQueue}
                onChange={(e) => setFilterQueue(e.target.value)}
                className="bg-[#F7F8F3] border border-[#E6E9DF] text-xs font-bold text-[#2D3A27] rounded-2xl px-3 py-2"
              >
                <option value="all">همه صف‌ها</option>
                {queues.map((q) => (
                  <option key={q.id} value={q.code}>{q.title}</option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-[#F7F8F3] p-1 rounded-2xl border border-[#E6E9DF] text-xs">
                <button
                  onClick={() => setFilterDate('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    filterDate === 'all' ? 'bg-white text-[#2D3A27] shadow-xs' : 'text-[#5C7457]'
                  }`}
                >
                  همه
                </button>
                <button
                  onClick={() => setFilterDate('today')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    filterDate === 'today' ? 'bg-white text-[#4A6741] shadow-xs' : 'text-[#5C7457]'
                  }`}
                >
                  امروز
                </button>
                <button
                  onClick={() => setFilterDate('tomorrow')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    filterDate === 'tomorrow' ? 'bg-white text-[#4A6741] shadow-xs' : 'text-[#5C7457]'
                  }`}
                >
                  فردا
                </button>
              </div>
            </div>
          </div>

          {/* Appointments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-3xl border border-[#E6E9DF] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#4A6741] transition-all"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#D4E0CD] text-[#2D3A27] flex items-center justify-center font-black text-sm">
                        {apt.petName.slice(0, 1)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#2D3A27]">{apt.petName}</h3>
                        <div className="text-[11px] text-[#5C7457] font-medium">{apt.petBreed}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        apt.status === 'checked_in'
                          ? 'bg-emerald-100 text-emerald-800 font-black'
                          : apt.status === 'scheduled'
                          ? 'bg-sky-100 text-sky-800'
                          : apt.status === 'completed'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {apt.status === 'checked_in' && 'حاضر در کلینیک'}
                      {apt.status === 'scheduled' && 'رزرو شده'}
                      {apt.status === 'completed' && 'انجام شد'}
                      {apt.status === 'cancelled' && 'لغو شده'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="p-2.5 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF] flex items-center justify-between">
                      <span className="text-[#5C7457] font-medium">خدمت:</span>
                      <span className="font-bold text-[#2D3A27]">{apt.serviceType}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-[#F7F8F3] rounded-xl border border-[#E6E9DF] flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#4A6741] shrink-0" />
                        <span className="font-bold text-[#2D3A27]">{apt.date}</span>
                      </div>

                      <div className="p-2 bg-[#F7F8F3] rounded-xl border border-[#E6E9DF] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#4A6741] shrink-0" />
                        <span className="font-bold text-[#2D3A27]">{apt.timeSlot}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#5C7457] flex items-center justify-between">
                      <span>پزشک/استایلیست:</span>
                      <span className="font-bold text-[#2D3A27]">{apt.vetName}</span>
                    </div>

                    <div className="text-[11px] text-[#5C7457] flex items-center justify-between">
                      <span>سرپرست:</span>
                      <span className="font-bold text-[#2D3A27]">
                        {apt.ownerName} ({apt.ownerPhone})
                      </span>
                    </div>

                    {/* Deposit Status Pill */}
                    {apt.requiresDeposit && (
                      <div className="mt-2 p-2.5 rounded-2xl border text-xs flex items-center justify-between bg-[#F7F8F3] border-[#E6E9DF]">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#4A6741]" />
                          <span className="text-[#5C7457]">بیعانه:</span>
                          <strong className="text-[#2D3A27]">
                            {apt.depositAmount?.toLocaleString('fa-IR')} ت
                          </strong>
                        </div>

                        {apt.depositStatus === 'paid' ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3" /> پرداخت شد
                          </span>
                        ) : (
                          <button
                            onClick={() => onConfirmDepositPayment(apt.id)}
                            className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                            title="ثبت دستی دریافت بیعانه کارتخوان"
                          >
                            در انتظار (تایید دستی)
                          </button>
                        )}
                      </div>
                    )}

                    {/* Deposit Payment Link Actions */}
                    {apt.requiresDeposit && apt.depositPaymentLink && (
                      <div className="p-2 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF] space-y-1.5">
                        <div className="text-[10px] text-[#5C7457] flex items-center justify-between">
                          <span>لینک پرداخت شاپرک / بله:</span>
                          <button
                            onClick={() => handleCopyPaymentLink(apt.depositPaymentLink!, apt.id)}
                            className="text-[#4A6741] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedPaymentLinkId === apt.id ? 'کپی شد!' : 'کپی لینک'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            onClick={() => handleSendMessageLink(apt, 'bale')}
                            className="flex-1 bg-white hover:bg-[#E6E9DF] border border-[#E6E9DF] py-1 rounded-lg text-center font-bold text-[#2D3A27] transition-all cursor-pointer"
                          >
                            ارسال در بله
                          </button>
                          <button
                            onClick={() => handleSendMessageLink(apt, 'sms')}
                            className="flex-1 bg-white hover:bg-[#E6E9DF] border border-[#E6E9DF] py-1 rounded-lg text-center font-bold text-[#2D3A27] transition-all cursor-pointer"
                          >
                            پیامک SMS
                          </button>
                          <button
                            onClick={() => handleSendMessageLink(apt, 'whatsapp')}
                            className="flex-1 bg-white hover:bg-[#E6E9DF] border border-[#E6E9DF] py-1 rounded-lg text-center font-bold text-[#2D3A27] transition-all cursor-pointer"
                          >
                            واتس‌اپ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-[#E6E9DF] flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => onToggleReminder(apt.id)}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                      apt.reminder24hSent
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#F7F8F3] text-[#5C7457] hover:bg-[#E6E9DF]'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{apt.reminder24hSent ? 'یادآور ارسال شد' : 'ارسال یادآور'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {onDeleteAppointment && (
                      <button
                        onClick={() => {
                          if (window.confirm(`آیا از حذف نوبت ${apt.petName} (${apt.serviceType}) از دیتابیس اطمینان دارید؟`)) {
                            onDeleteAppointment(apt.id);
                          }
                        }}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer border border-rose-200"
                        title="حذف نوبت از سرور"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {apt.status === 'scheduled' && (
                      <button
                        onClick={() => onUpdateStatus(apt.id, 'checked_in')}
                        className="p-1.5 bg-[#4A6741] text-white hover:bg-[#3D5535] rounded-xl transition-colors cursor-pointer"
                        title="ثبت ورود بیمار به کلینیک"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                      <button
                        onClick={() => onUpdateStatus(apt.id, 'completed')}
                        className="p-1.5 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] rounded-xl transition-colors cursor-pointer"
                        title="اتمام نوبت و ترخیص"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: QUEUE DEFINITIONS & CONFIGURATION */}
      {activeSubTab === 'queue_definitions' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-[#E6E9DF] shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#2D3A27]">تعریف و شخصی‌سازی صف‌های کلینیک</h3>
              <p className="text-xs text-[#5C7457]">تنظیم قوانین بیعانه، سقف ظرفیت همزمان و نقش‌های تخصصی</p>
            </div>

            <button
              onClick={() => setIsNewQueueModalOpen(true)}
              className="bg-[#4A6741] hover:bg-[#3D5535] text-white px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>تعریف صف جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queues.map((q) => (
              <div
                key={q.id}
                className="bg-white p-5 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E6E9DF]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: q.color }} />
                    <h4 className="text-sm font-black text-[#2D3A27]">{q.title}</h4>
                  </div>
                  <span className="font-mono text-xs text-[#5C7457]">{q.code}</span>
                </div>

                <p className="text-xs text-[#5C7457] leading-relaxed">{q.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#F7F8F3] p-3 rounded-2xl">
                  <div>
                    <span className="text-[#5C7457]">بیعانه پیش‌پرداخت:</span>
                    <div className="font-bold text-[#2D3A27] mt-0.5">
                      {q.requiresDeposit ? `${q.defaultDepositAmountToman.toLocaleString('fa-IR')} تومان` : 'اختیاری / بدون بیعانه'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#5C7457]">ظرفیت همزمان:</span>
                    <div className="font-bold text-[#2D3A27] mt-0.5">{q.maxConcurrentCapacity} بیمار</div>
                  </div>
                </div>

                <div className="text-xs text-[#5C7457] flex items-center justify-between">
                  <span>مسئول پیش‌فرض:</span>
                  <strong className="text-[#2D3A27]">{q.assignedStaffName} ({q.assignedStaffRole})</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: NEW APPOINTMENT (SCHEDULING) */}
      {isNewAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E6E9DF] shadow-2xl space-y-4 text-[#2D3A27]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E9DF]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#4A6741]" />
                <h3 className="text-base font-black text-[#2D3A27]">ثبت و رزرو نوبت تقویمی</h3>
              </div>
              <button
                onClick={() => setIsNewAppointmentModalOpen(false)}
                className="text-[#5C7457] hover:text-[#2D3A27] text-xs font-bold"
              >
                بستن
              </button>
            </div>

            <form onSubmit={handleCreateAppointmentSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">انتخاب بیمار:</label>
                <RemotePetSearchSelect value={selectedPetId} onChange={setSelectedPetId} pets={pets} className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs text-[#2D3A27] font-bold" formatLabel={(pet) => `${pet.name} (${pet.breed || 'نژاد نامشخص'} - ${pet.species || 'نامشخص'}) | سرپرست: ${pet.ownerName || 'بدون نام'}`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2D3A27] block mb-1">صف اختصاصی:</label>
                  <select
                    value={selectedQueueCode}
                    onChange={(e) => {
                      setSelectedQueueCode(e.target.value);
                      if (e.target.value === 'surgery') {
                        setRequiresDeposit(true);
                        setDepositAmount(2000000);
                        setServiceType('جراحی تخصصی و عقیم‌سازی');
                      } else if (e.target.value === 'grooming') {
                        setRequiresDeposit(true);
                        setDepositAmount(300000);
                        setServiceType('اصلاح و گرومینگ مو');
                      } else {
                        setRequiresDeposit(false);
                        setDepositAmount(0);
                        setServiceType('ویزیت و معاینه بالینی');
                      }
                    }}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs text-[#2D3A27]"
                  >
                    {queues.map((q) => (
                      <option key={q.id} value={q.code}>{q.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2D3A27] block mb-1">تاریخ نوبت:</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="امروز / فردا / ۱۴۰۳/۰۶/۰۲"
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs text-[#2D3A27]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2D3A27] block mb-1">بازه ساعت:</label>
                  <input
                    type="text"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    placeholder="۰۹:۰۰ - ۱۰:۳۰"
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs text-[#2D3A27]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2D3A27] block mb-1">پزشک / استایلیست:</label>
                  <input
                    type="text"
                    value={vetName}
                    onChange={(e) => setVetName(e.target.value)}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs text-[#2D3A27]"
                  />
                </div>
              </div>

              {/* Deposit Checkbox & Amount */}
              <div className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF] space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#2D3A27] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresDeposit}
                    onChange={(e) => setRequiresDeposit(e.target.checked)}
                    className="w-4 h-4 text-[#4A6741] rounded"
                  />
                  <span>رزرو نیازمند پرداخت بیعانه پیش‌پرداخت است (گیت اقتصادی جراحی/گرومینگ)</span>
                </label>

                {requiresDeposit && (
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-[#5C7457]">مبلغ بیعانه (تومان):</span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="bg-white border border-[#E6E9DF] rounded-xl px-3 py-1.5 text-xs font-mono font-bold w-36 text-left"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">یادداشت و توصیه‌های ناشتا بودن:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="مثال: ۸ ساعت ناشتا قبل از جراحی..."
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2 text-xs text-[#2D3A27]"
                />
              </div>

              <div className="pt-3 border-t border-[#E6E9DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewAppointmentModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#E6E9DF] text-[#2D3A27] text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-2xl bg-[#4A6741] text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  ثبت نوبت در صف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: IMMEDIATE SERVICE RECORD (ON-SITE EXECUTION) */}
      {isImmediateServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E9DF] shadow-2xl space-y-4 text-[#2D3A27]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E9DF]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-[#2D3A27]">ثبت خود خدمت حاضر (بدون نوبت قبلی)</h3>
              </div>
              <button
                onClick={() => setIsImmediateServiceModalOpen(false)}
                className="text-[#5C7457] hover:text-[#2D3A27] text-xs font-bold"
              >
                بستن
              </button>
            </div>

            <p className="text-xs text-[#5C7457]">
              این فرم برای خدماتی است که بیمار همین الان در کلینیک حضور دارد و خدمت (واکسن، گرومینگ، پانسمان) مستقیماً روی پرونده اعمال می‌شود.
            </p>

            <form onSubmit={handleImmediateServiceSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">بیمار حاضر در کلینیک:</label>
                <RemotePetSearchSelect value={immPetId} onChange={setImmPetId} pets={pets} onlyPresent className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs text-[#2D3A27] font-bold" formatLabel={(pet) => `${pet.name} (${pet.breed || 'نژاد نامشخص'}) | وضعیت: ${pet.statusInClinic === 'waiting' ? 'در انتظار' : 'در معاینه'}`} />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">عنوان خدمت انجام‌شده:</label>
                <input
                  type="text"
                  value={immServiceTitle}
                  onChange={(e) => setImmServiceTitle(e.target.value)}
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs text-[#2D3A27]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">هزینه خدمت (تومان):</label>
                <input
                  type="number"
                  value={immCost}
                  onChange={(e) => setImmCost(Number(e.target.value))}
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs font-mono font-bold text-[#2D3A27]"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#E6E9DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImmediateServiceModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#E6E9DF] text-[#2D3A27] text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-2xl bg-[#4A6741] text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  ثبت مستقیم در پرونده و صدور فاکتور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE NEW QUEUE */}
      {isNewQueueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E9DF] shadow-2xl space-y-4 text-[#2D3A27]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E9DF]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#4A6741]" />
                <h3 className="text-base font-black text-[#2D3A27]">تعریف صف تخصصی جدید</h3>
              </div>
              <button
                onClick={() => setIsNewQueueModalOpen(false)}
                className="text-[#5C7457] hover:text-[#2D3A27] text-xs font-bold"
              >
                بستن
              </button>
            </div>

            <form onSubmit={handleCreateQueueSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">عنوان صف:</label>
                <input
                  type="text"
                  value={newQueueTitle}
                  onChange={(e) => setNewQueueTitle(e.target.value)}
                  placeholder="مثلاً: صف سونوگرافی و تصویربرداری"
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs text-[#2D3A27]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">کد یکتای صف:</label>
                <input
                  type="text"
                  value={newQueueCode}
                  onChange={(e) => setNewQueueCode(e.target.value)}
                  placeholder="ultrasound"
                  dir="ltr"
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs font-mono text-[#2D3A27]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">توضیحات و نیازمندی‌ها:</label>
                <textarea
                  value={newQueueDesc}
                  onChange={(e) => setNewQueueDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2 text-xs text-[#2D3A27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2D3A27] block mb-1">سقف ظرفیت همزمان:</label>
                  <input
                    type="number"
                    value={newQueueCapacity}
                    onChange={(e) => setNewQueueCapacity(Number(e.target.value))}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2 text-xs font-bold text-[#2D3A27]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2D3A27] block mb-1">میانگین زمان (دقیقه):</label>
                  <input
                    type="number"
                    value={newQueueDuration}
                    onChange={(e) => setNewQueueDuration(Number(e.target.value))}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2 text-xs font-bold text-[#2D3A27]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E6E9DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewQueueModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#E6E9DF] text-[#2D3A27] text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-2xl bg-[#4A6741] text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  ایجاد صف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
