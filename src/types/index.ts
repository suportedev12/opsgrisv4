export interface CadastroRealizado {
  id: string;
  user_id: string | null;
  mes: string | null;
  turno: string | null;
  operacao: string | null;
  classificacao: string | null;
  data: string | null;
  horario_inicio: string | null;
  pis: string | null;
  motorista: string | null;
  telefone: string | null;
  eta_origem: string | null;
  placa_cavalo: string | null;
  tipo: string | null;
  ano_cavalo: string | null;
  placa_carreta: string | null;
  ano_carreta: string | null;
  atendente: string | null;
  tentativa1: string | null;
  tentativa2: string | null;
  tentativa3: string | null;
  tipo_cadastro: string | null;
  status: string | null;
  pendencia_recusa: string | null;
  horario_fim: string | null;
  obs: string | null;
  semana: string | null;
  sla_minutes: number | null;
  created_at: string;
}

export interface ChecklistOperacional {
  id: string;
  user_id: string | null;
  mes: string | null;
  turno: string | null;
  operacao: string | null;
  classificacao: string | null;
  data: string | null;
  horario_inicio: string | null;
  protocolo: string | null;
  eta_origem: string | null;
  motorista: string | null;
  telefone: string | null;
  segundo_motorista: string | null;
  placa_cavalo: string | null;
  placa_carreta: string | null;
  atendente: string | null;
  obs: string | null;
  tentativa1: string | null;
  tentativa2: string | null;
  tentativa3: string | null;
  status: string | null;
  pendencia: string | null;
  vencimento_checklist: string | null;
  horario_fim: string | null;
  semana: string | null;
  sla_minutes: number | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  nome: string;
  email: string | null;
  is_admin: boolean;
  can_add_checklist: boolean;
  can_add_cadastro: boolean;
  can_view_dashboard: boolean;
  can_manage_users: boolean;
  active: boolean;
  created_at: string;
}

export type ActiveTab = 'dashboard' | 'cadastro' | 'checklist' | 'performance' | 'operadores' | 'metas';

export interface Meta {
  id: string;
  tipo_periodo: 'semana' | 'mes';
  periodo_referencia: string;
  titulo: string;
  descricao: string | null;
  valor_alvo: number;
  user_id: string | null;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type Role = 'gerente' | 'operador';

export interface Filters {
  turno: string;
  atendente: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  search: string;
}

export type Period = 'hoje' | 'semana' | 'mes' | 'trimestre' | 'ano' | 'custom';
