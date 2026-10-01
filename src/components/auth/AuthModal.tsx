import React, { useState } from 'react';
import { User, Mail, Lock, X, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signup' | 'login';
  onClose: () => void;
  onSuccessSignup: (name: string, email: string, password: string) => Promise<void> | void;
  onSuccessLogin: (email: string, password: string) => Promise<void> | void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signup',
  onClose,
  onSuccessSignup,
  onSuccessLogin
}) => {
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name || !email || !password) return;
        await onSuccessSignup(name, email, password);
      } else {
        if (!email || !password) return;
        await onSuccessLogin(email, password);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in-up">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/60">
          <button
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-4 text-xs font-black transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 border-b-2 border-[#0d9488]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Criar Minha Conta
          </button>
          <button
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-4 text-xs font-black transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 border-b-2 border-[#0d9488]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Já tenho conta → Entrar
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <img
                src="/reservazen-logo-tight.png"
                alt="ReservaZen Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {mode === 'signup' ? 'Cadastre seu estabelecimento' : 'Bem-vindo de volta!'}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'signup'
                ? 'Preencha seus dados básicos para começar'
                : 'Informe seu e-mail e senha para acessar seu painel'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Seu Nome *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-semibold"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">E-mail *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Senha *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-black py-3.5 px-4 rounded-2xl shadow-sm text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 disabled:opacity-60"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Criar minha conta' : 'Entrar no ReservaZen'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'signup' && (
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200/80 text-[11px] text-teal-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Você escolherá seu plano e configurará seu negócio a seguir.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
