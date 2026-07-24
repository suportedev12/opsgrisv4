import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { CadastroRealizado, ChecklistOperacional, Filters, Period, UserProfile, Meta } from '@/types';
import { filterCadastros, filterChecklists, getUniqueAtendentes } from '@/utils/filters';
import { useCadastroKPIs, useChecklistKPIs, byTurno, byAtendente, byWeek, byMonth } from '@/hooks/useKPIs';
import { KpiCard } from '@/components/KpiCard';
import { Panel } from '@/components/Panel';
import { BarChart, ProductivityBarChart, DonutChart, LineChart } from '@/components/Charts';
import {
  FileCheck, Truck, AlertTriangle, Users, Calendar,
  Clock, CheckCircle2, XCircle, LayoutGrid, Target, Trophy,
} from 'lucide-react';

/* ─── Period helpers ─── */
function getPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start = end;
  if (period === 'hoje') { start = end; }
  else if (period === 'semana') { const s = new Date(now); s.setDate(s.getDate() - 6); start = s.toISOString().split('T')[0]; }
  else if (period === 'mes') { start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; }
  else if (period === 'trimestre') { start = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0]; }
  else if (period === 'ano') { start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]; }
  return { start, end };
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mês' },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'ano', label: 'Ano' },
];

type BaseView = 'consolidado' | 'cadastro' | 'checklist';

const BASE_TABS: { id: BaseView; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'consolidado', label: 'Consolidado', icon: LayoutGrid },
  { id: 'cadastro', label: 'Cadastro Realizado', icon: FileCheck },
  { id: 'checklist', label: 'Checklist', icon: Truck },
];

interface Props {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onNavigate?: (tab: 'cadastro' | 'checklist') => void;
  profile?: UserProfile | null;
  isManager?: boolean;
}

export function Dashboard({ filters, onFiltersChange, onNavigate, profile, isManager }: Props) {
  const [cadastros, setCadastros] = useState<CadastroRealizado[]>([]);
  const [checklists, setChecklists] = useState<ChecklistOperacional[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('mes');
  const [calStart, setCalStart] = useState('');
  const [calEnd, setCalEnd] = useState('');
  const [baseView, setBaseView] = useState<BaseView>('consolidado');

  useEffect(() => {
    (async () => {
      const [{ data: cad }, { data: chk }, { data: mt }] = await Promise.all([
        supabase.from('cadastro_records').select('*').order('created_at', { ascending: false }),
        supabase.from('checklist_records').select('*').order('created_at', { ascending: false }),
        supabase.from('metas').select('*').eq('ativo', true).order('created_at', { ascending: false }),
      ]);
      setCadastros(cad ?? []);
      setChecklists(chk ?? []);
      setMetas(mt ?? []);
      setLoading(false);
    })();
  }, []);

  /* ─── Apply period + filters ─── */
  const effectiveFilters = useMemo<Filters>(() => {
    const { start, end } = period === 'custom'
      ? { start: calStart, end: calEnd }
      : getPeriodRange(period);
    return { ...filters, dataInicio: filters.dataInicio || start, dataFim: filters.dataFim || end };
  }, [filters, period, calStart, calEnd]);

  const isManagerUser = isManager;
  const scopedCad = isManagerUser ? cadastros : cadastros.filter(r => r.user_id === profile?.id || r.atendente === profile?.nome);
  const scopedChk = isManagerUser ? checklists : checklists.filter(r => r.user_id === profile?.id || r.atendente === profile?.nome);
  const filteredCad = filterCadastros(scopedCad, effectiveFilters);
  const filteredChk = filterChecklists(scopedChk, effectiveFilters);
  const atendentes = isManagerUser ? getUniqueAtendentes(cadastros, checklists) : [];

  const cadKpis = useCadastroKPIs(filteredCad);
  const chkKpis = useChecklistKPIs(filteredChk);

  /* ─── By-turno ─── */
  const buildTurnoData = <T extends { turno: string | null; status: string | null }>(recs: T[]) => {
    const map = byTurno(recs);
    return Object.keys(map).sort().map(t => ({
      label: t,
      validados: map[t].filter(r => r.status === 'Validado').length,
      pendencias: map[t].filter(r => r.status === 'Pendência').length,
      outros: map[t].filter(r => r.status !== 'Validado' && r.status !== 'Pendência').length,
    }));
  };

  const cadTurno = useMemo(() => buildTurnoData(filteredCad), [filteredCad]);
  const chkTurno = useMemo(() => buildTurnoData(filteredChk), [filteredChk]);

  /* ─── By-semana ─── */
  const cadSemana = useMemo(() => byWeek(filteredCad).map(w => ({ label: w.semana, value: w.total })), [filteredCad]);
  const chkSemana = useMemo(() => byWeek(filteredChk).map(w => ({ label: w.semana, value: w.total })), [filteredChk]);

  /* ─── By-mês ─── */
  const cadMes = useMemo(() => byMonth(filteredCad).map(m => ({ label: m.mes, value: m.total })), [filteredCad]);
  const chkMes = useMemo(() => byMonth(filteredChk).map(m => ({ label: m.mes, value: m.total })), [filteredChk]);

  /* ─── By-atendente (per base) ─── */
  const cadByAtend = useMemo(() => byAtendente(filteredCad), [filteredCad]);
  const chkByAtend = useMemo(() => byAtendente(filteredChk), [filteredChk]);

  const productivityData = useMemo(() => {
    return atendentes.map(name => ({
      name,
      cadastros: cadByAtend.find(a => a.name === name)?.total ?? 0,
      checklists: chkByAtend.find(a => a.name === name)?.total ?? 0,
    })).filter(d => d.cadastros + d.checklists > 0);
  }, [cadByAtend, chkByAtend, atendentes]);

  /* ─── Calendar (14 days) ─── */
  const calData = useMemo(() => {
    const source = baseView === 'checklist' ? filteredChk : baseView === 'cadastro' ? filteredCad : [...filteredCad, ...filteredChk];
    const map: Record<string, number> = {};
    source.forEach(r => {
      const d = r.data ?? '';
      if (d) map[d] = (map[d] ?? 0) + 1;
    });
    const days: { date: string; label: string; total: number; isToday: boolean }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(today); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split('T')[0];
      days.push({ date: ds, label: dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), total: map[ds] ?? 0, isToday: i === 0 });
    }
    return days;
  }, [filteredCad, filteredChk, baseView]);

  const maxCal = Math.max(...calData.map(d => d.total), 1);
  const periodLabel = PERIODS.find(p => p.id === period)?.label ?? '';

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#F47920]" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#0f1923] px-6 py-5 shadow-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#F47920]">Setor GRIS / Cadastro — Torre de Controle Lösung</p>
            <h1 className="mt-1.5 text-2xl font-bold text-white">Dashboard de Desempenho Operacional</h1>
            <p className="mt-1 text-sm text-gray-400">Selecione a base para visualizar os indicadores detalhados.</p>
          </div>
          {isManagerUser && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <Users className="h-7 w-7 text-[#F47920]" />
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Operadores Ativos</p>
                <p className="text-lg font-bold text-white">{atendentes.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Goal widget ─── */}
      {metas.length > 0 && (
        <GoalWidget metas={metas} profile={profile} isManager={!!isManager} cadastros={filteredCad} checklists={filteredChk} />
      )}

      {/* ─── Base selector tabs ─── */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
        {BASE_TABS.map(t => {
          const Icon = t.icon;
          const isActive = baseView === t.id;
          const count = t.id === 'cadastro' ? cadKpis.total : t.id === 'checklist' ? chkKpis.total : cadKpis.total + chkKpis.total;
          return (
            <button
              key={t.id}
              onClick={() => setBaseView(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${isActive ? 'bg-[#F47920] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Period + filter bar ─── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${period === p.id ? 'bg-[#F47920] text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
            >
              {p.label}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input type="date" value={calStart} onChange={e => setCalStart(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-[#F47920] focus:outline-none" />
              <span className="text-gray-400">→</span>
              <input type="date" value={calEnd} onChange={e => setCalEnd(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-[#F47920] focus:outline-none" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select value={filters.turno} onChange={e => onFiltersChange({ ...filters, turno: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm focus:border-[#F47920] focus:outline-none">
            <option value="">Turnos</option>
            <option value="1T">1º Turno</option>
            <option value="2T">2º Turno</option>
            <option value="3T">3º Turno</option>
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
            <option value="Noite">Noite</option>
          </select>
          {isManagerUser && (
            <select value={filters.atendente} onChange={e => onFiltersChange({ ...filters, atendente: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm focus:border-[#F47920] focus:outline-none">
              <option value="">Operador</option>
              {atendentes.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
          <select value={filters.status} onChange={e => onFiltersChange({ ...filters, status: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm focus:border-[#F47920] focus:outline-none">
            <option value="">Status</option>
            <option value="Validado">Validado</option>
            <option value="Pendência">Pendência</option>
            <option value="Recusado">Recusado</option>
            <option value="Andamento">Andamento</option>
          </select>
          {(filters.turno || filters.atendente || filters.status) && (
            <button onClick={() => onFiltersChange({ ...filters, turno: '', atendente: '', status: '' })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700">Limpar</button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* ─── CONSOLIDADO VIEW ─── */}
      {/* ═══════════════════════════════════════ */}
      {baseView === 'consolidado' && (
        <div className="space-y-4">
          {/* Summary KPIs — both bases side by side */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard title="Total Cadastros" value={cadKpis.total} icon={<FileCheck className="h-5 w-5" />} accent="orange" subtitle={`Período: ${periodLabel}`} subtitleLink={() => onNavigate?.('cadastro')} />
            <KpiCard title="Total Checklists" value={chkKpis.total} icon={<Truck className="h-5 w-5" />} accent="orange" subtitle={`Período: ${periodLabel}`} subtitleLink={() => onNavigate?.('checklist')} />
            <KpiCard title="Eficiência Geral" value={`${cadKpis.total + chkKpis.total > 0 ? Math.round(((cadKpis.validados + chkKpis.validados) / (cadKpis.total + chkKpis.total)) * 100) : 0}%`} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" subtitle={`${cadKpis.validados + chkKpis.validados} validados`} />
            <KpiCard title="Pendências Total" value={cadKpis.pendencias + chkKpis.pendencias} icon={<AlertTriangle className="h-5 w-5" />} accent="amber" subtitle={cadKpis.recusados + chkKpis.vencidos > 0 ? `${cadKpis.recusados + chkKpis.vencidos} críticos` : 'Tudo em ordem'} />
          </div>

          {/* Productivity + Status donut */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {isManagerUser && (
              <Panel title="Produtividade por Operador" subtitle="Cadastros x Checklists por operador" className="lg:col-span-2" action={<Users className="h-4 w-4 text-[#F47920]" />}>
                {productivityData.length > 0 ? (
                  <>
                    <ProductivityBarChart data={productivityData} height={200} />
                    <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#F47920]" /> Cadastros</span>
                      <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#334155]" /> Checklists</span>
                    </div>
                  </>
                ) : <EmptyChart />}
              </Panel>
            )}

            <Panel title="Status Consolidado" subtitle="Distribuição geral" className={isManagerUser ? '' : 'lg:col-span-3'}>
              <div className="flex flex-col items-center gap-4">
                <DonutChart
                  segments={[
                    { label: 'Validado', value: cadKpis.validados + chkKpis.validados, color: '#10b981' },
                    { label: 'Andamento', value: cadKpis.andamento + chkKpis.andamento, color: '#3b82f6' },
                    { label: 'Pendência', value: cadKpis.pendencias + chkKpis.pendencias, color: '#f59e0b' },
                    { label: 'Recusado', value: cadKpis.recusados, color: '#ef4444' },
                  ].filter(s => s.value > 0)}
                  size={200}
                />
              </div>
            </Panel>
          </div>

          {/* Calendar */}
          <Panel title="Calendário de Atividades" subtitle="Últimos 14 dias — volume total de registros" action={<Calendar className="h-4 w-4 text-[#F47920]" />}>
            <CalendarGrid days={calData} maxCal={maxCal} />
          </Panel>

          {/* Monthly evolution — both */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Cadastros por Mês" subtitle="Evolução mensal">
              {cadMes.length > 1 ? <LineChart data={cadMes} color="#F47920" /> : <EmptyChart />}
            </Panel>
            <Panel title="Checklists por Mês" subtitle="Evolução mensal">
              {chkMes.length > 1 ? <LineChart data={chkMes} color="#334155" /> : <EmptyChart />}
            </Panel>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* ─── CADASTRO VIEW ─── */}
      {/* ═══════════════════════════════════════ */}
      {baseView === 'cadastro' && (
        <div className="space-y-4">
          {/* Section header */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F47920]/10"><FileCheck className="h-5 w-5 text-[#F47920]" /></div>
            <h2 className="text-xl font-bold text-gray-900">Cadastro Realizado</h2>
            <span className="rounded-full bg-[#F47920]/10 px-3 py-0.5 text-xs font-semibold text-[#F47920]">{cadKpis.total} registros · {periodLabel}</span>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KpiCard title="Total" value={cadKpis.total} icon={<FileCheck className="h-5 w-5" />} accent="orange" subtitle={`Período: ${periodLabel}`} subtitleLink={() => onNavigate?.('cadastro')} />
            <KpiCard title="Validados" value={cadKpis.validados} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" subtitle={`${cadKpis.eficiencia}% do total`} />
            <KpiCard title="Pendências" value={cadKpis.pendencias} icon={<AlertTriangle className="h-5 w-5" />} accent="amber" subtitle={cadKpis.pendencias > 0 ? 'Requer atenção' : 'Sem pendências'} />
            <KpiCard title="Recusados" value={cadKpis.recusados} icon={<XCircle className="h-5 w-5" />} accent="red" subtitle={cadKpis.recusados > 0 ? 'Verificar motivo' : 'Nenhum'} />
            <KpiCard title="Tempo Médio" value={`${cadKpis.tempoMedioMin}min`} icon={<Clock className="h-5 w-5" />} accent="blue" subtitle="Por atendimento" />
          </div>

          {/* Turno + Semana */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Cadastros por Turno" subtitle="Validados x Pendências x Outros">
              {cadTurno.length > 0 ? <BarChart data={cadTurno} height={180} /> : <EmptyChart />}
            </Panel>
            <Panel title="Cadastros por Semana" subtitle="Evolução semanal">
              {cadSemana.length > 1 ? <LineChart data={cadSemana} color="#F47920" /> : <EmptyChart />}
            </Panel>
          </div>

          {/* Calendar */}
          <Panel title="Calendário — Cadastros" subtitle="Últimos 14 dias" action={<Calendar className="h-4 w-4 text-[#F47920]" />}>
            <CalendarGrid days={calData} maxCal={maxCal} />
          </Panel>

          {/* Operador + Mensal */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {isManagerUser && (
              <Panel title="Volume por Operador" subtitle="Cadastros realizados" action={<Users className="h-4 w-4 text-[#F47920]" />}>
                {cadByAtend.length > 0 ? (
                  <div className="space-y-2.5">
                    {cadByAtend.slice(0, 8).map(a => (
                      <div key={a.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">{a.name}</span>
                          <span className="text-gray-500">{a.total} <span className="ml-1.5 text-xs font-semibold text-emerald-600">{a.eficiencia}%</span></span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-[#F47920]" style={{ width: `${(a.total / Math.max(...cadByAtend.map(x => x.total), 1)) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyChart />}
              </Panel>
            )}
            <Panel title="Cadastros por Mês" subtitle="Evolução mensal" className={isManagerUser ? '' : 'lg:col-span-2'}>
              {cadMes.length > 1 ? <LineChart data={cadMes} color="#F47920" /> : <EmptyChart />}
            </Panel>
          </div>

          {/* Status donut */}
          <Panel title="Distribuição de Status — Cadastros" subtitle="Visão percentual">
            <div className="flex flex-col items-center gap-4">
              <DonutChart
                segments={[
                  { label: 'Validado', value: cadKpis.validados, color: '#10b981' },
                  { label: 'Andamento', value: cadKpis.andamento, color: '#3b82f6' },
                  { label: 'Pendência', value: cadKpis.pendencias, color: '#f59e0b' },
                  { label: 'Recusado', value: cadKpis.recusados, color: '#ef4444' },
                ].filter(s => s.value > 0)}
                size={220}
              />
            </div>
          </Panel>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* ─── CHECKLIST VIEW ─── */}
      {/* ═══════════════════════════════════════ */}
      {baseView === 'checklist' && (
        <div className="space-y-4">
          {/* Section header */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F47920]/10"><Truck className="h-5 w-5 text-[#F47920]" /></div>
            <h2 className="text-xl font-bold text-gray-900">Checklist Operacional</h2>
            <span className="rounded-full bg-[#F47920]/10 px-3 py-0.5 text-xs font-semibold text-[#F47920]">{chkKpis.total} registros · {periodLabel}</span>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KpiCard title="Total" value={chkKpis.total} icon={<Truck className="h-5 w-5" />} accent="orange" subtitle={`Período: ${periodLabel}`} subtitleLink={() => onNavigate?.('checklist')} />
            <KpiCard title="Validados" value={chkKpis.validados} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" subtitle={`${chkKpis.eficiencia}% do total`} />
            <KpiCard title="Pendências" value={chkKpis.pendencias} icon={<AlertTriangle className="h-5 w-5" />} accent="amber" subtitle={chkKpis.pendencias > 0 ? 'Requer atenção' : 'Sem pendências'} />
            <KpiCard title="Vencidos" value={chkKpis.vencidos} icon={<XCircle className="h-5 w-5" />} accent="red" subtitle={chkKpis.vencidos > 0 ? 'Checklist vencido' : 'Nenhum'} />
            <KpiCard title="Andamento" value={chkKpis.andamento} icon={<Clock className="h-5 w-5" />} accent="blue" subtitle="Em processo" />
          </div>

          {/* Turno + Semana */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Checklists por Turno" subtitle="Validados x Pendências x Outros">
              {chkTurno.length > 0 ? <BarChart data={chkTurno} height={180} /> : <EmptyChart />}
            </Panel>
            <Panel title="Checklists por Semana" subtitle="Evolução semanal">
              {chkSemana.length > 1 ? <LineChart data={chkSemana} color="#334155" /> : <EmptyChart />}
            </Panel>
          </div>

          {/* Calendar */}
          <Panel title="Calendário — Checklists" subtitle="Últimos 14 dias" action={<Calendar className="h-4 w-4 text-[#F47920]" />}>
            <CalendarGrid days={calData} maxCal={maxCal} />
          </Panel>

          {/* Operador + Mensal */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {isManagerUser && (
              <Panel title="Volume por Operador" subtitle="Checklists realizados" action={<Users className="h-4 w-4 text-[#F47920]" />}>
                {chkByAtend.length > 0 ? (
                  <div className="space-y-2.5">
                    {chkByAtend.slice(0, 8).map(a => (
                      <div key={a.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">{a.name}</span>
                          <span className="text-gray-500">{a.total} <span className="ml-1.5 text-xs font-semibold text-emerald-600">{a.eficiencia}%</span></span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-[#334155]" style={{ width: `${(a.total / Math.max(...chkByAtend.map(x => x.total), 1)) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyChart />}
              </Panel>
            )}
            <Panel title="Checklists por Mês" subtitle="Evolução mensal" className={isManagerUser ? '' : 'lg:col-span-2'}>
              {chkMes.length > 1 ? <LineChart data={chkMes} color="#334155" /> : <EmptyChart />}
            </Panel>
          </div>

          {/* Status donut */}
          <Panel title="Distribuição de Status — Checklists" subtitle="Visão percentual">
            <div className="flex flex-col items-center gap-4">
              <DonutChart
                segments={[
                  { label: 'Validado', value: chkKpis.validados, color: '#10b981' },
                  { label: 'Andamento', value: chkKpis.andamento, color: '#3b82f6' },
                  { label: 'Pendência', value: chkKpis.pendencias, color: '#f59e0b' },
                ].filter(s => s.value > 0)}
                size={220}
              />
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

/* ─── Calendar sub-component ─── */
function CalendarGrid({ days, maxCal }: { days: { date: string; label: string; total: number; isToday: boolean }[]; maxCal: number }) {
  return (
    <div className="grid grid-cols-7 gap-2 sm:grid-cols-14">
      {days.map(d => (
        <div key={d.date} className={`rounded-lg border p-2 text-center transition-all ${d.isToday ? 'border-[#F47920] bg-[#F47920]/5' : 'border-gray-100 bg-gray-50'}`}>
          <p className="text-[10px] font-medium text-gray-500">{d.label}</p>
          <p className={`mt-1 text-lg font-bold ${d.total > 0 ? 'text-gray-800' : 'text-gray-300'}`}>{d.total}</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-[#F47920]" style={{ width: `${(d.total / maxCal) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyChart() {
  return <div className="flex h-32 items-center justify-center text-sm text-gray-400">Sem dados no período selecionado</div>;
}

/* ─── Goal widget ─── */
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

function GoalWidget({
  metas, profile, isManager, cadastros, checklists,
}: {
  metas: Meta[];
  profile: UserProfile | null;
  isManager: boolean;
  cadastros: CadastroRealizado[];
  checklists: ChecklistOperacional[];
}) {
  const weekRef = getCurrentWeekRef();
  const monthRef = getCurrentMonthRef();

  const relevantMetas = metas.filter(m => {
    if (!m.ativo) return false;
    if (m.user_id === null) return true;
    if (!isManager && m.user_id === profile?.id) return true;
    if (isManager) return true;
    return false;
  });

  const weeklyMetas = relevantMetas.filter(m => m.tipo_periodo === 'semana');
  const monthlyMetas = relevantMetas.filter(m => m.tipo_periodo === 'mes');

  const countForPeriod = (tipo: 'semana' | 'mes', periodo: string) => {
    let start: Date, end: Date;
    if (tipo === 'semana') {
      const [y, w] = periodo.split('-W');
      const year = parseInt(y);
      const week = parseInt(w);
      const jan1 = new Date(year, 0, 1);
      const dayOffset = (week - 1) * 7;
      start = new Date(jan1);
      start.setDate(jan1.getDate() + dayOffset - jan1.getDay());
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      const [y, m] = periodo.split('-');
      start = new Date(parseInt(y), parseInt(m) - 1, 1);
      end = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59, 999);
    }
    const inPeriod = (d: string | undefined) => {
      if (!d) return false;
      const date = new Date(d.length <= 10 ? d : d);
      return date >= start && date <= end;
    };
    return cadastros.filter(r => inPeriod(r.data)).length + checklists.filter(r => inPeriod(r.data)).length;
  };

  const renderCard = (m: Meta, key: string) => {
    const current = countForPeriod(m.tipo_periodo, m.periodo_referencia);
    const pct = m.valor_alvo > 0 ? Math.min(100, Math.round((current / m.valor_alvo) * 100)) : 0;
    const achieved = current >= m.valor_alvo && m.valor_alvo > 0;
    return (
      <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${m.tipo_periodo === 'semana' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {m.tipo_periodo === 'semana' ? 'Semanal' : 'Mensal'}
              </span>
              <span className="text-[10px] font-medium text-gray-400">{m.periodo_referencia}</span>
            </div>
            <h4 className="mt-1.5 text-sm font-bold text-gray-800">{m.titulo}</h4>
            {m.descricao && <p className="mt-0.5 text-xs text-gray-500">{m.descricao}</p>}
          </div>
          {achieved ? <Trophy className="h-5 w-5 shrink-0 text-amber-500" /> : <Target className="h-5 w-5 shrink-0 text-[#F47920]" />}
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-600">{current} / {m.valor_alvo} registros</span>
            <span className={`font-bold ${achieved ? 'text-emerald-600' : 'text-[#F47920]'}`}>{pct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full rounded-full transition-all duration-700 ${achieved ? 'bg-emerald-500' : 'bg-[#F47920]'}`} style={{ width: `${pct}%` }} />
          </div>
          {achieved && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> Meta atingida! Parabéns!
            </p>
          )}
        </div>
      </div>
    );
  };

  const cards: React.ReactNode[] = [];
  const weekMatch = weeklyMetas.find(m => m.periodo_referencia === weekRef) ?? weeklyMetas[0];
  const monthMatch = monthlyMetas.find(m => m.periodo_referencia === monthRef) ?? monthlyMetas[0];
  if (weekMatch) cards.push(renderCard(weekMatch, `w-${weekMatch.id}`));
  if (monthMatch) cards.push(renderCard(monthMatch, `m-${monthMatch.id}`));
  if (cards.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Target className="h-4 w-4 text-[#F47920]" />
        <h3 className="text-sm font-bold text-gray-700">Minhas Metas</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{cards}</div>
    </div>
  );
}
