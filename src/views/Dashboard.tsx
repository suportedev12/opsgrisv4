import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CadastroRealizado, ChecklistOperacional, Filters } from '@/types';
import { filterCadastros, filterChecklists, getUniqueAtendentes } from '@/utils/filters';
import { useCadastroKPIs, useChecklistKPIs, byAtendente } from '@/hooks/useKPIs';
import { KpiCard } from '@/components/KpiCard';
import { Panel } from '@/components/Panel';
import { ProductivityBarChart, DonutChart } from '@/components/Charts';
import { AlertTriangle, FileCheck, Truck, Shield, Users } from 'lucide-react';

export function Dashboard({ filters, onNavigate }: { filters: Filters; onNavigate?: (tab: 'cadastro' | 'checklist') => void }) {
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

  const cadByAtend = byAtendente(filteredCad);
  const chkByAtend = byAtendente(filteredChk);

  const productivityData = atendentes.map(name => ({
    name,
    cadastros: cadByAtend.find(a => a.name === name)?.total ?? 0,
    checklists: chkByAtend.find(a => a.name === name)?.total ?? 0,
  })).filter(d => d.cadastros + d.checklists > 0);

  const totalValidados = cadKpis.validados + chkKpis.validados;
  const totalAll = cadKpis.totalCadastros + chkKpis.total;
  const eficiencia = totalAll > 0 ? Math.round((totalValidados / totalAll) * 100) : 0;
  const pendenciasRecusas = cadKpis.pendencias + chkKpis.pendencias + cadKpis.recusados;

  const donutSegs = [
    { label: 'Validado', value: totalValidados, color: '#10b981' },
    { label: 'Andamento', value: cadKpis.andamento + chkKpis.andamento, color: '#3b82f6' },
    { label: 'Recusado', value: cadKpis.recusados, color: '#ef4444' },
    { label: 'Pendência', value: cadKpis.pendencias + chkKpis.pendencias, color: '#f59e0b' },
  ].filter(s => s.value > 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#F47920]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#0f1923] px-6 py-5 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#F47920]">
              Setor GRIS / Cadastro — Torre de Controle Lösung
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-white">Dashboard de Desempenho Operacional</h1>
            <p className="mt-1 text-sm text-gray-400">
              Monitoramento em tempo real das abas{' '}
              <span className="font-semibold text-white">Cadastro Realizado</span> e{' '}
              <span className="font-semibold text-white">Checklist</span>.
            </p>
          </div>
          <div className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center md:flex">
            <Users className="h-7 w-7 text-[#F47920]" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Operadores Ativos</p>
              <p className="text-lg font-bold text-white">{atendentes.length} {atendentes.length === 1 ? 'Profissional' : 'Profissionais'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total de Cadastros"
          value={cadKpis.totalCadastros}
          subtitle="~ Aba Cadastro Realizado"
          subtitleLink={() => onNavigate?.('cadastro')}
          icon={<FileCheck className="h-6 w-6" />}
          accent="orange"
        />
        <KpiCard
          title="Total de Checklists"
          value={chkKpis.total}
          subtitle="~ Aba Checklist"
          subtitleLink={() => onNavigate?.('checklist')}
          icon={<Truck className="h-6 w-6" />}
          accent="orange"
        />
        <KpiCard
          title="Índice de Eficiência"
          value={`${eficiencia}%`}
          subtitle={`${totalValidados} de ${totalAll} validados`}
          icon={<Shield className="h-6 w-6" />}
          accent="green"
        />
        <KpiCard
          title="Pendências / Recusas"
          value={pendenciasRecusas}
          subtitle={pendenciasRecusas > 0 ? 'Requer atenção gerencial' : 'Tudo em ordem'}
          icon={<AlertTriangle className="h-6 w-6" />}
          accent={pendenciasRecusas > 0 ? 'amber' : 'green'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Panel
          title="Produtividade por Atendente"
          subtitle="Volume de cadastros e checklists processados por operador"
          className="lg:col-span-3"
          action={<Users className="h-4 w-4 text-[#F47920]" />}
        >
          {productivityData.length > 0 ? (
            <>
              <ProductivityBarChart data={productivityData} height={220} />
              <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#F47920]" /> Cadastros</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#334155]" /> Checklists</span>
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-gray-400">Sem dados de atendentes no período</p>
          )}
        </Panel>

        <Panel
          title="Status dos Cadastros"
          subtitle="Distribuição percentual"
          className="lg:col-span-2"
          action={<div className="h-4 w-4 rounded-full border-2 border-[#F47920] bg-transparent" />}
        >
          <div className="flex flex-col items-center gap-4">
            <DonutChart segments={donutSegs} size={220} />
            <div className="w-full grid grid-cols-2 gap-2 text-xs">
              {donutSegs.map(s => (
                <div key={s.label} className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-gray-600">{s.label}</span>
                  <span className="ml-auto font-semibold text-gray-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
