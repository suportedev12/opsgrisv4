-- Atualiza o trigger de criação de usuário para sempre marcar must_change_password = true
-- Isso garante que qualquer conta criada (pelo painel Supabase ou pelo admin do sistema)
-- exija troca de senha no primeiro login.
CREATE OR REPLACE FUNCTION public.handle_new_atendente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.atendentes (id, nome, email, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    true
  )
  ON CONFLICT (id) DO UPDATE
    SET
      nome  = COALESCE(EXCLUDED.nome, atendentes.nome),
      email = COALESCE(EXCLUDED.email, atendentes.email);
  RETURN NEW;
END;
$$;
