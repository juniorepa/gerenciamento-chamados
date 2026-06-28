import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ticket, TicketStatus, TicketCategory, TicketPriority, ScreenType, User, Attachment, StatusHistoryEntry, InternalNote, AppNotification } from '../types';
import { loadTickets, saveTickets, DEFAULT_USER, INITIAL_TICKETS } from '../data';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

interface AppContextType {
  currentUser: User | null;
  tickets: Ticket[];
  activeScreen: ScreenType;
  selectedTicketId: string | null;
  dashboardFilter: 'Todos' | 'Atribuídos' | 'Escalados';
  searchQuery: string;
  login: (email: string, name: string) => void;
  logout: () => void;
  setScreen: (screen: ScreenType) => void;
  selectTicket: (id: string | null) => void;
  setDashboardFilter: (filter: 'Todos' | 'Atribuídos' | 'Escalados') => void;
  setSearchQuery: (query: string) => void;
  createTicket: (ticketData: {
    title: string;
    description: string;
    category: TicketCategory;
    clientName: string;
    priority: TicketPriority;
    quantityReclamada?: number;
    customerReason?: string;
    vendasNumber?: string;
    transferReason?: string;
    attachments?: Attachment[];
    city?: string;
    state?: string;
  }) => Ticket;
  updateTicketStatus: (
    id: string,
    status: TicketStatus,
    technicalFeedback?: string,
    isInternal?: boolean,
    internalNoteText?: string
  ) => void;
  addInternalNote: (ticketId: string, text: string) => void;
  addAttachment: (ticketId: string, name: string, url: string) => void;
  emitTicketAlert: (ticketId: string, alertTitle: string, alertDescription: string) => void;
  resetAllData: () => void;
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('reliant_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    // Default to mock logged in to match the dashboard image directly
    return DEFAULT_USER;
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeScreen, setActiveScreen] = useState<ScreenType>('login'); // Start at login to let user log in, or we can check if they're already logged in
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<'Todos' | 'Atribuídos' | 'Escalados'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // 1. Subscribe to real-time tickets from Firestore
  useEffect(() => {
    const unsubscribeTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      const ticketsList: Ticket[] = [];
      snapshot.forEach((docSnap) => {
        ticketsList.push(docSnap.data() as Ticket);
      });

      if (ticketsList.length === 0) {
        // If Firestore is empty, seed it with INITIAL_TICKETS
        const batch = writeBatch(db);
        INITIAL_TICKETS.forEach((ticket) => {
          const ticketRef = doc(db, 'tickets', ticket.id.replace('/', '-'));
          batch.set(ticketRef, ticket);
        });
        batch.commit()
          .then(() => console.log('Database seeded with initial tickets successfully.'))
          .catch((err) => console.error('Error seeding initial tickets:', err));
        
        setTickets(INITIAL_TICKETS);
        saveTickets(INITIAL_TICKETS);
      } else {
        // Sort tickets by ID descending (newer IDs at top)
        ticketsList.sort((a, b) => b.id.localeCompare(a.id));
        setTickets(ticketsList);
        saveTickets(ticketsList);
      }
    }, (error) => {
      console.error("Error fetching tickets from Firestore:", error);
      // Fallback to local storage if Firestore fails
      const loaded = loadTickets();
      setTickets(loaded);
    });

    return () => unsubscribeTickets();
  }, []);

  // 2. Subscribe to real-time notifications from Firestore
  useEffect(() => {
    const unsubscribeNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const notifsList: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        notifsList.push(docSnap.data() as AppNotification);
      });

      if (notifsList.length === 0) {
        // Seed initial notifications if Firestore is empty
        const initial = [
          {
            id: 'not-1',
            title: '⚠️ Alerta Regional Crítico',
            description: 'Chamado da sua região atingindo SLA crítico de 4 horas.',
            time: 'Agora',
            read: false,
            ticketId: 'APP0002/2026',
            targetUserEmail: 'juniorepa@gmail.com'
          },
          {
            id: 'not-2',
            title: '🔧 Novo Chamado Atribuído',
            description: 'Você recebeu atribuição técnica para um chamado recém-aberto.',
            time: 'Há 12m',
            read: false,
            ticketId: 'APP0001/2026',
            targetUserEmail: 'juniorepa@gmail.com'
          }
        ];
        const batch = writeBatch(db);
        initial.forEach((notif) => {
          const notifRef = doc(db, 'notifications', notif.id);
          batch.set(notifRef, notif);
        });
        batch.commit()
          .then(() => console.log('Database seeded with initial notifications successfully.'))
          .catch((err) => console.error('Error seeding notifications:', err));

        setNotifications(initial);
        localStorage.setItem('reliant_notifications', JSON.stringify(initial));
      } else {
        // Sort notifications by id descending
        notifsList.sort((a, b) => b.id.localeCompare(a.id));
        setNotifications(notifsList);
        localStorage.setItem('reliant_notifications', JSON.stringify(notifsList));
      }
    }, (error) => {
      console.error("Error fetching notifications:", error);
      const stored = localStorage.getItem('reliant_notifications');
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch {}
      }
    });

    return () => unsubscribeNotifs();
  }, []);

  const markNotificationAsRead = (id: string) => {
    const isAdm = currentUser?.email === 'adm@empresa.com' || currentUser?.name === 'ADM';
    const userEmail = currentUser?.email || '';

    const notifRef = doc(db, 'notifications', id);
    updateDoc(notifRef, { read: true })
      .then(() => {
        // Check if there are any unread notifications left for this user
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        const hasUnreadForUser = updated.some(n => {
          const matchesUser = isAdm || n.targetUserEmail === userEmail;
          return matchesUser && !n.read;
        });

        if (!hasUnreadForUser) {
          // Clear all notifications for this user since they've read all of them
          notifications.forEach((n) => {
            const matchesUser = isAdm || n.targetUserEmail === userEmail;
            if (matchesUser) {
              deleteDoc(doc(db, 'notifications', n.id))
                .catch(err => console.error('Error deleting read notification:', err));
            }
          });
        }
      })
      .catch(err => console.error('Error marking notification as read:', err));
  };

  const markAllNotificationsAsRead = () => {
    const isAdm = currentUser?.email === 'adm@empresa.com' || currentUser?.name === 'ADM';
    const userEmail = currentUser?.email || '';

    // Mark all as read by deleting them (replicates the clear behavior of read notifications)
    notifications.forEach((n) => {
      const matchesUser = isAdm || n.targetUserEmail === userEmail;
      if (matchesUser) {
        deleteDoc(doc(db, 'notifications', n.id))
          .catch(err => console.error('Error deleting notification on mark all read:', err));
      }
    });
  };

  const clearAllNotifications = () => {
    const isAdm = currentUser?.email === 'adm@empresa.com' || currentUser?.name === 'ADM';
    const userEmail = currentUser?.email || '';

    notifications.forEach((n) => {
      const matchesUser = isAdm || n.targetUserEmail === userEmail;
      if (matchesUser) {
        deleteDoc(doc(db, 'notifications', n.id))
          .catch(err => console.error('Error clearing notification:', err));
      }
    });
  };

  const updateTicketsAndSave = (newTickets: Ticket[]) => {
    // Left for backward compatibility / local updates, but write-operations now write to Firestore
    setTickets(newTickets);
    saveTickets(newTickets);
  };

  const login = (email: string, name: string) => {
    const user: User = {
      email,
      name: name || 'Agente',
      role: 'Suporte de Nível 3',
      avatarUrl: DEFAULT_USER.avatarUrl
    };
    setCurrentUser(user);
    localStorage.setItem('reliant_user', JSON.stringify(user));
    setActiveScreen('dashboard');
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('reliant_user');
    setActiveScreen('login');
  };

  const setScreen = (screen: ScreenType) => {
    setActiveScreen(screen);
  };

  const selectTicket = (id: string | null) => {
    setSelectedTicketId(id);
  };

  const createTicket = (ticketData: {
    title: string;
    description: string;
    category: TicketCategory;
    clientName: string;
    priority: TicketPriority;
    quantityReclamada?: number;
    customerReason?: string;
    vendasNumber?: string;
    transferReason?: string;
    attachments?: Attachment[];
    city?: string;
    state?: string;
  }) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Protocol number generation format APPxxxx/YYYY
    const loadedTickets = tickets.length > 0 ? tickets : loadTickets();
    let maxNum = 0;
    loadedTickets.forEach(t => {
      const match = t.id.match(/^APP(\d{4})\/\d{4}$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    const newId = `APP${String(nextNum).padStart(4, '0')}/${currentYear}`;
    
    // Formatting date helper
    const formattedDate = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' · ' + now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const isAdmUser = currentUser?.email === 'adm@empresa.com' || currentUser?.name === 'ADM';

    const newTicket: Ticket = {
      id: newId,
      title: ticketData.title,
      description: ticketData.description,
      status: 'Aberto',
      priority: ticketData.priority,
      category: ticketData.category,
      clientName: ticketData.clientName,
      contactPerson: 'Gestor da Conta',
      contactEmail: currentUser?.email || 'contato@' + ticketData.clientName.toLowerCase().replace(/\s+/g, '') + '.com',
      avgResolutionTime: 'Não estimado',
      createdAt: formattedDate,
      updatedAt: 'Criado agora',
      assigneeInitials: isAdmUser ? 'AD' : (currentUser ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AG'),
      assigneeName: currentUser ? currentUser.name : 'Agente Autônomo',
      attachments: ticketData.attachments || [],
      history: [
        {
          id: `hist-${Date.now()}`,
          title: 'Chamado Criado',
          description: `Criado por ${currentUser ? currentUser.name : 'Sistema'}`,
          timestamp: formattedDate,
          completed: true
        }
      ],
      internalNotes: [],
      customerReason: ticketData.customerReason,
      vendasNumber: ticketData.vendasNumber,
      transferReason: ticketData.transferReason,
      city: ticketData.city || '',
      state: ticketData.state || '',
      createdBy: currentUser?.email || 'juniorepa@gmail.com'
    };

    // Write to Firestore asynchronously, real-time listener will trigger state update
    setDoc(doc(db, 'tickets', newId.replace('/', '-')), newTicket)
      .catch(err => console.error('Error saving ticket to Firestore:', err));

    return newTicket;
  };

  const updateTicketStatus = (
    id: string,
    status: TicketStatus,
    technicalFeedback?: string,
    isInternal?: boolean,
    internalNoteText?: string
  ) => {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' · ' + now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const historyEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}`,
      title: `Status atualizado para: ${status}`,
      description: technicalFeedback || `Atualizado pelo agente ${currentUser?.name || 'Sistema'}`,
      timestamp: formattedDate,
      completed: true
    };

    const notes = ticket.internalNotes ? [...ticket.internalNotes] : [];
    if (isInternal && internalNoteText) {
      notes.push({
        id: `note-${Date.now()}`,
        text: internalNoteText,
        author: currentUser?.name || 'Agente',
        timestamp: formattedDate
      });
    }

    const isAdmUser = currentUser?.email === 'adm@empresa.com' || currentUser?.name === 'ADM';

    const updatedTicket = {
      ...ticket,
      status,
      assigneeName: currentUser ? currentUser.name : ticket.assigneeName,
      assigneeInitials: currentUser 
        ? (isAdmUser ? 'AD' : currentUser.name.split(' ').map(n => n && n[0] ? n[0] : '').join('').toUpperCase().slice(0, 2))
        : ticket.assigneeInitials,
      alertRead: status === 'Retorno Solicitado' ? false : ticket.alertRead,
      updatedAt: 'Atualizado agora',
      history: [historyEntry, ...(ticket.history || [])],
      internalNotes: notes
    };

    setDoc(doc(db, 'tickets', id.replace('/', '-')), updatedTicket)
      .catch(err => console.error('Error updating status in Firestore:', err));
  };

  const addInternalNote = (ticketId: string, text: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' · ' + now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const newNote: InternalNote = {
      id: `note-${Date.now()}`,
      text,
      author: currentUser?.name || 'Agente',
      timestamp: 'Hoje, ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedTicket = {
      ...ticket,
      internalNotes: [...(ticket.internalNotes || []), newNote]
    };

    setDoc(doc(db, 'tickets', ticketId.replace('/', '-')), updatedTicket)
      .catch(err => console.error('Error adding internal note to Firestore:', err));
  };

  const addAttachment = (ticketId: string, name: string, url: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const newAttachment: Attachment = {
      id: `att-${Date.now()}`,
      name,
      url
    };

    const updatedTicket = {
      ...ticket,
      attachments: [...(ticket.attachments || []), newAttachment]
    };

    setDoc(doc(db, 'tickets', ticketId.replace('/', '-')), updatedTicket)
      .catch(err => console.error('Error adding attachment to Firestore:', err));
  };

  const emitTicketAlert = (ticketId: string, alertTitle: string, alertDescription: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' · ' + now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const historyEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}`,
      title: `🔔 Alerta: ${alertTitle}`,
      description: alertDescription,
      timestamp: formattedDate,
      completed: true
    };

    const updatedTicket = {
      ...ticket,
      alertRead: false,
      updatedAt: 'Atualizado agora',
      history: [historyEntry, ...(ticket.history || [])]
    };

    setDoc(doc(db, 'tickets', ticketId.replace('/', '-')), updatedTicket)
      .catch(err => console.error('Error emitting alert to Firestore:', err));

    const targetUserEmail = ticket.createdBy || ticket.contactEmail || 'juniorepa@gmail.com';

    // Add alert to global notifications list in Firestore
    const newNotif: AppNotification = {
      id: `not-${Date.now()}`,
      title: `🔔 Alerta: ${alertTitle}`,
      description: alertDescription,
      time: 'Agora',
      read: false,
      ticketId: ticketId,
      targetUserEmail: targetUserEmail
    };

    setDoc(doc(db, 'notifications', newNotif.id), newNotif)
      .catch(err => console.error('Error creating notification in Firestore:', err));
  };

  const resetAllData = () => {
    const batch = writeBatch(db);
    tickets.forEach((t) => {
      batch.delete(doc(db, 'tickets', t.id.replace('/', '-')));
    });

    INITIAL_TICKETS.forEach((ticket) => {
      const ticketRef = doc(db, 'tickets', ticket.id.replace('/', '-'));
      batch.set(ticketRef, ticket);
    });

    batch.commit()
      .then(() => console.log('Firestore database reset to initial tickets successfully.'))
      .catch((err) => console.error('Error resetting Firestore data:', err));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        tickets,
        activeScreen,
        selectedTicketId,
        dashboardFilter,
        searchQuery,
        login,
        logout,
        setScreen,
        selectTicket,
        setDashboardFilter,
        setSearchQuery,
        createTicket,
        updateTicketStatus,
        addInternalNote,
        addAttachment,
        emitTicketAlert,
        resetAllData,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
