-- =====================================================================
-- PERMITIR MÚLTIPLOS ANALISTAS DE BACKOFFICE POR VENDEDOR
-- Execute este script no "SQL Editor" do seu painel do Supabase.
-- =====================================================================

-- 1. Remover a restrição de e-mail de vendedor único
ALTER TABLE public.backoffice_seller_relations 
DROP CONSTRAINT IF EXISTS backoffice_seller_relations_seller_email_key;

-- 2. Adicionar uma restrição de unicidade para a combinação (vendedor, analista)
-- Isso evita a duplicação do mesmo vínculo exato, mas permite que o vendedor tenha múltiplos analistas diferentes
ALTER TABLE public.backoffice_seller_relations 
ADD CONSTRAINT backoffice_seller_relations_unique_link UNIQUE (seller_email, backoffice_email);
