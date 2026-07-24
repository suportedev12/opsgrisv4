import { Search, X } from 'lucide-react';
import type { Filters } from '@/types';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  atendentes: string[];
}

export function FilterBar({ filters, onChange, atendentes }: FilterBarProps) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800/60 bg-[#0f1117]/80 p-3 backdrop-blur-sm">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={filters.search}
          onChange={e => update({ search: e.target.value })}
          placeholder="Buscar motorista, placa, PIS..."
          className="w-56 rounded-lg border border-slate-700 bg-slate-800/80 py-1.5 pl-8 pr-3 text-sm text-white placeholder-slate-500 focus:border-[#F47920]/50 focus:outline-none"
        />
      </div>

      <select
        value={filters.turno}
        onChange={e => update({ turno: e.target.value })}
        className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-sm text-white focus:border-[#F47920]/50 focus:outline-none"
      >
        <option value="">Turno: Todos</option>
        <option value="1T">1º Turno</option>
        <option value="2T">2º Turno</option>
        <option value="3T">3º Turno</option>
      </select>

      <select
        value={filters.atendente}
        onChange={e => update({ atendente: e.target.value })}
        className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-sm text-white focus:border-[#F47920]/50 focus:outline-none"
      >
        <option value="">Atendente: Todos</option>
        {atendentes.map(a => <option key={a} value={a}>{a}</option>)}
      </select>

      <select
        value={filters.status}
        onChange={e => update({ status: e.target.value })}
        className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-sm text-white focus:border-[#F47920]/50 focus:outline-none"
      >
        <option value="">Status: Todos</option>
        <option value="Validado">Validado</option>
        <option value="Pendência">Pendência</option>
        <option value="Recusado">Recusado</option>
        <option value="Andamento">Andamento</option>
      </select>

      <input
        type="date"
        value={filters.dataInicio}
        onChange={e => update({ dataInicio: e.target.value })}
        className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-sm text-white focus:border-[#F47920]/50 focus:outline-none"
      />
      <span className="text-slate-500">→</span>
      <input
        type="date"
        value={filters.dataFim}
        onChange={e => update({ dataFim: e.target.value })}
        className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-sm text-white focus:border-[#F47920]/50 focus:outline-none"
      />

      <button
        onClick={() => onChange({ turno: '', atendente: '', status: '', dataInicio: '', dataFim: '', search: '' })}
        className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700"
      >
        <X className="h-3.5 w-3.5" /> Limpar
      </button>
    </div>
  );
}
