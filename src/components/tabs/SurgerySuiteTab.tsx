import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Mic,
  MicOff,
  Camera,
  AlertOctagon,
  CheckCircle2,
  Clock,
  User,
  Scissors,
  FileText,
  Sparkles,
  ShieldAlert,
  Send,
  Plus,
  Play,
  Pause,
  Volume2,
  Calendar,
  AlertTriangle,
  Zap,
  Info,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  SurgeryOperationSession,
  SurgeryVitalsRecord,
  SurgeryVoiceCommandLog,
  SurgeryPhotoLog,
  Pet,
  Owner,
} from '../../types';

interface SurgerySuiteTabProps {
  sessions?: SurgeryOperationSession[];
  operations?: SurgeryOperationSession[];
  onUpdateSessions?: (sessions: SurgeryOperationSession[]) => void;
  onUpdateOperations?: (operations: SurgeryOperationSession[]) => void;
  emergencyProtocols?: any;
  onDirectRecordVisit?: (visitData: any, cost: number) => void;
  pets?: Pet[];
  owners?: Owner[];
}

export const SurgerySuiteTab: React.FC<SurgerySuiteTabProps> = ({
  sessions: propSessions,
  operations: propOperations,
  onUpdateSessions,
  onUpdateOperations,
  pets = [],
  owners = [],
}) => {
  const sessions = propSessions || propOperations || [];
  const handleUpdate = onUpdateSessions || onUpdateOperations || (() => {});
  const [activeSubView, setActiveSubView] = useState<'active_or' | 'morning_queue' | 'history'>('active_or');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Voice command assistant states
  const [isListening, setIsListening] = useState(false);
  const [voiceDraftInput, setVoiceDraftInput] = useState('');
  const [activeSpeakerRole, setActiveSpeakerRole] = useState<'surgeon' | 'anesthetist' | 'scrub_nurse'>('surgeon');

  // Emergency Mode
  const [emergencyAlertActive, setEmergencyAlertActive] = useState(activeSession?.emergencyForceMajeureActive || false);

  // New photo modal state
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoStage, setNewPhotoStage] = useState<'pre_op' | 'in_operation' | 'post_op'>('in_operation');
  const [showPhotoAddBox, setShowPhotoAddBox] = useState(false);

  // New vitals state
  const [currentVitals, setCurrentVitals] = useState<SurgeryVitalsRecord>({
    time: '۱۰:۱۵',
    heartRate: 104,
    spo2: 99,
    etco2: 38,
    systolicBp: 114,
    bodyTempC: 37.6,
    isAlarm: false,
  });

  // Calculate Emergency Drug Doses based on Pet Weight
  const petWeight = activeSession?.weightKg || 10;
  const atropineDoseMg = (petWeight * 0.04).toFixed(2);
  const epinephrineDoseMg = (petWeight * 0.01).toFixed(2);
  const lidocaineDoseMg = (petWeight * 2.0).toFixed(1);

  // Handle voice command simulation
  const handleSimulateVoiceCommand = (sampleCommand?: string) => {
    const rawText =
      sampleCommand ||
      voiceDraftInput ||
      'گوش_کن تعبیه پین داخل کانال مغز استخوان و بستن فاسیای عضله چهارسر با نخ ویکریل ۲-۰ انجام شد تمام';

    const hasStartKeyword = rawText.includes('گوش_کن') || rawText.includes('گوش کن');
    const hasEndKeyword = rawText.includes('تمام');

    let clean = rawText.replace(/گوش_کن|گوش کن/g, '').replace(/تمام/g, '').trim();

    const newLog: SurgeryVoiceCommandLog = {
      id: `vl-${Date.now()}`,
      speakerRole: activeSpeakerRole,
      rawCommandText: rawText,
      isStartedWithListenKeyword: hasStartKeyword,
      isEndedWithFinishedKeyword: hasEndKeyword,
      cleanTranscript: clean || 'شرح صوتی ثبت شد.',
      actionDetected: clean.includes('فشار') || clean.includes('ضربان') ? 'پایش علائم حیاتی' : 'ثبت متنی شرح عمل',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    if (activeSession) {
      const updatedSession: SurgeryOperationSession = {
        ...activeSession,
        voiceLogs: [...activeSession.voiceLogs, newLog],
        finalSurgeonReport: activeSession.finalSurgeonReport + '\n• ' + newLog.cleanTranscript,
      };

      const updatedAll = sessions.map((s) => (s.id === activeSession.id ? updatedSession : s));
      handleUpdate(updatedAll);
    }

    setVoiceDraftInput('');
    setIsListening(false);
  };

  const handleAddPhoto = () => {
    if (!newPhotoCaption.trim() || !activeSession) return;
    const newPhoto: SurgeryPhotoLog = {
      id: `sp-${Date.now()}`,
      caption: newPhotoCaption,
      photoUrl:
        newPhotoStage === 'pre_op'
          ? 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&auto=format&fit=crop&q=80',
      stage: newPhotoStage,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedSession = {
      ...activeSession,
      photos: [...activeSession.photos, newPhoto],
    };
    handleUpdate(sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)));
    setNewPhotoCaption('');
    setShowPhotoAddBox(false);
  };

  const handleToggleEmergency = () => {
    const nextState = !emergencyAlertActive;
    setEmergencyAlertActive(nextState);
    if (activeSession) {
      const updated = { ...activeSession, emergencyForceMajeureActive: nextState };
      handleUpdate(sessions.map((s) => (s.id === activeSession.id ? updated : s)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#1E293B] text-white p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">سوئیت جراحی و اتاق عمل تخصصی مهرگان (OR Suite)</h1>
              <span className="bg-teal-500/20 text-teal-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-teal-500/30">
                بیهوشی استنشاقی ایزوفلوران & مانیتورینگ
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              دستیار صوتی جراح (گوش_کن ... تمام)، پایش علائم حیاتی و حالت فورس‌ماژور احیا
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveSubView('active_or')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubView === 'active_or'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            اتاق عمل فعال
          </button>
          <button
            onClick={() => setActiveSubView('morning_queue')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubView === 'morning_queue'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            نوبت‌های صبح ({sessions.filter((s) => s.status === 'morning_queued').length})
          </button>
          <button
            onClick={() => setActiveSubView('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubView === 'history'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            گزارشات و سوابق جراحی
          </button>
        </div>
      </div>

      {/* EMERGENCY FORCE MAJEURE BANNER */}
      {emergencyAlertActive && (
        <div className="bg-red-950/90 border-2 border-red-500 rounded-2xl p-5 text-white shadow-2xl animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-8 h-8 text-red-400 animate-bounce" />
              <div>
                <h3 className="text-base font-bold text-red-200">
                  وضعیت فورس‌ماژور و هشدار بحران اتاق عمل فعال است!
                </h3>
                <p className="text-xs text-red-300">
                  پروتکل نجات و احیای قلبی‌تنفسی (CPR) برای بیمار {activeSession?.petName} (وزن: {petWeight} کیلوگرم)
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleEmergency}
              className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              خروج از وضعیت بحران
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-red-900/60 p-3 rounded-xl border border-red-700">
              <span className="text-xs text-red-200 block font-bold">آتروپین (Atropine 0.04 mg/kg):</span>
              <span className="text-lg font-mono font-bold text-amber-300">{atropineDoseMg} mg</span>
              <p className="text-[10px] text-red-300 mt-1">تزریق وریدی سریع در برادی‌کاردی و آسیستول</p>
            </div>
            <div className="bg-red-900/60 p-3 rounded-xl border border-red-700">
              <span className="text-xs text-red-200 block font-bold">اپی‌نفرین (Epinephrine 0.01 mg/kg):</span>
              <span className="text-lg font-mono font-bold text-amber-300">{epinephrineDoseMg} mg</span>
              <p className="text-[10px] text-red-300 mt-1">هر ۳ الی ۵ دقیقه حین ماساژ قلبی</p>
            </div>
            <div className="bg-red-900/60 p-3 rounded-xl border border-red-700">
              <span className="text-xs text-red-200 block font-bold">لیدوکائین (Lidocaine 2%):</span>
              <span className="text-lg font-mono font-bold text-amber-300">{lidocaineDoseMg} mg</span>
              <p className="text-[10px] text-red-300 mt-1">کنترل تاکی‌کاردی بطنی و آریتمی حین عمل</p>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE OR VIEW */}
      {activeSubView === 'active_or' && activeSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left/Center Panel: Patient Vitals, Stage Navigator & Voice dictation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Surgery Patient Status Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E6E9DF]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                    <h2 className="text-base font-bold text-[#2D3A27]">{activeSession.surgeryType}</h2>
                  </div>
                  <p className="text-xs text-[#5C7457] mt-0.5">
                    بیمار: <span className="font-bold text-[#2D3A27]">{activeSession.petName}</span> (
                    {activeSession.petSpecies} - {activeSession.petBreed} - وزن: {activeSession.weightKg} kg) | سرپرست:{' '}
                    {activeSession.ownerName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleEmergency}
                    className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    پروتکل فورس‌ماژور
                  </button>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-xl">
                    در حال جراحی (شروع: {activeSession.startTime})
                  </span>
                </div>
              </div>

              {/* Doctors & Team */}
              <div className="grid grid-cols-3 gap-3 bg-[#F7F8F3] p-3 rounded-xl text-xs">
                <div>
                  <span className="text-[11px] text-[#738A6E] block">جراح ارشد:</span>
                  <span className="font-bold text-[#2D3A27]">{activeSession.surgeonName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#738A6E] block">متخصص بیهوشی:</span>
                  <span className="font-bold text-[#2D3A27]">{activeSession.anesthetistName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#738A6E] block">کمک‌جراح و اسکراب:</span>
                  <span className="font-bold text-[#2D3A27]">{activeSession.assistantName}</span>
                </div>
              </div>

              {/* REAL-TIME VITALS MONITORING STRIP */}
              <div className="bg-[#0F172A] text-white p-4 rounded-xl shadow-inner space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Activity className="w-4 h-4 animate-pulse" />
                    پایشگر آنلاین علائم حیاتی (Multi-Parameter Vitals Monitor)
                  </span>
                  <span>آخرین لاگ: {currentVitals.time}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">ضربان قلب (HR)</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{currentVitals.heartRate}</span>
                    <span className="text-[10px] text-slate-500 block">bpm</span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">اشباع اکسیژن (SpO2)</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">%{currentVitals.spo2}</span>
                    <span className="text-[10px] text-slate-500 block">پالس‌اکسی‌متر</span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">کپنوگرافی (EtCO2)</span>
                    <span className="text-xl font-bold font-mono text-amber-400">{currentVitals.etco2}</span>
                    <span className="text-[10px] text-slate-500 block">mmHg</span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">فشار سیستولیک (NIBP)</span>
                    <span className="text-xl font-bold font-mono text-rose-400">{currentVitals.systolicBp}</span>
                    <span className="text-[10px] text-slate-500 block">mmHg</span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">دمای مری (Temp)</span>
                    <span className="text-xl font-bold font-mono text-indigo-400">{currentVitals.bodyTempC}°C</span>
                    <span className="text-[10px] text-slate-500 block">پد حرارتی</span>
                  </div>
                </div>
              </div>
            </div>

            {/* VOICE ASSISTANT SUITE (گوش_کن ... تمام) */}
            <div className="bg-white p-5 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#2D3A27]">
                      دستیار صوتی استریل اتاق عمل (Voice Surgeon Scribe)
                    </h3>
                    <p className="text-[11px] text-[#5C7457]">
                      ثبت شرح عمل بدون آلوده شدن دستکش استریل با کلیدواژه‌های «گوش_کن» در ابتدا و «تمام» در انتها
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#738A6E]">گوینده:</span>
                  <select
                    value={activeSpeakerRole}
                    onChange={(e) => setActiveSpeakerRole(e.target.value as any)}
                    className="bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2 py-1 text-xs font-bold text-[#2D3A27]"
                  >
                    <option value="surgeon">دکتر امین بیاتی (جراح)</option>
                    <option value="anesthetist">دکتر فرزاد نوری (بیهوشی)</option>
                    <option value="scrub_nurse">احسان موسوی (اسکراب)</option>
                  </select>
                </div>
              </div>

              {/* Voice Action Bar */}
              <div className="bg-[#F7F8F3] p-4 rounded-xl border border-[#D5DDD0] space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={voiceDraftInput}
                    onChange={(e) => setVoiceDraftInput(e.target.value)}
                    placeholder="مثال: گوش_کن فیکساسیون کامل شد و خونریزی بند آمد تمام..."
                    className="flex-1 bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] outline-hidden"
                  />
                  <button
                    onClick={() => handleSimulateVoiceCommand()}
                    className="bg-[#2D3A27] hover:bg-[#1E271A] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    پردازش فرمان صوتی
                  </button>
                </div>

                {/* Quick Voice Pre-sets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#738A6E] font-bold">فرمان‌های آماده صوتی:</span>
                  <button
                    onClick={() =>
                      handleSimulateVoiceCommand(
                        'گوش_کن اکسپوژر مفصل کامل شد، پلیت آناتومیک با ۶ پیچ بیوکامپتیبل فیکس گردید تمام'
                      )
                    }
                    className="bg-white hover:bg-indigo-50 border border-[#D5DDD0] text-[11px] text-[#2D3A27] px-2.5 py-1 rounded-lg transition-colors"
                  >
                    «گوش_کن پلیت فیکس گردید تمام»
                  </button>
                  <button
                    onClick={() =>
                      handleSimulateVoiceCommand('گوش_کن علائم حیاتی نرمال و غلظت گاز بیهوشی روی ۱.۵ درصد تمام')
                    }
                    className="bg-white hover:bg-indigo-50 border border-[#D5DDD0] text-[11px] text-[#2D3A27] px-2.5 py-1 rounded-lg transition-colors"
                  >
                    «گوش_کن علائم نرمال و گاز ۱.۵ درصد تمام»
                  </button>
                  <button
                    onClick={() =>
                      handleSimulateVoiceCommand('گوش_کن شستشوی موضع با سرم نرمال سالین گرم انجام شد تمام')
                    }
                    className="bg-white hover:bg-indigo-50 border border-[#D5DDD0] text-[11px] text-[#2D3A27] px-2.5 py-1 rounded-lg transition-colors"
                  >
                    «گوش_کن شستشو با نرمال سالین گرم تمام»
                  </button>
                </div>
              </div>

              {/* Voice Logs List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#2D3A27]">لاگ‌های صوتی ثبت‌شده حین عمل ({activeSession.voiceLogs.length}):</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {activeSession.voiceLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white p-2.5 rounded-xl border border-[#E6E9DF] flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5">
                          {log.timestamp}
                        </span>
                        <div>
                          <span className="font-bold text-[#2D3A27]">
                            {log.speakerRole === 'surgeon'
                              ? 'جراح'
                              : log.speakerRole === 'anesthetist'
                              ? 'بیهوشی'
                              : 'اسکراب'}
                            :
                          </span>{' '}
                          <span className="text-[#4B5E43]">{log.cleanTranscript}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-[#F7F8F3] text-[#738A6E] px-2 py-0.5 rounded-md shrink-0">
                        {log.actionDetected}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Intra-Op Photos, Pre-op checklist & Final Report */}
          <div className="space-y-6">
            {/* Intra-Op Photo Logs */}
            <div className="bg-white p-5 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#2D3A27] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#4A6741]" />
                  تصاویر و رادیوگرافی جراحی ({activeSession.photos.length})
                </h3>
                <button
                  onClick={() => setShowPhotoAddBox(!showPhotoAddBox)}
                  className="text-xs text-[#4A6741] hover:text-[#384E31] font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> ثبت عکس جدید
                </button>
              </div>

              {showPhotoAddBox && (
                <div className="p-3 bg-[#F7F8F3] rounded-xl border border-[#D5DDD0] space-y-2">
                  <input
                    type="text"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    placeholder="توضیح تصویر (مثلاً: رادیوگرافی حین عمل)..."
                    className="w-full bg-white border border-[#D5DDD0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D3A27] outline-hidden"
                  />
                  <div className="flex items-center justify-between">
                    <select
                      value={newPhotoStage}
                      onChange={(e) => setNewPhotoStage(e.target.value as any)}
                      className="bg-white border border-[#D5DDD0] rounded-lg px-2 py-1 text-xs text-[#2D3A27]"
                    >
                      <option value="pre_op">قبل از عمل (Pre-Op)</option>
                      <option value="in_operation">حین جراحی (In-Op)</option>
                      <option value="post_op">پایان عمل (Post-Op)</option>
                    </select>
                    <button
                      onClick={handleAddPhoto}
                      className="bg-[#4A6741] text-white text-xs font-bold px-3 py-1 rounded-lg"
                    >
                      افزودن تصویر
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {activeSession.photos.map((photo) => (
                  <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-[#D5DDD0]">
                    <img src={photo.photoUrl} alt={photo.caption} className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white text-[10px]">
                      <span className="font-bold line-clamp-2">{photo.caption}</span>
                      <span className="text-slate-300 mt-1">{photo.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-Op Checklist Confirmation */}
            <div className="bg-white p-5 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-[#2D3A27] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                چک‌لیست ایمنی و بیهوشی قبل از عمل
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>ناشتایی ۱۲ ساعته تایید شد</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>آزمایشات CBC و بیوشیمی خون بررسی شد</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>رضایت‌نامه کتبی سرپرست پت امضا شده</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>بیعانه و تسویه اولیه در صندوق ثبت شد</span>
                </div>
              </div>
              <div className="bg-[#F7F8F3] p-2.5 rounded-xl border border-[#D5DDD0] text-[11px] text-[#5C7457]">
                <span className="font-bold text-[#2D3A27] block mb-1">پروتکل بیهوشی:</span>
                {activeSession.preOpChecklist.anesthesiaProtocol}
              </div>
            </div>

            {/* Final Surgeon Summary Report */}
            <div className="bg-white p-5 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-[#2D3A27] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#4A6741]" />
                شرح و جمع‌بندی نهایی عمل جراحی
              </h3>
              <textarea
                rows={4}
                value={activeSession.finalSurgeonReport}
                onChange={(e) => {
                  const updated = { ...activeSession, finalSurgeonReport: e.target.value };
                  handleUpdate(sessions.map((s) => (s.id === activeSession.id ? updated : s)));
                }}
                className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl p-3 text-xs text-[#2D3A27] leading-relaxed outline-hidden"
              />
              <button className="w-full bg-[#4A6741] text-white hover:bg-[#384E31] text-xs font-bold py-2.5 rounded-xl shadow-xs">
                ثبت پایان عمل و انتقال پت به ریکاوری
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MORNING SURGERY QUEUE VIEW */}
      {activeSubView === 'morning_queue' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#2D3A27]">نوبت‌های جراحی صبح کلینیک مهرگان</h2>
              <p className="text-xs text-[#5C7457]">
                یادآوری خودکار ۲ ساعت قبل از جراحی جهت بررسی ناشتایی و تحویل بیمار به اتاق عمل
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-4 rounded-xl border border-[#E6E9DF] bg-[#FAFBF7] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2D3A27]">{sess.surgeryType}</span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-bold">
                      ساعت نوبت: {sess.scheduledTime}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C7457]">
                    بیمار: <span className="font-bold text-[#2D3A27]">{sess.petName}</span> ({sess.petSpecies} - {sess.petBreed}) | سرپرست پت: {sess.ownerName}
                  </p>
                  <p className="text-[11px] text-[#738A6E]">جراح: {sess.surgeonName} | بیهوشی: {sess.anesthetistName}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSessionId(sess.id);
                      setActiveSubView('active_or');
                    }}
                    className="bg-[#4A6741] text-white hover:bg-[#384E31] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    ورود به اتاق عمل و شروع
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY VIEW */}
      {activeSubView === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#2D3A27]">آرشیو و پرونده‌های جراحی انجام‌شده</h2>
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-[#E6E9DF] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#2D3A27]">{s.surgeryType}</h4>
                  <span className="text-[11px] text-[#738A6E] font-mono">{s.scheduledDate}</span>
                </div>
                <p className="text-xs text-[#5C7457]">بیمار: {s.petName} | جراح: {s.surgeonName}</p>
                <div className="bg-[#F7F8F3] p-3 rounded-xl text-xs text-[#4B5E43] leading-relaxed">
                  {s.finalSurgeonReport}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
