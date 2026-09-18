import React, { useEffect, useMemo, useState } from 'react';
import { Pet } from '../types';
import { apiClient } from '../services/apiClient';

interface RemotePetSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  pets: Pet[];
  className?: string;
  placeholder?: string;
  onlyPresent?: boolean;
  formatLabel?: (pet: Pet) => string;
}

export const RemotePetSearchSelect: React.FC<RemotePetSearchSelectProps> = ({
  value,
  onChange,
  pets,
  className = '',
  placeholder = 'جست‌وجوی پرونده...',
  onlyPresent = false,
  formatLabel = (pet) => `${pet.name} (${pet.breed || 'نژاد نامشخص'}) • سرپرست: ${pet.ownerName || 'بدون نام'}`,
}) => {
  const selectedFromLocal = useMemo(() => pets.find((pet) => pet.id === value), [pets, value]);
  const [query, setQuery] = useState(selectedFromLocal ? formatLabel(selectedFromLocal) : '');
  const [matches, setMatches] = useState<Pet[]>(selectedFromLocal ? [selectedFromLocal] : []);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (selectedFromLocal && value && !open) setQuery(formatLabel(selectedFromLocal));
  }, [selectedFromLocal, value, open, formatLabel]);

  useEffect(() => {
    const search = query.trim();
    const timer = window.setTimeout(() => {
      apiClient.getPatients(search, 10, '')
        .then((items) => setMatches(onlyPresent ? items.filter((pet) => pet.statusInClinic === 'waiting' || pet.statusInClinic === 'in_exam') : items))
        .catch(() => setMatches([]));
    }, search.length >= 3 ? 220 : 0);
    return () => window.clearTimeout(timer);
  }, [query, onlyPresent]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); if (!event.target.value.trim()) onChange(''); }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 140)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 top-full right-0 left-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#D5DDD0] bg-white shadow-lg">
          {matches.length ? matches.slice(0, 10).map((pet) => (
            <button key={pet.id} type="button" onMouseDown={() => { onChange(pet.id); setQuery(formatLabel(pet)); setOpen(false); }} className="block w-full px-3 py-2 text-right text-xs font-bold text-[#2D3A27] hover:bg-[#F0F4EC]">
              {formatLabel(pet)}
            </button>
          )) : <div className="px-3 py-2 text-xs text-slate-500">پرونده‌ای یافت نشد</div>}
        </div>
      )}
    </div>
  );
};
