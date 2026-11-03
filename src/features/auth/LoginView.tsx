import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Informe seu nome de usuário.');
      return;
    }
    if (!password) {
      setError('Informe sua senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || 'Falha ao autenticar.');
      }
    } catch {
      setError('Erro ao processar login. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Topo com Logo */}
          <div className="pt-8 pb-6 px-8 text-center border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
            <div className="inline-block p-2 mb-3">
              <img
                src="/Assets/logoENG.svg"
                alt="EngenhArq"
                className="h-12 w-auto mx-auto object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-[#373535] tracking-tight">
              Central de Marketing
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Acesso exclusivo para a equipe de Marketing
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#DE3A39]" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                Nome de usuário
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: Eduardo Dev"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50/50 border border-gray-300 rounded-lg text-[#373535] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DE3A39] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                Senha
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50/50 border border-gray-300 rounded-lg text-[#373535] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DE3A39] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#DE3A39] hover:bg-[#C52B2A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DE3A39] transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé informativo */}
          <div className="px-8 py-3.5 bg-gray-50 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400">
              EngenhArq Construtora &bull; Sistema Interno v1.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
