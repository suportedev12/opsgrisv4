import { useMemo } from 'react';
import type { CadastroRealizado, ChecklistOperacional } from '@/types';

interface KPIData {
  totalCadastros: number;
  validados: number;
  pendencias: number;
  recusados: number;
  andamento: number;
  eficiencia: number;
  tempoMedioMin: number;
  slaScore: number;
}

function calcMinutes(inicio: string | null, fim: string | null): number | null {
  if (!inicio || !fim) return null;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff > 0 ? diff : null;
}

export function useCadastroKPIs(records: CadastroRealizado[]): KPIData {
  return useMemo(() => {
    const total = records.length;
    const validados = records.filter(r => r.status === 'Validado').length;
    const pendencias = records.filter(r => r.status === 'Pendência').length;
    const recusados = records.filter(r => r.status === 'Recusado').length;
    const andamento = records.filter(r => r.status === 'Andamento').length;
    const eficiencia = total > 0 ? Math.round((validados / total) * 100) : 0;

    const tempos = records
      .map(r => calcMinutes(r.horario_inicio, r.horario_fim))
      .filter((t): t is number => t !== null);
    const tempoMedioMin = tempos.length > 0
      ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
      : 0;

    const slaTarget = 10;
    const slaScore = tempoMedioMin === 0 ? 100 : Math.max(0, Math.round(100 - ((tempoMedioMin - slaTarget) / slaTarget) * 50));

    return { totalCadastros: total, validados, pendencias, recusados, andamento, eficiencia, tempoMedioMin, slaScore };
  }, [records]);
}

export function useChecklistKPIs(records: ChecklistOperacional[]) {
  return useMemo(() => {
    const total = records.length;
    const validados = records.filter(r => r.status === 'Validado').length;
    const pendencias = records.filter(r => r.status === 'Pendência').length;
    const andamento = records.filter(r => r.status === 'Andamento').length;
    const eficiencia = total > 0 ? Math.round((validados / total) * 100) : 0;

    const today = new Date().toISOString().split('T')[0];
    const vencidos = records.filter(r => r.vencimento_checklist && r.vencimento_checklist < today && r.status !== 'Validado').length;

    return { total, validados, pendencias, andamento, eficiencia, vencidos };
  }, [records]);
}

export function byTurno<T extends { turno: string | null }>(records: T[]) {
  const map: Record<string, T[]> = { '1T': [], '2T': [], '3T': [] };
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
