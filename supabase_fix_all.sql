-- =====================================================================
-- SCRIPT DE CORREÇÃO COMPLETO - CONVERSÃO DE ROLE PARA TEXT
-- =====================================================================
-- Este script altera o tipo da coluna 'role' de ENUM para TEXT.
-- Isso resolve permanentemente o erro de enums do PostgreSQL e permite 
-- qualquer papel de usuário de forma muito mais flexível e robusta.
-- Você pode executar TODO o script abaixo de uma única vez no SQL Editor.
-- =====================================================================

-- 1. REMOVER O PADRÃO ANTIGO DA COLUNA
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- 2. ALTERAR O TIPO DA COLUNA PARA TEXT (PRESERVANDO OS DADOS EXISTENTES)
ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::text;

-- 3. DEFINIR O NOVO VALOR PADRÃO COMO TEXTO 'Customer'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'Customer';

-- 4. RECONSTRUIR A FUNÇÃO DE GATILHO (TRIGGER) UTILIZANDO TEXT
-- Usamos um bloco BEGIN ... EXCEPTION WHEN OTHERS para garantir que qualquer erro interno 
-- no cadastro do profile NÃO quebre ou reverta o cadastro de autenticação do usuário.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  meta_role TEXT;
  meta_name TEXT;
BEGIN
  -- Extrai dados de metadados com segurança
  meta_role := COALESCE(new.raw_user_meta_data->>'role', '');
  meta_name := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Usuário');

  -- Define o papel correspondente com base nos metadados ou regras
  IF meta_role = 'Adm' OR meta_role = 'ADM' OR new.email = 'adm@empresa.com' THEN
    assigned_role := 'Adm';
  ELSIF meta_role = 'Vendedor/Representante' THEN
    assigned_role := 'Vendedor/Representante';
  ELSIF meta_role = 'Gestor de Backoffice' THEN
    assigned_role := 'Gestor de Backoffice';
  ELSIF meta_role = 'Backoffice' THEN
    assigned_role := 'Backoffice';
  ELSIF meta_role = 'Customer Selantes' THEN
    assigned_role := 'Customer Selantes';
  ELSIF meta_role = 'Customer Argamassa' THEN
    assigned_role := 'Customer Argamassa';
  ELSIF meta_role = 'Customer Logística' THEN
    assigned_role := 'Customer Logística';
  ELSE
    assigned_role := 'Customer'; -- Fallback seguro padrão
  END IF;

  -- Bloco protegido para inserção do perfil do usuário
  BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
      new.id,
      new.email,
      meta_name,
      assigned_role
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.profiles.name),
      role = EXCLUDED.role,
      "updatedAt" = timezone('utc'::text, now());
  EXCEPTION WHEN OTHERS THEN
    -- Silencia o erro para garantir que a transação de autenticação principal NÃO seja abortada.
    -- Isso evita o erro HTTP 500 'Database error saving new user' de travar o usuário.
    RAISE WARNING 'Erro ao criar perfil automaticamente para o usuário %: %', new.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RECONECTAR O TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RECONSTRUIR AS POLÍTICAS DE RLS DA TABELA PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública" ON public.profiles;
CREATE POLICY "Permitir leitura pública" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de perfis" ON public.profiles;
CREATE POLICY "Permitir inserção de perfis" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de perfis" ON public.profiles;
CREATE POLICY "Permitir atualização de perfis" ON public.profiles FOR UPDATE USING (true);
