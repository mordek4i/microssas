import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { User, Phone, Mail, Calendar, Clock, Users, FileText, CheckCircle2 } from 'lucide-react';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialTime?: string;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialTime
}) => {
  const { currentEstablishment, addBooking, getResourceTerm, getServiceTerm, getPaxTerm } = useApp();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialTime || '19:00');
  const [pax, setPax] = useState<number>(2);
  const [resourceId, setResourceId] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<'MANUAL' | 'WHATSAPP'>('MANUAL');

  useEffect(() => {
    if (initialDate) setDate(initialDate);
    if (initialTime) setTime(initialTime);
  }, [initialDate, initialTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedResource = currentEstablishment.resources.find(r => r.id === resourceId);
    const selectedService = currentEstablishment.services.find(s => s.id === serviceId);

    addBooking({
      clientName,
      clientPhone,
      clientEmail,
      date,
      time,
      pax,
      resourceId: selectedResource?.id,
      resourceName: selectedResource?.name,
      serviceId: selectedService?.id,
      serviceName: selectedService?.name,
      servicePrice: selectedService?.price,
      durationMinutes: selectedService?.durationMinutes || currentEstablishment.capacitySettings.avgDurationMinutes,
      notes,
      source
    });

    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Nova Reserva"
      subtitle={`Agendamento manual para ${currentEstablishment.name}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
        {/* Origem */}
        <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-semibold">Origem do Pedido:</span>
          <label className="flex items-center gap-1.5 text-slate-800 font-medium cursor-pointer">
            <input
              type="radio"
              name="source"
              checked={source === 'MANUAL'}
              onChange={() => setSource('MANUAL')}
              className="accent-teal-600"
            />
            <span>Presencial / Telefone</span>
          </label>
          <label className="flex items-center gap-1.5 text-slate-800 font-medium cursor-pointer">
            <input
              type="radio"
              name="source"
              checked={source === 'WHATSAPP'}
              onChange={() => setSource('WHATSAPP')}
              className="accent-teal-600"
            />
            <span>WhatsApp / Rede Social</span>
          </label>
        </div>

        {/* Cliente details */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados do Cliente</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Nome Completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Telefone / WhatsApp *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="(11) 99999-9999"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">E-mail (opcional)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="cliente@email.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Data & Horário */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data, Horário & Capacidade</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Data *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Horário *</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">{getPaxTerm()} *</label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={pax}
                  onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Resource & Service Selection */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recursos & Serviços</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Selecionar {getResourceTerm()}</label>
              <select
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              >
                <option value="">Qualquer {getResourceTerm()} disponível</option>
                {currentEstablishment.resources.map(res => (
                  <option key={res.id} value={res.id}>
                    {res.name} {res.capacity ? `(${res.capacity} lugares)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Selecionar {getServiceTerm()}</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              >
                <option value="">Nenhum / Padrão</option>
                {currentEstablishment.services.map(srv => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} ({srv.durationMinutes} min) {srv.price ? `- R$ ${srv.price.toFixed(2)}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs text-slate-700 font-semibold mb-1">Observações</label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <textarea
              rows={2}
              placeholder="Ex: Aniversário, restrições..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 shadow-sm flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Reserva</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
