import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';
import { Users, Shield, ShieldCheck, Check, X, Mail, Loader2, Save, Clock, KeyRound, Pencil, Crown } from 'lucide-react';

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#F47920] focus:outline-none focus:ring-1 focus:ring-[#F47920]/20';

interface Props {
  profile?: UserProfile | null;
}

export function OperadoresView({ profile }: Props) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNome, setInviteNome] = useState('');
  const [invitePwd, setInvitePwd] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [resetUser, setResetUser] = useState<UserProfile | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const isMaster = profile?.is_master ?? false;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('atendentes').select('*').order('created_at', { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const togglePerm = async (id: string, field: keyof UserProfile, value: boolean) => {
    setSaving(id);
    await supabase.from('atendentes').update({ [field]: value }).eq('id', id);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    setSaving(null);
  };

  const toggleActive = async (id: string, value: boolean) => {
    setSaving(id);
    await supabase.from('atendentes').update({ active: value }).eq('id', id);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, active: value } : p));
    setSaving(null);
  };

  const changeTurno = async (id: string, turno: string) => {
    setSaving(id);
    await supabase.from('atendentes').update({ turno }).eq('id', id);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, turno } : p));
    setSaving(null);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);
    try {
      await callAdminApi({ action: 'create_user', email: inviteEmail, password: invitePwd, nome: inviteNome });
      setShowInvite(false);
      setInviteEmail(''); setInviteNome(''); setInvitePwd('');
      setTimeout(() => load(), 800);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Erro ao cadastrar operador.');
    } finally {
      setInviteLoading(false);
    }
  };

  const callAdminApi = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('admin-user-management', {
      body: payload,
    });
    if (error) throw new Error(error.message ?? 'Erro na chamada à função.');
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setEditError(''); setEditLoading(true);
    try {
      if (editNome !== editUser.nome) {
        await callAdminApi({ action: 'update_name', targetUserId: editUser.id, new_name: editNome });
      }
      if (editEmail && editEmail !== editUser.email) {
        await callAdminApi({ action: 'update_email', targetUserId: editUser.id, new_email: editEmail });
      }
      setEditUser(null); setEditNome(''); setEditEmail('');
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao atualizar.');
    } finally {
      setEditLoading(false);
    }
  };

  const doResetPassword = async () => {
    if (!resetUser) return;
    setResetError(''); setResetSuccess(''); setResetLoading(true);
    if (resetPwd.length < 6) {
      setResetError('A senha deve ter no mínimo 6 caracteres.');
      setResetLoading(false);
      return;
    }
    try {
      await callAdminApi({ action: 'reset_password', targetUserId: resetUser.id, new_password: resetPwd });
      setResetSuccess('Senha alterada! O usuário deverá definir uma nova no próximo login.');
      setResetPwd('');
      await load();
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-[#F47920]" /></div>;

  const admins = profiles.filter(p => p.is_admin);
  const operators = profiles.filter(p => !p.is_admin);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#F47920]">
            <Users className="h-3.5 w-3.5" /> Gestão de Usuários
          </p>
          <h2 className="mt-0.5 text-2xl font-bold text-gray-900">Operadores & Permissões</h2>
          <p className="mt-0.5 text-sm text-gray-500">Defina quais abas cada operador pode visualizar e editar. Novos operadores começam com todas as permissões ativas.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[#F47920] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#F47920]/20 transition-colors hover:bg-[#d96a15]"
        >
          <Users className="h-4 w-4" /> + NOVO OPERADOR
        </button>
      </div>

      {isMaster && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          <Crown className="h-4 w-4 shrink-0" />
          <span>Você é o <strong>Administrador Master</strong>. Pode editar nomes, emails e redefinir senhas de qualquer conta.</span>
        </div>
      )}

      {admins.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <ShieldCheck className="h-4 w-4 text-[#F47920]" /> Administradores / Gerentes
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {admins.map(p => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F47920]/15 text-sm font-bold text-[#F47920]">
                  {p.nome?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">{p.nome}</p>
                  <p className="truncate text-xs text-gray-500">{p.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  {p.is_master && <span className="flex items-center gap-0.5 rounded border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700"><Crown className="h-2.5 w-2.5" />Master</span>}
                  {!p.is_master && <span className="rounded border border-[#F47920]/30 bg-[#F47920]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#F47920]">Admin</span>}
                  {isMaster && !p.is_master && (
                    <button onClick={() => { setEditUser(p); setEditNome(p.nome ?? ''); setEditEmail(p.email ?? ''); }} className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"><Pencil className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Shield className="h-4 w-4 text-gray-400" /> Operadores
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">Marque ou desmarque para controlar o acesso de cada operador às abas do sistema.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3 font-semibold">Operador</th>
                <th className="px-5 py-3 text-center font-semibold">Ver Dashboard</th>
                <th className="px-5 py-3 text-center font-semibold">Ação Cadastro</th>
                <th className="px-5 py-3 text-center font-semibold">Ação Checklist</th>
                <th className="px-5 py-3 text-center font-semibold">Gerenciar Usuários</th>
                <th className="px-5 py-3 text-center font-semibold">Turno</th>
                <th className="px-5 py-3 text-center font-semibold">Ativo</th>
                {isMaster && <th className="px-5 py-3 text-center font-semibold">Master</th>}
              </tr>
            </thead>
            <tbody>
              {operators.map(p => (
                <tr key={p.id} className={`border-b border-gray-50 transition-colors hover:bg-orange-50/20 ${p.must_change_password ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${p.active ? 'bg-[#F47920]/15 text-[#F47920]' : 'bg-gray-100 text-gray-400'}`}>
                        {p.nome?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{p.nome}</p>
                        <p className="flex items-center gap-1 text-xs text-gray-500"><Mail className="h-3 w-3" />{p.email}</p>
                        {p.must_change_password && <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-amber-600"><Clock className="h-2.5 w-2.5" />Senha pendente</p>}
                      </div>
                    </div>
                  </td>
                  {(['can_view_dashboard', 'can_add_cadastro', 'can_add_checklist', 'can_manage_users'] as const).map(field => (
                    <td key={field} className="px-5 py-4 text-center">
                      <ToggleSwitch checked={p[field] as boolean} disabled={saving === p.id} onChange={() => togglePerm(p.id, field, !p[field])} />
                    </td>
                  ))}
                  <td className="px-5 py-4 text-center">
                    <select value={p.turno ?? ''} disabled={saving === p.id} onChange={e => changeTurno(p.id, e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-[#F47920] focus:outline-none disabled:opacity-50">
                      <option value="">—</option>
                      <option value="T1">T1</option>
                      <option value="T2">T2</option>
                      <option value="T3">T3</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <ToggleSwitch checked={p.active} disabled={saving === p.id} onChange={() => toggleActive(p.id, !p.active)} />
                  </td>
                  {isMaster && (
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => { setEditUser(p); setEditNome(p.nome ?? ''); setEditEmail(p.email ?? ''); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" title="Editar nome/email"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => { setResetUser(p); setResetPwd(''); setResetError(''); setResetSuccess(''); }} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600" title="Redefinir senha"><KeyRound className="h-4 w-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {operators.length === 0 && (
                <tr><td colSpan={isMaster ? 8 : 7} className="py-12 text-center text-gray-400">Nenhum operador cadastrado. Use "+ NOVO OPERADOR" para adicionar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">Novo Operador</h3>
              <button onClick={() => setShowInvite(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nome completo</label>
                <input value={inviteNome} onChange={e => setInviteNome(e.target.value)} required placeholder="Nome do operador" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="operador@email.com" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Senha temporária</label>
                <input type="password" value={invitePwd} onChange={e => setInvitePwd(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" className={inputCls} />
                <p className="mt-1 text-[11px] text-gray-400">O usuário será obrigado a trocar esta senha no primeiro login.</p>
              </div>
              {inviteError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{inviteError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowInvite(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={inviteLoading} className="flex items-center gap-1.5 rounded-lg bg-[#F47920] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d96a15] disabled:opacity-60">
                  {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Cadastrar Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit name/email modal (master only) */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Editar Conta</h3>
                <p className="text-xs text-gray-400">Alteração de nome e email — exclusivo do administrador master.</p>
              </div>
              <button onClick={() => setEditUser(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nome</label>
                <input value={editNome} onChange={e => setEditNome(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inputCls} />
              </div>
              {editError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{editError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditUser(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="button" onClick={saveEdit} disabled={editLoading} className="flex items-center gap-1.5 rounded-lg bg-[#F47920] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d96a15] disabled:opacity-60">
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset password modal (master only) */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Redefinir Senha</h3>
                <p className="text-xs text-gray-400">Defina uma nova senha para <strong>{resetUser.nome}</strong>. O usuário será obrigado a trocá-la no próximo login.</p>
              </div>
              <button onClick={() => setResetUser(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nova senha temporária</label>
                <input type="password" value={resetPwd} onChange={e => setResetPwd(e.target.value)} minLength={6} placeholder="Mínimo 6 caracteres" className={inputCls} />
              </div>
              {resetError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{resetError}</p>}
              {resetSuccess && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-600">{resetSuccess}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setResetUser(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">{resetSuccess ? 'Fechar' : 'Cancelar'}</button>
                {!resetSuccess && (
                  <button type="button" onClick={doResetPassword} disabled={resetLoading} className="flex items-center gap-1.5 rounded-lg bg-[#F47920] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d96a15] disabled:opacity-60">
                    {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Redefinir Senha
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button onClick={onChange} disabled={disabled} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-[#F47920]' : 'bg-gray-200'}`}>
      <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}>
        {checked ? <Check className="h-3 w-3 text-[#F47920]" /> : <X className="h-3 w-3 text-gray-400" />}
      </span>
    </button>
  );
}
