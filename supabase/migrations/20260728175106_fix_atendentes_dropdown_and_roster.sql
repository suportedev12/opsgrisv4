/*
# Fix atendentes dropdown: add missing operators and allow all users to read

## Changes
1. Drops the FK constraint on atendentes.id -> auth.users.id so we can insert
   atendente records that don't have an auth account yet (directory entries).
2. Changes the SELECT policy on atendentes so ALL authenticated users can see
   all active atendentes (needed for the Atendente dropdown in forms).
3. Inserts the 12 missing operators from the official roster.

## Important Notes
- Existing auth-linked atendentes are preserved
- The 12 new entries get generated UUIDs (no auth account needed)
- Admins/managers retain full CRUD on atendentes
*/

-- 1. Drop FK constraint so we can insert directory entries without auth accounts
ALTER TABLE atendentes DROP CONSTRAINT IF EXISTS atendentes_id_fkey;

-- 2. Update SELECT policy: all authenticated users can read all atendentes
DROP POLICY IF EXISTS "select_own_or_all_atendentes" ON atendentes;
CREATE POLICY "select_all_atendentes" ON atendentes FOR SELECT
  TO authenticated USING (true);

-- 3. Insert missing operators (ON CONFLICT does nothing if name already exists via unique email)
INSERT INTO atendentes (id, nome, email, active)
SELECT gen_random_uuid(), nome, lower(replace(nome, ' ', '.')) || '@losungexpress.com.br', true
FROM (VALUES
  ('Paula aglaer Soares Lopes'),
  ('Maria Luiza'),
  ('Miellena'),
  ('Michelly Marilha Lima Sousa'),
  ('Yuri Sales'),
  ('Luan Bezerra da Silva'),
  ('Vitória Benício dos Santos'),
  ('José Gerardo Ribeiro Neto'),
  ('Carliane Silva Alcantara'),
  ('Rebecca Gois e Silva'),
  ('Nixon Deam da Silva Cavalcante'),
  ('Mylena Pereira De Lima'),
  ('Lucas Alberto Viana Feitosa'),
  ('Iasmin Saboya Spínola'),
  ('Pedro Vitor Saraiva de Sousa'),
  ('Wesley Lira Guilherme da Silva')
) AS t(nome)
WHERE NOT EXISTS (
  SELECT 1 FROM atendentes a WHERE a.nome = t.nome
);
