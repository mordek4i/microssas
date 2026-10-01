import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Phone, 
  Mail, 
  Star, 
  History, 
  Save 
} from 'lucide-react';

interface ClientDetailModalProps {
  clientId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  clientId,
  isOpen,
  onClose
}) => {
  const { clients, bookings, addOrUpdateClient, getResourceTerm } = useApp();

  const client = clients.find(c => c.id === clientId);
  const clientBookings = bookings.filter(b => b.clientPhone === client?.phone || b.clientName === client?.name);

  const [isVip, setIsVip] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (client) {
      setIsVip(client.isVip);
      setNotes(client.notes || '');
    }
  }, [client]);

  if (!client) return null;

  const handleSave = () => {
    addOrUpdateClient({
      phone: client.phone,
      isVip,
      notes
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Perfil do Cliente — ${client.name}`}
      subtitle={`Cadastrado desde ${client.createdAt}`}
      maxWidth="xl"
    >
      <div className="space-y-6 text-slate-800">
        {/* Header Profile Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center font-black text-lg text-teal-800">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">{client.name}</h3>
                {isVip && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-3 mt-1 font-medium">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {client.phone}</span>
                {client.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {client.email}</span>}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsVip(!isVip)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isVip
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
            }`}
          >
            <Star className={`w-4 h-4 ${isVip ? 'fill-slate-950' : ''}`} />
            <span>{isVip ? 'Remover VIP' : 'Marcar como VIP'}</span>
          </button>
        </div>

        {/* Client Metrics */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Reservas</span>
            <div className="text-base font-black text-slate-900 mt-0.5">{clientBookings.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Concluídas</span>
            <div className="text-base font-black text-emerald-600 mt-0.5">
              {clientBookings.filter(b => b.status === 'COMPLETED' || b.status === 'CONFIRMED' || b.status === 'IN_SERVICE').length}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Canceladas</span>
            <div className="text-base font-black text-rose-600 mt-0.5">
              {clientBookings.filter(b => b.status === 'CANCELLED').length}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">No-Show</span>
            <div className="text-base font-black text-slate-600 mt-0.5">
              {clientBookings.filter(b => b.status === 'NO_SHOW').length}
            </div>
          </div>
        </div>

        {/* Client Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Anotações do Estabelecimento (Preferências, Alergias, Observações)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Cliente prefere mesas de canto, vinhos secos..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Complete Booking History */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4 text-teal-600" />
            <span>Histórico Completo de Reservas ({clientBookings.length})</span>
          </h4>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {clientBookings.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhum histórico de reservas gravado.</p>
            ) : (
              clientBookings.map(b => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span>{b.date} às {b.time}</span>
                      <span className="text-slate-500 font-medium">({b.pax} pessoas)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {b.resourceName && <span>{getResourceTerm()}: {b.resourceName} | </span>}
                      {b.serviceName && <span>Serviço: {b.serviceName}</span>}
                    </div>
                  </div>
                  <StatusBadge status={b.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 shadow-sm flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Perfil</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
