import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import type { BusinessType, Establishment } from '../../types';

interface OnboardingWizardProps {
  userName: string;
  onComplete: (newEstablishment: Establishment) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete
}) => {
  // Card 1: Informações básicas
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Restaurante');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Card 2: Funcionamento e capacidade
  const [openTime, setOpenTime] = useState('18:00');
  const [closeTime, setCloseTime] = useState('23:00');
  const [totalCapacity, setTotalCapacity] = useState<number | string>(40);
  const [maxPaxPerBooking, setMaxPaxPerBooking] = useState<number | string>(8);
  const [avgDurationMinutes, setAvgDurationMinutes] = useState<number | string>(90);
  const [intervalMinutes, setIntervalMinutes] = useState<number | string>(30);
  const [mesaTerm, setMesaTerm] = useState('Mesa');

  // Card 3: Regras e observações
  const [cancellationPolicy, setCancellationPolicy] = useState(
    'Cancelamento gratuito até 2 horas antes do horário reservado.'
  );
  const [clientNotes, setClientNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smart suggestion for mesaTerm when category changes
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (mesaTerm === 'Mesa' || mesaTerm === 'Barbeiro' || mesaTerm === 'Profissional' || mesaTerm === 'Sala' || mesaTerm === 'Espaço') {
      if (newCat === 'Barbearia') setMesaTerm('Barbeiro');
      else if (newCat === 'Salão de beleza') setMesaTerm('Profissional');
      else if (newCat === 'Clínica de estética' || newCat === 'Spa') setMesaTerm('Sala');
      else if (newCat === 'Studio' || newCat === 'Espaço de eventos') setMesaTerm('Espaço');
      else setMesaTerm('Mesa');
    }
  };

  const getBusinessTypeFromCategory = (cat: string): BusinessType => {
    switch (cat) {
      case 'Salão de beleza':
      case 'Barbearia':
        return 'SALON';
      case 'Clínica de estética':
      case 'Spa':
        return 'CLINIC';
      case 'Studio':
        return 'STUDIO';
      case 'Espaço de eventos':
        return 'EVENTS';
      case 'Restaurante':
      case 'Bar':
      case 'Cafeteria':
      default:
        return 'RESTAURANT';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = businessName.trim();
    if (!trimmedName) {
      setErrorMessage('Por favor, informe o nome do seu estabelecimento.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const businessType = getBusinessTypeFromCategory(category);

    const slug = trimmedName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'meu-estabelecimento';

    const numCapacity = Number(totalCapacity) || 40;
    const numMaxPax = Number(maxPaxPerBooking) || (businessType === 'RESTAURANT' ? 8 : 1);
    const numDuration = Number(avgDurationMinutes) || 90;
    const resourcePrefix = mesaTerm.trim() || 'Mesa';

    // Calculate sensible resources
    const calculatedSlots = Math.max(1, Math.min(20, Math.ceil(numCapacity / (numMaxPax || 4))));
    const numResources = Math.max(3, Math.min(12, calculatedSlots));

    const resources = Array.from({ length: numResources }).map((_, idx) => ({
      id: `res-user-${idx + 1}`,
      name: `${resourcePrefix} ${String(idx + 1).padStart(2, '0')}`,
      capacity: Math.max(1, Math.min(numMaxPax, Math.round(numCapacity / numResources))),
      active: true
    }));

    const businessHours = {
      0: { active: true, open: openTime || '18:00', close: closeTime || '23:00' },
      1: { active: true, open: openTime || '18:00', close: closeTime || '23:00' },
      2: { active: true, open: openTime || '18:00', close: closeTime || '23:00' },
      3: { active: true, open: openTime || '18:00', close: closeTime || '23:00' },
      4: { active: true, open: openTime || '18:00', close: closeTime || '23:00' },
      5: { active: true, open: openTime || '18:00', close: closeTime || '23:00' },
      6: { active: true, open: openTime || '18:00', close: closeTime || '23:00' },
    };

    const newEstablishment: Establishment = {
      id: `est-user-${Date.now()}`,
      name: trimmedName,
      slug,
      businessType,
      tagline: 'Horários organizados. Atendimento de excelência.',
      description: clientNotes.trim() || `Bem-vindo ao ${trimmedName}. Agende seu horário com praticidade e conforto.`,
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      phone: phone.trim() || whatsapp.trim() || '(11) 3333-4444',
      whatsapp: whatsapp.trim() || phone.trim() || '(11) 99999-9999',
      address: address.trim() || 'Rua Principal, 100 - Centro',
      cityState: 'São Paulo, SP',
      instagram: `@${slug}`,
      primaryColor: '#16a34a',
      businessHours,
      capacitySettings: {
        avgDurationMinutes: numDuration,
        minAdvanceHours: 2,
        toleranceMinutes: 15,
        maxPaxPerBooking: numMaxPax,
        autoConfirm: true,
        blockedDates: [],
        holidaysNotice: clientNotes.trim() || undefined
      },
      resources,
      services: [
        {
          id: 'srv-user-1',
          name: businessType === 'SALON' ? 'Corte / Procedimento Principal' :
                businessType === 'CLINIC' ? 'Consulta / Atendimento' :
                businessType === 'STUDIO' ? 'Aula / Sessão' : 'Atendimento Padrão',
          durationMinutes: numDuration,
          active: true
        }
      ],
      cancellationPolicy: cancellationPolicy.trim() || 'Cancelamento gratuito até 2 horas antes do horário reservado.'
    };

    onComplete(newEstablishment);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Brand Logo & Header */}
        <div className="space-y-3">
          <div className="flex items-center">
            <img
              src="/reservazen-logo-tight.png"
              alt="ReservaZen"
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Configure seu estabelecimento
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Preencha os dados abaixo para criar sua página de reservas. Vamos gerar alguns dados de exemplo para você explorar.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium animate-fade-in-up">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CARD 1: Informações básicas */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              Informações básicas
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nome do estabelecimento
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex.: Bistrô da Praça"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="Restaurante">Restaurante</option>
                  <option value="Bar">Bar</option>
                  <option value="Cafeteria">Cafeteria</option>
                  <option value="Salão de beleza">Salão de beleza</option>
                  <option value="Barbearia">Barbearia</option>
                  <option value="Clínica de estética">Clínica de estética</option>
                  <option value="Spa">Spa</option>
                  <option value="Studio">Studio</option>
                  <option value="Espaço de eventos">Espaço de eventos</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Endereço
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Telefone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 3333-4444"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* CARD 2: Funcionamento e capacidade */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              Funcionamento e capacidade
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Abre às
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    placeholder="18:00"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <Clock className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Fecha às
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    placeholder="23:00"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <Clock className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Capacidade total (lugares)
                </label>
                <input
                  type="number"
                  value={totalCapacity}
                  onChange={(e) => setTotalCapacity(e.target.value)}
                  placeholder="40"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Máx. pessoas por reserva
                </label>
                <input
                  type="number"
                  value={maxPaxPerBooking}
                  onChange={(e) => setMaxPaxPerBooking(e.target.value)}
                  placeholder="8"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Duração média (min)
                </label>
                <input
                  type="number"
                  value={avgDurationMinutes}
                  onChange={(e) => setAvgDurationMinutes(e.target.value)}
                  placeholder="90"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Intervalo entre horários (min)
                </label>
                <input
                  type="number"
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(e.target.value)}
                  placeholder="30"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Como você chama uma &quot;mesa&quot;?
                </label>
                <input
                  type="text"
                  value={mesaTerm}
                  onChange={(e) => setMesaTerm(e.target.value)}
                  placeholder="Mesa"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* CARD 3: Regras e observações */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              Regras e observações
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Regras de cancelamento
              </label>
              <input
                type="text"
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                placeholder="Cancelamento gratuito até 2 horas antes do horário reservado."
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Observações para clientes
              </label>
              <input
                type="text"
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Ex.: Reservas mantidas por 15 minutos de tolerância."
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.99] text-white font-semibold py-3.5 px-4 rounded-xl shadow-xs text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Criar minha página de reservas</span>
            <span className="text-lg leading-none">→</span>
          </button>
        </form>

        <div className="text-center text-xs text-gray-400 pt-4 pb-8">
          ReservaZen © 2026 — Menos confusão, mais controle sobre suas reservas.
        </div>
      </div>
    </div>
  );
};
