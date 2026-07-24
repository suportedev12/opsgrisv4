import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Panel({ title, subtitle, children, action, className = '' }: PanelProps) {
  return (
    <div className={`rounded-xl border border-slate-800/60 bg-[#0f1117]/80 p-4 backdrop-blur-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
