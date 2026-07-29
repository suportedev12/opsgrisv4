
-- Remover constraint antiga que não bate com os valores do front-end
ALTER TABLE checklist_records DROP CONSTRAINT IF EXISTS chk_checklist_status;

-- Recriar com os valores corretos usados pelo front-end
ALTER TABLE checklist_records
  ADD CONSTRAINT chk_checklist_status
  CHECK (status IS NULL OR status = ANY (ARRAY['Pendente', 'Validado', 'Recusado', 'Reprovado', 'Pendência']));
