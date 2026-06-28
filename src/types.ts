export type TicketStatus = 'Aberto' | 'Em Progresso' | 'Em Espera' | 'Impedido' | 'Resolvido' | 'Retorno Solicitado';
export type TicketPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítico' | 'P1 - Crítica';
export type TicketCategory = 'ADM' | 'Comercial' | 'Remanejamento';

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

  // Regional and ownership fields
  city?: string;
  state?: string;
  createdBy?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  ticketId: string;
  targetUserEmail?: string;
}

export interface User {
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export type ScreenType = 'login' | 'dashboard' | 'ticket-details' | 'resolve' | 'new-ticket';
