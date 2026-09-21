import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Paperclip,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Stethoscope,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Pill,
  Printer,
  ChevronDown,
  X,
  FileCheck,
  Share2,
  Trash2,
} from 'lucide-react';
import { VisitRecord, Pet, MedicalAttachment, PrescriptionItem, OmnichannelMessagePayload } from '../../types';
import { RemotePetSearchSelect } from '../RemotePetSearchSelect';
import { OmnichannelShareModal } from '../OmnichannelShareModal';

interface MedicalRecordsTabProps {
  visits: VisitRecord[];
  pets: Pet[];
  vaccinations?: any[];
  onAddVisit: (visit: Partial<VisitRecord>, cost?: number) => void;
  onRecordVaccine?: (petId: string, serviceTitle: string, cost?: number) => void;
  onUploadAttachment: (visitId: string, attachment: MedicalAttachment) => void;
  onDeleteVisit?: (visitId: string) => void;
}

export const MedicalRecordsTab: React.FC<MedicalRecordsTabProps> = ({
  visits,
  pets,
  vaccinations = [],
  onAddVisit,
  onRecordVaccine,
  onUploadAttachment,
  onDeleteVisit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocStatus, setFilterDocStatus] = useState<string>('all');
  const [isNewVisitModalOpen, setIsNewVisitModalOpen] = useState(false);
  const [selectedVisitForAttach, setSelectedVisitForAttach] = useState<VisitRecord | null>(null);

  // New Visit Form State
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || '');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [temp, setTemp] = useState(38.5);
  const [heartRate, setHeartRate] = useState(110);
  const [respRate, setRespRate] = useState(24);
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [serviceType, setServiceType] = useState<VisitRecord['serviceType']>('general_exam');
  const [specializedType, setSpecializedType] = useState<VisitRecord['specializedType']>('none');
  const [cost, setCost] = useState(450000);

  const selectedPetVaccinations = vaccinations.filter((vaccination) => vaccination.patientId === selectedPetId);

  // New Attachment State
  const [attTitle, setAttTitle] = useState('تصویر رادیوگرافی بعد از عمل');
  const [attType, setAttType] = useState<MedicalAttachment['type']>('xray');
  const [attUrl, setAttUrl] = useState(
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80'
  );

  // Omnichannel Share Modal State
  const [shareModalPayload, setShareModalPayload] = useState<{
    isOpen: boolean;
    payload: OmnichannelMessagePayload;
  }>({
    isOpen: false,
    payload: {
      recipientName: '',
      recipientPhone: '',
      platform: 'bale',
      type: 'medical_report',
      title: '',
      formattedBodyText: '',
    },
  });

  const handleOpenShareReport = (visit: VisitRecord) => {
    const rxText = visit.prescription && visit.prescription.length > 0
      ? visit.prescription.map((rx, idx) => `💊 ${idx + 1}. ${rx.drugName} (${rx.dosage}) - ${rx.frequency} به مدت ${rx.duration}\n   دستور مصرف: ${rx.instructions}`).join('\n')
      : 'بدون تجویز دارویی جدید.';

    const attText = visit.attachments && visit.attachments.length > 0
      ? visit.attachments.map((att, idx) => `📎 ${idx + 1}. ${att.title} (${att.type}): ${att.url}`).join('\n')
      : 'پیوست تصویری ندارد.';

    setShareModalPayload({
      isOpen: true,
      payload: {
        recipientName: visit.ownerName || 'سرپرست گرامی',
        recipientPhone: '',
        platform: 'bale',
        type: 'medical_report',
        title: `گزارش ویزیت بالینی و نسخه: ${visit.petName}`,
        formattedBodyText: `🐾 **کلینیک دامپزشکی حیوانات خانگی مهرگان** 🐾
📋 **گزارش ویزیت بالینی و نسخه درمانی**
👤 **سرپرست:** ${visit.ownerName}
🐶🐱 **نام پت:** ${visit.petName}
👨‍⚕️ **پزشک معالج:** ${visit.vetName}
📅 **تاریخ و ساعت:** ${visit.date} - ${visit.time}

🌡️ **علائم حیاتی:**
- دمای بدن: ${visit.vitalSigns.temperature} °C
- ضربان قلب: ${visit.vitalSigns.heartRate} bpm
- نرخ تنفس: ${visit.vitalSigns.respiratoryRate} /min
- وزن: ${visit.vitalSigns.weightKg} kg

🩺 **شرح حال و علت مراجعه:**
${visit.chiefComplaint}

🔬 **یافته‌های معاینه و تشخیص (Assessment):**
${visit.diagnosis} (${visit.clinicalFindings})

📝 **دستورات دارویی و نسخه (Plan):**
${rxText}

🖼️ **مستندات پاراکلینیک، سونوگرافی و رادیولوژی:**
${attText}

با آرزوی بهبودی کامل و سلامت برای پت دلبندتان 🌸
📞 پشتیبانی کلینیک: 03136292278`,
      },
    });
  };

  const filteredVisits = visits.filter((v) => {
    const matchesSearch =
      String(v.petName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(v.ownerName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(v.diagnosis ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(v.chiefComplaint ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDoc = filterDocStatus === 'all' || v.documentationStatus === filterDocStatus;
    return matchesSearch && matchesDoc;
  });

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find((p) => p.id === selectedPetId) || pets[0];
    if (!pet) return;

    if (serviceType === 'vaccination' && onRecordVaccine) {
      onRecordVaccine(pet.id, chiefComplaint || 'واکسیناسیون', cost);
    } else onAddVisit(
      {
        petId: pet.id,
        petName: pet.name,
        ownerId: pet.ownerId,
        ownerName: pet.ownerName,
        chiefComplaint,
        vitalSigns: {
          temperature: Number(temp),
          heartRate: Number(heartRate),
          respiratoryRate: Number(respRate),
          weightKg: pet.weightKg,
        },
        clinicalFindings,
        diagnosis,
        serviceType,
        specializedType,
        documentationStatus: specializedType !== 'none' ? 'pending_docs' : 'none',
        documentReminderActive: specializedType !== 'none',
        procedures: [chiefComplaint || 'معاینه بالینی'],
        prescription: [
          {
            id: `rx-${Date.now()}`,
            drugName: 'آموکسی‌سیلین کلاوولانات',
            form: 'قرص',
            dosage: '۲۵۰mg',
            frequency: 'هر ۱۲ ساعت',
            duration: '۷ روز',
            instructions: 'همراه با وعده غذایی مصرف شود.',
          },
        ],
        attachments: [],
      },
      cost
    );

    setIsNewVisitModalOpen(false);
    setChiefComplaint('');
    setClinicalFindings('');
    setDiagnosis('');
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitForAttach) return;

    onUploadAttachment(selectedVisitForAttach.id, {
      id: `att-${Date.now()}`,
      title: attTitle,
      type: attType,
      url: attUrl,
      uploadedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      uploadedBy: 'دکتر کیکاووس کیانی',
      notes: 'پیوست مستندات پرونده الکترونیک پزشکی',
    });

    setSelectedVisitForAttach(null);
  };

  return (
    <div id="tab-medical-records" className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="group flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">سوابق بالینی الکترونیک (SOAP) و مستندات تخصصی</h2>
            <p data-hover-description className="text-xs text-slate-500">
              ثبت علائم حیاتی، نسخه‌های دارویی، پایش مستندات جراحی و الصاق رادیولوژی
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewVisitModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت ویزیت بالینی جدید</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در نام بیمار، سرپرست، تشخیص پزشکی یا شرح حال..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-[11px] font-bold whitespace-nowrap" title="سوابق پزشکی مستقیماً با سرور همگام‌سازی می‌شوند">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>پایگاه داده متصل</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
          <button
            onClick={() => setFilterDocStatus('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterDocStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            همه پرونده‌ها
          </button>
          <button
            onClick={() => setFilterDocStatus('pending_docs')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterDocStatus === 'pending_docs' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            نیازمند مستندات / عکس
          </button>
          <button
            onClick={() => setFilterDocStatus('uploaded')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterDocStatus === 'uploaded' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            مستندات کامل
          </button>
        </div>

      </div>

      {/* Visits List */}
      <div className="space-y-4">
        {filteredVisits.map((visit) => (
          <div
            key={visit.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-emerald-300 transition-all"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black text-base">
                  {visit.petName.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{visit.petName}</h3>
                    <span className="text-xs text-slate-500 font-medium">سرپرست: {visit.ownerName}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    پزشک معالج: <strong>{visit.vetName}</strong> • تاریخ: {visit.date} {visit.time}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {visit.documentationStatus === 'pending_docs' && (
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-black px-3 py-1 rounded-xl flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>نیازمند الصاق عکس رادیولوژی / گزارش جراحی</span>
                  </span>
                )}
                {visit.documentationStatus === 'uploaded' && (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>مستندات کامل ضمیمه شد</span>
                  </span>
                )}
              </div>
            </div>

            {/* Vitals Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex items-center gap-2.5">
                <Thermometer className="w-4 h-4 text-rose-500" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">دمای بدن:</div>
                  <div className="text-xs font-black text-slate-900 font-mono">
                    {visit.vitalSigns.temperature} °C
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-rose-600" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">ضربان قلب:</div>
                  <div className="text-xs font-black text-slate-900 font-mono">
                    {visit.vitalSigns.heartRate} bpm
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex items-center gap-2.5">
                <Wind className="w-4 h-4 text-sky-500" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">نرخ تنفس:</div>
                  <div className="text-xs font-black text-slate-900 font-mono">
                    {visit.vitalSigns.respiratoryRate} /min
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">مخاطات و وزن:</div>
                  <div className="text-xs font-black text-slate-900 font-mono">
                    {visit.vitalSigns.weightKg} kg
                  </div>
                </div>
              </div>
            </div>

            {/* SOAP Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                <span className="font-bold text-slate-700">شرح حال و علت مراجعه (Subjective):</span>
                <p className="text-slate-800 leading-relaxed">{visit.chiefComplaint}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                <span className="font-bold text-slate-700">معاینه و یافته‌های بالینی (Objective):</span>
                <p className="text-slate-800 leading-relaxed">{visit.clinicalFindings}</p>
              </div>
            </div>

            {/* Diagnosis & Prescriptions */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950">تشخیص نهایی (Assessment):</span>
                <span className="font-black text-emerald-800 text-sm">{visit.diagnosis}</span>
              </div>

              {visit.prescription && visit.prescription.length > 0 && (
                <div className="pt-2 border-t border-emerald-200/50 space-y-2">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-emerald-700" />
                    <span>اقلام دارویی تجویز شده (Plan):</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {visit.prescription.map((rx) => (
                      <div key={rx.id} className="bg-white p-2.5 rounded-xl border border-emerald-200 text-[11px]">
                        <div className="font-bold text-slate-900">
                          {rx.drugName} ({rx.dosage})
                        </div>
                        <div className="text-slate-600 mt-0.5">
                          {rx.frequency} • دوره: {rx.duration}
                        </div>
                        <div className="text-slate-500 text-[10px] mt-0.5">{rx.instructions}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 font-bold">پیوست‌ها:</span>
                {visit.attachments.length === 0 ? (
                  <span className="text-slate-400">بدون پیوست</span>
                ) : (
                  visit.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{att.title}</span>
                    </a>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenShareReport(visit)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  title="ارسال گزارش بالینی و نسخه به بله، تلگرام و واتساپ"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ارسال گزارش و نسخه</span>
                </button>

                <button
                  onClick={() => setSelectedVisitForAttach(visit)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الصاق تصویر رادیولوژی / آزمایش</span>
                </button>

                {onDeleteVisit && (
                  <button
                    onClick={() => {
                      if (window.confirm(`آیا از حذف رکورد ویزیت بیمار «${visit.petName}» مربوط به تاریخ ${visit.date} اطمینان دارید؟`)) {
                        onDeleteVisit(visit.id);
                      }
                    }}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    title="حذف ویزیت"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Visit Modal */}
      {isNewVisitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">ثبت پرونده و ویزیت بالینی جدید</h3>
              </div>
              <button onClick={() => setIsNewVisitModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">انتخاب بیمار *</label>
                <RemotePetSearchSelect value={selectedPetId} onChange={setSelectedPetId} pets={pets} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold" />
                <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                  <div className="text-[11px] font-black text-emerald-900">سوابق واکسیناسیون ثبت‌شده</div>
                  {selectedPetVaccinations.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {selectedPetVaccinations.slice(0, 10).map((vaccination) => (
                        <div key={vaccination.id} className="flex justify-between gap-2 text-[11px] text-emerald-800">
                          <span>{vaccination.vaccineName}</span>
                          <span>{vaccination.date || vaccination.administeredDate || '—'}</span>
                        </div>
                      ))}
                    </div>
                  ) : <div className="mt-1 text-[11px] text-slate-500">برای این پرونده سابقه‌ای ثبت نشده است.</div>}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شرح حال و علت مراجعه (Subjective) *</label>
                <textarea
                  rows={2}
                  required
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">دمای بدن (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ضربان قلب (bpm)</label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تنفس (/min)</label>
                  <input
                    type="number"
                    value={respRate}
                    onChange={(e) => setRespRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">یافته‌های معاینه بالینی (Objective) *</label>
                <textarea
                  rows={2}
                  required
                  value={clinicalFindings}
                  onChange={(e) => setClinicalFindings(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تشخیص قطعی / تفریقی (Assessment) *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع تخصص / جراحی</label>
                  <select
                    value={specializedType}
                    onChange={(e) => setSpecializedType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  >
                    <option value="none">معاینه عمومی (بدون نیاز به مستندات اجباری)</option>
                    <option value="surgery">جراحی (نیازمند الصاق عکس رادیولوژی / گزارش)</option>
                    <option value="radiology">رادیولوژی و تصویربرداری</option>
                    <option value="ultrasound">سونوگرافی</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">هزینه ویزیت و خدمات (تومان)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewVisitModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                >
                  ثبت پرونده و صدور فاکتور خودکار
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Attachment Upload Modal */}
      {selectedVisitForAttach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">
                الصاق تصویر یا آزمایش به پرونده {selectedVisitForAttach.petName}
              </h3>
            </div>

            <form onSubmit={handleAddAttachment} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان سند یا آزمایش *</label>
                <input
                  type="text"
                  required
                  value={attTitle}
                  onChange={(e) => setAttTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع فایل *</label>
                <select
                  value={attType}
                  onChange={(e) => setAttType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                >
                  <option value="xray">عکس رادیولوژی دیجیتال (X-Ray)</option>
                  <option value="sonography">سونوگرافی</option>
                  <option value="lab_report">برگه آزمایش خون و سرولوژی</option>
                  <option value="surgery_photo">تصویر بعد از جراحی</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">آدرس فایل / تصویر</label>
                <input
                  type="text"
                  value={attUrl}
                  onChange={(e) => setAttUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVisitForAttach(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                >
                  الصاق و تکمیل وضعیت مستندات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Omnichannel Share Modal for Medical Visit & Rx Reports */}
      <OmnichannelShareModal
        isOpen={shareModalPayload.isOpen}
        onClose={() => setShareModalPayload((prev) => ({ ...prev, isOpen: false }))}
        payload={shareModalPayload.payload}
      />

    </div>
  );
};
