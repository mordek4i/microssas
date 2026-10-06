export type BusinessType = 
  | 'RESTAURANT'  // Restaurantes (Mesas, Salão)
  | 'BAR'         // Bares, Pubs (Mesas, Balcão)
  | 'CAFE'        // Cafeterias, Bistrôs (Mesas)
  | 'SALON'       // Salões de Beleza (Cabeleireiros, Manicures, Estilistas)
  | 'BARBERSHOP'  // Barbearias (Barbeiros, Cortes, Barba)
  | 'CLINIC'      // Clínicas Médicas / Estética (Consultórios, Especialistas)
  | 'SPA'         // Spas e Terapias (Salas de Massagem, Terapeutas)
  | 'STUDIO'      // Studios de Yoga, Pilates, Fitness (Aulas, Turmas, Professores)
  | 'EVENTS'      // Espaços de Eventos, Salões de Festa (Espaços, Lotação Máxima)
  | 'OTHER';      // Outros Serviços com Agendamento

export type BookingStatus = 
  | 'PENDING'     // Pendente
  | 'CONFIRMED'   // Confirmada
  | 'IN_SERVICE'  // Em atendimento
  | 'COMPLETED'   // Concluída
  | 'CANCELLED'   // Cancelada
  | 'NO_SHOW';    // Não compareceu

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 1 = Segunda, etc.

export interface BusinessHours {
  active: boolean;
  open: string;  // e.g. "09:00"
  close: string; // e.g. "22:00"
  breakStart?: string; // e.g. "15:00"
  breakEnd?: string;   // e.g. "18:00"
}

export type ResourceType = 'TABLE' | 'ROOM' | 'SPACE' | 'EQUIPMENT' | 'GENERAL';

export interface ResourceItem {
  id: string;
  name: string;          // e.g., "Mesa 01", "Lucas Barbeiro", "Sala Estética A", "Yoga Mat 05", "Salão Garden"
  capacity?: number;     // e.g. 4 pax
  description?: string;
  active: boolean;
  type?: string;         // e.g. "Varanda", "Interno", "Profissional", "Sala VIP"
  resourceType?: ResourceType;
  image?: string;
}

export interface ProfessionalItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  specialty?: string;
  active: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;          // e.g., "Corte de Cabelo + Barba", "Limpeza de Pele Facial", "Aula de Yoga Sunset"
  durationMinutes: number; // e.g., 45
  price?: number;        // e.g., 70.00
  category?: string;
  description?: string;
  active: boolean;
}

export interface EstablishmentCapacitySettings {
  avgDurationMinutes: number;   // Duração média
  minAdvanceHours: number;      // Antecedência mínima em horas
  toleranceMinutes: number;     // Tempo de tolerância em min
  maxPaxPerBooking: number;     // Limite de pessoas por reserva
  autoConfirm: boolean;         // Confirmação automática
  blockedDates: string[];       // Datas bloqueadas 'YYYY-MM-DD'
  holidaysNotice?: string;      // Observação sobre feriados
}

export interface Establishment {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  tagline: string;
  description: string;
  logoUrl: string;
  coverUrl: string;
  phone: string;
  whatsapp: string;
  address: string;
  cityState: string;
  instagram: string;
  primaryColor: string; // Hex color e.g., "#0d9488"
  businessHours: Record<number, BusinessHours>; // Keyed by DayOfWeek (0-6)
  capacitySettings: EstablishmentCapacitySettings;
  resources: ResourceItem[];
  professionals?: ProfessionalItem[];
  services: ServiceItem[];
  cancellationPolicy: string;
  categorySettings?: Record<string, any>;
}

export interface Booking {
  id: string;               // e.g. "RZ-1042"
  establishmentId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  date: string;             // YYYY-MM-DD
  time: string;             // HH:mm
  durationMinutes: number;
  pax: number;              // Quantidade de pessoas / convidados / vagas
  resourceId?: string;       // Mesa / Profissional / Sala / Espaço ID
  resourceName?: string;
  serviceId?: string;        // Serviço / Procedimento ID
  serviceName?: string;
  servicePrice?: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;         // ISO String
  source: 'PUBLIC_WEB' | 'MANUAL' | 'WHATSAPP';
}

export interface Client {
  id: string;
  establishmentId: string;
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  lastBookingDate: string;
  isVip: boolean;
  notes?: string;
  createdAt: string;
}

export type DateFilterType = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export type MainView = 
  | 'dashboard'
  | 'agenda'
  | 'bookings'
  | 'clients'
  | 'establishment'
  | 'settings'
  | 'public_preview';

export type SubscriptionStatus = 
  | 'trialing'
  | 'pending_payment'
  | 'active'
  | 'canceled'
  | 'refunded'
  | 'chargeback'
  | 'expired';

export interface UserSubscription {
  id?: string;
  status: SubscriptionStatus;
  plan: string;
  amount?: number;
  started_at?: string | null;
  expires_at?: string | null;
  trial_ends_at?: string | null;
  cakto_order_id?: string | null;
  cakto_product_id?: string | null;
  cakto_subscription_id?: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  subscription: UserSubscription;
}

