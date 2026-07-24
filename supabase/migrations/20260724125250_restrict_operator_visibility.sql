/*
# Restringir visibilidade de registros por operador

## Descrição
Atualmente, todos os operadores autenticados conseguem ver todos os registros
de cadastro e checklist (inclusive dos colegas). Esta migration altera as
políticas RLS para que:
- Operadores comuns (não admin/gerente) só consigam ver, editar e excluir
  os PRÓPRIOS registros (user_id = auth.uid()).
- Admins e gerentes (is_admin ou can_manage_users) continuem com acesso total.

## Tabelas afetadas
- `cadastro_records` — SELECT/INSERT/UPDATE/DELETE agora verificam ownership
  para não-gerentes.
- `checklist_records` — SELECT/INSERT/UPDATE/DELETE agora verificam ownership
  para não-gerentes.

## Segurança
- SELECT: não-gerente só vê user_id = auth.uid(); gerente vê tudo.
- INSERT: não-gerente só insere com user_id = auth.uid() (já é o default).
- UPDATE/DELETE: não-gerente só atua em user_id = auth.uid(); gerente atua em tudo.
*/

-- =====================
-- CADASTRO_RECORDS
-- =====================
DROP POLICY IF EXISTS "auth_select_cadastro" ON cadastro_records;
CREATE POLICY "auth_select_cadastro" ON cadastro_records FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  );

DROP POLICY IF EXISTS "auth_insert_cadastro" ON cadastro_records;
CREATE POLICY "auth_insert_cadastro" ON cadastro_records FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  );

DROP POLICY IF EXISTS "auth_update_cadastro" ON cadastro_records;
CREATE POLICY "auth_update_cadastro" ON cadastro_records FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  );

DROP POLICY IF EXISTS "auth_delete_cadastro" ON cadastro_records;
CREATE POLICY "auth_delete_cadastro" ON cadastro_records FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  );

-- =====================
-- CHECKLIST_RECORDS
-- =====================
DROP POLICY IF EXISTS "auth_select_checklist" ON checklist_records;
CREATE POLICY "auth_select_checklist" ON checklist_records FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  );

DROP POLICY IF EXISTS "auth_insert_checklist" ON checklist_records;
CREATE POLICY "auth_insert_checklist" ON checklist_records FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  );

DROP POLICY IF EXISTS "auth_update_checklist" ON checklist_records;
CREATE POLICY "auth_update_checklist" ON checklist_records FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  );

DROP POLICY IF EXISTS "auth_delete_checklist" ON checklist_records;
CREATE POLICY "auth_delete_checklist" ON checklist_records FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM atendentes a WHERE a.id = auth.uid() AND (a.is_admin = true OR a.can_manage_users = true))
  );
