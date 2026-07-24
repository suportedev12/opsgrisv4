export interface CadastroRealizado {
  id: string;
  mes: string | null;
  turno: string | null;
  operacao: string | null;
  classificacao: string | null;
  data: string | null;
  horario_inicio: string | null;
  pis: string | null;
  motorista: string | null;
  placa_cavalo: string | null;
  tipo_veiculo: string | null;
  ano_cavalo: string | null;
  placa_carreta: string | null;
  ano_carreta: string | null;
  atendente: string | null;
  tentativa_1: string | null;
  tentativa_2: string | null;
  tentativa_3: string | null;
  tipo: string | null;
  status: string | null;
  pendencia_recusa: string | null;
  horario_fim: string | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistOperacional {
  id: string;
  mes: string | null;
  turno: string | null;
  operacao: string | null;
  classificacao: string | null;
  data: string | null;
  horario_inicio: string | null;
  protocolo: string | null;
  eta: string | null;
  origem: string | null;
  motorista: string | null;
  telefone: string | null;
  motorista_2: string | null;
  placa_cavalo: string | null;
  placa_carreta: string | null;
  atendente: string | null;
  obs: string | null;
  tentativa_1: string | null;
  tentativa_2: string | null;
  tentativa_3: string | null;
  status: string | null;
  vencimento_checklist: string | null;
  horario_fim: string | null;
  semana: string | null;
  created_at: string;
  updated_at: string;
}

export type ActiveTab = 'dashboard' | 'cadastro' | 'checklist' | 'performance';

export type Role = 'gerente' | 'operador';

export type OperatorTab = 'cadastro' | 'checklist';

export interface Filters {
  turno: string;
  atendente: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  search: string;
}
