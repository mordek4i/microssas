import React from 'react';
import { useApp } from '../../context/AppContext';
import type { MainView } from '../../types';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BookCheck, 
  Users, 
  Store, 
  Settings, 
  ChevronDown,
  LogOut
} from 'lucide-react';

export interface SidebarProps {
  onOpenNewBookingModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { 
    activeView, 
    setActiveView, 
    establishments, 
    currentEstablishment, 
    switchEstablishment,
    filteredBookings,
    goToLanding,
    currentUser,
    logout
  } = useApp();

  const navItems: { id: MainView; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: CalendarDays },
    { id: 'bookings', label: 'Reservas', icon: BookCheck, count: filteredBookings.length },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'establishment', label: 'Meu estabelecimento', icon: Store },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div className="p-4 space-y-4">
        {/* Official Brand Logo */}
        <div className="px-2 py-2 flex items-center justify-center">
          <img
            src="/reservazen-logo-tight.png"
            alt="ReservaZen Logo"
            className="w-full max-w-[210px] h-auto object-contain"
          />
        </div>

        {/* Establishment Switcher Box */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 space-y-1 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Store className="w-4 h-4 text-slate-700" />
              </div>
              <div className="min-w-0">
                <select
                  value={currentEstablishment.id}
                  onChange={(e) => switchEstablishment(e.target.value)}
                  className="w-full bg-transparent text-slate-900 text-xs font-bold focus:outline-none appearance-none cursor-pointer pr-4 truncate"
                >
                  {establishments.map(est => (
                    <option key={est.id} value={est.id}>
                      {est.name}
                    </option>
                  ))}
                </select>
                <span className="block text-[11px] text-slate-500 font-medium truncate">
                  {currentEstablishment.businessType === 'RESTAURANT' ? 'Restaurante' :
                   currentEstablishment.businessType === 'SALON' ? 'Salão / Barbearia' :
                   currentEstablishment.businessType === 'CLINIC' ? 'Spa / Clínica' :
                   currentEstablishment.businessType === 'STUDIO' ? 'Studio' : 'Eventos'}
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Section */}
        <div className="pt-2">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            PRINCIPAL
          </div>
          
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive 
                      ? 'bg-[#e2f5b8] text-slate-900 shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/80 text-slate-900' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer & User Profile */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {currentUser && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-tight">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sair da conta"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          onClick={goToLanding}
          className="w-full text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200/80 transition-colors cursor-pointer"
        >
          🌐 Ver Landing Page
        </button>
        <div className="text-center text-[10px] text-slate-400">ReservaZen © 2026</div>
      </div>
    </aside>
  );
};
