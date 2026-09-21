import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  MapPin,
  Clock,
  UserCheck,
  Stethoscope,
  Image as ImageIcon,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { ClinicProfileConfig, ClinicDoctorBio, ClinicStaffBio } from '../types';

export interface ClinicProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: ClinicProfileConfig;
  onSaveProfile?: (updatedProfile: ClinicProfileConfig) => void;
  // Aliases for compatibility with App.tsx
  clinicProfile?: ClinicProfileConfig;
  onUpdateProfile?: (updatedProfile: ClinicProfileConfig) => void;
}

const getSafeProfile = (p?: Partial<ClinicProfileConfig> | null): ClinicProfileConfig => ({
  clinicName: p?.clinicName || 'کلینیک دامپزشکی حیوانات خانگی مهرگان',
  tagline: p?.tagline || 'مرکز تخصصی جراحی، ارتوپدی، داخلی، پت‌شاپ، دندانپزشکی و گرومینگ حیوانات خانگی',
  phoneNumbers: Array.isArray(p?.phoneNumbers) && p.phoneNumbers.length > 0 ? p.phoneNumbers : ['03136292278', '03136263124', '03136293353'],
  emergencyPhone: p?.emergencyPhone || '09133115509 (اورژانس شبانه‌روزی ۲۴ ساعته)',
  address: p?.address || 'اصفهان، خیابان توحید میانی، حدفاصل مهرداد و شریعتی، کوچه مشکلانی ۲۲',
  postalCode: p?.postalCode || '',
  coordinates: p?.coordinates || { lat: 32.6546, lng: 51.6680 },
  workingHours: p?.workingHours || {
    weekdays: 'شنبه تا چهارشنبه: ۸:۰۰ الی ۲۳:۳۰',
    thursdays: 'پنج‌شنبه‌ها: ۸:۰۰ الی ۲۱:۰۰',
    fridays: 'جمعه‌ها و ایام تعطیل: ۱۰:۰۰ الی ۱۸:۰۰ (اورژانس ۲۴ ساعته)',
  },
  aboutUsText: p?.aboutUsText || 'کلینیک دامپزشکی حیوانات خانگی مهرگان با بهره‌گیری از جراحان برجسته و امکانات فوق پیشرفته تشخیصی.',
  logoUrl: p?.logoUrl || '',
  bannerPhotoUrl: p?.bannerPhotoUrl || '',
  doctors: Array.isArray(p?.doctors) ? p.doctors : [],
  staff: Array.isArray(p?.staff) ? p.staff : [],
  lastUpdatedBy: p?.lastUpdatedBy || 'مدیر کلینیک',
  lastUpdatedAt: p?.lastUpdatedAt || 'امروز',
  licenseNumber: p?.licenseNumber || '',
});

export const ClinicProfileSettingsModal: React.FC<ClinicProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  clinicProfile,
  onUpdateProfile,
}) => {
  const activeProfile = profile || clinicProfile;
  const [formData, setFormData] = useState<ClinicProfileConfig>(() => getSafeProfile(activeProfile));
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'doctors' | 'staff' | 'map'>('general');
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (activeProfile) {
      setFormData(getSafeProfile(activeProfile));
    }
  }, [activeProfile, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = {
      ...formData,
      lastUpdatedAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };
    if (onSaveProfile) onSaveProfile(updated);
    if (onUpdateProfile) onUpdateProfile(updated);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 1200);
  };

  const handleAddPhone = () => {
    setFormData({
      ...formData,
      phoneNumbers: [...(formData.phoneNumbers || []), '0313'],
    });
  };

  const handleRemovePhone = (index: number) => {
    setFormData({
      ...formData,
      phoneNumbers: (formData.phoneNumbers || []).filter((_, i) => i !== index),
    });
  };

  const handleUpdatePhone = (index: number, val: string) => {
    const updated = [...(formData.phoneNumbers || [])];
    updated[index] = val;
    setFormData({ ...formData, phoneNumbers: updated });
  };

  const handleAddDoctor = () => {
    const newDoc: ClinicDoctorBio = {
      id: `doc-${Date.now()}`,
      name: 'پزشک جدید',
      title: 'متخصص دامپزشکی',
      medicalCode: 'نظام: ----',
      specialties: ['داخلی', 'جراحی'],
      photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
      bioText: 'توضیح سوابق تحصیلی و تجارب بالینی...',
      isActive: true,
    };
    setFormData({ ...formData, doctors: [...(formData.doctors || []), newDoc] });
  };

  const handleRemoveDoctor = (id: string) => {
    setFormData({
      ...formData,
      doctors: (formData.doctors || []).filter((d) => d.id !== id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FAFBF7] w-full max-w-4xl rounded-2xl shadow-2xl border border-[#E6E9DF] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2D3A27] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A6741] flex items-center justify-center text-white shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F7F8F3]">پیکربندی و اطلاعات رسمی کلینیک مهرگان</h2>
              <p className="text-xs text-[#A3B899]">
                تنظیم نام، آدرس، تلفن‌ها، نقشه جغرافیایی، کادر پزشکی و پرسنل توسط کارشناس آی‌تی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#D0DDD0] hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtab Navigation */}
        <div className="flex border-b border-[#E6E9DF] bg-white px-5 gap-2 pt-2">
          <button
            onClick={() => setActiveSubTab('general')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'general'
                ? 'border-[#4A6741] text-[#2D3A27]'
                : 'border-transparent text-[#738A6E] hover:text-[#2D3A27]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            اطلاعات پایه و ساعات کاری
          </button>
          <button
            onClick={() => setActiveSubTab('map')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'map'
                ? 'border-[#4A6741] text-[#2D3A27]'
                : 'border-transparent text-[#738A6E] hover:text-[#2D3A27]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            آدرس و موقعیت نقشه
          </button>
          <button
            onClick={() => setActiveSubTab('doctors')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'doctors'
                ? 'border-[#4A6741] text-[#2D3A27]'
                : 'border-transparent text-[#738A6E] hover:text-[#2D3A27]'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            پزشکان و جراحان ({(formData.doctors || []).length})
          </button>
          <button
            onClick={() => setActiveSubTab('staff')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeSubTab === 'staff'
                ? 'border-[#4A6741] text-[#2D3A27]'
                : 'border-transparent text-[#738A6E] hover:text-[#2D3A27]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            پرسنل و گرومرها ({(formData.staff || []).length})
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* GENERAL SUBTAB */}
          {activeSubTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4B5E43] mb-1.5">نام رسمی کلینیک</label>
                  <input
                    type="text"
                    value={formData.clinicName}
                    onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-sm text-[#2D3A27] font-bold focus:border-[#4A6741] focus:ring-1 focus:ring-[#4A6741] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4B5E43] mb-1.5">شعار و عنوان تخصصی</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-sm text-[#2D3A27] focus:border-[#4A6741] outline-hidden"
                  />
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="bg-white p-4 rounded-xl border border-[#E6E9DF] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#4B5E43] flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#4A6741]" />
                    خطوط تلفن ثابت و همراه پذیرش
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    className="text-xs text-[#4A6741] hover:text-[#384E31] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> افزودن شماره
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {formData.phoneNumbers.map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => handleUpdatePhone(idx, e.target.value)}
                        className="flex-1 bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D3A27] font-mono outline-hidden"
                      />
                      {formData.phoneNumbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhone(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-red-700 mb-1 mt-2">
                    تلفن اضطراری و اورژانس ۲۴ ساعته
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full bg-red-50/50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-900 font-bold outline-hidden"
                  />
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-white p-4 rounded-xl border border-[#E6E9DF] space-y-3">
                <label className="text-xs font-bold text-[#4B5E43] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#4A6741]" />
                  ساعات کاری و پذیرش بخش‌های مختلف
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-[#738A6E] block mb-1">شنبه تا چهارشنبه</span>
                    <input
                      type="text"
                      value={formData.workingHours.weekdays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workingHours: { ...formData.workingHours, weekdays: e.target.value },
                        })
                      }
                      className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D3A27] outline-hidden"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#738A6E] block mb-1">پنج‌شنبه‌ها</span>
                    <input
                      type="text"
                      value={formData.workingHours.thursdays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workingHours: { ...formData.workingHours, thursdays: e.target.value },
                        })
                      }
                      className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D3A27] outline-hidden"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#738A6E] block mb-1">جمعه‌ها و تعطیلات</span>
                    <input
                      type="text"
                      value={formData.workingHours.fridays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workingHours: { ...formData.workingHours, fridays: e.target.value },
                        })
                      }
                      className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D3A27] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* About text */}
              <div>
                <label className="block text-xs font-bold text-[#4B5E43] mb-1.5">معرفی و بیوگرافی کلینیک</label>
                <textarea
                  rows={3}
                  value={formData.aboutUsText}
                  onChange={(e) => setFormData({ ...formData, aboutUsText: e.target.value })}
                  className="w-full bg-white border border-[#D5DDD0] rounded-xl p-3 text-xs text-[#2D3A27] leading-relaxed outline-hidden"
                />
              </div>
            </div>
          )}

          {/* MAP & ADDRESS SUBTAB */}
          {activeSubTab === 'map' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4B5E43] mb-1.5">نشانی پستی دقیق کلینیک</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] font-medium outline-hidden"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4B5E43] mb-1">کد پستی ده رقمی</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full bg-white border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs font-mono text-[#2D3A27] outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#738A6E] mb-1">عرض جغرافیایی (Lat)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.coordinates.lat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coordinates: { ...formData.coordinates, lat: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-white border border-[#D5DDD0] rounded-xl px-2 py-2 text-xs font-mono text-[#2D3A27] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#738A6E] mb-1">طول جغرافیایی (Lng)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.coordinates.lng}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coordinates: { ...formData.coordinates, lng: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-white border border-[#D5DDD0] rounded-xl px-2 py-2 text-xs font-mono text-[#2D3A27] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Map Preview Box */}
              <div className="relative w-full h-56 bg-[#E9EFE6] rounded-2xl border border-[#D5DDD0] overflow-hidden flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[radial-gradient(#4A6741_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
                <div className="z-10 text-center space-y-2 bg-white/90 backdrop-blur-xs p-4 rounded-xl shadow-xs border border-[#D5DDD0] max-w-md">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 mb-1 animate-bounce">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-[#2D3A27]">{formData.clinicName}</h4>
                  <p className="text-[11px] text-[#5C7457]">{formData.address}</p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <span className="text-[10px] font-mono bg-[#F7F8F3] px-2 py-1 rounded-md text-[#4A6741] border border-[#D5DDD0]">
                      {formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${formData.coordinates.lat},${formData.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#4A6741] hover:underline font-bold flex items-center gap-1"
                    >
                      مشاهده در نقشه <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCTORS SUBTAB */}
          {activeSubTab === 'doctors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#5C7457]">
                  مشخصات کادر پزشکی و جراحان کلینیک جهت نمایش به مراجعین و درج در سربرگ نسخه‌ها
                </p>
                <button
                  type="button"
                  onClick={handleAddDoctor}
                  className="bg-[#4A6741] text-white hover:bg-[#384E31] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> افزودن پزشک
                </button>
              </div>

              <div className="space-y-3">
                {(formData.doctors || []).map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="bg-white p-4 rounded-xl border border-[#E6E9DF] flex flex-col md:flex-row gap-4 items-start"
                  >
                    <img
                      src={doc.photoUrl}
                      alt={doc.name}
                      className="w-16 h-16 rounded-xl object-cover border border-[#D5DDD0] shadow-xs shrink-0"
                    />
                    <div className="flex-1 space-y-2 w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={doc.name}
                          onChange={(e) => {
                            const updated = [...(formData.doctors || [])];
                            updated[idx].name = e.target.value;
                            setFormData({ ...formData, doctors: updated });
                          }}
                          placeholder="نام پزشک"
                          className="bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1 text-xs font-bold text-[#2D3A27]"
                        />
                        <input
                          type="text"
                          value={doc.medicalCode}
                          onChange={(e) => {
                            const updated = [...(formData.doctors || [])];
                            updated[idx].medicalCode = e.target.value;
                            setFormData({ ...formData, doctors: updated });
                          }}
                          placeholder="کد نظام دامپزشکی"
                          className="bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1 text-xs text-[#2D3A27]"
                        />
                      </div>
                      <input
                        type="text"
                        value={doc.title}
                        onChange={(e) => {
                          const updated = [...(formData.doctors || [])];
                          updated[idx].title = e.target.value;
                          setFormData({ ...formData, doctors: updated });
                        }}
                        placeholder="عنوان تخصص"
                        className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg px-2.5 py-1 text-xs text-[#4A6741] font-medium"
                      />
                      <textarea
                        rows={2}
                        value={doc.bioText}
                        onChange={(e) => {
                          const updated = [...(formData.doctors || [])];
                          updated[idx].bioText = e.target.value;
                          setFormData({ ...formData, doctors: updated });
                        }}
                        placeholder="بیوگرافی و سوابق جراحی..."
                        className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-lg p-2 text-[11px] text-[#5C7457]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoctor(doc.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAFF SUBTAB */}
          {activeSubTab === 'staff' && (
            <div className="space-y-4">
              <p className="text-xs text-[#5C7457]">پرسنل ارشد، گرومرها، تکنسین‌ها و کادر خدمات کلینیک مهرگان</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(formData.staff || []).map((st) => (
                  <div key={st.id} className="bg-white p-3.5 rounded-xl border border-[#E6E9DF] space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={st.photoUrl}
                        alt={st.name}
                        className="w-12 h-12 rounded-lg object-cover border border-[#D5DDD0]"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#2D3A27]">{st.name}</h4>
                        <span className="text-[10px] text-[#4A6741] font-semibold">{st.roleTitle}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#5C7457] line-clamp-2">{st.shortBio}</p>
                    <div className="text-[10px] bg-[#F7F8F3] text-[#738A6E] px-2 py-1 rounded-md">
                      شیفت: {st.workingDays}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E6E9DF] flex items-center justify-between">
          <div className="text-[11px] text-[#738A6E]">
            آخرین ویرایش توسط: <span className="font-bold text-[#2D3A27]">{formData.lastUpdatedBy}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#5C7457] hover:bg-[#F7F8F3] transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              className="bg-[#4A6741] text-white hover:bg-[#384E31] px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              ذخیره و اعمال تغییرات
            </button>
          </div>
        </div>

        {/* Toast confirmation */}
        {showSavedToast && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#2D3A27] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            مشخصات کلینیک مهرگان با موفقیت بروزرسانی شد
          </div>
        )}
      </div>
    </div>
  );
};
