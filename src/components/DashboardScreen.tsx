import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  MoreVertical, 
  LogOut, 
  Plus, 
  Inbox, 
  RefreshCw, 
  CheckCircle2, 
  Activity, 
  ChevronRight, 
  Calendar, 
  User, 
  ArrowLeft,
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Globe,
  Clock,
  UserCheck,
  UserX,
  Link2,
  Users,
  Check,
  Building
} from 'lucide-react';
import { MAP_IMAGE_URL } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, TicketStatus } from '../types';

export const DashboardScreen: React.FC = () => {
  const { 
    currentUser, 
    tickets, 
    setScreen, 
    selectTicket, 
    dashboardFilter, 
    setDashboardFilter, 
    logout,
    resetAllData,
    clearAllTickets,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    statusFilter,
    setStatusFilter,
    regionFilter,
    setRegionFilter,
    allProfiles,
    linkSellerToBackoffice,
    unlinkSellerFromBackoffice,
    updateUserRole
  } = useApp();

  const [filterMySellers, setFilterMySellers] = useState<boolean>(() => {
    return localStorage.getItem('reliant_filter_my_sellers') !== 'false';
  });

  const handleToggleFilterMySellers = (val: boolean) => {
    setFilterMySellers(val);
    localStorage.setItem('reliant_filter_my_sellers', String(val));
  };

  const [searchOpen, setSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSellersPanel, setShowSellersPanel] = useState(false);
  const [showRolesPanel, setShowRolesPanel] = useState(false);
  const [sellerToLink, setSellerToLink] = useState('');
  const [linkingLoading, setLinkingLoading] = useState(false);

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

  const isGestor = currentUser?.role === 'Gestor de Backoffice' ||
                   emailLower.includes('gestor') ||
                   emailLower.includes('gerente') ||
                   nameLower.includes('gestor') ||
                   nameLower.includes('gerente');

  const isBackoffice = isAdm && !isGestor;

  // Local state for the Gestor panel linkage dropdowns: { [sellerEmail]: backofficeEmail }
  const [gestorSelections, setGestorSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    if (localStorage.getItem('open_status_modal') === 'true') {
      setShowStatusModal(true);
      localStorage.removeItem('open_status_modal');
    }
  }, []);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f9fb] p-4 text-center">
        <div className="w-10 h-10 border-4 border-[#00236f] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-gray-500">Carregando dados da sessão...</p>
      </div>
    );
  }

  // Only show notifications for the logged in user
  const userNotifications = notifications.filter(notif => {
    // If current user is the one who generated this alert/notification, do not show it to them!
    if (notif.senderEmail && notif.senderEmail === currentUser?.email) {
      return false;
    }

    // If targetUserEmail is defined, show only for this user
    if (notif.targetUserEmail) {
      return notif.targetUserEmail === currentUser?.email;
    }
    
    // Otherwise, check notifyRole if defined
    if (notif.notifyRole) {
      const ticket = tickets.find(t => t.id === notif.ticketId);
      if (notif.notifyRole === 'assignee') {
        return ticket?.assigneeName === currentUser?.name;
      }
      if (notif.notifyRole === 'admin') {
        return currentUser?.role === 'Admin' || isAdm || isGestor;
      }
      if (notif.notifyRole === 'both') {
        return ticket?.assigneeName === currentUser?.name || currentUser?.role === 'Admin' || isAdm || isGestor;
      }
    }
    
    // If neither is specified but user is admin, show as fallback
    if (isAdm || isGestor) return true;
    
    return false;
  });

  // Find sellers linked to the current logged-in Backoffice user
  const linkedSellers = allProfiles
    .filter(p => {
      if (!p || !p.email) return false;
      const emails = p.backoffice_emails || (p.backoffice_email ? [p.backoffice_email] : []);
      return emails.some(e => e.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim());
    })
    .map(p => p.email.toLowerCase().trim())
    .filter(Boolean);

  // Role-based visibility: Common users see only their own, backoffice sees linked or all based on filter
  const visibleTickets = tickets.filter(t => {
    if (isGestor) {
      return true; // Gestor de Backoffice has full administrative visibility
    }
    if (isBackoffice) {
      if (filterMySellers && linkedSellers.length > 0) {
        const creator = t.createdBy?.toLowerCase().trim() || '';
        const contact = t.contactEmail?.toLowerCase().trim() || '';
        return linkedSellers.includes(creator) || 
               linkedSellers.includes(contact) || 
               creator === currentUser?.email?.toLowerCase().trim() ||
               contact === currentUser?.email?.toLowerCase().trim();
      }
      return true;
    }
    return t.createdBy === currentUser?.email || t.contactEmail === currentUser?.email;
  });

  const handleSearchSubmit = () => {
    const q = localSearch.trim().toLowerCase();
    if (!q) return;

    // Find ticket in visibleTickets (respecting user permissions)
    // 1. First look for an exact case-insensitive match on the full ticket ID (e.g. APP0004/2026)
    let foundTicket = visibleTickets.find(t => t.id.toLowerCase() === q);

    if (!foundTicket) {
      // 2. Look for case-insensitive match by stripping all non-alphanumeric characters
      const cleanQ = q.replace(/[^a-z0-9]/g, '');
      if (cleanQ) {
        foundTicket = visibleTickets.find(t => {
          const cleanId = t.id.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanId.includes(cleanQ) || cleanQ.includes(cleanId);
        });
      }
    }

    if (foundTicket) {
      selectTicket(foundTicket.id);
      setScreen('ticket-details');
      setSearchOpen(false);
      setLocalSearch('');
    }
  };

  const getTicketRegion = (ticket: Ticket): 'AMER' | 'EMEA' | 'APAC' => {
    if (ticket.state) {
      const stateUpper = ticket.state.toUpperCase();
      // AMER maps to South and Southeast (Sul / Sudeste)
      if (['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'].includes(stateUpper)) {
        return 'AMER';
      }
      // EMEA maps to Center-West (Centro-Oeste)
      if (['DF', 'GO', 'MT', 'MS'].includes(stateUpper)) {
        return 'EMEA';
      }
      // APAC maps to North and Northeast (Norte / Nordeste)
      return 'APAC';
    }

    const titleLower = ticket.title.toLowerCase();
    const descLower = (ticket.description || '').toLowerCase();
    const clientLower = ticket.clientName.toLowerCase();

    if (titleLower.includes('apac') || descLower.includes('apac') || descLower.includes('singapura') || descLower.includes('tóquio') || ticket.id === 'TK-8842') {
      return 'APAC';
    }
    if (clientLower.includes('fintech') || titleLower.includes('fintech') || ticket.id === 'TKT-8919') {
      return 'EMEA';
    }
    return 'AMER'; // Default/Americas region
  };

  const getRegionTicketCount = (region: 'AMER' | 'EMEA' | 'APAC') => {
    return visibleTickets.filter(t => getTicketRegion(t) === region).length;
  };

  // Dynamic calculations based on live ticket state (filtered by user role visibility)
  const openCount = visibleTickets.filter(t => t.status === 'Aberto').length;
  const inProgressCount = visibleTickets.filter(t => t.status === 'Em Progresso' || t.status === 'Em Espera' || t.status === 'Impedido' || t.status === 'Retorno Solicitado').length;
  const resolvedCount = visibleTickets.filter(t => t.status === 'Resolvido').length;

  const calculateResolutionStats = () => {
    const resolvedWithDates = visibleTickets.filter(t => t.status === 'Resolvido' && t.createdAtIso && t.resolvedAtIso);
    
    let avgString = 'Sem chamados resolvidos';
    let avgMs = 0;
    
    if (resolvedWithDates.length > 0) {
      const totalMs = resolvedWithDates.reduce((sum, t) => {
        const diff = new Date(t.resolvedAtIso!).getTime() - new Date(t.createdAtIso!).getTime();
        return sum + Math.max(0, diff);
      }, 0);
      avgMs = totalMs / resolvedWithDates.length;
      
      const mins = Math.round(avgMs / 60000);
      if (mins < 60) {
        avgString = `${mins} minuto${mins !== 1 ? 's' : ''}`;
      } else {
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        if (hours < 24) {
          avgString = `${hours} hora${hours !== 1 ? 's' : ''}${remainingMins > 0 ? ` e ${remainingMins} min` : ''}`;
        } else {
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          avgString = `${days} dia${days !== 1 ? 's' : ''}${remainingHours > 0 ? ` e ${remainingHours} h` : ''}`;
        }
      }
    } else {
      // Friendly fallback based on seeded tickets or default mock
      avgString = '14 horas e 15 minutos';
    }
    
    const pctResolved = visibleTickets.length > 0 
      ? Math.round((resolvedCount / visibleTickets.length) * 100) 
      : 0;
      
    return {
      pctResolved,
      avgString,
      resolvedCount,
      totalCount: visibleTickets.length
    };
  };

  // Recent status activities across role-visible tickets
  const recentActivities = visibleTickets
    .flatMap(t => (t.history || []).map(h => ({ ...h, ticketId: t.id, ticketTitle: t.title })))
    .sort((a, b) => (b.id || '').localeCompare(a.id || ''))
    .slice(0, 5);

  // Filtered tickets list based on selected segment tab
  const filteredTickets = visibleTickets.filter(t => {
    // Search query check
    if (localSearch) {
      const q = localSearch.toLowerCase();
      const cleanQ = q.replace(/[^a-z0-9]/g, '');
      const matchesSearch = t.title.toLowerCase().includes(q) || 
                            t.id.toLowerCase().includes(q) || 
                            (cleanQ && t.id.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanQ)) ||
                            t.clientName.toLowerCase().includes(q) ||
                            (t.description && t.description.toLowerCase().includes(q)) ||
                            (t.city && t.city.toLowerCase().includes(q)) ||
                            (t.state && t.state.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    // Status filter check
    if (statusFilter) {
      if (statusFilter === 'Em Progresso') {
        if (t.status !== 'Em Progresso' && t.status !== 'Em Espera' && t.status !== 'Impedido' && t.status !== 'Retorno Solicitado') {
          return false;
        }
      } else if (t.status !== statusFilter) {
        return false;
      }
    }

    // Region filter check
    if (regionFilter && getTicketRegion(t) !== regionFilter) {
      return false;
    }

    // Segment tab filter check
    if (dashboardFilter === 'Atribuídos') {
      return t.assigneeName === currentUser?.name || t.assigneeInitials === 'JD';
    }
    if (dashboardFilter === 'Escalados') {
      return t.priority === 'Crítico' || t.priority === 'P1 - Crítica';
    }
    return true; // 'Todos'
  });

  const handleCardClick = (ticketId: string) => {
    selectTicket(ticketId);
    setScreen('ticket-details');
  };

  // Helper to resolve status colors for vertical left bars
  const getStatusBorderColor = (priority: string, status: string) => {
    if (status === 'Resolvido') return 'bg-secondary';
    if (status === 'Retorno Solicitado') return 'bg-indigo-500';
    if (priority === 'Crítico' || priority === 'P1 - Crítica') return 'bg-error';
    if (status === 'Em Espera') return 'bg-outline';
    return 'bg-blue-600';
  };

  // Helper to render priority/status badge classes
  const getBadgeStyles = (priority: string, status: string) => {
    if (status === 'Resolvido') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (status === 'Retorno Solicitado') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
    if (priority === 'Crítico' || priority === 'P1 - Crítica') {
      return 'bg-red-50 text-red-700 border-red-100';
    }
    if (status === 'Em Espera') {
      return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    return 'bg-blue-50 text-blue-700 border-blue-100';
  };

  const getStatusLabel = (priority: string, status: string) => {
    if (status === 'Resolvido') return 'Resolvido';
    if (status === 'Retorno Solicitado') return 'Retorno Solic.';
    if (priority === 'Crítico' || priority === 'P1 - Crítica') return 'Crítico';
    if (status === 'Em Espera') return 'Pendente';
    return 'No Prazo';
  };

  return (
    <div className="bg-[#f7f9fb] min-h-screen text-[#191c1e] font-sans pb-24 relative">
      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#f7f9fb] border-b border-gray-200 h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {searchOpen ? (
            <div className="relative flex items-center w-48 sm:w-64">
              <input
                id="search-input"
                type="text"
                autoFocus
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
                placeholder="Nº da ocorrência (Ex: APP0001)..."
                className="w-full h-8 pl-8 pr-6 bg-gray-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#00236f]"
              />
              <button 
                onClick={handleSearchSubmit}
                className="absolute left-2.5 hover:scale-110 active:scale-95 transition-transform"
                title="Buscar ocorrência"
              >
                <Search className="w-3.5 h-3.5 text-[#00236f] font-bold" />
              </button>
              {localSearch && (
                <button onClick={() => setLocalSearch('')} className="absolute right-2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <h1 className="font-bold text-lg text-[#00236f] tracking-tight truncate max-w-[200px] sm:max-w-none">
              Gerenciamento de Chamados
            </h1>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              if (searchOpen && localSearch.trim()) {
                handleSearchSubmit();
              } else if (searchOpen) {
                setSearchOpen(false);  // Close if already open but empty
              } else {
                setSearchOpen(true);   // Open search bar
              }
            }} 
            className="hover:bg-gray-100 p-2 rounded-full text-[#00236f] hover:text-blue-900 transition-colors"
            title="Buscar Ocorrência"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Functional Notification Dropdown */}
          <div className="relative">
            <button 
              id="bell-icon"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowOptions(false);
              }}
              className="relative hover:bg-gray-100 p-2 rounded-full text-[#00236f] active:opacity-80 transition-opacity"
              title="Notificações de Alerta"
            >
              <Bell className="w-5 h-5" />
              {userNotifications.some(n => !n.read) && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-600 rounded-full border border-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
                  <span className="text-xs font-black text-gray-800">Alertas de Suporte</span>
                  {userNotifications.some(n => !n.read) && (
                    <button 
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Marcar todas lidas
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {userNotifications.length > 0 ? (
                    userNotifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          setShowNotifications(false);
                          handleCardClick(n.ticketId);
                        }}
                        className={`p-3 text-left transition-colors cursor-pointer hover:bg-blue-50/20 flex gap-2.5 items-start ${!n.read ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className="flex-1 space-y-0.5">
                          <div className="flex justify-between items-center gap-1.5">
                            <span className="text-[11px] font-extrabold text-gray-900 leading-tight">{n.title}</span>
                            <span className="text-[9px] text-gray-400 font-medium shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-normal line-clamp-2">{n.description}</p>
                        </div>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 shrink-0" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-400 font-medium">
                      Nenhum alerta pendente.
                    </div>
                  )}
                </div>

                <div className="px-4 pt-2 border-t border-gray-100 flex justify-between items-center">
                  <button 
                    onClick={clearAllNotifications}
                    className="text-[10px] font-bold text-red-600 hover:underline"
                  >
                    Limpar todas
                  </button>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] font-extrabold text-gray-500 hover:text-gray-800"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              id="menu-options"
              onClick={() => {
                setShowOptions(!showOptions);
                setShowNotifications(false);
              }}
              className="hover:bg-gray-100 p-2 rounded-full text-[#00236f] active:opacity-80 transition-opacity"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-800">{currentUser?.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">{currentUser?.email}</p>
                </div>
                <button 
                  onClick={() => {
                    if (confirm('Deseja redefinir os dados para os valores originais?')) {
                      resetAllData();
                      setShowOptions(false);
                      alert('Dados redefinidos!');
                    }
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Resetar Dados Padrão
                </button>
                <button 
                  onClick={async () => {
                    if (confirm('Atenção: Isso irá apagar COMPLETAMENTE todos os chamados e notificações do banco de dados (ficando com 0 chamados) para você simular novos. Deseja prosseguir?')) {
                      await clearAllTickets();
                      setShowOptions(false);
                      alert('Todos os chamados foram removidos com sucesso! Você pode iniciar novas simulações agora.');
                    }
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-amber-600 hover:bg-amber-50 font-medium flex items-center gap-1.5"
                >
                  <span>🗑️</span> Zerar Todos os Chamados
                </button>
                <button 
                  onClick={logout}
                  className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair do Aplicativo
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-18 px-4 pb-6 max-w-3xl mx-auto space-y-6">
        
        {/* Hero Welcome Section */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-[18px] p-5 border border-blue-100/30">
          <h2 className="text-xl font-bold text-[#00236f] tracking-tight">
            Bem-vindo de volta, {currentUser?.name || 'Agente'}
          </h2>
          <p className="text-xs text-gray-600 font-medium mt-1">
            Analisando {visibleTickets.length} chamados no total. {visibleTickets.filter(t => t.priority === 'Crítico' || t.priority === 'P1 - Crítica').length} casos ativos de alta prioridade.
          </p>
        </section>

        {/* Backoffice - Vendedor Relationship Panel */}
        {(() => {
          const allSellers = allProfiles.filter(p => {
            const pEmail = p.email?.toLowerCase().trim() || '';
            const pName = p.name?.toLowerCase().trim() || '';
            const pRole = p.role || '';
            
            const isProfileGestor = pRole === 'Gestor de Backoffice' ||
                                    pEmail.includes('gestor') ||
                                    pEmail.includes('gerente') ||
                                    pName.includes('gestor') ||
                                    pName.includes('gerente');

            const isProfileBackoffice = pEmail === 'adm@empresa.com' || 
                                        pEmail.startsWith('adm@') || 
                                        pEmail.includes('selante') || 
                                        pEmail.includes('argamassa') || 
                                        pEmail.includes('logistica') || 
                                        pEmail.includes('logistic') ||
                                        pName.includes('selante') ||
                                        pName.includes('argamassa') ||
                                        pName.includes('logistica') ||
                                        pName.includes('logistic') ||
                                        pName.includes('adm') ||
                                        ['ADM', 'Customer Selantes', 'Customer Argamassa', 'Customer Logística'].includes(pRole);
            return !isProfileGestor && !isProfileBackoffice;
          });

          const allBackoffices = allProfiles.filter(p => {
            const pEmail = p.email?.toLowerCase().trim() || '';
            const pName = p.name?.toLowerCase().trim() || '';
            const pRole = p.role || '';
            
            const isProfileGestor = pRole === 'Gestor de Backoffice' ||
                                    pEmail.includes('gestor') ||
                                    pEmail.includes('gerente') ||
                                    pName.includes('gestor') ||
                                    pName.includes('gerente');

            const isProfileBackoffice = pEmail === 'adm@empresa.com' || 
                                        pEmail.startsWith('adm@') || 
                                        pEmail.includes('selante') || 
                                        pEmail.includes('argamassa') || 
                                        pEmail.includes('logistica') || 
                                        pEmail.includes('logistic') ||
                                        pName.includes('selante') ||
                                        pName.includes('argamassa') ||
                                        pName.includes('logistica') ||
                                        pName.includes('logistic') ||
                                        pName.includes('adm') ||
                                        ['ADM', 'Customer Selantes', 'Customer Argamassa', 'Customer Logística'].includes(pRole);
            return isProfileBackoffice && !isProfileGestor;
          });

          const myLinkedSellersList = allSellers.filter(s => s.backoffice_email?.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim());

          if (isGestor) {
            return (
              <div className="bg-white border border-gray-150 rounded-[18px] p-4 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#00236f]">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#00236f] flex items-center gap-1.5">
                        Gestão de Vínculos de Atendimento
                        <span className="text-[10px] font-black bg-blue-100 text-[#00236f] px-2 py-0.5 rounded-full">
                          {allSellers.length} Vendedores
                        </span>
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Gestor de Backoffice • Painel de Controle
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSellersPanel(!showSellersPanel)}
                    className="text-xs font-bold text-white bg-[#00236f] hover:bg-[#001c56] px-3 py-1.5 rounded-lg transition-all active:scale-95"
                  >
                    {showSellersPanel ? 'Fechar Painel' : 'Gerenciar Vínculos'}
                  </button>
                </div>

                {showSellersPanel && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Como <strong>Gestor de Backoffice</strong>, você é o responsável por vincular os vendedores e clientes aos respectivos analistas de Backoffice. Selecione o profissional para cada vendedor abaixo e salve.
                    </p>

                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {allSellers.length === 0 ? (
                        <p className="text-xs text-gray-500 bg-gray-50 p-4 rounded-xl text-center font-medium italic">
                          Nenhum vendedor cadastrado no sistema ainda.
                        </p>
                      ) : (
                        allSellers.map(seller => {
                          const linkedEmails = seller.backoffice_emails || (seller.backoffice_email ? [seller.backoffice_email] : []);

                          return (
                            <div 
                              key={seller.email} 
                              className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 gap-3 hover:bg-gray-100/50 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-gray-800 truncate">{seller.name}</span>
                                  {linkedEmails.length > 0 ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                                      Vinculado ({linkedEmails.length})
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                                      Sem Vínculo
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-400 truncate">{seller.email}</p>
                                
                                {/* List of currently linked backoffice agents */}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {linkedEmails.map(email => {
                                    const bo = allBackoffices.find(b => b.email.toLowerCase().trim() === email.toLowerCase().trim());
                                    return (
                                      <span 
                                        key={email} 
                                        className="inline-flex items-center gap-1 text-[9px] font-bold bg-[#00236f]/5 text-[#00236f] px-2 py-0.5 rounded-full border border-[#00236f]/10"
                                      >
                                        <span>{bo?.name || email.split('@')[0]}</span>
                                        <button 
                                          onClick={async () => {
                                            if (confirm(`Remover vínculo do analista ${bo?.name || email} com o vendedor ${seller.name}?`)) {
                                              setLinkingLoading(true);
                                              await unlinkSellerFromBackoffice(seller.email, email);
                                              setLinkingLoading(false);
                                            }
                                          }}
                                          disabled={linkingLoading}
                                          className="text-red-500 hover:text-red-700 transition-colors font-black text-xs ml-0.5 cursor-pointer leading-none"
                                          title="Remover analista"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <select 
                                  value=""
                                  onChange={async (e) => {
                                    const nextBackoffice = e.target.value;
                                    if (nextBackoffice) {
                                      setLinkingLoading(true);
                                      await linkSellerToBackoffice(seller.email, nextBackoffice);
                                      setLinkingLoading(false);
                                    }
                                  }}
                                  disabled={linkingLoading}
                                  className="bg-white border border-gray-200 rounded-lg text-xs p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none min-w-[200px]"
                                >
                                  <option value="">+ Vincular Analista...</option>
                                  {allBackoffices
                                    .filter(b => !linkedEmails.some(e => e.toLowerCase().trim() === b.email.toLowerCase().trim()))
                                    .map(b => (
                                      <option key={b.email} value={b.email}>
                                        {b.name} ({b.email})
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          }

          if (isBackoffice) {
            return (
              <div className="space-y-4">
                <div className="bg-white border border-gray-150 rounded-[18px] p-4 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#00236f]">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#00236f] flex items-center gap-1.5">
                          Seus Vendedores Vinculados
                          <span className="text-[10px] font-black bg-blue-100 text-[#00236f] px-2 py-0.5 rounded-full">
                            {myLinkedSellersList.length}
                          </span>
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Designados pelo Gestor • {currentUser?.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <span className="text-[11px] font-bold text-gray-500">Apenas meus vendedores:</span>
                        <input 
                          type="checkbox" 
                          checked={filterMySellers} 
                          onChange={(e) => handleToggleFilterMySellers(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                      
                      <button 
                        onClick={() => setShowSellersPanel(!showSellersPanel)}
                        className="text-xs font-bold text-[#00236f] hover:text-[#001c56] bg-blue-50/70 px-2.5 py-1 rounded-lg hover:bg-blue-100/50 transition-all active:scale-95"
                      >
                        {showSellersPanel ? 'Fechar' : 'Ver Vendedores'}
                      </button>
                    </div>
                  </div>

                  {showSellersPanel && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2 border-t border-gray-100 space-y-3"
                    >
                      <div>
                        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Vendedores sob seus cuidados:</p>
                        {myLinkedSellersList.length === 0 ? (
                          <p className="text-xs text-gray-500 bg-gray-50/50 p-2.5 rounded-xl text-center font-medium italic">
                            Nenhum vendedor vinculado a você pelo Gestor de Backoffice ainda.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {myLinkedSellersList.map(s => (
                              <div key={s.email} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-gray-800 truncate">{s.name}</p>
                                  <p className="text-[10px] text-gray-400 truncate">{s.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Gestão de Perfis e Papéis (Apenas ADM) */}
                <div className="bg-white border border-gray-150 rounded-[18px] p-4 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#00236f] flex items-center gap-1.5">
                          Gestão de Perfis e Papéis
                          <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                            {allProfiles.length} Usuários
                          </span>
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Administração de Acessos
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowRolesPanel(!showRolesPanel)}
                      className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-all active:scale-95"
                    >
                      {showRolesPanel ? 'Fechar Painel' : 'Gerenciar Papéis'}
                    </button>
                  </div>

                  {showRolesPanel && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3"
                    >
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        Como <strong>ADM</strong>, você possui permissão para alterar o papel de qualquer usuário no sistema. As alterações surtirão efeito imediatamente no banco de dados.
                      </p>

                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {allProfiles.filter(p => p.email !== currentUser?.email).map(profile => {
                          const currentRole = profile.role || 'Customer';
                          return (
                            <div 
                              key={profile.email} 
                              className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 gap-3 hover:bg-gray-100/50 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-gray-800 truncate block">{profile.name}</span>
                                <span className="text-[10px] text-gray-400 truncate block">{profile.email}</span>
                                <span className="inline-flex items-center gap-1 text-[9px] font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full mt-1">
                                  Papel Atual: {currentRole}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <select 
                                  value={currentRole}
                                  onChange={async (e) => {
                                    const nextRole = e.target.value;
                                    if (confirm(`Deseja alterar o papel de ${profile.name} para "${nextRole}"?`)) {
                                      const res = await updateUserRole(profile.email, nextRole);
                                      if (res?.error) {
                                        alert(`Erro ao atualizar papel: ${res.error}`);
                                      } else {
                                        alert(`Papel de ${profile.name} atualizado com sucesso!`);
                                      }
                                    }
                                  }}
                                  className="bg-white border border-gray-200 rounded-lg text-xs p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none min-w-[180px] max-w-[240px]"
                                >
                                  <option value="Customer">Customer (Vendedor)</option>
                                  <option value="Backoffice">Backoffice (Analista Geral)</option>
                                  <option value="Customer Selantes">Customer Selantes (Analista)</option>
                                  <option value="Customer Argamassa">Customer Argamassa (Analista)</option>
                                  <option value="Customer Logística">Customer Logística (Analista)</option>
                                  <option value="ADM">ADM (Administrador)</option>
                                  <option value="Gestor de Backoffice">Gestor de Backoffice</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            );
          }

          // Seller / Representante role UI
          const myBackofficeEmail = allProfiles.find(p => p.email.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim())?.backoffice_email;
          const backoffice = myBackofficeEmail ? allBackoffices.find(b => b.email.toLowerCase().trim() === myBackofficeEmail.toLowerCase().trim()) : null;

          return (
            <div className="bg-white border border-gray-150 rounded-[18px] p-4 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#00236f] flex items-center gap-1.5">
                    Seu Backoffice de Atendimento
                  </h4>
                  <p className="text-xs font-semibold text-gray-700 mt-0.5">
                    {backoffice ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Vinculado a: <strong className="font-bold text-gray-800">{backoffice.name}</strong> ({backoffice.email})
                      </span>
                    ) : (
                      <span className="text-amber-500 font-bold flex items-center gap-1">
                        ⚠️ Nenhum Backoffice designado pelo Gestor de Backoffice ainda
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                * Os seus chamados são automaticamente distribuídos e tratados pelo profissional do Backoffice atribuído a você pelo Gestor de Backoffice.
              </p>
            </div>
          );
        })()}

        {/* Summary Stats: Bento Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Card 1: Abertos */}
          <div 
            onClick={() => {
              setStatusFilter(statusFilter === 'Aberto' ? null : 'Aberto');
              setDashboardFilter('Todos');
            }}
            className={`p-4 rounded-2xl shadow-sm flex flex-col justify-between h-28 border transition-all cursor-pointer group active:scale-[0.98] ${
              statusFilter === 'Aberto' 
                ? 'bg-blue-50/70 border-[#00236f] ring-2 ring-[#00236f]/20' 
                : 'bg-white border-gray-150 hover:border-[#00236f]'
            }`}
          >
            <Inbox className={`w-5 h-5 group-hover:scale-110 transition-transform ${statusFilter === 'Aberto' ? 'text-[#00236f]' : 'text-gray-500'}`} />
            <div>
              <div className="text-2xl font-black text-[#00236f] leading-none">
                {String(openCount).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                Abertos {statusFilter === 'Aberto' && <span className="w-1.5 h-1.5 bg-[#00236f] rounded-full animate-ping"></span>}
              </div>
            </div>
          </div>

          {/* Card 2: Em Progresso */}
          <div 
            onClick={() => {
              setStatusFilter(statusFilter === 'Em Progresso' ? null : 'Em Progresso');
              setDashboardFilter('Todos');
            }}
            className={`p-4 rounded-2xl shadow-sm flex flex-col justify-between h-28 border transition-all cursor-pointer group active:scale-[0.98] ${
              statusFilter === 'Em Progresso' 
                ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20' 
                : 'bg-white border-gray-150 hover:border-blue-500'
            }`}
          >
            <RefreshCw className={`w-5 h-5 group-hover:rotate-45 transition-transform ${statusFilter === 'Em Progresso' ? 'text-blue-600' : 'text-gray-500'}`} />
            <div>
              <div className="text-2xl font-black text-blue-600 leading-none">
                {String(inProgressCount).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                Em Progresso {statusFilter === 'Em Progresso' && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>}
              </div>
            </div>
          </div>

          {/* Card 3: Resolvidos */}
          <div 
            onClick={() => {
              setStatusFilter(statusFilter === 'Resolvido' ? null : 'Resolvido');
              setDashboardFilter('Todos');
            }}
            className={`p-4 rounded-2xl shadow-sm flex flex-col justify-between h-28 col-span-2 sm:col-span-1 border transition-all cursor-pointer group active:scale-[0.98] ${
              statusFilter === 'Resolvido' 
                ? 'bg-emerald-50/70 border-[#006c49] ring-2 ring-[#006c49]/20' 
                : 'bg-white border-gray-150 hover:border-[#006c49]'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 group-hover:scale-110 transition-transform ${statusFilter === 'Resolvido' ? 'text-[#006c49]' : 'text-gray-500'}`} />
            <div>
              <div className="text-2xl font-black text-[#006c49] leading-none">
                {String(resolvedCount).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                Resolvidos {statusFilter === 'Resolvido' && <span className="w-1.5 h-1.5 bg-[#006c49] rounded-full animate-ping"></span>}
              </div>
            </div>
          </div>
        </section>

        {/* Tracking Action Banner */}
        <section>
          <div 
            id="banner-acompanhar"
            onClick={() => setShowStatusModal(true)}
            className="bg-[#1e3a8a] text-white p-4 rounded-2xl shadow-sm flex items-center justify-between hover:bg-blue-900 transition-colors cursor-pointer active:scale-[0.99] transform"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-800/60 rounded-xl">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Acompanhar Status</h3>
                <p className="text-[10px] text-blue-200 mt-0.5">Veja o progresso detalhado dos seus chamados</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-200" />
          </div>
        </section>

        {/* Segmented Control Filter Switcher */}
        <div className="space-y-1.5 text-center">
          <div className="flex p-1 bg-gray-200/70 rounded-xl max-w-md mx-auto">
            <button 
              onClick={() => {
                setDashboardFilter('Todos');
                setStatusFilter(null);
              }}
              className={`flex-1 py-2 font-bold text-xs rounded-lg transition-all text-center ${dashboardFilter === 'Todos' && !statusFilter ? 'bg-[#00236f] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Todos os Chamados
            </button>
            <button 
              onClick={() => {
                setDashboardFilter('Atribuídos');
                setStatusFilter(null);
              }}
              className={`flex-1 py-2 font-bold text-xs rounded-lg transition-all text-center ${dashboardFilter === 'Atribuídos' ? 'bg-[#00236f] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              title="Chamados atribuídos a você ou ao Agente principal"
            >
              Atribuídos a mim
            </button>
            <button 
              onClick={() => {
                setDashboardFilter('Escalados');
                setStatusFilter(null);
              }}
              className={`flex-1 py-2 font-bold text-xs rounded-lg transition-all text-center ${dashboardFilter === 'Escalados' ? 'bg-[#00236f] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              title="Chamados críticos de alta prioridade escalados"
            >
              Escalados
            </button>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            {dashboardFilter === 'Todos' && !statusFilter && "Exibindo o fluxo completo da filial regional."}
            {dashboardFilter === 'Atribuídos' && "Mostrando chamados sob sua responsabilidade técnica."}
            {dashboardFilter === 'Escalados' && "Mostrando apenas chamados de criticidade máxima."}
          </p>
        </div>

        {(statusFilter || regionFilter) && (
          <div className="flex flex-wrap gap-2 justify-center">
            {statusFilter && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-[#00236f] px-2.5 py-1 rounded-full text-xs font-bold shadow-sm"
              >
                <span>Status: {statusFilter}</span>
                <button 
                  onClick={() => setStatusFilter(null)}
                  className="hover:bg-blue-100 p-0.5 rounded-full transition-colors active:scale-95 text-blue-600"
                  title="Limpar filtro de status"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
            {regionFilter && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm"
              >
                <span>Região: {regionFilter}</span>
                <button 
                  onClick={() => setRegionFilter(null)}
                  className="hover:bg-indigo-100 p-0.5 rounded-full transition-colors active:scale-95 text-indigo-600"
                  title="Limpar filtro de região"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Recent Tickets Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-base text-gray-800 flex items-center gap-2">
                Chamados Recentes
                <span className="text-[11px] font-black bg-gray-200/60 text-gray-700 px-2 py-0.5 rounded-full">
                  {filteredTickets.length}
                </span>
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                {statusFilter || regionFilter ? (
                  <span className="text-blue-600">
                    Filtros ativos: {[
                      statusFilter ? `Status (${statusFilter})` : null,
                      regionFilter ? `Região (${regionFilter})` : null
                    ].filter(Boolean).join(' + ')}
                  </span>
                ) : `Filtro ativo: ${
                  dashboardFilter === 'Todos' ? 'Todos os Chamados' :
                  dashboardFilter === 'Atribuídos' ? 'Atribuídos a mim' : 'Escalados (Críticos)'
                }`}
              </p>
            </div>
            
            {(statusFilter || regionFilter || dashboardFilter !== 'Todos') && (
              <button 
                onClick={() => {
                  setStatusFilter(null);
                  setRegionFilter(null);
                  setDashboardFilter('Todos');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100/70 transition-all active:scale-95"
              >
                Ver Todos
              </button>
            )}
          </div>

          {/* Recents list cards */}
          <div className="space-y-3">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={ticket.id}
                  onClick={() => handleCardClick(ticket.id)}
                  className="group bg-white border border-gray-150 rounded-xl overflow-hidden flex shadow-sm hover:shadow-md transition-shadow active:scale-[0.99] duration-150 cursor-pointer"
                >
                  {/* Left priority status border bar indicator */}
                  <div className={`w-1.5 ${getStatusBorderColor(ticket.priority, ticket.status)} shrink-0`}></div>
                  
                  {/* Ticket card content body */}
                  <div className="p-4 flex-1 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-[#00236f] bg-blue-50 px-2 py-0.5 rounded-md">
                          #{ticket.id}
                        </span>
                        <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                          ticket.category === 'Logístico' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          ticket.category === 'Remanejamento' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          ticket.category === 'Comercial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {ticket.category === 'Logístico' ? '🚚 LOGÍSTICO' : ticket.category}
                        </span>
                      </div>
                      
                      {/* Priority pill badge tag */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyles(ticket.priority, ticket.status)}`}>
                        {getStatusLabel(ticket.priority, ticket.status)}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#00236f] transition-colors leading-snug line-clamp-2">
                      {ticket.title}
                    </h4>

                    {/* Client logo and account details */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                        {ticket.assigneeInitials === 'JD' ? (
                          <img 
                            referrerPolicy="no-referrer"
                            alt="Cliente" 
                            className="w-full h-full object-cover" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0pQdCI1omIqQ9RCsYlgwCsLjBX3ay7YRIdOL6m2OfR8c7BU1kh6H8VkTnv0qdSA0g_HgMVglS0rH7HhPwk78tl_jCutiRJVSuXXv1_TZvLkALkJ2gUtqXrABoP18FyQOvxOUWnHs65xXNpz2m-rCGqjpQ7U1HKiZWD_WGeWwmTRoRiNBM_8BSsaB2xwr3Ag0NkH5BklH1uCtKASQmoz5cHG0NkaN71ITG698uOuxpKw8p7ZHoxhQGYMteeln5-uEhVdUnp2q9RzQp" 
                          />
                        ) : ticket.assigneeInitials === 'AS' ? (
                          <img 
                            referrerPolicy="no-referrer"
                            alt="Cliente" 
                            className="w-full h-full object-cover" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe-PT-2g9aFdHFwsfahDDU65LcXsP3eijARbpqR5exujG0pphU9-YpErneEZjau8umMqCQC7h_UGaE8NTraAkM7X9dys4ml2uTr9U2XlZqegdWzMQqVzBXbl87i-YWJHh-OOlA5vpZ7Yu9mn6FqVZPe6kEY1g3r76idmzntj_DEaiR-mPetBGvPWN7p3TimzeKTCmnPLBV6jcWFCQQvHlJOHZmomEityndjP_w1iXOeLnmbVLqh8GUrjcmqHLvBYTlYBp8vzcTIdOV" 
                          />
                        ) : ticket.assigneeInitials === 'MK' ? (
                          <img 
                            referrerPolicy="no-referrer"
                            alt="Cliente" 
                            className="w-full h-full object-cover" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoTOc7aPGi204xH6ay4FaMnRJjGLKZHlNo5bujqSVbbeS4dTxyjQRIu9xfpZ6wTgJgkJM9-LfXJIJNkMavuH-9NjoAgikl1MzdaEEZVjxt97UnLLRf4fzQMcNKbXIOL1knNhE_qu2y0Oqu4VWVWg0dQHhaZpixvZ0f4hy7iSMA6QBRpWz2MxjXn6TiLQABtGg_kEuGJfMZ7V3V3kYEqgJdQh9q4jJwy-eKEy6dlk7OFNe0VHKfuwfM-SGkj1T81UdkAW1WXEoJD2XR" 
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 font-semibold">
                        {ticket.clientName}
                      </span>
                    </div>

                    {/* Meta row updated time and assignees */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{ticket.updatedAt}</span>
                      </div>
                      
                      <div className="w-6 h-6 rounded-full border border-white bg-[#00236f] text-[9px] flex items-center justify-center text-white font-extrabold shadow-sm">
                        {ticket.assigneeInitials}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 bg-white border border-dashed border-gray-200 rounded-2xl">
                <p className="text-sm text-gray-400 font-medium">Nenhum chamado localizado.</p>
              </div>
            )}
          </div>
        </section>

        {/* Regional Distribution map image panel container */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-base text-gray-800">
              Distribuição Regional
            </h3>
            {regionFilter && (
              <button 
                onClick={() => setRegionFilter(null)}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Limpar Região
              </button>
            )}
          </div>
          <div className="h-44 rounded-2xl overflow-hidden border border-gray-200 relative shadow-sm group bg-slate-50">
            <img 
              referrerPolicy="no-referrer"
              alt="Mapa" 
              className="w-full h-full object-cover opacity-85 transition-all duration-300" 
              src={MAP_IMAGE_URL} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00236f]/10 to-transparent"></div>
            
            {/* AMER Pin (South/Southeast) */}
            <button
              onClick={() => setRegionFilter(regionFilter === 'AMER' ? null : 'AMER')}
              className={`absolute top-[75%] left-[58%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 p-1 pr-2 bg-white rounded-full shadow-lg transition-all active:scale-90 hover:scale-105 z-20 border ${
                regionFilter === 'AMER'
                  ? 'border-blue-600 ring-4 ring-blue-500/20 bg-blue-50 text-blue-700 scale-105 font-black'
                  : 'border-gray-200 text-gray-800 font-bold'
              }`}
              title="Filtrar por Região Sul/Sudeste (AMER)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span className="text-[9px] tracking-tight">Sul/Sudeste ({getRegionTicketCount('AMER')})</span>
            </button>

            {/* EMEA Pin (Center-West) */}
            <button
              onClick={() => setRegionFilter(regionFilter === 'EMEA' ? null : 'EMEA')}
              className={`absolute top-[56%] left-[48%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 p-1 pr-2 bg-white rounded-full shadow-lg transition-all active:scale-90 hover:scale-105 z-20 border ${
                regionFilter === 'EMEA'
                  ? 'border-indigo-600 ring-4 ring-indigo-500/20 bg-indigo-50 text-indigo-700 scale-105 font-black'
                  : 'border-gray-200 text-gray-800 font-bold'
              }`}
              title="Filtrar por Região Centro-Oeste (EMEA)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              <span className="text-[9px] tracking-tight">Centro-Oeste ({getRegionTicketCount('EMEA')})</span>
            </button>

            {/* APAC Pin (North/Northeast) */}
            <button
              onClick={() => setRegionFilter(regionFilter === 'APAC' ? null : 'APAC')}
              className={`absolute top-[38%] left-[68%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 p-1 pr-2 bg-white rounded-full shadow-lg transition-all active:scale-90 hover:scale-105 z-20 border ${
                regionFilter === 'APAC'
                  ? 'border-red-600 ring-4 ring-red-500/20 bg-red-50 text-red-700 scale-105 font-black'
                  : 'border-gray-200 text-gray-800 font-bold'
              }`}
              title="Filtrar por Região Norte/Nordeste (APAC)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="text-[9px] tracking-tight">Norte/Nordeste ({getRegionTicketCount('APAC')})</span>
            </button>
          </div>

          {/* Region list legend selector cards */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { id: 'AMER', name: 'Sul / Sudeste', color: 'border-blue-150 text-blue-900 hover:bg-blue-50/40', activeColor: 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-100' },
              { id: 'EMEA', name: 'Centro-Oeste', color: 'border-indigo-150 text-indigo-900 hover:bg-indigo-50/40', activeColor: 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-100' },
              { id: 'APAC', name: 'Norte / Nordeste', color: 'border-red-150 text-red-900 hover:bg-red-50/40', activeColor: 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-100' }
            ].map(reg => {
              const count = getRegionTicketCount(reg.id as 'AMER' | 'EMEA' | 'APAC');
              const isActive = regionFilter === reg.id;
              return (
                <button
                  key={reg.id}
                  onClick={() => setRegionFilter(isActive ? null : reg.id as 'AMER' | 'EMEA' | 'APAC')}
                  className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                    isActive ? reg.activeColor : `bg-white ${reg.color}`
                  }`}
                >
                  <span className="opacity-90">{reg.name}</span>
                  <span className="text-xs font-black">{String(count).padStart(2, '0')}</span>
                </button>
              );
            })}
          </div>
        </section>

      </main>

      {/* Floating Action Button (FAB) bottom right */}
      {!isAdm && (
        <button 
          id="fab-add-ticket"
          onClick={() => setScreen('new-ticket')}
          className="fixed bottom-22 right-6 w-14 h-14 bg-[#00236f] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-900 active:scale-95 transition-all duration-200 z-50 group"
          title="Criar Novo Chamado"
        >
          <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform" />
        </button>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#f7f9fb] border-t border-gray-200 flex justify-around items-center h-16 px-4">
        {/* Painel Active button */}
        <button 
          id="nav-painel"
          onClick={() => {
            setDashboardFilter('Todos');
            setLocalSearch('');
          }}
          className="flex flex-col items-center justify-center bg-blue-50 text-[#00236f] rounded-full px-4.5 py-1 hover:bg-blue-100 transition-all duration-200"
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-extrabold mt-0.5">Painel</span>
        </button>

        {/* Novo Chamado Nav link button */}
        {!isAdm && (
          <button 
            id="nav-novo"
            onClick={() => setScreen('new-ticket')}
            className="flex flex-col items-center justify-center text-gray-500 hover:text-[#00236f] transition-all px-2 py-1 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-semibold mt-0.5">Novo Chamado</span>
          </button>
        )}

        {/* Status Nav link button */}
        <button 
          id="nav-status"
          onClick={() => setShowStatusModal(true)}
          className="flex flex-col items-center justify-center text-gray-500 hover:text-[#00236f] transition-all px-2 py-1 active:scale-95"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Status</span>
        </button>

        {/* Exit Nav link button */}
        <button 
          id="nav-sair"
          onClick={logout}
          className="flex flex-col items-center justify-center text-gray-500 hover:text-red-600 transition-all px-2 py-1 active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Sair</span>
        </button>
      </nav>

      {/* Modal Acompanhar Status */}
      <AnimatePresence>
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop click close */}
          <div className="absolute inset-0" onClick={() => setShowStatusModal(false)} />
          
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative bg-[#f7f9fb] w-full sm:max-w-md rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] flex flex-col z-10"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00236f]" />
                <h3 className="font-extrabold text-base text-[#00236f]">Acompanhar Status</h3>
              </div>
              <button 
                onClick={() => setShowStatusModal(false)} 
                className="hover:bg-gray-100 p-1.5 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar">
              {/* SLA / Meta Progress Bar */}
              <div className="bg-white border border-gray-150 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Índice de Resolução</span>
                  <span className="text-xs font-black text-[#006c49]">
                    {visibleTickets.length > 0 ? Math.round((resolvedCount / visibleTickets.length) * 100) : 0}% Concluído
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                     className="bg-[#006c49] h-full rounded-full transition-all duration-500"
                     style={{ width: `${visibleTickets.length > 0 ? (resolvedCount / visibleTickets.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">
                  {resolvedCount} de {visibleTickets.length} chamados resolvidos.
                </p>
              </div>

              {/* Tempo Médio de Solução Card */}
              {(() => {
                const stats = calculateResolutionStats();
                return (
                  <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/30 border border-blue-150 p-4.5 rounded-xl space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 text-[#00236f]">
                      <Clock className="w-4 h-4 text-[#00236f]" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                        Métricas de Eficiência
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                        <span className="text-xs font-black text-[#00236f] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
                          {stats.pctResolved}%
                        </span>{' '}
                        dos seus chamados foram resolvidos com um tempo médio de solução de:
                      </p>
                      <div className="bg-white border border-gray-100 px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-sm">
                        <span className="text-xs font-bold text-gray-500">Tempo Médio:</span>
                        <span className="text-xs font-black text-indigo-950 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                          ⏱️ {stats.avgString}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/50 border border-gray-150/40 rounded-lg p-2 text-[9px] text-gray-400 flex items-center justify-between font-bold uppercase tracking-wider">
                      <span>Total de chamados:</span>
                      <span className="text-[#00236f]">{stats.resolvedCount} resolvidos ({stats.totalCount} total)</span>
                    </div>
                  </div>
                );
              })()}

              {/* Interactive Status Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtrar por Categoria</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['Aberto', 'Em Progresso', 'Em Espera', 'Impedido', 'Resolvido', 'Retorno Solicitado'] as TicketStatus[]).map(status => {
                    const count = visibleTickets.filter(t => t.status === status).length;
                    const isActive = statusFilter === status;
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowStatusModal(false);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-18 ${
                          isActive 
                            ? 'bg-blue-50 border-blue-500 text-[#00236f] ring-2 ring-blue-500/20' 
                            : 'bg-white border-gray-150 hover:border-gray-300 text-gray-800'
                        }`}
                      >
                        <span className="text-xs font-bold">{status}</span>
                        <span className="text-lg font-black leading-none mt-1">
                          {String(count).padStart(2, '0')}
                        </span>
                      </button>
                    );
                  })}
                  
                  {/* Clean Filter card */}
                  <button
                    onClick={() => {
                      setStatusFilter(null);
                      setShowStatusModal(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-18 col-span-2 ${
                      statusFilter === null 
                        ? 'bg-blue-50 border-blue-500 text-[#00236f]' 
                        : 'bg-white border-gray-150 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className="text-xs font-bold">Ver Todos os Status</span>
                    <span className="text-[11px] text-gray-400 mt-0.5">Sem filtros ativos</span>
                  </button>
                </div>
              </div>

              {/* Feed de Atividades Recentes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Feed de Atividades</h4>
                <div className="bg-white border border-gray-150 rounded-xl divide-y divide-gray-100 overflow-hidden">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((act) => (
                      <div key={act.id} className="p-3.5 hover:bg-gray-50/50 transition-colors space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-black text-[#00236f]">{act.ticketId}</span>
                          <span className="text-[9px] text-gray-400 font-semibold">{act.timestamp}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-800 line-clamp-1">{act.ticketTitle}</p>
                        <p className="text-xs text-gray-500">{act.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-5 text-center text-xs text-gray-400">
                      Nenhuma atividade recente registrada.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-gray-200">
              <button 
                onClick={() => setShowStatusModal(false)}
                className="w-full py-2.5 bg-[#00236f] text-white rounded-xl text-xs font-bold hover:bg-blue-900 active:scale-95 transition-all shadow-md shadow-blue-950/10"
              >
                Fechar Painel de Monitoramento
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};
