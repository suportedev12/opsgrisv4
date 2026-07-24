import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CadastroRealizado, ChecklistOperacional, OperatorTab } from '@/types';
import { FileCheck, Truck, Plus, Save, Trash2, X, Check } from 'lucide-react';

type CadastroForm = Omit<CadastroRealizado, 'id' | 'created_at' | 'updated_at'>;
type ChecklistForm = Omit<ChecklistOperacional, 'id' | 'created_at' | 'updated_at'>;

const EMPTY_CAD: CadastroForm = {
  mes: '', turno: '', operacao: '', classificacao: '', data: '', horario_inicio: '',
  pis: '', motorista: '', placa_cavalo: '', tipo_veiculo: '', ano_cavalo: '',
  placa_carreta: '', ano_carreta: '', atendente: '', tentativa_1: '', tentativa_2: '',
  tentativa_3: '', tipo: '', status: 'Andamento', pendencia_recusa: '', horario_fim: '', obs: '',
};

const EMPTY_CHK: ChecklistForm = {
  mes: '', turno: '', operacao: '', classificacao: '', data: '', horario_inicio: '',
  protocolo: '', eta: '', origem: '', motorista: '', telefone: '', motorista_2: '',
  placa_cavalo: '', placa_carreta: '', atendente: '', obs: '', tentativa_1: '',
  tentativa_2: '', tentativa_3: '', status: 'Andamento', vencimento_checklist: '',
  horario_fim: '', semana: '',
};

const CAD_COLS: { key: keyof CadastroForm; label: string; type?: string }[] = [
  { key: 'mes', label: 'Mês' },
  { key: 'turno', label: 'Turno' },
  { key: 'operacao', label: 'Operação' },
  { key: 'classificacao', label: 'Classificação' },
  { key: 'data', label: 'Data', type: 'date' },
  { key: 'horario_inicio', label: 'Início', type: 'time' },
  { key: 'pis', label: 'PIS' },
  { key: 'motorista', label: 'Motorista' },
  { key: 'placa_cavalo', label: 'Placa Cavalo' },
  { key: 'tipo_veiculo', label: 'Tipo' },
  { key: 'ano_cavalo', label: 'Ano Cavalo' },
  { key: 'placa_carreta', label: 'Placa Carreta' },
  { key: 'ano_carreta', label: 'Ano Carreta' },
  { key: 'atendente', label: 'Atendente' },
  { key: 'tentativa_1', label: '1ª' },
  { key: 'tentativa_2', label: '2ª' },
  { key: 'tentativa_3', label: '3ª' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'pendencia_recusa', label: 'Pendência/Recusa' },
  { key: 'horario_fim', label: 'Fim', type: 'time' },
  { key: 'obs', label: 'OBS' },
];

const CAD_STATUS = ['Andamento', 'Validado', 'Pendência', 'Recusado'] as const;

const CHK_COLS: { key: keyof ChecklistForm; label: string; type?: string }[] = [
  { key: 'mes', label: 'Mês' },
  { key: 'turno', label: 'Turno' },
  { key: 'operacao', label: 'Operação' },
  { key: 'classificacao', label: 'Classificação' },
  { key: 'data', label: 'Data', type: 'date' },
  { key: 'horario_inicio', label: 'Início', type: 'time' },
  { key: 'protocolo', label: 'Protocolo' },
  { key: 'eta', label: 'ETA' },
  { key: 'origem', label: 'Origem' },
  { key: 'motorista', label: 'Motorista' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'motorista_2', label: '2º Motorista' },
  { key: 'placa_cavalo', label: 'Placa Cavalo' },
  { key: 'placa_carreta', label: 'Placa Carreta' },
  { key: 'atendente', label: 'Atendente' },
  { key: 'tentativa_1', label: '1ª' },
  { key: 'tentativa_2', label: '2ª' },
  { key: 'tentativa_3', label: '3ª' },
  { key: 'vencimento_checklist', label: 'Vencimento', type: 'date' },
  { key: 'horario_fim', label: 'Fim', type: 'time' },
  { key: 'semana', label: 'Semana' },
  { key: 'obs', label: 'OBS' },
];

const CHK_STATUS = ['Andamento', 'Validado', 'Pendência'] as const;

const STATUS_COLORS: Record<string, string> = {
  'Validado': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Pendência': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Recusado': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Andamento': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

function inputClass() {
  return 'w-full rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs text-white focus:border-[#F47920]/50 focus:outline-none';
}

/* ===================== CADASTRO TABLE ===================== */
function CadastroTable() {
  const [records, setRecords] = useState<CadastroRealizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRow, setNewRow] = useState<CadastroForm>(EMPTY_CAD);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CadastroForm>(EMPTY_CAD);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('cadastro_realizado').select('*').order('created_at', { ascending: false });
    setRecords(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addRow = async () => {
    await supabase.from('cadastro_realizado').insert(newRow);
    setNewRow(EMPTY_CAD);
    await load();
  };

  const startEdit = (r: CadastroRealizado) => {
    setEditingId(r.id);
    const { id, created_at, updated_at, ...rest } = r;
    setEditForm(rest);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from('cadastro_realizado').update({ ...editForm, updated_at: new Date().toISOString() }).eq('id', editingId);
    setEditingId(null);
    setEditForm(EMPTY_CAD);
    await load();
  };

  const remove = async (id: string) => {
    await supabase.from('cadastro_realizado').delete().eq('id', id);
    await load();
  };

  if (loading) return <div className="flex h-40 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-[#F47920]" /></div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#0f1117]/80">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800/60 text-left text-[10px] uppercase tracking-wider text-slate-500">
            {CAD_COLS.map(c => <th key={c.key} className="whitespace-nowrap px-2 py-2 font-medium">{c.label}</th>)}
            <th className="px-2 py-2 font-medium">Status</th>
            <th className="px-2 py-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {/* New row */}
          <tr className="border-b border-slate-800/40 bg-[#F47920]/[0.03]">
            {CAD_COLS.map(c => (
              <td key={c.key} className="px-1 py-1">
                <input
                  type={c.type ?? 'text'}
                  value={newRow[c.key] ?? ''}
                  onChange={e => setNewRow({ ...newRow, [c.key]: e.target.value })}
                  className={inputClass()}
                  placeholder={c.label}
                />
              </td>
            ))}
            <td className="px-1 py-1">
              <select
                value={newRow.status ?? 'Andamento'}
                onChange={e => setNewRow({ ...newRow, status: e.target.value })}
                className={inputClass()}
              >
                {CAD_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </td>
            <td className="px-2 py-1">
              <button onClick={addRow} className="flex items-center gap-1 rounded-md bg-[#F47920] px-2 py-1 text-xs font-medium text-white hover:bg-[#d96a15]">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </td>
          </tr>

          {/* Existing rows */}
          {records.map(r => {
            const isEditing = editingId === r.id;
            const form = isEditing ? editForm : r;
            return (
              <tr key={r.id} className={`border-b border-slate-800/40 transition-colors ${isEditing ? 'bg-[#F47920]/[0.06]' : 'hover:bg-slate-800/30'}`}>
                {CAD_COLS.map(c => (
                  <td key={c.key} className="px-1 py-1">
                    {isEditing ? (
                      <input
                        type={c.type ?? 'text'}
                        value={editForm[c.key] ?? ''}
                        onChange={e => setEditForm({ ...editForm, [c.key]: e.target.value })}
                        className={inputClass()}
                      />
                    ) : (
                      <span className="block whitespace-nowrap px-1 text-xs text-slate-300">
                        {c.type === 'date' && form[c.key]
                          ? new Date(form[c.key] as string + 'T00:00').toLocaleDateString('pt-BR')
                          : (form[c.key] as string) || '-'}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-1 py-1">
                  {isEditing ? (
                    <select
                      value={editForm.status ?? 'Andamento'}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      className={inputClass()}
                    >
                      {CAD_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    r.status && <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[r.status] ?? 'border-slate-700 text-slate-400'}`}>{r.status}</span>
                  )}
                </td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button onClick={saveEdit} className="rounded p-1 text-emerald-400 hover:bg-emerald-500/20"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="rounded p-1 text-slate-400 hover:bg-slate-700"><X className="h-3.5 w-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(r)} className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><Save className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(r.id)} className="rounded p-1 text-slate-400 hover:bg-red-500/20 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {records.length === 0 && (
            <tr><td colSpan={CAD_COLS.length + 2} className="py-6 text-center text-xs text-slate-500">Nenhum registro. Preencha a primeira linha e clique em Add.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ===================== CHECKLIST TABLE ===================== */
function ChecklistTable() {
  const [records, setRecords] = useState<ChecklistOperacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRow, setNewRow] = useState<ChecklistForm>(EMPTY_CHK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ChecklistForm>(EMPTY_CHK);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('checklist_operacional').select('*').order('created_at', { ascending: false });
    setRecords(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addRow = async () => {
    await supabase.from('checklist_operacional').insert(newRow);
    setNewRow(EMPTY_CHK);
    await load();
  };

  const startEdit = (r: ChecklistOperacional) => {
    setEditingId(r.id);
    const { id, created_at, updated_at, ...rest } = r;
    setEditForm(rest);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from('checklist_operacional').update({ ...editForm, updated_at: new Date().toISOString() }).eq('id', editingId);
    setEditingId(null);
    setEditForm(EMPTY_CHK);
    await load();
  };

  const remove = async (id: string) => {
    await supabase.from('checklist_operacional').delete().eq('id', id);
    await load();
  };

  if (loading) return <div className="flex h-40 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-[#F47920]" /></div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#0f1117]/80">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800/60 text-left text-[10px] uppercase tracking-wider text-slate-500">
            {CHK_COLS.map(c => <th key={c.key} className="whitespace-nowrap px-2 py-2 font-medium">{c.label}</th>)}
            <th className="px-2 py-2 font-medium">Status</th>
            <th className="px-2 py-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {/* New row */}
          <tr className="border-b border-slate-800/40 bg-[#F47920]/[0.03]">
            {CHK_COLS.map(c => (
              <td key={c.key} className="px-1 py-1">
                <input
                  type={c.type ?? 'text'}
                  value={newRow[c.key] ?? ''}
                  onChange={e => setNewRow({ ...newRow, [c.key]: e.target.value })}
                  className={inputClass()}
                  placeholder={c.label}
                />
              </td>
            ))}
            <td className="px-1 py-1">
              <select
                value={newRow.status ?? 'Andamento'}
                onChange={e => setNewRow({ ...newRow, status: e.target.value })}
                className={inputClass()}
              >
                {CHK_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </td>
            <td className="px-2 py-1">
              <button onClick={addRow} className="flex items-center gap-1 rounded-md bg-[#F47920] px-2 py-1 text-xs font-medium text-white hover:bg-[#d96a15]">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </td>
          </tr>

          {/* Existing rows */}
          {records.map(r => {
            const isEditing = editingId === r.id;
            const form = isEditing ? editForm : r;
            return (
              <tr key={r.id} className={`border-b border-slate-800/40 transition-colors ${isEditing ? 'bg-[#F47920]/[0.06]' : 'hover:bg-slate-800/30'}`}>
                {CHK_COLS.map(c => (
                  <td key={c.key} className="px-1 py-1">
                    {isEditing ? (
                      <input
                        type={c.type ?? 'text'}
                        value={editForm[c.key] ?? ''}
                        onChange={e => setEditForm({ ...editForm, [c.key]: e.target.value })}
                        className={inputClass()}
                      />
                    ) : (
                      <span className="block whitespace-nowrap px-1 text-xs text-slate-300">
                        {c.type === 'date' && form[c.key]
                          ? new Date(form[c.key] as string + 'T00:00').toLocaleDateString('pt-BR')
                          : (form[c.key] as string) || '-'}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-1 py-1">
                  {isEditing ? (
                    <select
                      value={editForm.status ?? 'Andamento'}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      className={inputClass()}
                    >
                      {CHK_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    r.status && <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[r.status] ?? 'border-slate-700 text-slate-400'}`}>{r.status}</span>
                  )}
                </td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button onClick={saveEdit} className="rounded p-1 text-emerald-400 hover:bg-emerald-500/20"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="rounded p-1 text-slate-400 hover:bg-slate-700"><X className="h-3.5 w-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(r)} className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"><Save className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(r.id)} className="rounded p-1 text-slate-400 hover:bg-red-500/20 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {records.length === 0 && (
            <tr><td colSpan={CHK_COLS.length + 2} className="py-6 text-center text-xs text-slate-500">Nenhum registro. Preencha a primeira linha e clique em Add.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ===================== OPERATOR PANEL ===================== */
const TABS: { id: OperatorTab; label: string; icon: typeof FileCheck }[] = [
  { id: 'cadastro', label: 'Cadastro Realizado', icon: FileCheck },
  { id: 'checklist', label: 'Checklist', icon: Truck },
];

export function OperatorPanel() {
  const [tab, setTab] = useState<OperatorTab>('cadastro');

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-2">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${active ? 'bg-[#F47920] text-white shadow-lg shadow-[#F47920]/20' : 'border border-slate-800 bg-[#0f1117]/80 text-slate-400 hover:text-slate-200'}`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-[#0f1117]/80 px-4 py-2.5 text-xs text-slate-400">
        <div className="h-1.5 w-1.5 rounded-full bg-[#F47920]" />
        Preencha a primeira linha com os dados e clique em <span className="font-semibold text-[#F47920]">Add</span> para registrar. Use os ícones à direita para editar ou excluir linhas existentes.
      </div>

      {tab === 'cadastro' && <CadastroTable />}
      {tab === 'checklist' && <ChecklistTable />}
    </div>
  );
}
