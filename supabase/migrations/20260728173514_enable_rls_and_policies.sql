/*
# Enable RLS and Security Policies on All Tables

## Description
Enables Row Level Security (RLS) on all four existing tables (atendentes,
cadastro_records, checklist_records, metas) and creates the appropriate
security policies. Also adds the auto-profile trigger on auth.users and
the updated_at trigger on metas.

## Security Changes

### atendentes
- SELECT: users can read their own profile; admins/managers can read all
- INSERT: only admins/managers can create new atendente profiles
- UPDATE: only admins/managers can update profiles
- DELETE: only admins can delete profiles

### cadastro_records
- SELECT/INSERT/UPDATE/DELETE: users access only their own rows;
  admins/managers have full access to all rows

### checklist_records
- SELECT/INSERT/UPDATE/DELETE: users access only their own rows;
  admins/managers have full access to all rows

### metas
- SELECT: all authenticated users can read active metas + their own metas;
  admins/managers can read all
- INSERT/UPDATE/DELETE: only admins/managers

## Triggers
- on_auth_user_created: auto-creates atendente profile on signup
- on_metas_update: auto-updates updated_at column

## Important Notes
1. All policies use DROP IF EXISTS before CREATE for idempotency
2. The trigger function is SECURITY DEFINER to allow inserting into
   atendentes during the auth signup flow
3. Existing data is preserved — only security policies are added
*/

-- =====================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================================
ALTER TABLE atendentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadastro_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 2. POLICIES: atendentes
-- =====================================================================
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

-- =====================================================================
-- 3. POLICIES: cadastro_records
-- =====================================================================
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

-- =====================================================================
-- 4. POLICIES: checklist_records
-- =====================================================================
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

-- =====================================================================
-- 5. POLICIES: metas
-- =====================================================================
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

-- =====================================================================
-- 6. TRIGGER: auto-criar perfil de atendente no signup
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
-- 7. TRIGGER: atualizar updated_at na tabela metas
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
-- 8. INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_atendentes_active ON atendentes(active);

CREATE INDEX IF NOT EXISTS idx_cadastro_data ON cadastro_records(data);
CREATE INDEX IF NOT EXISTS idx_cadastro_turno ON cadastro_records(turno);
CREATE INDEX IF NOT EXISTS idx_cadastro_atendente ON cadastro_records(atendente);
CREATE INDEX IF NOT EXISTS idx_cadastro_status ON cadastro_records(status);
CREATE INDEX IF NOT EXISTS idx_cadastro_mes ON cadastro_records(mes);
CREATE INDEX IF NOT EXISTS idx_cadastro_operacao ON cadastro_records(operacao);
CREATE INDEX IF NOT EXISTS idx_cadastro_user_id ON cadastro_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cadastro_created_at ON cadastro_records(created_at);

CREATE INDEX IF NOT EXISTS idx_checklist_data ON checklist_records(data);
CREATE INDEX IF NOT EXISTS idx_checklist_turno ON checklist_records(turno);
CREATE INDEX IF NOT EXISTS idx_checklist_atendente ON checklist_records(atendente);
CREATE INDEX IF NOT EXISTS idx_checklist_status ON checklist_records(status);
CREATE INDEX IF NOT EXISTS idx_checklist_mes ON checklist_records(mes);
CREATE INDEX IF NOT EXISTS idx_checklist_operacao ON checklist_records(operacao);
CREATE INDEX IF NOT EXISTS idx_checklist_vencimento ON checklist_records(vencimento_checklist);
CREATE INDEX IF NOT EXISTS idx_checklist_user_id ON checklist_records(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_created_at ON checklist_records(created_at);

CREATE INDEX IF NOT EXISTS idx_metas_ativo ON metas(ativo);
CREATE INDEX IF NOT EXISTS idx_metas_user_id ON metas(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_periodo ON metas(tipo_periodo, periodo_referencia);
