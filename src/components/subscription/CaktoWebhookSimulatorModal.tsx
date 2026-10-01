import React, { useState } from 'react';
import { X, Play, RefreshCw, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CaktoWebhookSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  onEventProcessed?: () => void;
}

export const CaktoWebhookSimulatorModal: React.FC<CaktoWebhookSimulatorModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'contato@meunegocio.com.br',
  userName = 'Dono do Negócio',
  onEventProcessed
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string>('purchase_approved');
  const [targetEmail, setTargetEmail] = useState(userEmail);
  const [targetName, setTargetName] = useState(userName);
  const [amount, setAmount] = useState('97.00');
  const [isLoading, setIsLoading] = useState(false);
  const [responseLog, setResponseLog] = useState<string | null>(null);

  if (!isOpen) return null;

  const eventsList = [
    { id: 'purchase_approved', label: 'purchase_approved', desc: 'Aprova compra e ativa o acesso completo ao SaaS', icon: '✅' },
    { id: 'subscription_renewed', label: 'subscription_renewed', desc: 'Renova a assinatura recorrente e estende a validade', icon: '🔄' },
    { id: 'subscription_canceled', label: 'subscription_canceled', desc: 'Cancela a assinatura mantendo dados intactos', icon: '⚠️' },
    { id: 'refund', label: 'refund', desc: 'Registra reembolso e suspende recursos pagos', icon: '⛔' },
    { id: 'chargeback', label: 'chargeback', desc: 'Registra contestação de pagamento e bloqueia acesso', icon: '🚨' }
  ];

  const handleSendWebhook = async () => {
    setIsLoading(true);
    setResponseLog(null);

    const payload = {
      event: selectedEvent,
      data: {
        id: `ord_${Date.now()}`,
        status: selectedEvent === 'purchase_approved' ? 'paid' : selectedEvent,
        amount: Number(amount) || 97.0,
        customer: {
          id: 999,
          name: targetName,
          email: targetEmail
        },
        product: {
          id: 'prod_zen_pro',
          name: 'ReservaZen Plano Pro'
        },
        subscription: {
          id: `sub_${Date.now()}`,
          status: selectedEvent === 'purchase_approved' || selectedEvent === 'subscription_renewed' ? 'active' : 'inactive'
        },
        createdAt: new Date().toISOString()
      }
    };

    try {
      const res = await fetch('/api/webhooks/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setResponseLog(JSON.stringify(data, null, 2));

      if (res.ok && selectedEvent === 'purchase_approved') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      if (onEventProcessed) {
        onEventProcessed();
      }
    } catch (err) {
      setResponseLog(`Erro ao enviar requisição: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in-up">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Simulador de Webhooks Cakto</h3>
              <p className="text-xs text-slate-500">Teste em tempo real o comportamento de cada evento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Target User */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">E-mail do Cliente *</label>
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Nome do Cliente</label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Event Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Selecione o Evento da Cakto:</label>
            <div className="space-y-2">
              {eventsList.map((evt) => (
                <label
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt.id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedEvent === evt.id
                      ? 'bg-teal-50/60 border-teal-500 text-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-base select-none">{evt.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-mono">{evt.label}</span>
                      {selectedEvent === evt.id && (
                        <span className="text-[10px] bg-teal-600 text-white font-extrabold px-2 py-0.5 rounded-full">Selecionado</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{evt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Value */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Valor do Pedido (R$)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendWebhook}
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>Disparar Webhook para o Backend</span>
          </button>

          {/* Response Inspector */}
          {responseLog && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700">Resposta do Endpoint (/api/webhooks/cakto):</span>
              <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto max-h-40">
                {responseLog}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
