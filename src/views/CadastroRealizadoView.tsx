import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CadastroRealizado, Filters } from '@/types';
import { filterCadastros, getUniqueAtendentes } from '@/utils/filters';
import { useCadastroKPIs } from '@/hooks/useKPIs';
import { FilterBar } from '@/components/FilterBar';
import { KpiCard } from '@/components/KpiCard';
import { Panel } from '@/components/Panel';
import { BarChart, DonutChart } from '@/components/Charts';
import { FileCheck, CheckCircle2, AlertTriangle, XCircle, Clock, Gauge, Timer, Plus, Pencil, Trash2, Save, X } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  'Validado': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Pendência': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Recusado': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Andamento': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const EMPTY: Omit<CadastroRealizado, 'id' | 'created_at' | 'updated_at'> = {
  mes: '', turno: '', operacao: '', classificacao: '', data: '', horario_inicio: '',
  pis: '', motorista: '', placa_cavalo: '', tipo_veiculo: '', ano_cavalo: '',
  placa_carreta: '', ano_carreta: '', atendente: '', tentativa_1: '', tentativa_2: '',
  tentativa_3: '', tipo: '', status: 'Andamento', pendencia_recusa: '', horario_fim: '', obs: '',
};

const COLS: { key: keyof typeof EMPTY; label: string; type?: string }[] = [
  { key: 'mes', label: 'Mês' },
  { key: 'turno', label: 'Turno' },
  { key: 'operacao', label: 'Operação' },
  { key: 'classificacao', label: 'Classificação' },
  { key: 'data', label: 'Data', type: 'date' },
  { key: 'horario_inicio', label: 'Horário Início', type: 'time' },
  { key: 'pis', label: 'PIS' },
  { key: 'motorista', label: 'Motorista' },
  { key: 'placa_cavalo', label: 'Placa Cavalo' },
  { key: 'tipo_veiculo', label: 'Tipo' },
  { key: 'ano_cavalo', label: 'Ano Cavalo' },
  { key: 'placa_carreta', label: 'Placa Carreta' },
  { key: 'ano_carreta', label: 'Ano Carreta' },
  { key: 'atendente', label: 'Atendente' },
  { key: 'tentativa_1', label: '1ª Tentativa' },
  { key: 'tentativa_2', label: '2ª Tentativa' },
  { key: 'tentativa_3', label: '3ª Tentativa' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'pendencia_recusa', label: 'Pendência/Recusa' },
  { key: 'horario_fim', label: 'Horário Fim', type: 'time' },
  { key: 'obs', label: 'OBS' },
];

export function CadastroRealizadoView({ filters, onFiltersChange }: { filters: Filters; onFiltersChange: (f: Filters) => void }) {
  const [records, setRecords] = useState<CadastroRealizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CadastroRealizado | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('cadastro_realizado').select('*').order('created_at', { ascending: false });
    setRecords(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filterCadastros(records, filters);
  const kpis = useCadastroKPIs(filtered);
  const atendentes = getUniqueAtendentes(records, []);

  const save = async () => {
    if (editing) {
      await supabase.from('cadastro_realizado').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id);
    } else {
      await supabase.from('cadastro_realizado').insert(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY);
    await load();
  };

  const remove = async (id: string) => {
    await supabase.from('cadastro_realizado').delete().eq('id', id);
    await load();
  };

  const startEdit = (r: CadastroRealizado) => {
    setEditing(r);
    const { id, created_at, updated_at, ...rest } = r;
    setForm(rest);
    setShowForm(true);
  };

  const startNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const barData = (['1T', '2T', '3T'] as const).map(t => {
    const recs = filtered.filter(r => r.turno === t);
    return {
      label: t,
      validados: recs.filter(r => r.status === 'Validado').length,
      pendencias: recs.filter(r => r.status === 'Pendência').length,
      outros: recs.filter(r => r.status && r.status !== 'Validado' && r.status !== 'Pendência').length,
    };
  });

  const donutSegs = [
    { label: 'Validados', value: kpis.validados, color: '#10b981' },
    { label: 'Pendências', value: kpis.pendencias, color: '#f59e0b' },
    { label: 'Recusados', value: kpis.recusados, color: '#ef4444' },
    { label: 'Andamento', value: kpis.andamento, color: '#3b82f6' },
  ];

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-[#F47920]" /></div>;

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={onFiltersChange} atendentes={atendentes} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard title="Total" value={kpis.totalCadastros} icon={<FileCheck className="h-5 w-5" />} accent="blue" />
        <KpiCard title="Validados" value={kpis.validados} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
        <KpiCard title="Pendências" value={kpis.pendencias} icon={<AlertTriangle className="h-5 w-5" />} accent="amber" />
        <KpiCard title="Recusados" value={kpis.recusados} icon={<XCircle className="h-5 w-5" />} accent="red" />
        <KpiCard title="Andamento" value={kpis.andamento} icon={<Clock className="h-5 w-5" />} accent="slate" />
        <KpiCard title="Eficiência" value={`${kpis.eficiencia}%`} icon={<Gauge className="h-5 w-5" />} accent="green" />
        <KpiCard title="T. Médio" value={`${kpis.tempoMedioMin}min`} icon={<Timer className="h-5 w-5" />} accent="orange" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Por Turno" className="lg:col-span-2">
          <BarChart data={barData} />
        </Panel>
        <Panel title="Status">
          <div className="flex flex-col items-center gap-3">
            <DonutChart segments={donutSegs} />
            <div className="grid w-full grid-cols-2 gap-2 text-xs">
              {donutSegs.map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                  <span className="text-slate-300">{s.label}</span>
                  <span className="ml-auto font-semibold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Registros de Cadastro Realizado"
        subtitle={`${filtered.length} registros`}
        action={
          <button onClick={startNew} className="flex items-center gap-1.5 rounded-lg bg-[#F47920] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#d96a15]">
            <Plus className="h-4 w-4" /> Novo
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-2 pr-3 font-medium">Mês</th>
                <th className="pb-2 pr-3 font-medium">Turno</th>
                <th className="pb-2 pr-3 font-medium">Operação</th>
                <th className="pb-2 pr-3 font-medium">Classificação</th>
                <th className="pb-2 pr-3 font-medium">Data</th>
                <th className="pb-2 pr-3 font-medium">Início</th>
                <th className="pb-2 pr-3 font-medium">PIS</th>
                <th className="pb-2 pr-3 font-medium">Motorista</th>
                <th className="pb-2 pr-3 font-medium">Placa Cavalo</th>
                <th className="pb-2 pr-3 font-medium">Tipo</th>
                <th className="pb-2 pr-3 font-medium">Ano</th>
                <th className="pb-2 pr-3 font-medium">Placa Carreta</th>
                <th className="pb-2 pr-3 font-medium">Ano</th>
                <th className="pb-2 pr-3 font-medium">Atendente</th>
                <th className="pb-2 pr-3 font-medium">1ª</th>
                <th className="pb-2 pr-3 font-medium">2ª</th>
                <th className="pb-2 pr-3 font-medium">3ª</th>
                <th className="pb-2 pr-3 font-medium">Tipo</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 pr-3 font-medium">Pendência/Recusa</th>
                <th className="pb-2 pr-3 font-medium">Fim</th>
                <th className="pb-2 pr-3 font-medium">OBS</th>
                <th className="pb-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-800/40 transition-colors hover:bg-slate-800/30">
                  <td className="py-2 pr-3 text-slate-300">{r.mes ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.turno ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.operacao ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.classificacao ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.data ? new Date(r.data + 'T00:00').toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.horario_inicio ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.pis ?? '-'}</td>
                  <td className="py-2 pr-3 text-white">{r.motorista ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.placa_cavalo ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.tipo_veiculo ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.ano_cavalo ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.placa_carreta ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.ano_carreta ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.atendente ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-400">{r.tentativa_1 ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-400">{r.tentativa_2 ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-400">{r.tentativa_3 ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.tipo ?? '-'}</td>
                  <td className="py-2 pr-3">
                    {r.status && <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? 'border-slate-700 text-slate-400'}`}>{r.status}</span>}
                  </td>
                  <td className="py-2 pr-3 text-slate-400">{r.pendencia_recusa ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-300">{r.horario_fim ?? '-'}</td>
                  <td className="py-2 pr-3 text-slate-400 max-w-[160px] truncate" title={r.obs ?? ''}>{r.obs ?? '-'}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(r)} className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => remove(r.id)} className="rounded p-1 text-slate-400 hover:bg-red-500/20 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={23} className="py-8 text-center text-slate-500">Nenhum registro encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-slate-700 bg-[#0f1117] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Editar Cadastro' : 'Novo Cadastro'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {COLS.map(col => (
                <div key={col.key}>
                  <label className="mb-1 block text-xs font-medium text-slate-400">{col.label}</label>
                  <input
                    type={col.type ?? 'text'}
                    value={form[col.key] ?? ''}
                    onChange={e => setForm({ ...form, [col.key]: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-sm text-white focus:border-[#F47920]/50 focus:outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Status</label>
                <select
                  value={form.status ?? 'Andamento'}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-sm text-white focus:border-[#F47920]/50 focus:outline-none"
                >
                  <option value="Andamento">Andamento</option>
                  <option value="Validado">Validado</option>
                  <option value="Pendência">Pendência</option>
                  <option value="Recusado">Recusado</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Cancelar</button>
              <button onClick={save} className="flex items-center gap-1.5 rounded-lg bg-[#F47920] px-4 py-2 text-sm font-medium text-white hover:bg-[#d96a15]"><Save className="h-4 w-4" /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
