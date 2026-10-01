import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { 
  Establishment, 
  Booking, 
  Client, 
  MainView, 
  DateFilterType, 
  BookingStatus
} from '../types';
import { INITIAL_ESTABLISHMENTS, INITIAL_BOOKINGS, INITIAL_CLIENTS } from '../data/mockData';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

export type AppFlowState = 'LANDING' | 'CHECKOUT_PENDING' | 'BLOCKED_SUBSCRIPTION' | 'ONBOARDING' | 'APP';

import type { UserProfile } from '../types';

interface AppContextType {
  establishments: Establishment[];
  currentEstablishment: Establishment;
  currentEstablishmentId: string;
  switchEstablishment: (id: string) => void;
  updateEstablishment: (updated: Establishment) => void;
  
  bookings: Booking[];
  filteredBookings: Booking[];
  addBooking: (bookingData: Partial<Booking>) => Booking;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  updateBooking: (updated: Booking) => void;
  deleteBooking: (bookingId: string) => void;

  clients: Client[];
  addOrUpdateClient: (clientData: Partial<Client>) => void;

  activeView: MainView;
  setActiveView: (view: MainView) => void;

  dateFilter: DateFilterType;
  setDateFilter: (filter: DateFilterType) => void;
  customStartDate: string;
  setCustomStartDate: (d: string) => void;
  customEndDate: string;
  setCustomEndDate: (d: string) => void;

  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  removeToast: (id: string) => void;

  publicSlug?: string;
  setPublicSlug: (slug?: string) => void;

  // Flow & Auth states with Cakto integration
  appFlowState: AppFlowState;
  currentUser: UserProfile | null;
  isFirstAccess: boolean;
  startSignup: (name: string, email?: string, password?: string) => Promise<void>;
  startLogin: (email?: string, password?: string) => Promise<void>;
  onPaymentConfirmed: () => void;
  logout: () => void;
  completeOnboarding: (newEst: Establishment) => void;
  goToLanding: () => void;
  dismissFirstAccess: () => void;
  refreshSubscriptionStatus: () => Promise<void>;

  // Domain terms based on business type
  getResourceTerm: (plural?: boolean) => string;
  getServiceTerm: (plural?: boolean) => string;
  getPaxTerm: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_ESTABLISHMENTS_KEY = 'reservazen_establishments_v2';
const LOCAL_STORAGE_BOOKINGS_KEY = 'reservazen_bookings_v2';
const LOCAL_STORAGE_CLIENTS_KEY = 'reservazen_clients_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // App Flow & User Auth
  const [appFlowState, setAppFlowState] = useState<AppFlowState>('LANDING');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('reservazen_user_session_v3');
    return saved ? JSON.parse(saved) : null;
  });
  const [isFirstAccess, setIsFirstAccess] = useState<boolean>(false);

  // Establishments state
  const [establishments, setEstablishments] = useState<Establishment[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_ESTABLISHMENTS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_ESTABLISHMENTS;
  });

  const [currentEstablishmentId, setCurrentEstablishmentId] = useState<string>(() => {
    return establishments[0]?.id || 'est-bistro';
  });

  // Active Establishment
  const currentEstablishment = useMemo(() => {
    return establishments.find(e => e.id === currentEstablishmentId) || establishments[0];
  }, [establishments, currentEstablishmentId]);

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  // Clients state
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CLIENTS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  // Active View navigation
  const [activeView, setActiveView] = useState<MainView>('dashboard');

  // Date Filter state
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Toasts notification
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Public booking page simulator
  const [publicSlug, setPublicSlug] = useState<string | undefined>(undefined);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_ESTABLISHMENTS_KEY, JSON.stringify(establishments));
  }, [establishments]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(clients));
  }, [clients]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth & Flow Actions with Cakto integration
  const startSignup = async (name: string, email?: string, password?: string) => {
    const userEmail = email || `user_${Date.now()}@exemplo.com`;
    const userPass = password || 'senha123';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: userEmail, password: userPass })
      });

      if (res.ok) {
        const data = await res.json();
        const profile: UserProfile = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          subscription: {
            status: data.subscription.status,
            plan: data.subscription.plan,
            amount: data.subscription.amount,
            trial_ends_at: data.subscription.trial_ends_at,
            expires_at: data.subscription.expires_at
          }
        };
        setCurrentUser(profile);
        localStorage.setItem('reservazen_user_session_v3', JSON.stringify(profile));
        
        // 7 days free trial -> Immediate access to onboarding!
        setAppFlowState('ONBOARDING');
        addToast('success', 'Conta criada com 7 dias grátis! 🎉', 'Aproveite todos os recursos do ReservaZen Pro.');
        return;
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao criar conta');
      }
    } catch (error) {
      console.warn('Backend indisponível, usando fallback de sessão local:', error);
      const trialEndsDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const profile: UserProfile = {
        id: `usr_${Date.now()}`,
        name,
        email: userEmail,
        subscription: {
          status: 'trialing',
          plan: 'trial_7_dias',
          amount: 97.0,
          trial_ends_at: trialEndsDate,
          expires_at: trialEndsDate
        }
      };
      setCurrentUser(profile);
      localStorage.setItem('reservazen_user_session_v3', JSON.stringify(profile));
      setAppFlowState('ONBOARDING');
      addToast('success', 'Conta criada com 7 dias grátis! 🎉', 'Aproveite todos os recursos do ReservaZen Pro.');
    }
  };

  const startLogin = async (email?: string, password?: string) => {
    if (!email || !password) {
      // Demo access
      const demoProfile: UserProfile = {
        id: 'usr_demo',
        name: 'Proprietário Demo',
        email: 'demo@reservazen.com.br',
        subscription: {
          status: 'active',
          plan: 'mensal',
          amount: 97.0
        }
      };
      setCurrentUser(demoProfile);
      setIsFirstAccess(false);
      setAppFlowState('APP');
      setActiveView('dashboard');
      addToast('success', 'Acesso Demonstração!', 'Bem-vindo ao ReservaZen.');
      return;
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const data = await res.json();
      const profile: UserProfile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        subscription: data.subscription
      };
      setCurrentUser(profile);
      localStorage.setItem('reservazen_user_session_v3', JSON.stringify(profile));

      const subStatus = profile.subscription?.status;
      if (subStatus === 'active' || subStatus === 'trialing') {
        setAppFlowState('APP');
        setActiveView('dashboard');
        addToast(
          'success', 
          `Bem-vindo de volta, ${profile.name}!`, 
          subStatus === 'trialing' ? 'Período de teste de 7 dias ativo.' : 'Assinatura ativa e em dia.'
        );
      } else if (subStatus === 'pending_payment') {
        setAppFlowState('CHECKOUT_PENDING');
        addToast('info', 'Assinatura pendente', 'Seu período de teste expirou. Assine na Cakto para continuar.');
      } else {
        setAppFlowState('BLOCKED_SUBSCRIPTION');
      }
    } else {
      const errData = await res.json();
      throw new Error(errData.error || 'Credenciais inválidas.');
    }
  };

  const onPaymentConfirmed = () => {
    if (currentUser) {
      const updated: UserProfile = {
        ...currentUser,
        subscription: {
          ...currentUser.subscription,
          status: 'active'
        }
      };
      setCurrentUser(updated);
      localStorage.setItem('reservazen_user_session_v3', JSON.stringify(updated));
    }
    setAppFlowState('ONBOARDING');
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('reservazen_user_session_v3');
    setAppFlowState('LANDING');
    addToast('info', 'Você saiu da sua conta.', 'Até breve!');
  };

  const refreshSubscriptionStatus = async () => {
    if (!currentUser?.email) return;
    try {
      const res = await fetch(`/api/auth/status?email=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.subscription) {
          const updated: UserProfile = {
            ...currentUser,
            subscription: data.subscription
          };
          setCurrentUser(updated);
          localStorage.setItem('reservazen_user_session_v3', JSON.stringify(updated));

          if (data.subscription.status === 'active' && (appFlowState === 'CHECKOUT_PENDING' || appFlowState === 'BLOCKED_SUBSCRIPTION')) {
            setAppFlowState('APP');
          }
        }
      }
    } catch {
      // ignore
    }
  };

  const completeOnboarding = (newEst: Establishment) => {
    // Generate personalized initial sample bookings for the new establishment
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const res1 = newEst.resources[0];
    const res2 = newEst.resources[1] || newEst.resources[0];
    const res3 = newEst.resources[2] || newEst.resources[0];

    const isRestaurant = newEst.businessType === 'RESTAURANT';

    const personalizedBookings: Booking[] = [
      {
        id: `RZ-${Math.floor(1000 + Math.random() * 9000)}`,
        establishmentId: newEst.id,
        clientName: 'Lucas Ferreira',
        clientPhone: '(11) 98765-4321',
        clientEmail: 'lucas.ferreira@gmail.com',
        date: todayStr,
        time: '14:00',
        durationMinutes: newEst.capacitySettings.avgDurationMinutes,
        pax: isRestaurant ? 2 : 1,
        resourceId: res1?.id,
        resourceName: res1?.name,
        serviceId: newEst.services[0]?.id,
        serviceName: newEst.services[0]?.name,
        status: 'CONFIRMED',
        notes: 'Reserva inicial confirmada',
        createdAt: new Date().toISOString(),
        source: 'PUBLIC_WEB'
      },
      {
        id: `RZ-${Math.floor(1000 + Math.random() * 9000)}`,
        establishmentId: newEst.id,
        clientName: 'Mariana Costa',
        clientPhone: '(11) 97654-3210',
        clientEmail: 'mariana.costa@hotmail.com',
        date: todayStr,
        time: '19:30',
        durationMinutes: newEst.capacitySettings.avgDurationMinutes,
        pax: isRestaurant ? 4 : 1,
        resourceId: res2?.id,
        resourceName: res2?.name,
        serviceId: newEst.services[0]?.id,
        serviceName: newEst.services[0]?.name,
        status: 'PENDING',
        notes: 'Aguardando confirmação do estabelecimento',
        createdAt: new Date().toISOString(),
        source: 'PUBLIC_WEB'
      },
      {
        id: `RZ-${Math.floor(1000 + Math.random() * 9000)}`,
        establishmentId: newEst.id,
        clientName: 'Rodrigo Almeida',
        clientPhone: '(11) 99123-4567',
        clientEmail: 'rodrigo.almeida@empresa.com.br',
        date: tomorrow,
        time: '15:00',
        durationMinutes: newEst.capacitySettings.avgDurationMinutes,
        pax: isRestaurant ? 3 : 1,
        resourceId: res1?.id,
        resourceName: res1?.name,
        serviceId: newEst.services[0]?.id,
        serviceName: newEst.services[0]?.name,
        status: 'CONFIRMED',
        notes: '',
        createdAt: new Date().toISOString(),
        source: 'MANUAL'
      },
      {
        id: `RZ-${Math.floor(1000 + Math.random() * 9000)}`,
        establishmentId: newEst.id,
        clientName: 'Beatriz Lima',
        clientPhone: '(11) 98888-7777',
        clientEmail: 'beatriz.lima@yahoo.com.br',
        date: inTwoDays,
        time: '20:00',
        durationMinutes: newEst.capacitySettings.avgDurationMinutes,
        pax: isRestaurant ? 2 : 1,
        resourceId: res3?.id,
        resourceName: res3?.name,
        serviceId: newEst.services[0]?.id,
        serviceName: newEst.services[0]?.name,
        status: 'CONFIRMED',
        notes: '',
        createdAt: new Date().toISOString(),
        source: 'PUBLIC_WEB'
      }
    ];

    setBookings(prev => [...personalizedBookings, ...prev]);
    setEstablishments(prev => [newEst, ...prev]);
    setCurrentEstablishmentId(newEst.id);
    setIsFirstAccess(true);
    setAppFlowState('APP');
    setActiveView('dashboard');
    addToast('success', 'Configuração concluída! 🎉', `O ${newEst.name} está pronto no ReservaZen.`);
  };

  const goToLanding = () => {
    setAppFlowState('LANDING');
  };

  const dismissFirstAccess = () => {
    setIsFirstAccess(false);
  };

  const switchEstablishment = (id: string) => {
    setCurrentEstablishmentId(id);
    const est = establishments.find(e => e.id === id);
    if (est) {
      addToast('info', `Ambiente alterado para ${est.name}`, `Perfil de ${est.businessType} carregado.`);
    }
  };

  const updateEstablishment = (updated: Establishment) => {
    setEstablishments(prev => prev.map(e => e.id === updated.id ? updated : e));
    addToast('success', 'Configurações salvas com sucesso!', 'As alterações do estabelecimento foram atualizadas.');
  };

  // Filtered bookings for current establishment & current date filter
  const filteredBookings = useMemo(() => {
    const estBookings = bookings.filter(b => b.establishmentId === currentEstablishment.id);
    const todayStr = new Date().toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateFilter === 'today') {
      return estBookings.filter(b => b.date === todayStr);
    }
    if (dateFilter === 'yesterday') {
      return estBookings.filter(b => b.date === yesterdayStr);
    }
    if (dateFilter === 'week') {
      const curr = new Date();
      const first = curr.getDate() - curr.getDay(); // First day is Sunday
      const last = first + 6; // last day is Saturday
      const firstDay = new Date(curr.setDate(first)).toISOString().split('T')[0];
      const lastDay = new Date(curr.setDate(last)).toISOString().split('T')[0];
      return estBookings.filter(b => b.date >= firstDay && b.date <= lastDay);
    }
    if (dateFilter === 'month') {
      const monthPrefix = todayStr.substring(0, 7); // YYYY-MM
      return estBookings.filter(b => b.date.startsWith(monthPrefix));
    }
    if (dateFilter === 'custom') {
      return estBookings.filter(b => b.date >= customStartDate && b.date <= customEndDate);
    }
    return estBookings;
  }, [bookings, currentEstablishment.id, dateFilter, customStartDate, customEndDate]);

  // Add booking
  const addBooking = (bookingData: Partial<Booking>): Booking => {
    const newId = `RZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: Booking = {
      id: newId,
      establishmentId: currentEstablishment.id,
      clientName: bookingData.clientName || 'Cliente sem nome',
      clientPhone: bookingData.clientPhone || '(00) 00000-0000',
      clientEmail: bookingData.clientEmail || '',
      date: bookingData.date || new Date().toISOString().split('T')[0],
      time: bookingData.time || '19:00',
      durationMinutes: bookingData.durationMinutes || currentEstablishment.capacitySettings.avgDurationMinutes,
      pax: bookingData.pax || 2,
      resourceId: bookingData.resourceId,
      resourceName: bookingData.resourceName,
      serviceId: bookingData.serviceId,
      serviceName: bookingData.serviceName,
      servicePrice: bookingData.servicePrice,
      status: bookingData.status || (currentEstablishment.capacitySettings.autoConfirm ? 'CONFIRMED' : 'PENDING'),
      notes: bookingData.notes || '',
      createdAt: new Date().toISOString(),
      source: bookingData.source || 'MANUAL'
    };

    setBookings(prev => [newBooking, ...prev]);

    // Also auto add/update client profile
    addOrUpdateClient({
      name: newBooking.clientName,
      phone: newBooking.clientPhone,
      email: newBooking.clientEmail,
      lastBookingDate: newBooking.date
    });

    addToast('success', `Reserva #${newBooking.id} criada!`, `Cliente: ${newBooking.clientName} para ${newBooking.date} às ${newBooking.time}.`);
    return newBooking;
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return { ...b, status };
      }
      return b;
    }));

    const statusMap: Record<BookingStatus, string> = {
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmada',
      IN_SERVICE: 'Em atendimento',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
      NO_SHOW: 'Não compareceu'
    };

    addToast('info', `Reserva #${bookingId}`, `Status alterado para: ${statusMap[status]}`);
  };

  const updateBooking = (updated: Booking) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
    addToast('success', `Reserva #${updated.id} atualizada`, 'Os dados da reserva foram atualizados.');
  };

  const deleteBooking = (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    addToast('info', `Reserva #${bookingId} removida`, 'A reserva foi excluída do sistema.');
  };

  const addOrUpdateClient = (clientData: Partial<Client>) => {
    if (!clientData.phone && !clientData.name) return;

    setClients(prev => {
      const existingIndex = prev.findIndex(c => c.establishmentId === currentEstablishment.id && (c.phone === clientData.phone || c.email === clientData.email));
      if (existingIndex >= 0) {
        const updated = [...prev];
        const current = updated[existingIndex];
        updated[existingIndex] = {
          ...current,
          name: clientData.name || current.name,
          phone: clientData.phone || current.phone,
          email: clientData.email || current.email,
          totalBookings: current.totalBookings + 1,
          lastBookingDate: clientData.lastBookingDate || current.lastBookingDate,
          notes: clientData.notes !== undefined ? clientData.notes : current.notes
        };
        return updated;
      } else {
        const newClient: Client = {
          id: `cli-${Math.random().toString(36).substring(2, 9)}`,
          establishmentId: currentEstablishment.id,
          name: clientData.name || 'Cliente Novo',
          phone: clientData.phone || '',
          email: clientData.email || '',
          totalBookings: 1,
          completedBookings: 1,
          cancelledBookings: 0,
          noShowBookings: 0,
          lastBookingDate: clientData.lastBookingDate || new Date().toISOString().split('T')[0],
          isVip: false,
          notes: clientData.notes || '',
          createdAt: new Date().toISOString()
        };
        return [newClient, ...prev];
      }
    });
  };

  // Adaptable terminology helper functions
  const getResourceTerm = (plural = false): string => {
    switch (currentEstablishment.businessType) {
      case 'RESTAURANT': return plural ? 'Mesas' : 'Mesa';
      case 'SALON': return plural ? 'Profissionais' : 'Profissional';
      case 'CLINIC': return plural ? 'Salas / Profissionais' : 'Sala';
      case 'STUDIO': return plural ? 'Salas / Professores' : 'Espaço / Professor';
      case 'EVENTS': return plural ? 'Espaços' : 'Espaço';
      default: return plural ? 'Recursos' : 'Recurso';
    }
  };

  const getServiceTerm = (plural = false): string => {
    switch (currentEstablishment.businessType) {
      case 'RESTAURANT': return plural ? 'Opções de Reserva' : 'Tipo de Reserva';
      case 'SALON': return plural ? 'Serviços' : 'Serviço';
      case 'CLINIC': return plural ? 'Procedimentos' : 'Procedimento';
      case 'STUDIO': return plural ? 'Aulas & Práticas' : 'Aula / Modalidade';
      case 'EVENTS': return plural ? 'Formatos de Evento' : 'Formato de Evento';
      default: return plural ? 'Serviços' : 'Serviço';
    }
  };

  const getPaxTerm = (): string => {
    switch (currentEstablishment.businessType) {
      case 'RESTAURANT': return 'Número de Pessoas';
      case 'SALON': return 'Atendimentos';
      case 'CLINIC': return 'Pacientes / Pessoas';
      case 'STUDIO': return 'Vagas / Alunos';
      case 'EVENTS': return 'Número de Convidados';
      default: return 'Pessoas';
    }
  };

  return (
    <AppContext.Provider value={{
      establishments,
      currentEstablishment,
      currentEstablishmentId,
      switchEstablishment,
      updateEstablishment,

      bookings,
      filteredBookings,
      addBooking,
      updateBookingStatus,
      updateBooking,
      deleteBooking,

      clients,
      addOrUpdateClient,

      activeView,
      setActiveView,

      dateFilter,
      setDateFilter,
      customStartDate,
      setCustomStartDate,
      customEndDate,
      setCustomEndDate,

      toasts,
      addToast,
      removeToast,

      publicSlug,
      setPublicSlug,

      appFlowState,
      currentUser,
      isFirstAccess,
      startSignup,
      startLogin,
      onPaymentConfirmed,
      logout,
      completeOnboarding,
      goToLanding,
      dismissFirstAccess,
      refreshSubscriptionStatus,

      getResourceTerm,
      getServiceTerm,
      getPaxTerm
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
