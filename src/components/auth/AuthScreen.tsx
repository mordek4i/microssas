import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  RefreshCw, 
  ArrowLeft, 
  Mail, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  AlertCircle
} from 'lucide-react';

export type AuthScreenMode = 'signup' | 'login' | 'forgot_password' | 'reset_password';

interface AuthScreenProps {
  initialMode?: AuthScreenMode;
  onBackToHome: () => void;
  onSuccessSignup: (name: string, email: string, password: string) => Promise<void> | void;
  onSuccessLogin: (email: string, password: string) => Promise<void> | void;
  onRequestPasswordReset?: (email: string) => Promise<{ success: boolean; error?: string }>;
  onResetPassword?: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'signup',
  onBackToHome,
  onSuccessSignup,
  onSuccessLogin,
  onRequestPasswordReset,
  onResetPassword
}) => {
  const [mode, setMode] = useState<AuthScreenMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Specific states for password recovery
  const [forgotEmailSent, setForgotEmailSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync mode if initialMode prop changes (e.g. from parent redirection)
  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
  }, [initialMode]);

  // Resend email countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
      } else if (mode === 'login') {
        if (!email.trim() || !password.trim()) {
          setErrorMessage('Por favor, preencha seu e-mail e senha.');
          setIsLoading(false);
          return;
        }
        await onSuccessLogin(email.trim(), password.trim());
      } else if (mode === 'forgot_password') {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
          setErrorMessage('Por favor, informe seu e-mail cadastrado.');
          setIsLoading(false);
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          setErrorMessage('Por favor, informe um formato de e-mail válido.');
          setIsLoading(false);
          return;
        }

        if (onRequestPasswordReset) {
          const res = await onRequestPasswordReset(cleanEmail);
          if (res.success) {
            setForgotEmailSent(true);
            setResendCooldown(60);
          } else {
            setErrorMessage(res.error || 'Não foi possível enviar o e-mail de recuperação. Tente novamente.');
          }
        }
      } else if (mode === 'reset_password') {
        const cleanPass = password.trim();
        const cleanConfirm = confirmPassword.trim();

        if (!cleanPass) {
          setErrorMessage('Por favor, digite sua nova senha.');
          setIsLoading(false);
          return;
        }
        if (cleanPass.length < 6) {
          setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
          setIsLoading(false);
          return;
        }
        if (cleanPass !== cleanConfirm) {
          setErrorMessage('As senhas digitadas não coincidem. Verifique e tente novamente.');
          setIsLoading(false);
          return;
        }

        if (onResetPassword) {
          const res = await onResetPassword(cleanPass);
          if (res.success) {
            setResetSuccess(true);
            setPassword('');
            setConfirmPassword('');
          } else {
            setErrorMessage(res.error || 'Erro ao redefinir a senha. O link pode ter expirado.');
          }
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendResetEmail = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (onRequestPasswordReset && email.trim()) {
        const res = await onRequestPasswordReset(email.trim().toLowerCase());
        if (res.success) {
          setResendCooldown(60);
        } else {
          setErrorMessage(res.error || 'Erro ao reenviar e-mail.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao reenviar e-mail.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans text-slate-900 selection:bg-[#16a34a] selection:text-white">
      {/* LEFT PANEL: Dark Branding Hero */}
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
            {mode === 'reset_password'
              ? 'Segurança em primeiro lugar.'
              : mode === 'forgot_password'
              ? 'Recupere o acesso à sua agenda.'
              : 'Sua agenda cheia, sem esforço.'}
          </h2>
          <p className="text-sm sm:text-base text-gray-300 font-normal leading-relaxed mt-4 max-w-md">
            {mode === 'reset_password'
              ? 'Crie sua nova senha para continuar gerenciando suas reservas com total tranquilidade.'
              : mode === 'forgot_password'
              ? 'Enviaremos um link exclusivo e seguro para o seu e-mail para que você possa redefinir sua senha.'
              : 'Receba reservas 24 horas por dia e acompanhe tudo em um único painel.'}
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

          {/* VIEW: FORGOT PASSWORD - SUCCESS CARD */}
          {mode === 'forgot_password' && forgotEmailSent ? (
            <div className="space-y-6 animate-fade-in-up">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                <Mail className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                  Verifique seu e-mail
                </h1>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Enviamos um link de recuperação para <span className="font-semibold text-gray-900">{email}</span>. Clique no link recebido para criar sua nova senha.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Não encontrou? Verifique sua caixa de spam ou lixo eletrônico. O link é de uso único.</span>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleResendResetEmail}
                  disabled={resendCooldown > 0 || isLoading}
                  className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 font-semibold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : resendCooldown > 0 ? (
                    <span>Reenviar e-mail em {resendCooldown}s</span>
                  ) : (
                    <span>Reenviar e-mail</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotEmailSent(false);
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Voltar para o login</span>
                </button>
              </div>
            </div>
          ) : mode === 'reset_password' && resetSuccess ? (
            /* VIEW: RESET PASSWORD - SUCCESS CARD */
            <div className="space-y-6 animate-fade-in-up">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                  Senha redefinida com sucesso!
                </h1>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Sua nova senha foi salva. Agora você já pode entrar na sua conta com suas novas credenciais.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetSuccess(false);
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold py-3.5 px-4 rounded-xl text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Entrar com a nova senha</span>
                  <span className="text-lg leading-none">→</span>
                </button>
              </div>
            </div>
          ) : (
            /* VIEW: STANDARD FORMS (SIGNUP, LOGIN, FORGOT_PASSWORD, RESET_PASSWORD) */
            <>
              {/* Form Header */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                  {mode === 'signup' && 'Criar conta'}
                  {mode === 'login' && 'Entrar na conta'}
                  {mode === 'forgot_password' && 'Recuperar senha'}
                  {mode === 'reset_password' && 'Definir nova senha'}
                </h1>
                <p className="text-sm text-gray-500">
                  {mode === 'signup' && 'Comece a receber reservas em minutos.'}
                  {mode === 'login' && 'Acesse seu painel para gerenciar suas reservas.'}
                  {mode === 'forgot_password' && 'Informe seu e-mail para receber as instruções de recuperação.'}
                  {mode === 'reset_password' && 'Crie uma nova senha de no mínimo 6 caracteres.'}
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

                {/* Email field (signup, login, forgot_password) */}
                {mode !== 'reset_password' && (
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
                )}

                {/* Password field (signup, login, reset_password) */}
                {mode !== 'forgot_password' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        {mode === 'reset_password' ? 'Nova senha' : 'Senha'}
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => {
                            setErrorMessage(null);
                            setMode('forgot_password');
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-medium cursor-pointer"
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'login' ? 'Sua senha' : 'Mínimo 6 caracteres'}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Password field (reset_password) */}
                {mode === 'reset_password' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Confirmar nova senha
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita sua nova senha"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Dynamic Password Validation Indicators */}
                    <div className="mt-2.5 space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className={password.length >= 6 ? 'text-emerald-700 font-medium' : ''}>
                          Pelo menos 6 caracteres
                        </span>
                      </div>
                      {confirmPassword.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword ? 'bg-emerald-500' : 'bg-red-400'}`} />
                          <span className={password === confirmPassword ? 'text-emerald-700 font-medium' : 'text-red-600'}>
                            {password === confirmPassword ? 'Senhas coincidem' : 'Senhas não coincidem'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                  ) : mode === 'login' ? (
                    <>
                      <span>Entrar no painel</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  ) : mode === 'forgot_password' ? (
                    <>
                      <span>Enviar link de recuperação</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  ) : (
                    <>
                      <span>Salvar nova senha</span>
                      <span className="text-lg leading-none">→</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer Switch Links */}
              <div className="pt-2 text-center space-y-4">
                <p className="text-xs text-gray-600">
                  {mode === 'signup' && (
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
                  )}

                  {mode === 'login' && (
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

                  {mode === 'forgot_password' && (
                    <>
                      Lembrou sua senha?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setMode('login');
                        }}
                        className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                      >
                        Voltar para o login
                      </button>
                    </>
                  )}

                  {mode === 'reset_password' && (
                    <>
                      Deseja cancelar?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          onBackToHome();
                        }}
                        className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                      >
                        Voltar ao início
                      </button>
                    </>
                  )}
                </p>

                {mode !== 'reset_password' && (
                  <div>
                    <button
                      type="button"
                      onClick={onBackToHome}
                      className="text-xs text-gray-500 hover:text-gray-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>← Voltar ao início</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
