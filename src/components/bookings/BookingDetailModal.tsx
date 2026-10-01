import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Sparkles, 
  UserX,
  Trash2,
  Save,
  MessageSquare,
  Clock
} from 'lucide-react';

interface BookingDetailModalProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  bookingId,
  isOpen,
  onClose
}) => {
  const { bookings, updateBooking, updateBookingStatus, deleteBooking, getPaxTerm } = useApp();

  const booking = bookings.find(b => b.id === bookingId);

  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [pax, setPax] = useState<number>(2);

  useEffect(() => {
    if (booking) {
      setNotes(booking.notes || '');
      setDate(booking.date);
      setTime(booking.time);
      setPax(booking.pax);
    }
  }, [booking]);

  if (!booking) return null;

  const handleSaveEdits = () => {
    updateBooking({
      ...booking,
      notes,
      date,
      time,
      pax
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir permanentemente a reserva #${booking.id}?`)) {
      deleteBooking(booking.id);
      onClose();
    }
  };

  const whatsappMessage = `Olá ${booking.clientName}! Confirmamos sua reserva no ReservaZen para o dia ${booking.date} às ${booking.time}. Qualquer dúvida estamos à disposição!`;
  const whatsappUrl = `https://wa.me/55${booking.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes da Reserva #${booking.id}`}
      subtitle={`Criada em ${new Date(booking.createdAt).toLocaleString('pt-BR')}`}
      maxWidth="lg"
    >
      <div className="space-y-5 text-slate-800">
        {/* Status Header */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">Status Atual</span>
            <div className="mt-1">
              <StatusBadge status={booking.status} size="lg" />
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Notificar WhatsApp</span>
          </a>
        </div>

        {/* Cliente Info */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</h4>
          <div className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            <span>{booking.clientName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {booking.clientPhone}
            </span>
            {booking.clientEmail && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {booking.clientEmail}
              </span>
            )}
          </div>
        </div>

        {/* Edit fields */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reagendar / Alterar Detalhes</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Horário</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">{getPaxTerm()}</label>
              <input
                type="number"
                min={1}
                value={pax}
                onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">Observações Internas</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Status Actions */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alterar Status da Reserva</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => updateBookingStatus(booking.id, 'PENDING')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                booking.status === 'PENDING' ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendente</span>
            </button>

            <button
              onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                booking.status === 'CONFIRMED' ? 'bg-emerald-100 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmar</span>
            </button>

            <button
              onClick={() => updateBookingStatus(booking.id, 'IN_SERVICE')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                booking.status === 'IN_SERVICE' ? 'bg-teal-100 border-teal-300 text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Em Atendimento</span>
            </button>

            <button
              onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                booking.status === 'COMPLETED' ? 'bg-sky-100 border-sky-300 text-sky-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Concluir</span>
            </button>

            <button
              onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                booking.status === 'CANCELLED' ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>

            <button
              onClick={() => updateBookingStatus(booking.id, 'NO_SHOW')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                booking.status === 'NO_SHOW' ? 'bg-slate-200 border-slate-300 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Não Compareceu</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={handleDelete}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Reserva</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleSaveEdits}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 shadow-sm flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
