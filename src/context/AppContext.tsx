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
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

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

  // Establishments state - strictly user scoped (one establishment per user)
  const [establishments, setEstablishments] = useState<Establishment[]>(() => {
    // Purge legacy shared establishments storage
    try {
      localStorage.removeItem('reservazen_establishments_v2');
      localStorage.removeItem('reservazen_establishments_v3');
      localStorage.removeItem('reservazen_establishments');
    } catch {}

    const savedSession = localStorage.getItem('reservazen_user_session_v3');
    if (savedSession) {
      try {
        const user: UserProfile = JSON.parse(savedSession);
        const userEst = localStorage.getItem(`reservazen_est_${user.id}`);
        if (userEst) {
          return [JSON.parse(userEst)];
        }
      } catch {}
    }
    return [INITIAL_ESTABLISHMENTS[0]];
  });

  const [currentEstablishmentId, setCurrentEstablishmentId] = useState<string>(() => {
    return establishments[0]?.id || 'est-bistro';
  });

  useEffect(() => {
    if (currentEstablishmentId) {
      localStorage.setItem('reservazen_current_est_id', currentEstablishmentId);
    }
  }, [currentEstablishmentId]);

  // Active Establishment (each user has only one)
  const currentEstablishment = useMemo(() => {
    return establishments[0] || INITIAL_ESTABLISHMENTS[0];
  }, [establishments]);

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

  // Sync bookings and clients to local storage
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

  // Helper to sync user profile and establishment with Supabase
  const syncUserWithSupabase = async (user: User): Promise<UserProfile> => {
    let profileName = user.user_metadata?.nome || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';

    // 1. Fetch or create user record in profiles table
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.nome) {
        profileName = profile.nome;
      } else {
        // Insert initial profile record with user_id, nome and email
        await supabase.from('profiles').insert([{
          user_id: user.id,
          nome: profileName,
          email: user.email
        }]);
      }
    } catch (err) {
      console.warn('Aviso ao sincronizar profiles no Supabase:', err);
    }

    // 2. Fetch business associated with this user using owner_id = user.id
    try {
      const { data: userBusinesses } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id);

      if (userBusinesses && userBusinesses.length > 0) {
        const b = userBusinesses[0];
        const loadedEst: Establishment = {
          id: b.id,
          name: b.name || 'Meu Estabelecimento',
          slug: (b.name || 'meu-estabelecimento')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'meu-estabelecimento',
          businessType: 'RESTAURANT',
          tagline: 'Horários organizados. Atendimento de excelência.',
          description: b.description || 'Bem-vindo ao nosso estabelecimento.',
          logoUrl: b.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
          phone: b.phone || '(11) 3333-4444',
          whatsapp: b.phone || '(11) 99999-9999',
          address: b.address || 'Rua Principal, 100',
          cityState: 'São Paulo, SP',
          instagram: '@reservazen',
          primaryColor: '#16a34a',
          businessHours: {
            0: { active: true, open: '18:00', close: '23:00' },
            1: { active: true, open: '18:00', close: '23:00' },
            2: { active: true, open: '18:00', close: '23:00' },
            3: { active: true, open: '18:00', close: '23:00' },
            4: { active: true, open: '18:00', close: '23:00' },
            5: { active: true, open: '18:00', close: '23:00' },
            6: { active: true, open: '18:00', close: '23:00' },
          },
          capacitySettings: {
            avgDurationMinutes: 90,
            minAdvanceHours: 2,
            toleranceMinutes: 15,
            maxPaxPerBooking: 8,
            autoConfirm: true,
            blockedDates: []
          },
          resources: [
            { id: `res-${b.id}-1`, name: 'Mesa 01', capacity: 4, active: true },
            { id: `res-${b.id}-2`, name: 'Mesa 02', capacity: 4, active: true },
            { id: `res-${b.id}-3`, name: 'Mesa 03', capacity: 4, active: true },
            { id: `res-${b.id}-4`, name: 'Mesa 04', capacity: 4, active: true },
          ],
          services: [
            { id: `srv-${b.id}-1`, name: 'Atendimento Padrão', durationMinutes: 90, active: true }
          ],
          cancellationPolicy: 'Cancelamento gratuito até 2 horas antes do horário reservado.'
        };

        // Merge user-scoped local details if present
        const userSavedEst = localStorage.getItem(`reservazen_est_${user.id}`);
        let finalEst = loadedEst;
        if (userSavedEst) {
          try {
            const parsed = JSON.parse(userSavedEst);
            finalEst = { ...loadedEst, ...parsed, id: b.id };
          } catch {}
        }

        // STRICTLY 1 ESTABLISHMENT PER USER
        localStorage.setItem(`reservazen_est_${user.id}`, JSON.stringify(finalEst));
        setEstablishments([finalEst]);
        setCurrentEstablishmentId(finalEst.id);
        setAppFlowState('APP');
      } else {
        // User is authenticated but hasn't configured a business yet
        setEstablishments([]);
        setAppFlowState('ONBOARDING');
      }
    } catch (err) {
      console.warn('Aviso ao buscar businesses no Supabase:', err);
      setEstablishments([]);
      setAppFlowState('ONBOARDING');
    }

    const trialEndsDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const userProfile: UserProfile = {
      id: user.id,
      name: profileName,
      email: user.email || '',
      subscription: {
        status: 'active',
        plan: 'trial_7_dias',
        amount: 97.0,
        trial_ends_at: trialEndsDate,
        expires_at: trialEndsDate
      }
    };

    setCurrentUser(userProfile);
    localStorage.setItem('reservazen_user_session_v3', JSON.stringify(userProfile));
    return userProfile;
  };

  // Persistent session initialization with Supabase
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Purge old contaminated shared storage keys
        localStorage.removeItem('reservazen_establishments_v2');
        localStorage.removeItem('reservazen_establishments_v3');
        localStorage.removeItem('reservazen_establishments');

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          await syncUserWithSupabase(session.user);
        } else if (isMounted) {
          // Restore saved session so reload NEVER kicks the user out
          const savedSession = localStorage.getItem('reservazen_user_session_v3');
          if (savedSession) {
            const parsed: UserProfile = JSON.parse(savedSession);
            setCurrentUser(parsed);

            const userSavedEst = localStorage.getItem(`reservazen_est_${parsed.id}`);
            if (userSavedEst) {
              const singleEst: Establishment = JSON.parse(userSavedEst);
              setEstablishments([singleEst]);
              setCurrentEstablishmentId(singleEst.id);
              setAppFlowState('APP');
            } else {
              setEstablishments([]);
              setAppFlowState('ONBOARDING');
            }
          } else {
            setAppFlowState('LANDING');
          }
        }
      } catch (err) {
        console.warn('Erro ao restaurar sessão do Supabase:', err);
      }
    };

    initAuth();

    // Real-time auth listener for session persistence across page refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        await syncUserWithSupabase(session.user);
      } else if (event === 'SIGNED_OUT') {
        const savedSession = localStorage.getItem('reservazen_user_session_v3');
        if (!savedSession) {
          setCurrentUser(null);
          setAppFlowState('LANDING');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Auth & Flow Actions with Supabase Auth
  const startSignup = async (name: string, email?: string, password?: string) => {
    if (!email || !password) throw new Error('E-mail e senha são obrigatórios.');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          nome: cleanName,
          name: cleanName
        }
      }
    });

    if (error) {
      if (error.message.includes('User already registered') || error.message.includes('already registered')) {
        throw new Error('Este e-mail já está cadastrado. Por favor, faça login.');
      }
      if (error.message.includes('Password should be at least')) {
        throw new Error('A senha deve ter no mínimo 6 caracteres.');
      }
      throw new Error(error.message || 'Erro ao realizar cadastro.');
    }

    const user = data.user;
    if (!user) throw new Error('Falha ao registrar usuário.');

    const trialEndsDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const profile: UserProfile = {
      id: user.id,
      name: cleanName,
      email: user.email || cleanEmail,
      subscription: {
        status: 'active',
        plan: 'trial_7_dias',
        amount: 97.0,
        trial_ends_at: trialEndsDate,
        expires_at: trialEndsDate
      }
    };

    // Save profile to local storage always so session is NEVER lost
    setCurrentUser(profile);
    localStorage.setItem('reservazen_user_session_v3', JSON.stringify(profile));

    // Cache user for instant login fallback if email confirmation is required
    const accounts = JSON.parse(localStorage.getItem('reservazen_accounts') || '{}');
    accounts[cleanEmail.toLowerCase()] = { profile, password: cleanPassword };
    localStorage.setItem('reservazen_accounts', JSON.stringify(accounts));

    if (data.session) {
      await syncUserWithSupabase(user);
      addToast('success', 'Conta criada com sucesso! 🎉', 'Vamos configurar seu negócio.');
    } else {
      setAppFlowState('ONBOARDING');
      addToast('success', 'Cadastro realizado! 🎉', 'Configure seu estabelecimento para começar.');
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

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword
    });

    if (error) {
      // If email confirmation is required by Supabase project settings
      if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        const accounts = JSON.parse(localStorage.getItem('reservazen_accounts') || '{}');
        const cached = accounts[cleanEmail.toLowerCase()];
        if (cached && (!cached.password || cached.password === cleanPassword)) {
          setCurrentUser(cached.profile);
          localStorage.setItem('reservazen_user_session_v3', JSON.stringify(cached.profile));

          const userSavedEst = localStorage.getItem(`reservazen_est_${cached.profile.id}`);
          if (userSavedEst) {
            const singleEst: Establishment = JSON.parse(userSavedEst);
            setEstablishments([singleEst]);
            setCurrentEstablishmentId(singleEst.id);
            setAppFlowState('APP');
          } else {
            setEstablishments([]);
            setAppFlowState('ONBOARDING');
          }
          addToast('info', 'E-mail pendente de confirmação no Supabase', 'Entrando na sua conta. (Dica: no Supabase desmarque "Confirm email" para dispensar confirmação).');
          return;
        }

        throw new Error('E-mail ainda não confirmado no Supabase. No painel do Supabase (Authentication -> Providers -> Email), desmarque a opção "Confirm email" para permitir login sem confirmação por link.');
      }

      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_grant')) {
        throw new Error('E-mail ou senha incorretos.');
      }
      throw new Error(error.message || 'Erro ao realizar login.');
    }

    const user = data.user;
    if (!user) throw new Error('Usuário não encontrado.');

    await syncUserWithSupabase(user);
    addToast('success', 'Login realizado com sucesso! 👋', 'Bem-vindo de volta.');
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

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Erro ao sair da conta:', err);
    }
    setCurrentUser(null);
    localStorage.removeItem('reservazen_user_session_v3');
    localStorage.removeItem('reservazen_current_est_id');
    setEstablishments([INITIAL_ESTABLISHMENTS[0]]);
    setCurrentEstablishmentId(INITIAL_ESTABLISHMENTS[0]?.id || 'est-bistro');
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

  const completeOnboarding = async (newEst: Establishment) => {
    let currentUserId = currentUser?.id;
    let currentUserEmail = currentUser?.email;

    // 1. Associate with Supabase businesses table using owner_id = user.id
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) currentUserId = user.id;
      if (user?.email) currentUserEmail = user.email;

      if (currentUserId && currentUserEmail) {
        // Ensure profile exists in profiles table
        try {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', currentUserId)
            .maybeSingle();

          if (!existingProfile) {
            await supabase.from('profiles').insert([{
              user_id: currentUserId,
              nome: currentUser?.name || currentUserEmail.split('@')[0] || 'Usuário',
              email: currentUserEmail
            }]);
          }
        } catch (pErr) {
          console.warn('Aviso profiles:', pErr);
        }

        // Check if business already exists for this owner
        try {
          const { data: existingBus } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', currentUserId)
            .maybeSingle();

          if (existingBus) {
            await supabase
              .from('businesses')
              .update({
                name: newEst.name,
                phone: newEst.phone || newEst.whatsapp,
                address: newEst.address,
                description: newEst.description,
                logo_url: newEst.logoUrl
              })
              .eq('id', existingBus.id);
            newEst.id = existingBus.id;
          } else {
            const { data: insertedBus, error: busError } = await supabase
              .from('businesses')
              .insert([{
                owner_id: currentUserId,
                name: newEst.name,
                phone: newEst.phone || newEst.whatsapp,
                email: currentUserEmail,
                address: newEst.address,
                description: newEst.description,
                logo_url: newEst.logoUrl
              }])
              .select()
              .single();

            if (busError) {
              console.warn('Aviso Supabase business:', busError);
            } else if (insertedBus?.id) {
              newEst.id = insertedBus.id;
            }
          }
        } catch (bErr) {
          console.warn('Aviso businesses:', bErr);
        }
      }
    } catch (err) {
      console.warn('Erro ao salvar business no Supabase:', err);
    }

    // 2. Set EXACTLY ONE establishment for this user and save scoped to user ID
    setEstablishments([newEst]);
    setCurrentEstablishmentId(newEst.id);
    if (currentUserId) {
      localStorage.setItem(`reservazen_est_${currentUserId}`, JSON.stringify(newEst));
    }
    localStorage.setItem('reservazen_current_est_id', newEst.id);

    // 3. Generate personalized initial sample bookings for the new establishment
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

  const updateEstablishment = async (updated: Establishment) => {
    setEstablishments([updated]);
    const uid = currentUser?.id;
    if (uid) {
      localStorage.setItem(`reservazen_est_${uid}`, JSON.stringify(updated));
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUid = user?.id || uid;
      if (currentUid) {
        await supabase
          .from('businesses')
          .update({
            name: updated.name,
            phone: updated.phone || updated.whatsapp,
            address: updated.address,
            description: updated.description,
            logo_url: updated.logoUrl
          })
          .eq('owner_id', currentUid);
      }
    } catch (err) {
      console.warn('Aviso ao sincronizar alteração de business com Supabase:', err);
    }
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
