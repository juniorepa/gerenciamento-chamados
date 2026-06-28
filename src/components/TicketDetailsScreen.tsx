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
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

export const TicketDetailsScreen: React.FC = () => {
  const { 
    tickets, 
    selectedTicketId, 
    setScreen, 
    updateTicketStatus, 
    addInternalNote, 
    addAttachment,
    emitTicketAlert,
    currentUser
  } = useApp();

  const [newNoteText, setNewNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find the selected ticket or default to the first one
  const ticket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  const isAdm = currentUser?.email === 'adm@empresa.com' || currentUser?.name === 'ADM';

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
    fileInputRef.current?.click();
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
          <button className="hover:bg-gray-100 p-2 rounded-full text-[#00236f]">
            <MoreVertical className="w-5 h-5" />
          </button>
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
          <History className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Painel</span>
        </button>
        <button onClick={() => setScreen('new-ticket')} className="flex flex-col items-center justify-center text-[#00236f] active:scale-95">
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Novo Chamado</span>
        </button>
        <button onClick={() => alert('Fila de status atualizada.')} className="flex flex-col items-center justify-center text-gray-500">
          <History className="w-5 h-5 rotate-180" />
          <span className="text-[10px] font-semibold mt-0.5">Status</span>
        </button>
        <button onClick={() => setScreen('login')} className="flex flex-col items-center justify-center text-gray-500">
          <StickyNote className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Sair</span>
        </button>
      </nav>
    </div>
  );
};
