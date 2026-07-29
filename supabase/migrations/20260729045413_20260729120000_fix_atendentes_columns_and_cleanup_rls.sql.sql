/*
# Fix atendentes columns and clean up RLS policies

## What this migration does

1. Add missing columns to `atendentes` table:
   - `must_change_password` (boolean, default false) — used by the frontend to force
     new operators to change their temporary password on first login.
   - `is_master` (boolean, default false) — used by the frontend to identify the
     super-admin who can edit names, emails, and reset passwords of other users.

   Without these columns, the Operadores (Operators) screen breaks because it
   tries to read and update fields that don't exist in the database.

2. Clean up duplicate RLS policies on `cadastro_records` and `checklist_records`:
   - There are currently 3 overlapping SELECT policies on each table. We drop all
     duplicates and keep a single SELECT policy per table that allows any
     authenticated user to read all records (managers see everything, operators
     see everything — the frontend filters by user_id/atendente client-side).
   - INSERT, UPDATE, DELETE policies are kept as-is (they already allow any
     authenticated user to perform these operations).

3. No data is lost. No tables or columns are dropped. Only duplicate policies
   are removed and two new boolean columns are added with safe defaults.

## Tables modified
- `atendentes` — two new columns added
- `cadastro_records` — duplicate SELECT policies dropped
- `checklist_records` — duplicate SELECT policies dropped

## Security
- RLS remains enabled on all tables.
- All policies remain scoped to `authenticated` role.
- No policy is relaxed — the cleanup only removes exact-duplicate policies.
*/

-- 1. Add missing columns to atendentes
ALTER TABLE atendentes
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_master boolean NOT NULL DEFAULT false;

-- 2. Clean up duplicate SELECT policies on cadastro_records
--    Keep only one: cadastro_select_authenticated (USING true)
DROP POLICY IF EXISTS "cadastro_select" ON cadastro_records;
DROP POLICY IF EXISTS "auth_select_cadastro" ON cadastro_records;
DROP POLICY IF EXISTS "cadastro_select_authenticated" ON cadastro_records;

CREATE POLICY "cadastro_select_authenticated" ON cadastro_records
  FOR SELECT TO authenticated USING (true);

-- 3. Clean up duplicate SELECT policies on checklist_records
--    Keep only one: checklist_select_authenticated (USING true)
DROP POLICY IF EXISTS "checklist_select" ON checklist_records;
DROP POLICY IF EXISTS "auth_select_checklist" ON checklist_records;
DROP POLICY IF EXISTS "checklist_select_authenticated" ON checklist_records;

CREATE POLICY "checklist_select_authenticated" ON checklist_records
  FOR SELECT TO authenticated USING (true);
