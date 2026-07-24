import { useState } from 'react';
import { LayoutDashboard, FileCheck, Truck, TrendingUp, User, Wrench } from 'lucide-react';
import type { ActiveTab, Filters, Role } from '@/types';
import { Dashboard } from '@/views/Dashboard';
import { CadastroRealizadoView } from '@/views/CadastroRealizadoView';
import { ChecklistView } from '@/views/ChecklistView';
import { PerformanceView } from '@/views/PerformanceView';
import { OperatorPanel } from '@/views/OperatorPanel';

const NAV: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cadastro', label: 'Cadastro Realizado', icon: FileCheck },
  { id: 'checklist', label: 'Checklist', icon: Truck },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
];

const EMPTY_FILTERS: Filters = { turno: '', atendente: '', status: '', dataInicio: '', dataFim: '', search: '' };

function App() {
  const [role, setRole] = useState<Role>('gerente');
  const [active, setActive] = useState<ActiveTab>('dashboard');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isOperator = role === 'operador';

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-800 bg-[#0f1117] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo centralizada */}
        <div className="flex flex-col items-center justify-center gap-1 border-b border-slate-800/60 px-6 py-5">
          <img src="/losung.png" alt="Lösung Express" className="h-12 w-auto object-contain" />
          <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">GRIS / CADASTRO</span>
        </div>

        {/* Role switcher */}
        <div className="px-3 pt-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-800/60 bg-slate-900/40 p-1">
            <button
              onClick={() => { setRole('gerente'); setActive('dashboard'); }}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${role === 'gerente' ? 'bg-[#F47920] text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <User className="h-3.5 w-3.5" /> Gerente
            </button>
            <button
              onClick={() => { setRole('operador'); setSidebarOpen(false); }}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${role === 'operador' ? 'bg-[#F47920] text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Wrench className="h-3.5 w-3.5" /> Operador
            </button>
          </div>
        </div>

        {/* Nav — only for gerente */}
        {!isOperator && (
          <nav className="space-y-1 p-3">
            {NAV.map(item => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-[#F47920]/10 text-[#F47920] shadow-[inset_2px_0_0] shadow-[#F47920]' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Nav — operador shows the two bases */}
        {isOperator && (
          <nav className="space-y-1 p-3">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Bases</p>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500">
              <FileCheck className="h-5 w-5" /> Cadastro Realizado
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500">
              <Truck className="h-5 w-5" /> Checklist
            </div>
          </nav>
        )}

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F47920]/15 text-sm font-bold text-[#F47920]">
              {isOperator ? 'O' : 'G'}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{isOperator ? 'Operador' : 'Gerente'}</p>
              <p className="text-xs text-slate-500">{isOperator ? 'Entrada de dados' : 'Acesso total'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/60 bg-[#0f1117]/90 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isOperator ? 'Painel do Operador' : (NAV.find(n => n.id === active)?.label ?? 'Dashboard')}
              </h2>
              <p className="text-xs text-slate-500">
                {isOperator ? 'Entrada de dados · Lösung Express' : 'Sistema operacional · Lösung Express'}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-slate-400">Online</span>
            </div>
            <span className="text-xs text-slate-500">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {isOperator ? (
            <OperatorPanel />
          ) : (
            <>
              {active === 'dashboard' && <Dashboard filters={filters} onFiltersChange={setFilters} />}
              {active === 'cadastro' && <CadastroRealizadoView filters={filters} onFiltersChange={setFilters} />}
              {active === 'checklist' && <ChecklistView filters={filters} onFiltersChange={setFilters} />}
              {active === 'performance' && <PerformanceView filters={filters} onFiltersChange={setFilters} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
