import { useApp } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Ticket, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { AuthService } from '../services/authService';

export const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('juniorepa@gmail.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Usar novo AuthService com validações robustas
      const response = await AuthService.login({
        email: email.trim().toLowerCase(),
        password
      });

      if (!response.success) {
        setError(response.error?.message || 'Erro ao fazer login');
        setLoading(false);
        return;
      }

      // Login bem-sucedido
      if (response.user) {
        login(response.user.email, response.user.name, {
          role: response.user.role,
          customerId: response.user.customerId,
          id: response.user.id
        });
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-12 px-6 bg-gradient-to-b from-[#f0f4f8] to-[#e1e9f0]">
      {/* Header */}
      <div className="flex flex-col items-center mt-4">
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

      {/* Login Form */}
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

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email Field */}
          <div className="relative">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#00236f] transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#00236f] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="keep-logged-in"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 rounded border-gray-300 text-[#00236f] focus:ring-0 cursor-pointer disabled:opacity-50"
            />
            <label htmlFor="keep-logged-in" className="text-sm text-gray-600 cursor-pointer">
              Manter-me conectado
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 px-4 bg-[#00236f] hover:bg-[#001a52] text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Test Credentials Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900 mb-2">📝 Credenciais de Teste:</p>
          <div className="space-y-1 text-xs text-blue-800">
            <p><strong>Admin:</strong> adm@empresa.com / 201515</p>
            <p><strong>Support:</strong> juniorepa@gmail.com / password123</p>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 font-medium">
        © 2026 Reliant. Todos os direitos reservados.
      </div>
    </div>
  );
};
