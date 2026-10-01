import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  Shield, 
  RefreshCw, 
  CheckCircle2, 
  CreditCard, 
  Copy, 
  Check, 
  Zap, 
  History, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { CaktoWebhookSimulatorModal } from '../subscription/CaktoWebhookSimulatorModal';

interface WebhookLogItem {
  id: string;
  event_id: string | null;
  event_type: string;
  payload: string;
  processed: number;
  processed_at: string | null;
  created_at: string;
}

export const SettingsView: React.FC = () => {
  const { addToast, currentUser, refreshSubscriptionStatus } = useApp();

  const [whatsappNotify, setWhatsappNotify] = useState(true);
  const [emailNotify, setEmailNotify] = useState(true);
  const [reminderHours, setReminderHours] = useState(3);

  // Webhook settings states
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const webhookEndpointUrl = `${window.location.protocol}//${window.location.host}/api/webhooks/cakto`;

  const fetchWebhookLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/webhooks/logs');
      if (res.ok) {
        const data = await res.json();
        setWebhookLogs(data.logs || []);
      }
    } catch {
      // offline / mock mode
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchWebhookLogs();
  }, []);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookEndpointUrl);
    setCopiedUrl(true);
    addToast('success', 'URL copiada!', 'Cole a URL nas configurações de Webhook da sua conta na Cakto.');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Preferências salvas!', 'As configurações do sistema ReservaZen foram atualizadas.');
  };

  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados de demonstração originais do ReservaZen?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const sub = currentUser?.subscription;

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* 1. ASSINATURA & INTEGRAÇÃO CAKTO */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Integração Cakto & Assinatura SaaS
              </h3>
              <p className="text-xs text-slate-500">
                Sincronização em tempo real de pagamentos, renovações e status da sua conta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 border ${
              sub?.status === 'active' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Assinatura {sub?.status === 'active' ? 'Ativa' : (sub?.status || 'Pendente')}</span>
            </span>

            <button
              type="button"
              onClick={() => setIsSimulatorOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              <span>Simular Webhook</span>
            </button>
          </div>
        </div>

        {/* Subscription details card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Plano Contratado</span>
            <span className="text-sm font-black text-slate-900">ReservaZen {sub?.plan || 'Pro'}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Valor da Mensalidade</span>
            <span className="text-sm font-black text-slate-900">R$ {sub?.amount ? sub.amount.toFixed(2) : '97,00'}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">E-mail Vinculado</span>
            <span className="text-xs font-bold text-slate-900 truncate block">{currentUser?.email || 'proprietario@reservazen.com.br'}</span>
          </div>
        </div>

        {/* Webhook Endpoint Box */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800">
              Endpoint Oficial do Webhook (para cadastrar na Cakto):
            </label>
            <a
              href="https://www.cakto.com.br/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1"
            >
              <span>Documentação da Cakto</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 truncate select-all">
              {webhookEndpointUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copiedUrl ? 'Copiado!' : 'Copiar URL'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/70 text-xs text-teal-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-teal-950">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Chave Secreta (CAKTO_WEBHOOK_SECRET)</span>
            </div>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              O backend valida o campo <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">secret</code> a cada requisição para garantir máxima segurança e evitar fraudes. A chave está guardada com segurança em seu arquivo <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">.env</code>.
            </p>
          </div>
        </div>

        {/* Live Webhook Logs Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Histórico Recente de Webhooks Recebidos
              </h4>
            </div>
            <button
              type="button"
              onClick={fetchWebhookLogs}
              disabled={isLoadingLogs}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              <span>Atualizar Logs</span>
            </button>
          </div>

          {webhookLogs.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
              Nenhum evento de webhook recebido ainda. Use o botão <strong>Simular Webhook</strong> acima para testar!
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Evento</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">ID do Pedido / Evento</th>
                      <th className="py-2.5 px-3">Data / Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {webhookLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            log.event_type === 'purchase_approved' 
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.event_type === 'subscription_renewed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {log.event_type}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {log.processed === 1 ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Processado (200)</span>
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Erro</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[140px]">
                          {log.event_id || log.id.slice(0, 8)}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. NOTIFICAÇÕES & LEMBRETES AUTOMÁTICOS */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <span>Notificações & Lembretes Automáticos</span>
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:border-slate-300 transition-colors">
              <div>
                <span className="font-bold text-slate-900 block">Notificação via WhatsApp para o Estabelecimento</span>
                <span className="text-slate-500 text-[11px]">Receber alerta quando um novo cliente agendar pela página pública.</span>
              </div>
              <input
                type="checkbox"
                checked={whatsappNotify}
                onChange={(e) => setWhatsappNotify(e.target.checked)}
                className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:border-slate-300 transition-colors">
              <div>
                <span className="font-bold text-slate-900 block">Confirmação por E-mail</span>
                <span className="text-slate-500 text-[11px]">Enviar comprovante automático com calendário .ICS para o cliente.</span>
              </div>
              <input
                type="checkbox"
                checked={emailNotify}
                onChange={(e) => setEmailNotify(e.target.checked)}
                className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
              />
            </label>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Antecedência do Lembrete ao Cliente</span>
                <span className="text-slate-500 text-[11px]">Intervalo antes da reserva para envio do lembrete.</span>
              </div>
              <select
                value={reminderHours}
                onChange={(e) => setReminderHours(parseInt(e.target.value))}
                className="bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 font-bold"
              >
                <option value={1}>1 hora antes</option>
                <option value={2}>2 horas antes</option>
                <option value={3}>3 horas antes</option>
                <option value={12}>12 horas antes</option>
                <option value={24}>24 horas antes</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. MANUTENÇÃO & DADOS DEMO */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            <span>Manutenção do Sistema & Dados Demo</span>
          </h3>

          <div className="flex items-center justify-between text-xs p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="font-bold text-slate-900 block">Restaurar Dados de Demonstração</span>
              <span className="text-slate-500 text-[11px]">Redefine reservas, estabelecimentos e clientes para o estado inicial.</span>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resetar Dados</span>
            </button>
          </div>
        </div>

        {/* Botão Salvar Preferências */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#10b981] hover:bg-[#059669] text-white font-black py-3 px-6 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Salvar Preferências</span>
          </button>
        </div>
      </form>

      {/* Simulator Modal */}
      <CaktoWebhookSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        userEmail={currentUser?.email || 'contato@meunegocio.com.br'}
        userName={currentUser?.name || 'Proprietário'}
        onEventProcessed={() => {
          fetchWebhookLogs();
          refreshSubscriptionStatus();
        }}
      />
    </div>
  );
};
