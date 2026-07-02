import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldAlert, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';

export const ResetPasswordScreen: React.FC = () => {
  const { resetPasswordWithSupabase, setScreen } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load pre-filled email from login screen
  useEffect(() => {
    const prefilled = localStorage.getItem('reset_email_preset');
    if (prefilled) {
      setEmail(prefilled);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Por favor, preencha seu endereço de e-mail.');
      return;
    }

    if (!password) {
      setError('Por favor, defina uma nova senha.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await resetPasswordWithSupabase(cleanEmail, password);
      if (res.error) {
        setError(String(res.error));
      } else {
        setSuccess('Senha redefinida com sucesso! Você já pode entrar no painel com sua nova senha.');
        localStorage.removeItem('reset_email_preset');
        // Clear fields
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar a solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-b from-blue-50/50 to-white">
      {/* Back button */}
      <button
        type="button"
        onClick={() => {
          localStorage.removeItem('reset_email_preset');
          setScreen('login');
        }}
        className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors bg-white rounded-lg border border-gray-150 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para o Login
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-8 bg-white border border-gray-100 rounded-3xl shadow-xl shadow-blue-900/5"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-blue-50 text-[#00236f] rounded-2xl flex items-center justify-center mb-4 border border-blue-100 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Redefinir Senha</h2>
          <p className="text-xs text-gray-400 mt-1.5 max-w-[280px] leading-relaxed">
            Informe seu e-mail de agente cadastrado e defina a nova senha de acesso.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium mb-5 flex items-start gap-2 border border-red-100">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 text-green-700 text-xs rounded-lg font-medium mb-5 border border-green-100 leading-relaxed">
            {success}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-5">
          {/* Email input field */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Seu E-mail Cadastrado
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="reset-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="w-full h-12 pl-11 pr-4 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent focus:bg-white transition-all text-gray-800"
                required
              />
            </div>
          </div>

          {/* New Password field */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="reset-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
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

          {/* Confirm New Password field */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="reset-confirm-password-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full h-12 pl-11 pr-11 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent focus:bg-white transition-all tracking-widest text-gray-800"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="reset-submit-btn"
            type="submit"
            disabled={loading}
            className={`w-full h-12 bg-[#001f66] hover:bg-[#00164e] text-white rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors shadow-lg shadow-[#001f66]/20 active:scale-[0.98] transform ${loading ? 'opacity-85 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Salvar Nova Senha'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
