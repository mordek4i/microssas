import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { BusinessType } from '../../types';
import confetti from 'canvas-confetti';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Download,
  AlertCircle,
  Users,
  Scissors,
  Utensils,
  Stethoscope,
  Dumbbell,
  PartyPopper,
  Info,
  ChevronRight
} from 'lucide-react';

interface PublicBusinessData {
  business: {
    id: number;
    name: string;
    slug: string;
    business_type: BusinessType;
    phone: string;
    address: string;
    description: string;
    logo_url: string;
  };
  settings: {
    avg_duration_minutes: number;
    min_advance_hours: number;
    tolerance_minutes: number;
    auto_confirm: boolean;
    cancellation_policy: string;
    category_settings: Record<string, any>;
  };
  hours: Array<{
    day_of_week: number;
    opening_time: string;
    closing_time: string;
    is_open: boolean;
  }>;
  services: Array<{
    id: number;
    name: string;
    description?: string;
    price: number;
    duration_minutes: number;
  }>;
  professionals: Array<{
    id: number;
    name: string;
    specialty?: string;
    photo_url?: string;
  }>;
  resources: Array<{
    id: number;
    name: string;
    resource_type: string;
    capacity: number;
  }>;
}

interface ConfirmedBookingData {
  appointment_id: number;
  status: string;
  business_name: string;
  business_slug: string;
  business_type: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  time: string;
  duration_minutes: number;
  pax: number;
  service_name?: string;
  professional_name?: string;
  resource_name?: string;
  notes?: string;
}

interface PublicBookingPageProps {
  slug?: string;
  onBackToDashboard?: () => void;
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ slug, onBackToDashboard }) => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [businessData, setBusinessData] = useState<PublicBusinessData | null>(null);

  // Booking Flow State
  const [step, setStep] = useState<number>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);

  // Tomorrow as default date
  const defaultDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(defaultDateStr);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [pax, setPax] = useState<number>(2);
  const [customHours, setCustomHours] = useState<number>(4);

  // Client Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBookingData | null>(null);

  // Occupied slots fetched from DB
  const [occupiedSlots, setOccupiedSlots] = useState<Array<{
    start_time: string;
    end_time: string;
    start_time_str?: string;
    end_time_str?: string;
    resource_id?: number | null;
    professional_id?: number | null;
    pax?: number;
  }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // 1. Fetch public business data by slug
  const effectiveSlug = slug?.trim() || '';

  const loadBusinessData = useCallback(async () => {
    if (!effectiveSlug) {
      setLoadError('Nenhum identificador de estabelecimento informado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const { data, error } = await supabase.rpc('get_public_business_data', {
        p_slug: effectiveSlug
      });

      if (error) {
        throw error;
      }

      if (!data || !data.business) {
        setLoadError('Estabelecimento não encontrado. Verifique o link e tente novamente.');
        setBusinessData(null);
      } else {
        setBusinessData(data as PublicBusinessData);
        // Pre-select first service if exists
        if (data.services && data.services.length > 0) {
          setSelectedServiceId(data.services[0].id);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do negócio:', err);
      setLoadError(err.message || 'Falha ao carregar informações do estabelecimento.');
    } finally {
      setLoading(false);
    }
  }, [effectiveSlug]);

  useEffect(() => {
    loadBusinessData();
  }, [loadBusinessData]);

  // 2. Fetch occupied intervals whenever date, professional or resource changes
  const fetchOccupiedSlots = useCallback(async () => {
    if (!effectiveSlug || !selectedDate) return;

    setLoadingSlots(true);
    try {
      const { data, error } = await supabase.rpc('get_public_occupied_slots', {
        p_slug: effectiveSlug,
        p_date: selectedDate,
        p_professional_id: selectedProfessionalId,
        p_resource_id: selectedResourceId
      });

      if (!error && Array.isArray(data)) {
        setOccupiedSlots(data);
      } else {
        setOccupiedSlots([]);
      }
    } catch (err) {
      console.warn('Erro ao carregar horários ocupados:', err);
      setOccupiedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [effectiveSlug, selectedDate, selectedProfessionalId, selectedResourceId]);

  useEffect(() => {
    if (businessData) {
      fetchOccupiedSlots();
    }
  }, [businessData, selectedDate, selectedProfessionalId, selectedResourceId, fetchOccupiedSlots]);

  // Handlers to prevent reusing old availability data and immediately refresh
  const handleSelectResource = (resId: number | null) => {
    if (resId === selectedResourceId) return;
    setOccupiedSlots([]); // Clear old table's occupied slots immediately
    setSelectedTime('');   // Clear selected time
    setSelectedResourceId(resId);
  };

  const handleDateChange = (newDate: string) => {
    if (newDate === selectedDate) return;
    setOccupiedSlots([]); // Clear old date's occupied slots immediately
    setSelectedTime('');   // Clear selected time
    setSelectedDate(newDate);
  };

  const handlePaxChange = (newPax: number) => {
    const validPax = Math.max(1, newPax);
    setPax(validPax);
    // If the currently selected table cannot fit the new pax, revert to "Qualquer mesa"
    if (selectedResourceId !== null && businessData) {
      const res = businessData.resources.find(r => r.id === selectedResourceId);
      if (res && res.capacity && res.capacity < validPax) {
        setOccupiedSlots([]);
        setSelectedResourceId(null);
      }
    }
  };

  const businessType = businessData?.business.business_type || 'RESTAURANT';
  const isRestaurant = businessType === 'RESTAURANT' || businessType === 'BAR' || businessType === 'CAFE';
  const isBarbershop = businessType === 'BARBERSHOP';
  const isSalon = businessType === 'SALON';
  const isClinic = businessType === 'CLINIC' || businessType === 'SPA';
  const isStudio = businessType === 'STUDIO';
  const isEvents = businessType === 'EVENTS';

  // Selected entities
  const selectedService = useMemo(() => {
    return businessData?.services.find(s => s.id === selectedServiceId) || null;
  }, [businessData, selectedServiceId]);

  const selectedProfessional = useMemo(() => {
    return businessData?.professionals.find(p => p.id === selectedProfessionalId) || null;
  }, [businessData, selectedProfessionalId]);

  const selectedResource = useMemo(() => {
    return businessData?.resources.find(r => r.id === selectedResourceId) || null;
  }, [businessData, selectedResourceId]);

  // Duration in minutes
  const bookingDurationMinutes = useMemo(() => {
    if (isEvents) {
      return (Number(customHours) || 4) * 60;
    }
    if (selectedService?.duration_minutes) {
      return selectedService.duration_minutes;
    }
    return businessData?.settings.avg_duration_minutes || 60;
  }, [isEvents, customHours, selectedService, businessData]);

  // Helper to parse time string ("19:00" or ISO "2026-10-05T19:00:00...") to minutes from midnight
  const parseTimeToMinutes = (tStr: string | null | undefined): number => {
    if (!tStr) return 0;
    const match = tStr.match(/(\d{2}):(\d{2})/);
    if (match) {
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
    return 0;
  };

  // Helper to check if two intervals overlap: [startA, endA] and [startB, endB]
  const intervalsOverlap = (sA: number, eA: number, sB: number, eB: number) => {
    return sA < eB && eA > sB;
  };

  // Compute available time slots for selected date
  const availableSlots = useMemo(() => {
    if (!businessData || !selectedDate) return [];

    const dateParts = selectedDate.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay();

    const daySchedule = businessData.hours.find(h => h.day_of_week === dayOfWeek);
    if (!daySchedule || !daySchedule.is_open || !daySchedule.opening_time || !daySchedule.closing_time) {
      return [];
    }

    const [openH, openM] = daySchedule.opening_time.split(':').map(Number);
    const [closeH, closeM] = daySchedule.closing_time.split(':').map(Number);

    let startMin = openH * 60 + openM;
    const endMin = (closeH === 0 ? 24 : closeH) * 60 + closeM;
    const duration = bookingDurationMinutes;

    const minAdvanceHours = businessData.settings.min_advance_hours ?? 2;
    const minAdvanceTime = Date.now() + minAdvanceHours * 3600000;

    const slots: Array<{ time: string; available: boolean; reason?: string }> = [];

    // Filter compatible tables for restaurant/bar/cafe when "Sem preferência" (selectedResourceId === null)
    const compatibleTables = isRestaurant
      ? businessData.resources.filter(r => !r.capacity || r.capacity >= pax)
      : [];

    while (startMin + duration <= endMin) {
      const h = Math.floor(startMin / 60);
      const m = startMin % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const slotEndMin = startMin + duration;

      // Slot start in timestamp for min_advance_hours check
      const slotStartTs = new Date(year, month, day, h, m, 0).getTime();

      let isAvailable = true;
      let reason: string | undefined = undefined;

      // 1. Check min advance hours
      if (slotStartTs < minAdvanceTime) {
        isAvailable = false;
        reason = `Exige antecedência mínima de ${minAdvanceHours}h`;
      }

      // 2. Check occupied overlaps
      if (isAvailable) {
        if (isRestaurant) {
          if (selectedResourceId !== null) {
            // Specific table selected: only bookings for THIS table cause conflict
            const isOccupied = occupiedSlots.some(occ => {
              const occResId = occ.resource_id ? Number(occ.resource_id) : null;
              if (occResId !== null && occResId !== Number(selectedResourceId)) {
                return false;
              }
              const oStart = parseTimeToMinutes(occ.start_time_str || occ.start_time);
              const oEnd = parseTimeToMinutes(occ.end_time_str || occ.end_time);
              return intervalsOverlap(startMin, slotEndMin, oStart, oEnd);
            });

            if (isOccupied) {
              isAvailable = false;
              reason = 'Mesa indisponível neste horário';
            }
          } else {
            // "Sem preferência" selected:
            if (compatibleTables.length === 0 && businessData.resources.length > 0) {
              isAvailable = false;
              reason = `Nenhuma mesa com capacidade para ${pax} pessoas`;
            } else if (compatibleTables.length > 0) {
              // Count how many compatible tables are occupied at this slot
              let occupiedCount = 0;
              for (const table of compatibleTables) {
                const tableOccupied = occupiedSlots.some(occ => {
                  const occResId = occ.resource_id ? Number(occ.resource_id) : null;
                  if (occResId !== Number(table.id)) return false;
                  const oStart = parseTimeToMinutes(occ.start_time_str || occ.start_time);
                  const oEnd = parseTimeToMinutes(occ.end_time_str || occ.end_time);
                  return intervalsOverlap(startMin, slotEndMin, oStart, oEnd);
                });
                if (tableOccupied) occupiedCount++;
              }

              if (occupiedCount >= compatibleTables.length) {
                isAvailable = false;
                reason = 'Todas as mesas compatíveis estão ocupadas';
              }
            }
          }
        } else if (selectedProfessionalId !== null) {
          // Professional selected: check overlap for this professional
          const isOccupied = occupiedSlots.some(occ => {
            const occProfId = occ.professional_id ? Number(occ.professional_id) : null;
            if (occProfId !== null && occProfId !== Number(selectedProfessionalId)) {
              return false;
            }
            const oStart = parseTimeToMinutes(occ.start_time_str || occ.start_time);
            const oEnd = parseTimeToMinutes(occ.end_time_str || occ.end_time);
            return intervalsOverlap(startMin, slotEndMin, oStart, oEnd);
          });

          if (isOccupied) {
            isAvailable = false;
            reason = 'Profissional ocupado neste horário';
          }
        } else if (occupiedSlots.length > 0) {
          // General / other
          const isOccupied = occupiedSlots.some(occ => {
            const oStart = parseTimeToMinutes(occ.start_time_str || occ.start_time);
            const oEnd = parseTimeToMinutes(occ.end_time_str || occ.end_time);
            return intervalsOverlap(startMin, slotEndMin, oStart, oEnd);
          });

          if (isOccupied) {
            isAvailable = false;
            reason = 'Horário indisponível';
          }
        }
      }

      slots.push({ time: timeStr, available: isAvailable, reason });
      startMin += 30; // 30-min step
    }

    return slots;
  }, [businessData, selectedDate, bookingDurationMinutes, occupiedSlots, isRestaurant, selectedResourceId, selectedProfessionalId, pax]);

  // Invalidate selectedTime if it becomes unavailable due to table/pax/date change
  useEffect(() => {
    if (selectedTime) {
      const match = availableSlots.find(s => s.time === selectedTime);
      if (!match || !match.available) {
        setSelectedTime('');
      }
    }
  }, [availableSlots, selectedTime]);

  // Stepper logic by category
  // RESTAURANTE: 1 (Pessoas, Mesa, Data & Hora) -> 2 (Dados) -> 3 (Sucesso)
  // BARBEARIA/SALON: 1 (Serviço) -> 2 (Profissional) -> 3 (Data & Hora) -> 4 (Dados) -> 5 (Sucesso)
  // CLINIC/SPA/STUDIO: 1 (Serviço/Aula) -> 2 (Profissional) -> 3 (Data & Hora) -> 4 (Dados) -> 5 (Sucesso)
  // EVENTS: 1 (Espaço) -> 2 (Data & Duração) -> 3 (Convidados & Dados) -> 4 (Sucesso)
  const totalSteps = isRestaurant ? 2 : (isEvents ? 3 : 4);

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitError(null);
    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setSubmitError(null);
    setStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit booking
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!clientName.trim()) {
      setSubmitError('Por favor, informe seu nome completo.');
      return;
    }
    if (!clientPhone.trim() && !clientEmail.trim()) {
      setSubmitError('Por favor, informe seu WhatsApp ou E-mail para confirmação.');
      return;
    }
    if (!selectedTime) {
      setSubmitError('Por favor, selecione um horário para a reserva.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('create_public_appointment', {
        p_business_slug: effectiveSlug,
        p_customer_name: clientName.trim(),
        p_customer_phone: clientPhone.trim(),
        p_customer_email: clientEmail.trim(),
        p_date: selectedDate,
        p_time: selectedTime + (selectedTime.length === 5 ? ':00' : ''),
        p_service_id: selectedServiceId,
        p_professional_id: selectedProfessionalId,
        p_resource_id: selectedResourceId,
        p_pax: Number(pax) || 1,
        p_notes: notes.trim() || null,
        p_duration_minutes: isEvents ? (Number(customHours) || 4) * 60 : null
      });

      if (error) {
        throw error;
      }

      if (data && data.success) {
        setConfirmedBooking(data as ConfirmedBookingData);
        setStep(totalSteps + 1);

        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore confetti error
        }
      } else {
        throw new Error('Não foi possível concluir o agendamento.');
      }
    } catch (err: any) {
      console.error('Erro ao criar reserva:', err);
      const msg = err.message || '';
      if (msg.includes('HORARIO_INDISPONIVEL')) {
        setSubmitError('Esse horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário.');
        fetchOccupiedSlots();
      } else {
        setSubmitError(msg || 'Ocorreu um erro ao processar sua reserva. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download .ics calendar event
  const handleDownloadCalendar = () => {
    if (!confirmedBooking) return;
    const dateFormatted = confirmedBooking.date.replace(/-/g, '');
    const timeFormatted = confirmedBooking.time.substring(0, 5).replace(':', '') + '00';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ReservaZen//NONSGML Reserva//PT',
      'BEGIN:VEVENT',
      `SUMMARY:Reserva em ${confirmedBooking.business_name} (#${confirmedBooking.appointment_id})`,
      `DESCRIPTION:Reserva para ${confirmedBooking.customer_name}. ${confirmedBooking.service_name || 'Agendamento'}.`,
      `DTSTART:${dateFormatted}T${timeFormatted}`,
      `DURATION:PT${confirmedBooking.duration_minutes}M`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `reserva-${confirmedBooking.business_slug}-${confirmedBooking.appointment_id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Carregando estabelecimento...</p>
        </div>
      </div>
    );
  }

  // Not found or error state
  if (loadError || !businessData) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Estabelecimento não encontrado</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {loadError || 'O link de reservas pode estar incorreto ou o estabelecimento foi desativado.'}
          </p>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Painel</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const { business, settings } = businessData;

  // Category Icon
  const CategoryIcon = isRestaurant ? Utensils :
    isBarbershop ? Scissors :
    isSalon ? Sparkles :
    isClinic ? Stethoscope :
    isStudio ? Dumbbell :
    isEvents ? PartyPopper : CalendarIcon;

  // SUCCESS SCREEN
  if (confirmedBooking) {
    const isAutoConfirmed = confirmedBooking.status === 'confirmed';

    return (
      <div className="min-h-screen bg-[#f8f8f6] py-10 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reserva realizada com sucesso!
            </h1>
            <p className="text-xs text-slate-500">
              {isAutoConfirmed
                ? 'Sua reserva está confirmada. Apresente este comprovante ao chegar.'
                : 'Sua solicitação foi enviada e aguarda confirmação do estabelecimento.'}
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isAutoConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isAutoConfirmed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isAutoConfirmed ? 'Confirmada' : 'Aguardando Aprovação'}
            </span>
          </div>

          {/* Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Estabelecimento:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.business_name}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Data:</span>
              <span className="font-bold text-slate-900">
                {confirmedBooking.date.split('-').reverse().join('/')}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Horário:</span>
              <span className="font-bold text-emerald-700 text-sm">
                {confirmedBooking.time.substring(0, 5)}
              </span>
            </div>

            {confirmedBooking.service_name && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Serviço:</span>
                <span className="font-bold text-slate-900">{confirmedBooking.service_name}</span>
              </div>
            )}

            {confirmedBooking.professional_name && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Profissional:</span>
                <span className="font-bold text-slate-900">{confirmedBooking.professional_name}</span>
              </div>
            )}

            {confirmedBooking.resource_name && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Mesa / Ambiente:</span>
                <span className="font-bold text-slate-900">{confirmedBooking.resource_name}</span>
              </div>
            )}

            {confirmedBooking.pax > 1 && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Pessoas / Convidados:</span>
                <span className="font-bold text-slate-900">{confirmedBooking.pax} pessoas</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500 font-medium">Cliente:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.customer_name}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleDownloadCalendar}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span>Salvar no Calendário (.ics)</span>
            </button>

            <button
              onClick={() => {
                setConfirmedBooking(null);
                setStep(1);
                setSelectedTime('');
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl text-xs transition-colors"
            >
              Fazer outra reserva
            </button>

            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-medium py-2"
              >
                Voltar ao Painel do Administrador
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] text-slate-900 antialiased pb-20">
      {/* Top Banner (If in preview mode from owner dashboard) */}
      {onBackToDashboard && (
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">Modo de Visualização Pública</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-mono">
              /reservar/{business.slug}
            </span>
          </div>

          <button
            onClick={onBackToDashboard}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* Establishment Profile Header */}
        <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="p-6 flex items-center gap-4">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 font-black text-xl shrink-0">
                {business.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200/60 uppercase tracking-wider">
                  <CategoryIcon className="w-3 h-3" />
                  {business.business_type}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                {business.name}
              </h1>
              {business.address && (
                <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{business.address}</span>
                </p>
              )}
            </div>
          </div>

          {business.description && (
            <div className="px-6 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
              {business.description}
            </div>
          )}
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between px-2">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={stepNum} className="flex items-center gap-2 flex-1 last:flex-none">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#bde870] text-slate-950 font-black ring-4 ring-emerald-100'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                </div>
                {idx < totalSteps - 1 && (
                  <div className={`h-1 flex-1 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Error Notification */}
        {submitError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{submitError}</div>
          </div>
        )}

        {/* FLOW BODY */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">

          {/* ======================================================= */}
          {/* FLOW: RESTAURANTE, BAR, CAFE                            */}
          {/* ======================================================= */}
          {isRestaurant && (
            <>
              {/* STEP 1: PESSOAS, MESA, DATA E HORÁRIO */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-teal-600" />
                      1. Escolha sua Mesa e Horário
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Informe as pessoas, sua preferência de mesa, dia e horário</p>
                  </div>

                  {/* 1.1 Quantidade de Pessoas */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Número de Pessoas
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handlePaxChange(pax - 1)}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 font-black text-slate-900 flex items-center justify-center text-lg shadow-2xs transition-colors"
                      >
                        -
                      </button>
                      <div className="flex-1 text-center font-black text-lg text-slate-900 bg-white py-2 rounded-xl border border-slate-200 shadow-2xs">
                        {pax} {pax === 1 ? 'pessoa' : 'pessoas'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePaxChange(pax + 1)}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 font-black text-slate-900 flex items-center justify-center text-lg shadow-2xs transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 1.2 Seleção de Mesa / Ambiente */}
                  {businessData.resources.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">
                          Mesa / Ambiente
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {selectedResourceId === null ? 'Sem preferência (auto)' : selectedResource?.name}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Opção Sem preferência */}
                        <div
                          onClick={() => handleSelectResource(null)}
                          className={`p-3 rounded-xl border cursor-pointer text-xs transition-all flex items-center justify-between ${
                            selectedResourceId === null
                              ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold ring-1 ring-teal-500'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold">Sem preferência</div>
                            <div className="text-[10px] text-slate-400 font-normal">Qualquer mesa compatível livre</div>
                          </div>
                          {selectedResourceId === null && (
                            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                          )}
                        </div>

                        {/* Mesas cadastradas */}
                        {businessData.resources.map(res => {
                          const isCapacityOk = !res.capacity || res.capacity >= pax;
                          const isSelected = selectedResourceId === res.id;

                          if (!isCapacityOk) {
                            return (
                              <div
                                key={res.id}
                                className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-slate-400 text-xs cursor-not-allowed opacity-60"
                                title={`Capacidade máxima: ${res.capacity} pessoas`}
                              >
                                <div className="font-semibold line-through">{res.name}</div>
                                <div className="text-[10px] text-red-500 font-medium">
                                  Máx. {res.capacity} {res.capacity === 1 ? 'pessoa' : 'pessoas'}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={res.id}
                              onClick={() => handleSelectResource(res.id)}
                              className={`p-3 rounded-xl border cursor-pointer text-xs transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold ring-1 ring-teal-500'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <div>
                                <div className="font-bold">{res.name}</div>
                                <div className="text-[10px] text-slate-500 font-medium">
                                  Até {res.capacity} {res.capacity === 1 ? 'pessoa' : 'pessoas'}
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 1.3 Data da Reserva */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Data da Reserva</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  {/* 1.4 Horários Disponíveis */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700">Horários Disponíveis</label>
                      {loadingSlots && (
                        <span className="text-[10px] text-teal-600 animate-pulse font-medium">
                          Consultando disponibilidade...
                        </span>
                      )}
                    </div>

                    {availableSlots.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        Nenhum horário disponível para esta mesa/data.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                        {availableSlots.map(slot => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            title={slot.reason || (slot.available ? 'Disponível' : 'Indisponível')}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                              selectedTime === slot.time
                                ? 'bg-slate-950 text-white shadow-xs'
                                : slot.available
                                ? 'bg-slate-50 hover:bg-teal-50 text-slate-800 border border-slate-200 hover:border-teal-300'
                                : 'bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed line-through opacity-40'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botão de Avanço */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!selectedTime || loadingSlots}
                      onClick={() => handleNextStep()}
                      className="w-full bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span>Avançar para Seus Dados</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DADOS DO CLIENTE & CONFIRMAÇÃO */}
              {step === 2 && (
                <form onSubmit={handleConfirmBooking} className="space-y-4 animate-in fade-in">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-600" />
                      2. Seus Dados de Contato
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Para enviarmos a confirmação da sua reserva</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Lucas Ferreira"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                      <input
                        type="text"
                        required
                        placeholder="(11) 99999-9999"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail (Opcional)</label>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Observações (Opcional)</label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Aniversário, preferência por mesa silenciosa..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Summary preview */}
                  <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs space-y-1.5 text-teal-950">
                    <div className="font-bold text-sm text-teal-900">Resumo da Reserva:</div>
                    <div className="flex justify-between">
                      <span className="text-teal-700">Data e Horário:</span>
                      <strong>{selectedDate.split('-').reverse().join('/')} às {selectedTime}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-teal-700">Pessoas:</span>
                      <strong>{pax} {pax === 1 ? 'pessoa' : 'pessoas'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-teal-700">Mesa / Ambiente:</span>
                      <strong>{selectedResource ? selectedResource.name : 'Qualquer mesa compatível (auto)'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-teal-700">Duração estimada:</span>
                      <span>{bookingDurationMinutes} minutos</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Confirmando no sistema...' : 'Confirmar Reserva'}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ======================================================= */}
          {/* FLOW: BARBEARIA, SALÃO, CLÍNICA, SPA, STUDIO, OTHER     */}
          {/* ======================================================= */}
          {!isRestaurant && !isEvents && (
            <>
              {/* STEP 1: ESCOLHA DO SERVIÇO */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-teal-600" />
                      1. Escolha o Serviço
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Selecione o serviço que deseja agendar</p>
                  </div>

                  <div className="space-y-2">
                    {businessData.services.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                        Nenhum serviço disponível no momento.
                      </div>
                    ) : (
                      businessData.services.map(srv => {
                        const isSelected = selectedServiceId === srv.id;
                        return (
                          <div
                            key={srv.id}
                            onClick={() => setSelectedServiceId(srv.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-teal-50 border-teal-500 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-bold text-slate-900">{srv.name}</h4>
                              <p className="text-xs text-slate-500 flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {srv.duration_minutes} min
                                </span>
                                {srv.description && <span>• {srv.description}</span>}
                              </p>
                            </div>

                            {srv.price > 0 && (
                              <div className="text-right">
                                <span className="text-xs font-black text-emerald-700">
                                  R$ {Number(srv.price).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!selectedServiceId}
                      onClick={() => handleNextStep()}
                      className="w-full bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span>Avançar para Escolha do Profissional</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ESCOLHA DO PROFISSIONAL */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-600" />
                      2. Escolha o Profissional
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Selecione o profissional de sua preferência</p>
                  </div>

                  <div className="space-y-2">
                    {/* Opção qualquer profissional */}
                    <div
                      onClick={() => setSelectedProfessionalId(null)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedProfessionalId === null
                          ? 'bg-teal-50 border-teal-500 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Qualquer profissional disponível</h4>
                        <p className="text-xs text-slate-500">O primeiro profissional livre no seu horário</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    {businessData.professionals.map(pro => {
                      const isSelected = selectedProfessionalId === pro.id;
                      return (
                        <div
                          key={pro.id}
                          onClick={() => setSelectedProfessionalId(pro.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-teal-50 border-teal-500 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                              {pro.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{pro.name}</h4>
                              <p className="text-xs text-slate-500">{pro.specialty || 'Especialista'}</p>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNextStep()}
                      className="flex-1 bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Avançar para Data e Horário</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: DATA E HORÁRIO */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-teal-600" />
                      3. Escolha a Data e o Horário
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Horários calculados para {selectedService?.name || 'seu atendimento'} ({bookingDurationMinutes} min)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700">Horários Disponíveis</label>
                      {loadingSlots && <span className="text-[10px] text-teal-600 animate-pulse">Atualizando...</span>}
                    </div>

                    {availableSlots.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        Nenhum horário disponível para esta data com o profissional selecionado.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                        {availableSlots.map(slot => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                              selectedTime === slot.time
                                ? 'bg-slate-950 text-white shadow-xs'
                                : slot.available
                                ? 'bg-slate-50 hover:bg-teal-50 text-slate-800 border border-slate-200 hover:border-teal-300'
                                : 'bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed line-through opacity-50'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      disabled={!selectedTime}
                      onClick={() => handleNextStep()}
                      className="flex-1 bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span>Avançar para Seus Dados</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SEUS DADOS & CONFIRMAÇÃO */}
              {step === 4 && (
                <form onSubmit={handleConfirmBooking} className="space-y-4 animate-in fade-in">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-600" />
                      4. Seus Dados de Contato
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Preencha seus dados para confirmar o agendamento</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Seu nome"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                      <input
                        type="text"
                        required
                        placeholder="(11) 99999-9999"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail (Opcional)</label>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Observações (Opcional)</label>
                    <textarea
                      rows={2}
                      placeholder="Alguma preferência ou informação adicional?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Summary Preview */}
                  <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs space-y-1 text-teal-900">
                    <div className="font-bold">Resumo do Agendamento:</div>
                    <div>Serviço: <strong>{selectedService?.name}</strong> {selectedService?.price ? `(R$ ${selectedService.price})` : ''}</div>
                    <div>Profissional: <strong>{selectedProfessional?.name || 'Primeiro disponível'}</strong></div>
                    <div>Data: <strong>{selectedDate.split('-').reverse().join('/')}</strong> às <strong>{selectedTime}</strong></div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ======================================================= */}
          {/* FLOW: ESPAÇO DE EVENTOS                                 */}
          {/* ======================================================= */}
          {isEvents && (
            <>
              {/* STEP 1: ESPAÇO / AMBIENTE */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <PartyPopper className="w-4 h-4 text-teal-600" />
                      1. Selecione o Espaço / Salão
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Escolha o ambiente para seu evento</p>
                  </div>

                  <div className="space-y-2">
                    {businessData.resources.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                        Nenhum espaço cadastrado.
                      </div>
                    ) : (
                      businessData.resources.map(res => {
                        const isSelected = selectedResourceId === res.id;
                        return (
                          <div
                            key={res.id}
                            onClick={() => setSelectedResourceId(res.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-teal-50 border-teal-500 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{res.name}</h4>
                              <p className="text-xs text-slate-500">Capacidade máxima: {res.capacity} convidados</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={businessData.resources.length > 0 && !selectedResourceId}
                      onClick={() => handleNextStep()}
                      className="w-full bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span>Avançar para Data e Horário</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DATA & DURAÇÃO */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-teal-600" />
                      2. Data, Horário e Duração
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Informe os detalhes de locação do espaço</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Data do Evento</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedTime('');
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Duração (Horas)</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={customHours}
                        onChange={(e) => {
                          setCustomHours(Number(e.target.value) || 4);
                          setSelectedTime('');
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Horário de Início</label>
                    {availableSlots.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        Nenhum horário disponível para esta duração no dia selecionado.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                        {availableSlots.map(slot => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                              selectedTime === slot.time
                                ? 'bg-slate-950 text-white shadow-xs'
                                : slot.available
                                ? 'bg-slate-50 hover:bg-teal-50 text-slate-800 border border-slate-200 hover:border-teal-300'
                                : 'bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed line-through opacity-50'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      disabled={!selectedTime}
                      onClick={() => handleNextStep()}
                      className="flex-1 bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span>Avançar para Convidados e Dados</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONVIDADOS & DADOS */}
              {step === 3 && (
                <form onSubmit={handleConfirmBooking} className="space-y-4 animate-in fade-in">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600" />
                      3. Número de Convidados e Contato
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Preencha os detalhes para finalizar a reserva do espaço</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Previsão de Convidados *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={pax}
                      onChange={(e) => setPax(Number(e.target.value) || 1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Responsável *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nome completo"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                      <input
                        type="text"
                        required
                        placeholder="(11) 99999-9999"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail (Opcional)</label>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Observações do Evento</label>
                    <textarea
                      rows={2}
                      placeholder="Tipo de evento, montagem, estrutura..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Reservando...' : 'Confirmar Locação'}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>

        {/* Cancellation Notice Card */}
        {settings.cancellation_policy && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-slate-500 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-700 font-bold">Política de Cancelamento:</strong> {settings.cancellation_policy}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
