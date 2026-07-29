/*
=====================================================================
# SISTEMA GRIS / CADASTRO — SCHEMA COMPLETO PARA VPS SELF-HOSTED
=====================================================================

## Como usar
1. Acesse o Supabase Studio da sua VPS:
   https://supabase2.losungexpress.app
2. Vá em "SQL Editor" (ou "SQL" no menu lateral).
3. Cole TODO este script e clique em "Run" (executar).
4. Pode executar múltiplas vezes sem erro (é idempotente).

## Tabelas criadas
- atendentes: perfis de usuário (operadores/gerentes)
- cadastro_records: cadastros realizados (motoristas/veículos)
- checklist_records: checklists operacionais
- metas: metas de produtividade semanais/mensais

## Após executar
- Crie sua conta de admin pelo app (tela de login).
- Depois execute no SQL Editor:
  UPDATE atendentes SET is_admin = true, can_manage_users = true
    WHERE email = 'seu-email@exemplo.com';
=====================================================================
*/

-- =====================================================================
-- 1. TABELA: atendentes (perfis de usuário)
-- =====================================================================
CREATE TABLE IF NOT EXISTS atendentes (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text UNIQUE,
  is_admin boolean NOT NULL DEFAULT false,
  can_add_checklist boolean NOT NULL DEFAULT true,
  can_add_cadastro boolean NOT NULL DEFAULT true,
  can_view_dashboard boolean NOT NULL DEFAULT true,
  can_manage_users boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  turno text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE atendentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_all_atendentes" ON atendentes;
CREATE POLICY "select_own_or_all_atendentes" ON atendentes FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "insert_atendente_manager" ON atendentes;
CREATE POLICY "insert_atendente_manager" ON atendentes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "update_atendente_manager" ON atendentes;
CREATE POLICY "update_atendente_manager" ON atendentes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "delete_atendente_admin" ON atendentes;
CREATE POLICY "delete_atendente_admin" ON atendentes FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid() AND a.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_atendentes_active ON atendentes(active);
CREATE INDEX IF NOT EXISTS idx_atendentes_turno ON atendentes(turno);

-- =====================================================================
-- 2. TABELA: cadastro_records (cadastros realizados)
-- =====================================================================
CREATE TABLE IF NOT EXISTS cadastro_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mes text,
  turno text,
  operacao text,
  classificacao text,
  data date,
  horario_inicio time,
  pis text,
  motorista text,
  telefone text,
  eta_origem text,
  placa_cavalo text,
  tipo text,
  ano_cavalo text,
  placa_carreta text,
  ano_carreta text,
  atendente text,
  tentativa1 text,
  tentativa2 text,
  tentativa3 text,
  tipo_cadastro text,
  status text NOT NULL DEFAULT 'Andamento',
  pendencia_recusa text,
  horario_fim time,
  obs text,
  semana text,
  sla_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cadastro_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_cadastro" ON cadastro_records;
CREATE POLICY "auth_select_cadastro" ON cadastro_records FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "auth_insert_cadastro" ON cadastro_records;
CREATE POLICY "auth_insert_cadastro" ON cadastro_records FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "auth_update_cadastro" ON cadastro_records;
CREATE POLICY "auth_update_cadastro" ON cadastro_records FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "auth_delete_cadastro" ON cadastro_records;
CREATE POLICY "auth_delete_cadastro" ON cadastro_records FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

CREATE INDEX IF NOT EXISTS idx_cadastro_data ON cadastro_records(data);
CREATE INDEX IF NOT EXISTS idx_cadastro_turno ON cadastro_records(turno);
CREATE INDEX IF NOT EXISTS idx_cadastro_atendente ON cadastro_records(atendente);
CREATE INDEX IF NOT EXISTS idx_cadastro_status ON cadastro_records(status);
CREATE INDEX IF NOT EXISTS idx_cadastro_mes ON cadastro_records(mes);
CREATE INDEX IF NOT EXISTS idx_cadastro_operacao ON cadastro_records(operacao);
CREATE INDEX IF NOT EXISTS idx_cadastro_user_id ON cadastro_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cadastro_created_at ON cadastro_records(created_at);

-- =====================================================================
-- 3. TABELA: checklist_records (checklists operacionais)
-- =====================================================================
CREATE TABLE IF NOT EXISTS checklist_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mes text,
  turno text,
  operacao text,
  classificacao text,
  data date,
  horario_inicio time,
  protocolo text,
  eta_origem text,
  motorista text,
  telefone text,
  segundo_motorista text,
  placa_cavalo text,
  placa_carreta text,
  atendente text,
  obs text,
  tentativa1 text,
  tentativa2 text,
  tentativa3 text,
  status text NOT NULL DEFAULT 'Reprovado',
  pendencia text,
  vencimento_checklist date,
  horario_fim time,
  semana text,
  sla_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE checklist_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_checklist" ON checklist_records;
CREATE POLICY "auth_select_checklist" ON checklist_records FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "auth_insert_checklist" ON checklist_records;
CREATE POLICY "auth_insert_checklist" ON checklist_records FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "auth_update_checklist" ON checklist_records;
CREATE POLICY "auth_update_checklist" ON checklist_records FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "auth_delete_checklist" ON checklist_records;
CREATE POLICY "auth_delete_checklist" ON checklist_records FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

CREATE INDEX IF NOT EXISTS idx_checklist_data ON checklist_records(data);
CREATE INDEX IF NOT EXISTS idx_checklist_turno ON checklist_records(turno);
CREATE INDEX IF NOT EXISTS idx_checklist_atendente ON checklist_records(atendente);
CREATE INDEX IF NOT EXISTS idx_checklist_status ON checklist_records(status);
CREATE INDEX IF NOT EXISTS idx_checklist_mes ON checklist_records(mes);
CREATE INDEX IF NOT EXISTS idx_checklist_operacao ON checklist_records(operacao);
CREATE INDEX IF NOT EXISTS idx_checklist_vencimento ON checklist_records(vencimento_checklist);
CREATE INDEX IF NOT EXISTS idx_checklist_user_id ON checklist_records(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_created_at ON checklist_records(created_at);

-- =====================================================================
-- 4. TABELA: metas (metas de produtividade)
-- =====================================================================
CREATE TABLE IF NOT EXISTS metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_periodo text NOT NULL CHECK (tipo_periodo IN ('semana', 'mes')),
  periodo_referencia text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  valor_alvo integer NOT NULL DEFAULT 0 CHECK (valor_alvo >= 0),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_metas" ON metas;
CREATE POLICY "select_metas" ON metas FOR SELECT
  TO authenticated USING (
    ativo = true
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "insert_metas_manager" ON metas;
CREATE POLICY "insert_metas_manager" ON metas FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "update_metas_manager" ON metas;
CREATE POLICY "update_metas_manager" ON metas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

DROP POLICY IF EXISTS "delete_metas_manager" ON metas;
CREATE POLICY "delete_metas_manager" ON metas FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM atendentes a
      WHERE a.id = auth.uid()
      AND (a.is_admin = true OR a.can_manage_users = true)
    )
  );

CREATE INDEX IF NOT EXISTS idx_metas_ativo ON metas(ativo);
CREATE INDEX IF NOT EXISTS idx_metas_user_id ON metas(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_periodo ON metas(tipo_periodo, periodo_referencia);

-- =====================================================================
-- 5. TRIGGER: auto-criar perfil de atendente no signup
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_atendente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.atendentes (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_atendente();

-- =====================================================================
-- 6. TRIGGER: atualizar updated_at na tabela metas
-- =====================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_metas_update ON metas;
CREATE TRIGGER on_metas_update
  BEFORE UPDATE ON metas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================================
-- 7. CONSTRAINTS de status (CHECK)
-- =====================================================================
ALTER TABLE cadastro_records DROP CONSTRAINT IF EXISTS chk_cadastro_status;
ALTER TABLE cadastro_records ADD CONSTRAINT chk_cadastro_status
  CHECK (status IN ('Validado', 'Pendência', 'Recusado', 'Andamento'));

ALTER TABLE checklist_records DROP CONSTRAINT IF EXISTS chk_checklist_status;
ALTER TABLE checklist_records ADD CONSTRAINT chk_checklist_status
  CHECK (status IN ('Validado', 'Pendência', 'Reprovado'));

-- =====================================================================
-- 8. PADRONIZAR NOMES DE TURNO (T1, T2, T3)
-- =====================================================================
-- Converte valores antigos de turno para o novo padrão T1/T2/T3
UPDATE atendentes SET turno = 'T1' WHERE turno IN ('Manhã', '1T');
UPDATE atendentes SET turno = 'T2' WHERE turno IN ('Tarde', '2T');
UPDATE atendentes SET turno = 'T3' WHERE turno IN ('Noite', '3T');

UPDATE cadastro_records SET turno = 'T1' WHERE turno IN ('Manhã', '1T');
UPDATE cadastro_records SET turno = 'T2' WHERE turno IN ('Tarde', '2T');
UPDATE cadastro_records SET turno = 'T3' WHERE turno IN ('Noite', '3T');

UPDATE checklist_records SET turno = 'T1' WHERE turno IN ('Manhã', '1T');
UPDATE checklist_records SET turno = 'T2' WHERE turno IN ('Tarde', '2T');
UPDATE checklist_records SET turno = 'T3' WHERE turno IN ('Noite', '3T');

-- =====================================================================
-- 9. PROMOVER PRIMEIRO USUÁRIO A ADMIN (executar depois do signup)
-- =====================================================================
-- UPDATE atendentes SET is_admin = true, can_manage_users = true
--   WHERE email = 'seu-email@exemplo.com';
