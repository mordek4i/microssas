import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  LogOut, 
  ExternalLink,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import type { UserProfile, SubscriptionStatus } from '../../types';

interface SubscriptionBlockedScreenProps {
  user: UserProfile;
  onLogout: () => void;
  onRefreshStatus?: () => Promise<void>;
}

export const SubscriptionBlockedScreen: React.FC<SubscriptionBlockedScreenProps> = ({
  user,
  onLogout,
  onRefreshStatus
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const status: SubscriptionStatus = user.subscription?.status || 'canceled';

  const plans = [
    {
      id: 'mensal',
      name: 'Mensal',
      price: 'R$ 49,90',
      period: '/mês',
      periodDescription: 'Cobrança mensal recorrente',
      link: 'https://pay.cakto.com.br/w7fsixo_1162376',
      badge: null,
      highlight: false,
      features: [
        'Acesso completo a todas as ferramentas',
        'Página pública exclusiva de reservas',
        'Agendamentos e clientes ilimitados',
        'Lembretes e notificações automáticas',
        'Sem fidelidade, cancele quando quiser'
      ]
    },
    {
      id: 'semestral',
      name: 'Semestral',
      price: 'R$ 249,90',
      period: 'por 6 meses',
      periodDescription: 'Equivale a apenas R$ 41,65/mês',
      link: 'https://pay.cakto.com.br/rteo4xn',
      badge: 'Mais escolhido',
      highlight: true,
      features: [
        'Acesso completo a todas as ferramentas',
        'Página pública exclusiva de reservas',
        'Agendamentos e clientes ilimitados',
        'Lembretes e notificações automáticas',
        'Economia garantida por 6 meses'
      ]
    },
    {
      id: 'anual',
      name: 'Anual',
      price: 'R$ 399,90',
      period: 'por 12 meses',
      periodDescription: 'Equivale a apenas R$ 33,32/mês',
      link: 'https://pay.cakto.com.br/37ouyrk',
      badge: 'Melhor custo-benefício',
      highlight: false,
      features: [
        'Acesso completo a todas as ferramentas',
        'Página pública exclusiva de reservas',
        'Agendamentos e clientes ilimitados',
        'Lembretes e notificações automáticas',
        'Maior economia anual garantida'
      ]
    }
  ];

  // Auto-check subscription on window focus and background polling
  useEffect(() => {
    if (!onRefreshStatus) return;

    const handleFocus = async () => {
      try {
        await onRefreshStatus();
      } catch {}
    };

    window.addEventListener('focus', handleFocus);
    const interval = setInterval(handleFocus, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [onRefreshStatus]);

  const handleSelectPlan = (link: string) => {
    const checkoutUrl = user.email
      ? `${link}?email=${encodeURIComponent(user.email)}`
      : link;
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  };

  const handleManualCheck = async () => {
    if (!onRefreshStatus || isVerifying) return;
    setIsVerifying(true);
    setVerifyMessage(null);
    try {
      await onRefreshStatus();
      setVerifyMessage('Aguardando confirmação do pagamento pela Cakto. Assim que a transação for processada, seu acesso será liberado automaticamente.');
    } catch {
      setVerifyMessage('Não foi possível verificar no momento. Tente novamente em alguns segundos.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (status === 'chargeback') {
    return (
      <div className="min-h-screen bg-[#f8f8f6] text-slate-900 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-[#bde870]">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-200/60 mb-6">
          <img src="/reservazen-logo-tight.png" alt="ReservaZen Logo" className="h-10 sm:h-12 w-auto object-contain" />
          <button onClick={onLogout} className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            Sair da conta
          </button>
        </div>
        <div className="max-w-md mx-auto w-full my-auto py-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border bg-red-100 text-red-900 border-red-200">
                Disputa de Pagamento (Chargeback)
              </div>
              <h1 className="text-xl font-black text-slate-900">Acesso bloqueado por Chargeback</h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identificamos uma contestação de pagamento junto à operadora do seu cartão. O acesso ao ReservaZen permanece suspenso. Se você acredita que houve um equívoco, entre em contato com nosso suporte.
              </p>
            </div>
            <div className="pt-2 space-y-2">
              <a
                href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20minha%20conta%20no%20ReservaZen"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <span>Falar com o Suporte</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </a>
              <button
                onClick={onLogout}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Voltar para o Início / Trocar de Conta
              </button>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-slate-400 py-4">
          ReservaZen © 2026 — Menos confusão, mais controle sobre suas reservas.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] text-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#bde870]">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-200/60 mb-6">
        <div className="flex items-center gap-3">
          <img
            src="/reservazen-logo-tight.png"
            alt="ReservaZen Logo"
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900">{user.name}</span>
            <span className="text-[11px] text-slate-500">{user.email}</span>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full my-auto py-6">
        {/* Title & Subtitle */}
        <div className="text-center space-y-3 mb-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Planos Oficiais</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Continue usando o ReservaZen
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Escolha um plano para continuar organizando suas reservas, clientes e agenda.
          </p>
        </div>

        {/* 3 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto">
          {plans.map((plan) => {
            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative bg-white ${
                  plan.highlight
                    ? 'border-2 border-emerald-500 shadow-xl ring-4 ring-emerald-500/10 md:-translate-y-2'
                    : 'border border-slate-200 shadow-md hover:shadow-lg'
                }`}
              >
                {/* Visual Highlights Badges */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs ${
                        plan.highlight
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Header */}
                  <div className="text-left space-y-1 mb-6">
                    <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                    <div className="flex items-baseline gap-1.5 pt-2">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{plan.period}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {plan.periodDescription}
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="pt-4 border-t border-slate-100 space-y-3 mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      O que está incluído:
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Plan Action CTA */}
                <div className="pt-2">
                  <button
                    onClick={() => handleSelectPlan(plan.link)}
                    className={`w-full font-black py-3.5 px-6 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
                      plan.highlight
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Continuar com este plano</span>
                    <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification & Return Flow */}
        <div className="mt-10 max-w-xl mx-auto text-center space-y-3">
          <button
            onClick={handleManualCheck}
            disabled={isVerifying}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-full border border-slate-200 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verificando no Supabase...' : 'Já realizei o pagamento? Verificar acesso'}</span>
          </button>

          {verifyMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 animate-fade-in max-w-md mx-auto">
              {verifyMessage}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pagamento 100% seguro via Cakto • Liberação automática do acesso</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4 border-t border-slate-200/40">
        ReservaZen © 2026 — Menos confusão, mais controle sobre suas reservas.
      </div>
    </div>
  );
};
