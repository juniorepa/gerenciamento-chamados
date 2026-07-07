-- Execute este comando no SQL Editor do seu painel do Supabase
-- para adicionar a relação entre Vendedor e Backoffice no banco existente.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "backoffice_email" TEXT;
