import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CadastroRealizado, Filters } from '@/types';
import { filterCadastros, getUniqueAtendentes } from '@/utils/filters';
import { FilterBar } from '@/components/FilterBar';
import { Plus, Pencil, Trash2, Save, X, FileCheck } from 'lucide-react';
import type { ReactNode } from 'react';

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: ReactNode }> = {
  'Validado':  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-300', icon: <span className="h-3 w-3 rounded-full border-2 border-emerald-500 flex items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></span> },
  'Andamento': { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-300',    icon: <span className="text-[10px]">⏱</span> },
  'Pendência': { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-300',   icon: <span className="text-[10px]">⚠</span> },
  'Recusado':  { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-300',     icon: <span className="text-[10px]">✕</span> },
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const s = STATUS_STYLES[status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text} ${s.border}`}>
      {s.icon} {status}
    </span>
  );
}

function classifBadge(c: string | null) {
  if (!c) return '';
  const l = c.toLowerCase();
  if (l.includes('crítica') || l.includes('critica') || l.includes('risco')) return 'bg-red-100 text-red-700';
  if (l.includes('alta')) return 'bg-orange-100 text-orange-700';
  return 'bg-gray-100 text-gray-600';
}

const EMPTY = {
  mes: '', turno: '', operacao: '', classificacao: '', data: '', horario_inicio: '',
  pis: '', motorista: '', placa_cavalo: '', tipo_veiculo: '', ano_cavalo: '',
  placa_carreta: '', ano_carreta: '', atendente: '', tentativa_1: '', tentativa_2: '',
  tentativa_3: '', tipo: '', status: 'Andamento', pendencia_recusa: '', horario_fim: '', obs: '',
};
type FormType = typeof EMPTY;

const FORM_FIELDS: { key: keyof FormType; label: string; type?: string; span?: boolean }[] = [
  { key: 'mes', label: 'Mês' },
  { key: 'turno', label: 'Turno' },
  { key: 'operacao', label: 'Operação' },
  { key: 'classificacao', label: 'Classificação' },
  { key: 'data', label: 'Data', type: 'date' },
  { key: 'horario_inicio', label: 'Horário Início', type: 'time' },
  { key: 'horario_fim', label: 'Horário Fim', type: 'time' },
  { key: 'pis', label: 'PIS' },
  { key: 'motorista', label: 'Motorista' },
  { key: 'placa_cavalo', label: 'Placa Cavalo' },
  { key: 'tipo_veiculo', label: 'Tipo Veículo' },
  { key: 'ano_cavalo', label: 'Ano Cavalo' },
  { key: 'placa_carreta', label: 'Placa Carreta' },
  { key: 'ano_carreta', label: 'Ano Carreta' },
  { key: 'atendente', label: 'Atendente' },
  { key: 'tentativa_1', label: '1ª Tentativa' },
  { key: 'tentativa_2', label: '2ª Tentativa' },
  { key: 'tentativa_3', label: '3ª Tentativa' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'pendencia_recusa', label: 'Pendência / Recusa', span: true },
  { key: 'obs', label: 'OBS', span: true },
];

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#F47920] focus:outline-none focus:ring-1 focus:ring-[#F47920]/20';

interface Props { filters: Filters; onFiltersChange: (f: Filters) => void; showNewForm?: boolean; onNewFormHandled?: () => void; }

export function CadastroRealizadoView({ filters, onFiltersChange, showNewForm, onNewFormHandled }: Props) {
  const [records, setRecords] = useState<CadastroRealizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CadastroRealizado | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormType>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('cadastro_realizado').select('*').order('created_at', { ascending: false });
    setRecords(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showNewForm) { startNew(); onNewFormHandled?.(); }
  }, [showNewForm]);

  const filtered = filterCadastros(records, filters);
  const atendentes = getUniqueAtendentes(records, []);

  const save = async () => {
    if (editing) {
      await supabase.from('cadastro_realizado').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id);
    } else {
      await supabase.from('cadastro_realizado').insert(form);
    }
    setShowForm(false); setEditing(null); setForm(EMPTY); await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Remover este registro?')) return;
    await supabase.from('cadastro_realizado').delete().eq('id', id);
    await load();
  };

  const startEdit = (r: CadastroRealizado) => {
    setEditing(r);
    const { id, created_at, updated_at, ...rest } = r;
    setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v ?? ''])) } as FormType);
    setShowForm(true);
  };

  const startNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };

  const fmtDate = (d: string | null) => d ? new Date(d + 'T00:00').toLocaleDateString('pt-BR') : '-';

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-[#F47920]" /></div>;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#F47920]">
            <FileCheck className="h-3.5 w-3.5" /> Setor de Cadastro / GRIS
          </p>
          <h2 className="mt-0.5 text-2xl font-bold text-gray-900">Cadastro Realizado</h2>
          <p className="mt-0.5 text-sm text-gray-500">Controle de motoristas, veículos, carretas, tentativas de validação e status de liberação.</p>
        </div>
        <button
          onClick={startNew}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[#F47920] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#F47920]/20 transition-colors hover:bg-[#d96a15]"
        >
          <Plus className="h-4 w-4" /> + NOVO CADASTRO
        </button>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={onFiltersChange} atendentes={atendentes} />

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a2535] text-left text-xs font-semibold text-gray-300">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Mês / Turno</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Operação / Classif.</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Data / Horário</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Motorista & PIS</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Cavalo / Carreta</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Atendente</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Tentativas</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Tipo</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Pendência / Recusa</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 transition-colors hover:bg-orange-50/20">
                  <td className="px-4 py-4 align-top">
                    <p className="font-semibold text-gray-800">{r.mes ?? '-'}</p>
                    <p className="text-xs text-gray-500">{r.turno ?? '-'}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-gray-800">{r.operacao ?? '-'}</p>
                    {r.classificacao && (
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${classifBadge(r.classificacao)}`}>{r.classificacao}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top whitespace-nowrap">
                    <p className="text-gray-800">{fmtDate(r.data)}</p>
                    {(r.horario_inicio || r.horario_fim) && (
                      <p className="text-xs text-gray-500">{r.horario_inicio ?? ''}{r.horario_inicio && r.horario_fim ? ' – ' : ''}{r.horario_fim ?? ''}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-semibold text-gray-800">{r.motorista ?? '-'}</p>
                    {r.pis && <p className="text-xs text-gray-500">PIS: {r.pis}</p>}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-gray-800">{r.placa_cavalo ?? '-'}</p>
                    <p className="text-xs text-gray-500">
                      {[r.tipo_veiculo, r.ano_cavalo].filter(Boolean).join(' / ')}
                      {r.placa_carreta && <> / {r.placa_carreta}{r.ano_carreta ? ' / ' + r.ano_carreta : ''}</>}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="text-gray-700">{r.atendente ?? '-'}</p>
                  </td>
                  <td className="px-4 py-4 align-top whitespace-nowrap">
                    <p className="text-xs text-gray-600">1ª: {r.tentativa_1 || '-'}</p>
                    <p className="text-xs text-gray-600">2ª: {r.tentativa_2 || '-'}</p>
                    <p className="text-xs text-gray-600">3ª: {r.tentativa_3 || '-'}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="text-gray-700">{r.tipo ?? '-'}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="max-w-[220px] px-4 py-4 align-top">
                    <p className="text-sm text-gray-700">{r.pendencia_recusa || '-'}</p>
                    {r.obs && <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">OBS: {r.obs}</p>}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => startEdit(r)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(r.id)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="py-12 text-center text-gray-400">Nenhum registro encontrado. Crie o primeiro com "+ NOVO CADASTRO".</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 px-4 py-2 text-right text-xs text-gray-400">{filtered.length} registro(s)</div>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F47920]">Setor de Cadastro / GRIS</p>
                <h3 className="text-lg font-bold text-gray-900">{editing ? 'Editar Cadastro' : 'Novo Cadastro'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
              {FORM_FIELDS.map(col => (
                <div key={col.key} className={col.span ? 'col-span-2' : ''}>
                  <label className="mb-1 block text-xs font-medium text-gray-600">{col.label}</label>
                  <input
                    type={col.type ?? 'text'}
                    value={form[col.key] ?? ''}
                    onChange={e => setForm({ ...form, [col.key]: e.target.value })}
                    className={inputCls}
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                <select value={form.status ?? 'Andamento'} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                  <option>Andamento</option>
                  <option>Validado</option>
                  <option>Pendência</option>
                  <option>Recusado</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={save} className="flex items-center gap-1.5 rounded-lg bg-[#F47920] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d96a15]"><Save className="h-4 w-4" /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
