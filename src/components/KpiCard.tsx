import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleLink?: () => void;
  icon: ReactNode;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'orange' | 'slate';
}

const accentMap = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-500',   val: 'text-blue-600' },
  green:  { bg: 'bg-emerald-50',text: 'text-emerald-500',val: 'text-emerald-600' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-500',  val: 'text-amber-600' },
  red:    { bg: 'bg-red-50',    text: 'text-red-500',    val: 'text-red-600' },
  orange: { bg: 'bg-orange-50', text: 'text-[#F47920]',  val: 'text-[#F47920]' },
  slate:  { bg: 'bg-slate-100', text: 'text-slate-500',  val: 'text-slate-700' },
};

export function KpiCard({ title, value, subtitle, subtitleLink, icon, accent = 'slate' }: KpiCardProps) {
  const c = accentMap[accent];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{title}</p>
          <p className={`mt-1.5 text-3xl font-bold ${c.val}`}>{value}</p>
          {subtitle && (
            <p
              onClick={subtitleLink}
              className={`mt-1 text-xs ${subtitleLink ? 'cursor-pointer text-[#F47920] hover:underline' : 'text-gray-500'}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
