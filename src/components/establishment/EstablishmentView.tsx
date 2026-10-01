import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProfileConfig } from './ProfileConfig';
import { ResourcesConfig } from './ResourcesConfig';
import { ServicesConfig } from './ServicesConfig';
import { QrCodeGenerator } from './QrCodeGenerator';
import { Store, Layers, Scissors, QrCode } from 'lucide-react';

export const EstablishmentView: React.FC = () => {
  const { getResourceTerm, getServiceTerm } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'resources' | 'services' | 'qrcode'>('profile');

  return (
    <div className="space-y-6 pb-12">
      {/* Category Subtitle & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
            DADOS & RECURSOS DO ESTABELECIMENTO
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Meu estabelecimento<span className="text-[#0d9488]">.</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Horários organizados. Uma rotina mais tranquila.
          </p>
        </div>

        {/* Subnav Tabs */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/90 text-xs shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'profile' ? 'bg-[#bde870] text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Perfil & Horários</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'resources' ? 'bg-[#bde870] text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{getResourceTerm(true)}</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'services' ? 'bg-[#bde870] text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>{getServiceTerm(true)}</span>
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'qrcode' ? 'bg-[#bde870] text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'profile' && <ProfileConfig />}
      {activeTab === 'resources' && <ResourcesConfig />}
      {activeTab === 'services' && <ServicesConfig />}
      {activeTab === 'qrcode' && <QrCodeGenerator />}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-200/60">
        <span>ReservaZen © 2026</span>
        <span>Sua rotina com mais tranquilidade.</span>
      </div>
    </div>
  );
};
