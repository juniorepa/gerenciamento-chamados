-- =====================================================================
-- TABELA DE VINCULAÇÃO INDEPENDENTE DE VENDEDORES COM BACKOFFICE
-- Execute este script no "SQL Editor" do seu painel do Supabase.
-- =====================================================================

-- 1. Criação da tabela de vinculação
CREATE TABLE IF NOT EXISTS public.backoffice_seller_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_email TEXT NOT NULL UNIQUE,
  backoffice_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar segurança em nível de linha (RLS)
ALTER TABLE public.backoffice_seller_relations ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de acesso irrestrito para simulação
CREATE POLICY "Permitir leitura pública de vinculações" ON public.backoffice_seller_relations FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de vinculações" ON public.backoffice_seller_relations FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública de vinculações" ON public.backoffice_seller_relations FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública de vinculações" ON public.backoffice_seller_relations FOR DELETE USING (true);

-- 4. Habilitar Realtime para esta tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.backoffice_seller_relations;
