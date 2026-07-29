
-- Tornar user_id nullable e adicionar default para auth.uid()
-- para que inserções sem user_id explícito funcionem quando o usuário está autenticado
ALTER TABLE cadastro_records
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE checklist_records
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();
