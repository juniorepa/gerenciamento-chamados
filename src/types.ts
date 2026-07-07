export type TicketStatus = 'Aberto' | 'Em Progresso' | 'Em Espera' | 'Impedido' | 'Resolvido' | 'Retorno Solicitado';
export type TicketPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítico' | 'P1 - Crítica';
export type TicketCategory = 'ADM' | 'Comercial' | 'Remanejamento' | 'Logístico';

export interface StatusHistoryEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  completed?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
}

export interface InternalNote {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customerGroup?: 'Customer Selantes' | 'Customer Argamassa' | 'Customer Logística'; // Unidade/Customer de destino
  clientName: string;
  contactPerson?: string;
  contactEmail?: string;
  avgResolutionTime?: string;
  updatedAt: string;
  createdAt: string;
  assigneeInitials: string;
  assigneeName: string;
  attachments: Attachment[];
  history: StatusHistoryEntry[];
  internalNotes: InternalNote[];
  alertRead?: boolean;
  
  // Custom fields for Remanejamento
  customerReason?: string;
  vendasNumber?: string;
  transferReason?: string;
  logisticSituation?: string; // Situação logística (Ex: Atraso entrega, Avaria, etc.)

  // Regional and ownership fields
  city?: string;
  state?: string;
  createdBy?: string;
  notifyOnReturn?: boolean; // Se deve notificar ao enviar resposta
  lastRespondedBy?: string; // Quem respondeu por último
  createdAtIso?: string; // ISO string de criação do ticket
  resolvedAtIso?: string; // ISO string de resolução do ticket
  rating?: 'Bom' | 'Ruim' | 'Ótimo'; // Avaliação do atendimento
  ratingComment?: string; // Comentário da avaliação
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  ticketId: string;
  targetUserEmail?: string;
  notifyRole?: 'admin' | 'assignee' | 'both'; // Novo campo
  senderEmail?: string; // Quem gerou o alerta
}

export interface User {
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  backoffice_email?: string; // Link seller to a backoffice email
  backoffice_emails?: string[]; // Multiple backoffice emails linked to this seller
}

export type ScreenType = 'login' | 'dashboard' | 'ticket-details' | 'resolve' | 'new-ticket' | 'reset-password';
