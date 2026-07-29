
-- Remove políticas restritivas de INSERT que conflitam com a aberta
DROP POLICY IF EXISTS "cadastro_insert" ON cadastro_records;
DROP POLICY IF EXISTS "auth_insert_cadastro" ON cadastro_records;

DROP POLICY IF EXISTS "checklist_insert" ON checklist_records;
DROP POLICY IF EXISTS "auth_insert_checklist" ON checklist_records;

-- Remove políticas restritivas de UPDATE que conflitam
DROP POLICY IF EXISTS "cadastro_update" ON cadastro_records;
DROP POLICY IF EXISTS "auth_update_cadastro" ON cadastro_records;

DROP POLICY IF EXISTS "checklist_update" ON checklist_records;
DROP POLICY IF EXISTS "auth_update_checklist" ON checklist_records;

-- Remove políticas restritivas de DELETE que conflitam
DROP POLICY IF EXISTS "cadastro_delete" ON cadastro_records;
DROP POLICY IF EXISTS "auth_delete_cadastro" ON cadastro_records;

DROP POLICY IF EXISTS "checklist_delete" ON checklist_records;
DROP POLICY IF EXISTS "auth_delete_checklist" ON checklist_records;

-- Garantir política única aberta de INSERT para cada tabela
DROP POLICY IF EXISTS "cadastro_insert_authenticated" ON cadastro_records;
CREATE POLICY "cadastro_insert_authenticated" ON cadastro_records
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "checklist_insert_authenticated" ON checklist_records;
CREATE POLICY "checklist_insert_authenticated" ON checklist_records
  FOR INSERT TO authenticated WITH CHECK (true);

-- Garantir política única aberta de UPDATE
DROP POLICY IF EXISTS "cadastro_update_authenticated" ON cadastro_records;
CREATE POLICY "cadastro_update_authenticated" ON cadastro_records
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "checklist_update_authenticated" ON checklist_records;
CREATE POLICY "checklist_update_authenticated" ON checklist_records
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Garantir política única aberta de DELETE
DROP POLICY IF EXISTS "cadastro_delete_authenticated" ON cadastro_records;
CREATE POLICY "cadastro_delete_authenticated" ON cadastro_records
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "checklist_delete_authenticated" ON checklist_records;
CREATE POLICY "checklist_delete_authenticated" ON checklist_records
  FOR DELETE TO authenticated USING (true);
