import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Ticket, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const [name, setName] = useState('Junior');
  const [email, setEmail] = useState('juniorepa@gmail.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const isAdm = cleanEmail === 'adm' || cleanEmail === 'adm@empresa.com';

    if (!isAdm && !name.trim()) {
      setError('Por favor, preencha seu nome completo.');
      return;
    }
    if (!email) {
      setError('Por favor, preencha seu endereço de e-mail.');
      return;
    }
    if (!password) {
      setError('Por favor, preencha sua senha.');
      return;
    }
    setError('');

    // Check if they are trying to log in as ADM
    if (isAdm) {
      if (password !== '201515') {
        setError('Senha incorreta para a conta de Administrador (ADM).');
        return;
      }
      // Successful ADM login
      login('adm@empresa.com', 'ADM');
    } else {
      // Normal login with user-provided name
      login(email, name.trim());
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
          Fluxo de pós-venda de nível empresarial
        </p>
      </div>

      {/* Main Card Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md mx-auto my-8 bg-white border border-gray-100 rounded-[24px] p-8 shadow-xl shadow-[#00236f]/5"
      >
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
          Bem-vindo de volta
        </h2>
        <p className="text-sm text-gray-500 mt-2 font-normal">
          Por favor, insira suas credenciais para continuar.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Name input field */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Nome Completo
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
              />
            </div>
          </div>

          {/* Password input field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Senha
              </label>
              <button 
                type="button"
                className="text-[11px] font-bold text-[#00236f] hover:underline"
                onClick={() => alert('Para fins de demonstração, qualquer senha é válida.')}
              >
                Esqueceu a senha?
              </button>
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
          <div className="flex items-center">
            <input
              id="keep-logged-in"
              type="checkbox"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
              className="w-4.5 h-4.5 text-[#00236f] border-gray-300 rounded focus:ring-[#00236f]"
            />
            <label htmlFor="keep-logged-in" className="ml-2.5 text-xs text-gray-600 font-medium select-none cursor-pointer">
              Mantenha-me conectado por 30 dias
            </label>
          </div>

          {/* Sign In Button */}
          <button
            id="login-btn"
            type="submit"
            className="w-full h-12 bg-[#001f66] hover:bg-[#00164e] text-white rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors shadow-lg shadow-[#001f66]/20 active:scale-[0.98] transform"
          >
            Entrar no Painel
            <LogIn className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
          <p className="text-[10px] font-bold text-[#00236f] uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <Lock className="w-3.5 h-3.5 text-[#00236f]" />
            Chave Administrativa (ADM)
          </p>
          <p className="text-xs text-gray-600 leading-normal">
            Para finalizar chamados, faça login com o e-mail <strong className="text-gray-950 font-black">adm</strong>.
          </p>
        </div>
      </motion.div>

      {/* Footer message */}
      <div className="text-center mt-4 text-xs font-semibold text-gray-500">
        Não tem uma conta?{' '}
        <button 
          onClick={() => alert('Entre em contato com o administrador de TI da sua empresa para criar sua conta de agente.')}
          className="text-[#00236f] hover:underline"
        >
          Entre em contato com o administrador
        </button>
      </div>
    </div>
  );
};
