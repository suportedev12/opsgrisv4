import type { CadastroRealizado, ChecklistOperacional, Filters } from '@/types';

export function filterCadastros(records: CadastroRealizado[], filters: Filters): CadastroRealizado[] {
  return records.filter(r => {
    if (filters.turno && r.turno !== filters.turno) return false;
    if (filters.atendente && r.atendente !== filters.atendente) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.dataInicio && r.data && r.data < filters.dataInicio) return false;
    if (filters.dataFim && r.data && r.data > filters.dataFim) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [r.motorista, r.atendente, r.placa_cavalo, r.placa_carreta, r.pis]
        .map(v => v ?? '').join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function filterChecklists(records: ChecklistOperacional[], filters: Filters): ChecklistOperacional[] {
  return records.filter(r => {
    if (filters.turno && r.turno !== filters.turno) return false;
    if (filters.atendente && r.atendente !== filters.atendente) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.dataInicio && r.data && r.data < filters.dataInicio) return false;
    if (filters.dataFim && r.data && r.data > filters.dataFim) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [r.motorista, r.atendente, r.placa_cavalo, r.placa_carreta, r.protocolo]
        .map(v => v ?? '').join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function getUniqueAtendentes(cadastros: CadastroRealizado[], checklists: ChecklistOperacional[]): string[] {
  const set = new Set<string>();
  cadastros.forEach(r => { if (r.atendente) set.add(r.atendente); });
  checklists.forEach(r => { if (r.atendente) set.add(r.atendente); });
  return Array.from(set).sort();
}
