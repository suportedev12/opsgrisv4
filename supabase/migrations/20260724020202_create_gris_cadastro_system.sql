
/*
# Sistema GRIS / CADASTRO - Schema Completo

## Descrição
Cria as tabelas principais do sistema de gerenciamento GRIS/CADASTRO:
- `cadastro_realizado`: registro de cadastros de motoristas/veículos com status, tentativas e tempos
- `checklist_operacional`: checklist operacional com protocolo, ETA, motoristas, tentativas e status

## Tabelas

### cadastro_realizado
- `id` (uuid, PK)
- `mes` (text) — mês de referência
- `turno` (text) — 1T, 2T, 3T
- `operacao` (text) — nome da operação
- `classificacao` (text) — tipo de classificação
- `data` (date) — data do cadastro
- `horario_inicio` (time) — horário de início
- `pis` (text) — PIS do motorista
- `motorista` (text) — nome do motorista
- `placa_cavalo` (text) — placa do cavalo mecânico
- `tipo_veiculo` (text) — tipo do veículo
- `ano_cavalo` (text) — ano do cavalo
- `placa_carreta` (text) — placa da carreta
- `ano_carreta` (text) — ano da carreta
- `atendente` (text) — nome do atendente
- `tentativa_1` (text) — 1ª tentativa
- `tentativa_2` (text) — 2ª tentativa
- `tentativa_3` (text) — 3ª tentativa
- `tipo` (text) — tipo de cadastro
- `status` (text) — Validado, Pendência, Recusado, Andamento
- `pendencia_recusa` (text) — descrição da pendência ou recusa
- `horario_fim` (time) — horário de fim
- `obs` (text) — observações

### checklist_operacional
- `id` (uuid, PK)
- `mes` (text)
- `turno` (text)
- `operacao` (text)
- `classificacao` (text)
- `data` (date)
- `horario_inicio` (time)
- `protocolo` (text) — número de protocolo
- `eta` (text) — ETA de origem
- `origem` (text) — origem
- `motorista` (text)
- `telefone` (text)
- `motorista_2` (text) — 2º motorista
- `placa_cavalo` (text)
- `placa_carreta` (text)
- `atendente` (text)
- `obs` (text)
- `tentativa_1` (text)
- `tentativa_2` (text)
- `tentativa_3` (text)
- `status` (text) — Pendência, Validado, Andamento
- `vencimento_checklist` (date) — data de vencimento do checklist
- `horario_fim` (time)
- `semana` (text) — semana do mês

## Segurança
- RLS habilitado em ambas as tabelas
- Políticas permitem acesso anônimo e autenticado (sistema interno sem login)
*/

-- =====================
-- CADASTRO REALIZADO
-- =====================
CREATE TABLE IF NOT EXISTS cadastro_realizado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes text,
  turno text,
  operacao text,
  classificacao text,
  data date,
  horario_inicio time,
  pis text,
  motorista text,
  placa_cavalo text,
  tipo_veiculo text,
  ano_cavalo text,
  placa_carreta text,
  ano_carreta text,
  atendente text,
  tentativa_1 text,
  tentativa_2 text,
  tentativa_3 text,
  tipo text,
  status text DEFAULT 'Andamento',
  pendencia_recusa text,
  horario_fim time,
  obs text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cadastro_realizado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cadastro" ON cadastro_realizado;
CREATE POLICY "anon_select_cadastro" ON cadastro_realizado FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cadastro" ON cadastro_realizado;
CREATE POLICY "anon_insert_cadastro" ON cadastro_realizado FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cadastro" ON cadastro_realizado;
CREATE POLICY "anon_update_cadastro" ON cadastro_realizado FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cadastro" ON cadastro_realizado;
CREATE POLICY "anon_delete_cadastro" ON cadastro_realizado FOR DELETE
  TO anon, authenticated USING (true);

-- Índices para cadastro_realizado
CREATE INDEX IF NOT EXISTS idx_cadastro_data ON cadastro_realizado(data);
CREATE INDEX IF NOT EXISTS idx_cadastro_turno ON cadastro_realizado(turno);
CREATE INDEX IF NOT EXISTS idx_cadastro_atendente ON cadastro_realizado(atendente);
CREATE INDEX IF NOT EXISTS idx_cadastro_status ON cadastro_realizado(status);
CREATE INDEX IF NOT EXISTS idx_cadastro_mes ON cadastro_realizado(mes);

-- =====================
-- CHECKLIST OPERACIONAL
-- =====================
CREATE TABLE IF NOT EXISTS checklist_operacional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes text,
  turno text,
  operacao text,
  classificacao text,
  data date,
  horario_inicio time,
  protocolo text,
  eta text,
  origem text,
  motorista text,
  telefone text,
  motorista_2 text,
  placa_cavalo text,
  placa_carreta text,
  atendente text,
  obs text,
  tentativa_1 text,
  tentativa_2 text,
  tentativa_3 text,
  status text DEFAULT 'Andamento',
  vencimento_checklist date,
  horario_fim time,
  semana text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_operacional ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_checklist" ON checklist_operacional;
CREATE POLICY "anon_select_checklist" ON checklist_operacional FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_checklist" ON checklist_operacional;
CREATE POLICY "anon_insert_checklist" ON checklist_operacional FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_checklist" ON checklist_operacional;
CREATE POLICY "anon_update_checklist" ON checklist_operacional FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_checklist" ON checklist_operacional;
CREATE POLICY "anon_delete_checklist" ON checklist_operacional FOR DELETE
  TO anon, authenticated USING (true);

-- Índices para checklist_operacional
CREATE INDEX IF NOT EXISTS idx_checklist_data ON checklist_operacional(data);
CREATE INDEX IF NOT EXISTS idx_checklist_turno ON checklist_operacional(turno);
CREATE INDEX IF NOT EXISTS idx_checklist_atendente ON checklist_operacional(atendente);
CREATE INDEX IF NOT EXISTS idx_checklist_status ON checklist_operacional(status);
CREATE INDEX IF NOT EXISTS idx_checklist_mes ON checklist_operacional(mes);
CREATE INDEX IF NOT EXISTS idx_checklist_vencimento ON checklist_operacional(vencimento_checklist);
