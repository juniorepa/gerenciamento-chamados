import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Ticket, User as UserIcon, UserPlus, QrCode, Smartphone, X, Copy, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginScreen: React.FC = () => {
  const { loginWithSupabase, signUpWithSupabase, setScreen } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentUrl = window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!name.trim()) {
      setError('Por favor, preencha seu nome completo.');
      return;
    }
    if (!cleanEmail) {
      setError('Por favor, preencha seu endereço de e-mail.');
      return;
    }
    if (!password) {
      setError('Por favor, preencha sua senha.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    if (isRegister) {
      // Supabase Sign Up
      const { error: signUpErr } = await signUpWithSupabase(cleanEmail, password, name.trim());
      if (signUpErr) {
        setError(signUpErr);
        setLoading(false);
      } else {
        setSuccess('Sua conta foi criada com sucesso! Faça login abaixo para entrar.');
        setIsRegister(false);
        setLoading(false);
      }
    } else {
      // Supabase Sign In
      const { error: signInErr } = await loginWithSupabase(cleanEmail, password, name.trim());
      if (signInErr) {
        if (signInErr === 'usuário nao cadastrado') {
          setName('');
          setEmail('');
          setPassword('');
          setError('usuário nao cadastrado');
        } else {
          setError(signInErr);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-12 px-6 bg-gradient-to-b from-[#f0f4f8] to-[#e1e9f0]">
      {/* Spacer / Logo Header */}
      <div className="flex flex-col items-center mt-4">
        {/* Blue ticket icon card container */}
        <div className="w-16 h-16 bg-[#00236f] rounded-2xl flex items-center justify-center shadow-lg mb-6">
          <Ticket className="w-8 h-8 text-white rotate-[-10deg]" />
        </div>
        
        <h1 className="text-2xl font-extrabold text-[#00236f] tracking-tight text-center">
          Gerenciamento de Chamados
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1.5 text-center">
          Fluxo de pós-venda com Autenticação Supabase
        </p>
      </div>

      {/* Main Card Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md mx-auto my-8 bg-white border border-gray-100 rounded-[24px] p-8 shadow-xl shadow-[#00236f]/5"
      >
        <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
          {isRegister ? 'Criar nova conta' : 'Bem-vindo de volta'}
        </h2>
        <p className="text-sm text-gray-500 mb-6 font-normal">
          {isRegister 
            ? 'Preencha os campos abaixo para registrar um novo agente de suporte.'
            : 'Por favor, insira suas credenciais para acessar o painel.'}
        </p>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-100 mb-6">
          <button
            id="tab-login"
            type="button"
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
              !isRegister
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => {
              setIsRegister(false);
              setError('');
              setSuccess('');
            }}
          >
            Entrar
          </button>
          <button
            id="tab-register"
            type="button"
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
              isRegister
                ? 'border-[#00236f] text-[#00236f]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => {
              setIsRegister(true);
              setError('');
              setSuccess('');
            }}
          >
            Criar Conta
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg font-medium mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name input field */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Seu Nome / Nome Completo
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Junior"
                className="w-full h-12 pl-11 pr-4 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent focus:bg-white transition-all text-gray-800"
                required
              />
            </div>
          </div>

          {/* Email input field */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Endereço de E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="w-full h-12 pl-11 pr-4 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent focus:bg-white transition-all text-gray-800"
                required
              />
            </div>
          </div>

          {/* Password input field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Senha
              </label>
              {!isRegister && (
                <button 
                  type="button"
                  className="text-[11px] font-bold text-[#00236f] hover:underline"
                  onClick={() => {
                    if (email.trim()) {
                      localStorage.setItem('reset_email_preset', email.trim());
                    }
                    setScreen('reset-password');
                  }}
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-11 pr-11 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent focus:bg-white transition-all tracking-widest text-gray-800"
                required
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Keep logged in checkbox */}
          {!isRegister && (
            <div className="flex items-center">
              <input
                id="keep-logged-in"
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="w-4.5 h-4.5 text-[#00236f] border-gray-300 rounded focus:ring-[#00236f]"
              />
              <label htmlFor="keep-logged-in" className="ml-2.5 text-xs text-gray-600 font-medium select-none cursor-pointer">
                Mantenha-me conectado
              </label>
            </div>
          )}

          {/* Action Button */}
          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            className={`w-full h-12 bg-[#001f66] hover:bg-[#00164e] text-white rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors shadow-lg shadow-[#001f66]/20 active:scale-[0.98] transform ${loading ? 'opacity-85 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isRegister ? (
              <>
                <span>Registrar Agente</span>
                <UserPlus className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Entrar no Painel</span>
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Interactive Mobile Testing Trigger */}
      <div className="flex flex-col items-center gap-3 mt-2 mb-4">
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-xs font-bold text-[#00236f] rounded-full border border-gray-150 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Smartphone className="w-4 h-4 text-emerald-500" />
          <span>Testar no Celular (Android / iOS)</span>
          <QrCode className="w-3.5 h-3.5 text-gray-400 ml-1" />
        </button>
      </div>

      {/* Footer message */}
      <div className="text-center text-[10px] font-semibold text-gray-400">
        Desenvolvido com integração em tempo real via Supabase.
      </div>

      {/* QR Code Scan Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm">
            {/* Modal backdrop closer */}
            <div className="absolute inset-0" onClick={() => setShowQrModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-sm p-6 bg-white border border-gray-150 rounded-3xl shadow-2xl z-10 overflow-hidden"
            >
              {/* Corner Close button */}
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3.5 border border-emerald-100 shadow-inner">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                </div>
                
                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                  Acessar no Smartphone
                </h3>
                <p className="text-xs text-gray-400 mt-1 max-w-[240px] leading-relaxed">
                  Escaneie o código QR abaixo com a câmera do seu celular para abrir o aplicativo de testes imediatamente.
                </p>

                {/* QR Code Image Container */}
                <div className="my-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner relative flex items-center justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code do Aplicativo"
                    className="w-48 h-48 rounded-lg select-none mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Steps/Instructions */}
                <div className="w-full text-left bg-[#f8fafc] p-3.5 rounded-xl border border-gray-100 mb-4">
                  <span className="block text-[10px] font-bold text-[#00236f] uppercase tracking-wider mb-1.5">
                    Como conectar:
                  </span>
                  <ol className="text-[11px] text-gray-500 space-y-1 list-decimal list-inside leading-relaxed font-medium">
                    <li>Abra o app de câmera do seu Android ou iOS.</li>
                    <li>Aponte para o código QR acima.</li>
                    <li>Clique na notificação do link para carregar o sistema.</li>
                  </ol>
                </div>

                {/* Alternativa: Copy Link */}
                <div className="w-full">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Alternativa: Copiar Link de Teste
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentUrl}
                      className="flex-1 h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[11px] text-gray-500 font-mono focus:outline-none overflow-ellipsis"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className={`h-9 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                        copied 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-[#00236f] text-white hover:bg-[#001c5c]'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
