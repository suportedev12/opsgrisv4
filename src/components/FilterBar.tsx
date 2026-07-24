import { Search, X } from 'lucide-react';
import type { Filters } from '@/types';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  atendentes: string[];
  placeholder?: string;
}

const inputCls = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-[#F47920] focus:outline-none focus:ring-1 focus:ring-[#F47920]/20';

export function FilterBar({ filters, onChange, atendentes, placeholder = 'Pesquisar por motorista, placa, PIS, operação...' }: FilterBarProps) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={filters.search}
          onChange={e => update({ search: e.target.value })}
          placeholder={placeholder}
          className={`w-full pl-9 ${inputCls}`}
        />
      </div>

      <select value={filters.status} onChange={e => update({ status: e.target.value })} className={inputCls}>
        <option value="">Todos os Status</option>
        <option value="Validado">Validado</option>
        <option value="Pendência">Pendência</option>
        <option value="Recusado">Recusado</option>
        <option value="Andamento">Andamento</option>
      </select>

      <select value={filters.turno} onChange={e => update({ turno: e.target.value })} className={inputCls}>
        <option value="">Todos os Turnos</option>
        <option value="Manhã">Manhã</option>
        <option value="Tarde">Tarde</option>
        <option value="Noite">Noite</option>
        <option value="1T">1º Turno</option>
        <option value="2T">2º Turno</option>
        <option value="3T">3º Turno</option>
      </select>

      {atendentes.length > 0 && (
        <select value={filters.atendente} onChange={e => update({ atendente: e.target.value })} className={inputCls}>
          <option value="">Todos os Atendentes</option>
          {atendentes.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      )}

      {(filters.search || filters.status || filters.turno || filters.atendente || filters.dataInicio || filters.dataFim) && (
        <button
          onClick={() => onChange({ turno: '', atendente: '', status: '', dataInicio: '', dataFim: '', search: '' })}
          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm hover:border-gray-300 hover:text-gray-700"
        >
          <X className="h-3.5 w-3.5" /> Limpar
        </button>
      )}
    </div>
  );
}
