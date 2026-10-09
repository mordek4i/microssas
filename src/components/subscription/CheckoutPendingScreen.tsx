import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Clock, 
  RefreshCw,
  Zap,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserProfile, SubscriptionStatus } from '../../types';

interface CheckoutPendingScreenProps {
  user: UserProfile;
  onPaymentConfirmed: () => void;
  onLogout: () => void;
}

export const CheckoutPendingScreen: React.FC<CheckoutPendingScreenProps> = ({
  user,
  onPaymentConfirmed,
  onLogout
}) => {
  const [currentStatus, setCurrentStatus] = useState<SubscriptionStatus>(user.subscription?.status || 'pending_payment');
  const [isPolling, setIsPolling] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string>('https://pay.cakto.com.br/rteo4xn');

  // Load public config
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.caktoCheckoutUrl) {
          setCheckoutUrl(data.caktoCheckoutUrl);
        }
      })
      .catch(() => {});
  }, []);

  // Poll for subscription status update
  useEffect(() => {
    if (currentStatus === 'active') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/status?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.subscription?.status === 'active') {
            setCurrentStatus('active');
            setIsPolling(false);
            // Trigger celebration confetti
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        }
      } catch {
        // network error / offline
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [user.email, currentStatus]);

  // Dev simulator helper
  const handleSimulatePaymentApproval = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/webhooks/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'purchase_approved',
          data: {
            id: `sim_${Date.now()}`,
            status: 'paid',
            amount: 97.00,
            customer: {
              name: user.name,
              email: user.email
            },
            product: {
              id: 'prod_zen_pro',
              name: 'ReservaZen Plano Pro'
            }
          }
        })
      });

      if (res.ok) {
        setCurrentStatus('active');
        setIsPolling(false);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Erro ao simular aprovação:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // URL with query parameters for Cakto checkout (prefill email and name)
  const dynamicCheckoutUrl = `${checkoutUrl}?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}`;

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

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto w-full my-auto py-6">
        {currentStatus === 'active' ? (
          /* SUCCESS STATE: Payment approved via webhook! */
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl p-8 sm:p-12 text-center space-y-6 animate-fade-in-up">
            <div className="w-20 h-20 bg-emerald-50 border-4 border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pagamento Confirmado pela Cakto</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Seu ReservaZen está pronto!
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Identificamos seu pagamento com sucesso. Agora vamos configurar o perfil do seu estabelecimento em poucos minutos.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-left text-xs space-y-2 text-emerald-900">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Assinatura Ativa: ReservaZen Pro</span>
              </div>
              <p className="text-emerald-700">
                Acesso completo desbloqueado para o e-mail: <strong className="font-bold text-emerald-950">{user.email}</strong>.
              </p>
            </div>

            <button
              onClick={onPaymentConfirmed}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-black py-4 px-6 rounded-2xl text-base flex items-center justify-center gap-3 transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <span>Entrar no ReservaZen</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        ) : (
          /* PENDING STATE: Account created -> Complete payment on Cakto */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10 space-y-8 animate-fade-in-up">
            {/* Header info */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-black">
                <Check className="w-3.5 h-3.5 text-teal-600" />
                <span>Conta criada com sucesso!</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Agora escolha seu plano para começar a usar o ReservaZen
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                Olá, <strong>{user.name}</strong>! Contrate seu plano através do checkout seguro da Cakto para liberar seu acesso imediatamente.
              </p>
            </div>

            {/* Plan Card */}
            <div className="p-6 rounded-3xl bg-linear-to-b from-slate-50 to-white border-2 border-slate-200 shadow-xs relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-teal-600 text-white text-[11px] font-black rounded-full uppercase tracking-wider">
                Recomendado
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Plano ReservaZen Pro</h3>
                  <p className="text-xs text-slate-500">Tudo o que seu negócio precisa para organizar agendamentos</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">R$ 97,00</span>
                  <span className="text-xs font-bold text-slate-500">/mês</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 font-medium pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Página pública de agendamento própria com QR Code</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Agenda visual Diária, Semanal e Mensal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Gestão completa de clientes e histórico de reservas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Controle de capacidade, horários e dias bloqueados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Sem taxa por reserva efetuada</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Primary Action Button: Opens Cakto Checkout */}
            <div className="space-y-4">
              <a
                href={dynamicCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-black py-4 px-6 rounded-2xl text-base flex items-center justify-center gap-3 transition-all shadow-md active:scale-98 cursor-pointer text-center block"
              >
                <span>Assinar ReservaZen na Cakto</span>
                <ExternalLink className="w-5 h-5 stroke-[2.5]" />
              </a>

              <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Pagamento processado em ambiente 100% seguro via Cakto Pagamentos (PIX ou Cartão)</span>
              </p>
            </div>

            {/* Webhook live status bar */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className={`w-3 h-3 bg-amber-500 rounded-full absolute ${isPolling ? 'animate-ping' : ''}`} />
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                </div>
                <div>
                  <p className="font-bold text-amber-900">Aguardando confirmação do pagamento...</p>
                  <p className="text-[11px] text-amber-700">Assim que a Cakto confirmar o pagamento, seu acesso será liberado automaticamente aqui.</p>
                </div>
              </div>
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            </div>

            {/* Developer Testing / Simulation Box */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-slate-700">Modo de Teste / Homologação:</span>
              </div>
              <button
                type="button"
                onClick={handleSimulatePaymentApproval}
                disabled={isSimulating}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {isSimulating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                )}
                <span>Simular Aprovação (Webhook Cakto)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-slate-400 py-4">
        ReservaZen © 2026 — Integração oficial via Webhook Cakto.
      </div>
    </div>
  );
};
