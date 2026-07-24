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

const meta = 85;

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
      if (existing) { existing.total += cur.total; existing.validados += cur.validados; existing.pendencias += cur.pendencias; }
      else acc.push({ ...cur });
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
        acc[a].sum += min; acc[a].count++;
      }
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

  const tempoData = Object.entries(tempoPorAtendente)
    .map(([name, d]) => ({ label: name.split(' ')[0], value: Math.round(d.sum / d.count) }))
    .sort((a, b) => a.value - b.value).slice(0, 8);

  const atingiramMeta = allAtendentes.filter(a => a.eficiencia >= meta).length;
  const taxaAtingimento = allAtendentes.length > 0 ? Math.round((atingiramMeta / allAtendentes.length) * 100) : 0;

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#F47920]" /></div>;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#F47920]">Análise Gerencial</p>
        <h2 className="mt-0.5 text-2xl font-bold text-gray-900">Performance Operacional</h2>
        <p className="mt-0.5 text-sm text-gray-500">Eficiência, ranking e tempo médio de atendimento por operador.</p>
      </div>

      <FilterBar filters={filters} onChange={onFiltersChange} atendentes={atendentes} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Atingimento de Meta', value: `${taxaAtingimento}%`, sub: `${atingiramMeta} de ${allAtendentes.length} acima de ${meta}%`, icon: <Target className="h-6 w-6" />, color: 'bg-emerald-50 text-emerald-500' },
          { label: 'Melhor Operador', value: allAtendentes[0]?.name ?? '-', sub: `${allAtendentes[0]?.eficiencia ?? 0}% de eficiência`, icon: <Award className="h-6 w-6" />, color: 'bg-orange-50 text-[#F47920]' },
          { label: 'Volume Total', value: filteredCad.length + filteredChk.length, sub: 'registros no período', icon: <Activity className="h-6 w-6" />, color: 'bg-blue-50 text-blue-500' },
        ].map(c => (
          <div key={c.label} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${c.color}`}>{c.icon}</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{c.label}</p>
              <p className="mt-0.5 text-xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Eficiência por Operador" subtitle="Validados / Total" action={<TrendingUp className="h-4 w-4 text-[#F47920]" />}>
          <div className="space-y-3">
            {allAtendentes.map(a => (
              <div key={a.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{a.name}</span>
                  <span className="text-gray-500">{a.validados}/{a.total}{' '}<span className={`ml-2 font-semibold ${a.eficiencia >= meta ? 'text-emerald-600' : 'text-amber-500'}`}>{a.eficiencia}%</span></span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full transition-all ${a.eficiencia >= meta ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${a.eficiencia}%` }} />
                </div>
              </div>
            ))}
            {allAtendentes.length === 0 && <p className="py-4 text-center text-gray-400">Sem dados</p>}
          </div>
        </Panel>

        <Panel title="Tempo Médio de Atendimento" subtitle="Minutos por operador">
          {tempoData.length > 0 ? <LineChart data={tempoData} color="#3b82f6" /> : <p className="py-8 text-center text-gray-400">Sem dados de horário</p>}
        </Panel>
      </div>

      <Panel title="Ranking Completo de Performance" subtitle="Todos os operadores ordenados por eficiência">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="pb-2 pr-4 font-semibold">#</th>
                <th className="pb-2 pr-4 font-semibold">Operador</th>
                <th className="pb-2 pr-4 font-semibold">Total</th>
                <th className="pb-2 pr-4 font-semibold">Validados</th>
                <th className="pb-2 pr-4 font-semibold">Pendências</th>
                <th className="pb-2 pr-4 font-semibold">Taxa de Erro</th>
                <th className="pb-2 font-semibold">Eficiência</th>
              </tr>
            </thead>
            <tbody>
              {allAtendentes.map((a, i) => {
                const taxaErro = a.total > 0 ? Math.round((a.pendencias / a.total) * 100) : 0;
                return (
                  <tr key={a.name} className="border-b border-gray-50 transition-colors hover:bg-orange-50/20">
                    <td className="py-3 pr-4">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-[#F47920]/15 text-[#F47920]' : i === 1 ? 'bg-gray-100 text-gray-500' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>{i + 1}</span>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-800">{a.name}</td>
                    <td className="py-3 pr-4 text-gray-600">{a.total}</td>
                    <td className="py-3 pr-4 font-medium text-emerald-600">{a.validados}</td>
                    <td className="py-3 pr-4 font-medium text-amber-500">{a.pendencias}</td>
                    <td className="py-3 pr-4"><span className={`font-medium ${taxaErro > 20 ? 'text-red-500' : taxaErro > 10 ? 'text-amber-500' : 'text-emerald-600'}`}>{taxaErro}%</span></td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div className={`h-full rounded-full ${a.eficiencia >= meta ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${a.eficiencia}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{a.eficiencia}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {allAtendentes.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-gray-400">Nenhum dado disponível</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
