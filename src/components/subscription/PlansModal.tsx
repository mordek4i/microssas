import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  ExternalLink,
  Crown
} from 'lucide-react';
import type { UserProfile } from '../../types';

export interface PlanItem {
  id: string;
  name: string;
  price: string;
  period: string;
  periodDescription: string;
  link: string;
  badge: string | null;
  highlight: boolean;
  features: string[];
}

export const PLANS_DATA: PlanItem[] = [
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

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
  trialDaysLeft?: number;
}

export const PlansModal: React.FC<PlansModalProps> = ({
  isOpen,
  onClose,
  user,
  trialDaysLeft
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Close on ESC key and prevent body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSelectPlan = (link: string) => {
    const checkoutUrl = user?.email
      ? `${link}?email=${encodeURIComponent(user.email)}`
      : link;
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plans-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 15 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-5xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="relative px-6 pt-6 pb-4 sm:px-8 sm:pt-7 sm:pb-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar modal de planos"
                className="absolute top-5 right-5 sm:top-6 sm:right-6 p-2 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Planos & Assinatura ReservaZen</span>
                </div>
                <h2 id="plans-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Escolha o melhor plano para o seu negócio
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Garanta acesso completo, ilimitado e sem interrupções à sua agenda, clientes e página pública de reservas.
                </p>
              </div>

              {/* Trial Days Alert Badge */}
              {trialDaysLeft !== undefined && trialDaysLeft > 0 && (
                <div className="mt-4 flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs font-medium">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <p>
                    <span className="font-extrabold text-amber-900">
                      Você está no período de teste grátis ({trialDaysLeft} {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}).
                    </span>{' '}
                    Ao assinar, sua conta continua ativa sem risco de pausa ou bloqueio de agenda.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Body / Plans Grid */}
            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
                {PLANS_DATA.map((plan) => {
                  const isHighlighted = plan.highlight;

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
                        isHighlighted
                          ? 'bg-gradient-to-b from-emerald-50/70 via-white to-white border-2 border-[#10b981] shadow-xl shadow-emerald-500/10'
                          : 'bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {/* Top Badge */}
                      {plan.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex justify-center w-max max-w-[90%] z-10">
                          <span className="bg-[#10b981] text-white text-[10px] font-black px-3.5 py-0.5 rounded-full shadow-xs uppercase tracking-wide whitespace-nowrap inline-flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      <div className="space-y-5">
                        {/* Plan Header */}
                        <div>
                          <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                          <p className="text-xs text-slate-500 mt-1">{plan.periodDescription}</p>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-1.5 pb-2 border-b border-slate-100">
                          <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            {plan.price}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{plan.period}</span>
                        </div>

                        {/* Features */}
                        <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                              <span className="leading-snug">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CTA Button */}
                      <div className="pt-6 mt-4">
                        <button
                          type="button"
                          onClick={() => handleSelectPlan(plan.link)}
                          className={`w-full py-3.5 px-5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-xs ${
                            isHighlighted
                              ? 'bg-[#10b981] hover:bg-[#059669] text-white shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <span>Assinar {plan.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Guarantee */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-center sm:justify-between gap-4 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Checkout 100% seguro via Cakto</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Acesso ativado automaticamente</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Sem multas ou fidelidade</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
