/*
# Habilitar RLS + Auto-perfil de Usuário

## Descrição
O banco já possui as tabelas `atendentes`, `cadastro_records` e `checklist_records`
com dados reais (milhares de linhas), mas SEM RLS habilitado. Esta migration:
1. Habilita RLS em todas as três tabelas.
2. Adiciona políticas `TO authenticated` (sistema agora tem tela de login).
3. Cria trigger para auto-criar perfil em `atendentes` quando um usuário se cadastra
   no Supabase Auth.

## Tabelas afetadas
- `atendentes` — RLS: usuário vê próprio perfil; admin/gerente (is_admin ou
  can_manage_users) vêem todos. Apenas admin/gerente podem inserir/atualizar.
- `cadastro_records` — RLS: todos os autenticados podem CRUD (dados compartilhados).
- `checklist_records` — RLS: todos os autenticados podem CRUD (dados compartilhados).

## Trigger
- `handle_new_atendente` — AFTER INSERT em auth.users → cria linha em `atendentes`
  com nome/email do novo usuário, permissões padrão de operador.
*/

-- =====================
-- RLS em ATENDETES (user profiles)
-- =====================
ALTER TABLE atendentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_all_atendentes" ON atendentes;
CREATE POLICY "select_own_or_all_atendentes" ON atendentes FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  );

DROP POLICY IF EXISTS "insert_atendente_manager" ON atendentes;
CREATE POLICY "insert_atendente_manager" ON atendentes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  );

DROP POLICY IF EXISTS "update_atendente_manager" ON atendentes;
CREATE POLICY "update_atendente_manager" ON atendentes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  );

DROP POLICY IF EXISTS "delete_atendente_admin" ON atendentes;
CREATE POLICY "delete_atendente_admin" ON atendentes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND a.is_admin = true)
  );

-- =====================
-- RLS em CADASTRO_RECORDS (dados compartilhados entre autenticados)
-- =====================
ALTER TABLE cadastro_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_cadastro" ON cadastro_records;
CREATE POLICY "auth_select_cadastro" ON cadastro_records FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_cadastro" ON cadastro_records;
CREATE POLICY "auth_insert_cadastro" ON cadastro_records FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_cadastro" ON cadastro_records;
CREATE POLICY "auth_update_cadastro" ON cadastro_records FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_cadastro" ON cadastro_records;
CREATE POLICY "auth_delete_cadastro" ON cadastro_records FOR DELETE
  TO authenticated USING (true);

-- =====================
-- RLS em CHECKLIST_RECORDS (dados compartilhados entre autenticados)
-- =====================
ALTER TABLE checklist_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_checklist" ON checklist_records;
CREATE POLICY "auth_select_checklist" ON checklist_records FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_checklist" ON checklist_records;
CREATE POLICY "auth_insert_checklist" ON checklist_records FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_checklist" ON checklist_records;
CREATE POLICY "auth_update_checklist" ON checklist_records FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_checklist" ON checklist_records;
CREATE POLICY "auth_delete_checklist" ON checklist_records FOR DELETE
  TO authenticated USING (true);

-- =====================
-- TRIGGER: auto-create atendente profile on signup
-- =====================
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
