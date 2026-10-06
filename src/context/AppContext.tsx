import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { 
  Establishment, 
  Booking, 
  Client, 
  MainView, 
  DateFilterType, 
  BookingStatus,
  BusinessType,
  ResourceItem,
  ProfessionalItem,
  ServiceItem,
  BusinessHours,
  ResourceType,
  SubscriptionStatus
} from '../types';
import { INITIAL_ESTABLISHMENTS, INITIAL_BOOKINGS, INITIAL_CLIENTS } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { uploadBusinessAsset, deleteBusinessAsset } from '../lib/storage';
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
  uploadEstablishmentImage: (file: File, type: 'logo' | 'cover') => Promise<string>;
  removeEstablishmentImage: (type: 'logo' | 'cover') => Promise<void>;
  
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
  isInitializingAuth: boolean;
  appFlowState: AppFlowState;
  currentUser: UserProfile | null;
  isFirstAccess: boolean;
  startSignup: (name: string, email?: string, password?: string) => Promise<void>;
  startLogin: (email?: string, password?: string) => Promise<void>;
  onPaymentConfirmed: () => void;
  logout: () => void;
  completeOnboarding: (newEst: Establishment, logoFile?: File | null, coverFile?: File | null) => Promise<void>;
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
  const [isInitializingAuth, setIsInitializingAuth] = useState<boolean>(true);
  const [appFlowState, setAppFlowState] = useState<AppFlowState>('LANDING');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('reservazen_user_session_v3');
    if (!saved) return null;
    try {
      const parsed: UserProfile = JSON.parse(saved);
      // Legacy cache cleanup: if cached subscription had plan 'trial_7_dias' and status 'active' without Cakto payment, normalize to 'trialing'
      if (parsed.subscription?.plan === 'trial_7_dias' && parsed.subscription?.status === 'active' && !parsed.subscription?.cakto_order_id && !parsed.subscription?.cakto_subscription_id) {
        parsed.subscription.status = 'trialing';
        localStorage.setItem('reservazen_user_session_v3', JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
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

  // Bookings state - starts empty; Supabase is the official source of truth
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Clients state - starts empty; Supabase is the official source of truth
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CLIENTS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
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
  const [publicSlug, setPublicSlug] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get('slug');
    if (querySlug) return querySlug.trim();
    const pathname = window.location.pathname;
    if (pathname.startsWith('/reservar/')) {
      return pathname.replace('/reservar/', '').split('/')[0].trim() || undefined;
    }
    if (pathname.startsWith('/r/')) {
      return pathname.replace('/r/', '').split('/')[0].trim() || undefined;
    }
    return undefined;
  });

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

  // Helper to fetch establishment and its category-specific configuration from Supabase
  const fetchEstablishmentFromSupabase = async (b: any): Promise<Establishment> => {
    const busId = Number(b.id);
    const busType: BusinessType = (b.business_type as BusinessType) || 'RESTAURANT';

    // 1. Fetch business_settings (1:1 with business)
    const { data: settings } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', busId)
      .maybeSingle();

    // 2. Fetch resources
    const { data: dbResources } = await supabase
      .from('resources')
      .select('*')
      .eq('business_id', busId)
      .order('id');

    // 3. Fetch professionals
    const { data: dbProfessionals } = await supabase
      .from('professionals')
      .select('*')
      .eq('business_id', busId)
      .order('id');

    // 4. Fetch services
    const { data: dbServices } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', busId)
      .order('id');

    // 5. Fetch business_hours
    const { data: dbHours } = await supabase
      .from('business_hours')
      .select('*')
      .eq('business_id', busId)
      .order('day_of_week');

    const catSettings = settings?.category_settings || {};

    // Map business hours
    const businessHours: Record<number, BusinessHours> = {};
    if (dbHours && dbHours.length > 0) {
      dbHours.forEach((h: any) => {
        businessHours[h.day_of_week] = {
          active: h.is_open ?? true,
          open: h.opening_time ? h.opening_time.slice(0, 5) : '09:00',
          close: h.closing_time ? h.closing_time.slice(0, 5) : '22:00'
        };
      });
    } else {
      const defaultOpen = busType === 'RESTAURANT' ? '18:00' : '09:00';
      const defaultClose = busType === 'RESTAURANT' ? '23:00' : (busType === 'SALON' ? '19:00' : '18:00');
      for (let d = 0; d < 7; d++) {
        businessHours[d] = {
          active: d !== 0,
          open: defaultOpen,
          close: defaultClose
        };
      }
    }

    // Map resources
    let resources: ResourceItem[] = [];
    if (dbResources && dbResources.length > 0) {
      resources = dbResources.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        capacity: r.capacity || 1,
        active: r.active ?? true,
        resourceType: r.resource_type as ResourceType,
        type: r.resource_type === 'TABLE' ? 'Salão' : (r.resource_type === 'ROOM' ? 'Consultório' : 'Principal')
      }));
    } else if (busType === 'RESTAURANT' || busType === 'BAR' || busType === 'CAFE') {
      resources = [
        { id: `res-${busId}-1`, name: 'Mesa 01', capacity: 4, active: true, resourceType: 'TABLE', type: 'Salão' },
        { id: `res-${busId}-2`, name: 'Mesa 02', capacity: 4, active: true, resourceType: 'TABLE', type: 'Salão' },
        { id: `res-${busId}-3`, name: 'Mesa 03', capacity: 2, active: true, resourceType: 'TABLE', type: 'Salão' },
        { id: `res-${busId}-4`, name: 'Mesa 04', capacity: 6, active: true, resourceType: 'TABLE', type: 'Varanda' },
      ];
    } else if (busType === 'CLINIC') {
      resources = [
        { id: `res-${busId}-1`, name: 'Consultório 1', capacity: 1, active: true, resourceType: 'ROOM', type: 'Atendimento' },
        { id: `res-${busId}-2`, name: 'Consultório 2', capacity: 1, active: true, resourceType: 'ROOM', type: 'Procedimentos' }
      ];
    } else if (busType === 'SPA') {
      resources = [
        { id: `res-${busId}-1`, name: 'Sala Zen de Massagem', capacity: 1, active: true, resourceType: 'ROOM', type: 'Relaxamento' },
        { id: `res-${busId}-2`, name: 'Sala de Terapias', capacity: 1, active: true, resourceType: 'ROOM', type: 'Tratamentos' }
      ];
    } else if (busType === 'STUDIO') {
      resources = [
        { id: `res-${busId}-1`, name: 'Sala de Prática Principal', capacity: 15, active: true, resourceType: 'SPACE', type: 'Salão' }
      ];
    } else if (busType === 'EVENTS') {
      resources = [
        { id: `res-${busId}-1`, name: 'Salão Social Nobre', capacity: 120, active: true, resourceType: 'SPACE', type: 'Principal' }
      ];
    } // SALON and BARBERSHOP have NO physical tables/resources

    // Map professionals
    let professionals: ProfessionalItem[] = [];
    if (dbProfessionals && dbProfessionals.length > 0) {
      professionals = dbProfessionals.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        email: p.email || undefined,
        phone: p.phone || undefined,
        photoUrl: p.photo_url || undefined,
        specialty: p.specialty || undefined,
        active: p.active ?? true
      }));
    } else if (busType === 'BARBERSHOP') {
      professionals = [
        { id: `prof-${busId}-1`, name: 'Barbeiro Principal', specialty: 'Corte Tradicional & Barba', active: true }
      ];
    } else if (busType === 'SALON') {
      professionals = [
        { id: `prof-${busId}-1`, name: 'Cabeleireira / Estilista', specialty: 'Corte, Coloração & Penteados', active: true }
      ];
    } else if (busType === 'CLINIC') {
      professionals = [
        { id: `prof-${busId}-1`, name: 'Especialista', specialty: 'Estética Avançada', active: true }
      ];
    } else if (busType === 'SPA') {
      professionals = [
        { id: `prof-${busId}-1`, name: 'Terapeuta / Massoterapeuta', specialty: 'Massoterapia & Relaxamento', active: true }
      ];
    } else if (busType === 'STUDIO') {
      professionals = [
        { id: `prof-${busId}-1`, name: 'Instrutor Principal', specialty: 'Yoga & Pilates', active: true }
      ];
    } else if (busType === 'OTHER') {
      professionals = [
        { id: `prof-${busId}-1`, name: 'Profissional', specialty: 'Atendimento Geral', active: true }
      ];
    }

    // Map services
    let services: ServiceItem[] = [];
    if (dbServices && dbServices.length > 0) {
      services = dbServices.map((s: any) => ({
        id: String(s.id),
        name: s.name,
        description: s.description || undefined,
        price: Number(s.price) || 0,
        durationMinutes: s.duration_minutes || 60,
        active: s.active ?? true
      }));
    } else if (busType === 'BARBERSHOP') {
      services = [
        { id: `srv-${busId}-1`, name: 'Corte Tradicional Masculino', durationMinutes: 40, price: 50, active: true },
        { id: `srv-${busId}-2`, name: 'Barba Terapia com Toalha Quente', durationMinutes: 30, price: 40, active: true }
      ];
    } else if (busType === 'SALON') {
      services = [
        { id: `srv-${busId}-1`, name: 'Corte & Escova', durationMinutes: 60, price: 80, active: true },
        { id: `srv-${busId}-2`, name: 'Manicure Completa', durationMinutes: 45, price: 40, active: true }
      ];
    } else if (busType === 'RESTAURANT' || busType === 'BAR' || busType === 'CAFE') {
      services = [
        { id: `srv-${busId}-1`, name: 'Reserva de Mesa / Salão', durationMinutes: settings?.avg_duration_minutes || (busType === 'BAR' ? 120 : (busType === 'CAFE' ? 45 : 90)), active: true }
      ];
    } else if (busType === 'CLINIC') {
      services = [
        { id: `srv-${busId}-1`, name: 'Consulta / Avaliação', durationMinutes: 60, price: 150, active: true }
      ];
    } else if (busType === 'SPA') {
      services = [
        { id: `srv-${busId}-1`, name: 'Massagem Relaxante / Terapêutica', durationMinutes: 60, price: 180, active: true }
      ];
    } else if (busType === 'STUDIO') {
      services = [
        { id: `srv-${busId}-1`, name: 'Aula Experimental / Avulsa', durationMinutes: 60, price: 45, active: true }
      ];
    } else if (busType === 'EVENTS') {
      services = [
        { id: `srv-${busId}-1`, name: 'Locação do Espaço', durationMinutes: 240, price: 1200, active: true }
      ];
    } else {
      services = [
        { id: `srv-${busId}-1`, name: 'Atendimento Geral', durationMinutes: 60, price: 100, active: true }
      ];
    }

    const defaultDuration =
      busType === 'RESTAURANT' ? 90 :
      busType === 'BAR' ? 120 :
      busType === 'CAFE' ? 45 :
      busType === 'BARBERSHOP' ? 40 :
      busType === 'SALON' ? 60 :
      busType === 'CLINIC' ? 60 :
      busType === 'SPA' ? 60 :
      busType === 'EVENTS' ? 240 : 60;

    const defaultMaxPax =
      busType === 'RESTAURANT' || busType === 'BAR' ? 8 :
      busType === 'CAFE' ? 4 :
      busType === 'BARBERSHOP' || busType === 'SALON' || busType === 'CLINIC' || busType === 'SPA' ? 1 :
      busType === 'STUDIO' ? 15 :
      busType === 'EVENTS' ? 150 : 2;

    const loadedEst: Establishment = {
      id: String(busId),
      name: b.name || 'Meu Estabelecimento',
      slug: (b.name || 'meu-estabelecimento')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'meu-estabelecimento',
      businessType: busType,
      tagline: catSettings.tagline || (
        busType === 'RESTAURANT' ? 'Gastronomia e ambiente acolhedor.' :
        busType === 'BAR' ? 'Bons drinks, petiscos e momentos inesquecíveis.' :
        busType === 'CAFE' ? 'Cafés especiais, doces e ambiente aconchegante.' :
        busType === 'BARBERSHOP' ? 'Corte clássico, barba impecável e estilo.' :
        busType === 'SALON' ? 'Beleza, autoestima e bem-estar para você.' :
        busType === 'CLINIC' ? 'Saúde, beleza e cuidado humanizado.' :
        busType === 'SPA' ? 'Equilíbrio, serenidade e renovação profunda.' :
        busType === 'STUDIO' ? 'Corpo, mente e movimento consciente.' :
        busType === 'EVENTS' ? 'O cenário perfeito para momentos inesquecíveis.' :
        'Atendimento de excelência com hora marcada.'
      ),
      description: b.description || 'Bem-vindo ao nosso espaço.',
      logoUrl: b.logo_url || '',
      coverUrl: b.cover_image_url || catSettings.coverUrl || '',
      phone: b.phone || '',
      whatsapp: b.phone || '',
      address: b.address || '',
      cityState: catSettings.cityState || 'São Paulo, SP',
      instagram: catSettings.instagram || '@reservazen',
      primaryColor: catSettings.primaryColor || (
        busType === 'RESTAURANT' ? '#ea580c' :
        busType === 'BAR' ? '#b45309' :
        busType === 'CAFE' ? '#c2410c' :
        busType === 'BARBERSHOP' ? '#0284c7' :
        busType === 'SALON' ? '#e11d48' :
        busType === 'CLINIC' ? '#0d9488' :
        busType === 'SPA' ? '#0891b2' :
        busType === 'STUDIO' ? '#7c3aed' :
        busType === 'EVENTS' ? '#d97706' : '#475569'
      ),
      businessHours,
      capacitySettings: {
        avgDurationMinutes: settings?.avg_duration_minutes ?? defaultDuration,
        minAdvanceHours: settings?.min_advance_hours ?? 2,
        toleranceMinutes: settings?.tolerance_minutes ?? 15,
        maxPaxPerBooking: catSettings.max_group_size || catSettings.maxPaxPerBooking || defaultMaxPax,
        autoConfirm: settings?.auto_confirm ?? true,
        blockedDates: catSettings.blockedDates || []
      },
      resources,
      professionals,
      services,
      cancellationPolicy: settings?.cancellation_policy || 'Cancelamento gratuito até 2 horas antes do horário reservado.',
      categorySettings: catSettings
    };

    return loadedEst;
  };

  // Helper to persist establishment and its full configuration to Supabase
  const saveEstablishmentToSupabase = async (
    est: Establishment, 
    ownerId: string, 
    email?: string
  ): Promise<Establishment> => {
    let busId: number;

    const { data: existingBus } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (existingBus?.id) {
      busId = Number(existingBus.id);
      const { error: updateBusErr } = await supabase
        .from('businesses')
        .update({
          name: est.name,
          slug: est.slug,
          business_type: est.businessType,
          phone: est.phone || est.whatsapp,
          address: est.address,
          description: est.description,
          logo_url: est.logoUrl || null,
          cover_image_url: est.coverUrl || null
        })
        .eq('id', busId);

      if (updateBusErr) {
        console.error('Erro ao atualizar negócio no Supabase:', updateBusErr);
        throw updateBusErr;
      }
    } else {
      const { data: insertedBus, error: insertBusErr } = await supabase
        .from('businesses')
        .insert([{
          owner_id: ownerId,
          name: est.name,
          slug: est.slug,
          business_type: est.businessType,
          phone: est.phone || est.whatsapp,
          email: email || '',
          address: est.address,
          description: est.description,
          logo_url: est.logoUrl || null,
          cover_image_url: est.coverUrl || null
        }])
        .select('id')
        .single();

      if (insertBusErr) {
        console.error('Erro ao criar negócio no Supabase:', insertBusErr);
        throw insertBusErr;
      }
      busId = Number(insertedBus.id);
    }

    // 2. Upsert business_settings (1:1 with business)
    const categorySettingsToSave = {
      ...(est.categorySettings || {}),
      tagline: est.tagline,
      coverUrl: est.coverUrl,
      cityState: est.cityState,
      instagram: est.instagram,
      primaryColor: est.primaryColor,
      maxPaxPerBooking: est.capacitySettings?.maxPaxPerBooking,
      blockedDates: est.capacitySettings?.blockedDates || []
    };

    const { error: settingsErr } = await supabase
      .from('business_settings')
      .upsert({
        business_id: busId,
        avg_duration_minutes: est.capacitySettings?.avgDurationMinutes || (est.businessType === 'RESTAURANT' ? 90 : 45),
        min_advance_hours: est.capacitySettings?.minAdvanceHours || 2,
        tolerance_minutes: est.capacitySettings?.toleranceMinutes || 15,
        auto_confirm: est.capacitySettings?.autoConfirm ?? true,
        cancellation_policy: est.cancellationPolicy || 'Cancelamento gratuito até 2 horas antes do horário reservado.',
        category_settings: categorySettingsToSave,
        updated_at: new Date().toISOString()
      }, { onConflict: 'business_id' });

    if (settingsErr) {
      console.error('Erro ao salvar business_settings:', settingsErr);
      throw settingsErr;
    }

    // 3. Sync business_hours
    const { error: delHoursErr } = await supabase.from('business_hours').delete().eq('business_id', busId);
    if (delHoursErr) {
      console.error('Erro ao limpar business_hours:', delHoursErr);
      throw delHoursErr;
    }
    if (est.businessHours) {
      const hoursRows = Object.entries(est.businessHours).map(([dStr, h]) => ({
        business_id: busId,
        day_of_week: parseInt(dStr, 10),
        opening_time: h.open.length === 5 ? `${h.open}:00` : h.open,
        closing_time: h.close.length === 5 ? `${h.close}:00` : h.close,
        is_open: h.active
      }));
      if (hoursRows.length > 0) {
        const { error: insHoursErr } = await supabase.from('business_hours').insert(hoursRows);
        if (insHoursErr) {
          console.error('Erro ao salvar business_hours:', insHoursErr);
          throw insHoursErr;
        }
      }
    }

    // 4. Sync resources (neither SALON nor BARBERSHOP uses physical resources/tables)
    if (est.businessType === 'SALON' || est.businessType === 'BARBERSHOP') {
      const { error: delResErr } = await supabase.from('resources').delete().eq('business_id', busId);
      if (delResErr) throw delResErr;
    } else {
      const { error: delResErr } = await supabase.from('resources').delete().eq('business_id', busId);
      if (delResErr) throw delResErr;
      if (est.resources && est.resources.length > 0) {
        const defaultResType: ResourceType =
          (est.businessType === 'RESTAURANT' || est.businessType === 'BAR' || est.businessType === 'CAFE') ? 'TABLE' :
          (est.businessType === 'CLINIC' || est.businessType === 'SPA') ? 'ROOM' :
          (est.businessType === 'EVENTS' || est.businessType === 'STUDIO') ? 'SPACE' : 'GENERAL';

        const resourceRows = est.resources.map(r => ({
          business_id: busId,
          name: r.name,
          capacity: r.capacity || 1,
          resource_type: r.resourceType || defaultResType,
          active: r.active ?? true
        }));
        const { error: insResErr } = await supabase.from('resources').insert(resourceRows);
        if (insResErr) {
          console.error('Erro ao salvar resources:', insResErr);
          throw insResErr;
        }
      }
    }

    // 5. Sync professionals (for SALON, BARBERSHOP, CLINIC, SPA, STUDIO, OTHER)
    if (est.businessType === 'RESTAURANT' || est.businessType === 'BAR' || est.businessType === 'CAFE' || est.businessType === 'EVENTS') {
      const { error: delProfErr } = await supabase.from('professionals').delete().eq('business_id', busId);
      if (delProfErr) throw delProfErr;
    } else {
      const { error: delProfErr } = await supabase.from('professionals').delete().eq('business_id', busId);
      if (delProfErr) throw delProfErr;
      if (est.professionals && est.professionals.length > 0) {
        const profRows = est.professionals.map(p => ({
          business_id: busId,
          name: p.name,
          email: p.email || null,
          phone: p.phone || null,
          photo_url: p.photoUrl || null,
          specialty: p.specialty || null,
          active: p.active ?? true
        }));
        const { error: insProfErr } = await supabase.from('professionals').insert(profRows);
        if (insProfErr) {
          console.error('Erro ao salvar professionals:', insProfErr);
          throw insProfErr;
        }
      }
    }

    // 6. Sync services
    const { error: delSrvErr } = await supabase.from('services').delete().eq('business_id', busId);
    if (delSrvErr) throw delSrvErr;
    if (est.services && est.services.length > 0) {
      const srvRows = est.services.map(s => ({
        business_id: busId,
        name: s.name,
        description: s.description || null,
        price: s.price !== undefined ? Number(s.price) : 0,
        duration_minutes: s.durationMinutes || 45,
        active: s.active ?? true
      }));
      const { error: insSrvErr } = await supabase.from('services').insert(srvRows);
      if (insSrvErr) {
        console.error('Erro ao salvar services:', insSrvErr);
        throw insSrvErr;
      }
    }

    // 7. Reload fresh from Supabase to guarantee state consistency
    const { data: updatedBus, error: selBusErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', busId)
      .single();

    if (selBusErr || !updatedBus) {
      console.error('Erro ao recarregar negócio do Supabase:', selBusErr);
      throw (selBusErr || new Error('Negócio não encontrado após inserção.'));
    }

    return await fetchEstablishmentFromSupabase(updatedBus);
  };

  // Load real appointments and customers from Supabase for the active business
  const loadAppointmentsFromSupabase = async (businessId: number, estIdStr: string) => {
    try {
      const { data: appData, error: appErr } = await supabase
        .from('appointments')
        .select(`
          id,
          business_id,
          customer_id,
          professional_id,
          service_id,
          resource_id,
          start_time,
          end_time,
          status,
          notes,
          pax,
          created_at,
          customers (id, name, phone, email),
          services (id, name, price, duration_minutes),
          professionals (id, name),
          resources (id, name)
        `)
        .eq('business_id', businessId)
        .order('start_time', { ascending: false });

      if (appErr) {
        console.error('Erro ao buscar agendamentos do Supabase:', appErr);
      } else if (appData) {
        const mappedBookings: Booking[] = appData.map((a: any) => {
          const startIso = a.start_time || new Date().toISOString();
          const endIso = a.end_time || startIso;
          const durMin = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000) || 60;
          
          let bStatus: BookingStatus = 'CONFIRMED';
          if (a.status === 'scheduled') bStatus = 'PENDING';
          else if (a.status === 'confirmed') bStatus = 'CONFIRMED';
          else if (a.status === 'completed') bStatus = 'COMPLETED';
          else if (a.status === 'cancelled') bStatus = 'CANCELLED';
          else if (a.status === 'no_show') bStatus = 'NO_SHOW';

          return {
            id: `RZ-${a.id}`,
            establishmentId: estIdStr,
            clientName: a.customers?.name || 'Cliente',
            clientPhone: a.customers?.phone || '',
            clientEmail: a.customers?.email || '',
            date: startIso.split('T')[0],
            time: startIso.split('T')[1]?.substring(0, 5) || '12:00',
            durationMinutes: durMin,
            pax: a.pax || 1,
            resourceId: a.resource_id ? `res-${a.resource_id}` : undefined,
            resourceName: a.resources?.name,
            serviceId: a.service_id ? `srv-${a.service_id}` : undefined,
            serviceName: a.services?.name,
            servicePrice: a.services?.price ? Number(a.services.price) : undefined,
            status: bStatus,
            notes: a.notes || '',
            createdAt: a.created_at || new Date().toISOString(),
            source: 'PUBLIC_WEB'
          };
        });

        setBookings(mappedBookings);
        localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(mappedBookings));
      }

      // Also load customers
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (custErr) {
        console.error('Erro ao buscar clientes do Supabase:', custErr);
      } else if (custData) {
        const mappedClients: Client[] = custData.map((c: any) => ({
          id: `client-${c.id}`,
          establishmentId: estIdStr,
          name: c.name,
          phone: c.phone || '',
          email: c.email || '',
          totalBookings: 1,
          completedBookings: 0,
          cancelledBookings: 0,
          noShowBookings: 0,
          lastBookingDate: new Date().toISOString().split('T')[0],
          isVip: false,
          createdAt: c.created_at || new Date().toISOString()
        }));
        setClients(mappedClients);
        localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(mappedClients));
      }
    } catch (err) {
      console.warn('Aviso ao sincronizar agendamentos do Supabase:', err);
    }
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

    // 2. Fetch or create user subscription from Supabase
    let subData: any = null;
    try {
      const { data: dbSub, error: dbSubErr } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!dbSubErr && dbSub) {
        subData = dbSub;
      } else {
        // Create initial trial subscription via secure RPC if not existing
        const { data: rpcSub, error: rpcErr } = await supabase.rpc('get_or_create_user_subscription', {
          p_user_id: user.id
        });
        if (!rpcErr && rpcSub) {
          subData = rpcSub;
        }
      }
    } catch (subErr) {
      console.warn('Aviso ao sincronizar subscription no Supabase:', subErr);
    }

    let subStatus: SubscriptionStatus = (subData?.status as SubscriptionStatus) || 'trialing';
    const subPlan = subData?.plan || 'trial_7_dias';
    const startedAt = subData?.started_at || new Date().toISOString();
    const expiresAt = subData?.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const amount = subData?.amount ? Number(subData.amount) : 97.0;

    // Check trial expiration
    if (subStatus === 'trialing' && expiresAt) {
      const isExpired = new Date(expiresAt).getTime() <= Date.now();
      if (isExpired) {
        subStatus = 'expired';
      }
    }

    const userProfile: UserProfile = {
      id: user.id,
      name: profileName,
      email: user.email || '',
      subscription: {
        id: subData?.id,
        status: subStatus,
        plan: subPlan,
        amount: amount,
        started_at: startedAt,
        expires_at: expiresAt,
        trial_ends_at: expiresAt,
        cakto_order_id: subData?.cakto_order_id,
        cakto_product_id: subData?.cakto_product_id
      }
    };

    // 3. Fetch business associated with this user using owner_id = user.id
    let hasBusiness = false;
    try {
      const { data: userBusinesses } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id);

      if (userBusinesses && userBusinesses.length > 0) {
        hasBusiness = true;
        const b = userBusinesses[0];
        const loadedEst = await fetchEstablishmentFromSupabase(b);

        // Supabase is the primary source of truth; localStorage is cache
        localStorage.setItem(`reservazen_est_${user.id}`, JSON.stringify(loadedEst));
        setEstablishments([loadedEst]);
        setCurrentEstablishmentId(loadedEst.id);

        // Also fetch real appointments and customers for this business
        await loadAppointmentsFromSupabase(Number(b.id), loadedEst.id);
      } else {
        // User is authenticated but hasn't configured a business yet
        setEstablishments([]);
        setBookings([]);
        setClients([]);
        localStorage.removeItem(LOCAL_STORAGE_BOOKINGS_KEY);
        localStorage.removeItem(LOCAL_STORAGE_CLIENTS_KEY);
        localStorage.removeItem('reservazen_bookings');
        localStorage.removeItem('reservazen_clients');
      }
    } catch (err) {
      console.warn('Aviso ao buscar businesses no Supabase:', err);
      setEstablishments([]);
      setBookings([]);
      setClients([]);
    }

    // 4. Determine AppFlowState based on subscription & business existence
    if (subStatus === 'pending_payment') {
      setAppFlowState('CHECKOUT_PENDING');
    } else if (subStatus === 'expired' || ['canceled', 'refunded', 'chargeback'].includes(subStatus)) {
      setAppFlowState('BLOCKED_SUBSCRIPTION');
    } else {
      // User has active or valid trialing access
      setAppFlowState(hasBusiness ? 'APP' : 'ONBOARDING');
    }

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

        // Sanitize legacy cached session in localStorage if present
        const rawSaved = localStorage.getItem('reservazen_user_session_v3');
        if (rawSaved) {
          try {
            const parsedSaved = JSON.parse(rawSaved);
            if (parsedSaved?.subscription?.plan === 'trial_7_dias' && parsedSaved?.subscription?.status === 'active' && !parsedSaved?.subscription?.cakto_order_id && !parsedSaved?.subscription?.cakto_subscription_id) {
              parsedSaved.subscription.status = 'trialing';
              localStorage.setItem('reservazen_user_session_v3', JSON.stringify(parsedSaved));
            }
          } catch {}
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          // Valid Supabase session exists: Supabase is the sole source of truth!
          await syncUserWithSupabase(session.user);
        } else if (isMounted) {
          // If NO valid Supabase session exists, DO NOT grant access to the dashboard (APP) based only on localStorage!
          // LocalStorage is never proof of a valid subscription or session.
          setCurrentUser(null);
          localStorage.removeItem('reservazen_user_session_v3');
          setAppFlowState('LANDING');
        }
      } catch (err) {
        console.warn('Erro ao restaurar sessão do Supabase:', err);
        if (isMounted) {
          setCurrentUser(null);
          setAppFlowState('LANDING');
        }
      } finally {
        if (isMounted) {
          setIsInitializingAuth(false);
        }
      }
    };

    initAuth();

    // Real-time auth listener for session persistence across page refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        await syncUserWithSupabase(session.user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('reservazen_user_session_v3');
        setAppFlowState('LANDING');
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
        status: 'trialing',
        plan: 'trial_7_dias',
        amount: 97.0,
        started_at: new Date().toISOString(),
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
      addToast('success', 'Conta criada com sucesso! 🎉', 'Você tem 7 dias de teste grátis.');
    } else {
      setAppFlowState('ONBOARDING');
      addToast('success', 'Cadastro realizado! 🎉', 'Você tem 7 dias de teste grátis.');
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
      setEstablishments(INITIAL_ESTABLISHMENTS);
      setCurrentEstablishmentId(INITIAL_ESTABLISHMENTS[0]?.id || 'est-bistro');
      setBookings(INITIAL_BOOKINGS);
      setClients(INITIAL_CLIENTS);
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
          const profile = { ...cached.profile };
          if (profile.subscription?.plan === 'trial_7_dias' && profile.subscription?.status === 'active' && !profile.subscription?.cakto_order_id && !profile.subscription?.cakto_subscription_id) {
            profile.subscription.status = 'trialing';
          }

          let isBlocked = false;
          if (profile.subscription) {
            const { status, expires_at } = profile.subscription;
            const isExpired = status === 'trialing' && expires_at && new Date(expires_at).getTime() <= Date.now();
            isBlocked = isExpired || ['canceled', 'refunded', 'chargeback', 'expired'].includes(status);
          }

          setCurrentUser(profile);
          localStorage.setItem('reservazen_user_session_v3', JSON.stringify(profile));

          if (isBlocked) {
            setAppFlowState('BLOCKED_SUBSCRIPTION');
          } else {
            const userSavedEst = localStorage.getItem(`reservazen_est_${profile.id}`);
            if (userSavedEst) {
              const singleEst: Establishment = JSON.parse(userSavedEst);
              setEstablishments([singleEst]);
              setCurrentEstablishmentId(singleEst.id);
              setAppFlowState('APP');
            } else {
              setEstablishments([]);
              setAppFlowState('ONBOARDING');
            }
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
    localStorage.removeItem(LOCAL_STORAGE_BOOKINGS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_CLIENTS_KEY);
    localStorage.removeItem('reservazen_bookings');
    localStorage.removeItem('reservazen_clients');
    setBookings([]);
    setClients([]);
    setEstablishments([INITIAL_ESTABLISHMENTS[0]]);
    setCurrentEstablishmentId(INITIAL_ESTABLISHMENTS[0]?.id || 'est-bistro');
    setAppFlowState('LANDING');
    addToast('info', 'Você saiu da sua conta.', 'Até breve!');
  };

  const refreshSubscriptionStatus = async () => {
    if (!currentUser?.id) return;
    try {
      const { data: subData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && subData) {
        let subStatus: SubscriptionStatus = (subData.status as SubscriptionStatus) || 'trialing';
        const expiresAt = subData.expires_at;
        if (subStatus === 'trialing' && expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
          subStatus = 'expired';
        }

        const updated: UserProfile = {
          ...currentUser,
          subscription: {
            ...currentUser.subscription,
            id: subData.id,
            status: subStatus,
            plan: subData.plan || currentUser.subscription.plan,
            amount: subData.amount ? Number(subData.amount) : currentUser.subscription.amount,
            started_at: subData.started_at,
            expires_at: subData.expires_at,
            trial_ends_at: subData.expires_at,
            cakto_order_id: subData.cakto_order_id,
            cakto_product_id: subData.cakto_product_id
          }
        };

        setCurrentUser(updated);
        localStorage.setItem('reservazen_user_session_v3', JSON.stringify(updated));

        if (subStatus === 'active') {
          if (appFlowState === 'CHECKOUT_PENDING' || appFlowState === 'BLOCKED_SUBSCRIPTION') {
            const hasEst = establishments && establishments.length > 0 && establishments[0]?.name;
            setAppFlowState(hasEst ? 'APP' : 'ONBOARDING');
          }
        } else if (subStatus === 'expired' || ['canceled', 'refunded', 'chargeback'].includes(subStatus)) {
          setAppFlowState('BLOCKED_SUBSCRIPTION');
        }
      }
    } catch (err) {
      console.warn('Erro ao atualizar status da assinatura:', err);
    }
  };

  const completeOnboarding = async (
    newEst: Establishment,
    logoFile?: File | null,
    coverFile?: File | null
  ): Promise<void> => {
    // 1. Confirm active authenticated user session in Supabase
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user?.id) {
      console.error('Falha de autenticação ao tentar salvar estabelecimento no onboarding:', authErr);
      throw new Error('Usuário não autenticado no Supabase. Por favor, faça login novamente.');
    }

    const currentUserId = user.id;
    const currentUserEmail = user.email || currentUser?.email || '';

    // 2. Ensure profile exists in profiles table
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

    // 3. Persist complete establishment and configurations to Supabase
    // If Supabase returns error, DO NOT swallow it: log and rethrow immediately!
    let savedEst: Establishment;
    try {
      savedEst = await saveEstablishmentToSupabase(newEst, currentUserId, currentUserEmail);
    } catch (err) {
      console.error('Erro ao salvar business no Supabase:', err);
      throw err;
    }

    // Upload optional logo / cover if provided during onboarding
    const busId = Number(savedEst.id);
    if (logoFile && busId) {
      try {
        const logoUrl = await uploadBusinessAsset(busId, logoFile, 'logo');
        await supabase.from('businesses').update({ logo_url: logoUrl }).eq('id', busId).eq('owner_id', currentUserId);
        savedEst.logoUrl = logoUrl;
      } catch (lErr) {
        console.warn('Aviso ao enviar logo no onboarding:', lErr);
      }
    }

    if (coverFile && busId) {
      try {
        const coverUrl = await uploadBusinessAsset(busId, coverFile, 'cover');
        await supabase.from('businesses').update({ cover_image_url: coverUrl }).eq('id', busId).eq('owner_id', currentUserId);
        savedEst.coverUrl = coverUrl;
      } catch (cErr) {
        console.warn('Aviso ao enviar capa no onboarding:', cErr);
      }
    }

    // 4. Set state and local cache ONLY after Supabase confirms persistence
    setEstablishments([savedEst]);
    setCurrentEstablishmentId(savedEst.id);
    localStorage.setItem(`reservazen_est_${currentUserId}`, JSON.stringify(savedEst));
    localStorage.setItem('reservazen_current_est_id', savedEst.id);

    // 5. Newly created establishment starts clean with 0 bookings and 0 mock clients
    setBookings([]);
    setClients([]);
    localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify([]));

    setIsFirstAccess(true);
    setAppFlowState('APP');
    setActiveView('dashboard');
    addToast('success', 'Configuração concluída! 🎉', `O ${savedEst.name} está pronto no ReservaZen.`);
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
    let currentUserId = currentUser?.id;
    let currentUserEmail = currentUser?.email;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) currentUserId = user.id;
      if (user?.email) currentUserEmail = user.email;

      if (currentUserId) {
        const saved = await saveEstablishmentToSupabase(updated, currentUserId, currentUserEmail);
        setEstablishments([saved]);
        localStorage.setItem(`reservazen_est_${currentUserId}`, JSON.stringify(saved));
        addToast('success', 'Configurações salvas com sucesso!', 'As alterações do estabelecimento foram sincronizadas no Supabase.');
        return;
      }
    } catch (err) {
      console.warn('Aviso ao sincronizar alteração com Supabase:', err);
    }

    setEstablishments([updated]);
    if (currentUserId) {
      localStorage.setItem(`reservazen_est_${currentUserId}`, JSON.stringify(updated));
    }
    addToast('success', 'Configurações salvas com sucesso!', 'As alterações do estabelecimento foram atualizadas.');
  };

  const uploadEstablishmentImage = async (file: File, type: 'logo' | 'cover'): Promise<string> => {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user?.id) {
      throw new Error('Usuário não autenticado no Supabase.');
    }

    const busId = Number(currentEstablishment.id);
    if (!busId || isNaN(busId)) {
      throw new Error('ID do estabelecimento não identificado.');
    }

    // 1. Upload to Supabase Storage bucket 'business-assets'
    const publicUrl = await uploadBusinessAsset(busId, file, type);

    // 2. Persist URL reference in businesses table
    const updatePayload = type === 'logo' ? { logo_url: publicUrl } : { cover_image_url: publicUrl };
    const { error: dbErr } = await supabase
      .from('businesses')
      .update(updatePayload)
      .eq('id', busId)
      .eq('owner_id', user.id);

    if (dbErr) {
      console.error('Erro ao atualizar referência da imagem no banco:', dbErr);
      throw dbErr;
    }

    // 3. Update React state and local storage cache
    const updated: Establishment = {
      ...currentEstablishment,
      logoUrl: type === 'logo' ? publicUrl : currentEstablishment.logoUrl,
      coverUrl: type === 'cover' ? publicUrl : currentEstablishment.coverUrl
    };

    setEstablishments(prev => prev.map(e => e.id === String(busId) ? updated : e));
    localStorage.setItem(`reservazen_est_${user.id}`, JSON.stringify(updated));

    addToast('success', type === 'logo' ? 'Logo atualizada!' : 'Foto de capa atualizada!', 'A imagem foi salva no Supabase Storage.');
    return publicUrl;
  };

  const removeEstablishmentImage = async (type: 'logo' | 'cover'): Promise<void> => {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user?.id) {
      throw new Error('Usuário não autenticado no Supabase.');
    }

    const busId = Number(currentEstablishment.id);
    if (!busId || isNaN(busId)) {
      throw new Error('ID do estabelecimento não identificado.');
    }

    // 1. Remove physical file from Supabase Storage
    await deleteBusinessAsset(busId, type);

    // 2. Clear database reference
    const updatePayload = type === 'logo' ? { logo_url: null } : { cover_image_url: null };
    const { error: dbErr } = await supabase
      .from('businesses')
      .update(updatePayload)
      .eq('id', busId)
      .eq('owner_id', user.id);

    if (dbErr) {
      console.error('Erro ao limpar referência no banco:', dbErr);
      throw dbErr;
    }

    // 3. Update React state and local storage cache
    const updated: Establishment = {
      ...currentEstablishment,
      logoUrl: type === 'logo' ? '' : currentEstablishment.logoUrl,
      coverUrl: type === 'cover' ? '' : currentEstablishment.coverUrl
    };

    setEstablishments(prev => prev.map(e => e.id === String(busId) ? updated : e));
    localStorage.setItem(`reservazen_est_${user.id}`, JSON.stringify(updated));

    addToast('info', type === 'logo' ? 'Logo removida' : 'Foto de capa removida', 'A imagem foi excluída com sucesso.');
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

    // If active establishment is a real Supabase business, persist appointment
    const busId = Number(currentEstablishment.id);
    if (!isNaN(busId) && busId > 0) {
      (async () => {
        try {
          let custId: number | null = null;
          if (newBooking.clientPhone) {
            const { data: existingCust } = await supabase
              .from('customers')
              .select('id')
              .eq('business_id', busId)
              .eq('phone', newBooking.clientPhone)
              .maybeSingle();

            if (existingCust?.id) {
              custId = existingCust.id;
            } else {
              const { data: newCust } = await supabase
                .from('customers')
                .insert([{
                  business_id: busId,
                  name: newBooking.clientName,
                  phone: newBooking.clientPhone,
                  email: newBooking.clientEmail || null
                }])
                .select('id')
                .single();
              if (newCust?.id) {
                custId = newCust.id;
              }
            }
          }

          const resIdNum = newBooking.resourceId ? parseInt(newBooking.resourceId.replace(/\D/g, ''), 10) : null;
          const srvIdNum = newBooking.serviceId ? parseInt(newBooking.serviceId.replace(/\D/g, ''), 10) : null;

          const startTs = new Date(`${newBooking.date}T${newBooking.time}:00`).toISOString();
          const endTs = new Date(new Date(startTs).getTime() + (newBooking.durationMinutes || 60) * 60000).toISOString();

          const dbStatus = newBooking.status === 'PENDING' ? 'scheduled' :
            newBooking.status === 'CONFIRMED' ? 'confirmed' :
            newBooking.status === 'COMPLETED' ? 'completed' :
            newBooking.status === 'CANCELLED' ? 'cancelled' : 'scheduled';

          const { data: insApp, error: appErr } = await supabase
            .from('appointments')
            .insert([{
              business_id: busId,
              customer_id: custId,
              resource_id: resIdNum && !isNaN(resIdNum) ? resIdNum : null,
              service_id: srvIdNum && !isNaN(srvIdNum) ? srvIdNum : null,
              start_time: startTs,
              end_time: endTs,
              status: dbStatus,
              pax: newBooking.pax || 1,
              notes: newBooking.notes || null
            }])
            .select('id')
            .single();

          if (!appErr && insApp?.id) {
            setBookings(prev => prev.map(b => b.id === newId ? { ...b, id: `RZ-${insApp.id}` } : b));
          }
        } catch (err) {
          console.warn('Aviso ao sincronizar agendamento manual no Supabase:', err);
        }
      })();
    }

    addToast('success', `Reserva #${newBooking.id} criada!`, `Cliente: ${newBooking.clientName} para ${newBooking.date} às ${newBooking.time}.`);
    return newBooking;
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return { ...b, status };
      }
      return b;
    }));

    // If booking corresponds to a real Supabase appointment, sync status
    const rawId = bookingId.startsWith('RZ-') ? bookingId.replace('RZ-', '') : bookingId;
    if (/^\d+$/.test(rawId)) {
      const statusMapDb: Record<BookingStatus, string> = {
        PENDING: 'scheduled',
        CONFIRMED: 'confirmed',
        IN_SERVICE: 'confirmed',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        NO_SHOW: 'no_show'
      };
      try {
        const { error } = await supabase
          .from('appointments')
          .update({ status: statusMapDb[status] })
          .eq('id', parseInt(rawId, 10));
        if (error) {
          console.error('Erro ao sincronizar status do agendamento no Supabase:', error);
        }
      } catch (err) {
        console.warn('Erro ao atualizar agendamento no Supabase:', err);
      }
    }

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

  const deleteBooking = async (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));

    const rawId = bookingId.startsWith('RZ-') ? bookingId.replace('RZ-', '') : bookingId;
    if (/^\d+$/.test(rawId)) {
      try {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', parseInt(rawId, 10));
        if (error) {
          console.error('Erro ao excluir agendamento no Supabase:', error);
        }
      } catch (err) {
        console.warn('Erro ao excluir agendamento no Supabase:', err);
      }
    }

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
      case 'RESTAURANT':
      case 'BAR':
      case 'CAFE':
        return plural ? 'Mesas' : 'Mesa';
      case 'BARBERSHOP':
        return plural ? 'Cadeiras' : 'Cadeira';
      case 'SALON':
        return plural ? 'Bancadas' : 'Bancada';
      case 'CLINIC':
        return plural ? 'Consultórios' : 'Consultório';
      case 'SPA':
        return plural ? 'Salas de Terapia' : 'Sala de Terapia';
      case 'STUDIO':
        return plural ? 'Salas de Prática' : 'Sala de Prática';
      case 'EVENTS':
        return plural ? 'Espaços' : 'Espaço';
      default:
        return plural ? 'Recursos' : 'Recurso';
    }
  };

  const getServiceTerm = (plural = false): string => {
    switch (currentEstablishment.businessType) {
      case 'RESTAURANT':
      case 'BAR':
      case 'CAFE':
        return plural ? 'Opções de Reserva' : 'Opção de Reserva';
      case 'BARBERSHOP':
        return plural ? 'Serviços' : 'Serviço';
      case 'SALON':
        return plural ? 'Serviços' : 'Serviço';
      case 'CLINIC':
        return plural ? 'Procedimentos' : 'Procedimento';
      case 'SPA':
        return plural ? 'Tratamentos' : 'Tratamento';
      case 'STUDIO':
        return plural ? 'Aulas/Modalidades' : 'Aula/Modalidade';
      case 'EVENTS':
        return plural ? 'Formatos de Locação' : 'Formato de Locação';
      default:
        return plural ? 'Serviços' : 'Serviço';
    }
  };

  const getPaxTerm = (): string => {
    switch (currentEstablishment.businessType) {
      case 'RESTAURANT':
      case 'BAR':
        return 'Pessoas / Convidados (Pax)';
      case 'CAFE':
        return 'Lugares / Pessoas';
      case 'BARBERSHOP':
      case 'SALON':
        return 'Atendimentos simultâneos';
      case 'CLINIC':
      case 'SPA':
        return 'Pacientes / Clientes';
      case 'STUDIO':
        return 'Capacidade / Alunos por turma';
      case 'EVENTS':
        return 'Convidados / Lotação máxima';
      default:
        return 'Pessoas';
    }
  };

  return (
    <AppContext.Provider value={{
      establishments,
      currentEstablishment,
      currentEstablishmentId,
      switchEstablishment,
      updateEstablishment,
      uploadEstablishmentImage,
      removeEstablishmentImage,

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

      isInitializingAuth,
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
