-- ============================================================
-- Forced password change on first logon + master admin role
-- ============================================================
-- Run this in the SQL Editor of your VPS Supabase project.
--
-- 1) Adds `must_change_password` column to `atendentes`
--    When TRUE, the user is forced to change their password
--    on the next login. Set to TRUE when creating new operators.
--
-- 2) Adds `is_master` column to `atendentes`
--    When TRUE, the user is the master admin (suporte do sistema)
--    who can edit names, emails, and reset passwords of other accounts.
--
-- 3) Makes the first existing admin a master admin.
-- ============================================================

-- Add must_change_password column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'atendentes' AND column_name = 'must_change_password'
  ) THEN
    ALTER TABLE atendentes ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add is_master column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'atendentes' AND column_name = 'is_master'
  ) THEN
    ALTER TABLE atendentes ADD COLUMN is_master boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Promote the first existing admin to master (if none exists)
UPDATE atendentes
SET is_master = true
WHERE id = (
  SELECT id FROM atendentes
  WHERE is_admin = true
  ORDER BY created_at ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM atendentes WHERE is_master = true
);

-- ============================================================
-- RLS policies for the new columns (atendentes already has RLS)
-- The existing policies cover SELECT/UPDATE on atendentes,
-- so no new policies are needed — users can read/update their
-- own row including the new columns.
-- ============================================================
