import React, { useState } from 'react';
import { 
  Sparkles, 
  Share2, 
  QrCode, 
  Plus, 
  Check, 
  Copy, 
  ExternalLink,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface FirstAccessBannerProps {
  userName: string;
  onOpenNewBookingModal: () => void;
  onDismiss?: () => void;
}

export const FirstAccessBanner: React.FC<FirstAccessBannerProps> = ({
  userName,
  onOpenNewBookingModal,
  onDismiss
}) => {
  const { currentEstablishment, setActiveView } = useApp();
  const [copied, setCopied] = useState(false);

  const publicUrl = `${window.location.origin}/?slug=${currentEstablishment.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden space-y-6 animate-fade-in-up">
      {/* Background Decorative Element */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Welcome Title */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-700/60 border border-teal-500/40 text-teal-200 text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Primeiro Acesso Concluído</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Olá, {userName}! 👋
          </h2>
          <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
            Seu estabelecimento <strong>{currentEstablishment.name}</strong> está no ar! Vamos começar a organizar suas reservas?
          </p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-2 rounded-xl text-teal-300 hover:text-white hover:bg-teal-700/50 transition-colors"
            title="Fechar aviso de boas-vindas"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10 pt-2">
        {/* Card 1: Share Link */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
              <Share2 className="w-4 h-4 text-teal-300" />
              <span>Página Pública de Reservas</span>
            </div>
            <p className="text-[11px] text-teal-100/80">
              Envie aos seus clientes pelo WhatsApp ou rede social.
            </p>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-800" />
                <span>Link Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Compartilhar Link</span>
              </>
            )}
          </button>
        </div>

        {/* Card 2: View QR Code */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
              <QrCode className="w-4 h-4 text-teal-300" />
              <span>QR Code para Mesas / Balcão</span>
            </div>
            <p className="text-[11px] text-teal-100/80">
              Imprima ou baixe o QR Code do seu estabelecimento.
            </p>
          </div>

          <button
            onClick={() => setActiveView('establishment')}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-white/20 cursor-pointer"
          >
            <span>Ver QR Code Exclusivo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Manual Booking */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
              <Plus className="w-4 h-4 text-teal-300" />
              <span>Agendamento Manual</span>
            </div>
            <p className="text-[11px] text-teal-100/80">
              Cadastre um agendamento feito por telefone ou presencial.
            </p>
          </div>

          <button
            onClick={onOpenNewBookingModal}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Primeira Reserva</span>
          </button>
        </div>
      </div>
    </div>
  );
};
