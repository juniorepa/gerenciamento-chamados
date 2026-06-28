import { Ticket, User } from './types';

export const MAP_IMAGE_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_0kWSjX3QhthPcULj5Wfb6Yy1EN-BeIH3UuAhk7WqumMYnyfUPEjqnCyysb68y3YHQiG637psdsjo-XILASshhn6ZiQqlueQ2hS8-gOMpiwTvUydcXKifyw3K3CZV72vZ5qGbnlpka6RUp5Azo70-42ZeHCnMNkEFZ5N9n-TJwcX9CgoyytcgbYPeeog4BGxtOJdRcPErLu-Dw24BcK20uPj3aoU4mCRu_sSlm2PVrcqQkSye6U8GHfwkD9VuDhuAVlSXFjatvpEm';

export const DEFAULT_USER: User = {
  email: 'juniorepa@gmail.com',
  name: 'Agente Junior',
  role: 'Suporte de Nível 3',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0pQdCI1omIqQ9RCsYlgwCsLjBX3ay7YRIdOL6m2OfR8c7BU1kh6H8VkTnv0qdSA0g_HgMVglS0rH7HhPwk78tl_jCutiRJVSuXXv1_TZvLkALkJ2gUtqXrABoP18FyQOvxOUWnHs65xXNpz2m-rCGqjpQ7U1HKiZWD_WGeWwmTRoRiNBM_8BSsaB2xwr3Ag0NkH5BklH1uCtKASQmoz5cHG0NkaN71ITG698uOuxpKw8p7ZHoxhQGYMteeln5-uEhVdUnp2q9RzQp'
};

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'APP0001/2026',
    title: 'Atraso na Integração do Sistema: Nós de Borda Região APAC',
    description: 'O cliente relata timeouts consistentes ao tentar sincronizar dados de nós locais com o hub central da APAC. O problema começou após a atualização do firmware v4.2.1 na última quinta-feira. Logs iniciais indicam falha de handshake no nível do gateway secundário. A latência de dados saltou de 45ms para mais de 1200ms nas regiões de Singapura e Tóquio.',
    status: 'Em Progresso',
    priority: 'P1 - Crítica',
    category: 'ADM',
    clientName: 'Global Logistics Corp',
    contactPerson: 'Sarah Jenkins',
    contactEmail: 's.jenkins@globallogistics.com',
    avgResolutionTime: '4h 30m',
    createdAt: '24 Out, 2023 · 09:12 AM',
    updatedAt: 'Atualizado há 2h',
    assigneeInitials: 'JD',
    assigneeName: 'Marcus Zhao',
    attachments: [
      {
        id: 'att-1',
        name: 'Screenshot do painel',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhtud9a7qhMVodH0udTfUPoRMkonLR_VZQMdjN9edj-imIsQvBNAW3O8F2Y0zwYYKBhAaEAwKHBEpdibEQbn1FNX8r-Vf84CxRHOpw32Z1XBDoEiZnlHNhIUfyZ_D_MD0HvGonFk23N9yJuHIwGDJsthCmZeozZtChB-ysyUEcA3E5Ty4wpLNgexYP_0QXw2oYkoiVYBAKBCTtllmlXUkhWhBleb3hO4xi6coeGHE2GO5NJK8e2zg2ng9Wy5VFb57FTCELPoZAq7uJ'
      },
      {
        id: 'att-2',
        name: 'Servidor Cabos',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABNsDIT558BRwmm6Bc--O6RKYVI-pyXZ9YSdBZCZKykp02D7iVInQxjSwx7ZNxHVj663SxnY43vP_jnmdlYzSHkIqWlTyURLy40tf5vDUkVGVJtRPw5mOzR-aPgJC1ybkDhX_r5qMqB_v5Nsb0wu4sPYsvP4EJapqQZyfQgZRvpFYLVfSW4hJHQv0-BQoT3_gjQ9XdsgB2_tLm6WckEan4lrjJYnVPjAQ2tahdHGOIB6tul0QBKju4XdYSJy7-wVr_OeFFimNc-78e'
      }
    ],
    history: [
      {
        id: 'hist-1',
        title: 'Chamado Escalado para Nível 3',
        description: 'Atribuído ao Engenheiro Líder: Marcus Zhao',
        timestamp: 'Hoje, 11:45 AM',
        completed: true
      },
      {
        id: 'hist-2',
        title: 'Diagnóstico Inicial Concluído',
        description: 'Logs revisados. Obstrução de gateway confirmada.',
        timestamp: 'Hoje, 09:30 AM',
        completed: true
      },
      {
        id: 'hist-3',
        title: 'Chamado Criado',
        description: 'Enviado via Portal do Cliente',
        timestamp: '24 Out, 09:12 AM',
        completed: true
      }
    ],
    internalNotes: [
      {
        id: 'note-1',
        text: 'Aguardar resposta de ping do nó de Tóquio antes de prosseguir com o rollback da v4.2.2.',
        author: 'Junior (Agente)',
        timestamp: 'Hoje, 10:15 AM'
      }
    ],
    city: 'Porto Alegre',
    state: 'RS',
    createdBy: 's.jenkins@globallogistics.com'
  },
  {
    id: 'APP0002/2026',
    title: 'Atraso na Sincronização de API Enterprise',
    description: 'Falha na integração de pagamentos ADM. O cliente relatou instabilidade ao processar faturas via API comercial. Logs indicam timeout no gateway secundário.',
    status: 'Em Progresso',
    priority: 'Crítico',
    category: 'ADM',
    clientName: 'Global Logistics Corp.',
    createdAt: '25 Out, 2023 · 08:30 AM',
    updatedAt: 'Atualizado há 2h',
    assigneeInitials: 'JD',
    assigneeName: 'Jane Doe',
    attachments: [],
    history: [
      {
        id: 'hist-8921-1',
        title: 'Análise de Logs Iniciada',
        description: 'Verificando tempos de resposta da API de pagamentos',
        timestamp: 'Hoje, 08:00 AM',
        completed: true
      },
      {
        id: 'hist-8921-2',
        title: 'Chamado Aberto',
        description: 'Criado automaticamente via API Monitor',
        timestamp: 'Ontem, 08:30 AM',
        completed: true
      }
    ],
    internalNotes: [],
    city: 'São Paulo',
    state: 'SP',
    createdBy: 's.jenkins@globallogistics.com'
  },
  {
    id: 'APP0003/2026',
    title: 'Sessão de Integração de Novo Usuário',
    description: 'Agendar e executar a integração técnica do cliente Fintech Solutions Ltd para uso da plataforma e APIs financeiras avançadas.',
    status: 'Aberto',
    priority: 'Média',
    category: 'Comercial',
    clientName: 'Fintech Solutions Ltd',
    createdAt: '25 Out, 2023 · 10:15 AM',
    updatedAt: 'Atualizado há 5h',
    assigneeInitials: 'AS',
    assigneeName: 'Alex Smith',
    attachments: [],
    history: [
      {
        id: 'hist-8919-1',
        title: 'Chamado Aberto',
        description: 'Requer agendamento de conclusão técnica',
        timestamp: 'Hoje, 10:15 AM',
        completed: true
      }
    ],
    internalNotes: [],
    city: 'Goiânia',
    state: 'GO',
    createdBy: 'fintech@solutions.com'
  },
  {
    id: 'APP0004/2026',
    title: 'Reconciliação de Faturamento - Q3',
    description: 'Divergência de valores no relatório de faturamento do terceiro trimestre. Cliente solicita auditoria detalhada.',
    status: 'Em Espera',
    priority: 'Baixa',
    category: 'Comercial',
    clientName: 'SecureData Systems',
    createdAt: '24 Out, 2023 · 02:00 PM',
    updatedAt: 'Atualizado há 1 dia',
    assigneeInitials: 'MK',
    assigneeName: 'Mary Key',
    attachments: [],
    history: [
      {
        id: 'hist-8915-1',
        title: 'Aguardando Aprovação Financeira',
        description: 'Solicitação de log enviada para a contabilidade',
        timestamp: 'Ontem, 04:00 PM',
        completed: true
      },
      {
        id: 'hist-8915-2',
        title: 'Chamado Aberto',
        description: 'Criado via Portal do Parceiro',
        timestamp: '24 Out, 02:00 PM',
        completed: true
      }
    ],
    internalNotes: [],
    city: 'Recife',
    state: 'PE',
    createdBy: 'juniorepa@gmail.com'
  }
];

export const loadTickets = (): Ticket[] => {
  const data = localStorage.getItem('reliant_tickets');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing tickets from localStorage', e);
    }
  }
  localStorage.setItem('reliant_tickets', JSON.stringify(INITIAL_TICKETS));
  return INITIAL_TICKETS;
};

export const saveTickets = (tickets: Ticket[]) => {
  localStorage.setItem('reliant_tickets', JSON.stringify(tickets));
};
