-- 1. Drop orphan tables that are no longer used by the app
DROP TABLE IF EXISTS cadastro_realizado CASCADE;
DROP TABLE IF EXISTS checklist_operacional CASCADE;

-- 2. Drop any stale/cached check constraint on status
ALTER TABLE cadastro_records DROP CONSTRAINT IF EXISTS chk_cadastro_status;

-- 3. Re-add correct constraint matching exactly what the form sends
ALTER TABLE cadastro_records
  ADD CONSTRAINT chk_cadastro_status
  CHECK (status IS NULL OR status = ANY(ARRAY['Pendente', 'Validado', 'Recusado']));

-- 4. Ensure the edit_count auto-increment trigger is in place
CREATE OR REPLACE FUNCTION increment_edit_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.edit_count := COALESCE(OLD.edit_count, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_edit_count ON cadastro_records;
CREATE TRIGGER trg_increment_edit_count
  BEFORE UPDATE ON cadastro_records
  FOR EACH ROW
  EXECUTE FUNCTION increment_edit_count();

-- 5. Force PostgREST to fully reload its schema cache
NOTIFY pgrst, 'reload schema';
