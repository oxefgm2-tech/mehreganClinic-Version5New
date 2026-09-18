import React, { useEffect, useMemo, useState } from 'react';

export interface SmartSearchOption {
  value: string;
  label: string;
  searchText?: string;
}

interface SmartSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SmartSearchOption[];
  placeholder?: string;
  className?: string;
  emptyText?: string;
}

/** Lightweight combobox: only the ten most relevant options are rendered. */
export const SmartSearchSelect: React.FC<SmartSearchSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'برای جست‌وجو تایپ کنید…',
  className = '',
  emptyText = 'موردی یافت نشد',
}) => {
  const selected = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selected?.label || '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(selected?.label || '');
  }, [selected?.value, selected?.label]);

  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return options.slice(0, 10);
    return options
      .map((option, index) => ({ option, index, text: `${option.label} ${option.searchText || ''}`.toLocaleLowerCase() }))
      .sort((a, b) => Number(!a.text.startsWith(normalized)) - Number(!b.text.startsWith(normalized)) || a.index - b.index)
      .filter(({ text }) => text.includes(normalized))
      .slice(0, 10)
      .map(({ option }) => option);
  }, [options, query]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); if (!event.target.value) onChange(''); }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 top-full right-0 left-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#D5DDD0] bg-white shadow-lg">
          {matches.length ? matches.map((option) => (
            <button
              type="button"
              key={option.value}
              onMouseDown={() => { onChange(option.value); setQuery(option.label); setOpen(false); }}
              className="block w-full px-3 py-2 text-right text-xs font-bold text-[#2D3A27] hover:bg-[#F0F4EC]"
            >{option.label}</button>
          )) : <div className="px-3 py-2 text-xs text-slate-500">{emptyText}</div>}
        </div>
      )}
    </div>
  );
};
