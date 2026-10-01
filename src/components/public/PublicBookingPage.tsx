import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { Booking, ResourceItem, ServiceItem } from '../../types';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  Download
} from 'lucide-react';

interface PublicBookingPageProps {
  slug?: string;
  onBackToDashboard?: () => void;
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ slug, onBackToDashboard }) => {
  const { establishments, currentEstablishment, addBooking, getResourceTerm, getServiceTerm, getPaxTerm } = useApp();

  const establishment = slug 
    ? (establishments.find(e => e.slug === slug) || currentEstablishment)
    : currentEstablishment;

  const [step, setStep] = useState<number>(1);

  const [selectedService, setSelectedService] = useState<ServiceItem | null>(establishment.services[0] || null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('19:00');
  const [pax, setPax] = useState<number>(2);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const availableTimeSlots = useMemo(() => {
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = selectedDateObj.getDay();
    const dayHours = establishment.businessHours[dayOfWeek];

    if (!dayHours || !dayHours.active) return [];

    const slots: string[] = [];
    const [openH, openM] = dayHours.open.split(':').map(Number);
    const [closeH, closeM] = dayHours.close.split(':').map(Number);

    let currentMin = openH * 60 + openM;
    const endMin = (closeH === 0 ? 24 : closeH) * 60 + closeM;

    const interval = selectedService?.durationMinutes || establishment.capacitySettings.avgDurationMinutes || 60;

    while (currentMin + interval <= endMin) {
      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      const timeStr = `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
      slots.push(timeStr);
      currentMin += 30;
    }

    return slots;
  }, [selectedDate, establishment, selectedService]);

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();

    const created = addBooking({
      establishmentId: establishment.id,
      clientName,
      clientPhone,
      clientEmail,
      date: selectedDate,
      time: selectedTime,
      pax,
      resourceId: selectedResource?.id,
      resourceName: selectedResource?.name,
      serviceId: selectedService?.id,
      serviceName: selectedService?.name,
      servicePrice: selectedService?.price,
      durationMinutes: selectedService?.durationMinutes || establishment.capacitySettings.avgDurationMinutes,
      notes,
      source: 'PUBLIC_WEB'
    });

    setConfirmedBooking(created);
    setStep(4);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.log('Confetti error:', err);
    }
  };

  const handleDownloadCalendar = () => {
    if (!confirmedBooking) return;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ReservaZen//NONSGML Event//PT
BEGIN:VEVENT
SUMMARY:Reserva em ${establishment.name} (#${confirmedBooking.id})
DESCRIPTION:Reserva para ${confirmedBooking.pax} pessoas em ${establishment.name}.
LOCATION:${establishment.address}
DTSTART:${confirmedBooking.date.replace(/-/g, '')}T${confirmedBooking.time.replace(':', '')}00
DURATION:PT${confirmedBooking.durationMinutes}M
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `reserva-${confirmedBooking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6] text-slate-900 antialiased pb-20 select-none">
      {/* Simulation Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-slate-700">Modo de Visualização do Cliente</span>
          <span className="text-[10px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200 font-bold">
            {establishment.name}
          </span>
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Dashboard</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="max-w-xl mx-auto px-4 pt-4">
        {/* Establishment Header Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm space-y-4 mb-6">
          {/* Cover Photo */}
          <div className="h-40 relative bg-slate-100">
            <img
              src={establishment.coverUrl}
              alt={establishment.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Logo Badge */}
            <div className="absolute -bottom-6 left-6 w-20 h-20 rounded-2xl bg-white border-2 border-slate-200 p-1 shadow-md">
              <img
                src={establishment.logoUrl}
                alt={establishment.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          </div>

          {/* Info Details */}
          <div className="px-6 pt-4 pb-6 space-y-3">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{establishment.name}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{establishment.tagline}</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {establishment.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1 font-medium text-teal-700">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                {establishment.address}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {establishment.whatsapp}
              </span>
            </div>
          </div>
        </div>

        {/* FUNNEL STEPPER PROGRESS */}
        <div className="flex items-center justify-between px-4 mb-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step === s
                    ? 'bg-[#bde870] text-slate-950 font-black shadow-sm'
                    : step > s
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`w-8 sm:w-12 h-0.5 ${step > s ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                1. Escolha o {getServiceTerm()} ou {getResourceTerm()}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Selecione a opção desejada para seu agendamento</p>
            </div>

            {establishment.services.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{getServiceTerm(true)}</h4>
                <div className="space-y-2">
                  {establishment.services.map(srv => {
                    const isSelected = selectedService?.id === srv.id;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => setSelectedService(srv)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-400 text-slate-900 font-medium shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <h5 className="text-sm font-bold text-slate-900">{srv.name}</h5>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Duração média: {srv.durationMinutes} min
                          </p>
                        </div>
                        {srv.price ? (
                          <span className="text-xs font-extrabold text-teal-800 bg-teal-100/60 px-3 py-1.5 rounded-xl border border-teal-200">
                            R$ {srv.price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Sem taxa</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {establishment.resources.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Preferência de {getResourceTerm()} (Opcional)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedResource(null)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer font-semibold text-center ${
                      selectedResource === null ? 'bg-teal-50 border-teal-400 text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Sem preferência
                  </div>
                  {establishment.resources.map(res => (
                    <div
                      key={res.id}
                      onClick={() => setSelectedResource(res)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer font-semibold text-center ${
                        selectedResource?.id === res.id ? 'bg-teal-50 border-teal-400 text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {res.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              className="w-full bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3.5 px-4 rounded-2xl shadow-sm text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Continuar para Data e Horário</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                2. Data, Horário e {getPaxTerm()}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Escolha o melhor momento para o atendimento</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-700 font-semibold">Escolha a Data *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-700 font-semibold">{getPaxTerm()} *</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPax(Math.max(1, pax - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 font-black hover:bg-slate-200 transition-colors"
                >
                  -
                </button>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 text-center text-xs font-extrabold text-slate-900">
                  {pax} {pax === 1 ? 'pessoa' : 'pessoas'}
                </div>
                <button
                  type="button"
                  onClick={() => setPax(Math.min(establishment.capacitySettings.maxPaxPerBooking, pax + 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 font-black hover:bg-slate-200 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs text-slate-700 font-bold flex items-center justify-between">
                <span>Horários Disponíveis</span>
                <span className="text-[10px] text-slate-500 font-medium">Duração: {selectedService?.durationMinutes || 60} min</span>
              </label>

              {availableTimeSlots.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-900 font-semibold">
                  Nenhum horário livre para esta data. Por favor escolha outro dia no calendário acima.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Period 1: Manhã (< 12:00) */}
                  {availableTimeSlots.filter(t => parseInt(t.split(':')[0]) < 12).length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">☀️ Manhã</span>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {availableTimeSlots.filter(t => parseInt(t.split(':')[0]) < 12).map(t => {
                          const isSelected = selectedTime === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSelectedTime(t)}
                              className={`py-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#bde870] text-slate-950 border-lime-500 shadow-2xs scale-[1.02]'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Period 2: Tarde (12:00 - 18:00) */}
                  {availableTimeSlots.filter(t => {
                    const h = parseInt(t.split(':')[0]);
                    return h >= 12 && h < 18;
                  }).length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider block">🌤️ Tarde</span>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {availableTimeSlots.filter(t => {
                          const h = parseInt(t.split(':')[0]);
                          return h >= 12 && h < 18;
                        }).map(t => {
                          const isSelected = selectedTime === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSelectedTime(t)}
                              className={`py-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#bde870] text-slate-950 border-lime-500 shadow-2xs scale-[1.02]'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Period 3: Noite (>= 18:00) */}
                  {availableTimeSlots.filter(t => parseInt(t.split(':')[0]) >= 18).length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">🌙 Noite</span>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {availableTimeSlots.filter(t => parseInt(t.split(':')[0]) >= 18).map(t => {
                          const isSelected = selectedTime === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSelectedTime(t)}
                              className={`py-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#bde870] text-slate-950 border-lime-500 shadow-2xs scale-[1.02]'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedTime || availableTimeSlots.length === 0}
                className="bg-[#bde870] hover:bg-[#afdf5c] disabled:opacity-50 text-slate-950 font-black py-3 px-6 rounded-2xl shadow-sm text-xs flex items-center gap-2 transition-all"
              >
                <span>Informar Seus Dados</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <form onSubmit={handleConfirmBooking} className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                3. Seus Dados de Contato
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Informe seus dados para confirmar a reserva</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{selectedDate} às {selectedTime}</span>
                <span>{pax} {pax === 1 ? 'pessoa' : 'pessoas'}</span>
              </div>
              {selectedService && <div className="text-slate-500">Serviço: {selectedService.name}</div>}
              {selectedResource && <div className="text-slate-500">{getResourceTerm()}: {selectedResource.name}</div>}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Seu Nome Completo *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Digite seu nome"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Seu WhatsApp / Telefone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">E-mail (opcional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Observações</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Aniversário, restrições..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-6 rounded-2xl shadow-sm text-xs flex items-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar Reserva</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 4 */}
        {step === 4 && confirmedBooking && (
          <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-lg text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                Reserva Realizada com Sucesso!
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-3">Código: #{confirmedBooking.id}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Sua reserva no <strong>{establishment.name}</strong> foi gravada com sucesso!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-900">{confirmedBooking.clientName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Data & Horário:</span>
                <span className="font-extrabold text-teal-800">{confirmedBooking.date} às {confirmedBooking.time}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">{getPaxTerm()}:</span>
                <span className="font-bold text-slate-900">{confirmedBooking.pax} pessoas</span>
              </div>
              {confirmedBooking.serviceName && (
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Serviço:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.serviceName}</span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Endereço:</span>
                <span className="font-semibold text-slate-800">{establishment.address}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDownloadCalendar}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Adicionar ao Calendário (.ics)</span>
              </button>

              <button
                onClick={() => {
                  setStep(1);
                  setConfirmedBooking(null);
                }}
                className="w-full bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs transition-all shadow-xs"
              >
                Fazer Outra Reserva
              </button>
            </div>
          </div>
        )}

        <div className="text-center space-y-2 py-8">
          <div className="flex justify-center">
            <img
              src="/reservazen-logo-tight.png"
              alt="ReservaZen Logo"
              className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            ReservaZen © 2026 — Menos confusão, mais controle sobre suas reservas.
          </p>
        </div>
      </div>
    </div>
  );
};
