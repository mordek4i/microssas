import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert, RotateCcw, ExternalLink } from 'lucide-react';
import type { UserProfile, SubscriptionStatus } from '../../types';

interface SubscriptionBlockedScreenProps {
  user: UserProfile;
  onLogout: () => void;
}

export const SubscriptionBlockedScreen: React.FC<SubscriptionBlockedScreenProps> = ({
  user,
  onLogout
}) => {
  const status: SubscriptionStatus = user.subscription?.status || 'canceled';
  const checkoutUrl = 'https://pay.cakto.com.br/reservazen-pro';

  const getStatusDetails = () => {
    switch (status) {
      case 'expired':
        return {
          badge: 'Período de Teste Encerrado',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
          title: 'Seus 7 dias de teste grátis terminaram',
          message: 'Esperamos que você tenha aproveitado o ReservaZen! Para continuar gerenciando seus agendamentos, clientes e recebendo reservas online sem interrupções, assine o plano oficial.',
          icon: RotateCcw,
          iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
          canReactivate: true,
          ctaText: 'Assinar Plano ReservaZen'
        };
      case 'canceled':
        return {
          badge: 'Assinatura Cancelada',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
          title: 'Sua assinatura do ReservaZen foi cancelada',
          message: 'Seus dados, histórico de clientes e configurações continuam salvos com total segurança. Para voltar a receber reservas e acessar o painel, basta reativar sua assinatura.',
          icon: RotateCcw,
          iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
          canReactivate: true,
          ctaText: 'Reativar Assinatura na Cakto'
        };
      case 'refunded':
        return {
          badge: 'Acesso Reembolsado',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-200',
          title: 'Assinatura cancelada por reembolso',
          message: 'O reembolso da sua compra foi processado e o acesso aos recursos do SaaS foi suspenso conforme as regras da plataforma. Caso tenha sido um engano, você pode assinar novamente a qualquer momento.',
          icon: AlertTriangle,
          iconColor: 'text-rose-600 bg-rose-50 border-rose-200',
          canReactivate: true,
          ctaText: 'Contratar Novo Plano'
        };
      case 'chargeback':
        return {
          badge: 'Disputa de Pagamento (Chargeback)',
          badgeColor: 'bg-red-100 text-red-900 border-red-200',
          title: 'Acesso bloqueado por Chargeback',
          message: 'Identificamos uma contestação de pagamento junto à operadora do seu cartão. O acesso ao ReservaZen permanece suspenso. Se você acredita que houve um equívoco, entre em contato com nosso suporte.',
          icon: ShieldAlert,
          iconColor: 'text-red-600 bg-red-50 border-red-200',
          canReactivate: false,
          ctaText: 'Falar com o Suporte'
        };
      default:
        return {
          badge: 'Acesso Suspenso',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
          title: 'Assinatura Inativa',
          message: 'Sua conta não possui uma assinatura ativa no momento.',
          icon: AlertTriangle,
          iconColor: 'text-slate-600 bg-slate-50 border-slate-200',
          canReactivate: true,
          ctaText: 'Regularizar Assinatura'
        };
    }
  };

  const details = getStatusDetails();
  const Icon = details.icon;

  return (
    <div className="min-h-screen bg-[#f8f8f6] text-slate-900 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-[#bde870]">
      {/* Top Bar with Brand */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-200/60 mb-6">
        <img
          src="/reservazen-logo-tight.png"
          alt="ReservaZen Logo"
          className="h-10 sm:h-12 w-auto object-contain"
        />
        <button
          onClick={onLogout}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          Sair da conta
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center space-y-6 animate-fade-in-up">
          <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mx-auto shadow-inner ${details.iconColor}`}>
            <Icon className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${details.badgeColor}`}>
              <span>{details.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {details.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {details.message}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Usuário:</span>
              <span className="font-bold text-slate-900">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">E-mail:</span>
              <span className="font-bold text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status da Conta:</span>
              <span className="font-black uppercase tracking-wider text-rose-600">
                {status === 'expired' ? 'TESTE EXPIRADO' : status}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            {details.canReactivate ? (
              <a
                href={`${checkoutUrl}?email=${encodeURIComponent(user.email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-black py-3.5 px-6 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <span>{details.ctaText}</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </a>
            ) : (
              <a
                href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20minha%20conta%20no%20ReservaZen"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                <span>Falar com o Suporte</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </a>
            )}

            <button
              onClick={onLogout}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Voltar para o Início / Trocar de Conta
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        ReservaZen © 2026 — Menos confusão, mais controle sobre suas reservas.
      </div>
    </div>
  );
};
