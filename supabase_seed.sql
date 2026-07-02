-- =====================================================================
-- SCRIPT PARA POPULAR AS TABELAS DO SUPABASE COM DADOS DE TESTE
-- Execute este script no "SQL Editor" do seu painel do Supabase.
-- =====================================================================

-- 1. LIMPAR REGISTROS EXISTENTES PARA EVITAR DUPLICIDADES (OPCIONAL)
TRUNCATE public.tickets CASCADE;
TRUNCATE public.notifications CASCADE;

-- 2. INSERIR DADOS DE TESTE NA TABELA 'tickets'
INSERT INTO public.tickets (
  id, 
  title, 
  description, 
  status, 
  priority, 
  category, 
  "clientName", 
  "contactPerson", 
  "contactEmail", 
  "avgResolutionTime", 
  "createdAt", 
  "updatedAt", 
  "assigneeInitials", 
  "assigneeName", 
  attachments, 
  history, 
  "internalNotes", 
  city, 
  state, 
  "createdBy"
) VALUES 
(
  'APP0001/2026',
  'Atraso na Integração do Sistema: Nós de Borda Região APAC',
  'O cliente relata timeouts consistentes ao tentar sincronizar dados de nós locais com o hub central da APAC. O problema começou após a atualização do firmware v4.2.1 na última quinta-feira. Logs iniciais indicam falha de handshake no nível do gateway secundário. A latência de dados saltou de 45ms para mais de 1200ms nas regiões de Singapura e Tóquio.',
  'Em Progresso',
  'P1 - Crítica',
  'ADM',
  'Global Logistics Corp',
  'Sarah Jenkins',
  's.jenkins@globallogistics.com',
  '4h 30m',
  '24 Out, 2023 · 09:12 AM',
  'Atualizado há 2h',
  'JD',
  'Marcus Zhao',
  '[
    {
      "id": "att-1",
      "name": "Screenshot do painel",
      "url": "https://lh3.googleusercontent.com/aida-public/AB6AXuBhtud9a7qhMVodH0udTfUPoRMkonLR_VZQMdjN9edj-imIsQvBNAW3O8F2Y0zwYYKBhAaEAwKHBEpdibEQbn1FNX8r-Vf84CxRHOpw32Z1XBDoEiZnlHNhIUfyZ_D_MD0HvGonFk23N9yJuHIwGDJsthCmZeozZtChB-ysyUEcA3E5Ty4wpLNgexYP_0QXw2oYkoiVYBAKBCTtllmlXUkhWhBleb3hO4xi6coeGHE2GO5NJK8e2zg2ng9Wy5VFb57FTCELPoZAq7uJ"
    },
    {
      "id": "att-2",
      "name": "Servidor Cabos",
      "url": "https://lh3.googleusercontent.com/aida-public/AB6AXuABNsDIT558BRwmm6Bc--O6RKYVI-pyXZ9YSdBZCZKykp02D7iVInQxjSwx7ZNxHVj663SxnY43vP_jnmdlYzSHkIqWlTyURLy40tf5vDUkVGVJtRPw5mOzR-aPgJC1ybkDhX_r5qMqB_v5Nsb0wu4sPYsvP4EJapqQZyfQgZRvpFYLVfSW4hJHQv0-BQoT3_gjQ9XdsgB2_tLm6WckEan4lrjJYnVPjAQ2tahdHGOIB6tul0QBKju4XdYSJy7-wVr_OeFFimNc-78e"
    }
  ]'::jsonb,
  '[
    {
      "id": "hist-1",
      "title": "Chamado Escalado para Nível 3",
      "description": "Atribuído ao Engenheiro Líder: Marcus Zhao",
      "timestamp": "Hoje, 11:45 AM",
      "completed": true
    },
    {
      "id": "hist-2",
      "title": "Diagnóstico Inicial Concluído",
      "description": "Logs revisados. Obstrução de gateway confirmada.",
      "timestamp": "Hoje, 09:30 AM",
      "completed": true
    },
    {
      "id": "hist-3",
      "title": "Chamado Criado",
      "description": "Enviado via Portal do Cliente",
      "timestamp": "24 Out, 09:12 AM",
      "completed": true
    }
  ]'::jsonb,
  '[
    {
      "id": "note-1",
      "text": "Aguardar resposta de ping do nó de Tóquio antes de prosseguir com o rollback da v4.2.2.",
      "author": "Junior (Agente)",
      "timestamp": "Hoje, 10:15 AM"
    }
  ]'::jsonb,
  'Porto Alegre',
  'RS',
  's.jenkins@globallogistics.com'
),
(
  'APP0002/2026',
  'Atraso na Sincronização de API Enterprise',
  'Falha na integração de pagamentos ADM. O cliente relatou instabilidade ao processar faturas via API comercial. Logs indicam timeout no gateway secundário.',
  'Em Progresso',
  'Crítico',
  'ADM',
  'Global Logistics Corp.',
  NULL,
  's.jenkins@globallogistics.com',
  NULL,
  '25 Out, 2023 · 08:30 AM',
  'Atualizado há 2h',
  'JD',
  'Jane Doe',
  '[]'::jsonb,
  '[
    {
      "id": "hist-8921-1",
      "title": "Análise de Logs Iniciada",
      "description": "Verificando tempos de resposta da API de pagamentos",
      "timestamp": "Hoje, 08:00 AM",
      "completed": true
    },
    {
      "id": "hist-8921-2",
      "title": "Chamado Aberto",
      "description": "Criado automaticamente via API Monitor",
      "timestamp": "Ontem, 08:30 AM",
      "completed": true
    }
  ]'::jsonb,
  '[]'::jsonb,
  'São Paulo',
  'SP',
  's.jenkins@globallogistics.com'
),
(
  'APP0003/2026',
  'Sessão de Integração de Novo Usuário',
  'Agendar e executar a integração técnica do cliente Fintech Solutions Ltd para uso da plataforma e APIs financeiras avançadas.',
  'Aberto',
  'Média',
  'Comercial',
  'Fintech Solutions Ltd',
  NULL,
  'fintech@solutions.com',
  NULL,
  '25 Out, 2023 · 10:15 AM',
  'Atualizado há 5h',
  'AS',
  'Alex Smith',
  '[]'::jsonb,
  '[
    {
      "id": "hist-8919-1",
      "title": "Chamado Aberto",
      "description": "Requer agendamento de conclusão técnica",
      "timestamp": "Hoje, 10:15 AM",
      "completed": true
    }
  ]'::jsonb,
  '[]'::jsonb,
  'Goiânia',
  'GO',
  'fintech@solutions.com'
),
(
  'APP0004/2026',
  'Reconciliação de Faturamento - Q3',
  'Divergência de valores no relatório de faturamento do terceiro trimestre. Cliente solicita auditoria detalhada.',
  'Em Espera',
  'Baixa',
  'Comercial',
  'SecureData Systems',
  NULL,
  'juniorepa@gmail.com',
  NULL,
  '24 Out, 2023 · 02:00 PM',
  'Atualizado há 1 dia',
  'MK',
  'Mary Key',
  '[]'::jsonb,
  '[
    {
      "id": "hist-8915-1",
      "title": "Aguardando Aprovação Financeira",
      "description": "Solicitação de log enviada para a contabilidade",
      "timestamp": "Ontem, 04:00 PM",
      "completed": true
    },
    {
      "id": "hist-8915-2",
      "title": "Chamado Aberto",
      "description": "Criado via Portal do Parceiro",
      "timestamp": "24 Out, 02:00 PM",
      "completed": true
    }
  ]'::jsonb,
  '[]'::jsonb,
  'Recife',
  'PE',
  'juniorepa@gmail.com'
);

-- 3. INSERIR DADOS DE TESTE NA TABELA 'notifications'
INSERT INTO public.notifications (
  id, 
  title, 
  description, 
  time, 
  read, 
  "ticketId", 
  "targetUserEmail"
) VALUES 
(
  'not-1',
  '⚠️ Alerta Regional Crítico',
  'Chamado da sua região atingindo SLA crítico de 4 horas.',
  'Agora',
  FALSE,
  'APP0002/2026',
  'juniorepa@gmail.com'
),
(
  'not-2',
  '🔧 Novo Chamado Atribuído',
  'Você recebeu atribuição técnica para um chamado recém-aberto.',
  'Há 12m',
  FALSE,
  'APP0001/2026',
  'juniorepa@gmail.com'
);
