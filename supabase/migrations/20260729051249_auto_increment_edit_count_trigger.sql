-- Ensure column exists
ALTER TABLE cadastro_records ADD COLUMN IF NOT EXISTS edit_count integer NOT NULL DEFAULT 0;

-- Trigger that auto-increments edit_count on every UPDATE
CREATE OR REPLACE FUNCTION increment_edit_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.edit_count := OLD.edit_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_edit_count ON cadastro_records;

CREATE TRIGGER trg_increment_edit_count
  BEFORE UPDATE ON cadastro_records
  FOR EACH ROW
  EXECUTE FUNCTION increment_edit_count();

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
