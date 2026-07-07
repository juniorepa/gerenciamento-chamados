-- =====================================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO E MIGRAÇÃO DO BANCO DE DADOS SUPABASE
-- Execute este script no "SQL Editor" do seu painel do Supabase.
-- Ele foi projetado para ser executado de forma totalmente segura,
-- adicionando apenas o que estiver faltando sem apagar dados existentes.
-- =====================================================================

-- 1. CRIAR ENUM DE PAPÉIS (ROLES) E TABELA DE USUÁRIOS (PERFIS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'Vendedor/Representante', 
      'Customer', 
      'Adm', 
      'Backoffice', 
      'Gestor de Backoffice', 
      'Customer Selantes', 
      'Customer Argamassa', 
      'Customer Logística'
    );
  END IF;
END
$$;

-- Adiciona os novos valores ao tipo caso ele já existisse anteriormente
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Customer';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Backoffice';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Gestor de Backoffice';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Customer Selantes';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Customer Argamassa';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Customer Logística';

-- Criar tabela de profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role public.user_role DEFAULT 'Customer',
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
CREATE TABLE IF NOT EXISTS public.backoffice_seller_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_email TEXT NOT NULL UNIQUE,
  backoffice_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. HABILITAR SEGURANÇA EM NÍVEL DE LINHA (RLS - ROW LEVEL SECURITY)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backoffice_seller_relations ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso de forma segura (verificando antes de criar)
DO $$
BEGIN
  -- Perfis (Profiles)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Permitir leitura pública de perfis') THEN
    CREATE POLICY "Permitir leitura pública de perfis" ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Permitir atualização do próprio perfil') THEN
    CREATE POLICY "Permitir atualização do próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;

  -- Tickets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tickets' AND policyname = 'Permitir leitura pública') THEN
    CREATE POLICY "Permitir leitura pública" ON public.tickets FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tickets' AND policyname = 'Permitir inserção pública') THEN
    CREATE POLICY "Permitir inserção pública" ON public.tickets FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tickets' AND policyname = 'Permitir atualização pública') THEN
    CREATE POLICY "Permitir atualização pública" ON public.tickets FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tickets' AND policyname = 'Permitir exclusão pública') THEN
    CREATE POLICY "Permitir exclusão pública" ON public.tickets FOR DELETE USING (true);
  END IF;

  -- Notificações (Notifications)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Permitir leitura pública') THEN
    CREATE POLICY "Permitir leitura pública" ON public.notifications FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Permitir inserção pública') THEN
    CREATE POLICY "Permitir inserção pública" ON public.notifications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Permitir atualização pública') THEN
    CREATE POLICY "Permitir atualização pública" ON public.notifications FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Permitir exclusão pública') THEN
    CREATE POLICY "Permitir exclusão pública" ON public.notifications FOR DELETE USING (true);
  END IF;

  -- Relações de Backoffice (backoffice_seller_relations)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'backoffice_seller_relations' AND policyname = 'Permitir leitura pública de vinculações') THEN
    CREATE POLICY "Permitir leitura pública de vinculações" ON public.backoffice_seller_relations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'backoffice_seller_relations' AND policyname = 'Permitir inserção pública de vinculações') THEN
    CREATE POLICY "Permitir inserção pública de vinculações" ON public.backoffice_seller_relations FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'backoffice_seller_relations' AND policyname = 'Permitir atualização pública de vinculações') THEN
    CREATE POLICY "Permitir atualização pública de vinculações" ON public.backoffice_seller_relations FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'backoffice_seller_relations' AND policyname = 'Permitir exclusão pública de vinculações') THEN
    CREATE POLICY "Permitir exclusão pública de vinculações" ON public.backoffice_seller_relations FOR DELETE USING (true);
  END IF;
END
$$;

-- 6. TRIGGER AUTOMÁTICO PARA COPIAR USUÁRIOS DE AUTH.USERS PARA PUBLIC.PROFILES
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

-- Remove o trigger se já existir para evitar conflitos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. HABILITAR ATUALIZAÇÕES EM TEMPO REAL (REALTIME) SE AINDA NÃO ADICIONADO
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
