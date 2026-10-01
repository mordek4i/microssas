import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Filter, 
  Plus
} from 'lucide-react';

interface AgendaViewProps {
  onOpenNewBookingModal: (preselectedDate?: string, preselectedTime?: string) => void;
  onOpenBookingDetail: (bookingId: string) => void;
}

type AgendaMode = 'day' | 'week' | 'month';

export const AgendaView: React.FC<AgendaViewProps> = ({
  onOpenNewBookingModal,
  onOpenBookingDetail
}) => {
  const { filteredBookings, currentEstablishment, getResourceTerm } = useApp();

  const [mode, setMode] = useState<AgendaMode>('day');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('all');
  const [selectedStatus] = useState<string>('all');

  const changeDateBy = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const setDateToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const activeBookings = filteredBookings.filter(b => {
    if (selectedResourceId !== 'all' && b.resourceId !== selectedResourceId) return false;
    if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;
    return true;
  });

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
    '20:00', '21:00', '22:00', '23:00'
  ];

  const formattedSelectedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Category Subtitle & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
            CALENDÁRIO & HORÁRIOS
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Agenda<span className="text-[#0d9488]">.</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Horários organizados. Uma rotina mais tranquila.
          </p>
        </div>

        {/* Date controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/90 text-xs shadow-sm">
            <button
              onClick={() => setMode('day')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                mode === 'day' ? 'bg-[#bde870] text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão Diária
            </button>
            <button
              onClick={() => setMode('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                mode === 'week' ? 'bg-[#bde870] text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão Semanal
            </button>
            <button
              onClick={() => setMode('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                mode === 'month' ? 'bg-[#bde870] text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão Mensal
            </button>
          </div>

          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 p-1 shadow-sm">
            <button
              onClick={() => changeDateBy(mode === 'week' ? -7 : -1)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={setDateToToday}
              className="px-3 py-1 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => changeDateBy(mode === 'week' ? 7 : 1)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 text-xs shadow-sm">
            <CalendarIcon className="w-4 h-4 text-teal-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Date Header Info */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-extrabold text-slate-900 capitalize tracking-tight flex items-center gap-2">
          <span>{formattedSelectedDate}</span>
          <span className="text-xs font-medium text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
            {activeBookings.filter(b => b.date === selectedDate).length} reservas neste dia
          </span>
        </h3>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 text-xs shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Todos ({getResourceTerm(true)})</option>
              {currentEstablishment.resources.map(res => (
                <option key={res.id} value={res.id}>{res.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onOpenNewBookingModal(selectedDate)}
            className="bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar</span>
          </button>
        </div>
      </div>

      {/* VISÃO DIÁRIA */}
      {mode === 'day' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="grid grid-cols-1 divide-y divide-slate-100">
            {timeSlots.map(timeSlot => {
              const hourPrefix = timeSlot.split(':')[0];
              const slotBookings = activeBookings.filter(
                b => b.date === selectedDate && b.time.startsWith(hourPrefix)
              );

              return (
                <div key={timeSlot} className="py-3.5 flex flex-col md:flex-row items-start gap-4 hover:bg-slate-50/50 p-2 rounded-xl transition-colors">
                  <div className="w-20 shrink-0 flex items-center gap-1.5 text-xs font-bold text-teal-700 pt-1">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>{timeSlot}</span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                    {slotBookings.length === 0 ? (
                      <button
                        onClick={() => onOpenNewBookingModal(selectedDate, timeSlot)}
                        className="h-11 border border-dashed border-slate-200 hover:border-teal-400 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-teal-700 transition-colors w-full bg-slate-50/40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Disponível — Clique para agendar</span>
                      </button>
                    ) : (
                      slotBookings.map(b => (
                        <div
                          key={b.id}
                          onClick={() => onOpenBookingDetail(b.id)}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-400 cursor-pointer transition-all space-y-1.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900">
                              {b.clientName}
                            </span>
                            <StatusBadge status={b.status} size="sm" />
                          </div>

                          <div className="text-xs text-slate-600 flex items-center justify-between">
                            <span className="font-semibold text-teal-700">{b.time} ({b.durationMinutes} min)</span>
                            <span className="text-[11px] text-slate-500">{b.pax} {b.pax === 1 ? 'pessoa' : 'pessoas'}</span>
                          </div>

                          {b.resourceName && (
                            <div className="text-[11px] font-medium text-slate-500 pt-1 border-t border-slate-100">
                              <span>{getResourceTerm()}:</span> <span className="text-slate-800 font-semibold">{b.resourceName}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISÃO SEMANAL */}
      {mode === 'week' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
              const current = new Date(selectedDate);
              const dayOfWeek = current.getDay();
              const diff = dayOffset - dayOfWeek;
              const dateObj = new Date(current);
              dateObj.setDate(current.getDate() + diff);
              const dateStr = dateObj.toISOString().split('T')[0];

              const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
              const dayNumber = dateObj.getDate();
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              const dayBookings = activeBookings.filter(b => b.date === dateStr);

              return (
                <div 
                  key={dateStr}
                  className={`p-3 rounded-xl border flex flex-col justify-between min-h-[300px] ${
                    isToday ? 'bg-teal-50/50 border-teal-200 shadow-sm' : 'bg-slate-50/50 border-slate-200/80'
                  }`}
                >
                  <div className="pb-2 border-b border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{dayName}</span>
                      <span className={`text-base font-black ${isToday ? 'text-teal-700' : 'text-slate-800'}`}>{dayNumber}</span>
                    </div>
                    <span className="text-[10px] bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-bold">
                      {dayBookings.length}
                    </span>
                  </div>

                  <div className="flex-1 py-2 space-y-1.5 overflow-y-auto max-h-[350px]">
                    {dayBookings.map(b => (
                      <div
                        key={b.id}
                        onClick={() => onOpenBookingDetail(b.id)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-xs cursor-pointer space-y-1 hover:border-teal-400 shadow-2xs"
                      >
                        <div className="font-bold text-slate-900 text-[11px] truncate">{b.clientName}</div>
                        <div className="flex items-center justify-between text-[10px] text-teal-700 font-bold">
                          <span>{b.time}</span>
                          <span>{b.pax}p</span>
                        </div>
                        <StatusBadge status={b.status} size="sm" showIcon={false} />
                      </div>
                    ))}

                    {dayBookings.length === 0 && (
                      <div className="text-[11px] text-slate-400 text-center py-8">
                        Sem reservas
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenNewBookingModal(dateStr)}
                    className="w-full text-[11px] py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISÃO MENSAL */}
      {mode === 'month' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <p className="text-xs text-slate-500">Resumo de reservas acumuladas por dia neste mês</p>
          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-400 py-1.5 uppercase">
                {d}
              </div>
            ))}

            {Array.from({ length: 30 }).map((_, index) => {
              const dayNum = index + 1;
              const dateStr = `2026-10-${dayNum < 10 ? '0' + dayNum : dayNum}`;
              const count = activeBookings.filter(b => b.date === dateStr).length;

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setMode('day');
                  }}
                  className={`p-3 rounded-xl border min-h-[70px] cursor-pointer hover:border-teal-400 transition-all flex flex-col justify-between ${
                    count > 0 ? 'bg-teal-50/40 border-teal-200' : 'bg-slate-50/40 border-slate-200/60'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800">{dayNum}</span>
                  {count > 0 ? (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-extrabold text-[10px] text-center border border-teal-200">
                      {count} {count === 1 ? 'reserva' : 'reservas'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300">-</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-200/60">
        <span>ReservaZen © 2026</span>
        <span>Sua rotina com mais tranquilidade.</span>
      </div>
    </div>
  );
};
