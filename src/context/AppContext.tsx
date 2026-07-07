import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ticket, TicketStatus, TicketCategory, TicketPriority, ScreenType, User, Attachment, StatusHistoryEntry, InternalNote, AppNotification } from '../types';
import { loadTickets, saveTickets, DEFAULT_USER, INITIAL_TICKETS } from '../data';
import { supabase } from '../lib/supabase';

const getErrorMessage = (err: any): string => {
  if (!err) return 'Erro desconhecido';
  let message = '';
  
  if (typeof err === 'string') {
    message = err;
  } else if (err.message) {
    message = err.message;
  } else if (err.error_description) {
    message = err.error_description;
  } else if (err.error) {
    message = typeof err.error === 'string' ? err.error : (err.error.message || JSON.stringify(err.error));
  } else if (err.msg) {
    message = err.msg;
  } else {
    try {
      const keys = Object.getOwnPropertyNames(err);
      if (keys.length > 0) {
        const obj: any = {};
        for (const key of keys) {
          obj[key] = err[key];
        }
        message = obj.message || JSON.stringify(obj);
      } else {
        message = JSON.stringify(err);
      }
    } catch {
      message = String(err);
    }
  }

  if (message === '{}' || message === '""' || !message) {
    message = 'Erro na comunicação com o servidor do Supabase.';
  }

  if (message.includes('Database error saving new user')) {
    return 'Erro de banco de dados ao salvar novo usuário. Isso indica que o gatilho "handle_new_user" ou o tipo "user_role" no seu Supabase estão desatualizados. Por favor, execute o script completo "supabase_complete_setup.sql" (ou "supabase_update_role_enum.sql") no SQL Editor do seu painel do Supabase para corrigir!';
  }

  return message;
};

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
  signUpWithSupabase: (email: string, password: string, name: string) => Promise<{ error: any }>;
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
  allProfiles: User[];
  fetchProfiles: () => Promise<void>;
  linkSellerToBackoffice: (sellerEmail: string, backofficeEmail: string | null) => Promise<void>;
  updateUserRole: (email: string, role: string) => Promise<{ error: any }>;
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
    const checkRecovery = () => {
      const hash = window.location.hash || '';
      if (hash.includes('type=recovery') || hash.includes('access_token=')) {
        localStorage.setItem('is_recovering_password', 'true');
        return true;
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('type') === 'recovery') {
        localStorage.setItem('is_recovering_password', 'true');
        return true;
      }
      return localStorage.getItem('is_recovering_password') === 'true';
    };

    const checkSession = async () => {
      try {
        const isRecovering = checkRecovery();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userEmail = session.user.email || '';
          const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || userEmail.split('@')[0];
          const emailLower = userEmail.toLowerCase().trim();
          const nameLower = name.toLowerCase().trim();

          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('email', emailLower)
            .maybeSingle();

          let role = profile?.role;

          if (!role) {
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

            const isGestor = emailLower.includes('gestor') || 
                             emailLower.includes('gerente') || 
                             nameLower.includes('gestor') || 
                             nameLower.includes('gerente') ||
                             session.user.user_metadata?.role === 'Gestor de Backoffice';

            role = 'Customer';
            if (isGestor) {
              role = 'Gestor de Backoffice';
            } else if (isAdm) {
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
              role = session.user.user_metadata?.role || 'Agente';
            }
          }

          const appUser: User = {
            email: userEmail,
            name: name,
            role: role,
            avatarUrl: session.user.user_metadata?.avatar_url || DEFAULT_USER.avatarUrl
          };
          setCurrentUser(appUser);
          if (isRecovering) {
            setActiveScreen('reset-password');
          } else {
            setActiveScreen(prev => {
              if (prev === 'login' || prev === 'reset-password') {
                const storedScreen = localStorage.getItem('reliant_active_screen');
                return (storedScreen as ScreenType) || 'dashboard';
              }
              return prev;
            });
          }
        } else if (isRecovering) {
          setActiveScreen('reset-password');
        }
      } catch (err) {
        console.error('Error fetching Supabase session on mount:', err);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        const isRecovering = checkRecovery() || event === 'PASSWORD_RECOVERY';
        if (event === 'PASSWORD_RECOVERY') {
          localStorage.setItem('is_recovering_password', 'true');
        }

        if (session?.user) {
          const userEmail = session.user.email || '';
          const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || userEmail.split('@')[0];
          const emailLower = userEmail.toLowerCase().trim();
          const nameLower = name.toLowerCase().trim();

          let role = 'Customer';
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('email', emailLower)
              .maybeSingle();

            if (profile?.role) {
              role = profile.role;
            } else {
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

              const isGestor = emailLower.includes('gestor') || 
                               emailLower.includes('gerente') || 
                               nameLower.includes('gestor') || 
                               nameLower.includes('gerente') ||
                               session.user.user_metadata?.role === 'Gestor de Backoffice';

              if (isGestor) {
                role = 'Gestor de Backoffice';
              } else if (isAdm) {
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
                role = session.user.user_metadata?.role || 'Agente';
              }
            }
          } catch (profileErr) {
            console.warn('Failed to fetch profile in onAuthStateChange:', profileErr);
          }

          const appUser: User = {
            email: userEmail,
            name: name,
            role: role,
            avatarUrl: session.user.user_metadata?.avatar_url || DEFAULT_USER.avatarUrl
          };
          setCurrentUser(appUser);
          localStorage.setItem('reliant_user', JSON.stringify(appUser));
          if (isRecovering) {
            setActiveScreen('reset-password');
          } else {
            setActiveScreen(prev => {
              if (prev === 'login' || prev === 'reset-password') {
                const storedScreen = localStorage.getItem('reliant_active_screen');
                return (storedScreen as ScreenType) || 'dashboard';
              }
              return prev;
            });
          }
        } else {
          if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            localStorage.removeItem('reliant_user');
            localStorage.removeItem('reliant_active_screen');
            localStorage.removeItem('reliant_selected_ticket_id');
            setActiveScreen('login');
          }
        }
      } catch (err) {
        console.error('Error in onAuthStateChange callback:', err);
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
  const [allProfiles, setAllProfiles] = useState<User[]>([]);

  const fetchProfiles = async () => {
    try {
      // Try to fetch relations from Supabase's separate linking table
      let relationsMap: Record<string, string> = {};
      try {
        const { data: relationsData, error: relationsError } = await supabase
          .from('backoffice_seller_relations')
          .select('seller_email, backoffice_email');
        if (!relationsError && relationsData) {
          relationsData.forEach((rel: any) => {
            if (rel.seller_email && rel.backoffice_email) {
              relationsMap[rel.seller_email.toLowerCase().trim()] = rel.backoffice_email.toLowerCase().trim();
            }
          });
        } else {
          console.warn('Relations table check failed (might not be created yet):', relationsError);
        }
      } catch (relErr) {
        console.warn('Relations table check failed (might not be created yet):', relErr);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching profiles from Supabase:', error);
      }

      // Local fallback for backoffice_email relations from localStorage
      const localRelations = JSON.parse(localStorage.getItem('reliant_backoffice_seller_relations') || '{}');

      const mappedProfiles: User[] = (data || [])
        .filter((p: any) => p && typeof p.email === 'string')
        .map((p: any) => {
          let mappedRole = p.role;
          const emailLower = p.email?.toLowerCase().trim() || '';
          const nameLower = (p.name || '').toLowerCase().trim();
          
          if (!mappedRole) {
            const isGestor = emailLower.includes('gestor') || 
                             emailLower.includes('gerente') || 
                             nameLower.includes('gestor') || 
                             nameLower.includes('gerente');

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

            if (isGestor) {
              mappedRole = 'Gestor de Backoffice';
            } else if (isAdm) {
              if (emailLower.includes('selante') || nameLower.includes('selante')) {
                mappedRole = 'Customer Selantes';
              } else if (emailLower.includes('argamassa') || nameLower.includes('argamassa')) {
                mappedRole = 'Customer Argamassa';
              } else if (emailLower.includes('logistica') || emailLower.includes('logistic') || nameLower.includes('logistica') || nameLower.includes('logistic')) {
                mappedRole = 'Customer Logística';
              } else {
                mappedRole = 'ADM';
              }
            } else {
              mappedRole = 'Customer';
            }
          }

          const emailKey = p.email?.toLowerCase().trim() || '';
          const defaultName = p.email ? p.email.split('@')[0] : 'Usuário';
          return {
            email: p.email,
            name: p.name || defaultName,
            role: mappedRole,
            avatarUrl: p.avatarUrl || DEFAULT_USER.avatarUrl,
            backoffice_email: relationsMap[emailKey] || p.backoffice_email || localRelations[emailKey] || undefined
          };
        });

      setAllProfiles(mappedProfiles);
    } catch (err) {
      console.error('Error in fetchProfiles:', err);
    }
  };

  const linkSellerToBackoffice = async (sellerEmail: string, backofficeEmail: string | null) => {
    const sEmail = sellerEmail.toLowerCase().trim();
    const bEmail = backofficeEmail ? backofficeEmail.toLowerCase().trim() : null;

    try {
      // 1. Try to save to the separate linking table
      if (bEmail) {
        const { error: relError } = await supabase
          .from('backoffice_seller_relations')
          .upsert({ seller_email: sEmail, backoffice_email: bEmail }, { onConflict: 'seller_email' });
        if (relError) {
          console.warn('Relations table update failed:', relError);
        }
      } else {
        const { error: relError } = await supabase
          .from('backoffice_seller_relations')
          .delete()
          .eq('seller_email', sEmail);
        if (relError) {
          console.warn('Relations table delete failed:', relError);
        }
      }

      // 2. Also save to profiles table for backwards-compatibility fallback
      const { error } = await supabase
        .from('profiles')
        .update({ backoffice_email: bEmail })
        .eq('email', sEmail);

      if (error) {
        console.warn('Database error while updating profile column:', error);
      }
    } catch (dbErr) {
      console.warn('Database error while linking seller:', dbErr);
    }

    const localRelations = JSON.parse(localStorage.getItem('reliant_backoffice_seller_relations') || '{}');
    if (bEmail) {
      localRelations[sEmail] = bEmail;
    } else {
      delete localRelations[sEmail];
    }
    localStorage.setItem('reliant_backoffice_seller_relations', JSON.stringify(localRelations));

    await fetchProfiles();
  };

  const updateUserRole = async (email: string, role: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: role })
        .eq('email', email.toLowerCase().trim());
        
      if (error) throw error;
      
      // Update local profiles list state
      setAllProfiles(prev => prev.map(p => 
        p.email.toLowerCase().trim() === email.toLowerCase().trim() 
          ? { ...p, role: role } 
          : p
      ));
      
      return { error: null };
    } catch (err: any) {
      console.error('Error updating user role:', err);
      return { error: getErrorMessage(err) };
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchProfiles();
    }
  }, [currentUser]);

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
          const ticketsList = (data as Ticket[]).map(t => ({
            ...t,
            history: Array.isArray(t.history) ? t.history : [],
            attachments: Array.isArray(t.attachments) ? t.attachments : []
          }));
          ticketsList.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
          setTickets(ticketsList);
          saveTickets(ticketsList);
        }
      } catch (err) {
        console.error("Error fetching tickets from Supabase. Falling back to Local Storage. Please ensure you have executed /supabase_setup.sql in your Supabase dashboard.", err);
        if (active) {
          // Fallback to local storage if Supabase fails
          const loaded = loadTickets().map(t => ({
            ...t,
            history: Array.isArray(t.history) ? t.history : [],
            attachments: Array.isArray(t.attachments) ? t.attachments : []
          }));
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
          const notifsList = (data as AppNotification[]).map(n => ({
            ...n,
            read: !!n.read
          }));
          notifsList.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
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
      // Try real Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });
      if (error) {
        throw error;
      }
      
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

      // Automatically set the session user and transition screen
      const session = data.session;
      if (session?.user) {
        const userEmail = session.user.email || '';
        const nameVal = session.user.user_metadata?.name || session.user.user_metadata?.full_name || userEmail.split('@')[0];
        const emailLower = userEmail.toLowerCase().trim();
        const nameLower = nameVal.toLowerCase().trim();

        let role = 'Customer';
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('email', emailLower)
            .maybeSingle();

          if (profile?.role) {
            role = profile.role;
          } else {
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

            const isGestor = emailLower.includes('gestor') || 
                             emailLower.includes('gerente') || 
                             nameLower.includes('gestor') || 
                             nameLower.includes('gerente') ||
                             session.user.user_metadata?.role === 'Gestor de Backoffice';

            if (isGestor) {
              role = 'Gestor de Backoffice';
            } else if (isAdm) {
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
              role = session.user.user_metadata?.role || 'Agente';
            }
          }
        } catch (dbErr) {
          console.warn('Error reading profile during login:', dbErr);
        }

        const appUser: User = {
          email: userEmail,
          name: nameVal,
          role: role,
          avatarUrl: session.user.user_metadata?.avatar_url || DEFAULT_USER.avatarUrl
        };
        setCurrentUser(appUser);
        localStorage.setItem('reliant_user', JSON.stringify(appUser));
        setActiveScreen('dashboard');
      }

      return { error: null };
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
      const errMsg = getErrorMessage(err);
      return { error: errMsg };
    }
  };

  const signUpWithSupabase = async (email: string, password: string, name: string) => {
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

      const isGestor = emailLower.includes('gestor') || 
                       emailLower.includes('gerente');

      let role = 'Customer';
      if (isGestor) {
        role = 'Gestor de Backoffice';
      } else if (isAdm) {
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
        email,
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

      // If no session was returned, attempt to sign in immediately using the credentials.
      let session = data.session;
      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) {
          if (signInError.message && signInError.message.toLowerCase().includes('confirm')) {
            return { error: 'Conta criada! Confirme seu e-mail para acessar o sistema.' };
          }
          throw signInError;
        }
        session = signInData.session;
      }

      // If we have a session, update activeScreen and currentUser
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('email', emailLower)
          .maybeSingle();

        const userRole = profile?.role || role;

        const appUser: User = {
          email: emailLower,
          name: name,
          role: userRole,
          avatarUrl: DEFAULT_USER.avatarUrl
        };
        setCurrentUser(appUser);
        localStorage.setItem('reliant_user', JSON.stringify(appUser));
        setActiveScreen('dashboard');
      }

      return { error: null };
    } catch (err: any) {
      console.error('Supabase Sign Up Error:', err);
      const errMsg = getErrorMessage(err);
      return { error: errMsg };
    }
  };

  const resetPasswordWithSupabase = async (email: string, password?: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      
      if (password) {
        // Option A: Real Supabase Password Update
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        });
        
        if (updateError) {
          throw updateError;
        }
        
        try {
          await supabase
            .from('profiles')
            .update({ updatedAt: new Date().toISOString() })
            .eq('email', cleanEmail);
        } catch (dbErr) {
          console.warn('Could not update profile updated_at timestamp:', dbErr);
        }
      } else {
        // Option B: Request Recovery Link
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin
        });
        
        if (resetError) {
          throw resetError;
        }
      }

      return { error: null };
    } catch (err: any) {
      console.error('Reset Password Error:', err);
      const errMsg = getErrorMessage(err);
      return { error: errMsg };
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

    // Resolve automatic assignment to linked Backoffice profile of the Seller
    const myProfile = allProfiles.find(p => p.email.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim());
    const linkedBackofficeEmail = myProfile?.backoffice_email;
    const linkedBackoffice = linkedBackofficeEmail 
      ? allProfiles.find(p => p.email.toLowerCase().trim() === linkedBackofficeEmail.toLowerCase().trim())
      : null;

    const assigneeNameVal = linkedBackoffice 
      ? linkedBackoffice.name 
      : (isAdmUser ? 'ADM' : (currentUser ? currentUser.name : 'Agente Autônomo'));

    const assigneeInitialsVal = linkedBackoffice
      ? linkedBackoffice.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : (isAdmUser ? 'AD' : (currentUser ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AG'));

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
      assigneeInitials: assigneeInitialsVal,
      assigneeName: assigneeNameVal,
      attachments: ticketData.attachments || [],
      history: [
        {
          id: `hist-${Date.now()}`,
          title: 'Chamado Criado',
          description: `Criado por ${currentUser ? currentUser.name : 'Sistema'}${linkedBackoffice ? ` e distribuído automaticamente ao Backoffice ${linkedBackoffice.name}` : ''}`,
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
        ? (isAdmUser ? 'AD' : (currentUser.name || '').split(' ').map(n => n && n[0] ? n[0] : '').join('').toUpperCase().slice(0, 2))
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
        clearAllNotifications,
        allProfiles,
        fetchProfiles,
        linkSellerToBackoffice,
        updateUserRole
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
