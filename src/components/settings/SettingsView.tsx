import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  CreditCard, 
  LogOut, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentUser, logout } = useApp();

  const sub = currentUser?.subscription;
  // If local cache contains legacy unverified trial_7_dias + active without Cakto payment, normalize to trialing
  const isLegacyTrialCache = sub?.plan === 'trial_7_dias' && sub?.status === 'active' && !sub?.cakto_order_id && !sub?.cakto_subscription_id && !sub?.id;
  const currentStatus = isLegacyTrialCache ? 'trialing' : sub?.status;

  const isTrial = currentStatus === 'trialing';
  let trialDaysLeft = 7;
  const trialExpiration = sub?.expires_at || sub?.trial_ends_at;
  if (isTrial && trialExpiration) {
    const msLeft = new Date(trialExpiration).getTime() - Date.now();
    trialDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
          MINHA CONTA
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          Configurações da Conta<span className="text-[#0d9488]">.</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gerencie suas informações de acesso e plano do ReservaZen.
        </p>
      </div>

      {/* 1. DADOS DO PERFIL & CONTA */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Perfil do Usuário
            </h3>
            <p className="text-xs text-slate-500">
              Dados cadastrados e credenciais de acesso
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Nome Completo
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {currentUser?.name || 'Não informado'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              E-mail de Acesso
            </span>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm font-bold text-slate-900 truncate">
                {currentUser?.email || 'contato@reservazen.com.br'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-emerald-900 font-semibold">
              Conta autenticada e protegida com segurança
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
            Ativa
          </span>
        </div>
      </div>

      {/* 2. PLANO & ASSINATURA */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Plano & Assinatura
              </h3>
              <p className="text-xs text-slate-500">
                Status do seu acesso ao ReservaZen
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 border ${
            currentStatus === 'active' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : isTrial
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {currentStatus === 'active' 
                ? 'Plano Ativo' 
                : isTrial 
                ? `Período de Teste (${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'})` 
                : currentStatus === 'expired'
                ? 'Teste Expirado (Acesso Bloqueado)'
                : currentStatus === 'canceled'
                ? 'Assinatura Cancelada (Acesso Bloqueado)'
                : currentStatus === 'refunded'
                ? 'Acesso Reembolsado (Bloqueado)'
                : currentStatus === 'chargeback'
                ? 'Disputa de Pagamento (Bloqueado)'
                : 'Assinatura Pendente'}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Plano
            </span>
            <span className="text-sm font-black text-slate-900">
              ReservaZen {sub?.plan || 'Pro'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Valor
            </span>
            <span className="text-sm font-black text-slate-900">
              R$ {sub?.amount ? sub.amount.toFixed(2) : '97,00'}/mês
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Acesso
            </span>
            <span className={`text-xs font-bold block truncate ${
              currentStatus === 'active' ? 'text-emerald-700' : isTrial ? 'text-amber-700' : 'text-rose-700'
            }`}>
              {currentStatus === 'active' 
                ? 'Acesso Ilimitado' 
                : isTrial 
                ? `Período de Teste (${trialDaysLeft}d)` 
                : 'Acesso Bloqueado'}
            </span>
          </div>
        </div>

        {isTrial && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-950">
                  Você está no período de avaliação
                </p>
                <p className="text-[11px] text-amber-800">
                  {trialDaysLeft > 0
                    ? `Restam ${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia' : 'dias'} de teste. Ao fim do período, assine para manter o acesso contínuo.`
                    : 'Seu período de teste encerra hoje. Assine para continuar utilizando o ReservaZen sem interrupções.'}
                </p>
              </div>
            </div>

            <a
              href="https://pay.cakto.com.br/rteo4xn"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-xs text-center shrink-0 cursor-pointer"
            >
              Assinar Plano Pro
            </a>
          </div>
        )}
      </div>

      {/* 3. SEGURANÇA & SESSÃO */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">
            Encerrar Sessão
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Desconectar sua conta com segurança deste dispositivo.
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer w-fit"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  );
};
