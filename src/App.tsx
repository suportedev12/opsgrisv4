import { useState, useMemo } from 'react';
import { LayoutDashboard, FileCheck, Truck, TrendingUp, Plus, Users, LogOut, ShieldCheck, Menu, X, ChevronRight, Target } from 'lucide-react';
import type { ActiveTab, Filters } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Login } from '@/views/Login';
import { Dashboard } from '@/views/Dashboard';
import { CadastroRealizadoView } from '@/views/CadastroRealizadoView';
import { ChecklistView } from '@/views/ChecklistView';
import { PerformanceView } from '@/views/PerformanceView';
import { OperadoresView } from '@/views/OperadoresView';
import { MetasView } from '@/views/MetasView';

const EMPTY_FILTERS: Filters = { turno: '', atendente: '', status: '', dataInicio: '', dataFim: '', search: '' };

function App() {
  const { session, profile, loading, signOut } = useAuth();
  const [active, setActive] = useState<ActiveTab>('dashboard');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [newTrigger, setNewTrigger] = useState(0);
  const [newHandled, setNewHandled] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ─── Build tab list based on profile permissions ─── */
  const tabs = useMemo(() => {
    if (!profile) return [];
    const isManager = profile.is_admin || profile.can_manage_users;
    const list: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [];

    if (isManager || profile.can_view_dashboard) {
      list.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
    }
    if (isManager || profile.can_add_cadastro) {
      list.push({ id: 'cadastro', label: 'Cadastro Realizado', icon: FileCheck });
    }
    if (isManager || profile.can_add_checklist) {
      list.push({ id: 'checklist', label: 'Checklist', icon: Truck });
    }
    if (isManager) {
      list.push({ id: 'performance', label: 'Performance', icon: TrendingUp });
      list.push({ id: 'metas', label: 'Metas', icon: Target });
      list.push({ id: 'operadores', label: 'Operadores', icon: Users });
    }
    return list;
  }, [profile]);

  const allowedTabs = tabs.map(t => t.id);
  const effectiveActive = allowedTabs.includes(active) ? active : allowedTabs[0];
  const isManager = profile?.is_admin || profile?.can_manage_users;

  const activeTabMeta = tabs.find(t => t.id === effectiveActive);

  const handleNew = () => {
    if (effectiveActive === 'cadastro' || effectiveActive === 'checklist') {
      setNewTrigger(t => t + 1);
    } else {
      const firstEdit = allowedTabs.find(t => t === 'cadastro' || t === 'checklist');
      if (firstEdit) { setActive(firstEdit); setNewTrigger(t => t + 1); }
    }
  };

  const handleNavClick = (id: ActiveTab) => {
    setActive(id);
    setSidebarOpen(false);
  };

  const showNewForm = newTrigger > newHandled;
  const canEditCadastro = isManager || profile?.can_add_cadastro;
  const canEditChecklist = isManager || profile?.can_add_checklist;

  /* ─── Auth gate ─── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1923]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-[#F47920]" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      {/* ═══════════════════════════════════════ */}
      {/* Mobile overlay */}
      {/* ═══════════════════════════════════════ */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ═══════════════════════════════════════ */}
      {/* SIDEBAR (left) */}
      {/* ═══════════════════════════════════════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#0f1923] transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 overflow-hidden shrink-0">
            <img src="/losung copy.png" alt="Lösung Express" className="h-8 w-auto object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-wide text-white">OPS GRIS</span>
              <span className="rounded border border-[#F47920]/40 bg-[#F47920]/15 px-1 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#F47920]">Torre</span>
            </div>
            <p className="truncate text-[10px] text-gray-500">Gerenciamento de Risco</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto rounded p-1 text-gray-400 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Menu</p>
          <ul className="space-y-1">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = effectiveActive === t.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => handleNavClick(t.id)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#F47920] text-white shadow-sm shadow-[#F47920]/20'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                    <span className="flex-1 text-left">{t.label}</span>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/70" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile + logout (bottom) */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F47920]/15 text-sm font-bold text-[#F47920]">
              {profile?.nome?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white leading-tight">{profile?.nome ?? 'Usuário'}</p>
              <p className="truncate text-[10px] text-gray-400 leading-tight">{isManager ? 'Gerente / Admin' : 'Operador'}</p>
            </div>
            <button
              onClick={signOut}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#F47920]/70">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F47920]" /> Conectado ao Supabase
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════ */}
      {/* MAIN AREA (right of sidebar) */}
      {/* ═══════════════════════════════════════ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Slim top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm lg:px-6">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Current page title */}
          <div className="flex items-center gap-2 min-w-0">
            {activeTabMeta && (
              <>
                <activeTabMeta.icon className="h-4 w-4 shrink-0 text-[#F47920]" />
                <h1 className="truncate text-sm font-bold text-gray-800 sm:text-base">{activeTabMeta.label}</h1>
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-2">
            {canEditCadastro || canEditChecklist ? (
              <button
                onClick={handleNew}
                className="flex items-center gap-1.5 rounded-lg bg-[#F47920] px-3 py-2 text-xs font-bold text-white shadow-md shadow-[#F47920]/20 transition-colors hover:bg-[#d96a15]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Novo Registro</span>
              </button>
            ) : null}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">
          <div className="mx-auto max-w-[1280px]">
            {effectiveActive === 'dashboard' && (isManager || profile?.can_view_dashboard) && (
              <Dashboard filters={filters} onFiltersChange={setFilters} onNavigate={(tab) => setActive(tab)} profile={profile} isManager={isManager} />
            )}
            {effectiveActive === 'cadastro' && (isManager || profile?.can_add_cadastro) && (
              <CadastroRealizadoView
                filters={filters}
                onFiltersChange={setFilters}
                showNewForm={showNewForm && effectiveActive === 'cadastro'}
                onNewFormHandled={() => setNewHandled(t => t + 1)}
                canEdit={!!canEditCadastro}
                profile={profile}
              />
            )}
            {effectiveActive === 'checklist' && (isManager || profile?.can_add_checklist) && (
              <ChecklistView
                filters={filters}
                onFiltersChange={setFilters}
                showNewForm={showNewForm && effectiveActive === 'checklist'}
                onNewFormHandled={() => setNewHandled(t => t + 1)}
                canEdit={!!canEditChecklist}
                profile={profile}
              />
            )}
            {effectiveActive === 'performance' && isManager && (
              <PerformanceView filters={filters} onFiltersChange={setFilters} />
            )}
            {effectiveActive === 'metas' && isManager && (
              <MetasView profile={profile} />
            )}
            {effectiveActive === 'operadores' && isManager && (
              <OperadoresView />
            )}

            {tabs.length === 0 && (
              <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                  <ShieldCheck className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-700">Aguardando permissões</h3>
                  <p className="mt-1 text-sm text-gray-500">Um gerente precisa liberar o acesso às abas do sistema.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
