import React, { useState } from 'react';
import {
  Clock,
  Utensils,
  Scissors,
  Sparkles,
  Stethoscope,
  Dumbbell,
  PartyPopper,
  Coffee,
  Beer,
  Heart,
  Building2,
  Loader2
} from 'lucide-react';
import type { BusinessType, Establishment, ResourceItem, ProfessionalItem, ServiceItem } from '../../types';

interface OnboardingWizardProps {
  userName: string;
  onComplete: (newEstablishment: Establishment) => Promise<void> | void;
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

  // Card 2: Horários de funcionamento
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('20:00');

  // Card 3: Configurações específicas da categoria
  // Restaurante / Bar / Cafeteria
  const [restaurantCapacity, setRestaurantCapacity] = useState<number | string>(80);
  const [restaurantDuration, setRestaurantDuration] = useState<number | string>(90);
  const [restaurantMaxPax, setRestaurantMaxPax] = useState<number | string>(8);
  const [restaurantTablesCount, setRestaurantTablesCount] = useState<number | string>(8);

  // Barbearia
  const [barberProName, setBarberProName] = useState('Carlos Barbeiro');
  const [barberServiceName, setBarberServiceName] = useState('Corte Degradê & Barba');
  const [barberServiceDuration, setBarberServiceDuration] = useState<number | string>(45);
  const [barberServicePrice, setBarberServicePrice] = useState<number | string>(55);
  const [barberBufferMinutes, setBarberBufferMinutes] = useState<number | string>(10);

  // Salão de Beleza
  const [salonProName, setSalonProName] = useState('Juliana Cabeleireira');
  const [salonServiceName, setSalonServiceName] = useState('Corte Feminino & Escova');
  const [salonServiceDuration, setSalonServiceDuration] = useState<number | string>(60);
  const [salonServicePrice, setSalonServicePrice] = useState<number | string>(90);
  const [salonBufferMinutes, setSalonBufferMinutes] = useState<number | string>(15);

  // Clínica / Spa
  const [clinicRoomName, setClinicRoomName] = useState('Consultório 01');
  const [clinicProName, setClinicProName] = useState('Dra. Camila Santos');
  const [clinicProSpecialty, setClinicProSpecialty] = useState('Estética Avançada');
  const [clinicProcName, setClinicProcName] = useState('Procedimento Inicial');
  const [clinicProcDuration, setClinicProcDuration] = useState<number | string>(45);
  const [clinicProcPrice, setClinicProcPrice] = useState<number | string>(120);
  const [clinicBufferMinutes, setClinicBufferMinutes] = useState<number | string>(15);

  // Studio / Fitness
  const [studioClassName, setStudioClassName] = useState('Aula de Pilates');
  const [studioDuration, setStudioDuration] = useState<number | string>(60);
  const [studioMaxStudents, setStudioMaxStudents] = useState<number | string>(12);
  const [studioTeacherName, setStudioTeacherName] = useState('Prof. Mariana');

  // Espaço de Eventos
  const [eventSpaceName, setEventSpaceName] = useState('Salão Principal');
  const [eventMaxGuests, setEventMaxGuests] = useState<number | string>(150);
  const [eventMinHours, setEventMinHours] = useState<number | string>(4);

  // Card 4: Regras gerais
  const [cancellationPolicy, setCancellationPolicy] = useState(
    'Cancelamento gratuito até 2 horas antes do horário reservado.'
  );
  const [clientNotes, setClientNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getBusinessTypeFromCategory = (cat: string): BusinessType => {
    switch (cat) {
      case 'Barbearia':
        return 'BARBERSHOP';
      case 'Salão de beleza':
        return 'SALON';
      case 'Bar':
        return 'BAR';
      case 'Cafeteria':
        return 'CAFE';
      case 'Clínica de estética':
        return 'CLINIC';
      case 'Spa':
        return 'SPA';
      case 'Studio':
        return 'STUDIO';
      case 'Espaço de eventos':
        return 'EVENTS';
      case 'Outro':
        return 'OTHER';
      case 'Restaurante':
      default:
        return 'RESTAURANT';
    }
  };

  const businessType = getBusinessTypeFromCategory(category);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (newCat === 'Restaurante' || newCat === 'Bar') {
      setOpenTime('18:00');
      setCloseTime('23:00');
    } else if (newCat === 'Cafeteria') {
      setOpenTime('08:00');
      setCloseTime('19:00');
    } else if (newCat === 'Barbearia') {
      setOpenTime('09:00');
      setCloseTime('20:00');
    } else if (newCat === 'Salão de beleza') {
      setOpenTime('09:00');
      setCloseTime('19:00');
    } else if (newCat === 'Clínica de estética' || newCat === 'Spa') {
      setOpenTime('08:00');
      setCloseTime('19:00');
    } else {
      setOpenTime('09:00');
      setCloseTime('21:00');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    const trimmedName = businessName.trim();
    if (!trimmedName) {
      setErrorMessage('Por favor, informe o nome do seu estabelecimento.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const slug = trimmedName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'meu-estabelecimento';

    const businessHours = {
      0: { active: true, open: openTime || '09:00', close: closeTime || '20:00' },
      1: { active: true, open: openTime || '09:00', close: closeTime || '20:00' },
      2: { active: true, open: openTime || '09:00', close: closeTime || '20:00' },
      3: { active: true, open: openTime || '09:00', close: closeTime || '20:00' },
      4: { active: true, open: openTime || '09:00', close: closeTime || '20:00' },
      5: { active: true, open: openTime || '09:00', close: closeTime || '20:00' },
      6: { active: true, open: openTime || '09:00', close: closeTime || '20:00' },
    };

    let resources: ResourceItem[] = [];
    let professionals: ProfessionalItem[] = [];
    let services: ServiceItem[] = [];
    let categorySettings: Record<string, any> = {};
    let avgDuration = 60;
    let maxPax = 1;

    if (businessType === 'RESTAURANT' || businessType === 'BAR' || businessType === 'CAFE') {
      const numCapacity = Number(restaurantCapacity) || 80;
      const numDuration = Number(restaurantDuration) || 90;
      const numMaxPax = Number(restaurantMaxPax) || 8;
      const numTables = Number(restaurantTablesCount) || 8;

      avgDuration = numDuration;
      maxPax = numMaxPax;
      categorySettings = {
        total_capacity: numCapacity,
        min_group_size: 1,
        max_group_size: numMaxPax
      };

      resources = Array.from({ length: numTables }).map((_, idx) => ({
        id: `res-user-${idx + 1}`,
        name: `Mesa ${String(idx + 1).padStart(2, '0')}`,
        type: 'Salão',
        resourceType: 'TABLE',
        capacity: Math.max(2, Math.min(numMaxPax, Math.round(numCapacity / numTables))),
        active: true
      }));

      services = [
        {
          id: 'srv-user-1',
          name: businessType === 'CAFE' ? 'Mesa / Cafeteria' : 'Reserva de Mesa',
          durationMinutes: numDuration,
          active: true
        }
      ];
    } else if (businessType === 'BARBERSHOP') {
      const numDuration = Number(barberServiceDuration) || 45;
      const numBuffer = Number(barberBufferMinutes) || 10;
      const numPrice = Number(barberServicePrice) || 55;

      avgDuration = numDuration;
      maxPax = 1;
      categorySettings = {
        buffer_between_appointments_minutes: numBuffer,
        allow_combo_hair_beard: true,
        dedicated_barber_chair: true,
        simultaneous_clients_per_pro: 1
      };

      // Barbearias operam com barbeiros e serviços — sem mesas físicas
      resources = [];

      professionals = [
        {
          id: 'prof-user-1',
          name: barberProName.trim() || 'Carlos Barbeiro',
          specialty: 'Barbeiro / Estilo Masculino',
          active: true
        }
      ];

      services = [
        {
          id: 'srv-user-1',
          name: barberServiceName.trim() || 'Corte Degradê & Barba',
          durationMinutes: numDuration,
          price: numPrice,
          active: true
        }
      ];
    } else if (businessType === 'SALON') {
      const numDuration = Number(salonServiceDuration) || 60;
      const numBuffer = Number(salonBufferMinutes) || 15;
      const numPrice = Number(salonServicePrice) || 90;

      avgDuration = numDuration;
      maxPax = 1;
      categorySettings = {
        buffer_between_appointments_minutes: numBuffer,
        chemical_action_pause_minutes: 30,
        allow_multi_specialist_appointment: true,
        simultaneous_clients_per_pro: 1
      };

      // Salões de beleza operam com profissionais e serviços — sem mesas físicas
      resources = [];

      professionals = [
        {
          id: 'prof-user-1',
          name: salonProName.trim() || 'Juliana Cabeleireira',
          specialty: 'Cabeleireira / Estilista',
          active: true
        }
      ];

      services = [
        {
          id: 'srv-user-1',
          name: salonServiceName.trim() || 'Corte Feminino & Escova',
          durationMinutes: numDuration,
          price: numPrice,
          active: true
        }
      ];
    } else if (businessType === 'CLINIC' || businessType === 'SPA') {
      const numDuration = Number(clinicProcDuration) || 45;
      const numBuffer = Number(clinicBufferMinutes) || 15;
      const numPrice = Number(clinicProcPrice) || 120;

      avgDuration = numDuration;
      maxPax = 1;
      categorySettings = {
        buffer_between_appointments_minutes: numBuffer,
        room_turnover_minutes: numBuffer
      };

      resources = [
        {
          id: 'res-user-1',
          name: clinicRoomName.trim() || (businessType === 'SPA' ? 'Sala Relax' : 'Consultório 01'),
          type: businessType === 'SPA' ? 'Sala de Massagem' : 'Consultório',
          resourceType: 'ROOM',
          capacity: 1,
          active: true
        }
      ];

      professionals = [
        {
          id: 'prof-user-1',
          name: clinicProName.trim() || (businessType === 'SPA' ? 'Terapeuta Holística' : 'Dra. Camila Santos'),
          specialty: clinicProSpecialty.trim() || (businessType === 'SPA' ? 'Massoterapia' : 'Estética Avançada'),
          active: true
        }
      ];

      services = [
        {
          id: 'srv-user-1',
          name: clinicProcName.trim() || (businessType === 'SPA' ? 'Massagem Relaxante' : 'Procedimento Inicial'),
          durationMinutes: numDuration,
          price: numPrice,
          active: true
        }
      ];
    } else if (businessType === 'STUDIO') {
      const numDuration = Number(studioDuration) || 60;
      const numMaxStudents = Number(studioMaxStudents) || 12;

      avgDuration = numDuration;
      maxPax = numMaxStudents;
      categorySettings = {
        max_students_per_class: numMaxStudents
      };

      resources = [
        {
          id: 'res-user-1',
          name: 'Sala Principal',
          type: 'Espaço de Prática',
          resourceType: 'SPACE',
          capacity: numMaxStudents,
          active: true
        }
      ];

      professionals = [
        {
          id: 'prof-user-1',
          name: studioTeacherName.trim() || 'Prof. Mariana',
          specialty: 'Instrutor(a)',
          active: true
        }
      ];

      services = [
        {
          id: 'srv-user-1',
          name: studioClassName.trim() || 'Aula de Pilates',
          durationMinutes: numDuration,
          active: true
        }
      ];
    } else if (businessType === 'EVENTS') {
      const numMaxGuests = Number(eventMaxGuests) || 150;
      const numHours = Number(eventMinHours) || 4;

      avgDuration = numHours * 60;
      maxPax = numMaxGuests;
      categorySettings = {
        max_guests: numMaxGuests,
        min_event_hours: numHours
      };

      resources = [
        {
          id: 'res-user-1',
          name: eventSpaceName.trim() || 'Salão Principal',
          type: 'Espaço Locável',
          resourceType: 'SPACE',
          capacity: numMaxGuests,
          active: true
        }
      ];

      services = [
        {
          id: 'srv-user-1',
          name: 'Locação do Espaço',
          durationMinutes: numHours * 60,
          active: true
        }
      ];
    } else {
      // OTHER
      avgDuration = 60;
      maxPax = 1;
      categorySettings = {};
      professionals = [
        {
          id: 'prof-user-1',
          name: 'Atendente Principal',
          specialty: 'Atendimento Geral',
          active: true
        }
      ];
      services = [
        {
          id: 'srv-user-1',
          name: 'Atendimento Padrão',
          durationMinutes: 60,
          active: true
        }
      ];
    }

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
        avgDurationMinutes: avgDuration,
        minAdvanceHours: 2,
        toleranceMinutes: 15,
        maxPaxPerBooking: maxPax,
        autoConfirm: true,
        blockedDates: [],
        holidaysNotice: clientNotes.trim() || undefined
      },
      resources,
      professionals,
      services,
      cancellationPolicy: cancellationPolicy.trim() || 'Cancelamento gratuito até 2 horas antes do horário reservado.',
      categorySettings
    };

    try {
      await onComplete(newEstablishment);
    } catch (err: any) {
      console.error('Falha ao salvar estabelecimento no Onboarding:', err);
      setIsSubmitting(false);

      let msg = 'Não foi possível salvar o estabelecimento. Verifique sua conexão e tente novamente.';
      if (err?.code === '23505' || err?.message?.includes('businesses_slug_key') || err?.message?.includes('duplicate key')) {
        msg = `Não foi possível salvar o estabelecimento: o identificador (slug "${slug}") já está em uso por outro negócio. (${err.message || 'Chave duplicada'})`;
      } else if (err?.code === '42501' || err?.message?.includes('row-level security') || err?.message?.includes('violates row-level security')) {
        msg = 'Sessão expirada ou sem permissão para criar o estabelecimento no Supabase. Por favor, faça login novamente.';
      } else if (err?.message) {
        msg = `Erro ao salvar estabelecimento: ${err.message}`;
      }

      setErrorMessage(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
            Personalize as configurações iniciais de acordo com o segmento do seu negócio.
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
              1. Informações básicas
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nome do estabelecimento *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex.: Bistrô da Praça ou Barbearia VIP"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Categoria do negócio *
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-bold text-teal-800"
                >
                  <option value="Restaurante">Restaurante</option>
                  <option value="Bar">Bar / Pub</option>
                  <option value="Cafeteria">Cafeteria / Bistrô</option>
                  <option value="Barbearia">Barbearia</option>
                  <option value="Salão de beleza">Salão de beleza</option>
                  <option value="Clínica de estética">Clínica de saúde / Estética</option>
                  <option value="Spa">Spa / Bem-estar</option>
                  <option value="Studio">Studio / Pilates / Academia</option>
                  <option value="Espaço de eventos">Espaço de eventos / Festas</option>
                  <option value="Outro">Outro segmento</option>
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
                  WhatsApp para Reservas
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

          {/* CARD 2: Horários padrão */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              2. Horários de funcionamento
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Horário de Abertura
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <Clock className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Horário de Encerramento
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <Clock className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Configurações Dinâmicas por Categoria */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              {businessType === 'RESTAURANT' && <Utensils className="w-5 h-5 text-teal-600" />}
              {businessType === 'BAR' && <Beer className="w-5 h-5 text-teal-600" />}
              {businessType === 'CAFE' && <Coffee className="w-5 h-5 text-teal-600" />}
              {businessType === 'BARBERSHOP' && <Scissors className="w-5 h-5 text-teal-600" />}
              {businessType === 'SALON' && <Sparkles className="w-5 h-5 text-teal-600" />}
              {businessType === 'CLINIC' && <Stethoscope className="w-5 h-5 text-teal-600" />}
              {businessType === 'SPA' && <Heart className="w-5 h-5 text-teal-600" />}
              {businessType === 'STUDIO' && <Dumbbell className="w-5 h-5 text-teal-600" />}
              {businessType === 'EVENTS' && <PartyPopper className="w-5 h-5 text-teal-600" />}
              {businessType === 'OTHER' && <Building2 className="w-5 h-5 text-teal-600" />}
              <h2 className="text-base font-bold text-gray-900">
                3. Configurações para {category}
              </h2>
            </div>

            {/* RESTAURANTE / BAR / CAFETERIA */}
            {(businessType === 'RESTAURANT' || businessType === 'BAR' || businessType === 'CAFE') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Capacidade total do salão (lugares) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={restaurantCapacity}
                      onChange={(e) => setRestaurantCapacity(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Duração média da reserva (minutos) *
                    </label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      required
                      value={restaurantDuration}
                      onChange={(e) => setRestaurantDuration(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Máximo de pessoas por mesa *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={restaurantMaxPax}
                      onChange={(e) => setRestaurantMaxPax(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Quantidade inicial de mesas
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={restaurantTablesCount}
                      onChange={(e) => setRestaurantTablesCount(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BARBEARIA */}
            {businessType === 'BARBERSHOP' && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
                  💈 <strong>Barbearia:</strong> Os agendamentos são organizados por <strong>barbeiro</strong> e <strong>serviço</strong> (corte, barba na toalha, pigmentação). Sem mesas físicas.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Nome do Barbeiro Titular *
                    </label>
                    <input
                      type="text"
                      required
                      value={barberProName}
                      onChange={(e) => setBarberProName(e.target.value)}
                      placeholder="Ex: Carlos Barbeiro"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Intervalo entre Clientes (Minutos) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      required
                      value={barberBufferMinutes}
                      onChange={(e) => setBarberBufferMinutes(e.target.value)}
                      placeholder="Tempo para higienização e lâmina"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Serviço Inicial da Barbearia *
                    </label>
                    <input
                      type="text"
                      required
                      value={barberServiceName}
                      onChange={(e) => setBarberServiceName(e.target.value)}
                      placeholder="Ex: Corte Degradê & Barba"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Duração (Minutos) *
                    </label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      required
                      value={barberServiceDuration}
                      onChange={(e) => setBarberServiceDuration(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Valor R$
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={barberServicePrice}
                      onChange={(e) => setBarberServicePrice(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold text-teal-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SALÃO DE BELEZA */}
            {businessType === 'SALON' && (
              <div className="space-y-4">
                <div className="p-3 bg-pink-50/70 border border-pink-200/80 rounded-xl text-xs text-pink-900 leading-relaxed">
                  ✂️ <strong>Salão de Beleza:</strong> Os agendamentos são organizados por <strong>profissional</strong> (cabeleireira, manicure, visagista) e <strong>serviço</strong>. Sem mesas físicas.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Nome da Cabeleireira / Especialista *
                    </label>
                    <input
                      type="text"
                      required
                      value={salonProName}
                      onChange={(e) => setSalonProName(e.target.value)}
                      placeholder="Ex: Juliana Cabeleireira"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Intervalo de Higienização (Minutos) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      required
                      value={salonBufferMinutes}
                      onChange={(e) => setSalonBufferMinutes(e.target.value)}
                      placeholder="Tempo para lavatório e limpeza"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Serviço Inicial do Salão *
                    </label>
                    <input
                      type="text"
                      required
                      value={salonServiceName}
                      onChange={(e) => setSalonServiceName(e.target.value)}
                      placeholder="Ex: Corte Feminino & Escova"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Duração (Minutos) *
                    </label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      required
                      value={salonServiceDuration}
                      onChange={(e) => setSalonServiceDuration(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Valor R$
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={salonServicePrice}
                      onChange={(e) => setSalonServicePrice(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold text-teal-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CLÍNICA / SPA */}
            {(businessType === 'CLINIC' || businessType === 'SPA') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Nome do Primeiro Consultório / Sala *
                    </label>
                    <input
                      type="text"
                      required
                      value={clinicRoomName}
                      onChange={(e) => setClinicRoomName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Tempo de Preparo / Higienização (Min)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={clinicBufferMinutes}
                      onChange={(e) => setClinicBufferMinutes(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Nome do Especialista *
                    </label>
                    <input
                      type="text"
                      required
                      value={clinicProName}
                      onChange={(e) => setClinicProName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Especialidade
                    </label>
                    <input
                      type="text"
                      value={clinicProSpecialty}
                      onChange={(e) => setClinicProSpecialty(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Procedimento Inicial *
                    </label>
                    <input
                      type="text"
                      required
                      value={clinicProcName}
                      onChange={(e) => setClinicProcName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Duração (Min)
                    </label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={clinicProcDuration}
                      onChange={(e) => setClinicProcDuration(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Valor R$
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={clinicProcPrice}
                      onChange={(e) => setClinicProcPrice(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold text-teal-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STUDIO */}
            {businessType === 'STUDIO' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Modalidade / Aula Inicial *
                    </label>
                    <input
                      type="text"
                      required
                      value={studioClassName}
                      onChange={(e) => setStudioClassName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Capacidade Máxima de Alunos por Turma *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={studioMaxStudents}
                      onChange={(e) => setStudioMaxStudents(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Duração da Aula (Minutos) *
                    </label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      required
                      value={studioDuration}
                      onChange={(e) => setStudioDuration(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Professor / Instrutor
                    </label>
                    <input
                      type="text"
                      value={studioTeacherName}
                      onChange={(e) => setStudioTeacherName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ESPAÇO DE EVENTOS */}
            {businessType === 'EVENTS' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Nome do Salão / Espaço *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventSpaceName}
                      onChange={(e) => setEventSpaceName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Capacidade Máxima (Convidados) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={eventMaxGuests}
                      onChange={(e) => setEventMaxGuests(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Duração Mínima de Locação (Horas) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={eventMinHours}
                      onChange={(e) => setEventMinHours(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OUTRO NEGÓCIO */}
            {businessType === 'OTHER' && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700">
                🏢 Configure os dados iniciais do seu negócio. As regras avançadas estarão disponíveis na aba Configurações após a conclusão.
              </div>
            )}
          </div>

          {/* CARD 4: Regras e observações */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              4. Regras e observações
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Política de cancelamento
              </label>
              <input
                type="text"
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Observações para os clientes (opcional)
              </label>
              <textarea
                rows={2}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Ex.: Em feriados funcionamos com horário especial."
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Botão de Finalização */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-4 px-6 rounded-2xl shadow-sm text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-slate-950" />}
              <span>{isSubmitting ? 'Salvando estabelecimento...' : 'Concluir Configuração e Acessar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
