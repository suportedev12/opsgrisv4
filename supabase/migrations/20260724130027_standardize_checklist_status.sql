/*
# Padronizar status do checklist para 3 valores

## Descrição
A base de checklist deve ter apenas 3 status: Andamento, Validado e Pendência.
Esta migration:
1. Normaliza registros com status vazio ou inválido para 'Andamento'.
2. Adiciona constraint CHECK para garantir apenas os 3 status permitidos.
*/

-- Normalizar status vazios/inválidos para 'Andamento'
UPDATE checklist_records
SET status = 'Andamento'
WHERE status IS NULL OR status = '' OR status NOT IN ('Andamento', 'Validado', 'Pendência');

-- Adicionar constraint CHECK
ALTER TABLE checklist_records DROP CONSTRAINT IF EXISTS chk_checklist_status;
ALTER TABLE checklist_records ADD CONSTRAINT chk_checklist_status
  CHECK (status IN ('Andamento', 'Validado', 'Pendência'));
