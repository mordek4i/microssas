import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { AgendaView } from './components/agenda/AgendaView';
import { BookingManagement } from './components/bookings/BookingManagement';
import { NewBookingModal } from './components/bookings/NewBookingModal';
import { BookingDetailModal } from './components/bookings/BookingDetailModal';
import { ClientsList } from './components/clients/ClientsList';
import { ClientDetailModal } from './components/clients/ClientDetailModal';
import { EstablishmentView } from './components/establishment/EstablishmentView';
import { SettingsView } from './components/settings/SettingsView';
import { PublicBookingPage } from './components/public/PublicBookingPage';
import { NotificationToastContainer } from './components/common/NotificationToast';
import { LandingPage } from './components/landing/LandingPage';
import { AuthScreen } from './components/auth/AuthScreen';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { CheckoutPendingScreen } from './components/subscription/CheckoutPendingScreen';
import { SubscriptionBlockedScreen } from './components/subscription/SubscriptionBlockedScreen';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    isInitializingAuth,
    activeView, 
    publicSlug, 
    setPublicSlug, 
    appFlowState, 
    currentUser, 
    startSignup, 
    startLogin, 
    onPaymentConfirmed,
    logout,
    completeOnboarding 
  } = useApp();

  // Auth modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');

  // Booking & Client Modals
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [newBookingPreDate, setNewBookingPreDate] = useState<string | undefined>(undefined);
  const [newBookingPreTime, setNewBookingPreTime] = useState<string | undefined>(undefined);

  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
  const [detailClientId, setDetailClientId] = useState<string | null>(null);

  // Check URL parameters and path for direct public booking slug (e.g. /reservar/nome-do-negocio or ?slug=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get('slug');
    if (querySlug) {
      setPublicSlug(querySlug);
      return;
    }

    const pathname = window.location.pathname;
    if (pathname.startsWith('/reservar/')) {
      const pSlug = pathname.replace('/reservar/', '').split('/')[0].trim();
      if (pSlug) setPublicSlug(pSlug);
    } else if (pathname.startsWith('/r/')) {
      const pSlug = pathname.replace('/r/', '').split('/')[0].trim();
      if (pSlug) setPublicSlug(pSlug);
    }
  }, [setPublicSlug]);

  // 1. PUBLIC BOOKING PAGE (For clients scanning QR Code or accessing direct link)
  if (publicSlug) {
    return (
      <PublicBookingPage
        slug={publicSlug}
        onBackToDashboard={() => setPublicSlug(undefined)}
      />
    );
  }

  // 2. LOADING STATE DURING AUTH INITIALIZATION
  if (isInitializingAuth) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex flex-col items-center justify-center p-4 selection:bg-[#bde870]">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <img
            src="/reservazen-logo-tight.png"
            alt="ReservaZen"
            className="h-10 sm:h-12 w-auto object-contain"
          />
          <div className="flex items-center gap-2.5 text-slate-500 text-sm font-medium pt-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#16a34a]" />
            <span>Carregando sua sessão...</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. LANDING PAGE & AUTH STATE
  if (appFlowState === 'LANDING') {
    if (isAuthModalOpen) {
      return (
        <>
          <AuthScreen
            initialMode={authMode}
            onBackToHome={() => setIsAuthModalOpen(false)}
            onSuccessSignup={async (name, email, password) => {
              await startSignup(name, email, password);
              setIsAuthModalOpen(false);
            }}
            onSuccessLogin={async (email, password) => {
              await startLogin(email, password);
              setIsAuthModalOpen(false);
            }}
          />
          <NotificationToastContainer />
        </>
      );
    }

    return (
      <>
        <LandingPage
          onStartSignup={() => {
            setAuthMode('signup');
            setIsAuthModalOpen(true);
          }}
          onOpenLogin={() => {
            setAuthMode('login');
            setIsAuthModalOpen(true);
          }}
          onDemoAccess={() => {
            startLogin();
          }}
        />
        <NotificationToastContainer />
      </>
    );
  }

  // 3. CHECKOUT PENDING STATE (User registered, waiting for Cakto payment approval)
  if (appFlowState === 'CHECKOUT_PENDING' && currentUser) {
    return (
      <>
        <CheckoutPendingScreen
          user={currentUser}
          onPaymentConfirmed={onPaymentConfirmed}
          onLogout={logout}
        />
        <NotificationToastContainer />
      </>
    );
  }

  // 4. BLOCKED / CANCELED SUBSCRIPTION STATE
  if (appFlowState === 'BLOCKED_SUBSCRIPTION' && currentUser) {
    return (
      <>
        <SubscriptionBlockedScreen
          user={currentUser}
          onLogout={logout}
        />
        <NotificationToastContainer />
      </>
    );
  }

  // 5. ONBOARDING STATE (4-step guided setup for new business)
  if (appFlowState === 'ONBOARDING') {
    return (
      <>
        <OnboardingWizard
          userName={currentUser?.name || 'Proprietário'}
          onComplete={async (newEst) => await completeOnboarding(newEst)}
        />
        <NotificationToastContainer />
      </>
    );
  }

  // 4. MAIN SAAS APP STATE (Dashboard & Management)
  const handleOpenNewBookingModal = (date?: string, time?: string) => {
    setNewBookingPreDate(date);
    setNewBookingPreTime(time);
    setIsNewBookingModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#f8f8f6] text-slate-900 font-sans selection:bg-[#bde870] selection:text-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar onOpenNewBookingModal={() => handleOpenNewBookingModal()} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <Header onOpenNewBookingModal={() => handleOpenNewBookingModal()} />

        {/* View Router Body */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              onOpenNewBookingModal={() => handleOpenNewBookingModal()}
              onOpenBookingDetail={(id) => setDetailBookingId(id)}
            />
          )}

          {activeView === 'agenda' && (
            <AgendaView
              onOpenNewBookingModal={(d, t) => handleOpenNewBookingModal(d, t)}
              onOpenBookingDetail={(id) => setDetailBookingId(id)}
            />
          )}

          {activeView === 'bookings' && (
            <BookingManagement
              onOpenNewBookingModal={() => handleOpenNewBookingModal()}
              onOpenBookingDetail={(id) => setDetailBookingId(id)}
            />
          )}

          {activeView === 'clients' && (
            <ClientsList
              onOpenClientDetail={(id) => setDetailClientId(id)}
            />
          )}

          {activeView === 'establishment' && (
            <EstablishmentView />
          )}

          {activeView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Modals */}
      <NewBookingModal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        initialDate={newBookingPreDate}
        initialTime={newBookingPreTime}
      />

      <BookingDetailModal
        bookingId={detailBookingId}
        isOpen={!!detailBookingId}
        onClose={() => setDetailBookingId(null)}
      />

      <ClientDetailModal
        clientId={detailClientId}
        isOpen={!!detailClientId}
        onClose={() => setDetailClientId(null)}
      />

      {/* Toast Notifications */}
      <NotificationToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

