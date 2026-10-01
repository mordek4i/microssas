import React from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCard } from './MetricCard';
import { ChartsSection } from './ChartsSection';
import { StatusBadge } from '../common/StatusBadge';
import { FirstAccessBanner } from './FirstAccessBanner';
import { 
  CalendarCheck, 
  Users, 
  CheckCircle2, 
  Percent,
  Sparkles, 
  Plus, 
  ArrowRight, 
  MessageCircle, 
  LayoutDashboard,
  Calendar
} from 'lucide-react';
import type { DateFilterType } from '../../types';

interface DashboardViewProps {
  onOpenNewBookingModal: () => void;
  onOpenBookingDetail: (bookingId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewBookingModal,
  onOpenBookingDetail
}) => {
  const { 
    filteredBookings, 
    setActiveView, 
    currentEstablishment, 
    getResourceTerm, 
    getPaxTerm,
    currentUser,
    isFirstAccess,
    dismissFirstAccess,
    dateFilter,
    setDateFilter
  } = useApp();

  // Quantidades reais baseadas no período selecionado
  const totalReservas = filteredBookings.length;
  const totalClientes = filteredBookings.reduce((sum, b) => sum + (b.pax || 1), 0);
  const totalConfirmadas = filteredBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'IN_SERVICE').length;
  const totalPendentes = filteredBookings.filter(b => b.status === 'PENDING').length;
  const totalCanceladas = filteredBookings.filter(b => b.status === 'CANCELLED').length;

  // Cálculo de capacidade e taxa de ocupação real
  const totalResources = currentEstablishment.resources.length || 1;
  const dailySlotsPerResource = 6;
  const daysInPeriod = dateFilter === 'today' || dateFilter === 'yesterday' ? 1 : dateFilter === 'week' ? 7 : 30;
  const totalEstimatedSlots = totalResources * dailySlotsPerResource * daysInPeriod;

  // Taxa de ocupação precisa: 0 se não houver reservas
  const occupationRate = totalReservas === 0 
    ? 0 
    : Math.min(100, Math.round((totalReservas / totalEstimatedSlots) * 100));

  const availableSlots = Math.max(0, totalEstimatedSlots - totalReservas);

  // Rótulos do filtro ativo
  const filterLabels: Record<DateFilterType, { title: string; subtitle: string }> = {
    today: { title: 'Reservas de Hoje', subtitle: 'Previstos para hoje' },
    yesterday: { title: 'Reservas de Ontem', subtitle: 'Atendimentos de ontem' },
    week: { title: 'Reservas desta Semana', subtitle: 'Nesta semana' },
    month: { title: 'Reservas deste Mês', subtitle: 'No mês atual' },
    custom: { title: 'Reservas do Período', subtitle: 'No período selecionado' }
  };

  const currentFilterInfo = filterLabels[dateFilter] || filterLabels.today;

  const getWhatsAppLink = (phone: string, clientName: string, time: string, date: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(`Olá ${clientName}! Confirmamos sua reserva no ${currentEstablishment.name} para o dia ${date} às ${time}. Te aguardamos com muito prazer!`);
    return `https://wa.me/${fullPhone}?text=${msg}`;
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* FIRST-TIME ACCESS BANNER */}
      {isFirstAccess && (
        <FirstAccessBanner
          userName={currentUser?.name || 'Proprietário'}
          onOpenNewBookingModal={onOpenNewBookingModal}
          onDismiss={dismissFirstAccess}
        />
      )}

      {/* Category Subtitle & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-widest block flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>PAINEL DO ESTABELECIMENTO • {currentEstablishment.name}</span>
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Dashboard<span className="text-[#0d9488]">.</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Métricas em tempo real, capacidade e agenda organizada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewBookingModal}
            className="bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-extrabold py-2.5 px-4 rounded-xl shadow-2xs text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Reserva</span>
          </button>
          <button
            onClick={() => setActiveView('agenda')}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <span>Ver Agenda</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>Filtrar por:</span>
          </span>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'today'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setDateFilter('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'yesterday'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Ontem
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'week'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Esta semana
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'month'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Este mês
          </button>
        </div>

        <span className="text-[11px] font-semibold text-slate-500 px-2">
          {totalReservas} {totalReservas === 1 ? 'registro encontrado' : 'registros encontrados'}
        </span>
      </div>

      {/* Top Banner Overview */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Resumo Operacional</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {currentEstablishment.name} tem{' '}
            <span className="text-[#0d9488] font-black">
              {totalReservas} {totalReservas === 1 ? 'reserva' : 'reservas'}
            </span>{' '}
            registradas {currentFilterInfo.subtitle.toLowerCase()}.
          </h2>
          <p className="text-xs text-slate-500">
            {totalConfirmadas} confirmadas, {totalPendentes} pendentes de aprovação e {totalCanceladas} canceladas.
          </p>
        </div>

        {totalPendentes > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs">
              {totalPendentes}
            </div>
            <div>
              <span className="block text-xs font-bold text-amber-900">Aprovação Pendente</span>
              <button
                onClick={() => setActiveView('bookings')}
                className="text-[11px] text-amber-800 underline font-extrabold hover:text-amber-950 cursor-pointer"
              >
                Analisar pendências →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Metric Cards Grid (Valores Exatos do Período) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={currentFilterInfo.title}
          value={totalReservas}
          subtitle={`Em ${currentEstablishment.name}`}
          icon={CalendarCheck}
          colorScheme="teal"
        />
        <MetricCard
          title={getPaxTerm()}
          value={totalClientes}
          subtitle={currentFilterInfo.subtitle}
          icon={Users}
          colorScheme="sky"
        />
        <MetricCard
          title="Confirmadas"
          value={totalConfirmadas}
          subtitle={`${totalPendentes} pendentes de aprovação`}
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <MetricCard
          title="Taxa de Ocupação"
          value={`${occupationRate}%`}
          subtitle={`${availableSlots} vagas estimadas livres`}
          icon={Percent}
          colorScheme="purple"
        />
      </div>

      {/* Charts Section (Gráficos Reais Dinâmicos) */}
      <ChartsSection />

      {/* Bookings List Quick Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Reservas ({currentFilterInfo.subtitle})
            </h3>
            <p className="text-xs text-slate-500">
              Gerencie seus agendamentos, envie lembretes e altere status
            </p>
          </div>
          <button
            onClick={() => setActiveView('bookings')}
            className="text-xs text-[#0d9488] hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todas as reservas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {filteredBookings.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  Nenhuma reserva encontrada para este período
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Você pode adicionar uma nova reserva manual ou divulgar o link da sua página pública para começar a receber agendamentos.
                </p>
              </div>
              <button
                onClick={onOpenNewBookingModal}
                className="bg-[#10b981] hover:bg-[#059669] text-white font-bold py-2 px-4 rounded-xl text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Reserva Agora</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-black text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-4">Data & Horário</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">{getPaxTerm()}</th>
                  <th className="py-3.5 px-4">{getResourceTerm()}</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => onOpenBookingDetail(b.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>
                        <span>{b.time}</span>
                        <span className="block text-[10px] font-normal text-slate-400">
                          {b.date}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block group-hover:text-teal-700 transition-colors">
                        {b.clientName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {b.clientPhone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {b.pax} {b.pax === 1 ? 'pessoa' : 'pessoas'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {b.resourceName ? (
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200">
                          {b.resourceName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={getWhatsAppLink(b.clientPhone, b.clientName, b.time, b.date)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          title="Enviar lembrete no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <button 
                          onClick={() => onOpenBookingDetail(b.id)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-bold transition-colors cursor-pointer"
                        >
                          Detalhes
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-200/60">
        <span>ReservaZen © 2026 — {currentEstablishment.name}</span>
        <span>Sua rotina com mais tranquilidade e controle.</span>
      </div>
    </div>
  );
};
