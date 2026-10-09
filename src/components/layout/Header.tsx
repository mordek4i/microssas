import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExternalLink, Bell, Plus, Check, Copy, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenNewBookingModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewBookingModal }) => {
  const { currentEstablishment, activeView, setPublicSlug, currentUser } = useApp();
  const [copied, setCopied] = useState(false);

  const sub = currentUser?.subscription;
  const isLegacyTrialCache = sub?.plan === 'trial_7_dias' && sub?.status === 'active' && !sub?.cakto_order_id && !sub?.cakto_subscription_id && !sub?.id;
  const currentStatus = isLegacyTrialCache ? 'trialing' : sub?.status;
  const isTrial = currentStatus === 'trialing';
  let trialDaysLeft = 7;
  const trialExpiration = sub?.expires_at || sub?.trial_ends_at;
  if (isTrial && trialExpiration) {
    const msLeft = new Date(trialExpiration).getTime() - Date.now();
    trialDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  }

  const viewLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    agenda: 'Agenda',
    bookings: 'Reservas',
    clients: 'Clientes',
    establishment: 'Meu estabelecimento',
    settings: 'Configurações'
  };

  const currentLabel = viewLabels[activeView] || 'Reservas';

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?slug=${currentEstablishment.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-white/90 border-b border-slate-200/80 px-6 lg:px-8 py-3.5 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between transition-all">
      {/* Breadcrumbs & Establishment Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="text-slate-400">Workspace</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-extrabold tracking-tight">{currentLabel}</span>
        </div>

        {isTrial ? (
          <a
            href="https://pay.cakto.com.br/rteo4xn"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-extrabold hover:bg-amber-100 transition-colors"
            title="Clique para assinar seu plano definitivo na Cakto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Período de teste: {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}</span>
            <span className="bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ml-0.5">Assinar</span>
          </a>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistema Ativo</span>
          </div>
        )}
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3">
        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/70 transition-all active:scale-95"
          title="Copiar link da página pública de agendamentos"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Link Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copiar Link</span>
            </>
          )}
        </button>

        {/* Public Page Direct Link */}
        <button
          onClick={() => setPublicSlug(currentEstablishment.slug)}
          className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200/80 flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
        >
          <span>Página pública</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        {/* Notification Bell */}
        <button 
          aria-label="Notificações"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
        </button>

        {/* Quick New Booking Button */}
        {onOpenNewBookingModal && (
          <button
            onClick={onOpenNewBookingModal}
            className="bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova reserva</span>
          </button>
        )}
      </div>
    </header>
  );
};

