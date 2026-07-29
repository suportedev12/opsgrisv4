-- Reverte o trigger para NÃO definir must_change_password = true automaticamente
-- A troca obrigatória de senha só deve ser ativada manualmente pelo admin
CREATE OR REPLACE FUNCTION public.handle_new_atendente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.atendentes (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
    SET
      nome  = COALESCE(EXCLUDED.nome, atendentes.nome),
      email = COALESCE(EXCLUDED.email, atendentes.email);
  RETURN NEW;
END;
$$;
