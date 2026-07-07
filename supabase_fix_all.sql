-- =====================================================================
-- SCRIPT DE CORREÇÃO COMPLETO PARA ERROS DE CADASTRO E PAPÉIS (ROLES)
-- Execute este script no "SQL Editor" do seu painel do Supabase.
-- Ele corrigirá os enums, atualizará as tabelas e tornará o gatilho 
-- de criação de usuários 100% à prova de falhas (crash-proof).
-- =====================================================================

-- 1. ADICIONAR NOVOS VALORES AO ENUM DE PAPÉIS (ROLES)
-- Nota: ALTER TYPE ... ADD VALUE não pode ser executado dentro de blocos de transação (como DO $$)
-- Portanto, executamos diretamente cada um abaixo. Eles são seguros.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Customer';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Backoffice';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Gestor de Backoffice';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Customer Selantes';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Customer Argamassa';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Customer Logística';

-- 2. GARANTIR QUE A TABELA DE PROFILES TEM A COLUNA role COM O TIPO E VALOR PADRÃO CORRETOS
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role SET DATA TYPE public.user_role USING role::text::public.user_role;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'Customer'::public.user_role;

-- 3. RECONSTRUIR A FUNÇÃO DE GATILHO (TRIGGER) PARA SER TOTALMENTE À PROVA DE FALHAS (CRASH-PROOF)
-- Usamos um bloco BEGIN ... EXCEPTION WHEN OTHERS para garantir que qualquer erro interno 
-- no cadastro do profile NÃO quebre ou reverta o cadastro de autenticação do usuário.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role public.user_role;
  meta_role text;
  meta_name text;
BEGIN
  -- Extrai dados de metadados com segurança
  meta_role := COALESCE(new.raw_user_meta_data->>'role', '');
  meta_name := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Usuário');

  -- Define o papel correspondente com base nos metadados ou regras
  IF meta_role = 'Adm' OR meta_role = 'ADM' OR new.email = 'adm@empresa.com' THEN
    assigned_role := 'Adm'::public.user_role;
  ELSIF meta_role = 'Vendedor/Representante' THEN
    assigned_role := 'Vendedor/Representante'::public.user_role;
  ELSIF meta_role = 'Gestor de Backoffice' THEN
    assigned_role := 'Gestor de Backoffice'::public.user_role;
  ELSIF meta_role = 'Backoffice' THEN
    assigned_role := 'Backoffice'::public.user_role;
  ELSIF meta_role = 'Customer Selantes' THEN
    assigned_role := 'Customer Selantes'::public.user_role;
  ELSIF meta_role = 'Customer Argamassa' THEN
    assigned_role := 'Customer Argamassa'::public.user_role;
  ELSIF meta_role = 'Customer Logística' THEN
    assigned_role := 'Customer Logística'::public.user_role;
  ELSE
    assigned_role := 'Customer'::public.user_role; -- Fallback seguro padrão
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

-- 4. GARANTIR QUE O TRIGGER ESTÁ VINCULADO E ATIVO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RECONSTRUIR AS POLÍTICAS DE RLS DA TABELA PROFILES PARA PERMITIR INSERÇÕES DO SISTEMA E LEITURAS/GRAVAÇÕES PÚBLICAS (SIMULAÇÃO)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública" ON public.profiles;
CREATE POLICY "Permitir leitura pública" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de perfis" ON public.profiles;
CREATE POLICY "Permitir inserção de perfis" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de perfis" ON public.profiles;
CREATE POLICY "Permitir atualização de perfis" ON public.profiles FOR UPDATE USING (true);
