-- Replace 'Andamento' with 'Reprovado' in checklist status
-- 1. Drop old constraint first (it blocks the UPDATE)
ALTER TABLE checklist_records DROP CONSTRAINT IF EXISTS chk_checklist_status;

-- 2. Normalize all non-standard statuses to 'Reprovado'
UPDATE checklist_records SET status = 'Reprovado'
  WHERE status NOT IN ('Validado', 'Pendência', 'Reprovado');

-- 3. Add new constraint
ALTER TABLE checklist_records ADD CONSTRAINT chk_checklist_status
  CHECK (status IN ('Reprovado', 'Validado', 'Pendência'));