import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Bell, 
  MoreVertical, 
  User, 
  Calendar, 
  Package, 
  FileText, 
  Camera, 
  Send, 
  Brain, 
  Hash, 
  Info,
  CheckCircle,
  X,
  History,
  Plus,
  Lock,
  Droplet,
  Layers,
  Truck
} from 'lucide-react';
import { motion } from 'motion/react';
import { TicketCategory, TicketPriority, Attachment } from '../types';

export const NewTicketScreen: React.FC = () => {
  const { createTicket, setScreen, logout } = useApp();
  
  // Tab category switcher state
  const [activeTab, setActiveTab] = useState<TicketCategory>('ADM');
  const [clientName, setClientName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [ticketDate, setTicketDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Média');

  // Customer Group Selection state
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState<'Customer Selantes' | 'Customer Argamassa' | 'Customer Logística' | null>(null);

  React.useEffect(() => {
    if (selectedCustomerGroup === 'Customer Logística') {
      if (activeTab !== 'Logístico') {
        setActiveTab('Logístico');
      }
    } else if (selectedCustomerGroup) {
      if (activeTab === 'Logístico') {
        setActiveTab('ADM');
      }
    }
  }, [selectedCustomerGroup]);

  // Remanejamento transfer state fields
  const [customerReason, setCustomerReason] = useState('');
  const [vendasNumber, setVendasNumber] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Logístico state fields
  const [logisticSituation, setLogisticSituation] = useState('Atraso na Entrega');

  // Attached files local state list
  const [uploadedImages, setUploadedImages] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showPhotoSource, setShowPhotoSource] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAttachClick = () => {
    setShowPhotoSource(true);
  };

  const triggerFileInput = (useCamera: boolean) => {
    if (fileInputRef.current) {
      if (useCamera) {
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.removeAttribute('multiple');
      } else {
        fileInputRef.current.removeAttribute('capture');
        fileInputRef.current.setAttribute('multiple', 'true');
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setUploadedImages(prev => [
            ...prev,
            {
              id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: file.name || 'foto.jpg',
              url: base64String
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleTabChange = (tab: TicketCategory) => {
    setActiveTab(tab);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerGroup) {
      alert('Por favor, selecione para qual Customer o chamado foi aberto.');
      return;
    }
    if (!clientName.trim()) {
      alert('Por favor, preencha o Nome do Cliente.');
      return;
    }
    if (activeTab === 'Remanejamento') {
      if (!transferReason.trim()) {
        alert('Por favor, explique o motivo da transferência.');
        return;
      }
    } else {
      if (!description.trim()) {
        alert('Por favor, descreva o problema.');
        return;
      }
    }

    setIsSubmitting(true);

    // Mock successful submit with the button animations as requested
    setTimeout(() => {
      setSubmitSuccess(true);
      
      // Submit actual ticket data to context state
      createTicket({
        title: activeTab === 'Remanejamento' 
          ? `Remanejamento de Conta: ${clientName}` 
          : activeTab === 'Logístico'
          ? `Incidente Logístico [${logisticSituation}]: ${clientName}`
          : activeTab === 'Comercial'
          ? `Solicitação Comercial: ${description.slice(0, 40)}...`
          : `Problema Técnico: ${description.slice(0, 40)}...`,
        description: activeTab === 'Remanejamento' ? transferReason : description,
        category: activeTab,
        clientName,
        priority: activeTab === 'Remanejamento' ? 'Média' : priority,
        quantityReclamada: quantity ? Number(quantity) : undefined,
        customerReason: activeTab === 'Remanejamento' ? customerReason : undefined,
        vendasNumber: activeTab === 'Remanejamento' ? vendasNumber : undefined,
        transferReason: activeTab === 'Remanejamento' ? transferReason : undefined,
        logisticSituation: activeTab === 'Logístico' ? logisticSituation : undefined,
        customerGroup: selectedCustomerGroup,
        attachments: uploadedImages,
        city: city || undefined,
        state: state || undefined
      });

      setTimeout(() => {
        alert('Chamado registrado com sucesso no sistema ERP. Retornando ao Dashboard...');
        setScreen('dashboard');
      }, 800);
    }, 600);
  };

  return (
    <div className="bg-[#f7f9fb] min-h-screen text-[#191c1e] font-sans pb-24 relative">
      {/* Top App Bar Header */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#f7f9fb] border-b border-gray-200 h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            id="new-back-btn"
            onClick={() => setScreen('dashboard')}
            className="hover:bg-gray-100 p-2 rounded-full text-[#00236f] active:opacity-80 transition-all"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base text-[#00236f]">
            Novo Chamado
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="hover:bg-gray-100 p-2 rounded-full text-[#00236f]">
            <Bell className="w-5 h-5" />
          </button>
          <button className="hover:bg-gray-100 p-2 rounded-full text-[#00236f]">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content scroll container */}
      <main className="pt-18 px-4 max-w-2xl mx-auto space-y-6">
        
        {/* Intro text */}
        <div className="mb-2">
          <h2 className="text-xl font-extrabold text-[#191c1e] mb-1">
            Registro de Chamado
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Selecione o Customer e em seguida preencha os dados do atendimento pós-venda.
          </p>
        </div>

        {/* Seleção de Customer */}
        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-300">
          <label className="block text-[11px] font-extrabold text-[#00236f] uppercase tracking-wider ml-1">
            Selecione a Unidade de Atendimento (Customer) *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedCustomerGroup('Customer Selantes')}
              className={`flex flex-col items-center justify-center p-4 border rounded-xl active:scale-[0.98] transition-all gap-2 ${
                selectedCustomerGroup === 'Customer Selantes'
                  ? 'bg-blue-50 border-[#00236f] text-[#00236f] font-bold ring-2 ring-[#00236f]/20 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Droplet className="w-7 h-7 text-blue-600 animate-pulse duration-1000" />
              <span className="text-xs font-black tracking-tight text-center">Customer Selantes</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCustomerGroup('Customer Argamassa')}
              className={`flex flex-col items-center justify-center p-4 border rounded-xl active:scale-[0.98] transition-all gap-2 ${
                selectedCustomerGroup === 'Customer Argamassa'
                  ? 'bg-amber-50 border-amber-500 text-amber-800 font-bold ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Layers className="w-7 h-7 text-amber-600" />
              <span className="text-xs font-black tracking-tight text-center">Customer Argamassa</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCustomerGroup('Customer Logística')}
              className={`flex flex-col items-center justify-center p-4 border rounded-xl active:scale-[0.98] transition-all gap-2 ${
                selectedCustomerGroup === 'Customer Logística'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Truck className="w-7 h-7 text-emerald-600" />
              <span className="text-xs font-black tracking-tight text-center">Customer Logística</span>
            </button>
          </div>
        </div>

        {!selectedCustomerGroup ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-200 shadow-inner">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-150 shadow-sm">
              <Lock className="w-6 h-6 text-[#00236f]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-gray-700">Formulário de Abertura Bloqueado</h4>
              <p className="text-xs text-gray-400 max-w-sm font-medium leading-relaxed">
                Você precisa escolher uma unidade **Customer** acima para liberar o preenchimento, seleção de categoria e o envio do chamado.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
            {/* Segmented control category switch buttons container */}
            <div className={`relative bg-gray-200/70 rounded-xl p-1 grid items-center h-12 ${
              selectedCustomerGroup === 'Customer Logística' ? 'grid-cols-1' : 'grid-cols-3'
            }`}>
              {(selectedCustomerGroup === 'Customer Selantes' || selectedCustomerGroup === 'Customer Argamassa') && (
                <>
                  <button 
                    type="button"
                    onClick={() => handleTabChange('ADM')}
                    className={`text-center font-bold text-[10px] sm:text-xs py-2 rounded-lg z-10 transition-all duration-200 ${activeTab === 'ADM' ? 'bg-[#00236f] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    ADM
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleTabChange('Comercial')}
                    className={`text-center font-bold text-[10px] sm:text-xs py-2 rounded-lg z-10 transition-all duration-200 ${activeTab === 'Comercial' ? 'bg-[#00236f] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    COMERCIAL
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleTabChange('Remanejamento')}
                    className={`text-center font-bold text-[9px] sm:text-xs py-2 rounded-lg z-10 transition-all duration-200 ${activeTab === 'Remanejamento' ? 'bg-[#00236f] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    REMANEJAMENTO
                  </button>
                </>
              )}
              {selectedCustomerGroup === 'Customer Logística' && (
                <button 
                  type="button"
                  onClick={() => handleTabChange('Logístico')}
                  className={`text-center font-bold text-[10px] sm:text-xs py-2 rounded-lg z-10 transition-all duration-200 ${activeTab === 'Logístico' ? 'bg-[#00236f] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  LOGÍSTICO
                </button>
              )}
            </div>

            {/* Dynamic Form content */}
            <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Cliente Name input (Universal to all tabs) */}
          <div className="group">
            <label htmlFor="customer-name" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
              Nome do Cliente
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-5 h-5 text-gray-400" />
              <input
                id="customer-name"
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Digite o nome completo"
                className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all text-gray-800"
              />
            </div>
          </div>

          {/* Cidade & Estado grid (Universal) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label htmlFor="customer-city" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                Cidade
              </label>
              <input
                id="customer-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: São Paulo"
                className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all text-gray-800"
              />
            </div>

            <div className="group">
              <label htmlFor="customer-state" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                Estado
              </label>
              <select
                id="customer-state"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full h-12 px-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all text-gray-800"
              >
                <option value="" disabled>Selecione</option>
                <option value="AC">Acre (AC)</option>
                <option value="AL">Alagoas (AL)</option>
                <option value="AP">Amapá (AP)</option>
                <option value="AM">Amazonas (AM)</option>
                <option value="BA">Bahia (BA)</option>
                <option value="CE">Ceará (CE)</option>
                <option value="DF">Distrito Federal (DF)</option>
                <option value="ES">Espírito Santo (ES)</option>
                <option value="GO">Goiás (GO)</option>
                <option value="MA">Maranhão (MA)</option>
                <option value="MT">Mato Grosso (MT)</option>
                <option value="MS">Mato Grosso do Sul (MS)</option>
                <option value="MG">Minas Gerais (MG)</option>
                <option value="PA">Pará (PA)</option>
                <option value="PB">Paraíba (PB)</option>
                <option value="PR">Paraná (PR)</option>
                <option value="PE">Pernambuco (PE)</option>
                <option value="PI">Piauí (PI)</option>
                <option value="RJ">Rio de Janeiro (RJ)</option>
                <option value="RN">Rio Grande do Norte (RN)</option>
                <option value="RS">Rio Grande do Sul (RS)</option>
                <option value="RO">Rondônia (RO)</option>
                <option value="RR">Roraima (RR)</option>
                <option value="SC">Santa Catarina (SC)</option>
                <option value="SP">São Paulo (SP)</option>
                <option value="SE">Sergipe (SE)</option>
                <option value="TO">Tocantins (TO)</option>
              </select>
            </div>
          </div>

          {/* Conditional Fields based on active tab category */}
          {activeTab !== 'Remanejamento' ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
              
              {activeTab === 'Logístico' && (
                <div className="group animate-in fade-in slide-in-from-top-2 duration-250">
                  <label htmlFor="logistic-situation" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Situação Logística
                  </label>
                  <select
                    id="logistic-situation"
                    required
                    value={logisticSituation}
                    onChange={(e) => setLogisticSituation(e.target.value)}
                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all text-gray-800"
                  >
                    <option value="Atraso na Entrega">Atraso na Entrega</option>
                    <option value="Avaria">Avaria</option>
                    <option value="Falta de Volumes na Entrega">Falta de Volumes na Entrega</option>
                    <option value="Entrega em Local Errado">Entrega em Local Errado</option>
                    <option value="Outros">Outros Incidentes Logísticos</option>
                  </select>
                </div>
              )}

              {/* Date and Quantity reclama grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="group">
                  <label htmlFor="ticket-date" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Data
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      id="ticket-date"
                      type="date"
                      required
                      value={ticketDate}
                      onChange={(e) => setTicketDate(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all text-gray-800"
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="claim-quantity" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Quantidade Reclamada
                  </label>
                  <div className="relative flex items-center">
                    <Package className="absolute left-3.5 w-5 h-5 text-gray-400" />
                    <input
                      id="claim-quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Priority Selector dropdown field */}
              <div className="group">
                <label htmlFor="claim-priority" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Prioridade do Chamado
                </label>
                <select
                  id="claim-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all text-gray-800"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítico">Crítico</option>
                </select>
              </div>

              {/* Problem Description text area */}
              <div className="group">
                <label htmlFor="problem-desc" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  {activeTab === 'Logístico' ? 'Comentários da Ocorrência' : 'Descrição do Problema'}
                </label>
                <div className="relative">
                  <textarea
                    id="problem-desc"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={activeTab === 'Logístico' ? 'Descreva os detalhes da ocorrência logística...' : 'Detalhe o ocorrido...'}
                    rows={4}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all placeholder:text-gray-400 text-gray-800 resize-none"
                  />
                </div>
              </div>

              {/* Evidences Attach Camera zone */}
              <div className="group">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Anexar Evidências
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div 
                  onClick={handleAttachClick}
                  className="relative w-full aspect-video sm:h-44 border-2 border-dashed border-gray-300 hover:border-[#00236f] rounded-xl bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/10 transition-all group-active:scale-[0.98]"
                >
                  <div className="bg-blue-50 p-3 rounded-full mb-2">
                    <Camera className="w-6 h-6 text-[#00236f]" />
                  </div>
                  <p className="font-bold text-xs text-[#00236f]">Toque para carregar fotos / tirar foto</p>
                  <p className="text-[10px] text-gray-400 mt-1">Formatos suportados: JPG, PNG (máx 10MB)</p>
                  {uploadedImages.length > 0 && (
                    <span className="absolute top-3 right-3 bg-[#006c49] text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                      {uploadedImages.length} foto(s)
                    </span>
                  )}
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {uploadedImages.map((img) => (
                      <div key={img.id} className="relative aspect-square border border-gray-200 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                        <img 
                          src={img.url} 
                          alt={img.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={(e) => handleRemoveImage(img.id, e)}
                          className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-all active:scale-90 z-20"
                          title="Remover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 truncate text-center">
                          {img.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
              
              {/* Customer Reason for Remanejamento */}
              <div className="group">
                <label htmlFor="customer-reason" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Razão do cliente
                </label>
                <div className="relative flex items-center">
                  <Brain className="absolute left-3.5 w-5 h-5 text-gray-400" />
                  <input
                    id="customer-reason"
                    type="text"
                    value={customerReason}
                    onChange={(e) => setCustomerReason(e.target.value)}
                    placeholder="Qual a justificativa do cliente?"
                    className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all text-gray-800"
                  />
                </div>
              </div>

              {/* Number of sales goal target route */}
              <div className="group">
                <label htmlFor="sales-number" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Número de vendas para quem o cliente seguirá
                </label>
                <div className="relative flex items-center">
                  <Hash className="absolute left-3.5 w-5 h-5 text-gray-400" />
                  <input
                    id="sales-number"
                    type="text"
                    value={vendasNumber}
                    onChange={(e) => setVendasNumber(e.target.value)}
                    placeholder="Ex: VN-2024-001"
                    className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all text-gray-800"
                  />
                </div>
              </div>

              {/* Transfer explanation text area reason */}
              <div className="group">
                <label htmlFor="transfer-reason" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Motivo da transferência
                </label>
                <div className="relative">
                  <textarea
                    id="transfer-reason"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Explique por que o remanejamento é necessário..."
                    rows={4}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent transition-all placeholder:text-gray-400 text-gray-800 resize-none"
                  />
                </div>
              </div>

              {/* process guide information warning alert */}
              <div className="p-4 bg-emerald-50 text-[#00714d] border border-emerald-100 rounded-xl flex gap-3 items-start">
                <Info className="w-5 h-5 text-[#00714d] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs">Informação de Processo</p>
                  <p className="text-[11px] text-emerald-800 font-medium mt-1 leading-normal">
                    Remanejamentos exigem aprovação da gerência regional antes do processamento logístico.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Submission action submit CTA button */}
          <div className="pt-4">
            <button
              id="submit-ticket-btn"
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all duration-300 shadow-lg ${submitSuccess ? 'bg-[#006c49] text-white scale-[1.02]' : 'bg-[#001f66] hover:bg-[#00164e] text-white active:scale-95'}`}
            >
              {submitSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 animate-bounce" />
                  Enviado com Sucesso!
                </>
              ) : isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando no ERP...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Criar Chamado
                </>
              )}
            </button>
          </div>

        </form>
          </div>
        )}
      </main>

      {/* Navigation bottom bar menu options list layout */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#f7f9fb] border-t border-gray-200 flex justify-around items-center h-16 px-4">
        <button onClick={() => setScreen('dashboard')} className="flex flex-col items-center justify-center text-gray-500 hover:text-[#00236f] transition-all">
          <History className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Painel</span>
        </button>
        <button onClick={() => handleTabChange('ADM')} className="flex flex-col items-center justify-center bg-blue-50 text-[#00236f] rounded-full px-4.5 py-1">
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Novo Chamado</span>
        </button>
         <button 
          onClick={() => {
            localStorage.setItem('open_status_modal', 'true');
            setScreen('dashboard');
          }} 
          className="flex flex-col items-center justify-center text-gray-500 hover:text-[#00236f] transition-all"
          title="Ver Status dos Chamados"
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Status</span>
        </button>
        <button 
          onClick={logout} 
          className="flex flex-col items-center justify-center text-gray-500 hover:text-red-600 transition-all"
          title="Sair da Conta"
        >
          <X className="w-5 h-5" />
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
