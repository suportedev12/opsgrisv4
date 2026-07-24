import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'orange' | 'slate';
}

const accentMap = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  orange: { bg: 'bg-[#F47920]/10', text: 'text-[#F47920]', border: 'border-[#F47920]/20' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
};

export function KpiCard({ title, value, subtitle, icon, accent = 'slate' }: KpiCardProps) {
  const c = accentMap[accent];
  return (
    <div className={`relative overflow-hidden rounded-xl border ${c.border} bg-[#0f1117]/80 p-4 backdrop-blur-sm transition-all hover:scale-[1.02] hover:border-slate-600`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
