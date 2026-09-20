import React, { useState } from 'react';
import {
  Building2,
  Plus,
  CheckCircle2,
  Clock,
  Camera,
  Mic,
  Utensils,
  Pill,
  Sparkles,
  User,
  PawPrint,
  Calendar,
  AlertCircle,
  X,
  Volume2,
  Trash2,
  Database,
} from 'lucide-react';
import { BoardingRecord, Pet, RoutineTask } from '../../types';

interface BoardingTabProps {
  boardingRecords: BoardingRecord[];
  pets: Pet[];
  onToggleTask: (recordId: string, taskId: string, photoProof?: string, voiceMemo?: string) => void;
  onAdmitNewPet: (record: Omit<BoardingRecord, 'id'>) => void;
  onDeleteBoarding?: (recordId: string) => void;
}

export const BoardingTab: React.FC<BoardingTabProps> = ({
  boardingRecords,
  pets,
  onToggleTask,
  onAdmitNewPet,
  onDeleteBoarding,
}) => {
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [activeVoiceMemoTask, setActiveVoiceMemoTask] = useState<{ recordId: string; taskId: string } | null>(null);
  const [memoText, setMemoText] = useState('');

  // New Admission form
  const [admitForm, setAdmitForm] = useState({
    petId: pets[0]?.id || '',
    cageNumber: 'باکس VIP مراقبت ویژه شماره ۵',
    dietPlan: 'غذای خشک رویال کنین رنال، روزی ۲ وعده (ساعت ۹ صبح و ۷ عصر)',
    medicalCareNotes: 'قرص کارپروفن نصف قرص همراه ناهار',
    assignedStaffName: 'دکتر کیکاووس کیانی',
    dailyCost: 750000,
  });

  const handleCreateAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find((p) => p.id === admitForm.petId) || pets[0];
    if (!pet) return;

    onAdmitNewPet({
      petId: pet.id,
      petName: pet.name,
      petSpecies: pet.species,
      petBreed: pet.breed,
      ownerName: pet.ownerName,
      ownerPhone: pet.ownerPhone,
      cageNumber: admitForm.cageNumber,
      admittedAt: 'امروز ۱۰:۰۰',
      dischargePlannedAt: '۱۴۰۳/۰۶/۰۵',
      condition: 'stable',
      assignedStaffId: 'u-2',
      assignedStaffName: admitForm.assignedStaffName,
      dietPlan: admitForm.dietPlan,
      medicalCareNotes: admitForm.medicalCareNotes,
      dailyCost: admitForm.dailyCost,
      routineTasks: [
        {
          id: `task-${Date.now()}-1`,
          title: 'سرو وعده اول غذای رژیمی و آب تازه',
          type: 'food',
          scheduledTime: '۰۹:۰۰',
          isCompleted: false,
          instructions: 'یک کاسه غذای رژیمی',
        },
        {
          id: `task-${Date.now()}-2`,
          title: 'تجویز داروی خوراکی بعد از غذا',
          type: 'medication',
          scheduledTime: '۱۰:۰۰',
          isCompleted: false,
          instructions: 'کارپروفن نصف قرص',
        },
        {
          id: `task-${Date.now()}-3`,
          title: 'نظافت باکس، تعویض پد و تهویه',
          type: 'hygiene',
          scheduledTime: '۱۴:۰۰',
          isCompleted: false,
          instructions: 'تعویض پد بهداشتی و ضدعفونی سطوح',
        },
        {
          id: `task-${Date.now()}-4`,
          title: 'پیاده‌روی و هواخوری در محوطه حیاط',
          type: 'walk',
          scheduledTime: '۱۷:۰۰',
          isCompleted: false,
          instructions: '۱۰ دقیقه پیاده‌روی آرام با لیش',
        },
      ],
    });

    setIsAdmitModalOpen(false);
  };

  const handleSaveVoiceMemo = () => {
    if (!activeVoiceMemoTask) return;
    onToggleTask(
      activeVoiceMemoTask.recordId,
      activeVoiceMemoTask.taskId,
      'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&auto=format&fit=crop&q=80',
      memoText || 'وظیفه با موفقیت و بررسی وضعیت تنفس پت انجام شد.'
    );
    setActiveVoiceMemoTask(null);
    setMemoText('');
  };

  return (
    <div id="tab-boarding" className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-[28px] border border-[#E6E9DF] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4A6741] text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-[#2D3A27]">مدیریت بخش پانسیون و بستری VIP</h2>
              <div className="flex items-center gap-1.5 bg-[#F7F8F3] px-2.5 py-1 rounded-full border border-[#D4E0CD]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Database className="w-3 h-3 text-[#4A6741]" />
                <span className="text-[10px] font-bold text-[#2D3A27]">پایگاه‌داده پانسیون متصل</span>
              </div>
            </div>
            <p className="text-xs text-[#5C7457]">
              چک‌لیست وظایف روتین، ثبت یادداشت صوتی و عکس گزارش برای صاحبان
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdmitModalOpen(true)}
          className="bg-[#4A6741] hover:bg-[#3D5535] active:scale-95 text-white px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>پذیرش بیمار در پانسیون</span>
        </button>
      </div>

      {/* Boarding Cage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {boardingRecords.map((record) => {
          const tasks = record.routineTasks || [];
          const completedTasks = tasks.filter((t) => t?.isCompleted).length;
          const totalTasks = tasks.length;
          const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <div
              key={record.id}
              className="bg-white rounded-[28px] border border-[#E6E9DF] p-6 shadow-xs space-y-4 hover:border-[#4A6741] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#D4E0CD] text-[#2D3A27] flex items-center justify-center font-black text-lg">
                      {record.cageNumber.slice(-3)}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#2D3A27]">{record.petName}</h3>
                      <div className="text-xs text-[#5C7457]">
                        {record.cageNumber} • سرپرست: <strong>{record.ownerName}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-[#F7F8F3] text-[#4A6741] border border-[#E6E9DF] px-3 py-1 rounded-xl">
                      {record.dailyCost.toLocaleString('fa-IR')} ت/روز
                    </span>
                    {onDeleteBoarding && (
                      <button
                        onClick={() => {
                          if (window.confirm(`آیا از ترخیص و حذف پرونده بستری ${record.petName} از پایگاه‌داده اطمینان دارید؟`)) {
                            onDeleteBoarding(record.id);
                          }
                        }}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer border border-rose-200"
                        title="ترخیص و حذف از دیتابیس سرور"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Schedules */}
                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF]">
                    <div className="text-[#5C7457] font-bold text-[10px] mb-0.5 flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-[#4A6741]" />
                      <span>رژیم غذایی:</span>
                    </div>
                    <div className="text-[#2D3A27] font-medium">{record.dietPlan}</div>
                  </div>

                  <div className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF]">
                    <div className="text-[#5C7457] font-bold text-[10px] mb-0.5 flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5 text-[#4A6741]" />
                      <span>دستور دارویی:</span>
                    </div>
                    <div className="text-[#2D3A27] font-medium">{record.medicalCareNotes}</div>
                  </div>
                </div>

                {/* Tasks Routine Checklist */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2D3A27]">
                    <span>چک‌لیست مراقبت شیفت امروز ({completedTasks} از {totalTasks}):</span>
                    <span className="font-mono text-[#4A6741] font-bold">{progressPercent}٪</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#E6E9DF] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#4A6741] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="space-y-1.5 pt-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                          task.isCompleted
                            ? 'bg-[#D4E0CD]/40 border-[#D4E0CD] text-[#2D3A27]'
                            : 'bg-[#F7F8F3] border-[#E6E9DF] text-[#2D3A27]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => onToggleTask(record.id, task.id)}
                            className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              task.isCompleted
                                ? 'bg-[#4A6741] text-white'
                                : 'border-2 border-[#5C7457]/40 hover:border-[#4A6741] bg-white'
                            }`}
                          >
                            {task.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <div>
                            <div className={`font-bold ${task.isCompleted ? 'line-through text-[#5C7457]' : 'text-[#2D3A27]'}`}>
                              {task.title}
                            </div>
                            <div className="text-[10px] text-[#5C7457] mt-0.5">زمان مقرر: {task.scheduledTime}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {task.completedBy && (
                            <span className="text-[10px] font-bold text-[#2D3A27] bg-[#D4E0CD] px-2 py-0.5 rounded">
                              {task.completedBy}
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setActiveVoiceMemoTask({ recordId: record.id, taskId: task.id });
                              setMemoText('غذا طبق دستور میل شد و حال عمومی کاملاً مساعد است.');
                            }}
                            className="p-1.5 text-[#5C7457] hover:text-[#4A6741] hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="ثبت یادداشت صوتی و عکس برای صاحب حیوان"
                          >
                            <Mic className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-3 border-t border-[#E6E9DF] flex items-center justify-between text-xs text-[#5C7457]">
                <span>ورود: {record.admittedAt} | ترخیص تخمینی: {record.dischargePlannedAt}</span>
                <span className="font-mono text-[#2D3A27] font-bold">مسئول: {record.assignedStaffName}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admission Modal */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A27]/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-[#2D3A27] w-full max-w-lg rounded-[32px] shadow-2xl border border-[#E6E9DF] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#4A6741]" />
                <h3 className="text-base font-extrabold text-[#2D3A27]">پذیرش و بستری جدید</h3>
              </div>
              <button onClick={() => setIsAdmitModalOpen(false)} className="p-1.5 text-[#5C7457] hover:text-[#2D3A27]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmission} className="p-6 space-y-4 text-xs bg-white">
              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">انتخاب حیوان خانگی *</label>
                <select
                  value={admitForm.petId}
                  onChange={(e) => setAdmitForm({ ...admitForm, petId: e.target.value })}
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2.5 text-[#2D3A27] font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                >
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.breed}) • مالک: {p.ownerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">شماره باکس / سوئیت *</label>
                  <input
                    type="text"
                    required
                    value={admitForm.cageNumber}
                    onChange={(e) => setAdmitForm({ ...admitForm, cageNumber: e.target.value })}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] font-bold focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">تعرفه روزانه (تومان)</label>
                  <input
                    type="number"
                    value={admitForm.dailyCost}
                    onChange={(e) => setAdmitForm({ ...admitForm, dailyCost: Number(e.target.value) })}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] font-mono focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">برنامه و دستورات غذایی *</label>
                <input
                  type="text"
                  required
                  value={admitForm.dietPlan}
                  onChange={(e) => setAdmitForm({ ...admitForm, dietPlan: e.target.value })}
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">برنامه دارویی و دوزاژ</label>
                <input
                  type="text"
                  value={admitForm.medicalCareNotes}
                  onChange={(e) => setAdmitForm({ ...admitForm, medicalCareNotes: e.target.value })}
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                />
              </div>

              <div className="pt-3 border-t border-[#E6E9DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="px-4 py-2.5 bg-[#F7F8F3] text-[#5C7457] hover:text-[#2D3A27] rounded-xl font-bold border border-[#E6E9DF]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#4A6741] hover:bg-[#3D5535] text-white rounded-xl font-bold shadow-xs transition-all active:scale-95"
                >
                  تکمیل پذیرش در پانسیون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice Memo Modal */}
      {activeVoiceMemoTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A27]/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-[#2D3A27] w-full max-w-md rounded-[32px] shadow-2xl border border-[#E6E9DF] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-[#4A6741]" />
              <h3 className="text-base font-black text-[#2D3A27]">ثبت گزارش وظیفه و یادداشت صوتی</h3>
            </div>

            <textarea
              rows={3}
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl p-3 text-xs text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveVoiceMemoTask(null)}
                className="px-4 py-2 bg-[#F7F8F3] text-[#5C7457] hover:text-[#2D3A27] rounded-xl text-xs font-bold border border-[#E6E9DF]"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveVoiceMemo}
                className="px-5 py-2 bg-[#4A6741] hover:bg-[#3D5535] text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                ثبت و ارسال به پورتال صاحب
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
