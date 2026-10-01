import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Search, 
  Plus, 
  Phone, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  Sparkles,
  Edit2,
  MessageCircle,
  CalendarCheck
} from 'lucide-react';

interface BookingManagementProps {
  onOpenNewBookingModal: () => void;
  onOpenBookingDetail: (bookingId: string) => void;
}

export const BookingManagement: React.FC<BookingManagementProps> = ({
  onOpenNewBookingModal,
  onOpenBookingDetail
}) => {
  const { filteredBookings, updateBookingStatus, currentEstablishment } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Count metrics for quick filter tabs
  const counts = {
    all: filteredBookings.length,
    PENDING: filteredBookings.filter(b => b.status === 'PENDING').length,
    CONFIRMED: filteredBookings.filter(b => b.status === 'CONFIRMED').length,
    IN_SERVICE: filteredBookings.filter(b => b.status === 'IN_SERVICE').length,
    COMPLETED: filteredBookings.filter(b => b.status === 'COMPLETED').length,
    CANCELLED: filteredBookings.filter(b => b.status === 'CANCELLED' || b.status === 'NO_SHOW').length,
  };

  // Search & filter logic
  const displayedBookings = filteredBookings.filter(b => {
    const matchesSearch = 
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientPhone.includes(searchTerm) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.notes && b.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' 
        ? true 
        : statusFilter === 'CANCELLED' 
        ? (b.status === 'CANCELLED' || b.status === 'NO_SHOW')
        : b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getWhatsAppLink = (phone: string, clientName: string, date: string, time: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(`Olá ${clientName}! Confirmando sua reserva no ${currentEstablishment.name} para o dia ${date} às ${time}. Alguma dúvida?`);
    return `https://wa.me/${fullPhone}?text=${msg}`;
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* Category Subtitle & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-widest block flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5" />
            SUA CENTRAL DE RESERVAS
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Reservas<span className="text-[#0d9488]">.</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Horários organizados. Uma rotina mais tranquila.
          </p>
        </div>

        {/* Right Actions & Search */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs transition-all"
            />
          </div>

          <button
            onClick={onOpenNewBookingModal}
            className="bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova reserva</span>
          </button>
        </div>
      </div>

      {/* Quick Status Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Todas', count: counts.all },
          { id: 'PENDING', label: 'Pendentes', count: counts.PENDING, badgeBg: 'bg-amber-100 text-amber-800' },
          { id: 'CONFIRMED', label: 'Confirmadas', count: counts.CONFIRMED, badgeBg: 'bg-emerald-100 text-emerald-800' },
          { id: 'IN_SERVICE', label: 'Em Atendimento', count: counts.IN_SERVICE, badgeBg: 'bg-teal-100 text-teal-800' },
          { id: 'COMPLETED', label: 'Concluídas', count: counts.COMPLETED, badgeBg: 'bg-sky-100 text-sky-800' },
          { id: 'CANCELLED', label: 'Canceladas / No-Show', count: counts.CANCELLED, badgeBg: 'bg-rose-100 text-rose-800' },
        ].map(tab => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                isActive 
                  ? 'bg-teal-400 text-slate-950' 
                  : tab.badgeBg || 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table Card (Matches reference screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden min-h-[380px] flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider bg-slate-50/60">
                <th className="py-4 px-6">CLIENTE</th>
                <th className="py-4 px-6">DATA / HORÁRIO</th>
                <th className="py-4 px-6">PESSOAS</th>
                <th className="py-4 px-6">RECURSO / MESA</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <CalendarCheck className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">Nenhum registro encontrado</p>
                      <p className="text-xs text-slate-400">Sua próxima reserva começa aqui.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedBookings.map(b => (
                  <tr 
                    key={b.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onOpenBookingDetail(b.id)}
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-2">
                        <span>{b.clientName}</span>
                        {b.source === 'PUBLIC_WEB' && (
                          <span className="text-[9px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-extrabold border border-teal-200">
                            WEB
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {b.clientPhone}
                        </span>
                        {b.clientEmail && <span className="hidden sm:inline">• {b.clientEmail}</span>}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>{b.date} às {b.time}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{b.durationMinutes} min de atendimento</div>
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-700">
                      {b.pax} {b.pax === 1 ? 'pessoa' : 'pessoas'}
                    </td>

                    <td className="py-4 px-6 font-medium text-slate-600">
                      {b.resourceName ? (
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
                          {b.resourceName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={b.status} />
                    </td>

                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Quick Action Button */}
                        <a
                          href={getWhatsAppLink(b.clientPhone, b.clientName, b.date, b.time)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          title="Enviar mensagem no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        {b.status === 'PENDING' && (
                          <button
                            onClick={() => updateBookingStatus(b.id, 'CONFIRMED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Confirmar</span>
                          </button>
                        )}

                        {b.status === 'CONFIRMED' && (
                          <button
                            onClick={() => updateBookingStatus(b.id, 'IN_SERVICE')}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Atender</span>
                          </button>
                        )}

                        {b.status === 'IN_SERVICE' && (
                          <button
                            onClick={() => updateBookingStatus(b.id, 'COMPLETED')}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Concluir</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenBookingDetail(b.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Editar detalhes"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer matching screenshot */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-200/60">
        <span>ReservaZen © 2026</span>
        <span>Sua rotina com mais tranquilidade.</span>
      </div>
    </div>
  );
};

