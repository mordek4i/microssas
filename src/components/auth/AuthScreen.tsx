import React, { useState } from 'react';
import { CalendarCheck, RefreshCw, ArrowLeft } from 'lucide-react';

interface AuthScreenProps {
  initialMode?: 'signup' | 'login';
  onBackToHome: () => void;
  onSuccessSignup: (name: string, email: string, password: string) => Promise<void> | void;
  onSuccessLogin: (email: string, password: string) => Promise<void> | void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'signup',
  onBackToHome,
  onSuccessSignup,
  onSuccessLogin
}) => {
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMessage('Por favor, informe seu nome.');
          setIsLoading(false);
          return;
        }
        if (!email.trim() || !password.trim()) {
          setErrorMessage('Por favor, preencha todos os campos.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
          setIsLoading(false);
          return;
        }
        await onSuccessSignup(name.trim(), email.trim(), password.trim());
      } else {
        if (!email.trim() || !password.trim()) {
          setErrorMessage('Por favor, preencha seu e-mail e senha.');
          setIsLoading(false);
          return;
        }
        await onSuccessLogin(email.trim(), password.trim());
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans text-slate-900 selection:bg-[#16a34a] selection:text-white">
      {/* LEFT PANEL: Dark Branding Hero (Matches media_1790895158431.png) */}
      <div 
        className="w-full lg:w-1/2 min-h-[300px] lg:min-h-screen p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden"
        style={{
          backgroundColor: '#0c130e',
          backgroundImage: 'radial-gradient(circle at 15% 85%, rgba(22, 163, 74, 0.22) 0%, rgba(12, 19, 14, 0.98) 60%, #090e0b 100%)'
        }}
      >
        {/* Top Logo */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="w-9 h-9 rounded-xl bg-[#16a34a] flex items-center justify-center text-white shadow-md shadow-emerald-950/60">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Reserva<span className="text-[#22c55e]">Zen</span>
          </span>
        </div>

        {/* Center Content */}
        <div className="my-auto py-12 lg:py-0 z-10 max-w-lg">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-white tracking-tight leading-[1.12]">
            Sua agenda cheia, sem esforço.
          </h2>
          <p className="text-sm sm:text-base text-gray-300 font-normal leading-relaxed mt-4 max-w-md">
            Receba reservas 24 horas por dia e acompanhe tudo em um único painel.
          </p>
        </div>

        {/* Bottom Copyright */}
        <div className="text-xs text-gray-500 z-10 pt-4">
          © 2026 ReservaZen
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white min-h-[500px]">
        <div className="max-w-[400px] w-full space-y-7">
          
          {/* Mobile Back Button */}
          <div className="block lg:hidden">
            <button
              onClick={onBackToHome}
              className="text-xs text-gray-500 hover:text-gray-900 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao início</span>
            </button>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              {mode === 'signup' ? 'Criar conta' : 'Entrar na conta'}
            </h1>
            <p className="text-sm text-gray-500">
              {mode === 'signup'
                ? 'Comece a receber reservas em minutos.'
                : 'Acesse seu painel para gerenciar suas reservas.'}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold leading-relaxed animate-fade-in-up">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Seu nome
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: João Silva"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : 'Sua senha'}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.99] disabled:opacity-60 text-white font-semibold py-3.5 px-4 rounded-xl shadow-xs text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer mt-6"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Aguarde...</span>
                </span>
              ) : mode === 'signup' ? (
                <>
                  <span>Criar minha conta</span>
                  <span className="text-lg leading-none">→</span>
                </>
              ) : (
                <>
                  <span>Entrar no painel</span>
                  <span className="text-lg leading-none">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Switch Links */}
          <div className="pt-2 text-center space-y-4">
            <p className="text-xs text-gray-600">
              {mode === 'signup' ? (
                <>
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('login');
                    }}
                    className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Entrar
                  </button>
                </>
              ) : (
                <>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('signup');
                    }}
                    className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Criar conta
                  </button>
                </>
              )}
            </p>

            <div>
              <button
                type="button"
                onClick={onBackToHome}
                className="text-xs text-gray-500 hover:text-gray-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>← Voltar ao início</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
