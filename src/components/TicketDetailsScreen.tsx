import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Bell, 
  MoreVertical, 
  User, 
  Mail, 
  AlertTriangle, 
  Clock, 
  Paperclip, 
  FileText, 
  History, 
  Check, 
  StickyNote, 
  Plus, 
  Pause, 
  CheckCircle,
  Eye,
  Camera,
  X,
  Lock,
  Droplet,
  Layers,
  Truck,
  MessageSquare,
  Send,
  LogOut,
  Inbox,
  SlidersHorizontal,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';

export const TicketDetailsScreen: React.FC = () => {
  const { 
    tickets, 
    selectedTicketId, 
    setScreen, 
    updateTicketStatus, 
    addInternalNote, 
    addAttachment,
    emitTicketAlert,
    rateTicket,
    currentUser,
    logout
  } = useApp();

  const [newNoteText, setNewNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showPhotoSource, setShowPhotoSource] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for the rating form
  const [selectedRating, setSelectedRating] = useState<'Bom' | 'Ruim' | 'Ótimo' | null>(null);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Local state for client return submission
  const [userResponseText, setUserResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f9fb] p-4 text-center">
        <div className="w-10 h-10 border-4 border-[#00236f] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-gray-500">Carregando dados da sessão...</p>
      </div>
    );
  }

  // Find the selected ticket or default to the first one
  const ticket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

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

  if (!ticket) {
    return (
      <div className="p-8 text-center bg-gray-50 min-h-screen flex flex-col justify-center items-center">
        <p className="text-gray-500 font-medium">Nenhum chamado selecionado.</p>
        <button onClick={() => setScreen('dashboard')} className="mt-4 px-4 py-2 bg-[#00236f] text-white rounded-lg text-xs font-semibold">
          Voltar ao Painel
        </button>
      </div>
    );
  }

  const downloadTicketPDF = () => {
    if (!ticket) return;

    try {
      const doc = new jsPDF();
      
      const cleanText = (str: string | undefined): string => {
        if (!str) return '';
        return str
          .replace(/😍/g, '[Excelente]')
          .replace(/👍/g, '[Bom]')
          .replace(/😞/g, '[Ruim]')
          .replace(/🔔/g, '[Alerta]')
          .replace(/🚚/g, '[Logistica]')
          .replace(/💡/g, '[Nota]')
          .replace(/⭐/g, '*')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // remove Portuguese accents so PDF renders clean ASCII
          .replace(/[^\x00-\x7F]/g, ''); // keep only ASCII
      };

      let y = 15;

      // Corporate Blue Header Banner
      doc.setFillColor(0, 35, 111); // Navy Blue (#00236f)
      doc.rect(0, 0, 210, 38, 'F');

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('ERP CONEXAO - ARQUIVO POS-VENDA', 15, 15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('RELATORIO CONSOLIDADO DE AUDITORIA E CONTROLE INTERNO', 15, 22);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 28);
      doc.text(`Emitido por: ${cleanText(currentUser?.name || '')} (${cleanText(currentUser?.role || '')})`, 15, 33);

      y = 48;

      // SECTION 1: GENERAL INFORMATION
      doc.setFillColor(240, 243, 248);
      doc.rect(15, y, 180, 8, 'F');
      doc.setTextColor(0, 35, 111);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('1. DADOS IDENTIFICADORES DO CHAMADO', 18, y + 6);

      y += 14;

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);

      // Grid of attributes
      doc.setFont('helvetica', 'bold'); doc.text('ID do Chamado:', 15, y);
      doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.id), 48, y);

      doc.setFont('helvetica', 'bold'); doc.text('Categoria:', 115, y);
      doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.category), 148, y);

      y += 6;

      doc.setFont('helvetica', 'bold'); doc.text('Status Atual:', 15, y);
      doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.status), 48, y);

      doc.setFont('helvetica', 'bold'); doc.text('Prioridade:', 115, y);
      doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.priority), 148, y);

      y += 6;

      doc.setFont('helvetica', 'bold'); doc.text('Data de Criacao:', 15, y);
      doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.createdAt), 48, y);

      doc.setFont('helvetica', 'bold'); doc.text('Unidade Customer:', 115, y);
      doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.customerGroup || 'Nao Informado'), 148, y);

      y += 6;

      doc.setFont('helvetica', 'bold'); doc.text('Ultima Atualizacao:', 15, y);
      doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.updatedAt), 48, y);

      doc.setFont('helvetica', 'bold'); doc.text('Responsavel:', 115, y);
      doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.assigneeName || 'Equipe Pos-Venda'), 148, y);

      y += 12;

      // SECTION 2: CLIENT DETAILS
      doc.setFillColor(240, 243, 248);
      doc.rect(15, y, 180, 8, 'F');
      doc.setTextColor(0, 35, 111);
      doc.setFont('helvetica', 'bold');
      doc.text('2. INFORMACOES DO CLIENTE', 18, y + 6);

      y += 14;

      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'bold'); doc.text('Nome / Razao Social:', 15, y);
      doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.clientName), 52, y);

      y += 6;

      doc.setFont('helvetica', 'bold'); doc.text('Pessoa de Contato:', 15, y);
      doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.contactPerson || 'Nao informado'), 52, y);

      y += 6;

      doc.setFont('helvetica', 'bold'); doc.text('E-mail de Contato:', 15, y);
      doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.contactEmail || 'Nao informado'), 52, y);

      y += 12;

      // SECTION 3: DESCRIPTION
      doc.setFillColor(240, 243, 248);
      doc.rect(15, y, 180, 8, 'F');
      doc.setTextColor(0, 35, 111);
      doc.setFont('helvetica', 'bold');
      doc.text('3. DESCRICAO DA OCORRENCIA', 18, y + 6);

      y += 14;

      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      
      const descLines = doc.splitTextToSize(cleanText(ticket.description), 175);
      doc.text(descLines, 15, y);
      y += descLines.length * 4.5 + 4;

      // Conditional custom fields inside Description section
      if (ticket.category === 'Remanejamento' && (ticket.vendasNumber || ticket.transferReason)) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y, 180, 22, 'F');
        doc.setTextColor(0, 35, 111);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalhes do Remanejamento:', 18, y + 5);
        
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold'); doc.text('Rota / No. Vendas Destino:', 18, y + 10);
        doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.vendasNumber || 'Nao informado'), 60, y + 10);

        doc.setFont('helvetica', 'bold'); doc.text('Motivo da Transferencia:', 18, y + 15);
        doc.setFont('helvetica', 'normal'); 
        const transLines = doc.splitTextToSize(cleanText(ticket.transferReason || 'Nao detalhado'), 125);
        doc.text(transLines, 60, y + 15);
        
        y += 28;
      }

      if (ticket.category === 'Logístico' && ticket.logisticSituation) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y, 180, 12, 'F');
        doc.setTextColor(0, 35, 111);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalhes de Logistica:', 18, y + 5);
        
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold'); doc.text('Situacao Logistica:', 18, y + 9);
        doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.logisticSituation), 52, y + 9);

        y += 18;
      }

      // Check page break before printing history
      if (y > 180) {
        doc.addPage();
        y = 20;
      }

      // SECTION 4: SATISFACTION FEEDBACK (Rating)
      if (ticket.rating) {
        doc.setFillColor(240, 243, 248);
        doc.rect(15, y, 180, 8, 'F');
        doc.setTextColor(0, 35, 111);
        doc.setFont('helvetica', 'bold');
        doc.text('4. AVALIACAO DO ATENDIMENTO PELO CLIENTE', 18, y + 6);

        y += 14;

        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold'); doc.text('Nota dada pelo cliente:', 15, y);
        doc.setFont('helvetica', 'normal'); doc.text(cleanText(ticket.rating), 54, y);

        if (ticket.ratingComment) {
          y += 6;
          doc.setFont('helvetica', 'bold'); doc.text('Comentarios do cliente:', 15, y);
          doc.setFont('helvetica', 'normal');
          const commentLines = doc.splitTextToSize(cleanText(ticket.ratingComment), 135);
          doc.text(commentLines, 54, y);
          y += commentLines.length * 4.5;
        }
        
        y += 10;
      }

      if (y > 190) {
        doc.addPage();
        y = 20;
      }

      // SECTION 5: AUDIT HISTORY TIMELINE LOG
      doc.setFillColor(240, 243, 248);
      doc.rect(15, y, 180, 8, 'F');
      doc.setTextColor(0, 35, 111);
      doc.setFont('helvetica', 'bold');
      doc.text('5. HISTORICO DE STATUS E AUDITORIA', 18, y + 6);

      y += 14;

      ticket.history.forEach((h: any) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 35, 111);
        doc.text(`[${h.timestamp}] - ${cleanText(h.title)}`, 15, y);
        
        y += 4.5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        const entryDescLines = doc.splitTextToSize(cleanText(h.description), 170);
        doc.text(entryDescLines, 18, y);
        
        y += entryDescLines.length * 4.5 + 4;
      });

      // Footer signature space at the very end
      if (y > 240) {
        doc.addPage();
        y = 30;
      } else {
        y += 15;
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(15, y, 90, y);
      doc.line(120, y, 195, y);
      
      y += 4;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Assinatura do Gestor Responsavel', 15, y);
      doc.text('Assinatura da Auditoria Interna', 120, y);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Este documento e um registro autentico gerado eletronicamente no Portal ERP Pos-Venda.', 15, y);

      doc.save(`chamado-${ticket.id}-auditoria.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF", error);
      alert("Ocorreu um erro ao gerar o arquivo PDF. Por favor, tente novamente.");
    }
  };

  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (error) {
      console.error("Failed to play chime", error);
    }
  };

  const handleEmitAlert = () => {
    playChime();
    const alertTitle = ticket.status === 'Retorno Solicitado' 
      ? 'Retorno Solicitado pós-venda'
      : 'Aviso de Atenção';
    const alertDesc = ticket.status === 'Retorno Solicitado'
      ? `ADM emitiu alerta notificando que o chamado requer retorno imediato do cliente com as notas/documentos.`
      : `ADM emitiu um sinal de alerta de atenção para o andamento do chamado.`;

    emitTicketAlert(ticket.id, alertTitle, alertDesc);
    
    setToastMessage(`🔔 Alerta de Retorno enviado com sucesso ao cliente ${ticket.clientName}!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addInternalNote(ticket.id, newNoteText);
    setNewNoteText('');
    setShowNoteInput(false);
  };

  const handleAddPhotoClick = () => {
    setShowPhotoSource(true);
  };

  const triggerFileInput = (useCamera: boolean) => {
    if (fileInputRef.current) {
      if (useCamera) {
        fileInputRef.current.setAttribute('capture', 'environment');
      } else {
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        addAttachment(ticket.id, file.name || 'foto.jpg', base64String);
        alert('Foto anexada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetWaiting = () => {
    updateTicketStatus(ticket.id, 'Em Espera', 'Chamado colocado em espera técnica.');
    alert('Status atualizado para Em Espera!');
  };

  return (
    <div className="bg-[#f7f9fb] min-h-screen text-[#191c1e] font-sans pb-24 relative">
      {/* Top App Bar Header */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#f7f9fb] border-b border-gray-200 h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            id="back-btn"
            onClick={() => setScreen('dashboard')}
            className="hover:bg-gray-100 p-2 rounded-full text-[#00236f] active:opacity-80 transition-all"
            title="Voltar para o Painel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base text-[#00236f]">
            Detalhes do Chamado
          </h1>
        </div>

        <div className="flex items-center gap-1">
          {isAdm && (
            <button 
              onClick={handleEmitAlert}
              className={`relative p-2 rounded-full transition-all duration-300 ${
                ticket.status === 'Retorno Solicitado' && !ticket.alertRead
                  ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 ring-2 ring-indigo-500/20 animate-pulse' 
                  : 'hover:bg-gray-100 text-[#00236f]'
              }`}
              title={ticket.status === 'Retorno Solicitado' ? "Emitir Alerta de Retorno Solicitado" : "Emitir Sinal de Alerta"}
            >
              <Bell className={`w-5 h-5 ${ticket.status === 'Retorno Solicitado' && !ticket.alertRead ? 'text-indigo-600' : ''}`} />
              {ticket.status === 'Retorno Solicitado' && !ticket.alertRead && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-bounce" />
              )}
            </button>
          )}
          <div className="relative">
            <button 
              id="more-options-btn"
              onClick={() => setShowMenu(!showMenu)}
              className="hover:bg-gray-100 p-2 rounded-full text-[#00236f] active:scale-95 transition-transform"
              title="Mais Opções"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50 text-xs text-gray-800 font-medium animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(ticket.id);
                      setToastMessage(`ID ${ticket.id} copiado para a área de transferência!`);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <span>Copiar ID do Chamado</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setToastMessage("Link do chamado copiado para a área de transferência!");
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <span>Compartilhar Chamado</span>
                  </button>
                  <button
                    onClick={() => {
                      downloadTicketPDF();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-emerald-700 font-bold"
                  >
                    <span>Baixar PDF (Auditoria)</span>
                  </button>
                  <button
                    onClick={() => {
                      setScreen('dashboard');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-[#00236f]"
                  >
                    <span>Voltar ao Painel</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="pt-18 px-4 max-w-4xl mx-auto space-y-6">
        
        {/* Ticket Title Header Section */}
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="font-black text-lg text-[#00236f] tracking-tight">
                {ticket.id}
              </span>
              <div className="bg-[#6cf8bb] text-[#00714d] px-3 py-0.5 rounded-full font-bold text-[10px] tracking-wider uppercase">
                {ticket.status.toUpperCase()}
              </div>
              {ticket.customerGroup && (
                <div className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 ${
                  ticket.customerGroup === 'Customer Selantes' ? 'bg-blue-100 text-blue-800' :
                  ticket.customerGroup === 'Customer Argamassa' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {ticket.customerGroup === 'Customer Selantes' ? <Droplet className="w-3 h-3 text-blue-600" /> :
                   ticket.customerGroup === 'Customer Argamassa' ? <Layers className="w-3 h-3 text-amber-600" /> :
                   <Truck className="w-3 h-3 text-emerald-600" />}
                  {ticket.customerGroup}
                </div>
              )}
            </div>
            <p className="text-[11px] font-semibold text-gray-400">
              Criado em: {ticket.createdAt}
            </p>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
            {ticket.title}
          </h2>
        </section>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card Column 1: Client Information */}
          <div className="md:col-span-1 bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-[#00236f]">
              <User className="w-4 h-4" />
              <h3 className="font-extrabold text-[11px] tracking-widest uppercase text-gray-400">
                Informações do Cliente
              </h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Nome da conta</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{ticket.clientName}</p>
              </div>

              {ticket.contactPerson && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Pessoa de contato</p>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5">{ticket.contactPerson}</p>
                  {ticket.contactEmail && (
                    <div className="flex items-center gap-1 text-[#00236f] text-xs font-medium mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{ticket.contactEmail}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Prioridade</p>
                <div className="flex items-center gap-1 text-red-600 font-bold text-xs mt-1">
                  <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                  <span>{ticket.priority}</span>
                </div>
              </div>

              {ticket.customerGroup && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Unidade Customer</p>
                  <p className={`text-xs font-black mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                    ticket.customerGroup === 'Customer Selantes' ? 'bg-blue-50 text-blue-700 border-blue-150' :
                    ticket.customerGroup === 'Customer Argamassa' ? 'bg-amber-50/70 text-amber-800 border-amber-200' :
                    'bg-emerald-50/70 text-emerald-850 border-emerald-200'
                  }`}>
                    {ticket.customerGroup === 'Customer Selantes' ? <Droplet className="w-3.5 h-3.5 text-blue-600 animate-pulse duration-1000" /> :
                     ticket.customerGroup === 'Customer Argamassa' ? <Layers className="w-3.5 h-3.5 text-amber-600" /> :
                     <Truck className="w-3.5 h-3.5 text-emerald-600" />}
                    {ticket.customerGroup}
                  </p>
                </div>
              )}

              {ticket.avgResolutionTime && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Tempo Médio de Resolução</p>
                  <div className="flex items-center gap-2 text-[#006c49] bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/40">
                    <Clock className="w-4 h-4 text-[#006c49]" />
                    <p className="text-sm font-black">{ticket.avgResolutionTime}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Column 2: Problem Description */}
          <div className="md:col-span-2 bg-white border border-gray-150 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#00236f]">
              <FileText className="w-4 h-4" />
              <h3 className="font-extrabold text-[11px] tracking-widest uppercase text-gray-400">
                Descrição do Problema
              </h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed font-normal whitespace-pre-wrap">
              {ticket.description}
            </p>

            {/* Custom fields for Remanejamento */}
            {(ticket.customerReason || ticket.vendasNumber || ticket.transferReason) && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-[#00236f]">Informações de Remanejamento</h4>
                {ticket.customerReason && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Razão do Cliente:</span>
                    <span className="text-xs text-gray-700 font-medium">{ticket.customerReason}</span>
                  </div>
                )}
                {ticket.vendasNumber && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Número de Vendas Destino:</span>
                    <span className="text-xs text-gray-700 font-mono font-medium">{ticket.vendasNumber}</span>
                  </div>
                )}
                {ticket.transferReason && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Motivo da Transferência:</span>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{ticket.transferReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Custom fields for Logístico */}
            {ticket.category === 'Logístico' && ticket.logisticSituation && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <h4 className="text-xs font-bold text-[#00236f]">Informações Logísticas</h4>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Situação Ocorrida:</span>
                  <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold inline-block mt-1">
                    🚚 {ticket.logisticSituation}
                  </span>
                </div>
              </div>
            )}

            {/* Attachments Section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Anexos ({ticket.attachments.length})</p>
              
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {ticket.attachments.map((att) => (
                  <div 
                    key={att.id}
                    onClick={() => setZoomedImage(att.url)}
                    className="relative min-w-[110px] max-w-[110px] h-18 rounded-xl overflow-hidden border border-gray-200 group cursor-pointer hover:border-blue-600 transition-colors shrink-0 shadow-sm"
                  >
                    <img 
                      referrerPolicy="no-referrer"
                      alt={att.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      src={att.url} 
                    />
                    <div className="absolute inset-0 bg-[#00236f]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>
                ))}

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <button 
                  onClick={handleAddPhotoClick}
                  className="min-w-[110px] h-18 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-600 flex flex-col items-center justify-center text-gray-500 hover:text-blue-700 bg-gray-50 hover:bg-blue-50/20 transition-all shrink-0"
                >
                  <Camera className="w-4.5 h-4.5 text-[#00236f]" />
                  <span className="text-[10px] font-bold mt-1">Add Foto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Conditional Reenviar Retorno Section for customers */}
          {ticket.status === 'Retorno Solicitado' && !isAdm && (
            <div className="md:col-span-3 bg-gradient-to-br from-indigo-50 to-indigo-100/30 border-2 border-indigo-200 p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex items-center gap-2.5 text-indigo-900">
                <MessageSquare className="w-5 h-5 text-indigo-600 animate-bounce shrink-0" />
                <h3 className="font-extrabold text-sm tracking-tight text-indigo-900">
                  Responder Solicitação de Retorno (Reenviar Retorno)
                </h3>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-3">
                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  A equipe de atendimento solicitou informações adicionais para dar andamento ao seu chamado. 
                  Por favor, responda abaixo informando os detalhes solicitados (como fotos adicionais, número de lote, nota fiscal, etc.).
                </p>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="user-response-text" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-0.5">
                      Sua Resposta / Informações Solicitadas
                    </label>
                    <textarea
                      id="user-response-text"
                      rows={3}
                      value={userResponseText}
                      onChange={(e) => setUserResponseText(e.target.value)}
                      placeholder="Digite aqui as explicações, lotes, NF ou detalhes solicitados..."
                      className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all placeholder:text-gray-400 text-gray-800 resize-none font-medium"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                    <div className="flex gap-1.5 items-center text-[11px] text-indigo-700/80 font-semibold">
                      <span>💡</span>
                      <span>Você pode anexar fotos adicionais usando o botão "Add Foto" na seção de anexos acima.</span>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmittingResponse}
                      onClick={() => {
                        if (!userResponseText.trim()) {
                          alert('Por favor, escreva as informações solicitadas antes de enviar.');
                          return;
                        }
                        setIsSubmittingResponse(true);
                        
                        // Update status to Em Progresso and pass userResponseText as feedback
                        updateTicketStatus(ticket.id, 'Em Progresso', userResponseText.trim());
                        
                        setToastMessage("Seu retorno foi enviado com sucesso! O chamado está em análise.");
                        setUserResponseText('');
                        setIsSubmittingResponse(false);
                      }}
                      className="w-full sm:w-auto h-10 px-5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Retorno e Atualizar Chamado</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Avaliação do Atendimento Card (Shows when resolved or already rated) */}
          {(ticket.status === 'Resolvido' || ticket.rating) && (
            <div className="md:col-span-2 bg-gradient-to-br from-[#00236f]/5 to-blue-50/30 border border-[#00236f]/15 p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex items-center gap-2 text-[#00236f]">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-[11px] tracking-widest uppercase text-[#00236f]">
                  Avaliação do Atendimento
                </h3>
              </div>

              {ticket.rating ? (
                <div className="bg-white/95 border border-gray-100 p-4 rounded-xl space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">
                      {ticket.rating === 'Ótimo' ? '😍' : ticket.rating === 'Bom' ? '👍' : '😞'}
                    </span>
                    <div>
                      <p className="text-xs font-black text-gray-800">
                        Classificado como <span className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ml-1 ${
                          ticket.rating === 'Ótimo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          ticket.rating === 'Bom' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>{ticket.rating}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Obrigado pelo seu feedback!</p>
                    </div>
                  </div>
                  {ticket.ratingComment && (
                    <div className="bg-gray-50/60 p-2.5 rounded-lg border border-gray-100 mt-2 text-xs text-gray-600 font-medium italic">
                      "{ticket.ratingComment}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    Este chamado foi resolvido! Por favor, dedique alguns segundos para avaliar o nosso atendimento e nos ajudar a melhorar:
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedRating('Ruim')}
                      className={`flex flex-col items-center justify-center p-3 border rounded-xl active:scale-95 transition-all gap-1.5 ${
                        selectedRating === 'Ruim' 
                          ? 'bg-red-50 border-red-300 text-red-700 font-bold shadow-sm' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl">😞</span>
                      <span className="text-[11px] font-bold">Ruim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRating('Bom')}
                      className={`flex flex-col items-center justify-center p-3 border rounded-xl active:scale-95 transition-all gap-1.5 ${
                        selectedRating === 'Bom' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-sm' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl">👍</span>
                      <span className="text-[11px] font-bold">Bom</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRating('Ótimo')}
                      className={`flex flex-col items-center justify-center p-3 border rounded-xl active:scale-95 transition-all gap-1.5 ${
                        selectedRating === 'Ótimo' 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold shadow-sm' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl">😍</span>
                      <span className="text-[11px] font-bold">Ótimo</span>
                    </button>
                  </div>

                  {selectedRating && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div>
                        <label htmlFor="rating-comment" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-0.5">
                          Comentário Opcional
                        </label>
                        <textarea
                          id="rating-comment"
                          rows={2}
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          placeholder="Deixe um comentário sobre o atendimento..."
                          className="w-full p-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all placeholder:text-gray-400 text-gray-800 resize-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSubmittingRating(true);
                          rateTicket(ticket.id, selectedRating, ratingComment);
                          setToastMessage("Muito obrigado pela sua avaliação!");
                          setIsSubmittingRating(false);
                        }}
                        className="w-full h-10 bg-[#00236f] hover:bg-[#0b1d40] text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Enviar Avaliação
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Card Column 3: Status History timeline */}
          <div className="md:col-span-2 bg-white border border-gray-150 p-5 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-[#00236f]">
              <History className="w-4 h-4" />
              <h3 className="font-extrabold text-[11px] tracking-widest uppercase text-gray-400">
                Histórico de Status
              </h3>
            </div>

            <div className="relative space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-150 pl-1">
              {ticket.history.map((entry) => (
                <div key={entry.id} className="relative flex gap-4 pl-7">
                  <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center z-10 shadow-sm ${
                    entry.title.includes('Alerta') || entry.title.includes('🔔')
                      ? 'bg-amber-500 shadow-amber-500/20'
                      : 'bg-[#00236f] shadow-[#00236f]/20'
                  }`}>
                    {entry.title.includes('Alerta') || entry.title.includes('🔔') ? (
                      <Bell className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{entry.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{entry.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-semibold">{entry.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Column 4: Internal notes & actions */}
          <div className="md:col-span-1 space-y-4">
            
            {/* Internal notes widget */}
            <div className="bg-[#1e3a8a] text-white p-5 rounded-2xl shadow-sm space-y-3">
              <h3 className="font-extrabold text-[11px] tracking-widest uppercase text-blue-200 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-blue-200" />
                Notas Internas
              </h3>
              
              {ticket.internalNotes.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {ticket.internalNotes.map((note) => (
                    <div key={note.id} className="bg-blue-950/40 p-2.5 rounded-xl border border-blue-900/45">
                      <p className="text-[11px] text-gray-100 font-medium italic">
                        "{note.text}"
                      </p>
                      <div className="flex justify-between items-center text-[9px] text-blue-300 font-semibold mt-1.5 pt-1.5 border-t border-blue-900/30">
                        <span>Por: {note.author}</span>
                        <span>{note.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-blue-200 italic">
                  Nenhuma nota restrita adicionada a este chamado.
                </p>
              )}

              {showNoteInput ? (
                <form onSubmit={handleAddNote} className="space-y-2 pt-2">
                  <textarea
                    id="internal-note-input"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Sua nota interna..."
                    className="w-full text-xs p-2 bg-blue-950/60 border border-blue-900 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none h-16"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button 
                      type="button" 
                      onClick={() => setShowNoteInput(false)}
                      className="px-2.5 py-1 text-[10px] font-bold text-blue-200 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-2.5 py-1 text-[10px] font-bold bg-white text-[#1e3a8a] rounded-md hover:bg-blue-50"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              ) : (
                <button 
                  id="add-internal-note-btn"
                  onClick={() => setShowNoteInput(true)}
                  className="w-full bg-white hover:bg-blue-50 text-[#1e3a8a] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95 duration-100"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar nota interna
                </button>
              )}
            </div>

            {ticket.status === 'Resolvido' && (
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 border border-emerald-200 p-5 rounded-2xl shadow-sm space-y-3 animate-in fade-in duration-300 text-left">
                <div className="flex items-center gap-2 text-emerald-800">
                  <FileText className="w-4.5 h-4.5 text-emerald-600" />
                  <h3 className="font-extrabold text-[11px] tracking-widest uppercase text-emerald-800">
                    Arquivo de Auditoria
                  </h3>
                </div>
                <p className="text-[11px] text-emerald-700 leading-normal font-medium">
                  Este chamado foi finalizado e resolvido. Baixe as informações em PDF para auditoria ou arquivamento do sistema.
                </p>
                <button
                  id="download-pdf-sidebar-btn"
                  onClick={downloadTicketPDF}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-600/10"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF do Chamado
                </button>
              </div>
            )}

            {/* Quick action buttons container */}
            <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-[11px] tracking-widest uppercase text-gray-400">
                Atualizar Status
              </h3>
              
              <div className="flex flex-col gap-2.5">
                {/* Hold status button */}
                <button 
                  id="btn-espera"
                  onClick={handleSetWaiting}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors w-full text-left font-medium text-xs text-gray-700"
                >
                  <span>Em espera</span>
                  <Pause className="w-4 h-4 text-gray-400" />
                </button>

                {/* Resolve status button - Transitions to Resolution view screen */}
                {isAdm ? (
                  <button 
                    id="btn-resolver"
                    onClick={() => setScreen('resolve')}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-[#006c49] bg-white hover:bg-[#006c49]/5 active:scale-[0.98] transition-all w-full text-left group"
                  >
                    <span className="font-black text-sm text-[#006c49]">
                      Encerrar ou Solicitar Retorno (ADM)
                    </span>
                    <CheckCircle className="w-5 h-5 text-[#006c49] group-hover:scale-110 transition-transform" />
                  </button>
                ) : (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 shadow-sm text-left">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="font-extrabold text-[11px] text-amber-800 uppercase tracking-wider">
                        Encerramento Reservado
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-normal">
                      Apenas o login <strong className="font-bold">ADM</strong> possui atribuição para finalizar chamados pós-venda.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Lightbox Zoomed Image modal wrapper */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 bg-white/25 hover:bg-white/40 p-2 rounded-full text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            referrerPolicy="no-referrer"
            src={zoomedImage} 
            alt="Zoomed" 
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" 
          />
        </div>
      )}

      {/* Visual Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[calc(100%-2rem)] bg-indigo-900 text-white px-4 py-3 rounded-xl shadow-xl border border-indigo-700/50 flex items-center gap-3 animate-bounce">
          <Bell className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
          <div className="flex-1 text-xs font-semibold font-sans">
            {toastMessage}
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/70 hover:text-white shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Navigation mimic bar */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#f7f9fb] border-t border-gray-200 flex justify-around items-center h-16 px-4">
        <button onClick={() => setScreen('dashboard')} className="flex flex-col items-center justify-center text-gray-500 hover:text-[#00236f] transition-colors">
          <Inbox className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Painel</span>
        </button>
        {!isAdm && (
          <button onClick={() => setScreen('new-ticket')} className="flex flex-col items-center justify-center text-[#00236f] active:scale-95">
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Novo Chamado</span>
          </button>
        )}
        <button 
          onClick={() => {
            localStorage.setItem('open_status_modal', 'true');
            setScreen('dashboard');
          }} 
          className="flex flex-col items-center justify-center text-gray-500 hover:text-[#00236f] transition-colors"
          title="Ver Status dos Chamados"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Status</span>
        </button>
        <button 
          onClick={logout} 
          className="flex flex-col items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
          title="Sair da Conta"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Sair</span>
        </button>
      </nav>

      {/* Origin/Source Selection Modal */}
      {showPhotoSource && (
        <div className="fixed inset-0 bg-black/60 z-55 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0" onClick={() => setShowPhotoSource(false)} />
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Origem do Anexo</h3>
              <button onClick={() => setShowPhotoSource(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPhotoSource(false);
                  triggerFileInput(true);
                }}
                className="flex flex-col items-center justify-center p-5 border border-gray-150 rounded-xl hover:bg-blue-50/20 active:scale-95 transition-all gap-2 text-[#00236f]"
              >
                <div className="bg-blue-50 p-3 rounded-full">
                  <Camera className="w-6 h-6 text-[#00236f]" />
                </div>
                <span className="text-xs font-bold">Usar Câmera</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPhotoSource(false);
                  triggerFileInput(false);
                }}
                className="flex flex-col items-center justify-center p-5 border border-gray-150 rounded-xl hover:bg-blue-50/20 active:scale-95 transition-all gap-2 text-[#00236f]"
              >
                <div className="bg-blue-50 p-3 rounded-full">
                  <Plus className="w-6 h-6 text-[#00236f]" />
                </div>
                <span className="text-xs font-bold">Galeria/Arquivos</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
