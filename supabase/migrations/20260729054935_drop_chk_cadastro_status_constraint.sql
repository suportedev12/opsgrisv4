
-- Remove the check constraint that blocks empty-string status values.
-- Validation is handled entirely in the frontend; the DB constraint causes
-- more breakage than protection here.
ALTER TABLE public.cadastro_records DROP CONSTRAINT IF EXISTS chk_cadastro_status;
