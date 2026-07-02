import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Ticket, User as UserIcon, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

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
                Registrar Agente
                <UserPlus className="w-4 h-4" />
              </>
            ) : (
              <>
                Entrar no Painel
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Footer message */}
      <div className="text-center mt-4 text-xs font-semibold text-gray-500">
        Desenvolvido com integração em tempo real via Supabase.
      </div>
    </div>
  );
};
