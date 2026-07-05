-- =====================================================================
-- SCRIPT DE MIGRAÇÃO PARA ADICIONAR O ENUM DE PAPÉIS (ROLES)
-- Execute este script no "SQL Editor" do seu painel do Supabase
-- caso você já tenha executado o script 'supabase_setup.sql' anterior.
-- =====================================================================

-- 1. Criar o tipo ENUM se ele ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('Vendedor/Representante', 'Customer', 'Adm');
  END IF;
END
$$;

-- 2. Atualizar a coluna 'role' na tabela 'profiles' para usar o novo tipo ENUM
-- Primeiramente, removemos o valor padrão temporariamente
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- Em seguida, alteramos o tipo da coluna mapeando os valores antigos para os novos correspondentes
ALTER TABLE public.profiles 
  ALTER COLUMN role TYPE public.user_role 
  USING (
    CASE 
      WHEN role = 'ADM' OR role = 'Adm' THEN 'Adm'::public.user_role
      WHEN role = 'Vendedor/Representante' THEN 'Vendedor/Representante'::public.user_role
      ELSE 'Customer'::public.user_role
    END
  );

-- Definimos o novo valor padrão como 'Customer' do tipo ENUM
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'Vendedor/Representante'::public.user_role;

-- 3. Atualizar a função do Trigger para usar o tipo ENUM corretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Usuário'),
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'Adm' OR new.email = 'adm@empresa.com' THEN 'Adm'::public.user_role
      WHEN new.raw_user_meta_data->>'role' = 'Vendedor/Representante' THEN 'Vendedor/Representante'::public.user_role
      ELSE 'Vendedor/Representante'::public.user_role
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
