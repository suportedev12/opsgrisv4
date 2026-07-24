import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CadastroRealizado, ChecklistOperacional, Filters } from '@/types';
import { filterCadastros, filterChecklists, getUniqueAtendentes } from '@/utils/filters';
import { useCadastroKPIs, useChecklistKPIs, byTurno, byAtendente } from '@/hooks/useKPIs';
import { KpiCard } from '@/components/KpiCard';
import { Panel } from '@/components/Panel';
import { BarChart, DonutChart, LineChart } from '@/components/Charts';
import { FilterBar } from '@/components/FilterBar';
import { CheckCircle2, AlertTriangle, Clock, TrendingUp, FileCheck, XCircle, Gauge, Timer, Activity, Users, Truck } from 'lucide-react';

export function Dashboard({ filters, onFiltersChange }: { filters: Filters; onFiltersChange: (f: Filters) => void }) {
  const [cadastros, setCadastros] = useState<CadastroRealizado[]>([]);
  const [checklists, setChecklists] = useState<ChecklistOperacional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: cad }, { data: chk }] = await Promise.all([
        supabase.from('cadastro_realizado').select('*').order('created_at', { ascending: false }),
        supabase.from('checklist_operacional').select('*').order('created_at', { ascending: false }),
      ]);
      setCadastros(cad ?? []);
      setChecklists(chk ?? []);
      setLoading(false);
    })();
  }, []);

  const filteredCad = filterCadastros(cadastros, filters);
  const filteredChk = filterChecklists(checklists, filters);
  const atendentes = getUniqueAtendentes(cadastros, checklists);

  const cadKpis = useCadastroKPIs(filteredCad);
  const chkKpis = useChecklistKPIs(filteredChk);

  const cadByTurno = byTurno(filteredCad);
  const chkByTurno = byTurno(filteredChk);
  const cadByAtend = byAtendente(filteredCad);
  const chkByAtend = byAtendente(filteredChk);

  const barData = (['1T', '2T', '3T'] as const).map(t => ({
    label: t,
    validados: (cadByTurno[t] ?? []).filter(r => r.status === 'Validado').length + (chkByTurno[t] ?? []).filter(r => r.status === 'Validado').length,
    pendencias: (cadByTurno[t] ?? []).filter(r => r.status === 'Pendência').length + (chkByTurno[t] ?? []).filter(r => r.status === 'Pendência').length,
    outros: (cadByTurno[t] ?? []).filter(r => r.status && r.status !== 'Validado' && r.status !== 'Pendência').length + (chkByTurno[t] ?? []).filter(r => r.status && r.status !== 'Validado' && r.status !== 'Pendência').length,
  }));

  const donutSegs = [
    { label: 'Validados', value: cadKpis.validados + chkKpis.validados, color: '#10b981' },
    { label: 'Pendências', value: cadKpis.pendencias + chkKpis.pendencias, color: '#f59e0b' },
    { label: 'Andamento', value: cadKpis.andamento + chkKpis.andamento, color: '#3b82f6' },
    { label: 'Recusados', value: cadKpis.recusados, color: '#ef4444' },
  ];

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const dayCad = filteredCad.filter(r => r.data === key).length;
    const dayChk = filteredChk.filter(r => r.data === key).length;
    return { label: `${d.getDate()}/${d.getMonth() + 1}`, value: dayCad + dayChk };
  });

  const topAtendentes = [...cadByAtend, ...chkByAtend]
    .reduce((acc, cur) => {
      const existing = acc.find(a => a.name === cur.name);
      if (existing) {
        existing.total += cur.total;
        existing.validados += cur.validados;
        existing.pendencias += cur.pendencias;
      } else {
        acc.push({ ...cur });
      }
      return acc;
    }, [] as { name: string; total: number; validados: number; pendencias: number; eficiencia: number }[])
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-[#F47920]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={onFiltersChange} atendentes={atendentes} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <KpiCard title="Cadastros" value={cadKpis.totalCadastros} icon={<FileCheck className="h-5 w-5" />} accent="blue" />
        <KpiCard title="Checklists" value={chkKpis.total} icon={<Truck className="h-5 w-5" />} accent="orange" />
        <KpiCard title="Validados" value={cadKpis.validados + chkKpis.validados} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
        <KpiCard title="Pendências" value={cadKpis.pendencias + chkKpis.pendencias} icon={<AlertTriangle className="h-5 w-5" />} accent="amber" />
        <KpiCard title="Recusados" value={cadKpis.recusados} icon={<XCircle className="h-5 w-5" />} accent="red" />
        <KpiCard title="Andamento" value={cadKpis.andamento + chkKpis.andamento} icon={<Clock className="h-5 w-5" />} accent="slate" />
        <KpiCard title="Eficiência" value={`${cadKpis.eficiencia}%`} icon={<Gauge className="h-5 w-5" />} accent="green" />
        <KpiCard title="T. Médio" value={`${cadKpis.tempoMedioMin}min`} icon={<Timer className="h-5 w-5" />} accent="orange" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Volume por Turno" subtitle="Cadastros + Checklists" className="lg:col-span-2">
          <BarChart data={barData} />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Validados</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />Pendências</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-600" />Outros</span>
          </div>
        </Panel>

        <Panel title="Distribuição de Status" subtitle="Todos os registros">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Produção - Últimos 7 dias" subtitle="Registros por dia" className="lg:col-span-2">
          <LineChart data={last7Days} color="#F47920" />
        </Panel>

        <Panel title="SLA & Performance" subtitle="Indicadores de eficiência">
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">SLA Score</span>
                <span className="font-semibold text-white">{cadKpis.slaScore}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-[#F47920] to-emerald-500 transition-all" style={{ width: `${cadKpis.slaScore}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">Eficiência Cadastro</span>
                <span className="font-semibold text-white">{cadKpis.eficiencia}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${cadKpis.eficiencia}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">Eficiência Checklist</span>
                <span className="font-semibold text-white">{chkKpis.eficiencia}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-[#F47920] transition-all" style={{ width: `${chkKpis.eficiencia}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-slate-300">Checklists vencidos: <strong className="text-amber-400">{chkKpis.vencidos}</strong></span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Ranking de Atendentes" subtitle="Top operadores por volume" action={<Users className="h-4 w-4 text-slate-500" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-2 pr-4 font-medium">Operador</th>
                <th className="pb-2 pr-4 font-medium">Total</th>
                <th className="pb-2 pr-4 font-medium">Validados</th>
                <th className="pb-2 pr-4 font-medium">Pendências</th>
                <th className="pb-2 font-medium">Eficiência</th>
              </tr>
            </thead>
            <tbody>
              {topAtendentes.map((a, i) => (
                <tr key={a.name} className="border-b border-slate-800/40 transition-colors hover:bg-slate-800/30">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-[#F47920]/20 text-[#F47920]' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-700/20 text-orange-600' : 'bg-slate-800 text-slate-500'}`}>{i + 1}</span>
                      <span className="font-medium text-white">{a.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-300">{a.total}</td>
                  <td className="py-2.5 pr-4 text-emerald-400">{a.validados}</td>
                  <td className="py-2.5 pr-4 text-amber-400">{a.pendencias}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${a.eficiencia}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{a.eficiencia}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {topAtendentes.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-slate-500">Nenhum dado disponível</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
