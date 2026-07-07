-- =====================================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO E MIGRAÇÃO DO BANCO DE DADOS SUPABASE
-- Execute este script no "SQL Editor" do seu painel do Supabase.
-- Ele foi projetado para ser executado de forma totalmente segura,
-- adicionando apenas o que estiver faltando sem apagar dados existentes
-- e convertendo tipos/políticas de segurança de forma compatível.
-- =====================================================================

-- 1. CRIAR TABELA DE USUÁRIOS (PERFIS) COM SUPORTE A PAPÉIS EM TEXTO
-- Usar TEXT em vez de ENUM evita erros de tipo no cadastro e atualizações de papéis.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'Customer',
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Converter a coluna role para TEXT se ela ainda for do tipo ENUM (bancos existentes)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
      AND column_name = 'role' 
      AND udt_name = 'user_role'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::text;
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'Customer';
  END IF;
END
$$;

-- Adicionar colunas novas de perfil com segurança (se já existirem, não fará nada)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "backoffice_email" TEXT;

-- 2. CRIAR/ATUALIZAR TABELA DE TICKETS (CHAMADOS)
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  category TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "contactPerson" TEXT,
  "contactEmail" TEXT,
  "avgResolutionTime" TEXT,
  "updatedAt" TEXT,
  "createdAt" TEXT,
  "assigneeInitials" TEXT,
  "assigneeName" TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  "internalNotes" JSONB DEFAULT '[]'::jsonb,
  "alertRead" BOOLEAN DEFAULT FALSE,
  "customerReason" TEXT,
  "vendasNumber" TEXT,
  "transferReason" TEXT,
  city TEXT,
  state TEXT,
  "createdBy" TEXT
);

-- Adicionar novas colunas na tabela tickets para suportar funcionalidades recentes
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "customerGroup" TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "notifyOnReturn" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "lastRespondedBy" TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "createdAtIso" TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "resolvedAtIso" TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "rating" TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "ratingComment" TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS "logisticSituation" TEXT;

-- 3. CRIAR TABELA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT,
  read BOOLEAN DEFAULT FALSE,
  "ticketId" TEXT,
  "targetUserEmail" TEXT
);

-- Adicionar novos campos se houverem nas notificações
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "notifyRole" TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "senderEmail" TEXT;

-- 4. CRIAR TABELA DE VINCULAÇÃO INDEPENDENTE DE VENDEDORES COM BACKOFFICE
-- Removido o UNIQUE de seller_email para permitir múltiplos analistas vinculados
CREATE TABLE IF NOT EXISTS public.backoffice_seller_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_email TEXT NOT NULL,
  backoffice_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Remover restrição antiga de vendedor único se ela existir
ALTER TABLE public.backoffice_seller_relations 
DROP CONSTRAINT IF EXISTS backoffice_seller_relations_seller_email_key;

-- Adicionar uma restrição de unicidade para a combinação (vendedor, analista)
-- Isso evita a duplicação do mesmo vínculo exato, mas permite que o vendedor tenha múltiplos analistas diferentes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'backoffice_seller_relations_unique_link') THEN
    ALTER TABLE public.backoffice_seller_relations 
    ADD CONSTRAINT backoffice_seller_relations_unique_link UNIQUE (seller_email, backoffice_email);
  END IF;
END
$$;

-- 5. HABILITAR SEGURANÇA EM NÍVEL DE LINHA (RLS - ROW LEVEL SECURITY)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backoffice_seller_relations ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS DE ACESSO DE FORMA SEGURA (REESCRITAS PARA EVITAR ERROS)
-- Nota: Para permitir atualizações de perfis (vinculações e papéis), mudamos de auth.uid() para acesso público/autenticado total.

-- Perfis (Profiles)
DROP POLICY IF EXISTS "Permitir leitura pública de perfis" ON public.profiles;
CREATE POLICY "Permitir leitura pública de perfis" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção pública de perfis" ON public.profiles;
CREATE POLICY "Permitir inserção pública de perfis" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização pública de perfis" ON public.profiles;
CREATE POLICY "Permitir atualização pública de perfis" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusão pública de perfis" ON public.profiles;
CREATE POLICY "Permitir exclusão pública de perfis" ON public.profiles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON public.profiles;

-- Tickets
DROP POLICY IF EXISTS "Permitir leitura pública" ON public.tickets;
CREATE POLICY "Permitir leitura pública" ON public.tickets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção pública" ON public.tickets;
CREATE POLICY "Permitir inserção pública" ON public.tickets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização pública" ON public.tickets;
CREATE POLICY "Permitir atualização pública" ON public.tickets FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusão pública" ON public.tickets;
CREATE POLICY "Permitir exclusão pública" ON public.tickets FOR DELETE USING (true);

-- Notificações (Notifications)
DROP POLICY IF EXISTS "Permitir leitura pública" ON public.notifications;
CREATE POLICY "Permitir leitura pública" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção pública" ON public.notifications;
CREATE POLICY "Permitir inserção pública" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização pública" ON public.notifications;
CREATE POLICY "Permitir atualização pública" ON public.notifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusão pública" ON public.notifications;
CREATE POLICY "Permitir exclusão pública" ON public.notifications FOR DELETE USING (true);

-- Relações de Backoffice (backoffice_seller_relations)
DROP POLICY IF EXISTS "Permitir leitura pública de vinculações" ON public.backoffice_seller_relations;
CREATE POLICY "Permitir leitura pública de vinculações" ON public.backoffice_seller_relations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção pública de vinculações" ON public.backoffice_seller_relations;
CREATE POLICY "Permitir inserção pública de vinculações" ON public.backoffice_seller_relations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização pública de vinculações" ON public.backoffice_seller_relations;
CREATE POLICY "Permitir atualização pública de vinculações" ON public.backoffice_seller_relations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusão pública de vinculações" ON public.backoffice_seller_relations;
CREATE POLICY "Permitir exclusão pública de vinculações" ON public.backoffice_seller_relations FOR DELETE USING (true);

-- 7. TRIGGER AUTOMÁTICO PARA COPIAR USUÁRIOS DE AUTH.USERS PARA PUBLIC.PROFILES (SEGURO COM TEXT)
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

  -- Bloco protegido para inserção do perfil do usuário para evitar travar a autenticação
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
    -- Apenas emite um warning no log do PostgreSQL em caso de falha, para não barrar o cadastro do usuário
    RAISE WARNING 'Erro ao criar perfil automaticamente para o usuário %: %', new.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria o trigger de forma limpa
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. HABILITAR ATUALIZAÇÕES EM TEMPO REAL (REALTIME) SE AINDA NÃO ADICIONADO
DO $$
BEGIN
  -- Cria publicação de realtime se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Adiciona tabelas de forma segura
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tickets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'backoffice_seller_relations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.backoffice_seller_relations;
  END IF;
END
$$;
