import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  X,
  ScanBarcode,
  Search,
  ShoppingCart,
  User,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Coins,
  Package,
  Clock,
  Sparkles,
  Phone,
  Layers,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building,
  Info,
  ExternalLink,
  MessageSquare,
  BadgePercent,
  Receipt,
  FileCheck,
  Database,
} from 'lucide-react';
import {
  PetShopProduct,
  PetShopSupplier,
  StaffPurchasePrivilege,
  Pet,
  Owner,
  PetShopCartItem,
} from '../../types';

interface MdiTabItem {
  id: string;
  type: 'customer_sale' | 'supplier_purchase' | 'inventory_explorer';
  title: string;
  customerName?: string;
  supplierId?: string;
  items: PetShopCartItem[];
  staffBuyerId?: string;
  isStaffPurchase?: boolean;
}

interface PetShopMdiTabProps {
  products: PetShopProduct[];
  onUpdateProducts: (products: PetShopProduct[]) => void;
  suppliers: PetShopSupplier[];
  onUpdateSuppliers: (suppliers: PetShopSupplier[]) => void;
  staffPrivileges: StaffPurchasePrivilege[];
  onUpdateStaffPrivileges: (privileges: StaffPurchasePrivilege[]) => void;
  pets: Pet[];
  owners: Owner[];
}

export const PetShopMdiTab: React.FC<PetShopMdiTabProps> = ({
  products,
  onUpdateProducts,
  suppliers,
  onUpdateSuppliers,
  staffPrivileges,
  onUpdateStaffPrivileges,
  pets,
  owners,
}) => {
  // MDI Open Tabs State
  const [mdiTabs, setMdiTabs] = useState<MdiTabItem[]>([
    {
      id: 'tab-sale-1',
      type: 'customer_sale',
      title: 'فروش: مهندس رضایی (تامی)',
      customerName: 'مهندس رضایی',
      items: [
        {
          product: products[0] || {
            id: 'p-1',
            title: 'غذای خشک سگ رویال کنین مینی ادالت ۸۰۰ گرم',
            category: 'dry_food',
            priceToman: 480000,
            stock: 12,
            targetSpecies: 'dog',
            barcode: '6260123456789',
            brand: 'Royal Canin',
            rating: 4.9,
          },
          quantity: 1,
        },
      ],
      isStaffPurchase: false,
    },
    {
      id: 'tab-purchase-1',
      type: 'supplier_purchase',
      title: 'تامین: بازرگانی آریا پت پارس',
      supplierId: 'sup-1',
      items: [],
    },
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('tab-sale-1');
  const activeTab = mdiTabs.find((t) => t.id === activeTabId) || mdiTabs[0];

  // Smart Barcode Scanner states
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [scannedResultModal, setScannedResultModal] = useState<{
    product: PetShopProduct;
    inStock: boolean;
    previousSupplier?: PetShopSupplier;
  } | null>(null);

  // Search & Filter
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Channel price lookup search
  const [channelSearchTerm, setChannelSearchTerm] = useState('رویال کنین');

  // Checkout toast
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);

  // New Tab creation
  const handleCreateNewTab = (type: 'customer_sale' | 'supplier_purchase') => {
    const newId = `tab-${Date.now()}`;
    const newTab: MdiTabItem = {
      id: newId,
      type,
      title: type === 'customer_sale' ? `فاکتور فروش مشتری جدید #${mdiTabs.length + 1}` : 'سفارش خرید از تامین‌کننده',
      items: [],
      isStaffPurchase: false,
    };
    setMdiTabs([...mdiTabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mdiTabs.length === 1) return; // Keep at least one tab
    const nextTabs = mdiTabs.filter((t) => t.id !== id);
    setMdiTabs(nextTabs);
    if (activeTabId === id) {
      setActiveTabId(nextTabs[0].id);
    }
  };

  // Add product to active cart
  const handleAddToCart = (product: PetShopProduct) => {
    if (!activeTab) return;
    const existingIndex = activeTab.items.findIndex((i) => i.product.id === product.id);
    let updatedItems = [...activeTab.items];
    if (existingIndex >= 0) {
      updatedItems[existingIndex].quantity += 1;
    } else {
      updatedItems.push({ product, quantity: 1 });
    }

    const updatedTabs = mdiTabs.map((t) => (t.id === activeTab.id ? { ...t, items: updatedItems } : t));
    setMdiTabs(updatedTabs);
  };

  const handleUpdateItemQuantity = (productId: string, delta: number) => {
    if (!activeTab) return;
    const updatedItems = activeTab.items
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as PetShopCartItem[];

    const updatedTabs = mdiTabs.map((t) => (t.id === activeTab.id ? { ...t, items: updatedItems } : t));
    setMdiTabs(updatedTabs);
  };

  // Smart Barcode Search Handler
  const handleScanBarcode = () => {
    if (!barcodeQuery.trim()) return;
    const foundProduct = products.find(
      (p) => p.barcode === barcodeQuery.trim() || p.title.toLowerCase().includes(barcodeQuery.toLowerCase())
    );

    if (foundProduct) {
      const inStock = foundProduct.stock > 0;
      const prevSupplier = suppliers[0]; // Previous supplier mock
      setScannedResultModal({
        product: foundProduct,
        inStock,
        previousSupplier: inStock ? undefined : prevSupplier,
      });
    } else {
      // Not found mock product
      const newProd: PetShopProduct = {
        id: `p-new-${Date.now()}`,
        title: `محصول بارکد ${barcodeQuery}`,
        category: 'dry_food',
        sellingPrice: 350000,
        purchasePrice: 280000,
        priceToman: 350000,
        stockQuantity: 0,
        stock: 0,
        minStockAlert: 5,
        packageWeightGram: 500,
        imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300&auto=format&fit=crop&q=80',
        targetSpecies: 'سگ',
        barcode: barcodeQuery,
        brand: 'سایر',
        rating: 5.0,
      };
      setScannedResultModal({
        product: newProd,
        inStock: false,
        previousSupplier: suppliers[0],
      });
    }
  };

  // Calculate totals
  const rawSubtotal = activeTab?.items.reduce((sum, item) => sum + item.product.priceToman * item.quantity, 0) || 0;

  // Staff privilege calculation
  const staffBuyer = staffPrivileges.find((s) => s.staffId === activeTab?.staffBuyerId);
  const discountPercent = activeTab?.isStaffPurchase && staffBuyer ? staffBuyer.discountPercent : 0;
  const discountAmount = (rawSubtotal * discountPercent) / 100;
  const finalPayable = rawSubtotal - discountAmount;

  const handleCheckoutTab = () => {
    // Decrement inventory stock for sold items & persist to server
    const purchasedItems = activeTab?.items || [];
    if (purchasedItems.length > 0) {
      const updatedProducts = products.map((prod) => {
        const purchased = purchasedItems.find((pi) => pi.product.id === prod.id);
        if (purchased) {
          const newStock = Math.max(0, (prod.stock ?? prod.stockQuantity ?? 10) - purchased.quantity);
          return { ...prod, stock: newStock, stockQuantity: newStock };
        }
        return prod;
      });
      onUpdateProducts(updatedProducts);
    }

    setShowCheckoutSuccess(true);
    setTimeout(() => {
      setShowCheckoutSuccess(false);
      // clear active tab items
      const updated = mdiTabs.map((t) => (t.id === activeTab.id ? { ...t, items: [] } : t));
      setMdiTabs(updated);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#2D3A27] text-white p-6 rounded-2xl border border-[#3E4F36] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#4A6741] flex items-center justify-center text-white shadow-inner">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">پت‌شاپ تخصصی مهرگان (MDI Multi-Tab Store)</h1>
              <span className="bg-[#4A6741] text-[#E9EFE6] text-xs px-2.5 py-0.5 rounded-full font-bold">
                رابط کاربری تب‌بندی همزمان فروش و تامین
              </span>
              <div className="flex items-center gap-1.5 bg-black/40 text-[#D4E0CD] border border-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <Database className="w-3 h-3 text-emerald-400" />
                <span>دیتابیس کالاها و انبار متصل</span>
              </div>
            </div>
            <p className="text-xs text-[#A3B899] mt-1">
              اسکنر هوشمند بارکد با شناسایی تامین‌کننده کالاهای ناموجود، پنل خرید پرسنلی با اعتبار و جستجوی کانال‌ها
            </p>
          </div>
        </div>

        {/* Quick New MDI Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCreateNewTab('customer_sale')}
            className="bg-[#4A6741] hover:bg-[#384E31] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            فاکتور فروش جدید
          </button>
          <button
            onClick={() => handleCreateNewTab('supplier_purchase')}
            className="bg-[#1E271A] hover:bg-[#2D3A27] text-[#A3B899] hover:text-white border border-[#4A6741] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Building className="w-4 h-4" />
            سفارش تامین از شرکت
          </button>
        </div>
      </div>

      {/* MDI TABS BAR */}
      <div className="bg-[#1E271A] p-2 rounded-2xl border border-[#384E31] flex items-center gap-2 overflow-x-auto">
        {mdiTabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
              activeTabId === tab.id
                ? 'bg-[#4A6741] text-white shadow-md'
                : 'bg-[#2D3A27] text-[#A3B899] hover:text-white hover:bg-[#384E31]'
            }`}
          >
            {tab.type === 'customer_sale' ? (
              <ShoppingCart className="w-3.5 h-3.5" />
            ) : (
              <Building className="w-3.5 h-3.5" />
            )}
            <span>{tab.title}</span>
            {tab.items.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {tab.items.length}
              </span>
            )}
            {mdiTabs.length > 1 && (
              <button
                onClick={(e) => handleCloseTab(tab.id, e)}
                className="text-white/60 hover:text-white hover:bg-white/10 rounded-md p-0.5 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* SMART BARCODE & CHANNEL SEARCH BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Smart Barcode input */}
        <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-[#E6E9DF] shadow-xs flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#E9EFE6] text-[#4A6741] flex items-center justify-center shrink-0">
            <ScanBarcode className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-[#738A6E]">اسکنر هوشمند بارکد کالا (بارکدخوان / کیبورد)</label>
            <input
              type="text"
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScanBarcode()}
              placeholder="بارکد کالا را اسکن کنید یا نام محصول را تایپ کنید..."
              className="w-full text-xs font-bold text-[#2D3A27] outline-hidden placeholder:text-[#A3B899]"
            />
          </div>
          <button
            onClick={handleScanBarcode}
            className="bg-[#2D3A27] text-white hover:bg-[#1E271A] text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
          >
            جستجو و تحلیل بارکد
          </button>
        </div>

        {/* Channel Price Finder Widget */}
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              استعلام قیمت کانال‌های تلگرام و بله
            </div>
            <p className="text-[11px] text-emerald-800">
              کانال تامین: <span className="font-bold">@AriaPet_Wholesale</span>
            </p>
          </div>
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs"
          >
            مشاهده آخرین لیست <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ACTIVE TAB MAIN CONTENT */}
      {activeTab && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center 2-Cols: Product Catalog / Supplier Catalog */}
          <div className="lg:col-span-2 space-y-4">
            {/* Catalog Filter Header */}
            <div className="bg-white p-4 rounded-2xl border border-[#E6E9DF] shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[#738A6E]" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="جستجو در نام محصول، برند، طعم یا کاربرد..."
                  className="w-full text-xs text-[#2D3A27] outline-hidden placeholder:text-[#A3B899]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {['all', 'dry_food', 'wet_food', 'treats', 'hygiene_care'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#4A6741] text-white'
                        : 'bg-[#F7F8F3] text-[#5C7457] hover:bg-[#E9EFE6]'
                    }`}
                  >
                    {cat === 'all'
                      ? 'همه'
                      : cat === 'dry_food'
                      ? 'غذای خشک'
                      : cat === 'wet_food'
                      ? 'کنسرو و پوچ'
                      : cat === 'treats'
                      ? 'تشویقی'
                      : 'بهداشتی'}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {products
                .filter((p) => (selectedCategory === 'all' ? true : p.category === selectedCategory))
                .filter((p) => p.title.toLowerCase().includes(productSearchQuery.toLowerCase()))
                .map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white p-4 rounded-2xl border border-[#E6E9DF] shadow-xs flex flex-col justify-between space-y-3 hover:border-[#4A6741] transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="bg-[#E9EFE6] text-[#4A6741] font-bold px-2 py-0.5 rounded-md">
                          {prod.brand}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md ${
                            prod.stock > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {prod.stock > 0 ? `موجودی: ${prod.stock}` : 'ناموجود'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[#2D3A27] line-clamp-2 leading-relaxed">
                        {prod.title}
                      </h4>
                      <div className="text-[11px] font-mono font-bold text-emerald-700">
                        {prod.priceToman.toLocaleString('fa-IR')} تومان
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#E6E9DF]">
                      <button
                        onClick={() => handleAddToCart(prod)}
                        className="w-full bg-[#4A6741] group-hover:bg-[#384E31] text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        افزودن به فاکتور
                      </button>

                      {/* Info preview pills */}
                      <div className="flex items-center justify-between text-[10px] text-[#738A6E]">
                        <span title="بارکد ثبت شده">{prod.barcode}</span>
                        <span className="text-amber-700 font-bold">★ {prod.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Right Column: Active Tab Cart & Staff Privileges */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-4">
              {/* Tab Title and Customer Selection */}
              <div className="space-y-2 pb-3 border-b border-[#E6E9DF]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#2D3A27] flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#4A6741]" />
                    اقلام فاکتور ({activeTab.title})
                  </h3>
                  <span className="text-xs font-bold font-mono text-[#4A6741]">
                    {activeTab.items.length} قلم کالا
                  </span>
                </div>

                {activeTab.type === 'customer_sale' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#738A6E] mb-1">صاحب فاکتور / مشتری</label>
                    <select
                      value={activeTab.customerName || ''}
                      onChange={(e) => {
                        const updated = mdiTabs.map((t) =>
                          t.id === activeTab.id ? { ...t, customerName: e.target.value, title: `فروش: ${e.target.value}` } : t
                        );
                        setMdiTabs(updated);
                      }}
                      className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-1.5 text-xs font-bold text-[#2D3A27]"
                    >
                      <option value="مشتری آزاد و حضوری">مشتری آزاد و حضوری</option>
                      {owners.map((o) => (
                        <option key={o.id} value={o.name}>
                          {o.name} ({o.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* STAFF PURCHASE PRIVILEGE TOGGLE */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeTab.isStaffPurchase}
                    onChange={(e) => {
                      const updated = mdiTabs.map((t) =>
                        t.id === activeTab.id
                          ? { ...t, isStaffPurchase: e.target.checked, staffBuyerId: e.target.checked ? staffPrivileges[0].staffId : undefined }
                          : t
                      );
                      setMdiTabs(updated);
                    }}
                    className="rounded-sm text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    <BadgePercent className="w-3.5 h-3.5 text-amber-700" />
                    خرید پرسنلی کلینیک مهرگان (با تخفیف و اعتبار)
                  </span>
                </label>

                {activeTab.isStaffPurchase && (
                  <div className="space-y-2 pt-1">
                    <select
                      value={activeTab.staffBuyerId || ''}
                      onChange={(e) => {
                        const updated = mdiTabs.map((t) =>
                          t.id === activeTab.id ? { ...t, staffBuyerId: e.target.value } : t
                        );
                        setMdiTabs(updated);
                      }}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-950"
                    >
                      {staffPrivileges.map((st) => (
                        <option key={st.staffId} value={st.staffId}>
                          {st.staffName} (تخفیف: {st.discountPercent}٪ | سقف اعتبار: {(st.creditLimitToman / 1000000).toFixed(1)} م تومان)
                        </option>
                      ))}
                    </select>

                    {staffBuyer && (
                      <div className="text-[10px] bg-white p-2 rounded-lg border border-amber-200 text-amber-900 flex justify-between">
                        <span>بدهی جاری: {staffBuyer.currentDebtToman.toLocaleString('fa-IR')} تومان</span>
                        <span>مهلت تسویه: {staffBuyer.gracePeriodDays} روز</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart items list */}
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {activeTab.items.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#738A6E]">
                    سبد خرید خالی است. کالاها را با اسکنر بارکد یا انتخاب از لیست اضافه کنید.
                  </div>
                ) : (
                  activeTab.items.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-[#FAFBF7] rounded-xl border border-[#E6E9DF] flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-[#2D3A27] truncate">{item.product.title}</h5>
                        <div className="text-[11px] text-[#5C7457] font-mono">
                          {item.product.priceToman.toLocaleString('fa-IR')} تومان
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateItemQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#D5DDD0] text-xs font-bold text-[#2D3A27] flex items-center justify-center hover:bg-red-50"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold font-mono px-1">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateItemQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-[#D5DDD0] text-xs font-bold text-[#2D3A27] flex items-center justify-center hover:bg-emerald-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pricing breakdown */}
              {activeTab.items.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[#E6E9DF] text-xs">
                  <div className="flex justify-between text-[#5C7457]">
                    <span>جمع اقلام:</span>
                    <span className="font-mono">{rawSubtotal.toLocaleString('fa-IR')} تومان</span>
                  </div>

                  {activeTab.isStaffPurchase && discountAmount > 0 && (
                    <div className="flex justify-between text-amber-800 font-bold">
                      <span>تخفیف پرسنلی ({discountPercent}٪):</span>
                      <span className="font-mono">- {discountAmount.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-bold text-[#2D3A27] pt-2 border-t border-[#E6E9DF]">
                    <span>مبلغ نهایی قابل پرداخت:</span>
                    <span className="font-mono text-emerald-700">{finalPayable.toLocaleString('fa-IR')} تومان</span>
                  </div>

                  <button
                    onClick={handleCheckoutTab}
                    className="w-full bg-[#4A6741] hover:bg-[#384E31] text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all mt-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    تسویه فاکتور و صدور سند فروش
                  </button>
                </div>
              )}
            </div>

            {/* SUPPLIERS DIRECT CONTACT CARDS */}
            <div className="bg-white p-4 rounded-2xl border border-[#E6E9DF] shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-[#2D3A27] flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#4A6741]" />
                تامین‌کنندگان معتبر و کانال‌های عمده
              </h4>
              <div className="space-y-2 text-xs">
                {suppliers.slice(0, 2).map((sup) => (
                  <div key={sup.id} className="p-2.5 bg-[#F7F8F3] rounded-xl border border-[#E6E9DF] space-y-1">
                    <div className="font-bold text-[#2D3A27] truncate">{sup.companyName}</div>
                    <div className="text-[11px] text-[#5C7457] flex justify-between">
                      <span>رابط: {sup.contactPerson}</span>
                      <span className="font-mono text-emerald-700">{sup.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMART BARCODE RESULT MODAL */}
      {scannedResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FAFBF7] w-full max-w-md rounded-2xl shadow-2xl border border-[#E6E9DF] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E9DF]">
              <div className="flex items-center gap-2">
                <ScanBarcode className="w-5 h-5 text-[#4A6741]" />
                <h3 className="text-sm font-bold text-[#2D3A27]">نتیجه تحلیل هوشمند بارکد</h3>
              </div>
              <button onClick={() => setScannedResultModal(null)} className="text-[#738A6E]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-white rounded-xl border border-[#E6E9DF] space-y-1">
                <h4 className="text-xs font-bold text-[#2D3A27]">{scannedResultModal.product.title}</h4>
                <div className="flex justify-between text-xs text-[#5C7457] pt-1">
                  <span>بارکد: {scannedResultModal.product.barcode}</span>
                  <span
                    className={`font-bold ${
                      scannedResultModal.inStock ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {scannedResultModal.inStock ? `موجود در انبار (${scannedResultModal.product.stock})` : 'ناموجود (۰ عدد)'}
                  </span>
                </div>
              </div>

              {/* IF IN STOCK: Ask who to invoice */}
              {scannedResultModal.inStock ? (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <h5 className="text-xs font-bold text-emerald-950">کالا موجود است؛ برای چه کسی فاکتور شود؟</h5>
                  <button
                    onClick={() => {
                      handleAddToCart(scannedResultModal.product);
                      setScannedResultModal(null);
                    }}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded-xl shadow-xs"
                  >
                    افزودن به تب جاری ({activeTab.title})
                  </button>
                </div>
              ) : (
                /* IF OUT OF STOCK: Show previous supplier and suggest purchase order */
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    موجودی به اتمام رسیده است! قبلاً از چه کسی خریده بودیم؟
                  </div>
                  {scannedResultModal.previousSupplier && (
                    <div className="bg-white p-3 rounded-lg border border-amber-200 text-xs space-y-1">
                      <div className="font-bold text-amber-950">
                        {scannedResultModal.previousSupplier.companyName}
                      </div>
                      <div className="text-[11px] text-amber-800">
                        مسئول فروش: {scannedResultModal.previousSupplier.contactPerson} ({scannedResultModal.previousSupplier.phone})
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      handleCreateNewTab('supplier_purchase');
                      setScannedResultModal(null);
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-xl shadow-xs"
                  >
                    باز کردن تب سفارش خرید از تامین‌کننده
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
