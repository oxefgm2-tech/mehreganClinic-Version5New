import { Pet, UserRole } from '../types';

export interface ParsedVoiceIntent {
  rawTranscript: string;
  intentType: 'record_vaccine' | 'record_visit' | 'order_service' | 'create_appointment' | 'admit_boarding' | 'add_prescription' | 'surgery_deposit_appointment' | 'grooming_appointment' | 'unknown';
  matchedPet?: Pet;
  candidatePets: Pet[];
  extractedService?: string;
  extractedDrug?: string;
  extractedDosage?: string;
  confidence: number;
  confirmationPrompt: string;
  suggestedActionTitle: string;
  suggestedCost?: number;
  requiresDeposit?: boolean;
  depositAmountToman?: number;
  queueCode?: string;
  actionCategory: 'immediate_service' | 'scheduled_appointment' | 'deposit_gate';
  options: { key: string; label: string; actionId: string; badge?: string }[];
}

// Local Persian VetNLP Dictionaries (100% Persian strings to prevent English TTS pronunciation)
export const VET_DICTIONARIES = {
  breeds: [
    { key: 'پامر', full: 'پامرانین', species: 'سگ' },
    { key: 'پامرانین', full: 'پامرانین', species: 'سگ' },
    { key: 'ژرمن', full: 'ژرمن شپرد', species: 'سگ' },
    { key: 'شیتزو', full: 'شیتزو تریر', species: 'سگ' },
    { key: 'پرشین', full: 'پرشین کلاسیک', species: 'گربه' },
    { key: 'گلدن', full: 'گلدن رتریور', species: 'سگ' },
    { key: 'هاسکی', full: 'سیبرین هاسکی', species: 'سگ' },
    { key: 'بریتیش', full: 'بریتیش شورت‌هیر', species: 'گربه' },
    { key: 'عروس', full: 'عروس هلندی', species: 'پرنده' },
    { key: 'لوتینو', full: 'عروس هلندی لوتینو', species: 'پرنده' },
    { key: 'مالتیز', full: 'مالتیز کراس', species: 'سگ' },
    { key: 'پودل', full: 'پودل عروسکی', species: 'سگ' },
    { key: 'تریر', full: 'تریر میکس', species: 'سگ' },
    { key: 'خرگوش', full: 'خرگوش مینی لوپ', species: 'خرگوش و جوندگان' },
  ],
  services: [
    { key: 'واکسن', title: 'واکسیناسیون دوره‌ای و هاری', type: 'record_vaccine', defaultCost: 450000, queueCode: 'exam', requiresDeposit: false },
    { key: 'هاری', title: 'تزریق واکسن هاری', type: 'record_vaccine', defaultCost: 350000, queueCode: 'exam', requiresDeposit: false },
    { key: 'انگل', title: 'انگل‌تراپی و تجویز ضد انگل', type: 'order_service', defaultCost: 250000, queueCode: 'exam', requiresDeposit: false },
    { key: 'جراحی', title: 'ثبت پرونده جراحی تخصصی و اتاق عمل', type: 'surgery_deposit_appointment', defaultCost: 6500000, queueCode: 'surgery', requiresDeposit: true, depositAmount: 2000000 },
    { key: 'عقیم', title: 'جراحی عقیم‌سازی تخصصی', type: 'surgery_deposit_appointment', defaultCost: 3500000, queueCode: 'surgery', requiresDeposit: true, depositAmount: 2000000 },
    { key: 'عکس', title: 'رادیوگرافی دیجیتال', type: 'order_service', defaultCost: 450000, queueCode: 'exam', requiresDeposit: false },
    { key: 'رادیولوژی', title: 'رادیوگرافی و تصویربرداری تشخیصی', type: 'order_service', defaultCost: 450000, queueCode: 'exam', requiresDeposit: false },
    { key: 'سونو', title: 'سونوگرافی شکمی', type: 'order_service', defaultCost: 650000, queueCode: 'exam', requiresDeposit: false },
    { key: 'آزمایش', title: 'آزمایش کامل خون و بیوشیمی', type: 'order_service', defaultCost: 850000, queueCode: 'exam', requiresDeposit: false },
    { key: 'اصلاح', title: 'گرومینگ و کوتاهی موی تخصصی', type: 'grooming_appointment', defaultCost: 600000, queueCode: 'grooming', requiresDeposit: true, depositAmount: 300000 },
    { key: 'گرومینگ', title: 'گرومینگ و شستشوی آرایشی', type: 'grooming_appointment', defaultCost: 650000, queueCode: 'grooming', requiresDeposit: true, depositAmount: 300000 },
    { key: 'شستشو', title: 'شستشوی درمانی و حمام', type: 'order_service', defaultCost: 400000, queueCode: 'washing', requiresDeposit: false },
    { key: 'ناخن', title: 'اصلاح ناخن و سوهان', type: 'order_service', defaultCost: 150000, queueCode: 'grooming', requiresDeposit: false },
    { key: 'پانسیون', title: 'پذیرش و بستری در پانسیون', type: 'admit_boarding', defaultCost: 750000, queueCode: 'exam', requiresDeposit: false },
    { key: 'بستری', title: 'بستری تحت مراقبت ویژه', type: 'admit_boarding', defaultCost: 850000, queueCode: 'exam', requiresDeposit: false },
    { key: 'ویزیت', title: 'معاینه بالینی عمومی', type: 'record_visit', defaultCost: 350000, queueCode: 'exam', requiresDeposit: false },
    { key: 'دندان', title: 'جرم‌گیری دندان با اولتراسونیک', type: 'order_service', defaultCost: 1800000, queueCode: 'dental', requiresDeposit: true, depositAmount: 500000 },
  ],
  medications: [
    { key: 'آموکسی', name: 'آموکسی‌سیلین کلاوولانات', form: 'قرص/شربت', defaultDosage: '۱۲.۵ میلی‌گرم بر کیلوگرم' },
    { key: 'سفالکسین', name: 'سفالکسین', form: 'کپسول ۵۰۰', defaultDosage: '۲۲ میلی‌گرم بر کیلوگرم' },
    { key: 'کارپروفن', name: 'کارپروفن', form: 'قرص ۱۰۰', defaultDosage: '۴.۴ میلی‌گرم بر کیلوگرم' },
    { key: 'ملوکسیکام', name: 'ملوکسیکام', form: 'شربت/تزریقی', defaultDosage: '۰.۱ میلی‌گرم بر کیلوگرم' },
    { key: 'ترامادول', name: 'ترامادول', form: 'قرص ۵۰', defaultDosage: '۲ تا ۴ میلی‌گرم بر کیلوگرم' },
    { key: 'پوزاتکس', name: 'قطره گوش پوزاتکس', form: 'قطره موضعی', defaultDosage: '۴ قطره روزانه' },
    { key: 'درونتال', name: 'قرص ضد انگل درونتال پلاس', form: 'قرص خوراکی', defaultDosage: '۱ قرص به ازای ۱۰ کیلو' },
  ],
};

// Role-adaptive dynamic dictionary storage
const roleCustomKeywords: Record<UserRole, string[]> = {
  senior_veterinarian: ['فرمان مدیر ارشد', 'جراحی فوری', 'فورس ماژور', 'گزارش عملکرد', 'تیکت پرسنل', 'پرونده بیمار'],
  admin: ['مدیریت', 'گزارش مالی', 'تخفیف', 'لغو نوبت', 'بکاپ', 'توسعه آی‌تی'],
  veterinarian: ['واکسن', 'جراحی', 'سونو', 'رادیولوژی', 'پوزاتکس', 'سفالکسین', 'کارپروفن', 'بخیه'],
  groomer: ['اصلاح', 'شستشو', 'گرومینگ', 'ناخن', 'گره‌زدایی', 'شامپو'],
  receptionist: ['نوبت تقویمی', 'ثبت خدمت حاضر', 'بیعانه جراحی', 'پذیرش', 'سرپرست', 'شناسنامه'],
  cashier: ['فاکتور', 'کسر بیعانه', 'کارتخوان', 'تسویه', 'چاپ رسید', 'تخفیف'],
  owner: ['نوبت من', 'پرداخت بیعانه', 'سوابق', 'نسخه', 'دستور مصرف غذا'],
  it_developer: ['IDE', 'کامپایل', 'اسکریپت', 'پایگاه داده', 'وب‌هوک', 'ای‌پی‌آی'],
  petshop_purchasing: ['سفارش خرید', 'تامین‌کننده', 'فاکتور انبار', 'بارکد سریع'],
  petshop_sales: ['فروش حضوری', 'دستور غذای پت', 'توصیه هوشمند', 'باشگاه مشتریان'],
  pet: ['بازی', 'پت مود', 'سرگرمی', 'جایزه'],
  visitor: ['ورود', 'ثبت مشخصات', 'استعلام نوبت'],
  third_party_partner: ['داگ‌واکر', 'جابجایی', 'پانسیون', 'همکار بیرونی'],
};

export function learnKeywordForRole(role: UserRole, keyword: string) {
  if (!roleCustomKeywords[role]) roleCustomKeywords[role] = [];
  if (!roleCustomKeywords[role].includes(keyword.trim())) {
    roleCustomKeywords[role].push(keyword.trim());
  }
}

export function parsePersianVoiceCommand(transcript: string, allPets: Pet[], currentRole: UserRole = 'veterinarian'): ParsedVoiceIntent {
  const clean = transcript.trim().toLowerCase();
  
  // Find matching service
  let matchedService = VET_DICTIONARIES.services.find(s => clean.includes(s.key));
  let matchedMedication = VET_DICTIONARIES.medications.find(m => clean.includes(m.key));
  
  // 1. Identify species / breed or direct pet name
  let candidatePets: Pet[] = [];
  
  // First check if a pet name directly appears in transcript
  const directNameMatch = allPets.filter(p => clean.includes(p.name.toLowerCase()));
  if (directNameMatch.length > 0) {
    candidatePets = directNameMatch;
  } else {
    // Check breed matches
    const breedMatch = VET_DICTIONARIES.breeds.find(b => clean.includes(b.key));
    if (breedMatch) {
      candidatePets = allPets.filter(p => 
        p.breed.toLowerCase().includes(breedMatch.key) || 
        p.species.includes(breedMatch.species)
      );
    }
  }

  // 2. DISAMBIGUATION: Check if pet is currently present in clinic
  const presentPets = candidatePets.filter(p => p.statusInClinic !== 'not_present');
  const selectedPet = presentPets.length > 0 ? presentPets[0] : (candidatePets[0] || allPets.find(p => p.statusInClinic === 'waiting') || allPets[0]);

  // Determine intent type & distinct separation between immediate service vs future appointment
  const isExplicitAppointment = clean.includes('نوبت') || clean.includes('رزرو') || clean.includes('وقت');
  const isExplicitImmediateService = clean.includes('انجام شد') || clean.includes('حاضر') || clean.includes('خدمت') || clean.includes('تزریق شد') || clean.includes('شروع');

  let intentType: ParsedVoiceIntent['intentType'] = 'record_visit';
  let suggestedActionTitle = 'ثبت ویزیت بالینی';
  let suggestedCost = 350000;
  let requiresDeposit = false;
  let depositAmountToman = 0;
  let queueCode = 'exam';
  let actionCategory: ParsedVoiceIntent['actionCategory'] = 'immediate_service';

  if (matchedService) {
    intentType = matchedService.type as ParsedVoiceIntent['intentType'];
    suggestedActionTitle = matchedService.title;
    suggestedCost = matchedService.defaultCost;
    requiresDeposit = !!matchedService.requiresDeposit;
    depositAmountToman = matchedService.depositAmount || 0;
    queueCode = matchedService.queueCode;
  }

  // Surgery Specific Handling
  if (clean.includes('جراحی') || clean.includes('عقیم')) {
    intentType = 'surgery_deposit_appointment';
    suggestedActionTitle = clean.includes('عقیم') ? 'جراحی عقیم‌سازی' : 'جراحی تخصصی اتاق عمل';
    suggestedCost = 6500000;
    requiresDeposit = true;
    depositAmountToman = 2000000;
    queueCode = 'surgery';
  }

  // Grooming Specific Handling
  if (clean.includes('گرومینگ') || clean.includes('اصلاح')) {
    intentType = 'grooming_appointment';
    suggestedActionTitle = 'اصلاح و گرومینگ تخصصی';
    suggestedCost = 650000;
    requiresDeposit = true;
    depositAmountToman = 300000;
    queueCode = 'grooming';
  }

  // Build natural Persian confirmation prompt and options
  let confirmationPrompt = '';
  const options: { key: string; label: string; actionId: string; badge?: string }[] = [];

  if (selectedPet) {
    if (intentType === 'surgery_deposit_appointment') {
      actionCategory = 'deposit_gate';
      confirmationPrompt = `برای «${selectedPet.name} (${selectedPet.breed})» کدام عملیات جراحی مد نظر است؟`;
      options.push({
        key: '1',
        label: `رزرو نوبت جراحی در صف (با بیعانه ۲,۰۰۰,۰۰۰ تومان و ارسال لینک پرداخت)`,
        actionId: 'schedule_surgery_deposit',
        badge: 'رزرو نوبت تقویمی با بیعانه',
      });
      options.push({
        key: '2',
        label: `ثبت فوری جراحی حاضر در اتاق عمل (شروع خدمت جاری)`,
        actionId: 'immediate_surgery_service',
        badge: 'ثبت خود خدمت حاضر',
      });
      options.push({
        key: '3',
        label: 'انصراف و لغو دستور',
        actionId: 'cancel',
      });
    } else if (intentType === 'grooming_appointment') {
      actionCategory = 'deposit_gate';
      confirmationPrompt = `تفکیک خدمت/نوبت گرومینگ برای «${selectedPet.name}»:`;
      options.push({
        key: '1',
        label: `رزرو نوبت گرومینگ تقویمی در صف پیرایش (بیعانه ۳۰۰,۰۰۰ تومان)`,
        actionId: 'schedule_grooming_deposit',
        badge: 'نوبت‌دهی تقویمی',
      });
      options.push({
        key: '2',
        label: `ثبت خود خدمت اصلاح و شستشوی حاضر در سالن`,
        actionId: 'immediate_grooming_service',
        badge: 'ثبت فوری خدمت',
      });
      options.push({
        key: '3',
        label: 'انصراف و لغو',
        actionId: 'cancel',
      });
    } else if (intentType === 'record_vaccine') {
      actionCategory = 'immediate_service';
      confirmationPrompt = `آیا واکسیناسیون هاری و دوره‌ای برای ${selectedPet.name} (${selectedPet.breed}) ثبت شود؟`;
      options.push({ key: '1', label: 'بله، ثبت فوری واکسیناسیون (کلید ۱)', actionId: 'confirm' });
      options.push({ key: '2', label: 'انصراف (کلید ۲)', actionId: 'cancel' });
    } else if (intentType === 'admit_boarding') {
      actionCategory = 'immediate_service';
      confirmationPrompt = `آیا ${selectedPet.name} (${selectedPet.breed}) در پانسیون پذیرش شود؟`;
      options.push({ key: '1', label: 'بله، پذیرش در پانسیون (کلید ۱)', actionId: 'confirm' });
      options.push({ key: '2', label: 'انصراف (کلید ۲)', actionId: 'cancel' });
    } else {
      actionCategory = isExplicitAppointment ? 'scheduled_appointment' : 'immediate_service';
      confirmationPrompt = `آیا خدمت «${suggestedActionTitle}» برای ${selectedPet.name} ثبت گردد؟`;
      options.push({ key: '1', label: 'بله، ثبت خدمت بالینی (کلید ۱)', actionId: 'confirm' });
      options.push({ key: '2', label: 'انصراف (کلید ۲)', actionId: 'cancel' });
    }
  } else {
    confirmationPrompt = `دستور «${transcript}» با چه پرونده‌ای ثبت شود؟`;
    options.push({ key: '1', label: 'ثبت برای اولین بیمار حاضر', actionId: 'confirm' });
    options.push({ key: '2', label: 'لغو', actionId: 'cancel' });
  }

  if (candidatePets.length > 1 && options.length < 3) {
    options.push({
      key: '3',
      label: `انتخاب بیمار دوم (${candidatePets[1].name} - ${candidatePets[1].breed})`,
      actionId: `select_pet_${candidatePets[1].id}`,
      badge: 'رفع ابهام',
    });
  }

  return {
    rawTranscript: transcript,
    intentType,
    matchedPet: selectedPet,
    candidatePets,
    extractedService: matchedService?.title || suggestedActionTitle,
    extractedDrug: matchedMedication?.name,
    extractedDosage: matchedMedication?.defaultDosage,
    confidence: selectedPet ? 0.96 : 0.70,
    confirmationPrompt,
    suggestedActionTitle,
    suggestedCost,
    requiresDeposit,
    depositAmountToman,
    queueCode,
    actionCategory,
    options,
  };
}

// Text-to-Speech in Persian with complete Latin sanitization
export function speakPersianFeedback(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();

      // Clean out any English words in parentheses or Latin letters (e.g. (Pomeranian), (German Shepherd), English letters)
      let sanitized = text
        .replace(/\([a-zA-Z0-9\s\-_/.]+\)/g, '')
        .replace(/[a-zA-Z]/g, '')
        .replace(/«|»|"|'|\*|_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!sanitized) return;

      const utterance = new SpeechSynthesisUtterance(sanitized);
      utterance.lang = 'fa-IR';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Select Persian voice or best Middle-Eastern / Arabic phonetic fallback
      const voices = window.speechSynthesis.getVoices();
      const persianVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('fa') ||
          v.lang.toLowerCase() === 'fa-ir' ||
          v.lang.toLowerCase() === 'fa_ir' ||
          v.name.toLowerCase().includes('persian') ||
          v.name.toLowerCase().includes('farsi') ||
          v.name.toLowerCase().includes('iran')
      ) || voices.find((v) => v.lang.toLowerCase().startsWith('ar'));

      if (persianVoice) {
        utterance.voice = persianVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }
}
