-- =====================================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS PARA SUPABASE
-- Execute este script no "SQL Editor" do seu painel do Supabase.
-- =====================================================================

-- 1. CRIAR ENUM DE PAPÉIS (ROLES) E TABELA DE USUÁRIOS (PERFIS)
CREATE TYPE public.user_role AS ENUM ('Vendedor/Representante', 'Customer', 'Adm');

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role public.user_role DEFAULT 'Customer',
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CRIAR TABELA DE TICKET (CHAMADOS)
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

-- 4. HABILITAR SEGURANÇA EM NÍVEL DE LINHA (RLS - ROW LEVEL SECURITY)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso para Perfis
CREATE POLICY "Permitir leitura pública de perfis" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir atualização do próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Criar políticas de acesso irrestrito para tickets e notificações
CREATE POLICY "Permitir leitura pública" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON public.tickets FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública" ON public.tickets FOR DELETE USING (true);

CREATE POLICY "Permitir leitura pública" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública" ON public.notifications FOR DELETE USING (true);

-- 5. TRIGGER AUTOMÁTICO PARA COPIAR USUÁRIOS DE AUTH.USERS PARA PUBLIC.PROFILES
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
      ELSE 'Customer'::public.user_role
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

-- Remove o trigger se já existir para evitar conflitos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. HABILITAR ATUALIZAÇÕES EM TEMPO REAL (REALTIME)
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.tickets;
alter publication supabase_realtime add table public.notifications;
