import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CadastroRealizado, ChecklistOperacional, Filters } from '@/types';
import { filterCadastros, filterChecklists, getUniqueAtendentes } from '@/utils/filters';
import { byAtendente } from '@/hooks/useKPIs';
import { FilterBar } from '@/components/FilterBar';
import { Panel } from '@/components/Panel';
import { LineChart } from '@/components/Charts';
import { TrendingUp, Award, Activity, Target } from 'lucide-react';

function calcMinutes(inicio: string | null, fim: string | null): number | null {
  if (!inicio || !fim) return null;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff > 0 ? diff : null;
}

export function PerformanceView({ filters, onFiltersChange }: { filters: Filters; onFiltersChange: (f: Filters) => void }) {
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

  const cadByAtend = byAtendente(filteredCad);
  const chkByAtend = byAtendente(filteredChk);

  const allAtendentes = [...cadByAtend, ...chkByAtend]
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
    .sort((a, b) => b.eficiencia - a.eficiencia);

  const tempoPorAtendente = [...filteredCad, ...filteredChk]
    .filter(r => r.atendente)
    .reduce((acc, r) => {
      const a = r.atendente!;
      const min = calcMinutes(r.horario_inicio, r.horario_fim);
      if (min !== null) {
        if (!acc[a]) acc[a] = { sum: 0, count: 0 };
        acc[a].sum += min;
        acc[a].count++;
      }
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

  const tempoData = Object.entries(tempoPorAtendente)
    .map(([name, d]) => ({ label: name.split(' ')[0], value: Math.round(d.sum / d.count) }))
    .sort((a, b) => a.value - b.value)
    .slice(0, 8);

  const meta = 85;
  const atingiramMeta = allAtendentes.filter(a => a.eficiencia >= meta).length;
  const taxaAtingimento = allAtendentes.length > 0 ? Math.round((atingiramMeta / allAtendentes.length) * 100) : 0;

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-[#F47920]" /></div>;

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={onFiltersChange} atendentes={atendentes} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800/60 bg-[#0f1117]/80 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Atingimento de Meta</p>
              <p className="text-2xl font-bold text-white">{taxaAtingimento}%</p>
              <p className="text-xs text-slate-500">{atingiramMeta} de {allAtendentes.length} operadores acima de {meta}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-[#0f1117]/80 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F47920]/10 text-[#F47920]">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Melhor Operador</p>
              <p className="text-2xl font-bold text-white">{allAtendentes[0]?.name ?? '-'}</p>
              <p className="text-xs text-slate-500">{allAtendentes[0]?.eficiencia ?? 0}% de eficiência</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-[#0f1117]/80 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Volume Total</p>
              <p className="text-2xl font-bold text-white">{filteredCad.length + filteredChk.length}</p>
              <p className="text-xs text-slate-500">registros no período</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Eficiência por Operador" subtitle="Validados / Total" action={<TrendingUp className="h-4 w-4 text-slate-500" />}>
          <div className="space-y-3">
            {allAtendentes.map(a => (
              <div key={a.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{a.name}</span>
                  <span className="text-slate-400">{a.validados}/{a.total} <span className={`ml-2 font-semibold ${a.eficiencia >= meta ? 'text-emerald-400' : 'text-amber-400'}`}>{a.eficiencia}%</span></span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full rounded-full transition-all ${a.eficiencia >= meta ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${a.eficiencia}%` }} />
                </div>
              </div>
            ))}
            {allAtendentes.length === 0 && <p className="py-4 text-center text-slate-500">Sem dados</p>}
          </div>
        </Panel>

        <Panel title="Tempo Médio de Atendimento" subtitle="Minutos por operador">
          {tempoData.length > 0 ? <LineChart data={tempoData} color="#3b82f6" /> : <p className="py-8 text-center text-slate-500">Sem dados de horário</p>}
        </Panel>
      </div>

      <Panel title="Ranking Completo de Performance" subtitle="Todos os operadores ordenados por eficiência">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-2 pr-4 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">Operador</th>
                <th className="pb-2 pr-4 font-medium">Total</th>
                <th className="pb-2 pr-4 font-medium">Validados</th>
                <th className="pb-2 pr-4 font-medium">Pendências</th>
                <th className="pb-2 pr-4 font-medium">Taxa de Erro</th>
                <th className="pb-2 font-medium">Eficiência</th>
              </tr>
            </thead>
            <tbody>
              {allAtendentes.map((a, i) => {
                const taxaErro = a.total > 0 ? Math.round((a.pendencias / a.total) * 100) : 0;
                return (
                  <tr key={a.name} className="border-b border-slate-800/40 transition-colors hover:bg-slate-800/30">
                    <td className="py-2.5 pr-4">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-[#F47920]/20 text-[#F47920]' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-700/20 text-orange-600' : 'bg-slate-800 text-slate-500'}`}>{i + 1}</span>
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-white">{a.name}</td>
                    <td className="py-2.5 pr-4 text-slate-300">{a.total}</td>
                    <td className="py-2.5 pr-4 text-emerald-400">{a.validados}</td>
                    <td className="py-2.5 pr-4 text-amber-400">{a.pendencias}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`font-medium ${taxaErro > 20 ? 'text-red-400' : taxaErro > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{taxaErro}%</span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                          <div className={`h-full rounded-full ${a.eficiencia >= meta ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${a.eficiencia}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-white">{a.eficiencia}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {allAtendentes.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">Nenhum dado disponível</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
