import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Meta, UserProfile } from '@/types';
import { Target, Plus, Pencil, Trash2, Save, X, Trophy, Users, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
}

const EMPTY_FORM = {
  id: null as string | null,
  tipo_periodo: 'semana' as 'semana' | 'mes',
  periodo_referencia: '',
  titulo: '',
  descricao: '',
  valor_alvo: 0,
  user_id: '' as string,
  ativo: true,
};

function getCurrentWeekRef(): string {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const week = Math.ceil((diff + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function getCurrentMonthRef(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function MetasView({ profile }: Props) {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [operadores, setOperadores] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Meta | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [metasRes, opsRes] = await Promise.all([
      supabase.from('metas').select('*').order('created_at', { ascending: false }),
      supabase.from('atendentes').select('*').order('nome', { ascending: true }),
    ]);
    if (metasRes.data) setMetas(metasRes.data as Meta[]);
    if (opsRes.data) setOperadores(opsRes.data as UserProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const startNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, periodo_referencia: getCurrentWeekRef() });
    setShowForm(true);
    setFormError(null);
  };

  const startEdit = (m: Meta) => {
    setEditing(m);
    setForm({
      id: m.id,
      tipo_periodo: m.tipo_periodo,
      periodo_referencia: m.periodo_referencia,
      titulo: m.titulo,
      descricao: m.descricao ?? '',
      valor_alvo: m.valor_alvo,
      user_id: m.user_id ?? '',
      ativo: m.ativo,
    });
    setShowForm(true);
    setFormError(null);
  };

  const save = async () => {
    if (!form.titulo.trim()) { setFormError('Informe um título para a meta.'); return; }
    if (form.valor_alvo <= 0) { setFormError('O valor alvo deve ser maior que zero.'); return; }
    if (!form.periodo_referencia.trim()) { setFormError('Informe o período de referência.'); return; }

    setSaving(true);
    setFormError(null);

    const payload = {
      tipo_periodo: form.tipo_periodo,
      periodo_referencia: form.periodo_referencia,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      valor_alvo: form.valor_alvo,
      user_id: form.user_id || null,
      ativo: form.ativo,
      created_by: profile?.id ?? null,
    };

    try {
      let result;
      if (editing) {
        result = await supabase.from('metas').update(payload).eq('id', editing.id);
      } else {
        result = await supabase.from('metas').insert(payload);
      }
      if (result.error) {
        setFormError(`Erro ao salvar: ${result.error.message}`);
        setSaving(false);
        return;
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await load();
      showToast(editing ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro inesperado ao salvar');
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('metas').delete().eq('id', id);
    if (error) {
      showToast(`Erro: ${error.message}`);
    } else {
      await load();
      showToast('Meta removida.');
    }
    setDeleteId(null);
  };

  const getOperadorNome = (userId: string | null) => {
    if (!userId) return 'Todos os operadores';
    const op = operadores.find(o => o.id === userId);
    return op?.nome ?? 'Operador';
  };

  const activeMetas = metas.filter(m => m.ativo);
  const inactiveMetas = metas.filter(m => !m.ativo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Metas de Produtividade</h2>
          <p className="text-sm text-gray-500">Defina metas semanais ou mensais para bonificar operadores destaque.</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 rounded-lg bg-[#F47920] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#F47920]/20 transition-colors hover:bg-[#d96a15]"
        >
          <Plus className="h-4 w-4" /> Nova Meta
        </button>
      </div>

      {!loading && metas.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Target className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Metas Ativas</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-800">{activeMetas.length}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Metas Gerais</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-800">{activeMetas.filter(m => !m.user_id).length}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Metas Individuais</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-800">{activeMetas.filter(m => m.user_id).length}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#F47920]" />
        </div>
      )}

      {!loading && metas.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-white">
          <div className="text-center">
            <Target className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-base font-semibold text-gray-700">Nenhuma meta definida</h3>
            <p className="mt-1 text-sm text-gray-500">Clique em "Nova Meta" para criar a primeira meta de produtividade.</p>
          </div>
        </div>
      )}

      {!loading && activeMetas.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-gray-700">Metas Ativas</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeMetas.map(m => (
              <div key={m.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${m.tipo_periodo === 'semana' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {m.tipo_periodo === 'semana' ? 'Semanal' : 'Mensal'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                        <Calendar className="h-3 w-3" /> {m.periodo_referencia}
                      </span>
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-gray-800">{m.titulo}</h4>
                    {m.descricao && <p className="mt-1 text-xs text-gray-500">{m.descricao}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-[#F47920]" />
                        <span className="text-xs font-semibold text-gray-600">Meta: <span className="text-[#F47920]">{m.valor_alvo}</span> registros</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">{getOperadorNome(m.user_id)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => startEdit(m)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(m.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && inactiveMetas.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-gray-400">Metas Inativas</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {inactiveMetas.map(m => (
              <div key={m.id} className="rounded-xl border border-gray-100 bg-gray-50 p-5 opacity-60">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        {m.tipo_periodo === 'semana' ? 'Semanal' : 'Mensal'}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400">{m.periodo_referencia}</span>
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-gray-600">{m.titulo}</h4>
                    <p className="mt-1 text-xs text-gray-400">Meta: {m.valor_alvo} registros - {getOperadorNome(m.user_id)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => startEdit(m)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(m.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-bold text-gray-800">{editing ? 'Editar Meta' : 'Nova Meta'}</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Tipo de Período</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm(f => ({ ...f, tipo_periodo: 'semana', periodo_referencia: getCurrentWeekRef() }))}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${form.tipo_periodo === 'semana' ? 'border-[#F47920] bg-[#F47920]/5 text-[#F47920]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, tipo_periodo: 'mes', periodo_referencia: getCurrentMonthRef() }))}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${form.tipo_periodo === 'mes' ? 'border-[#F47920] bg-[#F47920]/5 text-[#F47920]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Mensal
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Período de Referência</label>
                <input
                  type="text"
                  value={form.periodo_referencia}
                  onChange={e => setForm(f => ({ ...f, periodo_referencia: e.target.value }))}
                  placeholder={form.tipo_periodo === 'semana' ? '2026-W30' : '2026-07'}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#F47920] focus:outline-none focus:ring-1 focus:ring-[#F47920]"
                />
                <p className="mt-1 text-[10px] text-gray-400">{form.tipo_periodo === 'semana' ? 'Formato: AAAA-WNN (ex: 2026-W30)' : 'Formato: AAAA-MM (ex: 2026-07)'}</p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Título da Meta *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ex: Meta de Cadastros - Semana 30"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#F47920] focus:outline-none focus:ring-1 focus:ring-[#F47920]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Descrição / Bonificação</label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Ex: Operador que atingir a meta recebe bonificação no valor de R$ 200,00"
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#F47920] focus:outline-none focus:ring-1 focus:ring-[#F47920]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Valor Alvo (nº de registros) *</label>
                <input
                  type="number"
                  value={form.valor_alvo || ''}
                  onChange={e => setForm(f => ({ ...f, valor_alvo: parseInt(e.target.value) || 0 }))}
                  min={0}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#F47920] focus:outline-none focus:ring-1 focus:ring-[#F47920]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Operador</label>
                <select
                  value={form.user_id}
                  onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#F47920] focus:outline-none focus:ring-1 focus:ring-[#F47920]"
                >
                  <option value="">Todos os operadores (meta geral)</option>
                  {operadores.filter(o => o.active).map(op => (
                    <option key={op.id} value={op.id}>{op.nome}</option>
                  ))}
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#F47920] focus:ring-[#F47920]"
                />
                <span className="text-sm text-gray-600">Meta ativa (visível para os operadores)</span>
              </label>
            </div>

            {formError && (
              <div className="mx-6 mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-[#F47920] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d96a15] disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">Excluir meta?</h3>
                <p className="text-xs text-gray-500">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => remove(deleteId)} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}
    </div>
  );
}
