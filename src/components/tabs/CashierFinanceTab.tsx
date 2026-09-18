import React, { useState } from 'react';
import {
  ReceiptText,
  CreditCard,
  Printer,
  CheckCircle2,
  DollarSign,
  Plus,
  Search,
  Filter,
  Eye,
  X,
  Sparkles,
  TrendingUp,
  Share2,
  Trash2,
  Database,
} from 'lucide-react';
import { Invoice, OmnichannelMessagePayload } from '../../types';
import { OmnichannelShareModal } from '../OmnichannelShareModal';

interface CashierFinanceTabProps {
  invoices: Invoice[];
  onUpdateInvoicePayment: (invoiceId: string, method: 'pos' | 'cash' | 'card_transfer', notes?: string) => void;
  onPrintInvoice: (invoice: Invoice, format: 'a4' | 'thermal') => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}

export const CashierFinanceTab: React.FC<CashierFinanceTabProps> = ({
  invoices,
  onUpdateInvoicePayment,
  onPrintInvoice,
  onDeleteInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);

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

  const handleOpenShareInvoice = (inv: Invoice) => {
    const itemsText = inv.items
      .map((item, idx) => `▫️ ${idx + 1}. ${item.title} (${item.quantity} عدد) - ${item.total.toLocaleString('fa-IR')} تومان`)
      .join('\n');

    setShareModalPayload({
      isOpen: true,
      payload: {
        recipientName: inv.ownerName || 'سرپرست گرامی',
        recipientPhone: '',
        platform: 'bale',
        type: 'invoice',
        title: `فاکتور فروش شماره ${inv.invoiceNumber}`,
        formattedBodyText: `🐾 **کلینیک دامپزشکی و خدمات مهرگان** 🐾
🧾 **صورتحساب رسمی:** ${inv.invoiceNumber}
📅 **تاریخ صدور:** ${inv.date}
👤 **سرپرست:** ${inv.ownerName} (پت: ${inv.petName})

📋 **اقلام و خدمات صورتحساب:**
${itemsText}

💵 **جمع کل:** ${inv.subtotal.toLocaleString('fa-IR')} تومان
🎁 **تخفیف:** ${inv.discount.toLocaleString('fa-IR')} تومان
💳 **مبلغ قابل پرداخت:** ${inv.finalTotal.toLocaleString('fa-IR')} تومان
📊 **وضعیت:** ${inv.paymentStatus === 'paid' ? 'پرداخت شده و تسویه کامل' : 'در انتظار پرداخت'}

از اعتماد و همراهی شما سپاسگزاریم 🌸`,
      },
    });
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
    String(inv.invoiceNumber ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(inv.petName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(inv.ownerName ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaidRevenue = invoices
    .filter((i) => i.paymentStatus === 'paid')
    .reduce((acc, curr) => acc + curr.finalTotal, 0);

  const totalPendingRevenue = invoices
    .filter((i) => i.paymentStatus === 'pending')
    .reduce((acc, curr) => acc + curr.finalTotal, 0);

  return (
    <div id="tab-cashier-finance" className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Banner with Database Connection status */}
      <div className="bg-white p-5 rounded-[28px] border border-[#E6E9DF] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#4A6741]/10 flex items-center justify-center text-[#4A6741]">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#2D3A27]">صندوق مالی، فاکتورها و دستگاه کارتخوان POS</h2>
            <p className="text-xs text-[#5C7457]">
              مدیریت تراکنش‌ها، فاکتورهای بالینی و پت‌شاپ متصل به پایگاه‌داده سرور
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#F7F8F3] px-3.5 py-1.5 rounded-full border border-[#D4E0CD]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-[#4A6741]" />
          <span className="text-[11px] font-bold text-[#2D3A27]">دیتابیس مالی متصل و پایدار</span>
        </div>
      </div>

      {/* Header & Financial Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-[#4A6741] text-white p-5 rounded-[28px] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#D4E0CD] font-bold">مجموع دریافتی‌های امروز</span>
            <div className="text-2xl font-black mt-1">
              {totalPaidRevenue.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <div className="text-[11px] text-[#D4E0CD] mt-1">تسویه شده با کارتخوان و نقد</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="bg-[#5C7457] text-white p-5 rounded-[28px] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#D4E0CD] font-bold">مطالبات و فاکتورهای معوق</span>
            <div className="text-2xl font-black mt-1">
              {totalPendingRevenue.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <div className="text-[11px] text-[#D4E0CD] mt-1">در انتظار پرداخت صندوق</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="bg-[#2D3A27] text-white p-5 rounded-[28px] shadow-sm flex items-center justify-between border border-[#4A6741]">
          <div>
            <span className="text-xs text-[#D4E0CD] font-bold">دستگاه کارتخوان (POS) متصل</span>
            <div className="text-lg font-black mt-1 text-[#D4E0CD]">بانک ملت / سامان IP-POS</div>
            <div className="text-[11px] text-[#D4E0CD]/80 mt-1">پورت سریال LAN: 192.168.1.180</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#D4E0CD] flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-[28px] border border-[#E6E9DF] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5C7457] absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس شماره فاکتور، نام بیمار، یا سرپرست حیوان..."
            className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl pr-10 pl-4 py-2.5 text-xs text-[#2D3A27] placeholder-[#5C7457]/70 focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#F7F8F3] p-1 rounded-2xl border border-[#E6E9DF] text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-[#4A6741] text-white shadow-xs' : 'text-[#5C7457] hover:text-[#2D3A27]'
              }`}
            >
              همه فاکتورها
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'paid' ? 'bg-[#4A6741] text-white shadow-xs' : 'text-[#5C7457] hover:text-[#2D3A27]'
              }`}
            >
              تسویه شده
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'pending' ? 'bg-[#4A6741] text-white shadow-xs' : 'text-[#5C7457] hover:text-[#2D3A27]'
              }`}
            >
              در انتظار تسویه
            </button>
          </div>
        </div>

      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-[28px] border border-[#E6E9DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#F7F8F3] text-[#5C7457] font-bold border-b border-[#E6E9DF]">
              <tr>
                <th className="p-4">شماره فاکتور</th>
            <th className="p-4">بیمار و سرپرست</th>
                <th className="p-4">اقلام و خدمات</th>
                <th className="p-4">مبلغ نهایی</th>
                <th className="p-4">وضعیت تسویه</th>
                <th className="p-4">روش پرداخت</th>
                <th className="p-4 text-left">عملیات و چاپ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E9DF] font-medium text-[#2D3A27]">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F7F8F3] transition-colors">
                  <td className="p-4 font-mono font-bold text-[#2D3A27]">{inv.invoiceNumber}</td>
                  <td className="p-4">
                    <div className="font-bold text-[#2D3A27]">{inv.petName}</div>
                    <div className="text-[11px] text-[#5C7457]">{inv.ownerName}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-[#2D3A27] font-semibold">{inv.items[0]?.title}</div>
                    {inv.items.length > 1 && (
                      <span className="text-[10px] text-[#5C7457]">+{inv.items.length - 1} قلم دیگر</span>
                    )}
                  </td>
                  <td className="p-4 font-mono font-black text-[#2D3A27] text-sm">
                    {inv.finalTotal.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-[#5C7457]">تومان</span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        inv.paymentStatus === 'paid'
                          ? 'bg-[#D4E0CD] text-[#2D3A27]'
                          : 'bg-amber-100 text-amber-900 font-black'
                      }`}
                    >
                      {inv.paymentStatus === 'paid' ? 'تسویه شده' : 'در انتظار پرداخت'}
                    </span>
                  </td>
                  <td className="p-4 text-[#5C7457]">
                    {inv.paymentMethod === 'pos' && 'کارتخوان (POS)'}
                    {inv.paymentMethod === 'cash' && 'نقدی'}
                    {inv.paymentMethod === 'card_transfer' && 'کارت به کارت'}
                  </td>
                  <td className="p-4 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.paymentStatus === 'pending' && (
                        <button
                          onClick={() => onUpdateInvoicePayment(inv.id, 'pos')}
                          className="bg-[#4A6741] hover:bg-[#3D5535] text-white px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>تسویه با POS</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenShareInvoice(inv)}
                        className="p-2 bg-[#D4E0CD] hover:bg-[#8CA685]/30 text-[#2D3A27] rounded-xl transition-colors cursor-pointer border border-[#4A6741]/30"
                        title="ارسال فاکتور در بله، تلگرام و واتساپ"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#4A6741]" />
                      </button>

                      <button
                        onClick={() => onPrintInvoice(inv, 'thermal')}
                        className="p-2 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] rounded-xl transition-colors cursor-pointer border border-[#E6E9DF]"
                        title="چاپ فیش حرارتی ۸۰ میلی‌متری"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setSelectedInvoiceForModal(inv)}
                        className="p-2 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] rounded-xl transition-colors cursor-pointer border border-[#E6E9DF]"
                        title="مشاهده جزئیات فاکتور"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteInvoice && (
                        <button
                          onClick={() => {
                            if (window.confirm(`آیا از حذف دائم فاکتور ${inv.invoiceNumber} از پایگاه‌داده سرور اطمینان دارید؟`)) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer border border-rose-200"
                          title="حذف فاکتور از سرور"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A27]/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-[#2D3A27] w-full max-w-lg rounded-[32px] shadow-2xl border border-[#E6E9DF] overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
              <div>
                <h3 className="text-base font-extrabold text-[#2D3A27]">
                  فاکتور رسمی {selectedInvoiceForModal.invoiceNumber}
                </h3>
                <p className="text-xs text-[#5C7457]">تاریخ: {selectedInvoiceForModal.date}</p>
              </div>
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="p-1.5 text-[#5C7457] hover:text-[#2D3A27] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs bg-white">
              <div className="flex justify-between pb-3 border-b border-[#E6E9DF]">
                <div>
                  <span className="text-[#5C7457]">مشخصات بیمار:</span>
                  <div className="font-bold text-[#2D3A27] text-sm mt-0.5">{selectedInvoiceForModal.petName}</div>
                </div>
                <div className="text-left">
                  <span className="text-[#5C7457]">مشخصات خریدار / سرپرست:</span>
                  <div className="font-bold text-[#2D3A27] text-sm mt-0.5">{selectedInvoiceForModal.ownerName}</div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="font-bold text-[#2D3A27]">اقلام و خدمات صورتحساب:</span>
                <div className="space-y-1.5">
                  {selectedInvoiceForModal.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-[#F7F8F3] rounded-xl border border-[#E6E9DF]">
                      <div>
                        <div className="font-bold text-[#2D3A27]">{item.title}</div>
                        <div className="text-[10px] text-[#5C7457]">تعداد: {item.quantity}</div>
                      </div>
                      <div className="font-mono font-bold text-[#2D3A27]">
                        {item.total.toLocaleString('fa-IR')} تومان
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="pt-3 border-t border-[#E6E9DF] space-y-1.5 font-medium">
                <div className="flex justify-between text-[#5C7457]">
                  <span>جمع کل:</span>
                  <span className="font-mono">{selectedInvoiceForModal.subtotal.toLocaleString('fa-IR')} تومان</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>تخفیف:</span>
                  <span className="font-mono">-{selectedInvoiceForModal.discount.toLocaleString('fa-IR')} تومان</span>
                </div>
                <div className="flex justify-between text-[#2D3A27] font-black text-sm pt-2 border-t border-[#E6E9DF]">
                  <span>مبلغ قابل پرداخت نهایی:</span>
                  <span className="font-mono text-[#4A6741]">
                    {selectedInvoiceForModal.finalTotal.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>

              {selectedInvoiceForModal.paymentStatus === 'pending' && (
                <div className="pt-3 border-t border-[#E6E9DF] bg-amber-50/50 p-3 rounded-2xl">
                  <div className="text-xs font-bold text-[#2D3A27] mb-2 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#4A6741]" />
                    <span>تسویه و ثبت پرداخت در دیتابیس:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        onUpdateInvoicePayment(selectedInvoiceForModal.id, 'pos');
                        setSelectedInvoiceForModal(null);
                      }}
                      className="bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>کارتخوان POS</span>
                    </button>
                    <button
                      onClick={() => {
                        onUpdateInvoicePayment(selectedInvoiceForModal.id, 'cash');
                        setSelectedInvoiceForModal(null);
                      }}
                      className="bg-[#5C7457] hover:bg-[#4A6741] text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <DollarSign className="w-3 h-3" />
                      <span>نقدی</span>
                    </button>
                    <button
                      onClick={() => {
                        onUpdateInvoicePayment(selectedInvoiceForModal.id, 'card_transfer');
                        setSelectedInvoiceForModal(null);
                      }}
                      className="bg-[#2D3A27] hover:bg-black text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>کارت به کارت</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#E6E9DF] flex items-center justify-between gap-2">
                {onDeleteInvoice ? (
                  <button
                    onClick={() => {
                      if (window.confirm(`آیا از حذف دائم فاکتور ${selectedInvoiceForModal.invoiceNumber} اطمینان دارید؟`)) {
                        onDeleteInvoice(selectedInvoiceForModal.id);
                        setSelectedInvoiceForModal(null);
                      }
                    }}
                    className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold flex items-center gap-1.5 border border-rose-200 cursor-pointer text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>حذف فاکتور</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenShareInvoice(selectedInvoiceForModal)}
                    className="px-3.5 py-2 bg-[#D4E0CD] hover:bg-[#8CA685]/40 text-[#2D3A27] rounded-xl font-bold flex items-center gap-1.5 border border-[#4A6741]/30 cursor-pointer text-xs"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#4A6741]" />
                    <span>ارسال پیام‌رسان</span>
                  </button>
                  <button
                    onClick={() => onPrintInvoice(selectedInvoiceForModal, 'a4')}
                    className="px-3.5 py-2 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] rounded-xl font-bold flex items-center gap-1.5 border border-[#E6E9DF] cursor-pointer text-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#4A6741]" />
                    <span>چاپ A4</span>
                  </button>
                  <button
                    onClick={() => onPrintInvoice(selectedInvoiceForModal, 'thermal')}
                    className="px-3.5 py-2 bg-[#4A6741] hover:bg-[#3D5535] text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer text-xs"
                  >
                    <ReceiptText className="w-3.5 h-3.5" />
                    <span>چاپ حرارتی</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Omnichannel Share Modal */}
      <OmnichannelShareModal
        isOpen={shareModalPayload.isOpen}
        onClose={() => setShareModalPayload((prev) => ({ ...prev, isOpen: false }))}
        payload={shareModalPayload.payload}
      />

    </div>
  );
};
