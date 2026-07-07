import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldAlert, KeyRound, CheckCircle, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export const ResetPasswordScreen: React.FC = () => {
  const { resetPasswordWithSupabase, setScreen, currentUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // isRecovering is true if the user accessed the app via a recovery link (type=recovery)
  const [isRecovering, setIsRecovering] = useState(() => {
    return localStorage.getItem('is_recovering_password') === 'true';
  });

  // Load pre-filled email from login screen
  useEffect(() => {
    const prefilled = localStorage.getItem('reset_email_preset');
    if (prefilled) {
      setEmail(prefilled);
    }
  }, []);

  // Monitor URL hash/query changes for password recovery signals
  useEffect(() => {
    const checkUrlRecovery = () => {
      const hash = window.location.hash || '';
      if (hash.includes('type=recovery') || hash.includes('access_token=')) {
        localStorage.setItem('is_recovering_password', 'true');
        setIsRecovering(true);
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('type') === 'recovery') {
        localStorage.setItem('is_recovering_password', 'true');
        setIsRecovering(true);
      }
    };

    checkUrlRecovery();
    window.addEventListener('hashchange', checkUrlRecovery);
    return () => window.removeEventListener('hashchange', checkUrlRecovery);
  }, []);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Por favor, preencha seu endereço de e-mail.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await resetPasswordWithSupabase(cleanEmail);
      if (res.error) {
        setError(String(res.error));
      } else {
        setSuccess('Um link seguro de redefinição foi enviado para o seu e-mail! Verifique a caixa de entrada (e a pasta de Spam) para prosseguir.');
        localStorage.removeItem('reset_email_preset');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar a solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (currentUser?.email || email || localStorage.getItem('reset_email_preset') || '').trim();

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
      const res = await resetPasswordWithSupabase(cleanEmail || 'usuario@empresa.com', password);
      if (res.error) {
        setError(String(res.error));
      } else {
        setSuccess('Sua nova senha foi salva e ativada com sucesso! Você será redirecionado para a tela de login.');
        localStorage.removeItem('is_recovering_password');
        localStorage.removeItem('reset_email_preset');
        setPassword('');
        setConfirmPassword('');
        
        // Force log out of the temporary recovery session so they can log in fresh
        try {
          await supabase.auth.signOut();
        } catch {}

        setTimeout(() => {
          setIsRecovering(false);
          setScreen('login');
        }, 3500);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar a nova senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-b from-blue-50/50 to-white">
      {/* Back button */}
      <button
        type="button"
        onClick={async () => {
          localStorage.removeItem('is_recovering_password');
          localStorage.removeItem('reset_email_preset');
          try {
            await supabase.auth.signOut();
          } catch {}
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
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {isRecovering ? 'Definir Nova Senha' : 'Recuperar Acesso'}
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 max-w-[280px] leading-relaxed">
            {isRecovering 
              ? 'Seu link seguro foi verificado. Defina uma nova senha forte de acesso para a sua conta.'
              : 'Informe seu e-mail cadastrado e enviaremos um link de recuperação seguro para redefinir sua senha.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium mb-5 flex items-start gap-2 border border-red-100">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 text-green-700 text-xs rounded-lg font-medium mb-5 border border-green-100 leading-relaxed flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {isRecovering ? (
          /* MODE 2: UPDATE PASSWORD FORM (LINK CLICKED) */
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Nova Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="reset-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-12 pl-11 pr-11 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent focus:bg-white transition-all tracking-wider text-gray-800"
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
                  className="w-full h-12 pl-11 pr-11 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:border-transparent focus:bg-white transition-all tracking-wider text-gray-800"
                  required
                />
              </div>
            </div>

            <button
              id="reset-submit-btn"
              type="submit"
              disabled={loading}
              className={`w-full h-12 bg-[#001f66] hover:bg-[#00164e] text-white rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors shadow-lg shadow-[#001f66]/20 active:scale-[0.98] transform ${loading ? 'opacity-85 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Atualizar Senha de Acesso</span>
              )}
            </button>
          </form>
        ) : (
          /* MODE 1: REQUEST RECOVERY LINK FORM */
          <form onSubmit={handleRequestLink} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                E-mail Cadastrado
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

            <button
              id="reset-submit-btn"
              type="submit"
              disabled={loading}
              className={`w-full h-12 bg-[#001f66] hover:bg-[#00164e] text-white rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors shadow-lg shadow-[#001f66]/20 active:scale-[0.98] transform ${loading ? 'opacity-85 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Link de Recuperação</span>
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
