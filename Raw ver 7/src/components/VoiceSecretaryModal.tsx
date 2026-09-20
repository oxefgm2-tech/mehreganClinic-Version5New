import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Send,
  Zap,
  Keyboard,
  Radio,
} from 'lucide-react';
import { Pet, UserRole, VisitRecord, Invoice } from '../types';
import {
  parsePersianVoiceCommand,
  speakPersianFeedback,
  ParsedVoiceIntent,
  VET_DICTIONARIES,
  learnKeywordForRole,
} from '../services/voiceSecretary';

interface VoiceSecretaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPets: Pet[];
  currentUserRole: UserRole;
  onRecordVisit: (visit: Partial<VisitRecord>, cost?: number) => void;
  onRecordVaccine: (petId: string, serviceTitle: string, cost: number) => void;
  onAdmitBoarding: (petId: string) => void;
  onCreateAppointment: (petId: string, serviceTitle: string) => void;
}

export const VoiceSecretaryModal: React.FC<VoiceSecretaryModalProps> = ({
  isOpen,
  onClose,
  allPets,
  currentUserRole,
  onRecordVisit,
  onRecordVaccine,
  onAdmitBoarding,
  onCreateAppointment,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [selectedShortcutMode, setSelectedShortcutMode] = useState<'alt_f2' | 'space' | 'alt_space'>('alt_f2');
  const [transcript, setTranscript] = useState('');
  const [parsedIntent, setParsedIntent] = useState<ParsedVoiceIntent | null>(null);
  const [executionSuccessMessage, setExecutionSuccessMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number[]>([15, 30, 60, 40, 75, 50, 20]);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [activeDictionaryView, setActiveDictionaryView] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isHoldingKeyRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);

  // Keep ref synchronized
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Example Persian voice prompts for instant testing
  const sampleCommands = [
    { text: 'پامر واکسن', desc: 'تشخیص خودکار لوسی (پامرانین حاضر در کلینیک) و ثبت واکسن هاری' },
    { text: 'لوسی هاری', desc: 'ثبت مستقیم واکسیناسیون هاری برای لوسی' },
    { text: 'ژرمن جراحی', desc: 'ثبت پرونده جراحی و باز کردن فرم مدارک برای هیرو' },
    { text: 'پرشین اصلاح و گرومینگ', desc: 'ثبت نوبت گرومینگ برای میلو' },
    { text: 'شیتزو جرم‌گیری دندان', desc: 'ثبت نوبت دندانپزشکی برای تدی' },
  ];

  // Initialize Speech Recognition on modal open
  useEffect(() => {
    if (!isOpen) {
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      setIsPushToTalkActive(false);
      isHoldingKeyRef.current = false;
      return;
    }

    // Auto start listening on open (or ready for push-to-talk)
    startSpeechRecognition();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen]);

  // Audio visualizer animation while listening
  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setAudioLevel([
          Math.floor(Math.random() * 80) + 20,
          Math.floor(Math.random() * 95) + 30,
          Math.floor(Math.random() * 100) + 40,
          Math.floor(Math.random() * 85) + 25,
          Math.floor(Math.random() * 90) + 35,
          Math.floor(Math.random() * 70) + 20,
          Math.floor(Math.random() * 60) + 15,
        ]);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Push-to-Talk (Hold Key) and Numeric Shortcut Listener (Alt+F2 / Alt+Space / Space)
  useEffect(() => {
    if (!isOpen) return;

    const checkMatchesShortcut = (e: KeyboardEvent) => {
      if (selectedShortcutMode === 'alt_f2') {
        // Support Alt+F2 or F2 with AltKey
        return (e.altKey && (e.key === 'F2' || e.code === 'F2')) || (e.key === 'F2' && e.altKey);
      }
      if (selectedShortcutMode === 'alt_space') {
        return e.altKey && (e.code === 'Space' || e.key === ' ');
      }
      if (selectedShortcutMode === 'space') {
        // If typing in input, don't trigger space push-to-talk
        const isInput = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA';
        if (isInput) return false;
        return e.code === 'Space' || e.key === ' ';
      }
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Push-to-talk: On key down -> start listening while pressed
      if (checkMatchesShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();

        if (!isHoldingKeyRef.current) {
          isHoldingKeyRef.current = true;
          setIsPushToTalkActive(true);
          if (!isListeningRef.current) {
            startSpeechRecognition();
          }
        }
        return;
      }

      // Numeric shortcuts for actions
      if (parsedIntent) {
        if (e.key === '1') {
          e.preventDefault();
          handleExecuteAction('confirm');
        } else if (e.key === '2') {
          e.preventDefault();
          handleExecuteAction('cancel');
        } else if (e.key === '3' && parsedIntent.options.length > 2) {
          e.preventDefault();
          handleExecuteAction(parsedIntent.options[2].actionId);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        (selectedShortcutMode === 'alt_f2' && (e.key === 'F2' || e.code === 'F2' || e.key === 'Alt')) ||
        (selectedShortcutMode === 'alt_space' && (e.code === 'Space' || e.key === ' ' || e.key === 'Alt')) ||
        (selectedShortcutMode === 'space' && (e.code === 'Space' || e.key === ' '))
      ) {
        if (isHoldingKeyRef.current) {
          isHoldingKeyRef.current = false;
          setIsPushToTalkActive(false);
          // On key up -> stop listening and process final speech
          stopSpeechRecognition();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, parsedIntent, selectedShortcutMode]);

  const startSpeechRecognition = () => {
    setSpeechError(null);
    setExecutionSuccessMessage(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('مرورگر شما از وب‌اسپیچ پشتیبانی نمی‌کند؛ می‌توانید از دستورات صوتی آماده زیر استفاده نمایید.');
      setIsListening(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'fa-IR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          processTranscript(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('دسترسی میکروفون رد شد. لطفاً دسترسی را فعال کرده یا از دکمه‌های آماده استفاده فرمایید.');
        }
        setIsListening(false);
        setIsPushToTalkActive(false);
        isHoldingKeyRef.current = false;
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsPushToTalkActive(false);
        isHoldingKeyRef.current = false;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition exception:', err);
      setIsListening(false);
      setIsPushToTalkActive(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setIsPushToTalkActive(false);
    isHoldingKeyRef.current = false;
  };

  const processTranscript = (text: string) => {
    if (!text || text.trim().length === 0) return;
    
    const intent = parsePersianVoiceCommand(text, allPets, currentUserRole);
    setParsedIntent(intent);
    
    // Spoken feedback in Persian
    speakPersianFeedback(intent.confirmationPrompt);
  };

  const handleExecuteAction = (actionId: string) => {
    if (!parsedIntent) return;

    if (actionId === 'cancel') {
      speakPersianFeedback('عملیات لغو شد.');
      setParsedIntent(null);
      setTranscript('');
      return;
    }

    let targetPet = parsedIntent.matchedPet;

    // If option 3 selected another pet
    if (actionId.startsWith('select_pet_')) {
      const petId = actionId.replace('select_pet_', '');
      targetPet = allPets.find(p => p.id === petId) || targetPet;
    }

    if (!targetPet) {
      speakPersianFeedback('حیوان مورد نظر یافت نشد.');
      return;
    }

    // Execute based on intent
    const cost = parsedIntent.suggestedCost || 450000;

    if (actionId === 'schedule_surgery_deposit') {
      onCreateAppointment(targetPet.id, 'رزرو نوبت جراحی تخصصی (با بیعانه ۲,۰۰۰,۰۰۰ تومان)');
      const msg = `نوبت جراحی برای «${targetPet.name}» در صف ثبت شد. لینک پرداخت بیعانه ۲,۰۰۰,۰۰۰ تومانی شاپرک/بله برای مالک (${targetPet.ownerPhone}) پیامک گردید.`;
      setExecutionSuccessMessage(msg);
      speakPersianFeedback(`نوبت جراحی با بیعانه برای ${targetPet.name} ثبت شد و لینک پرداخت ارسال گردید.`);
    } else if (actionId === 'immediate_surgery_service') {
      onRecordVisit({
        petId: targetPet.id,
        petName: targetPet.name,
        ownerId: targetPet.ownerId,
        ownerName: targetPet.ownerName,
        chiefComplaint: 'جراحی اورژانس / عمل جاری حاضر در اتاق عمل',
        serviceType: 'surgery',
        procedures: ['جراحی تخصصی اتاق عمل و بیهوشی گاز'],
      }, 6500000);
      const msg = `خدمت جراحی حاضر در اتاق عمل برای «${targetPet.name}» مستقیماً در پرونده بالینی ثبت شد.`;
      setExecutionSuccessMessage(msg);
      speakPersianFeedback(`جراحی حاضر در اتاق عمل برای ${targetPet.name} ثبت شد.`);
    } else if (actionId === 'schedule_grooming_deposit') {
      onCreateAppointment(targetPet.id, 'رزرو نوبت گرومینگ و آرایشگاه');
      const msg = `نوبت گرومینگ برای «${targetPet.name}» در صف سالن ثبت شد. پیش‌پرداخت ۳۰۰,۰۰۰ تومان منظور گردید.`;
      setExecutionSuccessMessage(msg);
      speakPersianFeedback(`نوبت گرومینگ برای ${targetPet.name} رزرو شد.`);
    } else if (actionId === 'immediate_grooming_service') {
      onRecordVisit({
        petId: targetPet.id,
        petName: targetPet.name,
        ownerId: targetPet.ownerId,
        ownerName: targetPet.ownerName,
        chiefComplaint: 'اصلاح و گرومینگ جاری در سالن',
        serviceType: 'grooming',
        procedures: ['گرومینگ کامل و حمام آرایشی'],
      }, 650000);
      const msg = `خدمت گرومینگ حاضر برای «${targetPet.name}» در سوابق و صورتحساب ثبت شد.`;
      setExecutionSuccessMessage(msg);
      speakPersianFeedback(`خدمت گرومینگ ثبت شد.`);
    } else if (parsedIntent.intentType === 'record_vaccine') {
      onRecordVaccine(targetPet.id, parsedIntent.suggestedActionTitle, cost);
      const msg = `واکسیناسیون هاری و دوره‌ای برای «${targetPet.name}» با موفقیت در پرونده بالینی ثبت شد.`;
      setExecutionSuccessMessage(msg);
      speakPersianFeedback(`واکسن برای ${targetPet.name} ثبت شد.`);
    } else if (parsedIntent.intentType === 'admit_boarding') {
      onAdmitBoarding(targetPet.id);
      const msg = `پت «${targetPet.name}» با موفقیت در بخش بستری و پانسیون پذیرش شد.`;
      setExecutionSuccessMessage(msg);
      speakPersianFeedback(`${targetPet.name} در پانسیون پذیرش شد.`);
    } else if (parsedIntent.intentType === 'create_appointment') {
      onCreateAppointment(targetPet.id, parsedIntent.suggestedActionTitle);
      const msg = `نوبت برای «${targetPet.name}» ثبت گردید.`;
      setExecutionSuccessMessage(msg);
      speakPersianFeedback(`نوبت ثبت شد.`);
    } else {
      onRecordVisit({
        petId: targetPet.id,
        petName: targetPet.name,
        ownerId: targetPet.ownerId,
        ownerName: targetPet.ownerName,
        chiefComplaint: parsedIntent.rawTranscript,
        serviceType: 'general_exam',
        procedures: [parsedIntent.suggestedActionTitle],
      }, cost);
      const msg = `خدمت «${parsedIntent.suggestedActionTitle}» برای «${targetPet.name}» با موفقیت در سوابق ثبت شد.`;
      setExecutionSuccessMessage(msg);
      speakPersianFeedback(`خدمت برای ${targetPet.name} ثبت گردید.`);
    }

    // Learn keyword
    learnKeywordForRole(currentUserRole, parsedIntent.rawTranscript);

    // Auto clear after 2.5s
    setTimeout(() => {
      setParsedIntent(null);
      setTranscript('');
    }, 2500);
  };

  const handleAddCustomKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordInput.trim()) return;
    learnKeywordForRole(currentUserRole, newKeywordInput.trim());
    setNewKeywordInput('');
    speakPersianFeedback('کلمه تخصصی به دیکشنری نقش شما اضافه شد.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A27]/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white text-[#2D3A27] w-full max-w-2xl rounded-[32px] shadow-2xl border border-[#E6E9DF] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4A6741] text-white flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#2D3A27] flex items-center gap-2">
                منشی صوتی هوشمند کلینیک
                <span className="text-[10px] bg-[#D4E0CD] text-[#2D3A27] px-2 py-0.5 rounded-full font-mono font-bold">
                  VetNLP Voice Engine
                </span>
              </h2>
              <p className="text-xs text-[#5C7457]">
                تشخیص خودکار گفتار • رفع ابهام هوشمند با پت‌های حاضر در کلینیک • بدون نیاز به تایپ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#E6E9DF] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          
          {/* Main Visualizer & Voice State */}
          <div className="text-center py-5 px-6 bg-[#F7F8F3] rounded-[24px] border border-[#E6E9DF] flex flex-col items-center justify-center relative">
            
            {/* Audio waveform waves */}
            <div className="flex items-center justify-center gap-1.5 h-16 mb-4">
              {audioLevel.map((lvl, index) => (
                <div
                  key={index}
                  style={{ height: isListening ? `${lvl}%` : '15%' }}
                  className={`w-2.5 rounded-full transition-all duration-75 ${
                    isListening ? 'bg-[#4A6741]' : 'bg-[#E6E9DF]'
                  }`}
                />
              ))}
            </div>

            {/* Mic Toggle Button & Push-to-Talk Indicator */}
            <div className="relative">
              <button
                onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-300 animate-pulse'
                    : 'bg-[#4A6741] hover:bg-[#3D5535] text-white ring-4 ring-[#D4E0CD]'
                }`}
                title={isListening ? 'توقف شنیدن' : 'شروع ضبط گفتار'}
              >
                {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>

              {isPushToTalkActive && (
                <div className="absolute -bottom-2 -left-3 bg-[#2D3A27] text-[#D4E0CD] text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shadow-md border border-[#4A6741] animate-bounce">
                  PTT فعال
                </div>
              )}
            </div>

            <div className="mt-3 text-sm font-bold">
              {isListening ? (
                <span className="text-[#4A6741] flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4A6741] animate-ping"></span>
                  {isPushToTalkActive ? (
                    <span className="font-extrabold">کلید Alt+F2 پایین نگه داشته شده... (دستور را بگویید و رها کنید)</span>
                  ) : (
                    <span>در حال گوش دادن به دستور شما... (مثلاً: «پامر واکسن»)</span>
                  )}
                </span>
              ) : (
                <span className="text-[#5C7457] flex flex-col sm:flex-row items-center justify-center gap-1.5">
                  <span>روی میکروفون کلیک کنید یا کلید</span>
                  <kbd className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-bold text-[#2D3A27] bg-[#E6E9DF] border border-[#CAD3C0] rounded-md shadow-2xs">
                    {selectedShortcutMode === 'alt_f2' && 'Alt + F2'}
                    {selectedShortcutMode === 'alt_space' && 'Alt + Space'}
                    {selectedShortcutMode === 'space' && 'Space (فاصله)'}
                  </kbd>
                  <span>را تا پایان صحبت پایین نگه دارید</span>
                </span>
              )}
            </div>

            {/* Push-to-Talk Mode & Shortcut Selector */}
            <div className="mt-3 pt-2.5 border-t border-[#E6E9DF]/80 w-full flex flex-wrap items-center justify-center gap-2 text-xs text-[#5C7457]">
              <div className="flex items-center gap-1 font-semibold text-[#2D3A27]">
                <Keyboard className="w-3.5 h-3.5 text-[#4A6741]" />
                <span>حالت Push-to-Talk:</span>
              </div>

              <div className="inline-flex rounded-xl bg-white p-0.5 border border-[#E6E9DF] text-[11px] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedShortcutMode('alt_f2')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedShortcutMode === 'alt_f2'
                      ? 'bg-[#4A6741] text-white shadow-xs'
                      : 'text-[#5C7457] hover:text-[#2D3A27]'
                  }`}
                >
                  Alt + F2 (پیش‌فرض)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShortcutMode('alt_space')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedShortcutMode === 'alt_space'
                      ? 'bg-[#4A6741] text-white shadow-xs'
                      : 'text-[#5C7457] hover:text-[#2D3A27]'
                  }`}
                >
                  Alt + Space
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShortcutMode('space')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedShortcutMode === 'space'
                      ? 'bg-[#4A6741] text-white shadow-xs'
                      : 'text-[#5C7457] hover:text-[#2D3A27]'
                  }`}
                >
                  Space (نگه‌داشتن)
                </button>
              </div>

              <span className="text-[10px] text-[#5C7457]">
                (KeyDown ➔ شروع ضبط | KeyUp ➔ ثبت و پردازش)
              </span>
            </div>

            {/* Live Transcript Display */}
            {transcript && (
              <div className="mt-4 p-3 bg-white rounded-xl border border-[#4A6741] w-full text-right shadow-xs">
                <div className="text-[11px] text-[#4A6741] font-semibold mb-1">متن تشخیص داده شده از گفتار:</div>
                <div className="text-lg font-black text-[#2D3A27]">{transcript}</div>
              </div>
            )}

            {speechError && (
              <div className="mt-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 p-2.5 rounded-xl w-full">
                {speechError}
              </div>
            )}
          </div>

          {/* Execution Success Banner */}
          {executionSuccessMessage && (
            <div className="p-4 bg-[#D4E0CD] border border-[#4A6741] rounded-2xl flex items-center gap-3 animate-fadeIn text-[#2D3A27]">
              <CheckCircle2 className="w-6 h-6 text-[#4A6741] shrink-0" />
              <div>
                <div className="text-xs text-[#5C7457] font-bold">عملیات با موفقیت انجام شد:</div>
                <div className="text-sm font-black text-[#2D3A27]">{executionSuccessMessage}</div>
              </div>
            </div>
          )}

          {/* Pending Confirmation & Disambiguation UI */}
          {parsedIntent && !executionSuccessMessage && (
            <div className="p-5 bg-[#F7F8F3] rounded-2xl border-2 border-[#4A6741] shadow-md space-y-4 animate-scaleUp text-[#2D3A27]">
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#4A6741] text-white flex items-center justify-center font-bold">
                    AI
                  </div>
                  <div>
                    <span className="text-xs text-[#4A6741] font-bold">تایید هوشمند و رفع ابهام بالینی</span>
                    <h3 className="text-xl font-black text-[#2D3A27] mt-0.5 leading-snug">
                      {parsedIntent.confirmationPrompt}
                    </h3>
                  </div>
                </div>

                <span className="text-xs bg-[#D4E0CD] text-[#2D3A27] border border-[#E6E9DF] px-2.5 py-1 rounded-lg font-mono font-bold">
                  دقت: {Math.round(parsedIntent.confidence * 100)}٪
                </span>
              </div>

              {/* Matched Pet Info Pill */}
              {parsedIntent.matchedPet && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E6E9DF] text-xs">
                  <img
                    src={parsedIntent.matchedPet.photoUrl}
                    alt={parsedIntent.matchedPet.name}
                    className="w-10 h-10 rounded-lg object-cover border border-[#E6E9DF]"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-[#2D3A27] text-sm">
                      {parsedIntent.matchedPet.name} • {parsedIntent.matchedPet.breed}
                    </div>
                    <div className="text-[#5C7457]">
                      مالک: {parsedIntent.matchedPet.ownerName} | وضعیت در کلینیک:{' '}
                      <span className="text-[#4A6741] font-bold">
                        {parsedIntent.matchedPet.statusInClinic === 'waiting' && 'در اتاق انتظار'}
                        {parsedIntent.matchedPet.statusInClinic === 'in_boarding' && 'بستری در پانسیون'}
                        {parsedIntent.matchedPet.statusInClinic === 'in_grooming' && 'در بخش آرایشگاه'}
                        {parsedIntent.matchedPet.statusInClinic === 'in_exam' && 'در اتاق معاینه'}
                        {parsedIntent.matchedPet.statusInClinic === 'not_present' && 'ثبت شده قبلی'}
                      </span>
                    </div>
                  </div>
                  <div className="text-left font-mono font-bold text-[#4A6741] text-sm">
                    {parsedIntent.suggestedCost?.toLocaleString('fa-IR')} تومان
                  </div>
                </div>
              )}

              {/* Fast Numeric Options */}
              <div className="space-y-2 pt-2">
                <div className="text-xs text-[#5C7457] font-medium">
                  پاسخ صوتی دهید یا کلید عددی روی کیبورد را فشار دهید:
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {parsedIntent.options.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => handleExecuteAction(opt.actionId)}
                      className={`flex flex-col text-right p-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        opt.key === '1'
                          ? 'bg-[#4A6741] hover:bg-[#3D5535] text-white shadow-md'
                          : opt.key === '2'
                          ? 'bg-[#E6E9DF] hover:bg-[#D4E0CD] text-[#2D3A27]'
                          : 'bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border border-[#E6E9DF]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-black/15 flex items-center justify-center font-mono text-sm font-black">
                            {opt.key}
                          </span>
                          {opt.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-current">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-70" />
                      </div>
                      <span className="text-xs leading-relaxed">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Quick Clickable Sample Commands */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#5C7457] flex items-center justify-between">
              <span>دستورات سریع صوتی برای تست آنی:</span>
              <span className="text-[11px] text-[#4A6741] font-bold">یک کلیک برای شبیه‌سازی گفتار</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(cmd.text);
                    processTranscript(cmd.text);
                  }}
                  className="text-right p-3 bg-[#F7F8F3] hover:bg-[#E6E9DF] border border-[#E6E9DF] rounded-2xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2D3A27] text-sm group-hover:text-[#4A6741] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#4A6741]" />
                      «{cmd.text}»
                    </span>
                    <span className="text-[10px] text-[#5C7457] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-[#E6E9DF]">تست فوری</span>
                  </div>
                  <p className="text-[11px] text-[#5C7457] mt-1">{cmd.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Role Dynamic Dictionary & Learning */}
          <div className="border-t border-[#E6E9DF] pt-4">
            <button
              onClick={() => setActiveDictionaryView(!activeDictionaryView)}
              className="flex items-center justify-between w-full text-xs text-[#5C7457] hover:text-[#2D3A27] font-medium cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#4A6741]" />
                <span>دیکشنری تخصصی و خودآموز نقش «{currentUserRole}»</span>
              </div>
              <span className="text-[#4A6741] font-bold">{activeDictionaryView ? 'بستن' : 'مشاهده و افزودن واژه'}</span>
            </button>

            {activeDictionaryView && (
              <div className="mt-3 p-4 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF] space-y-3 animate-fadeIn">
                <form onSubmit={handleAddCustomKeyword} className="flex gap-2">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    placeholder="افزودن کلمه تخصصی یا مخفف جدید (مثلاً: سزارین، درونتال، سرم ۵۰۰)..."
                    className="flex-1 bg-white border border-[#E6E9DF] rounded-xl px-3 py-2 text-xs text-[#2D3A27] placeholder-[#5C7457]/70 focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                  />
                  <button
                    type="submit"
                    className="bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>افزودن</span>
                  </button>
                </form>

                <div className="text-[11px] text-[#5C7457]">
                  واژگان فعال در حافظه بالینی:
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {VET_DICTIONARIES.services.slice(0, 8).map((s, i) => (
                      <span key={i} className="bg-white text-[#2D3A27] px-2 py-1 rounded-lg text-[10px] border border-[#E6E9DF] font-medium">
                        {s.key} ({s.title})
                      </span>
                    ))}
                    {VET_DICTIONARIES.medications.slice(0, 4).map((m, i) => (
                      <span key={i} className="bg-[#D4E0CD] text-[#2D3A27] px-2 py-1 rounded-lg text-[10px] font-bold">
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F7F8F3] border-t border-[#E6E9DF] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C7457]">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#4A6741]" />
            <span>فیدبک صوتی به زبان فارسی فعال است</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-[#5C7457]">
            <span className="bg-[#E6E9DF] px-2 py-0.5 rounded text-[#2D3A27] font-bold">
              نگه‌داشتن Alt+F2: شروع و پایان ضبط
            </span>
            <span>کلید ۱ (تایید) | کلید ۲ (لغو)</span>
          </div>
        </div>

      </div>
    </div>
  );
};
