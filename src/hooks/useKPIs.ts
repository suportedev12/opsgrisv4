import { useMemo } from 'react';
import type { CadastroRealizado, ChecklistOperacional } from '@/types';

interface CadastroKPI {
  total: number;
  validados: number;
  pendencias: number;
  recusados: number;
  andamento: number;
  eficiencia: number;
  tempoMedioMin: number;
}

interface ChecklistKPI {
  total: number;
  validados: number;
  pendencias: number;
  andamento: number;
  eficiencia: number;
  vencidos: number;
  tempoMedioMin: number;
}

function calcMinutes(inicio: string | null, fim: string | null): number | null {
  if (!inicio || !fim) return null;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff > 0 ? diff : null;
}

export function useCadastroKPIs(records: CadastroRealizado[]): CadastroKPI {
  return useMemo(() => {
    const total = records.length;
    const validados = records.filter(r => r.status === 'Validado').length;
    const pendencias = records.filter(r => r.status === 'Pendência').length;
    const recusados = records.filter(r => r.status === 'Recusado').length;
    const andamento = records.filter(r => r.status === 'Andamento').length;
    const eficiencia = total > 0 ? Math.round((validados / total) * 100) : 0;

    const tempos = records
      .map(r => r.sla_minutes ?? calcMinutes(r.horario_inicio, r.horario_fim))
      .filter((t): t is number => t !== null && t > 0);
    const tempoMedioMin = tempos.length > 0
      ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
      : 0;

    return { total, validados, pendencias, recusados, andamento, eficiencia, tempoMedioMin };
  }, [records]);
}

export function useChecklistKPIs(records: ChecklistOperacional[]): ChecklistKPI {
  return useMemo(() => {
    const total = records.length;
    const validados = records.filter(r => r.status === 'Validado').length;
    const pendencias = records.filter(r => r.status === 'Pendência').length;
    const andamento = records.filter(r => r.status === 'Andamento').length;
    const eficiencia = total > 0 ? Math.round((validados / total) * 100) : 0;

    const today = new Date().toISOString().split('T')[0];
    const vencidos = records.filter(r =>
      r.vencimento_checklist && r.vencimento_checklist < today && r.status !== 'Validado'
    ).length;

    const tempos = records
      .map(r => r.sla_minutes ?? calcMinutes(r.horario_inicio, r.horario_fim))
      .filter((t): t is number => t !== null && t > 0);
    const tempoMedioMin = tempos.length > 0
      ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
      : 0;

    return { total, validados, pendencias, andamento, eficiencia, vencidos, tempoMedioMin };
  }, [records]);
}

export function byTurno<T extends { turno: string | null }>(records: T[]) {
  const map: Record<string, T[]> = {};
  records.forEach(r => {
    const t = r.turno ?? 'Outros';
    if (!map[t]) map[t] = [];
    map[t].push(r);
  });
  return map;
}

export function byAtendente<T extends { atendente: string | null; status: string | null }>(records: T[]) {
  const map: Record<string, { total: number; validados: number; pendencias: number }> = {};
  records.forEach(r => {
    const a = r.atendente ?? 'Sem Atendente';
    if (!map[a]) map[a] = { total: 0, validados: 0, pendencias: 0 };
    map[a].total++;
    if (r.status === 'Validado') map[a].validados++;
    if (r.status === 'Pendência') map[a].pendencias++;
  });
  return Object.entries(map)
    .map(([name, data]) => ({ name, ...data, eficiencia: data.total > 0 ? Math.round((data.validados / data.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);
}

export function byWeek<T extends { semana: string | null }>(records: T[]) {
  const map: Record<string, number> = {};
  records.forEach(r => {
    const s = r.semana ?? 'Sem semana';
    map[s] = (map[s] ?? 0) + 1;
  });
  return Object.entries(map)
    .map(([semana, total]) => ({ semana, total }))
    .sort((a, b) => a.semana.localeCompare(b.semana));
}

export function byMonth<T extends { mes: string | null }>(records: T[]) {
  const map: Record<string, number> = {};
  records.forEach(r => {
    const m = r.mes ?? 'Sem mês';
    map[m] = (map[m] ?? 0) + 1;
  });
  return Object.entries(map)
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

export function byDay<T extends { data: string | null }>(records: T[]) {
  const map: Record<string, number> = {};
  records.forEach(r => {
    const d = r.data ?? '';
    if (d) map[d] = (map[d] ?? 0) + 1;
  });
  return Object.entries(map)
    .map(([data, total]) => ({ data, total }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function tempoMedioPorAtendente<T extends { atendente: string | null; horario_inicio: string | null; horario_fim: string | null; sla_minutes: number | null }>(records: T[]) {
  const map: Record<string, { sum: number; count: number }> = {};
  records.forEach(r => {
    const a = r.atendente ?? 'Sem Atendente';
    const min = r.sla_minutes ?? calcMinutes(r.horario_inicio, r.horario_fim);
    if (min !== null && min > 0) {
      if (!map[a]) map[a] = { sum: 0, count: 0 };
      map[a].sum += min;
      map[a].count++;
    }
  });
  return Object.entries(map)
    .map(([name, d]) => ({ name, tempoMedio: d.count > 0 ? Math.round(d.sum / d.count) : 0, count: d.count }))
    .sort((a, b) => a.tempoMedio - b.tempoMedio);
}

export function mediaPorTurno<T extends { turno: string | null; status: string | null }>(records: T[]) {
  const map: Record<string, { total: number; validados: number }> = {};
  records.forEach(r => {
    const t = r.turno ?? 'Outros';
    if (!map[t]) map[t] = { total: 0, validados: 0 };
    map[t].total++;
    if (r.status === 'Validado') map[t].validados++;
  });
  return Object.entries(map)
    .map(([turno, d]) => ({ turno, ...d, media: d.total > 0 ? Math.round((d.validados / d.total) * 100) : 0 }))
    .sort((a, b) => a.turno.localeCompare(b.turno));
}

export function mediaPorAtendente<T extends { atendente: string | null; status: string | null }>(records: T[]) {
  const map: Record<string, { total: number; validados: number }> = {};
  records.forEach(r => {
    const a = r.atendente ?? 'Sem Atendente';
    if (!map[a]) map[a] = { total: 0, validados: 0 };
    map[a].total++;
    if (r.status === 'Validado') map[a].validados++;
  });
  return Object.entries(map)
    .map(([name, d]) => ({ name, ...d, media: d.total > 0 ? Math.round((d.validados / d.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);
}
