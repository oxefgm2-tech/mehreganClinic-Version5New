import React, { useState } from 'react';
import {
  Scissors,
  Sparkles,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  User,
  Heart,
  Star,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  Coins,
  Send,
  Eye,
  Sliders,
  Gift,
} from 'lucide-react';
import {
  GroomingStyleModel,
  GroomingPortfolioItem,
  OwnerConsentPolicy,
  Pet,
  Owner,
  StaffTipLedgerEntry,
} from '../../types';

interface GroomingSuiteTabProps {
  styles: GroomingStyleModel[];
  onUpdateStyles: (styles: GroomingStyleModel[]) => void;
  portfolio: GroomingPortfolioItem[];
  onUpdatePortfolio: (items: GroomingPortfolioItem[]) => void;
  pets: Pet[];
  owners: Owner[];
  onAddTipLedger?: (entry: StaffTipLedgerEntry) => void;
}

export const GroomingSuiteTab: React.FC<GroomingSuiteTabProps> = ({
  styles,
  onUpdateStyles,
  portfolio,
  onUpdatePortfolio,
  pets,
  owners,
  onAddTipLedger,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'daily_queue' | 'styles_catalog' | 'portfolio_gallery' | 'consent_policy'>('daily_queue');
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>('all');

  // Daily Grooming Active Queue State
  const [activeQueueSteps, setActiveQueueSteps] = useState<{ [petId: string]: { [stepIndex: number]: boolean } }>({
    'pet-1': { 0: true, 1: true, 2: true, 3: false, 4: false, 5: false },
    'pet-2': { 0: true, 1: true, 2: false, 3: false, 4: false, 5: false },
  });

  // Tip input modal for completed grooming
  const [showTipModalForPet, setShowTipModalForPet] = useState<Pet | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(150000);
  const [tipType, setTipType] = useState<'tip' | 'eidi'>('tip');
  const [tipNote, setTipNote] = useState('انعام بابت استایل بسیار تمیز و خوش‌اخلاقی با پت');

  // Add new portfolio item
  const [newPortBeforeUrl, setNewPortBeforeUrl] = useState('https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&auto=format&fit=crop&q=80');
  const [newPortAfterUrl, setNewPortAfterUrl] = useState('https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&auto=format&fit=crop&q=80');
  const [newPortService, setNewPortService] = useState('استایل تدی‌بر پودل + حمام اسپا');
  const [showNewPortfolioModal, setShowNewPortfolioModal] = useState(false);

  const groomingChecklist = [
    'برس‌کشی و گره‌زدایی اولیه (De-matting)',
    'حمام در وان هیدروتراپی و شامپوی ضد حساسیت',
    'خشک‌کردن با بلوئر باد گرم و براشینگ سشوار',
    'اصلاح نژادی و قیچی‌کاری استایل سر و بدن',
    'تخلیه غدد پری‌آنال و شستشوی کانال گوش',
    'کوتاه کردن و سوهان‌کشی ناخن‌ها و عطر پت',
  ];

  const handleToggleStep = (petId: string, stepIdx: number) => {
    const currentForPet = activeQueueSteps[petId] || {};
    const updated = {
      ...activeQueueSteps,
      [petId]: {
        ...currentForPet,
        [stepIdx]: !currentForPet[stepIdx],
      },
    };
    setActiveQueueSteps(updated);
  };

  const handleCompleteGrooming = (pet: Pet) => {
    setShowTipModalForPet(pet);
  };

  const handleConfirmTipAndSendToCashier = () => {
    if (!showTipModalForPet) return;
    const pet = showTipModalForPet;
    const owner = owners.find((o) => o.id === pet.ownerId);

    if (onAddTipLedger) {
      const newEntry: StaffTipLedgerEntry = {
        id: `tip-${Date.now()}`,
        invoiceId: `inv-${Date.now()}`,
        invoiceNumber: `INV-1403-${Math.floor(1000 + Math.random() * 9000)}`,
        petName: pet.name,
        ownerName: owner?.name || 'سرپرست پت',
        targetStaffId: 'u-4',
        targetStaffName: 'آقای سهراب منصوری',
        targetStaffRole: 'آرایشگر و گرومر',
        tipAmountToman: tipAmount,
        tipType,
        customerNote: tipNote,
        paymentStatus: 'paid_with_invoice',
        createdAt: 'امروز، ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      onAddTipLedger(newEntry);
    }
    setShowTipModalForPet(null);
  };

  const handleAddPortfolio = () => {
    const newItem: GroomingPortfolioItem = {
      id: `port-${Date.now()}`,
      groomerId: 'u-4',
      groomerName: 'آقای سهراب منصوری',
      petId: 'pet-1',
      petName: 'تامی',
      breed: 'پودل مینیاتوری',
      ownerName: 'مهندس رضایی',
      beforePhotoUrl: newPortBeforeUrl,
      afterPhotoUrl: newPortAfterUrl,
      serviceTitle: newPortService,
      completedDate: 'امروز، ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      ownerConsentStatus: 'approved_by_owner',
      managerPolicyStatus: 'approved',
      showInPublicGallery: true,
    };
    onUpdatePortfolio([newItem, ...portfolio]);
    setShowNewPortfolioModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#2D3A27] text-white p-6 rounded-2xl border border-[#3E4F36] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#4A6741] flex items-center justify-center text-white shadow-inner">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">سوئیت تخصصی استایلینگ و گرومینگ مهرگان</h1>
              <span className="bg-[#4A6741] text-[#E9EFE6] text-xs px-2.5 py-0.5 rounded-full font-bold">
                وان هیدروتراپی & اصلاح بدون آرامبخش
              </span>
            </div>
            <p className="text-xs text-[#A3B899] mt-1">
              ژورنال استایل نژادی، مدیریت چک‌لیست مراحل، پورتفولیو قبل و بعد، و سامانه انعام و عیدی آرایشگر
            </p>
          </div>
        </div>

        {/* Subtabs */}
        <div className="flex items-center bg-[#1E271A] p-1 rounded-xl border border-[#384E31]">
          <button
            onClick={() => setActiveSubTab('daily_queue')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'daily_queue' ? 'bg-[#4A6741] text-white shadow-md' : 'text-[#A3B899] hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            نوبت‌های روزانه
          </button>
          <button
            onClick={() => setActiveSubTab('styles_catalog')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'styles_catalog'
                ? 'bg-[#4A6741] text-white shadow-md'
                : 'text-[#A3B899] hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            ژورنال مدل‌ها ({styles.length})
          </button>
          <button
            onClick={() => setActiveSubTab('portfolio_gallery')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'portfolio_gallery'
                ? 'bg-[#4A6741] text-white shadow-md'
                : 'text-[#A3B899] hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            پورتفولیو و گالری ({portfolio.length})
          </button>
          <button
            onClick={() => setActiveSubTab('consent_policy')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'consent_policy'
                ? 'bg-[#4A6741] text-white shadow-md'
                : 'text-[#A3B899] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            سیاست رضایت انتشار عکس
          </button>
        </div>
      </div>

      {/* 1. DAILY GROOMING QUEUE WITH STEP-BY-STEP CHECKLIST */}
      {activeSubTab === 'daily_queue' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E6E9DF] shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#2D3A27]">صف اصلاح و شستشوی امروز</h2>
              <p className="text-xs text-[#5C7457]">
                چک‌لیست گام به گام مراحل خدمات و ارسال مستقیم هزینه و انعام به صندوق
              </p>
            </div>
            <div className="text-xs bg-[#F7F8F3] text-[#4A6741] font-bold px-3 py-1.5 rounded-xl border border-[#D5DDD0]">
              گرومر شیفت: آقای سهراب منصوری
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pets.slice(0, 2).map((pet) => {
              const owner = owners.find((o) => o.id === pet.ownerId);
              const petSteps = activeQueueSteps[pet.id] || {};
              const completedCount = Object.values(petSteps).filter(Boolean).length;
              const isAllDone = completedCount === groomingChecklist.length;

              return (
                <div key={pet.id} className="bg-white p-5 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E6E9DF]">
                    <div className="flex items-center gap-3">
                      <img
                        src={pet.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&auto=format&fit=crop&q=80'}
                        alt={pet.name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#D5DDD0]"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-[#2D3A27]">{pet.name}</h3>
                        <p className="text-xs text-[#5C7457]">
                          {pet.species} - {pet.breed} | سرپرست: {owner?.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-xs font-bold font-mono text-[#4A6741]">
                        {completedCount} از {groomingChecklist.length} گام
                      </span>
                      <div className="w-24 bg-[#E6E9DF] h-2 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-[#4A6741] h-full transition-all duration-300"
                          style={{ width: `${(completedCount / groomingChecklist.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist steps */}
                  <div className="space-y-2">
                    {groomingChecklist.map((step, idx) => {
                      const isDone = !!petSteps[idx];
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleToggleStep(pet.id, idx)}
                          className={`w-full p-2.5 rounded-xl border text-right text-xs font-medium flex items-center justify-between transition-all ${
                            isDone
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-[#F7F8F3] border-[#E6E9DF] text-[#5C7457] hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                isDone ? 'bg-emerald-600 text-white' : 'bg-[#D5DDD0] text-[#738A6E]'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </div>
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-[#D5DDD0]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Action button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleCompleteGrooming(pet)}
                      className="w-full bg-[#4A6741] hover:bg-[#384E31] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Gift className="w-4 h-4" />
                      تکمیل خدمات و انتقال فاکتور + انعام به صندوق
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. STYLES CATALOG JOURNAL */}
      {activeSubTab === 'styles_catalog' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#E6E9DF] flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-[#2D3A27]">ژورنال و راهنمای مدل‌های کوتاهی مهرگان</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#738A6E]">فیلتر نژادی:</span>
              <select
                value={selectedStyleFilter}
                onChange={(e) => setSelectedStyleFilter(e.target.value)}
                className="bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1 text-xs font-bold text-[#2D3A27]"
              >
                <option value="all">همه نژادها و استایل‌ها</option>
                <option value="سگ">فقط سگ‌ها</option>
                <option value="گربه">فقط گربه‌ها</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {styles
              .filter((s) => (selectedStyleFilter === 'all' ? true : s.species === selectedStyleFilter))
              .map((style) => (
                <div key={style.id} className="bg-white rounded-2xl border border-[#E6E9DF] overflow-hidden shadow-xs space-y-3 p-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <img
                      src={style.imageUrl}
                      alt={style.title}
                      className="w-full h-40 object-cover rounded-xl border border-[#D5DDD0]"
                    />
                    <div>
                      <span className="text-[10px] font-bold bg-[#E9EFE6] text-[#4A6741] px-2 py-0.5 rounded-md">
                        {style.species} - {style.breed}
                      </span>
                      <h3 className="text-xs font-bold text-[#2D3A27] mt-1.5">{style.title}</h3>
                      <p className="text-[11px] text-[#5C7457] mt-1 line-clamp-3 leading-relaxed">{style.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#E6E9DF]">
                    <div className="flex items-center justify-between text-[11px] text-[#738A6E]">
                      <span>سطح مهارت: {style.difficultyLevel}</span>
                      <span>مدت: ~{style.estimatedDurationMin} دقیقه</span>
                    </div>
                    <div className="text-[10px] bg-[#F7F8F3] p-2 rounded-lg text-[#5C7457]">
                      <span className="font-bold block text-[#2D3A27] mb-0.5">ابزار پیشنهادی:</span>
                      {style.recommendedTools.join('، ')}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 3. PORTFOLIO & BEFORE-AFTER GALLERY */}
      {activeSubTab === 'portfolio_gallery' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#E6E9DF] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#2D3A27]">نمونه‌کارهای آرایشگر و گالری قبل و بعد</h2>
              <p className="text-xs text-[#5C7457]">ثبت تصاویر با رضایت سرپرست پت جهت نمایش در گالری مراجعین</p>
            </div>
            <button
              onClick={() => setShowNewPortfolioModal(true)}
              className="bg-[#4A6741] text-white hover:bg-[#384E31] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              افزودن نمونه کار جدید
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portfolio.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#2D3A27]">{item.serviceTitle}</h3>
                    <p className="text-[11px] text-[#5C7457]">
                      پت: {item.petName} ({item.breed}) | سرپرست: {item.ownerName} | گرومر: {item.groomerName}
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                    تایید رضایت سرپرست پت
                  </span>
                </div>

                {/* Before and After split images */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative rounded-xl overflow-hidden border border-[#D5DDD0]">
                    <img src={item.beforePhotoUrl} alt="قبل از اصلاح" className="w-full h-44 object-cover" />
                    <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      قبل از اصلاح
                    </span>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-emerald-400 ring-2 ring-emerald-500/20">
                    <img src={item.afterPhotoUrl} alt="بعد از استایل" className="w-full h-44 object-cover" />
                    <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      بعد از استایل VIP
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#738A6E] pt-1">
                  <span>تاریخ تکمیل: {item.completedDate}</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> تایید مدیر و سرپرست پت
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. OWNER CONSENT POLICIES */}
      {activeSubTab === 'consent_policy' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#2D3A27]">سیاست‌های رضایت‌نامه انتشار عکس و فیلم پت‌ها</h2>
          <p className="text-xs text-[#5C7457] leading-relaxed">
            مطابق پروتکل حریم خصوصی کلینیک مهرگان، سرپرستان می‌توانند رضایت انتشار عکس‌های استایلینگ در فضای مجازی، وبسایت یا ژورنال کلینیک را بر حسب نژاد و تمایل خود تنظیم کنند:
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-950">همیشه موافق (Always Consent)</h4>
                <p className="text-[11px] text-emerald-800 mt-1">
                  عکس‌های بعد از استایل به صورت خودکار با تگ نام پت در گالری پورتفولیو و اینستاگرام کلینیک مهرگان قرار می‌گیرد.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start gap-3">
              <Sliders className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-950">استعلام و پیامک در هر بار اصلاح (Ask Every Time)</h4>
                <p className="text-[11px] text-amber-800 mt-1">
                  سامانه به صورت پیامک عکس را برای سرپرست پت ارسال کرده و با پاسخ عدد ۱ تایید انتشار دریافت می‌شود.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-950">عدم انتشار و حریم خصوصی محفوظ (Strictly Private)</h4>
                <p className="text-[11px] text-red-800 mt-1">
                  عکس‌ها تنها در پرونده بالینی اختصاصی ذخیره شده و تحت هیچ شرایطی به اشتراک گذاشته نخواهد شد.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIP MODAL */}
      {showTipModalForPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FAFBF7] w-full max-w-md rounded-2xl shadow-2xl border border-[#E6E9DF] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E9DF]">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#4A6741]" />
                <h3 className="text-sm font-bold text-[#2D3A27]">ثبت انعام و عیدی پرسنل گرومینگ</h3>
              </div>
              <button
                onClick={() => setShowTipModalForPet(null)}
                className="text-[#738A6E] hover:text-[#2D3A27] text-xs font-bold"
              >
                انصراف
              </button>
            </div>

            <p className="text-xs text-[#5C7457]">
              مبلغ انعام و عیدی به فاکتور بیمار {showTipModalForPet.name} افزوده شده و در کاردکس آقای سهراب منصوری (آرایشگر) منظور می‌گردد.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#4B5E43] mb-1">نوع پاداش</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipType('tip')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      tipType === 'tip'
                        ? 'bg-[#4A6741] text-white border-[#4A6741]'
                        : 'bg-white text-[#5C7457] border-[#D5DDD0]'
                    }`}
                  >
                    انعام و دستخوش (Tip)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipType('eidi')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      tipType === 'eidi'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-[#5C7457] border-[#D5DDD0]'
                    }`}
                  >
                    عیدی و پاداش سال نو (Eidi)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4B5E43] mb-1">مبلغ انعام (تومان)</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[100000, 150000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTipAmount(amt)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold border ${
                        tipAmount === amt
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                          : 'bg-white text-[#2D3A27] border-[#D5DDD0]'
                      }`}
                    >
                      {amt.toLocaleString('fa-IR')}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#2D3A27]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4B5E43] mb-1">پیام قدردانی سرپرست پت</label>
                <input
                  type="text"
                  value={tipNote}
                  onChange={(e) => setTipNote(e.target.value)}
                  className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowTipModalForPet(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#738A6E]"
              >
                بدون انعام
              </button>
              <button
                onClick={handleConfirmTipAndSendToCashier}
                className="bg-[#4A6741] text-white hover:bg-[#384E31] text-xs font-bold px-5 py-2 rounded-xl shadow-md"
              >
                ثبت و صدور فاکتور
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
