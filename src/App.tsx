import { useState } from 'react';
import { LayoutDashboard, FileCheck, Truck, TrendingUp, Plus, Download, User, Wrench } from 'lucide-react';
import type { ActiveTab, Filters, Role } from '@/types';
import { Dashboard } from '@/views/Dashboard';
import { CadastroRealizadoView } from '@/views/CadastroRealizadoView';
import { ChecklistView } from '@/views/ChecklistView';
import { PerformanceView } from '@/views/PerformanceView';

const MANAGER_TABS: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cadastro', label: 'Cadastro Realizado', icon: FileCheck },
  { id: 'checklist', label: 'Checklist', icon: Truck },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
];

const OPERATOR_TABS: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'cadastro', label: 'Cadastro Realizado', icon: FileCheck },
  { id: 'checklist', label: 'Checklist', icon: Truck },
];

const EMPTY_FILTERS: Filters = { turno: '', atendente: '', status: '', dataInicio: '', dataFim: '', search: '' };

function App() {
  const [role, setRole] = useState<Role>('gerente');
  const [active, setActive] = useState<ActiveTab>('dashboard');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [newTrigger, setNewTrigger] = useState(0);
  const [newHandled, setNewHandled] = useState(0);

  const tabs = role === 'gerente' ? MANAGER_TABS : OPERATOR_TABS;

  const handleRoleChange = (r: Role) => {
    setRole(r);
    if (r === 'operador' && active === 'dashboard') setActive('cadastro');
    if (r === 'operador' && active === 'performance') setActive('cadastro');
  };

  const handleNew = () => {
    if (active === 'dashboard' || active === 'performance') setActive('cadastro');
    setNewTrigger(t => t + 1);
  };

  const showNewForm = newTrigger > newHandled;

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 bg-[#0f1923] shadow-lg">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 overflow-hidden">
              <img src="/losung.png" alt="Lösung Express" className="h-8 w-auto object-contain" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wide text-white">OPS GRIS</span>
                <span className="rounded border border-[#F47920]/40 bg-[#F47920]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#F47920]">Torre de Controle</span>
              </div>
              <p className="text-[10px] text-gray-500">Setor de Gerenciamento de Risco e Cadastros</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="mx-3 flex items-center gap-0.5 overflow-x-auto">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${isActive ? 'bg-[#F47920] text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{t.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {/* Export placeholder */}
            {(active === 'cadastro' || active === 'checklist') && (
              <button className="hidden items-center gap-1.5 rounded border border-gray-600 px-3 py-2 text-xs font-semibold text-gray-400 hover:border-gray-500 hover:text-gray-300 sm:flex">
                <Download className="h-3.5 w-3.5" /> Exportar
              </button>
            )}

            {/* New record */}
            <button
              onClick={handleNew}
              className="flex items-center gap-1.5 rounded bg-[#F47920] px-3 py-2 text-xs font-bold text-white shadow-md shadow-[#F47920]/20 hover:bg-[#d96a15]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Novo Registro</span>
            </button>

            {/* Supabase indicator */}
            <div className="hidden items-center gap-1.5 rounded border border-[#F47920]/40 px-2.5 py-2 text-xs font-semibold text-[#F47920] sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F47920]" /> Supabase
            </div>

            {/* Role switcher */}
            <div className="flex items-center rounded border border-gray-700 bg-gray-800/50">
              <button
                onClick={() => handleRoleChange('gerente')}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-l transition-all ${role === 'gerente' ? 'bg-[#F47920] text-white' : 'text-gray-400 hover:text-white'}`}
                title="Gerente"
              >
                <User className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleRoleChange('operador')}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-r transition-all ${role === 'operador' ? 'bg-[#F47920] text-white' : 'text-gray-400 hover:text-white'}`}
                title="Operador"
              >
                <Wrench className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1440px] p-4 lg:p-6">
        {active === 'dashboard' && role === 'gerente' && (
          <Dashboard filters={filters} onNavigate={(tab) => setActive(tab)} />
        )}
        {active === 'cadastro' && (
          <CadastroRealizadoView
            filters={filters}
            onFiltersChange={setFilters}
            showNewForm={showNewForm && active === 'cadastro'}
            onNewFormHandled={() => setNewHandled(t => t + 1)}
          />
        )}
        {active === 'checklist' && (
          <ChecklistView
            filters={filters}
            onFiltersChange={setFilters}
            showNewForm={showNewForm && active === 'checklist'}
            onNewFormHandled={() => setNewHandled(t => t + 1)}
          />
        )}
        {active === 'performance' && role === 'gerente' && (
          <PerformanceView filters={filters} onFiltersChange={setFilters} />
        )}
      </main>
    </div>
  );
}

export default App;
