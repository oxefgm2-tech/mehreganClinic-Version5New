import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  PawPrint,
  User,
  Phone,
  Calendar,
  Syringe,
  FileText,
  Printer,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { Pet, Owner, SpeciesType, GenderType, ClinicPresenceStatus } from '../../types';
import { apiClient } from '../../services/apiClient';

interface ReceptionPetsTabProps {
  pets: Pet[];
  owners: Owner[];
  onAddPet: (newPet: Omit<Pet, 'id'>) => void;
  onUpdatePet: (pet: Pet) => void;
  onDeletePet?: (petId: string) => void;
  onCheckInPet: (petId: string, status: ClinicPresenceStatus) => void;
  onPrintPassport: (pet: Pet) => void;
  selectedPetForDrawer?: Pet | null;
}

export const ReceptionPetsTab: React.FC<ReceptionPetsTabProps> = ({
  pets,
  owners,
  onAddPet,
  onUpdatePet,
  onDeletePet,
  onCheckInPet,
  onPrintPassport,
  selectedPetForDrawer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activePetDrawer, setActivePetDrawer] = useState<Pet | null>(selectedPetForDrawer || null);
  const [remoteMatches, setRemoteMatches] = useState<Pet[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);

  useEffect(() => {
    const query = searchTerm.trim();
    if (query.length < 3) {
      setRemoteMatches([]);
      setIsSearchingRemote(false);
      return;
    }
    setIsSearchingRemote(true);
    const timer = window.setTimeout(() => {
      apiClient.getPatients(query, 10, speciesFilter)
        .then((result) => setRemoteMatches(result))
        .catch(() => setRemoteMatches([]))
        .finally(() => setIsSearchingRemote(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm, speciesFilter]);

  // New Pet Form State
  const [formData, setFormData] = useState({
    name: '',
    species: 'سگ' as SpeciesType,
    breed: '',
    gender: 'نر' as GenderType,
    birthDate: '۱۴۰۲/۰۱/۰۱',
    ageText: '۱ سال',
    weightKg: 4.5,
    color: 'قهوه‌ای روشن',
    microchipNumber: `98514100${Math.floor(Math.random() * 8999999 + 1000000)}`,
    photoUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
    ownerName: '',
    ownerPhone: '',
    allergies: '',
    notes: '',
  });

  const searchablePets = searchTerm.trim().length >= 3
    ? remoteMatches
    : pets.filter((pet) => pet.statusInClinic === 'waiting' || pet.statusInClinic === 'in_exam').slice(0, 10);
  const matchingPets = searchablePets.filter((pet) => {
    const query = searchTerm.trim().toLocaleLowerCase();
    const contains = (value: unknown) => String(value ?? '').toLocaleLowerCase().includes(query);
    const matchesSearch =
      contains(pet.name) ||
      contains(pet.breed) ||
      contains(pet.ownerName) ||
      contains(pet.ownerPhone) ||
      contains(pet.microchipNumber);

    const matchesSpecies = speciesFilter === 'all' || pet.species === speciesFilter;
    return matchesSearch && matchesSpecies;
  });
  const filteredPets = matchingPets.slice(0, 10);

  const handleCreatePetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ownerName || !formData.ownerPhone) return;

    onAddPet({
      name: formData.name,
      species: formData.species,
      breed: formData.breed || 'نژاد نامشخص',
      gender: formData.gender,
      birthDate: formData.birthDate,
      ageText: formData.ageText,
      weightKg: Number(formData.weightKg),
      color: formData.color,
      microchipNumber: formData.microchipNumber,
      photoUrl: formData.photoUrl,
      ownerId: `own-${Date.now()}`,
      ownerName: formData.ownerName,
      ownerPhone: formData.ownerPhone,
      allergies: formData.allergies ? formData.allergies.split(',').map((a) => a.trim()) : [],
      statusInClinic: 'waiting',
      checkInTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      lastVisitDate: 'امروز (تشکیل پرونده)',
      nextVaccineDate: '۱۴۰۳/۰۷/۰۱',
      nextParasiteDate: '۱۴۰۳/۰۶/۱۵',
      notes: formData.notes,
      isVaccinated: true,
    });

    setIsAddModalOpen(false);
  };

  return (
    <div id="tab-reception-pets" className="space-y-6 animate-fadeIn pb-12">
      
      {/* Search & Actions Header */}
      <div className="bg-white p-5 rounded-[28px] border border-[#E6E9DF] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5C7457] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی سریع پرونده با نام حیوان، نام سرپرست، شماره موبایل یا شماره میکروچیپ..."
              className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl pr-10 pl-4 py-2.5 text-xs text-[#2D3A27] placeholder-[#5C7457]/70 focus:outline-none focus:ring-2 focus:ring-[#4A6741] focus:bg-white transition-all font-medium"
            />
          </div>

          <span className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-[11px] font-bold whitespace-nowrap" title="داده‌ها مستقیماً بر روی دیسک سرور ثبت و پایدار می‌شوند">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>دیتابیس پایدار فعال</span>
          </span>
        </div>

        {/* Species Filter & New Pet Button */}
        <div className="flex items-center gap-2">
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            aria-label="فیلتر بر اساس گونه حیوان"
            className="bg-[#F7F8F3] border border-[#E6E9DF] text-[#2D3A27] text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4A6741] cursor-pointer"
          >
            <option value="all">تمام گونه‌ها</option>
            <option value="سگ">سگ‌ها</option>
            <option value="گربه">گربه‌ها</option>
            <option value="پرنده">پرندگان</option>
            <option value="خرگوش و جوندگان">خرگوش و جوندگان</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#4A6741] hover:bg-[#3D5535] active:scale-95 text-white px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>تشکیل پرونده جدید</span>
          </button>
        </div>

      </div>

      {/* Section Header: Present vs Records */}
      <div className="flex items-center justify-between">
        {searchTerm.trim().length >= 3 ? (
          <h3 className="text-sm font-black text-[#2D3A27] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4A6741]"></span>
            نتایج جستجوی پرونده‌ها
            <span className="text-[11px] font-bold text-[#5C7457] bg-[#F7F8F3] border border-[#E6E9DF] px-2 py-0.5 rounded-full">{filteredPets.length} مورد</span>
            <span className="text-[11px] font-medium text-[#5C7457]">— بج «در انتظار/در معاینه» = حاضر در کلینیک</span>
          </h3>
        ) : (
          <h3 className="text-sm font-black text-[#2D3A27] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            بیماران حاضر در کلینیک
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">{filteredPets.length} حاضر</span>
            <span className="text-[11px] font-medium text-[#5C7457]">— فقط waiting / in_exam</span>
          </h3>
        )}
        <span className="text-[11px] text-[#5C7457]">پرونده‌های کامل در تب سوابق پزشکی</span>
      </div>

      {/* Pet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPets.map((pet) => {
          const isPresent = pet.statusInClinic === 'waiting' || pet.statusInClinic === 'in_exam';

          const isDemoPet = pet.isDemo === true || pet.isVerified === false;
          return (
            <div
              key={pet.id}
              className={`rounded-[24px] border transition-all p-5 shadow-xs flex flex-col justify-between ${
                isDemoPet
                  ? 'bg-stone-100/90 border-2 border-dashed border-stone-300 text-stone-600'
                  : isPresent
                  ? 'bg-white border-[#4A6741] ring-2 ring-[#4A6741]/20'
                  : 'bg-white border-[#E6E9DF]'
              }`}
            >
              <div>
                {/* Header: Photo, Name, Status */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={pet.photoUrl}
                    alt={pet.name}
                    className={`w-16 h-16 rounded-2xl object-cover shrink-0 shadow-xs ${
                      isDemoPet
                        ? 'grayscale-[75%] border border-stone-300 opacity-80 bg-stone-200'
                        : 'border border-[#E6E9DF]'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <h3 className={`text-base font-black truncate ${isDemoPet ? 'text-stone-700' : 'text-[#2D3A27]'}`}>{pet.name}</h3>
                        {isDemoPet && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-300 text-stone-700 border border-stone-400">
                            پرونده غیرواقعی (طوسی)
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDemoPet
                            ? 'bg-stone-200 text-stone-700'
                            : pet.statusInClinic === 'waiting'
                            ? 'bg-[#D4E0CD] text-[#2D3A27]'
                            : pet.statusInClinic === 'in_boarding'
                            ? 'bg-amber-100 text-amber-900'
                            : pet.statusInClinic === 'in_grooming'
                            ? 'bg-teal-100 text-teal-900'
                            : pet.statusInClinic === 'in_exam'
                            ? 'bg-[#4A6741] text-white'
                            : 'bg-[#F7F8F3] text-[#5C7457]'
                        }`}
                      >
                        {pet.statusInClinic === 'waiting' && 'در سالن انتظار'}
                        {pet.statusInClinic === 'in_boarding' && 'بستری در پانسیون'}
                        {pet.statusInClinic === 'in_grooming' && 'در آرایشگاه'}
                        {pet.statusInClinic === 'in_exam' && 'در اتاق معاینه'}
                        {pet.statusInClinic === 'not_present' && 'خارج از کلینیک'}
                      </span>
                    </div>

                    <p className="text-xs text-[#5C7457] mt-0.5 truncate">
                      {pet.species} • {pet.breed} • {pet.gender}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#5C7457] font-medium">
                      <span>سن: {pet.ageText}</span>
                      <span>•</span>
                      <span>وزن: {pet.weightKg} کیلو</span>
                    </div>
                  </div>
                </div>

                {/* Owner & Microchip Details */}
                <div className="mt-4 pt-3 border-t border-[#E6E9DF] space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#5C7457]">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#5C7457]" />
                      <span>سرپرست: {pet.ownerName}</span>
                    </span>
                    <span className="font-mono text-[#2D3A27] font-bold">{pet.ownerPhone}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#5C7457] text-[11px]">
                    <span>شماره میکروچیپ:</span>
                    <span className="font-mono font-bold text-[#4A6741] tracking-wider">
                      {pet.microchipNumber}
                    </span>
                  </div>
                </div>

                {/* Vaccines & Allergies notice */}
                {pet.allergies && pet.allergies.length > 0 && (
                  <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-semibold">
                    ⚠️ آلرژی: {pet.allergies.join('، ')}
                  </div>
                )}
              </div>

              {/* Bottom Actions: Check-in, Print Passport, Open Dossier */}
              <div className="mt-4 pt-3 border-t border-[#E6E9DF] flex items-center gap-2">
                <button
                  onClick={() => setActivePetDrawer(pet)}
                  className="flex-1 bg-[#F7F8F3] hover:bg-[#E6E9DF] border border-[#E6E9DF] text-[#2D3A27] text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>مشاهده پرونده کامل</span>
                </button>

                <button
                  onClick={() => onPrintPassport(pet)}
                  className="p-2 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] rounded-xl border border-[#E6E9DF] transition-colors cursor-pointer"
                  title="چاپ شناسنامه و کارت بهداشت استاندارد"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {onDeletePet && (
                  <button
                    onClick={() => {
                      if (window.confirm(`آیا از حذف پرونده ${pet.name} (${pet.ownerName}) اطمینان دارید؟ این عملیات روی دیتابیس ثبت می‌شود.`)) {
                        onDeletePet(pet.id);
                      }
                    }}
                    className="p-2 bg-[#F7F8F3] hover:bg-rose-50 text-[#5C7457] hover:text-rose-600 rounded-xl border border-[#E6E9DF] transition-colors cursor-pointer"
                    title="حذف پرونده بیمار"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {pet.statusInClinic === 'not_present' ? (
                  <button
                    onClick={() => onCheckInPet(pet.id, 'waiting')}
                    className="bg-[#4A6741] hover:bg-[#3D5535] text-white text-xs font-bold py-2 px-3 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    پذیرش در کلینیک
                  </button>
                ) : (
                  <button
                    onClick={() => onCheckInPet(pet.id, 'not_present')}
                    className="bg-[#E6E9DF] hover:bg-rose-100 hover:text-rose-800 text-[#2D3A27] text-xs font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    ترخیص
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
      {isSearchingRemote && <p className="text-center text-xs font-bold text-[#5C7457]">در حال جست‌وجوی پرونده‌ها…</p>}
      {matchingPets.length > filteredPets.length && (
        <p className="text-center text-xs font-bold text-[#5C7457]">
          {filteredPets.length} مورد اول از {matchingPets.length} نتیجه نمایش داده شد؛ برای دقیق‌تر شدن جست‌وجو چند حرف دیگر وارد کنید.
        </p>
      )}

      {/* New Pet Intake Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A27]/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-[#2D3A27] w-full max-w-xl rounded-[28px] shadow-2xl border border-[#E6E9DF] overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#4A6741] text-white flex items-center justify-center">
                  <PawPrint className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-[#2D3A27]">
                  تشکیل پرونده جدید بیمار و پذیرش
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-[#5C7457] hover:text-[#2D3A27] rounded-lg hover:bg-[#E6E9DF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePetSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">نام حیوان خانگی *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: لوسی، میلو، هیرو"
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741] font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">گونه حیوان *</label>
                  <select
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value as SpeciesType })}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741] font-medium cursor-pointer"
                  >
                    <option value="سگ">سگ</option>
                    <option value="گربه">گربه</option>
                    <option value="پرنده">پرنده</option>
                    <option value="خرگوش و جوندگان">خرگوش و جوندگان</option>
                    <option value="سایر و اگزاتیک">سایر و اگزاتیک</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">نژاد *</label>
                  <input
                    type="text"
                    required
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="مثال: پامرانین، پرشین، شیتزو"
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">جنسیت</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as GenderType })}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741] cursor-pointer"
                  >
                    <option value="نر">نر</option>
                    <option value="ماده">ماده</option>
                    <option value="نر عقیم‌شده">نر عقیم‌شده</option>
                    <option value="ماده عقیم‌شده">ماده عقیم‌شده</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">وزن (کیلوگرم)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">سن تقریبی</label>
                  <input
                    type="text"
                    value={formData.ageText}
                    onChange={(e) => setFormData({ ...formData, ageText: e.target.value })}
                    placeholder="مثلاً: ۲ سال"
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3A27] mb-1">رنگ و علائم</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="مثال: کرم نسکافه‌ای"
                    className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">شماره میکروچیپ (۱۵ رقمی)</label>
                <input
                  type="text"
                  value={formData.microchipNumber}
                  onChange={(e) => setFormData({ ...formData, microchipNumber: e.target.value })}
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741] font-mono font-bold"
                />
              </div>

              {/* Owner Info */}
              <div className="pt-3 border-t border-[#E6E9DF]">
                <h4 className="font-black text-[#2D3A27] mb-2">مشخصات سرپرست / همراه</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#2D3A27] mb-1">نام و نام خانوادگی سرپرست *</label>
                    <input
                      type="text"
                      required
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="مثال: آرش علیزاده"
                      className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#2D3A27] mb-1">شماره تماس همراه *</label>
                    <input
                      type="tel"
                      required
                      value={formData.ownerPhone}
                      onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                      placeholder="0912xxxxxxx"
                      className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741] font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D3A27] mb-1">حساسیت‌های دارویی / غذایی</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="مثال: حساسیت به پنی‌سیلین، گوشت گاو"
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] focus:outline-none focus:ring-2 focus:ring-[#4A6741]"
                />
              </div>

              <div className="pt-4 border-t border-[#E6E9DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#E6E9DF] hover:bg-[#D4E0CD] text-[#2D3A27] rounded-xl font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4A6741] hover:bg-[#3D5535] text-white rounded-xl font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  ثبت پرونده و پذیرش در لابی
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Pet Detailed Drawer */}
      {activePetDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          <div
            className="absolute inset-0 bg-[#2D3A27]/60 backdrop-blur-xs"
            onClick={() => setActivePetDrawer(null)}
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-r border-[#E6E9DF]">
              
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
                <div className="flex items-center gap-3">
                  <img
                    src={activePetDrawer.photoUrl}
                    alt={activePetDrawer.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-[#E6E9DF]"
                  />
                  <div>
                    <h3 className="text-base font-black text-[#2D3A27]">{activePetDrawer.name}</h3>
                    <p className="text-xs text-[#5C7457]">{activePetDrawer.breed} • {activePetDrawer.gender}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActivePetDrawer(null)}
                  className="p-1.5 text-[#5C7457] hover:text-[#2D3A27] rounded-lg hover:bg-[#E6E9DF] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                
                {/* Microchip & QR */}
                <div className="p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-[#2D3A27]">
                    <span>شماره میکروچیپ بین‌المللی:</span>
                    <QrCode className="w-4 h-4 text-[#4A6741]" />
                  </div>
                  <div className="font-mono text-sm font-black text-[#4A6741] tracking-wider">
                    {activePetDrawer.microchipNumber}
                  </div>
                </div>

                {/* Health & Vaccine Schedule */}
                <div className="space-y-2">
                  <h4 className="font-black text-[#2D3A27] text-xs">برنامه واکسیناسیون و انگل‌تراپی:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl">
                      <span className="text-[#5C7457] text-[10px]">موعد واکسن بعدی:</span>
                      <div className="font-bold text-[#2D3A27] mt-0.5">{activePetDrawer.nextVaccineDate}</div>
                    </div>
                    <div className="p-3 bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl">
                      <span className="text-[#5C7457] text-[10px]">انگل‌تراپی دوره‌ای:</span>
                      <div className="font-bold text-[#2D3A27] mt-0.5">{activePetDrawer.nextParasiteDate}</div>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl space-y-2">
                  <h4 className="font-black text-[#2D3A27]">اطلاعات سرپرست:</h4>
                  <div className="space-y-1 text-[#2D3A27]">
                    <div><strong>نام:</strong> {activePetDrawer.ownerName}</div>
                    <div><strong>شماره تماس:</strong> <span className="font-mono">{activePetDrawer.ownerPhone}</span></div>
                    <div><strong>آخرین مراجعه:</strong> {activePetDrawer.lastVisitDate}</div>
                  </div>
                </div>

                {/* Clinical Notes */}
                {activePetDrawer.notes && (
                  <div className="p-4 bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl space-y-1">
                    <h4 className="font-black text-[#2D3A27]">یادداشت‌های بالینی و رفتاری:</h4>
                    <p className="text-[#5C7457] leading-relaxed">{activePetDrawer.notes}</p>
                  </div>
                )}

              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-[#F7F8F3] border-t border-[#E6E9DF] flex items-center gap-2">
                <button
                  onClick={() => {
                    onPrintPassport(activePetDrawer);
                    setActivePetDrawer(null);
                  }}
                  className="flex-1 bg-[#4A6741] hover:bg-[#3D5535] text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ شناسنامه و کارت بهداشت</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
