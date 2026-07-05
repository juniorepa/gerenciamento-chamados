import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ticket, TicketStatus, TicketCategory, TicketPriority, ScreenType, User, Attachment, StatusHistoryEntry, InternalNote, AppNotification } from '../types';
import { loadTickets, saveTickets, DEFAULT_USER, INITIAL_TICKETS } from '../data';
import { supabase } from '../lib/supabase';

const INITIAL_NOTIFICATIONS = [
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

interface AppContextType {
  currentUser: User | null;
  tickets: Ticket[];
  activeScreen: ScreenType;
  selectedTicketId: string | null;
  dashboardFilter: 'Todos' | 'Atribuídos' | 'Escalados';
  searchQuery: string;
  statusFilter: TicketStatus | null;
  setStatusFilter: (status: TicketStatus | null) => void;
  regionFilter: 'AMER' | 'EMEA' | 'APAC' | null;
  setRegionFilter: (region: 'AMER' | 'EMEA' | 'APAC' | null) => void;
  login: (email: string, name: string) => void;
  logout: () => void;
  loginWithSupabase: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signUpWithSupabase: (email: string, password: string, name: string, role?: string) => Promise<{ error: any }>;
  resetPasswordWithSupabase: (email: string, password?: string) => Promise<{ error: any }>;
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
    customerGroup?: 'Customer Selantes' | 'Customer Argamassa' | 'Customer Logística';
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
  rateTicket: (ticketId: string, rating: 'Bom' | 'Ruim' | 'Ótimo', comment?: string) => void;
  resetAllData: () => void;
  clearAllTickets: () => Promise<void>;
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
    return null; // Start as null to prompt Supabase/local login on first use
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  const [activeScreen, setActiveScreen] = useState<ScreenType>(() => {
    const storedUser = localStorage.getItem('reliant_user');
    if (!storedUser) return 'login';
    const storedScreen = localStorage.getItem('reliant_active_screen');
    return (storedScreen as ScreenType) || 'dashboard';
  });

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(() => {
    return localStorage.getItem('reliant_selected_ticket_id') || null;
  });

  // Sync activeScreen to localStorage
  useEffect(() => {
    if (activeScreen) {
      localStorage.setItem('reliant_active_screen', activeScreen);
    } else {
      localStorage.removeItem('reliant_active_screen');
    }
  }, [activeScreen]);

  // Sync selectedTicketId to localStorage
  useEffect(() => {
    if (selectedTicketId) {
      localStorage.setItem('reliant_selected_ticket_id', selectedTicketId);
    } else {
      localStorage.removeItem('reliant_selected_ticket_id');
    }
  }, [selectedTicketId]);

  // Effect to sync and listen to Supabase Authentication State
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userEmail = session.user.email || '';
          const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || userEmail.split('@')[0];
          const emailLower = userEmail.toLowerCase().trim();
          const nameLower = name.toLowerCase().trim();
          const isAdm = emailLower === 'adm@empresa.com' || 
                        emailLower.startsWith('adm@') || 
                        emailLower.includes('selante') || 
                        emailLower.includes('argamassa') || 
                        emailLower.includes('logistica') || 
                        emailLower.includes('logistic') ||
                        nameLower.includes('selante') ||
                        nameLower.includes('argamassa') ||
                        nameLower.includes('logistica') ||
                        nameLower.includes('logistic') ||
                        nameLower.includes('adm');

          let role = 'Customer';
          if (isAdm) {
            if (emailLower.includes('selante') || nameLower.includes('selante')) {
              role = 'Customer Selantes';
            } else if (emailLower.includes('argamassa') || nameLower.includes('argamassa')) {
              role = 'Customer Argamassa';
            } else if (emailLower.includes('logistica') || emailLower.includes('logistic') || nameLower.includes('logistica') || nameLower.includes('logistic')) {
              role = 'Customer Logística';
            } else {
              role = 'ADM';
            }
          } else {
            role = session.user.user_metadata?.role || 'Vendedor/Representante';
          }

          const appUser: User = {
            email: userEmail,
            name: name,
            role: role,
            avatarUrl: session.user.user_metadata?.avatar_url || DEFAULT_USER.avatarUrl
          };
          setCurrentUser(appUser);
          setActiveScreen(prev => {
            if (prev === 'login' || prev === 'reset-password') {
              const storedScreen = localStorage.getItem('reliant_active_screen');
              return (storedScreen as ScreenType) || 'dashboard';
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Error fetching Supabase session on mount:', err);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userEmail = session.user.email || '';
        const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || userEmail.split('@')[0];
        const emailLower = userEmail.toLowerCase().trim();
        const nameLower = name.toLowerCase().trim();
        const isAdm = emailLower === 'adm@empresa.com' || 
                      emailLower.startsWith('adm@') || 
                      emailLower.includes('selante') || 
                      emailLower.includes('argamassa') || 
                      emailLower.includes('logistica') || 
                      emailLower.includes('logistic') ||
                      nameLower.includes('selante') ||
                      nameLower.includes('argamassa') ||
                      nameLower.includes('logistica') ||
                      nameLower.includes('logistic') ||
                      nameLower.includes('adm');

        let role = 'Customer';
        if (isAdm) {
          if (emailLower.includes('selante') || nameLower.includes('selante')) {
            role = 'Customer Selantes';
          } else if (emailLower.includes('argamassa') || nameLower.includes('argamassa')) {
            role = 'Customer Argamassa';
          } else if (emailLower.includes('logistica') || emailLower.includes('logistic') || nameLower.includes('logistica') || nameLower.includes('logistic')) {
            role = 'Customer Logística';
          } else {
            role = 'ADM';
          }
        } else {
          role = session.user.user_metadata?.role || 'Vendedor/Representante';
        }

        const appUser: User = {
          email: userEmail,
          name: name,
          role: role,
          avatarUrl: session.user.user_metadata?.avatar_url || DEFAULT_USER.avatarUrl
        };
        setCurrentUser(appUser);
        localStorage.setItem('reliant_user', JSON.stringify(appUser));
        setActiveScreen(prev => {
          if (prev === 'login' || prev === 'reset-password') {
            const storedScreen = localStorage.getItem('reliant_active_screen');
            return (storedScreen as ScreenType) || 'dashboard';
          }
          return prev;
        });
      } else {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          localStorage.removeItem('reliant_user');
          localStorage.removeItem('reliant_active_screen');
          localStorage.removeItem('reliant_selected_ticket_id');
          setActiveScreen('login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const [dashboardFilter, setDashboardFilter] = useState<'Todos' | 'Atribuídos' | 'Escalados'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null);
  const [regionFilter, setRegionFilter] = useState<'AMER' | 'EMEA' | 'APAC' | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // 1. Subscribe to real-time tickets from Supabase
  useEffect(() => {
    let active = true;

    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*');

        if (error) {
          throw error;
        }

        if (!active) return;

        if (!data || data.length === 0) {
          const intentionallyCleared = localStorage.getItem('reliant_db_intentionally_cleared') === 'true';
          const isSeeded = localStorage.getItem('reliant_tickets_seeded') === 'true';
          if (intentionallyCleared || isSeeded) {
            setTickets([]);
            saveTickets([]);
            return;
          }

          // If Supabase is empty, seed it with INITIAL_TICKETS
          console.log('Seeding Supabase with initial tickets...');
          const { error: seedErr } = await supabase
            .from('tickets')
            .insert(INITIAL_TICKETS);
          
          if (seedErr) {
            console.error('Error seeding initial tickets to Supabase:', seedErr);
          }
          localStorage.setItem('reliant_tickets_seeded', 'true');
          setTickets(INITIAL_TICKETS);
          saveTickets(INITIAL_TICKETS);
        } else {
          localStorage.setItem('reliant_tickets_seeded', 'true');
          const ticketsList = data as Ticket[];
          ticketsList.sort((a, b) => b.id.localeCompare(a.id));
          setTickets(ticketsList);
          saveTickets(ticketsList);
        }
      } catch (err) {
        console.error("Error fetching tickets from Supabase. Falling back to Local Storage. Please ensure you have executed /supabase_setup.sql in your Supabase dashboard.", err);
        if (active) {
          // Fallback to local storage if Supabase fails
          const loaded = loadTickets();
          setTickets(loaded);
        }
      }
    };

    fetchTickets();

    // Subscribe to real-time updates from Supabase
    const ticketsSubscription = supabase
      .channel('public-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      active = false;
      ticketsSubscription.unsubscribe();
    };
  }, []);

  // 2. Subscribe to real-time notifications from Supabase
  useEffect(() => {
    let active = true;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*');

        if (error) {
          throw error;
        }

        if (!active) return;

        if (!data || data.length === 0) {
          const isSeeded = localStorage.getItem('reliant_notifications_seeded') === 'true';
          if (isSeeded) {
            setNotifications([]);
            localStorage.setItem('reliant_notifications', JSON.stringify([]));
          } else {
            console.log('Seeding Supabase with initial notifications...');
            const { error: seedErr } = await supabase
              .from('notifications')
              .insert(INITIAL_NOTIFICATIONS);

            if (seedErr) {
              console.error('Error seeding notifications to Supabase:', seedErr);
            }

            localStorage.setItem('reliant_notifications_seeded', 'true');
            setNotifications(INITIAL_NOTIFICATIONS);
            localStorage.setItem('reliant_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
          }
        } else {
          const notifsList = data as AppNotification[];
          notifsList.sort((a, b) => b.id.localeCompare(a.id));
          setNotifications(notifsList);
          localStorage.setItem('reliant_notifications', JSON.stringify(notifsList));
          localStorage.setItem('reliant_notifications_seeded', 'true');
        }
      } catch (err) {
        console.error("Error fetching notifications from Supabase. Falling back to Local Storage. Please ensure you have executed /supabase_setup.sql in your Supabase dashboard.", err);
        if (active) {
          const stored = localStorage.getItem('reliant_notifications');
          if (stored) {
            try {
              setNotifications(JSON.parse(stored));
            } catch {}
          }
        }
      }
    };

    fetchNotifications();

    const notificationsSubscription = supabase
      .channel('public-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      active = false;
      notificationsSubscription.unsubscribe();
    };
  }, []);

  const markNotificationAsRead = async (id: string) => {
    // Optimistic update of local state immediately
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem('reliant_notifications', JSON.stringify(updated));

    try {
      // Update the notification to read: true
      const { error: updateErr } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (updateErr) throw updateErr;
    } catch (err) {
      console.error('Error marking notification as read in Supabase:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const emailLower = currentUser?.email?.toLowerCase() || '';
    const nameLower = currentUser?.name?.toLowerCase() || '';
    const roleLower = currentUser?.role?.toLowerCase() || '';
    const isAdm = currentUser?.email === 'adm@empresa.com' || 
                  currentUser?.name === 'ADM' ||
                  emailLower.includes('selante') ||
                  emailLower.includes('argamassa') ||
                  emailLower.includes('logistica') ||
                  emailLower.includes('logistic') ||
                  emailLower.includes('adm') ||
                  nameLower.includes('selante') ||
                  nameLower.includes('argamassa') ||
                  nameLower.includes('logistica') ||
                  nameLower.includes('logistic') ||
                  nameLower.includes('adm') ||
                  roleLower.includes('selante') ||
                  roleLower.includes('argamassa') ||
                  roleLower.includes('logistica') ||
                  roleLower.includes('logistic') ||
                  roleLower.includes('adm') ||
                  (currentUser?.role && ['ADM', 'Customer Selantes', 'Customer Argamassa', 'Customer Logística'].includes(currentUser.role));
    const userEmail = currentUser?.email || '';

    // Optimistic update of local state immediately
    const updated = notifications.map(n => {
      const matchesUser = isAdm || n.targetUserEmail === userEmail;
      return matchesUser ? { ...n, read: true } : n;
    });
    setNotifications(updated);
    localStorage.setItem('reliant_notifications', JSON.stringify(updated));

    try {
      for (const n of notifications) {
        const matchesUser = isAdm || n.targetUserEmail === userEmail;
        if (matchesUser) {
          await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', n.id);
        }
      }
    } catch (err) {
      console.error('Error marking all notifications as read in Supabase:', err);
    }
  };

  const clearAllNotifications = async () => {
    const emailLower = currentUser?.email?.toLowerCase() || '';
    const nameLower = currentUser?.name?.toLowerCase() || '';
    const roleLower = currentUser?.role?.toLowerCase() || '';
    const isAdm = currentUser?.email === 'adm@empresa.com' || 
                  currentUser?.name === 'ADM' ||
                  emailLower.includes('selante') ||
                  emailLower.includes('argamassa') ||
                  emailLower.includes('logistica') ||
                  emailLower.includes('logistic') ||
                  emailLower.includes('adm') ||
                  nameLower.includes('selante') ||
                  nameLower.includes('argamassa') ||
                  nameLower.includes('logistica') ||
                  nameLower.includes('logistic') ||
                  nameLower.includes('adm') ||
                  roleLower.includes('selante') ||
                  roleLower.includes('argamassa') ||
                  roleLower.includes('logistica') ||
                  roleLower.includes('logistic') ||
                  roleLower.includes('adm') ||
                  (currentUser?.role && ['ADM', 'Customer Selantes', 'Customer Argamassa', 'Customer Logística'].includes(currentUser.role));
    const userEmail = currentUser?.email || '';

    // Optimistic update of local state immediately
    const updated = notifications.filter(n => {
      const matchesUser = isAdm || n.targetUserEmail === userEmail;
      return !matchesUser;
    });
    setNotifications(updated);
    localStorage.setItem('reliant_notifications', JSON.stringify(updated));

    try {
      for (const n of notifications) {
        const matchesUser = isAdm || n.targetUserEmail === userEmail;
        if (matchesUser) {
          await supabase
            .from('notifications')
            .delete()
            .eq('id', n.id);
        }
      }
      localStorage.setItem('reliant_notifications_seeded', 'true');
    } catch (err) {
      console.error('Error clearing notifications in Supabase:', err);
    }
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

  const loginWithSupabase = async (email: string, password: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      // 1. Try real Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });
      if (!error) {
        if (name && name.trim()) {
          // Update user metadata in Supabase Auth
          await supabase.auth.updateUser({
            data: { name: name.trim() }
          });
          // Update profile in profiles table
          await supabase
            .from('profiles')
            .upsert({ email: cleanEmail, name: name.trim() }, { onConflict: 'email' });
        }
        return { error: null };
      }
      
      // 2. If real auth fails, check for a local password override
      const overrides = JSON.parse(localStorage.getItem('reliant_local_passwords') || '{}');
      if (overrides[cleanEmail] && overrides[cleanEmail] === password) {
        // Find profile for this user from database if possible
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        const emailLower = cleanEmail.toLowerCase().trim();
        const nameVal = name?.trim() || profile?.name || cleanEmail.split('@')[0];
        const nameLower = nameVal.toLowerCase().trim();
        const isAdm = emailLower === 'adm@empresa.com' || 
                      emailLower.startsWith('adm@') || 
                      emailLower.includes('selante') || 
                      emailLower.includes('argamassa') || 
                      emailLower.includes('logistica') || 
                      emailLower.includes('logistic') ||
                      nameLower.includes('selante') ||
                      nameLower.includes('argamassa') ||
                      nameLower.includes('logistica') ||
                      nameLower.includes('logistic') ||
                      nameLower.includes('adm');

        let role = 'Vendedor/Representante';
        if (isAdm) {
          if (emailLower.includes('selante') || nameLower.includes('selante')) {
            role = 'Customer Selantes';
          } else if (emailLower.includes('argamassa') || nameLower.includes('argamassa')) {
            role = 'Customer Argamassa';
          } else if (emailLower.includes('logistica') || emailLower.includes('logistic') || nameLower.includes('logistica') || nameLower.includes('logistic')) {
            role = 'Customer Logística';
          } else {
            role = 'ADM';
          }
        } else {
          role = profile?.role || 'Vendedor/Representante';
        }

        const appUser: User = {
          email: cleanEmail,
          name: nameVal,
          role: role,
          avatarUrl: profile?.avatarUrl || DEFAULT_USER.avatarUrl
        };
        setCurrentUser(appUser);
        localStorage.setItem('reliant_user', JSON.stringify(appUser));
        setActiveScreen('dashboard');
        return { error: null };
      }
      
      throw error;
    } catch (err: any) {
      console.error('Supabase Login Error:', err);
      const isInvalidCredentials = err.message && (
        err.message.toLowerCase().includes('invalid login credentials') ||
        err.message.toLowerCase().includes('user not found') ||
        err.message.toLowerCase().includes('invalid_grant')
      );
      if (isInvalidCredentials) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', cleanEmail)
            .maybeSingle();
            
          if (!profile) {
            return { error: 'usuário nao cadastrado' };
          }
        } catch (profileSearchErr) {
          console.error('Error searching profile table during login error handling:', profileSearchErr);
        }
      }
      return { error: err.message || err };
    }
  };

  const signUpWithSupabase = async (email: string, password: string, name: string, selectedRole?: string) => {
    try {
      const emailLower = email.trim().toLowerCase();
      
      // Check if email already exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', emailLower)
        .maybeSingle();

      if (existingProfile) {
        return { error: 'e-mail já cadastrado' };
      }

      const isAdm = emailLower === 'adm@empresa.com' || 
                    emailLower.startsWith('adm@') || 
                    emailLower.includes('selante') || 
                    emailLower.includes('argamassa') || 
                    emailLower.includes('logistica') || 
                    emailLower.includes('logistic');

      let role = selectedRole || 'Vendedor/Representante';
      if (isAdm) {
        if (emailLower.includes('selante')) {
          role = 'Customer Selantes';
        } else if (emailLower.includes('argamassa')) {
          role = 'Customer Argamassa';
        } else if (emailLower.includes('logistica') || emailLower.includes('logistic')) {
          role = 'Customer Logística';
        } else {
          role = 'ADM';
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailLower,
        password,
        options: {
          data: {
            name: name,
            role: role
          }
        }
      });
      if (error) {
        if (error.message && (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already exists'))) {
          return { error: 'e-mail já cadastrado' };
        }
        throw error;
      }
      return { error: null };
    } catch (err: any) {
      console.error('Supabase Sign Up Error:', err);
      let errMsg = err.message || err;
      if (typeof errMsg === 'string') {
        const msgLower = errMsg.toLowerCase();
        if (msgLower.includes('already registered') || msgLower.includes('user already exists')) {
          errMsg = 'e-mail já cadastrado';
        } else if (msgLower.includes('password should be at least')) {
          errMsg = 'A senha deve conter no mínimo 6 caracteres.';
        }
      }
      return { error: errMsg };
    }
  };

  const resetPasswordWithSupabase = async (email: string, password?: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      
      // Save password as a local override so they can use it immediately
      if (password) {
        const overrides = JSON.parse(localStorage.getItem('reliant_local_passwords') || '{}');
        overrides[cleanEmail] = password;
        localStorage.setItem('reliant_local_passwords', JSON.stringify(overrides));
        
        try {
          await supabase
            .from('profiles')
            .update({ updatedAt: new Date().toISOString() })
            .eq('email', cleanEmail);
        } catch (dbErr) {
          console.warn('Could not update profile updated_at timestamp:', dbErr);
        }
      }

      // Trigger the real Supabase password reset request
      try {
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin
        });
      } catch (authErr) {
        console.warn('Supabase Auth resetPasswordForEmail warning (standard without SMTP configured):', authErr);
      }

      return { error: null };
    } catch (err: any) {
      console.error('Reset Password Error:', err);
      return { error: err.message || err };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out from Supabase:', err);
    }
    setCurrentUser(null);
    localStorage.removeItem('reliant_user');
    localStorage.removeItem('reliant_active_screen');
    localStorage.removeItem('reliant_selected_ticket_id');
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
    logisticSituation?: string;
    customerGroup?: 'Customer Selantes' | 'Customer Argamassa' | 'Customer Logística';
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

    const emailLower = currentUser?.email?.toLowerCase() || '';
    const nameLower = currentUser?.name?.toLowerCase() || '';
    const roleLower = currentUser?.role?.toLowerCase() || '';
    const isAdmUser = currentUser?.email === 'adm@empresa.com' || 
                      currentUser?.name === 'ADM' ||
                      emailLower.includes('selante') ||
                      emailLower.includes('argamassa') ||
                      emailLower.includes('logistica') ||
                      emailLower.includes('logistic') ||
                      emailLower.includes('adm') ||
                      nameLower.includes('selante') ||
                      nameLower.includes('argamassa') ||
                      nameLower.includes('logistica') ||
                      nameLower.includes('logistic') ||
                      nameLower.includes('adm') ||
                      roleLower.includes('selante') ||
                      roleLower.includes('argamassa') ||
                      roleLower.includes('logistica') ||
                      roleLower.includes('logistic') ||
                      roleLower.includes('adm') ||
                      (currentUser?.role && ['ADM', 'Customer Selantes', 'Customer Argamassa', 'Customer Logística'].includes(currentUser.role));

    const newTicket: Ticket = {
      id: newId,
      title: ticketData.title,
      description: ticketData.description,
      status: 'Aberto',
      priority: ticketData.priority,
      category: ticketData.category,
      customerGroup: ticketData.customerGroup,
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
      logisticSituation: ticketData.logisticSituation,
      city: ticketData.city || '',
      state: ticketData.state || '',
      createdBy: currentUser?.email || 'juniorepa@gmail.com',
      createdAtIso: now.toISOString()
    };

    // Write to Supabase asynchronously
    supabase
      .from('tickets')
      .upsert(newTicket)
      .then(({ error }) => {
        if (error) console.error('Error saving ticket to Supabase:', error);
      });

    // Instant local state update
    const updatedTickets = [newTicket, ...tickets];
    setTickets(updatedTickets);
    saveTickets(updatedTickets);

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

    const emailLower = currentUser?.email?.toLowerCase() || '';
    const nameLower = currentUser?.name?.toLowerCase() || '';
    const roleLower = currentUser?.role?.toLowerCase() || '';
    const isAdmUser = currentUser?.email === 'adm@empresa.com' || 
                      currentUser?.name === 'ADM' ||
                      emailLower.includes('selante') ||
                      emailLower.includes('argamassa') ||
                      emailLower.includes('logistica') ||
                      emailLower.includes('logistic') ||
                      emailLower.includes('adm') ||
                      nameLower.includes('selante') ||
                      nameLower.includes('argamassa') ||
                      nameLower.includes('logistica') ||
                      nameLower.includes('logistic') ||
                      nameLower.includes('adm') ||
                      roleLower.includes('selante') ||
                      roleLower.includes('argamassa') ||
                      roleLower.includes('logistica') ||
                      roleLower.includes('logistic') ||
                      roleLower.includes('adm') ||
                      (currentUser?.role && ['ADM', 'Customer Selantes', 'Customer Argamassa', 'Customer Logística'].includes(currentUser.role));
    
    const createdDate = ticket.createdAtIso ? new Date(ticket.createdAtIso) : new Date(Date.now() - 3600000 * 24);
    const createdAtIso = ticket.createdAtIso || createdDate.toISOString();

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
      internalNotes: notes,
      notifyOnReturn: true,
      lastRespondedBy: currentUser?.email,
      createdAtIso,
      resolvedAtIso: status === 'Resolvido' ? now.toISOString() : ticket.resolvedAtIso
    };

    // Write to Supabase asynchronously
    supabase
      .from('tickets')
      .upsert(updatedTicket)
      .then(({ error }) => {
        if (error) console.error('Error updating status in Supabase:', error);
      });

    // Instant local state update
    const updatedTickets = tickets.map(t => t.id === id ? updatedTicket : t);
    setTickets(updatedTickets);
    saveTickets(updatedTickets);

    // Automatically generate notification alert
    const targetUserEmail = ticket.createdBy || ticket.contactEmail;
    const isCreator = currentUser?.email === targetUserEmail;
    
    const newNotif: AppNotification = {
      id: `not-${Date.now()}`,
      title: isCreator 
        ? `🔄 Retorno Respondido: Chamado #${id.slice(0, 8)}`
        : `🔔 Status do Chamado Atualizado: ${status}`,
      description: isCreator
        ? `O cliente ${currentUser?.name || 'Cliente'} enviou o retorno solicitado: "${technicalFeedback || 'Informações enviadas.'}"`
        : (technicalFeedback || `Seu chamado #${id.slice(0, 8)} foi atualizado para "${status}". Clique para ver os detalhes.`),
      time: 'Agora',
      read: false,
      ticketId: id,
      targetUserEmail: isCreator ? undefined : targetUserEmail,
      notifyRole: isCreator ? 'admin' : 'assignee',
      senderEmail: currentUser?.email
    };

    supabase
      .from('notifications')
      .insert(newNotif)
      .then(({ error }) => {
        if (error) console.error('Error creating automatic notification in Supabase:', error);
      });

    setNotifications(prev => [newNotif, ...prev]);
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

    // Write to Supabase asynchronously
    supabase
      .from('tickets')
      .upsert(updatedTicket)
      .then(({ error }) => {
        if (error) console.error('Error adding internal note to Supabase:', error);
      });

    // Instant local state update
    const updatedTickets = tickets.map(t => t.id === ticketId ? updatedTicket : t);
    setTickets(updatedTickets);
    saveTickets(updatedTickets);

    // Automatically generate notification alert for the ticket creator when a note is added
    const targetUserEmail = ticket.createdBy || ticket.contactEmail;
    if (targetUserEmail && currentUser?.email !== targetUserEmail) {
      const newNotif: AppNotification = {
        id: `not-${Date.now()}`,
        title: `💬 Nova Mensagem no Chamado`,
        description: `O agente ${currentUser?.name || 'Suporte'} adicionou uma nota: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`,
        time: 'Agora',
        read: false,
        ticketId: ticketId,
        targetUserEmail: targetUserEmail,
        notifyRole: 'assignee',
        senderEmail: currentUser?.email
      };

      supabase
        .from('notifications')
        .insert(newNotif)
        .then(({ error }) => {
          if (error) console.error('Error creating automatic note notification in Supabase:', error);
        });

      setNotifications(prev => [newNotif, ...prev]);
    }
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

    // Write to Supabase asynchronously
    supabase
      .from('tickets')
      .upsert(updatedTicket)
      .then(({ error }) => {
        if (error) console.error('Error adding attachment to Supabase:', error);
      });

    // Instant local state update
    const updatedTickets = tickets.map(t => t.id === ticketId ? updatedTicket : t);
    setTickets(updatedTickets);
    saveTickets(updatedTickets);
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

    // Write ticket update to Supabase
    supabase
      .from('tickets')
      .upsert(updatedTicket)
      .then(({ error }) => {
        if (error) console.error('Error emitting alert to Supabase:', error);
      });

    // Instant local state update
    const updatedTickets = tickets.map(t => t.id === ticketId ? updatedTicket : t);
    setTickets(updatedTickets);
    saveTickets(updatedTickets);

    const targetUserEmail = ticket.createdBy || ticket.contactEmail || 'juniorepa@gmail.com';

    // Add alert to global notifications list in Supabase
    const newNotif: AppNotification = {
      id: `not-${Date.now()}`,
      title: `🔔 Alerta: ${alertTitle}`,
      description: alertDescription,
      time: 'Agora',
      read: false,
      ticketId: ticketId,
      targetUserEmail: targetUserEmail,
      senderEmail: currentUser?.email
    };

    supabase
      .from('notifications')
      .insert(newNotif)
      .then(({ error }) => {
        if (error) console.error('Error creating notification in Supabase:', error);
      });

    // Instant local notifications update
    setNotifications(prev => [newNotif, ...prev]);
  };

  const rateTicket = (ticketId: string, rating: 'Bom' | 'Ruim' | 'Ótimo', comment?: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const updatedTicket: Ticket = {
      ...ticket,
      rating,
      ratingComment: comment || ''
    };

    // Write to Supabase asynchronously
    supabase
      .from('tickets')
      .upsert(updatedTicket)
      .then(({ error }) => {
        if (error) console.error('Error saving rating to Supabase:', error);
      });

    // Instant local state update
    const updatedTickets = tickets.map(t => t.id === ticketId ? updatedTicket : t);
    setTickets(updatedTickets);
    saveTickets(updatedTickets);
  };

  const resetAllData = async () => {
    try {
      localStorage.removeItem('reliant_db_intentionally_cleared');
      localStorage.setItem('reliant_tickets_seeded', 'true');
      
      // Clear tickets table
      await supabase
        .from('tickets')
        .delete()
        .neq('id', 'dummy-unmatched-id');

      // Seed initial tickets
      const { error: insertErr } = await supabase
        .from('tickets')
        .insert(INITIAL_TICKETS);

      if (insertErr) throw insertErr;

      console.log('Supabase database reset to initial tickets successfully.');
      setTickets(INITIAL_TICKETS);
      saveTickets(INITIAL_TICKETS);

      // Clear notifications table
      await supabase
        .from('notifications')
        .delete()
        .neq('id', 'dummy-unmatched-id');

      // Seed initial notifications
      const { error: seedNotifErr } = await supabase
        .from('notifications')
        .insert(INITIAL_NOTIFICATIONS);

      if (seedNotifErr) throw seedNotifErr;

      console.log('Supabase database reset to initial notifications successfully.');
      localStorage.setItem('reliant_notifications_seeded', 'true');
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.setItem('reliant_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));

    } catch (err) {
      console.error('Error resetting Supabase data:', err);
      // Local fallback
      localStorage.removeItem('reliant_db_intentionally_cleared');
      localStorage.setItem('reliant_tickets_seeded', 'true');
      setTickets(INITIAL_TICKETS);
      saveTickets(INITIAL_TICKETS);
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.setItem('reliant_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  };

  const clearAllTickets = async () => {
    try {
      localStorage.setItem('reliant_db_intentionally_cleared', 'true');
      localStorage.setItem('reliant_tickets_seeded', 'true');
      
      // Clear tickets table in Supabase
      await supabase
        .from('tickets')
        .delete()
        .neq('id', 'dummy-unmatched-id');

      // Clear notifications table in Supabase
      await supabase
        .from('notifications')
        .delete()
        .neq('id', 'dummy-unmatched-id');

      console.log('All tickets and notifications cleared successfully.');
      
      // Reset local state instantly
      setTickets([]);
      saveTickets([]);
      setSelectedTicketId(null);
      localStorage.removeItem('reliant_selected_ticket_id');

      setNotifications([]);
      localStorage.setItem('reliant_notifications', JSON.stringify([]));
      localStorage.setItem('reliant_notifications_seeded', 'true');
    } catch (err) {
      console.error('Error clearing data from Supabase:', err);
      // Local fallback
      localStorage.setItem('reliant_db_intentionally_cleared', 'true');
      localStorage.setItem('reliant_tickets_seeded', 'true');
      setTickets([]);
      saveTickets([]);
      setSelectedTicketId(null);
      localStorage.removeItem('reliant_selected_ticket_id');
      setNotifications([]);
      localStorage.setItem('reliant_notifications', JSON.stringify([]));
    }
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
        statusFilter,
        setStatusFilter,
        regionFilter,
        setRegionFilter,
        login,
        logout,
        loginWithSupabase,
        signUpWithSupabase,
        resetPasswordWithSupabase,
        setScreen,
        selectTicket,
        setDashboardFilter,
        setSearchQuery,
        createTicket,
        updateTicketStatus,
        addInternalNote,
        addAttachment,
        emitTicketAlert,
        rateTicket,
        resetAllData,
        clearAllTickets,
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
