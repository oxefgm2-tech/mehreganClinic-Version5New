import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ScanBarcode,
  Video,
  Camera,
  Layers,
  ZoomIn,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Percent,
  Coins,
  QrCode,
  Smartphone,
  Share2,
  Copy,
  Check,
  Plus,
  Minus,
  Trash2,
  Search,
  Filter,
  Package,
  Clock,
  RefreshCw,
  Gift,
  Award,
  Crown,
  HeartHandshake,
  Utensils,
  Receipt,
  FileCheck,
  Calculator,
  ExternalLink,
  ChevronDown,
  Info,
  CheckSquare,
  Square,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  PetShopProduct,
  SweepVideoAnalysisSession,
  VideoScannedItem,
  PetShopCartItem,
  LoyaltyMember,
  SpinWheelReward,
  CryptoRates,
  AIAgentMarketingDraft,
  AIAgentLearningRule,
  SpeciesType,
  PetProductCategory,
  Pet,
  Owner,
  OmnichannelMessagePayload,
} from '../../types';
import { SmartSearchSelect } from '../SmartSearchSelect';
import { OmnichannelShareModal } from '../OmnichannelShareModal';

interface PetShopTabProps {
  products: PetShopProduct[];
  onUpdateProducts: (products: PetShopProduct[]) => void;
  sweepSessions: SweepVideoAnalysisSession[];
  onAddSweepSession: (session: SweepVideoAnalysisSession) => void;
  loyaltyMembers: LoyaltyMember[];
  onUpdateLoyaltyMembers: (members: LoyaltyMember[]) => void;
  spinRewards: SpinWheelReward[];
  cryptoRates: CryptoRates;
  aiAgentDrafts: AIAgentMarketingDraft[];
  onUpdateAiDrafts: (drafts: AIAgentMarketingDraft[]) => void;
  learningRules: AIAgentLearningRule[];
  onAddLearningRule: (rule: AIAgentLearningRule) => void;
  pets: Pet[];
  owners: Owner[];
}

export const PetShopTab: React.FC<PetShopTabProps> = ({
  products,
  onUpdateProducts,
  sweepSessions,
  onAddSweepSession,
  loyaltyMembers,
  onUpdateLoyaltyMembers,
  spinRewards,
  cryptoRates,
  aiAgentDrafts,
  onUpdateAiDrafts,
  learningRules,
  onAddLearningRule,
  pets,
  owners,
}) => {
  // Main Subtabs
  type SubTabId = 'pos_store' | 'video_scanner' | 'gateways' | 'loyalty_club' | 'ai_marketing_agent';
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('pos_store');

  // Filters for Store
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');

  // POS Sales Cart State
  const [cart, setCart] = useState<PetShopCartItem[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'pos_shaparak' | 'crypto_usdt' | 'crypto_ton' | 'crypto_trx' | 'cash'>('pos_shaparak');
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState('');

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
      type: 'invoice',
      title: '',
      formattedBodyText: '',
    },
  });

  // Video Sweep Scanner State
  const [isScanningVideo, setIsScanningVideo] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentSession, setCurrentSession] = useState<SweepVideoAnalysisSession>(sweepSessions[0]);
  const [zoomedItem, setZoomedItem] = useState<VideoScannedItem | null>(null);

  // Lucky Spin Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [wonReward, setWonReward] = useState<SpinWheelReward | null>(null);

  // Refill Calculator State
  const [calculatorPetWeight, setCalculatorPetWeight] = useState<number>(4);
  const [calculatorBagWeightGram, setCalculatorBagWeightGram] = useState<number>(2000);
  const [calculatedDays, setCalculatedDays] = useState<number>(40);

  // Crypto Timer State
  const [cryptoTimeLeft, setCryptoTimeLeft] = useState<number>(900); // 15 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setCryptoTimeLeft((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update refill days calculation
  useEffect(() => {
    // Formula: Daily grams roughly ~ 12.5g per kg for cats, 15g per kg for small dogs
    const estimatedDailyGrams = Math.max(20, calculatorPetWeight * 12.5);
    const days = Math.round(calculatorBagWeightGram / estimatedDailyGrams);
    setCalculatedDays(days);
  }, [calculatorPetWeight, calculatorBagWeightGram]);

  // Selected Pet & Owner for POS Cart
  const currentPet = pets.find((p) => p.id === selectedPetId);
  const currentOwner = owners.find((o) => o.id === currentPet?.ownerId);
  const currentLoyalty = loyaltyMembers.find((lm) => lm.ownerId === currentOwner?.id);

  // Cart Calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.itemTotal, 0);
  const loyaltyDiscountPercent = currentLoyalty?.discountPerkPercent || 0;
  const loyaltyDiscountAmount = (cartSubtotal * loyaltyDiscountPercent) / 100;
  const cartFinalTotal = cartSubtotal - loyaltyDiscountAmount;

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      String(p.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.brand ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.barcode ?? '').includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSpecies = selectedSpecies === 'all' || p.targetSpecies === selectedSpecies;
    return matchesSearch && matchesCategory && matchesSpecies;
  });

  // Cart actions
  const handleAddToCart = (product: PetShopProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, itemTotal: (item.quantity + 1) * item.product.sellingPrice }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          discountPercent: 0,
          itemTotal: product.sellingPrice,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, itemTotal: newQty * item.product.sellingPrice }
              : null;
          }
          return item;
        })
        .filter(Boolean) as PetShopCartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) return;
    const invNum = `PS-${Date.now().toString().slice(-6)}`;
    setLastInvoiceNumber(invNum);
    setShowCheckoutSuccess(true);

    // Reduce stock
    const updated = products.map((p) => {
      const inCart = cart.find((item) => item.product.id === p.id);
      if (inCart) {
        return { ...p, stockQuantity: Math.max(0, p.stockQuantity - inCart.quantity) };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  // Trigger Video Sweep Scan Simulation
  const handleStartSweepScan = () => {
    setIsScanningVideo(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanningVideo(false);
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  // Confirm Scanned Items to Inventory
  const handleConfirmBatchToInventory = () => {
    const newItems: PetShopProduct[] = currentSession.detectedItems.map((item) => ({
      id: `prod-${Date.now()}-${item.id}`,
      barcode: item.detectedBarcode,
      title: item.productName,
      brand: item.brand,
      category: item.category,
      targetSpecies: item.species,
      packageWeightGram: 1000,
      purchasePrice: item.estimatedPurchasePrice,
      sellingPrice: item.suggestedSellingPrice,
      stockQuantity: item.quantity,
      minStockAlert: 4,
      imageUrl: item.frameImageUrl,
      marketPrices: item.marketComparison,
    }));

    onUpdateProducts([...products, ...newItems]);
    alert(`تعداد ${newItems.length} قلم کالا با موفقیت از طریق اسکن فریم‌های ویدیویی به انبار پت‌شاپ اضافه گردید.`);
  };

  // Lucky Spin Action
  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonReward(null);

    const randomDeg = 1440 + Math.floor(Math.random() * 360);
    setSpinRotation((prev) => prev + randomDeg);

    setTimeout(() => {
      setIsSpinning(false);
      const selected = spinRewards[Math.floor(Math.random() * spinRewards.length)];
      setWonReward(selected);
    }, 3200);
  };

  // Quick Open Share Modals
  const openShareInvoice = () => {
    const itemsListText = cart
      .map((item, idx) => `${idx + 1}. ${item.product.title} (${item.quantity} عدد) - ${item.itemTotal.toLocaleString('fa-IR')} ریال`)
      .join('\n');

    setShareModalPayload({
      isOpen: true,
      payload: {
        recipientName: currentOwner?.fullName || 'سرپرست گرامی',
        recipientPhone: currentOwner?.phone || '',
        platform: 'bale',
        type: 'invoice',
        title: `فاکتور رسمی خرید پت‌شاپ #${lastInvoiceNumber}`,
        formattedBodyText: `🐾 **کلینیک دامپزشکی و پت‌شاپ هوشمند مهرگان** 🐾
🧾 **فاکتور فروش شماره:** ${lastInvoiceNumber}
📅 **تاریخ:** ${new Date().toLocaleDateString('fa-IR')}
👤 **سرپرست:** ${currentOwner?.fullName || 'مشتری آزاد'} (پت: ${currentPet?.name || '-'})

📋 **اقلام خریداری شده:**
${itemsListText}

💰 **مبلغ کل اقلام:** ${cartSubtotal.toLocaleString('fa-IR')} ریال
🎁 **تخفیف باشگاه مشتریان (${loyaltyDiscountPercent}٪):** ${loyaltyDiscountAmount.toLocaleString('fa-IR')} ریال
💳 **مبلغ نهایی پرداختی:** ${cartFinalTotal.toLocaleString('fa-IR')} ریال
🔒 **روش پرداخت:** ${paymentMethod === 'pos_shaparak' ? 'کارتخوان شاپرک' : 'درگاه رمزارز (کریپتو)'}

با آرزوی تندرستی و نشاط برای پت دوست‌داشتنی شما 🌸`,
      },
    });
  };

  const openShareDosage = (product: PetShopProduct) => {
    const dosageTableText = product.dosageInstructions?.dailyGramsPerWeightKg
      .map((d) => `▫️ وزن ${d.weightRange}: روزانه ${d.grams} گرم`)
      .join('\n') || 'طبق دستور بالینی مصرف شود.';

    setShareModalPayload({
      isOpen: true,
      payload: {
        recipientName: currentOwner?.fullName || 'سرپرست گرامی',
        recipientPhone: currentOwner?.phone || '',
        platform: 'bale',
        type: 'nutrition_guide',
        title: `دستورالعمل فشرده تغذیه: ${product.title}`,
        formattedBodyText: `🥣 **راهنمای تخصصی دوز مصرف غذای پت**
🏷️ **محصول:** ${product.title} (${product.brand})
🐾 **پت هدف:** ${currentPet?.name || 'پت عزیز شما'} (وزن فعلی: ${currentPet?.weightKg || 4} کیلوگرم)

📊 **میزان مصرف استاندارد روزانه بر اساس وزن:**
${dosageTableText}

💡 **نکات کلیدی سرپرست:**
${product.dosageInstructions?.safetyNotes || 'همیشه آب تازه در دسترس پت قرار دهید.'}

کلینیک دامپزشکی حیوانات خانگی مهرگان 🌿`,
      },
    });
  };

  const openShareSupplementSafety = (product: PetShopProduct) => {
    setShareModalPayload({
      isOpen: true,
      payload: {
        recipientName: currentOwner?.fullName || 'سرپرست گرامی',
        recipientPhone: currentOwner?.phone || '',
        platform: 'bale',
        type: 'supplement_safety',
        title: `پیام دلگرم‌کننده و ایمنی مصرف: ${product.title}`,
        formattedBodyText: `🌸 **پیام سلامت و مراقبت ویژه کلینیک مهرگان**
سرپرست گرامی ${currentOwner?.fullName || 'عزیز'}، با سلام و درود؛

از اینکه به سلامت و شادابی ${currentPet?.name || 'فرزند دوست‌داشتنی‌تان'} اهمیت می‌دهید، صمیمانه سپاسگزاریم.
جهت اثربخشی عالی و سلامت کامل، مکمل خریداری شده (**${product.title}**) را دقیقاً مطابق با دوز قید شده مصرف فرمایید.

💖 **یادآوری دوستانه و آرامش‌بخش:**
${product.dosageInstructions?.overdoseGuideline || 'مصرف به اندازه به سلامت و نشاط پت کمک می‌کند. هرگز نگران نباشید و در صورت هرگونه سوال بالینی با تیم پشتیبانی ما تماس بگیرید.'}

با مهر و احترام فراوان • تیم درمانی کلینیک مهرگان 🐾`,
      },
    });
  };

  // AI Agent Approval & Learning
  const handleApproveDraft = (draft: AIAgentMarketingDraft) => {
    const updated = aiAgentDrafts.map((d) => (d.id === draft.id ? { ...d, status: 'approved' as const } : d));
    onUpdateAiDrafts(updated);

    // AI learns a new rule
    const newRule: AIAgentLearningRule = {
      id: `rule-${Date.now()}`,
      ruleTitle: `تایید الگوی ارسال برای ${draft.species} نژاد دار با تخفیف وفاداری`,
      description: `پیشنهاد هوشمند کالا متناسب با سابقه خرید و سطح باشگاه مشتری برای ${draft.petName} تایید شد.`,
      weight: 88,
      learnedFromAction: 'تایید مستقیم اپراتور پذیرش پت‌شاپ',
      appliedCount: 1,
      createdAt: new Date().toLocaleDateString('fa-IR'),
    };
    onAddLearningRule(newRule);
    alert('پیام با موفقیت تایید و جهت ارسال زمان‌بندی شد. الگوی رفتاری جدید به حافظه خودآموز هوش مصنوعی اضافه گردید.');
  };

  return (
    <div id="smart-petshop-tab" className="space-y-5 text-[#2D3A27]">
      {/* Top Header & High-Level KPIs */}
      <div className="bg-white rounded-[28px] p-5 border border-[#E6E9DF] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#4A6741] text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#2D3A27]">
                  پت‌شاپ و انبارداری هوشمند کلینیک
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4E0CD] text-[#2D3A27] text-[11px] font-bold">
                  Vision Sweep AI + چندارزی
                </span>
              </div>
              <p className="text-xs text-[#5C7457] mt-0.5">
                ورود هوایی کالا با ویدیو اسکنر، استعلام قیمت ترب/دیجی‌کالا/اسنپ‌فود، پرداخت شاپرک و کریپتو، باشگاه مشتریان و ایجنت خودآموز
              </p>
            </div>
          </div>

          {/* Quick Sub-Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('pos_store')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeSubTab === 'pos_store'
                  ? 'bg-[#4A6741] text-white shadow-xs'
                  : 'text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#E6E9DF]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>فروشگاه و صندوق</span>
            </button>

            <button
              onClick={() => setActiveSubTab('video_scanner')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeSubTab === 'video_scanner'
                  ? 'bg-[#4A6741] text-white shadow-xs'
                  : 'text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#E6E9DF]'
              }`}
            >
              <ScanBarcode className="w-3.5 h-3.5" />
              <span>اسکن هوایی ویدیو فاکتور</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </button>

            <button
              onClick={() => setActiveSubTab('gateways')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeSubTab === 'gateways'
                  ? 'bg-[#4A6741] text-white shadow-xs'
                  : 'text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#E6E9DF]'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>درگاه شاپرک و کریپتو</span>
            </button>

            <button
              onClick={() => setActiveSubTab('loyalty_club')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeSubTab === 'loyalty_club'
                  ? 'bg-[#4A6741] text-white shadow-xs'
                  : 'text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#E6E9DF]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>باشگاه و گردونه شانس</span>
            </button>

            <button
              onClick={() => setActiveSubTab('ai_marketing_agent')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeSubTab === 'ai_marketing_agent'
                  ? 'bg-[#4A6741] text-white shadow-xs'
                  : 'text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#E6E9DF]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ایجنت خودآموز بازاریابی</span>
            </button>
          </div>
        </div>

        {/* Live KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#E6E9DF]">
          <div className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF]">
            <span className="text-[11px] text-[#5C7457] font-medium">کل اقلام انبار پت‌شاپ</span>
            <div className="text-base font-extrabold text-[#2D3A27] mt-0.5">
              {products.reduce((acc, p) => acc + p.stockQuantity, 0)} عدد
              <span className="text-[11px] font-normal text-[#5C7457] mr-1">({products.length} تنوع)</span>
            </div>
          </div>

          <div className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF]">
            <span className="text-[11px] text-[#5C7457] font-medium">ارزش ریالی موجودی</span>
            <div className="text-base font-extrabold text-[#2D3A27] mt-0.5">
              {(products.reduce((acc, p) => acc + p.sellingPrice * p.stockQuantity, 0) / 10000000).toFixed(1)} میلیون تومان
            </div>
          </div>

          <div className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF]">
            <span className="text-[11px] text-[#5C7457] font-medium">معادل دلاری/تتر (نرخ روز)</span>
            <div className="text-base font-extrabold text-[#4A6741] mt-0.5">
              $
              {(
                products.reduce((acc, p) => acc + (p.sellingPrice / 10) * p.stockQuantity, 0) /
                cryptoRates.usdtToman
              ).toFixed(0)}{' '}
              USDT
            </div>
          </div>

          <div className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF]">
            <span className="text-[11px] text-[#5C7457] font-medium">اعضای فعال باشگاه مشتریان</span>
            <div className="text-base font-extrabold text-[#2D3A27] mt-0.5">
              {loyaltyMembers.length} سرپرست VIP
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: POS & CATALOG STORE                                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'pos_store' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Products List & Filters (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter Bar */}
            <div className="p-4 bg-white rounded-[28px] border border-[#E6E9DF] shadow-xs flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3.5 top-3 text-[#5C7457]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام کالا، برند یا اسکن مستقیم بارکد..."
                  className="w-full pl-3 pr-10 py-2 bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl text-xs text-[#2D3A27] focus:outline-none focus:border-[#4A6741]"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedSpecies}
                  onChange={(e) => setSelectedSpecies(e.target.value)}
                  className="px-3 py-2 bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl text-xs text-[#2D3A27] focus:outline-none focus:border-[#4A6741]"
                >
                  <option value="all">تمامی گونه‌ها</option>
                  <option value="گربه">ویژه گربه</option>
                  <option value="سگ">ویژه سگ</option>
                  <option value="پرنده">ویژه پرنده</option>
                  <option value="خرگوش و جوندگان">جوندگان</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl text-xs text-[#2D3A27] focus:outline-none focus:border-[#4A6741]"
                >
                  <option value="all">همه دسته‌ها</option>
                  <option value="dry_food">غذای خشک</option>
                  <option value="wet_food">کنسرو و پوچ</option>
                  <option value="supplements">مکمل و مالت</option>
                  <option value="treats">تشویقی</option>
                  <option value="hygiene_care">بهداشتی</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((prod) => {
                const isItemDemo = prod.isDemo === true || prod.isVerified === false;
                return (
                <div
                  key={prod.id}
                  className={`rounded-[24px] p-4 shadow-xs flex flex-col justify-between transition-all group ${
                    isItemDemo
                      ? 'bg-stone-100/90 border-2 border-dashed border-stone-300 text-stone-600'
                      : 'bg-white border border-[#E6E9DF] hover:border-[#4A6741]/50'
                  }`}
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <img
                        src={prod.imageUrl}
                        alt={prod.title}
                        className={`w-20 h-20 rounded-2xl object-cover shrink-0 ${
                          isItemDemo
                            ? 'grayscale-[75%] border border-stone-300 opacity-85 bg-stone-200'
                            : 'border border-[#E6E9DF] bg-[#F7F8F3]'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isItemDemo ? 'bg-stone-200 text-stone-700' : 'bg-[#D4E0CD] text-[#2D3A27]'
                          }`}>
                            {prod.brand} • {prod.targetSpecies}
                          </span>
                          {isItemDemo && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-300 text-stone-700 border border-stone-400">
                              غیرواقعی (طوسی)
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              prod.stockQuantity <= prod.minStockAlert
                                ? 'bg-rose-100 text-rose-800'
                                : isItemDemo
                                ? 'bg-stone-200 text-stone-700'
                                : 'bg-[#F7F8F3] text-[#5C7457]'
                            }`}
                          >
                            موجودی: {prod.stockQuantity} عدد
                          </span>
                        </div>
                        <h4 className={`text-xs font-extrabold mt-1.5 line-clamp-2 leading-relaxed ${
                          isItemDemo ? 'text-stone-700' : 'text-[#2D3A27]'
                        }`}>
                          {prod.title}
                        </h4>
                        <div className="text-[10px] text-stone-500 mt-1 font-mono">
                          بارکد: {prod.barcode}
                        </div>
                      </div>
                    </div>

                    {/* Online Competitor Price Grounding */}
                    {prod.marketPrices && (
                      <div className={`mt-3 p-2 rounded-xl text-[11px] space-y-1 ${
                        isItemDemo ? 'bg-stone-200/60 border border-stone-300 text-stone-600' : 'bg-[#F7F8F3] border border-[#E6E9DF]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={isItemDemo ? 'text-stone-500' : 'text-[#5C7457]'}>دیجی‌کالا:</span>
                          <strong className={isItemDemo ? 'text-stone-700' : 'text-[#2D3A27]'}>
                            {prod.marketPrices.digikalaPrice.toLocaleString('fa-IR')} ریال
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={isItemDemo ? 'text-stone-500' : 'text-[#5C7457]'}>میانگین ترب (Torob):</span>
                          <strong className={isItemDemo ? 'text-stone-700' : 'text-[#2D3A27]'}>
                            {prod.marketPrices.torobAvgPrice.toLocaleString('fa-IR')} ریال
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions & Price */}
                  <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                    isItemDemo ? 'border-stone-300' : 'border-[#E6E9DF]'
                  }`}>
                    <div>
                      <span className="text-[10px] text-stone-500 block">قیمت کلینیک:</span>
                      <span className={`text-sm font-extrabold ${isItemDemo ? 'text-stone-700' : 'text-[#4A6741]'}`}>
                        {prod.sellingPrice.toLocaleString('fa-IR')}{' '}
                        <span className="text-[10px] font-normal text-stone-500">ریال</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Share Micro Guide */}
                      {prod.dosageInstructions && (
                        <button
                          onClick={() => openShareDosage(prod)}
                          title="ارسال راهنمای دوز مصرف در بله/واتساپ/تلگرام"
                          className="p-2 rounded-xl bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#5C7457] hover:text-[#2D3A27] transition-all cursor-pointer"
                        >
                          <Utensils className="w-4 h-4" />
                        </button>
                      )}

                      {/* Share Supplement Safety Reminder */}
                      {prod.dosageInstructions?.isOverdoseRisk && (
                        <button
                          onClick={() => openShareSupplementSafety(prod)}
                          title="ارسال پیام دلگرم‌کننده ایمنی مکمل"
                          className="p-2 rounded-xl bg-[#D4E0CD] hover:bg-[#8CA685]/40 text-[#2D3A27] transition-all cursor-pointer"
                        >
                          <HeartHandshake className="w-4 h-4 text-[#4A6741]" />
                        </button>
                      )}

                      <button
                        onClick={() => handleAddToCart(prod)}
                        disabled={prod.stockQuantity <= 0}
                        className={`px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                          isItemDemo
                            ? 'bg-stone-500 hover:bg-stone-600'
                            : 'bg-[#4A6741] hover:bg-[#3D5535]'
                        } disabled:bg-slate-200 disabled:text-slate-400`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن</span>
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* POS Cart & Instant Checkout (4 Cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[28px] p-5 border border-[#E6E9DF] shadow-xs space-y-4 sticky top-4">
              <div className="flex items-center justify-between border-b border-[#E6E9DF] pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#4A6741]" />
                  <h3 className="text-sm font-extrabold text-[#2D3A27]">سبد فروش و صورتحساب</h3>
                </div>
                <span className="text-xs font-bold text-[#5C7457] bg-[#F7F8F3] px-2.5 py-0.5 rounded-lg border border-[#E6E9DF]">
                  {cart.length} قلم
                </span>
              </div>

              {/* Customer Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#2D3A27] block">
                  انتخاب پرونده بیمار / سرپرست:
                </label>
                <SmartSearchSelect value={selectedPetId} onChange={setSelectedPetId} className="w-full p-2.5 bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl text-xs text-[#2D3A27] focus:outline-none focus:border-[#4A6741]" options={pets.map((p) => ({ value: p.id, label: `${p.name} (${p.species} - ${p.breed}) • سرپرست: ${p.ownerName}`, searchText: `${p.name} ${p.ownerName} ${p.ownerPhone} ${p.microchipNumber}` }))} />

                {/* Loyalty Tier Badge */}
                {currentLoyalty && (
                  <div className="p-2 bg-[#D4E0CD]/40 border border-[#4A6741]/30 rounded-xl flex items-center justify-between text-xs mt-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#2D3A27]">
                      <Crown className="w-4 h-4 text-amber-700" />
                      <span>عضو باشگاه {currentLoyalty.tier.toUpperCase()}</span>
                    </div>
                    <span className="font-extrabold text-[#4A6741]">
                      {currentLoyalty.discountPerkPercent}٪ تخفیف خودکار
                    </span>
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-[#5C7457] text-xs">
                    سبد خرید خالی است؛ کالایی را از کاتالوگ انتخاب نمایید.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-2.5 bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#2D3A27] truncate">{item.product.title}</div>
                        <div className="text-[11px] text-[#5C7457] mt-0.5">
                          {item.product.sellingPrice.toLocaleString('fa-IR')} ریال × {item.quantity}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#E6E9DF] flex items-center justify-center text-[#2D3A27] hover:bg-[#E6E9DF] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#E6E9DF] flex items-center justify-center text-[#2D3A27] hover:bg-[#E6E9DF] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center hover:bg-rose-100 cursor-pointer mr-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Gateway Method */}
              <div className="space-y-1.5 pt-2 border-t border-[#E6E9DF]">
                <label className="text-[11px] font-bold text-[#2D3A27] block">روش تسویه حساب:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setPaymentMethod('pos_shaparak')}
                    className={`p-2 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      paymentMethod === 'pos_shaparak'
                        ? 'bg-[#4A6741] text-white border-[#4A6741]'
                        : 'bg-[#F7F8F3] text-[#2D3A27] border-[#E6E9DF]'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>کارتخوان شاپرک</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('crypto_usdt')}
                    className={`p-2 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      paymentMethod === 'crypto_usdt'
                        ? 'bg-[#4A6741] text-white border-[#4A6741]'
                        : 'bg-[#F7F8F3] text-[#2D3A27] border-[#E6E9DF]'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>کریپتو (USDT/TON)</span>
                  </button>
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#5C7457]">
                  <span>جمع اقلام:</span>
                  <span>{cartSubtotal.toLocaleString('fa-IR')} ریال</span>
                </div>
                {loyaltyDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>تخفیف باشگاه ({loyaltyDiscountPercent}٪):</span>
                    <span>-{loyaltyDiscountAmount.toLocaleString('fa-IR')} ریال</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-[#2D3A27] pt-2 border-t border-[#E6E9DF]">
                  <span>مبلغ نهایی:</span>
                  <span className="text-[#4A6741]">{cartFinalTotal.toLocaleString('fa-IR')} ریال</span>
                </div>
                {paymentMethod === 'crypto_usdt' && (
                  <div className="flex justify-between text-[11px] text-[#5C7457] pt-1">
                    <span>معادل تتر (USDT):</span>
                    <strong className="text-[#2D3A27]">
                      {((cartFinalTotal / 10) / cryptoRates.usdtToman).toFixed(2)} USDT
                    </strong>
                  </div>
                )}
              </div>

              {/* Checkout Trigger Button */}
              <button
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                className="w-full py-3 rounded-2xl bg-[#4A6741] hover:bg-[#3D5535] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت نهایی فاکتور و صدور رسید</span>
              </button>

              {/* Post-sale modal notification & omnichannel share banner */}
              {showCheckoutSuccess && (
                <div className="p-3.5 bg-[#D4E0CD] border border-[#4A6741]/40 rounded-2xl text-xs space-y-2">
                  <div className="font-extrabold text-[#2D3A27] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#4A6741]" />
                    <span>فاکتور #{lastInvoiceNumber} با موفقیت ثبت شد!</span>
                  </div>
                  <p className="text-[11px] text-[#2D3A27]">
                    ارسال آنی رسید دیجیتال و راهنمای نگهداری برای سرپرست:
                  </p>
                  <button
                    onClick={openShareInvoice}
                    className="w-full py-2 bg-[#4A6741] hover:bg-[#3D5535] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>ارسال در بله / تلگرام / واتساپ</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: SWEEP VIDEO BARCODE & PURCHASE INVOICING                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'video_scanner' && (
        <div className="space-y-5">
          {/* Sweep Video Instructions & Recorder */}
          <div className="bg-white rounded-[28px] p-5 border border-[#E6E9DF] shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#2D3A27] flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#4A6741]" />
                  <span>اسکن زنجیره‌ای با یک برداشت ویدیویی (Sweep Video Scanner)</span>
                </h3>
                <p className="text-xs text-[#5C7457] max-w-2xl leading-relaxed">
                  کالاهای جدید فاکتور خرید را روی میز بچینید (بارکدها به سمت بالا). با دوربین موبایل یا وب‌کم از بالای سر اجناس عبور کنید. هوش مصنوعی به ازای هر کالا فریم شفاف استخراج کرده و اطلاعات قیمت دیجی‌کالا، ترب و اسنپ‌فود را بازیابی می‌کند.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleStartSweepScan}
                  disabled={isScanningVideo}
                  className="px-5 py-3 rounded-2xl bg-[#4A6741] hover:bg-[#3D5535] disabled:bg-slate-300 text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  {isScanningVideo ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال آنالیز فریم‌ها ({scanProgress}٪)...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>اسکن ویدیوی جدید فاکتور خرید</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scan Progress Bar */}
            {isScanningVideo && (
              <div className="mt-4 p-3 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl">
                <div className="flex items-center justify-between text-xs font-bold text-[#2D3A27] mb-1.5">
                  <span>پردازش جریان فریم‌های ویدیو و رمزگشایی بارکدها...</span>
                  <span>{scanProgress}٪</span>
                </div>
                <div className="w-full h-2 bg-[#E6E9DF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4A6741] transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Side-by-Side Review Desk with Zoom Inspection */}
          <div className="bg-white rounded-[28px] p-5 border border-[#E6E9DF] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E9DF] pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-[#2D3A27] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#4A6741]" />
                  <span>میز بازبینی فریم‌های استخراج‌شده و انطباق قیمت بازار</span>
                </h4>
                <p className="text-[11px] text-[#5C7457] mt-0.5">
                  تعداد {currentSession.detectedItems.length} قلم کالا شناسایی گردید. می‌توانید برای مشاهده بارکد روی هر فریم زوم کنید.
                </p>
              </div>

              <button
                onClick={handleConfirmBatchToInventory}
                className="px-4 py-2.5 rounded-xl bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تایید دسته‌جمعی و افزودن به انبار کلینیک</span>
              </button>
            </div>

            {/* Grid of Scanned Keyframes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSession.detectedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl flex flex-col justify-between hover:border-[#4A6741] transition-all space-y-3"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Frame image with Zoom Trigger */}
                    <div className="relative group shrink-0">
                      <img
                        src={item.frameImageUrl}
                        alt={item.productName}
                        className="w-24 h-24 rounded-2xl object-cover border border-[#E6E9DF] bg-white"
                      />
                      <button
                        onClick={() => setZoomedItem(item)}
                        className="absolute inset-0 bg-[#2D3A27]/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D4E0CD] text-[#2D3A27]">
                          فریم #{item.frameIndex} • اطمینان {(item.confidenceScore * 100).toFixed(0)}٪
                        </span>
                        <span className="text-xs font-bold text-[#4A6741]">
                          تعداد فاکتور: {item.quantity} عدد
                        </span>
                      </div>
                      <h5 className="text-xs font-extrabold text-[#2D3A27] mt-1 line-clamp-2">
                        {item.productName}
                      </h5>
                      <div className="text-[11px] text-[#5C7457] font-mono mt-0.5">
                        بارکد: {item.detectedBarcode}
                      </div>
                    </div>
                  </div>

                  {/* Market Comparison Row */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-white border border-[#E6E9DF] rounded-xl text-[11px]">
                    <div>
                      <span className="text-[10px] text-[#5C7457] block">دیجی‌کالا:</span>
                      <strong className="text-[#2D3A27]">
                        {item.marketComparison.digikalaPrice.toLocaleString('fa-IR')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#5C7457] block">ترب (حداقل):</span>
                      <strong className="text-[#2D3A27]">
                        {item.marketComparison.torobMinPrice.toLocaleString('fa-IR')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#5C7457] block">فروش پیشنهادی:</span>
                      <strong className="text-[#4A6741]">
                        {item.suggestedSellingPrice.toLocaleString('fa-IR')} ریال
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zoom Lightbox Modal */}
          {zoomedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A27]/80 backdrop-blur-xs">
              <div className="bg-white rounded-[28px] max-w-xl w-full p-5 border border-[#E6E9DF] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6E9DF] pb-3">
                  <h4 className="text-sm font-extrabold text-[#2D3A27]">
                    بزرگنمایی فریم استخراج‌شده (بررسی بارکد)
                  </h4>
                  <button
                    onClick={() => setZoomedItem(null)}
                    className="p-1 text-[#5C7457] hover:text-[#2D3A27] rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <img
                  src={zoomedItem.frameImageUrl}
                  alt="Zoomed barcode"
                  className="w-full h-80 object-contain rounded-2xl bg-[#F7F8F3] border border-[#E6E9DF]"
                />
                <div className="text-xs text-[#5C7457]">
                  بارکد تشخیص داده شده: <strong className="font-mono text-[#2D3A27]">{zoomedItem.detectedBarcode}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: SHAPARAK & CRYPTO GATEWAYS                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'gateways' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Iranian Shaparak Gateways */}
          <div className="bg-white rounded-[28px] p-5 border border-[#E6E9DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E9DF] pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#4A6741]" />
                <h3 className="text-sm font-extrabold text-[#2D3A27]">
                  درگاه‌های ریالی شاپرک (IP-POS و آنلاین)
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D4E0CD] text-[#2D3A27]">
                به‌پرداخت ملت • سامان • زرین‌پال
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-[#2D3A27]">پروتکل دستگاه پوز LAN / IP-POS</h5>
                  <p className="text-[11px] text-[#5C7457] mt-0.5">
                    اتصال مستقیم مانیتور صندوق به کارتخوان فیزیکی کلینیک
                  </p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>

              <div className="p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl text-xs space-y-2">
                <div className="font-bold text-[#2D3A27]">راهنمای فنی اتصال شاپرک در محیط لینوکس VPS:</div>
                <p className="text-[#5C7457] leading-relaxed text-[11px]">
                  برای اتصال به درگاه‌های IPG رسمی شاپرک (بانک ملت/سامان)، ترمینال آی‌دی (Terminal ID) و مرچنت کد را در فایل <code>.env</code> سرور پروداکشن تنظیم نمایید. وب‌هوک تاییدیه تراکنش (Callback URL) به صورت خودکار به پورت 3000 متصل است.
                </p>
              </div>
            </div>
          </div>

          {/* Cryptocurrency Multi-Market Live Gateway */}
          <div className="bg-white rounded-[28px] p-5 border border-[#E6E9DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E9DF] pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#4A6741]" />
                <h3 className="text-sm font-extrabold text-[#2D3A27]">
                  درگاه رمزارز زنده (USDT • TON • TRX)
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#5C7457]">
                <Clock className="w-3.5 h-3.5 text-[#4A6741]" />
                <span>قفل نرخ: {Math.floor(cryptoTimeLeft / 60)}:{('0' + (cryptoTimeLeft % 60)).slice(-2)}</span>
              </div>
            </div>

            {/* Live Ticker Strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl">
                <span className="text-[10px] text-[#5C7457] block">تتر (USDT)</span>
                <strong className="text-xs font-bold text-[#2D3A27]">
                  {cryptoRates.usdtToman.toLocaleString('fa-IR')} ت
                </strong>
              </div>
              <div className="p-3 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl">
                <span className="text-[10px] text-[#5C7457] block">تون‌کوین (TON)</span>
                <strong className="text-xs font-bold text-[#2D3A27]">
                  {cryptoRates.tonToman.toLocaleString('fa-IR')} ت
                </strong>
              </div>
              <div className="p-3 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl">
                <span className="text-[10px] text-[#5C7457] block">ترون (TRX)</span>
                <strong className="text-xs font-bold text-[#2D3A27]">
                  {cryptoRates.trxToman.toLocaleString('fa-IR')} ت
                </strong>
              </div>
            </div>

            {/* Wallet QR Display */}
            <div className="p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl flex items-center gap-4">
              <div className="w-20 h-20 bg-white p-2 rounded-2xl border border-[#E6E9DF] flex items-center justify-center shrink-0">
                <QrCode className="w-16 h-16 text-[#2D3A27]" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] font-bold text-[#5C7457] block">آدرس کیف‌پول اختصاصی کلینیک:</span>
                <div className="font-mono text-[11px] text-[#2D3A27] truncate bg-white p-2 rounded-xl border border-[#E6E9DF]">
                  UQDh7a9K8...x9Qp2TON_VET
                </div>
                <span className="text-[10px] text-emerald-700 font-bold block">
                  شبکه TRC20 و TON فعال است (تسویه آنی)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: LOYALTY CLUB & LUCKY SPIN WHEEL                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'loyalty_club' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Members Tier List (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-[28px] p-5 border border-[#E6E9DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E9DF] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#4A6741]" />
                <h3 className="text-sm font-extrabold text-[#2D3A27]">اعضای باشگاه وفاداری و سطوح تخفیف</h3>
              </div>
              <span className="text-xs font-bold text-[#5C7457]">
                امتیاز هر ۱۰۰ هزار تومان = ۱۰ امتیاز
              </span>
            </div>

            <div className="space-y-3">
              {loyaltyMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#D4E0CD] text-[#2D3A27] flex items-center justify-center font-extrabold text-sm">
                      {member.tier === 'vip' ? 'VIP' : member.tier === 'gold' ? 'G' : 'S'}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#2D3A27]">{member.ownerName}</h4>
                      <p className="text-[11px] text-[#5C7457]">
                        پت: {member.petName} • خریدها: {member.totalPurchasesCount} بار
                      </p>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-xs font-extrabold text-[#4A6741] block">
                      {member.points} امتیاز
                    </span>
                    <span className="text-[10px] text-[#5C7457]">
                      {member.discountPerkPercent}٪ تخفیف دائمی
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Smart Refill Calculator */}
            <div className="mt-4 p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#2D3A27]">
                <Calculator className="w-4 h-4 text-[#4A6741]" />
                <span>محاسبه‌گر هوشمند روزهای اتمام غذای خشک و یادآور خودکار</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-[#5C7457] block mb-1">وزن پت (کیلوگرم):</label>
                  <input
                    type="number"
                    value={calculatorPetWeight}
                    onChange={(e) => setCalculatorPetWeight(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#E6E9DF] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#5C7457] block mb-1">وزن بسته غذا (گرم):</label>
                  <input
                    type="number"
                    value={calculatorBagWeightGram}
                    onChange={(e) => setCalculatorBagWeightGram(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#E6E9DF] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-[#D4E0CD]/50 rounded-xl text-xs font-bold text-[#2D3A27] flex items-center justify-between">
                <span>مدت مصرف تخمینی این بسته:</span>
                <span className="text-[#4A6741] text-sm font-extrabold">{calculatedDays} روز</span>
              </div>
            </div>
          </div>

          {/* Interactive Lucky Spin Wheel (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-[28px] p-5 border border-[#E6E9DF] shadow-xs space-y-4 flex flex-col items-center justify-between text-center">
            <div className="w-full border-b border-[#E6E9DF] pb-3">
              <h3 className="text-sm font-extrabold text-[#2D3A27] flex items-center justify-center gap-2">
                <Gift className="w-5 h-5 text-[#4A6741]" />
                <span>گردونه شانس و جوایز آنی خرید</span>
              </h3>
              <p className="text-[11px] text-[#5C7457] mt-0.5">
                مشتری پس از خرید می‌تواند گردونه را بچرخاند
              </p>
            </div>

            {/* Visual Spin Wheel */}
            <div className="relative my-4">
              <div
                className="w-52 h-52 rounded-full border-4 border-[#4A6741] flex items-center justify-center shadow-md transition-transform duration-3000 ease-out relative overflow-hidden"
                style={{
                  transform: `rotate(${spinRotation}deg)`,
                  background: 'conic-gradient(#4A6741 0deg 72deg, #5C7457 72deg 144deg, #D4E0CD 144deg 216deg, #2D3A27 216deg 288deg, #8CA685 288deg 360deg)',
                }}
              >
                <div className="w-16 h-16 rounded-full bg-white border-2 border-[#E6E9DF] flex items-center justify-center font-extrabold text-xs text-[#2D3A27] shadow-inner">
                  مهرگان
                </div>
              </div>
              {/* Pointer */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-6 bg-rose-600 rounded-b-md shadow-xs"></div>
            </div>

            {/* Spin Trigger */}
            <button
              onClick={handleSpinWheel}
              disabled={isSpinning}
              className="w-full py-3 rounded-2xl bg-[#4A6741] hover:bg-[#3D5535] disabled:bg-slate-300 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              {isSpinning ? 'گردونه در حال چرخش...' : 'چرخاندن گردونه جوایز'}
            </button>

            {wonReward && (
              <div className="w-full p-3 bg-[#D4E0CD] border border-[#4A6741]/40 rounded-2xl text-xs space-y-1">
                <span className="font-extrabold text-[#2D3A27] block">🎉 تبریک! جایزه برنده شده:</span>
                <strong className="text-sm text-[#4A6741]">{wonReward.title}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: ADAPTIVE SELF-LEARNING MARKETING AGENT                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'ai_marketing_agent' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Daily Drafts (8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-[28px] p-5 border border-[#E6E9DF] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E9DF] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#4A6741]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#2D3A27]">
                    پیشنهادات هوشمند شخصی‌سازی‌شده روزانه (ایجنت خودآموز)
                  </h3>
                  <p className="text-[11px] text-[#5C7457]">
                    انطباق هوشمند سوابق بالینی و سن پت با موجودی پت‌شاپ
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {aiAgentDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#2D3A27]">
                        {draft.ownerName} (سرپرست {draft.petName} - {draft.species})
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#D4E0CD] text-[#2D3A27] font-bold">
                        لحن: {draft.tone === 'caring' ? 'مراقبتی و صمیمی' : 'علمی و بالینی'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        draft.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {draft.status === 'approved' ? 'تایید و ارسال شد' : 'در انتظار بررسی اپراتور'}
                    </span>
                  </div>

                  {/* AI Medical Reasoning */}
                  <div className="p-2.5 bg-white border border-[#E6E9DF] rounded-xl text-[11px] text-[#5C7457] leading-relaxed">
                    <strong className="text-[#2D3A27] block mb-0.5">استدلال هوش مصنوعی:</strong>
                    {draft.reasoning}
                  </div>

                  {/* Draft Message Body */}
                  <div className="p-3 bg-white border border-[#E6E9DF] rounded-xl text-xs text-[#2D3A27] leading-relaxed whitespace-pre-wrap">
                    {draft.generatedMessage}
                  </div>

                  {/* Actions */}
                  {draft.status === 'pending_operator' && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleApproveDraft(draft)}
                        className="px-4 py-2 rounded-xl bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تایید و یادگیری الگوی پیام</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Self-Learning Rules Log (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-[28px] p-5 border border-[#E6E9DF] shadow-xs space-y-4">
            <div className="border-b border-[#E6E9DF] pb-3">
              <h3 className="text-sm font-extrabold text-[#2D3A27] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#4A6741]" />
                <span>قوانین و تجربیات آموخته‌شده ایجنت</span>
              </h3>
              <p className="text-[11px] text-[#5C7457] mt-0.5">
                تغییرات و تاییدهای اپراتور به صورت قانون ذخیره می‌شوند
              </p>
            </div>

            <div className="space-y-3">
              {learningRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-[#2D3A27] font-bold">{rule.ruleTitle}</strong>
                    <span className="text-[10px] font-bold text-[#4A6741]">
                      وزن: {rule.weight}٪
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C7457] leading-relaxed">{rule.description}</p>
                  <div className="text-[10px] text-[#5C7457] flex justify-between pt-1 border-t border-[#E6E9DF]">
                    <span>منبع: {rule.learnedFromAction}</span>
                    <span>{rule.appliedCount} بار اجرا</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Omnichannel Share Modal Instance */}
      <OmnichannelShareModal
        isOpen={shareModalPayload.isOpen}
        onClose={() => setShareModalPayload((prev) => ({ ...prev, isOpen: false }))}
        payload={shareModalPayload.payload}
      />
    </div>
  );
};
