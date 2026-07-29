
-- Promote the first admin (by created_at) to master so password reset works.
-- The edge function requires is_master=true to reset passwords.
UPDATE atendentes
SET is_master = true
WHERE id = (
  SELECT id FROM atendentes
  WHERE is_admin = true
  ORDER BY created_at ASC
  LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM atendentes WHERE is_master = true);
