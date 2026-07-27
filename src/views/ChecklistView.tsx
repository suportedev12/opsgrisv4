import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChecklistOperacional, Filters, UserProfile } from '@/types';
import { filterChecklists, getUniqueAtendentes } from '@/utils/filters';
import { FilterBar } from '@/components/FilterBar';
import { Pencil, Trash2, Save, X, Truck } from 'lucide-react';
import type { ReactNode } from 'react';

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: ReactNode }> = {
  'Validado':  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-300', icon: <span className="h-3 w-3 rounded-full border-2 border-emerald-500 flex items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></span> },
  'Andamento': { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-300',    icon: <span className="text-[10px]">⏱</span> },
  'Pendência': { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-300',   icon: <span className="text-[10px]">⚠</span> },
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
  protocolo: '', eta_origem: '', motorista: '', telefone: '', segundo_motorista: '',
  placa_cavalo: '', placa_carreta: '', atendente: '', obs: '', tentativa1: '',
  tentativa2: '', tentativa3: '', status: 'Andamento', pendencia: '',
  vencimento_checklist: '', horario_fim: '', semana: '',
};

function nowTime(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
}

function calcSla(inicio: string, fim: string): string {
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  let diff = (hf * 60 + mf) - (hi * 60 + mi);
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

const CLASSIFICACOES = ['Novo', 'Trativa de Pendência', 'Suspenso'] as const;
type FormType = typeof EMPTY;

const FORM_FIELDS: { key: keyof FormType; label: string; type?: string; span?: boolean }[] = [
  { key: 'mes', label: 'Mês' },
  { key: 'turno', label: 'Turno' },
  { key: 'operacao', label: 'Operação' },
  { key: 'data', label: 'Data', type: 'date' },
  { key: 'protocolo', label: 'Protocolo' },
  { key: 'eta_origem', label: 'ETA / Origem' },
  { key: 'motorista', label: 'Motorista' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'segundo_motorista', label: '2º Motorista' },
  { key: 'placa_cavalo', label: 'Placa Cavalo' },
  { key: 'placa_carreta', label: 'Placa Carreta' },
  { key: 'atendente', label: 'Atendente' },
  { key: 'vencimento_checklist', label: 'Vencimento Checklist', type: 'date' },
  { key: 'semana', label: 'Semana' },
  { key: 'pendencia', label: 'Pendência', span: true },
  { key: 'obs', label: 'OBS', span: true },
];

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#F47920] focus:outline-none focus:ring-1 focus:ring-[#F47920]/20';

interface Props {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  showNewForm?: boolean;
  onNewFormHandled?: () => void;
  canEdit?: boolean;
  profile?: UserProfile | null;
}

export function ChecklistView({ filters, onFiltersChange, showNewForm, onNewFormHandled, canEdit = true, profile }: Props) {
  const [records, setRecords] = useState<ChecklistOperacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ChecklistOperacional | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormType>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('checklist_records').select('*').order('created_at', { ascending: false });
    setRecords(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showNewForm) { startNew(); onNewFormHandled?.(); }
  }, [showNewForm]);

  const isManager = profile?.is_admin || profile?.can_manage_users;
  const scopedRecords = isManager ? records : records.filter(r => r.user_id === profile?.id || r.atendente === profile?.nome);
  const filtered = filterChecklists(scopedRecords, filters);
  const atendentes = isManager ? getUniqueAtendentes([], records) : [];
  const today = new Date().toISOString().split('T')[0];

  const save = async () => {
    const now = nowTime();
    const payload = { ...form };
    if (!editing) {
      payload.horario_inicio = now;
      payload.tentativa1 = now;
    } else {
      if (!payload.tentativa1) payload.tentativa1 = now;
      else if (!payload.tentativa2) payload.tentativa2 = now;
      else if (!payload.tentativa3) payload.tentativa3 = now;
    }
    payload.horario_fim = now;
    if (editing) {
      await supabase.from('checklist_records').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('checklist_records').insert(payload);
    }
    setShowForm(false); setEditing(null); setForm(EMPTY); await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Remover este registro?')) return;
    await supabase.from('checklist_records').delete().eq('id', id);
    await load();
  };

  const startEdit = (r: ChecklistOperacional) => {
    setEditing(r);
    const { id, user_id, created_at, sla_minutes, ...rest } = r;
    setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v ?? ''])) } as FormType);
    setShowForm(true);
  };

  const startNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };

  const fmtDate = (d: string | null) => {
    if (!d) return '-';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + 'T00:00').toLocaleDateString('pt-BR');
    return d;
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-[#F47920]" /></div>;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#F47920]">
            <Truck className="h-3.5 w-3.5" /> Setor de Gerenciamento de Risco
          </p>
          <h2 className="mt-0.5 text-2xl font-bold text-gray-900">Checklist Operacional</h2>
          <p className="mt-0.5 text-sm text-gray-500">Protocolos ETA, origens, motoristas, verificação de frota e controle de vencimentos.</p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={onFiltersChange} atendentes={atendentes} placeholder="Pesquisar por motorista, protocolo, placa..." statuses={[{ value: 'Andamento', label: 'Andamento' }, { value: 'Validado', label: 'Validado' }, { value: 'Pendência', label: 'Pendência' }]} />

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a2535] text-left text-xs font-semibold text-gray-300">
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Mês / Turno</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Operação / Classif.</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Data / ETA</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Origem & Motorista</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Placa Cavalo / Carreta</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Atendente</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Horários</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Vencimento</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Semana</th>
                {canEdit && <th className="whitespace-nowrap px-4 py-3 font-semibold">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isVencido = r.vencimento_checklist && r.vencimento_checklist < today && r.status !== 'Validado';
                return (
                  <tr key={r.id} className={`border-b border-gray-100 transition-colors hover:bg-orange-50/20 ${isVencido ? 'bg-red-50/40' : ''}`}>
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
                      {r.eta_origem && <p className="text-xs font-semibold text-[#F47920]">{r.eta_origem}</p>}
                    </td>
                    <td className="px-4 py-4 align-top min-w-[160px]">
                      <p className="font-semibold text-gray-800">{r.motorista ?? '-'}</p>
                      {r.segundo_motorista && <p className="text-xs text-gray-500">2º Mot: {r.segundo_motorista}</p>}
                      {r.telefone && <p className="text-xs text-gray-400">Tel: {r.telefone}</p>}
                    </td>
                    <td className="px-4 py-4 align-top whitespace-nowrap">
                      <p className="font-medium text-gray-800">{r.placa_cavalo ?? '-'}</p>
                      {r.placa_carreta && <p className="text-xs text-gray-500">Carreta: {r.placa_carreta}</p>}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-gray-700">{r.atendente ?? '-'}</p>
                    </td>
                    <td className="px-4 py-4 align-top whitespace-nowrap">
                      <p className="text-xs text-gray-600">H1: {r.tentativa1 || '-'}</p>
                      <p className="text-xs text-gray-600">H2: {r.tentativa2 || '-'}</p>
                      <p className="text-xs text-gray-600">H3: {r.tentativa3 || '-'}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-4 align-top whitespace-nowrap">
                      <p className={`text-sm font-medium ${isVencido ? 'text-red-500' : 'text-gray-700'}`}>{fmtDate(r.vencimento_checklist)}</p>
                      {r.horario_fim && <p className="text-xs text-gray-400">Fim: {r.horario_fim}</p>}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {r.semana && (
                        <span className="inline-block rounded-lg border border-[#F47920]/30 bg-[#F47920]/10 px-2 py-1 text-xs font-semibold text-[#F47920]">
                          {r.semana}
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => startEdit(r)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => remove(r.id)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={canEdit ? 11 : 10} className="py-12 text-center text-gray-400">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 px-4 py-2 text-right text-xs text-gray-400">{filtered.length} registro(s)</div>
      </div>

      {/* Modal form */}
      {showForm && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F47920]">Setor de Gerenciamento de Risco</p>
                <h3 className="text-lg font-bold text-gray-900">{editing ? 'Editar Checklist' : 'Novo Checklist'}</h3>
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
                <label className="mb-1 block text-xs font-medium text-gray-600">Classificação</label>
                <select value={form.classificacao ?? ''} onChange={e => setForm({ ...form, classificacao: e.target.value })} className={inputCls}>
                  <option value="">Selecione...</option>
                  {CLASSIFICACOES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                <select value={form.status ?? 'Andamento'} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                  <option>Andamento</option>
                  <option>Validado</option>
                  <option>Pendência</option>
                  <option></option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Horário 1 (auto)</label>
                <input type="time" value={form.tentativa1 ?? ''} readOnly placeholder="—" className={`${inputCls} bg-gray-50 text-gray-500`} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Horário 2 (auto)</label>
                <input type="time" value={form.tentativa2 ?? ''} readOnly placeholder="—" className={`${inputCls} bg-gray-50 text-gray-500`} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Horário 3 (auto)</label>
                <input type="time" value={form.tentativa3 ?? ''} readOnly placeholder="—" className={`${inputCls} bg-gray-50 text-gray-500`} />
              </div>
              <div className="col-span-2 md:col-span-4">
                <label className="mb-1 block text-xs font-semibold text-gray-700">SLA de Atendimento</label>
                <div className="flex gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Início</p>
                    <p className="text-sm font-semibold text-gray-800">{form.horario_inicio || '—'}</p>
                  </div>
                  <div className="flex items-center text-gray-300">→</div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Fim</p>
                    <p className="text-sm font-semibold text-gray-800">{form.horario_fim || '—'}</p>
                  </div>
                  <div className="flex items-center text-gray-300">=</div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Tempo Total</p>
                    <p className="text-sm font-semibold text-[#F47920]">{form.horario_inicio && form.horario_fim ? calcSla(form.horario_inicio, form.horario_fim) : '—'}</p>
                  </div>
                </div>
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
