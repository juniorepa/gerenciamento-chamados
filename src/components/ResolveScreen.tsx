import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Bell, 
  CheckCircle2, 
  PauseCircle, 
  AlertOctagon, 
  FileText, 
  EyeOff, 
  Camera, 
  Send, 
  X, 
  Plus,
  Lock,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { TicketStatus } from '../types';

export const ResolveScreen: React.FC = () => {
  const { tickets, selectedTicketId, setScreen, updateTicketStatus, addAttachment, currentUser } = useApp();
  
  // Find the selected ticket or default to the first one
  const ticket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  const isAdm = currentUser?.email === 'adm@empresa.com' || currentUser?.name === 'ADM';

  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(isAdm ? 'Resolvido' : 'Em Espera');
  const [feedback, setFeedback] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [internalNoteText, setInternalNoteText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const formattedSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
          setAttachedFiles(prev => [
            ...prev,
            { name: file.name || 'foto.jpg', size: formattedSize, url: base64String }
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      alert('Por favor, preencha o Parecer Técnico antes de atualizar o chamado.');
      return;
    }

    if ((selectedStatus === 'Resolvido' || selectedStatus === 'Retorno Solicitado') && !isAdm) {
      alert('Apenas o login ADM tem permissão para este status.');
      return;
    }

    // Add attachments to the ticket
    attachedFiles.forEach(f => {
      addAttachment(ticket.id, f.name, f.url);
    });

    // Call state update in context
    updateTicketStatus(
      ticket.id, 
      selectedStatus, 
      feedback, 
      isInternalNote, 
      internalNoteText
    );

    alert(`Chamado ${ticket.id} atualizado com sucesso para o status: ${selectedStatus}!`);
    setScreen('dashboard');
  };

  return (
    <div className="bg-[#f7f9fb] min-h-screen text-[#191c1e] font-sans pb-24 relative">
      {/* Top Header App Bar */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#f7f9fb] border-b border-gray-200 h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            id="back-to-details"
            onClick={() => setScreen('ticket-details')}
            className="hover:bg-gray-100 p-2 rounded-full text-[#00236f] active:opacity-80 transition-all"
            title="Voltar para Detalhes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base text-[#00236f]">
            Resolver Chamado
          </h1>
        </div>
        <div className="flex items-center">
          <button className="hover:bg-gray-100 p-2 rounded-full text-[#00236f]">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Form content container */}
      <main className="pt-18 px-4 max-w-2xl mx-auto space-y-6">
        
        {/* Title Heading text */}
        <div className="py-1">
          <h2 className="text-xl font-extrabold text-[#191c1e]">
            Resolver Chamado
          </h2>
        </div>

        {/* Ticket Summary Card displaying what we are resolving */}
        <section className="bg-white border border-gray-150 rounded-xl overflow-hidden flex shadow-sm">
          <div className="w-1.5 bg-[#00236f] shrink-0"></div>
          <div className="p-4 flex-1 space-y-2">
            <div className="flex justify-between items-start">
              <span className="font-bold text-xs text-[#00236f] bg-blue-50 px-2.5 py-0.5 rounded-md">
                #{ticket.id}
              </span>
              
              <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">{ticket.status}</span>
              </div>
            </div>

            <h3 className="font-bold text-sm text-gray-900">
              {ticket.title}
            </h3>
            
            <p className="text-xs text-gray-500 line-clamp-2">
              {ticket.description}
            </p>

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              <span>Prioridade: {ticket.priority}</span>
              <span>Criado: {ticket.createdAt.split('·')[0]}</span>
            </div>
          </div>
        </section>

        {/* Form resolution form fields */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Status Selection Buttons segment */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
              Atualizar Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Status button: Resolvido */}
              <button
                id="status-btn-resolvido"
                type="button"
                disabled={!isAdm}
                onClick={() => setSelectedStatus('Resolvido')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 group active:scale-95 ${
                  !isAdm
                    ? 'border-gray-200 bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed'
                    : selectedStatus === 'Resolvido'
                    ? 'border-[#00236f] bg-blue-50/50 ring-2 ring-[#00236f]/10'
                    : 'border-gray-200 bg-white hover:border-[#00236f]'
                }`}
              >
                <div className="relative">
                  <CheckCircle2 className={`w-5 h-5 mb-1.5 ${!isAdm ? 'text-gray-300' : selectedStatus === 'Resolvido' ? 'text-[#00236f]' : 'text-gray-400 group-hover:text-[#00236f]'}`} />
                  {!isAdm && (
                    <Lock className="w-3.5 h-3.5 text-amber-600 absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 border border-amber-200" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-gray-700">Resolvido</span>
              </button>

              {/* Status button: Retorno Solicitado */}
              <button
                id="status-btn-retorno"
                type="button"
                disabled={!isAdm}
                onClick={() => setSelectedStatus('Retorno Solicitado')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 group active:scale-95 ${
                  !isAdm
                    ? 'border-gray-200 bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed'
                    : selectedStatus === 'Retorno Solicitado'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/10'
                    : 'border-gray-200 bg-white hover:border-indigo-600'
                }`}
              >
                <div className="relative">
                  <HelpCircle className={`w-5 h-5 mb-1.5 ${!isAdm ? 'text-gray-300' : selectedStatus === 'Retorno Solicitado' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'}`} />
                  {!isAdm && (
                    <Lock className="w-3.5 h-3.5 text-amber-600 absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 border border-amber-200" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-gray-700">Retorno Solic.</span>
              </button>

              {/* Status button: Em Espera */}
              <button
                id="status-btn-espera"
                type="button"
                onClick={() => setSelectedStatus('Em Espera')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 group active:scale-95 ${selectedStatus === 'Em Espera' ? 'border-[#00236f] bg-blue-50/50 ring-2 ring-[#00236f]/10' : 'border-gray-200 bg-white hover:border-[#00236f]'}`}
              >
                <PauseCircle className={`w-5 h-5 mb-1.5 ${selectedStatus === 'Em Espera' ? 'text-[#00236f]' : 'text-gray-400 group-hover:text-[#00236f]'}`} />
                <span className="text-[10px] font-bold text-gray-700">Em Espera</span>
              </button>

              {/* Status button: Impedido */}
              <button
                id="status-btn-impedido"
                type="button"
                onClick={() => setSelectedStatus('Impedido')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 group active:scale-95 ${selectedStatus === 'Impedido' ? 'border-red-600 bg-red-50/30 ring-2 ring-red-600/10' : 'border-gray-200 bg-white hover:border-red-600'}`}
              >
                <AlertOctagon className={`w-5 h-5 mb-1.5 ${selectedStatus === 'Impedido' ? 'text-red-600' : 'text-gray-400 group-hover:text-red-600'}`} />
                <span className="text-[10px] font-bold text-gray-700">Impedido</span>
              </button>
            </div>
            {!isAdm && (
              <div className="mt-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1 text-left">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-extrabold text-[11px] text-amber-800 uppercase tracking-wider">
                    Status Resolvido Restrito
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 leading-normal">
                  O encerramento do chamado está restrito ao administrador. Conecte-se com o login <strong className="font-bold">ADM</strong> para habilitar esta opção.
                </p>
              </div>
            )}
          </div>

          {/* Text Feedback input section */}
          <div>
            <label htmlFor="technical-feedback" className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              Parecer Técnico / Retorno
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <textarea
                id="technical-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Descreva detalhadamente a solução aplicada ou o motivo da pendência..."
                rows={5}
                className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all placeholder:text-gray-400 text-gray-800 resize-none"
              />
            </div>
          </div>

          {/* Internal note disclosure toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-100/80 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <EyeOff className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs font-bold text-gray-800">Nota Interna</p>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Invisível para o cliente</p>
              </div>
            </div>
            
            {/* Custom switch slider input */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                id="internal-note-toggle"
                type="checkbox" 
                checked={isInternalNote}
                onChange={(e) => setIsInternalNote(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#00236f] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00236f]"></div>
            </label>
          </div>

          {/* Optional internal note textarea */}
          {isInternalNote && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1"
            >
              <textarea
                id="internal-note-textarea"
                value={internalNoteText}
                onChange={(e) => setInternalNoteText(e.target.value)}
                placeholder="Notas restritas à equipe técnica..."
                rows={3}
                className="w-full bg-[#d3e4fe]/35 border border-[#c5c5d3] rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f]"
              />
            </motion.div>
          )}

           {/* Evidence upload click files component zone */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              Evidências e Anexos
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div 
              onClick={handleAttachClick}
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 bg-white hover:bg-blue-50/10 hover:border-blue-600 transition-all cursor-pointer group text-center"
            >
              <Camera className="w-9 h-9 text-gray-400 group-hover:text-[#00236f] mb-2 transition-colors" />
              <p className="text-xs font-bold text-gray-700 group-hover:text-[#00236f]">
                Clique para bater foto com a câmera ou anexar arquivos
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Formatos suportados: JPG, PNG, PDF (Máx 10MB)
              </p>
            </div>

            {/* List attached files */}
            {attachedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-gray-150 p-2.5 rounded-lg text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                      {f.url.startsWith('data:image/') ? (
                        <img 
                          src={f.url} 
                          alt={f.name} 
                          className="w-8 h-8 rounded object-cover border border-gray-200" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate max-w-[180px] text-gray-800">{f.name}</span>
                        <span className="text-[10px] text-gray-400">{f.size}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveFile(i)}
                      className="text-red-600 hover:text-red-800 p-1 active:scale-95 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission CTA main button action */}
          <button
            id="resolve-submit-btn"
            type="submit"
            className="w-full h-12 bg-[#001f66] hover:bg-[#00164e] text-white rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors shadow-lg active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            Enviar Retorno e Atualizar
          </button>

        </form>
      </main>

      {/* Bottom navbar placeholder list */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#f7f9fb] border-t border-gray-200 flex justify-around items-center h-16 px-4">
        <button onClick={() => setScreen('dashboard')} className="flex flex-col items-center justify-center text-gray-500">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Painel</span>
        </button>
        <button onClick={() => setScreen('new-ticket')} className="flex flex-col items-center justify-center text-gray-500">
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Novo Chamado</span>
        </button>
        <button onClick={() => alert('Sua fila de chamados está atualizada.')} className="flex flex-col items-center justify-center text-gray-500">
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Status</span>
        </button>
        <button onClick={() => setScreen('login')} className="flex flex-col items-center justify-center text-gray-500">
          <X className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Sair</span>
        </button>
      </nav>
    </div>
  );
};
