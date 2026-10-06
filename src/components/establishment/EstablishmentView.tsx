import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProfileConfig } from './ProfileConfig';
import { CategoryRulesConfig } from './CategoryRulesConfig';
import { ResourcesConfig } from './ResourcesConfig';
import { ProfessionalsConfig } from './ProfessionalsConfig';
import { ServicesConfig } from './ServicesConfig';
import { QrCodeGenerator } from './QrCodeGenerator';
import type { BusinessType } from '../../types';
import { Store, Sliders, Layers, Users, Scissors, QrCode } from 'lucide-react';

export type TabKey = 'profile' | 'resources' | 'professionals' | 'services' | 'rules' | 'qrcode';

export interface TabConfig {
  id: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const getCategoryPageTitle = (type: BusinessType): string => {
  switch (type) {
    case 'RESTAURANT': return 'Configurações do Restaurante';
    case 'BAR': return 'Configurações do Bar';
    case 'CAFE': return 'Configurações do Café';
    case 'BARBERSHOP': return 'Configurações da Barbearia';
    case 'SALON': return 'Configurações do Salão de Beleza';
    case 'CLINIC': return 'Configurações da Clínica';
    case 'SPA': return 'Configurações do Spa';
    case 'STUDIO': return 'Configurações do Studio';
    case 'EVENTS': return 'Configurações do Espaço de Eventos';
    default: return 'Configurações do Estabelecimento';
  }
};

export const getCategorySubtitle = (type: BusinessType): string => {
  switch (type) {
    case 'RESTAURANT': return 'Gerencie mesas, capacidade do salão, horários de giro e regras de reserva.';
    case 'BAR': return 'Gerencie mesas, comandas, lotação e regras de atendimento do bar.';
    case 'CAFE': return 'Gerencie mesas, capacidade e regras de reserva da cafeteria.';
    case 'BARBERSHOP': return 'Gerencie a equipe de barbeiros, catálogo de serviços e regras de agendamento.';
    case 'SALON': return 'Gerencie os profissionais de beleza, serviços oferecidos e tempos de procedimento.';
    case 'CLINIC': return 'Gerencie especialistas clínicos, catálogo de procedimentos e protocolos de preparo.';
    case 'SPA': return 'Gerencie terapeutas, catálogo de massagens, tratamentos e tempos de ambientação.';
    case 'STUDIO': return 'Gerencie instrutores, modalidades de aulas e limite de alunos por turma.';
    case 'EVENTS': return 'Gerencie ambientes locáveis, capacidade de convidados e regras de locação.';
    default: return 'Configure regras personalizadas, horários e recursos exclusivos para o seu negócio.';
  }
};

export const getCategoryBadgeLabel = (type: BusinessType): string => {
  switch (type) {
    case 'RESTAURANT': return 'Restaurante';
    case 'BAR': return 'Bar & Pub';
    case 'CAFE': return 'Cafeteria';
    case 'BARBERSHOP': return 'Barbearia';
    case 'SALON': return 'Salão de Beleza';
    case 'CLINIC': return 'Clínica';
    case 'SPA': return 'Spa & Terapias';
    case 'STUDIO': return 'Studio & Fitness';
    case 'EVENTS': return 'Espaço de Eventos';
    default: return 'Serviços';
  }
};

export const getCategoryTabs = (type: BusinessType): TabConfig[] => {
  switch (type) {
    case 'RESTAURANT':
    case 'BAR':
    case 'CAFE':
      return [
        { id: 'profile', label: 'Perfil & Horários', icon: Store },
        { id: 'resources', label: 'Mesas', icon: Layers },
        { id: 'rules', label: 'Opções de Reserva', icon: Sliders },
        { id: 'qrcode', label: 'QR Code', icon: QrCode },
      ];

    case 'BARBERSHOP':
      return [
        { id: 'profile', label: 'Perfil & Horários', icon: Store },
        { id: 'professionals', label: 'Barbeiros', icon: Users },
        { id: 'services', label: 'Serviços', icon: Scissors },
        { id: 'rules', label: 'Opções de Reserva', icon: Sliders },
        { id: 'qrcode', label: 'QR Code', icon: QrCode },
      ];

    case 'SALON':
      return [
        { id: 'profile', label: 'Perfil & Horários', icon: Store },
        { id: 'professionals', label: 'Profissionais', icon: Users },
        { id: 'services', label: 'Serviços', icon: Scissors },
        { id: 'rules', label: 'Opções de Reserva', icon: Sliders },
        { id: 'qrcode', label: 'QR Code', icon: QrCode },
      ];

    case 'CLINIC':
      return [
        { id: 'profile', label: 'Perfil & Horários', icon: Store },
        { id: 'professionals', label: 'Especialistas', icon: Users },
        { id: 'services', label: 'Procedimentos', icon: Scissors },
        { id: 'rules', label: 'Opções de Reserva', icon: Sliders },
        { id: 'qrcode', label: 'QR Code', icon: QrCode },
      ];

    case 'SPA':
      return [
        { id: 'profile', label: 'Perfil & Horários', icon: Store },
        { id: 'professionals', label: 'Terapeutas', icon: Users },
        { id: 'services', label: 'Tratamentos', icon: Scissors },
        { id: 'rules', label: 'Opções de Reserva', icon: Sliders },
        { id: 'qrcode', label: 'QR Code', icon: QrCode },
      ];

    case 'STUDIO':
      return [
        { id: 'profile', label: 'Perfil & Horários', icon: Store },
        { id: 'professionals', label: 'Professores', icon: Users },
        { id: 'services', label: 'Aulas/Modalidades', icon: Scissors },
        { id: 'rules', label: 'Opções de Reserva', icon: Sliders },
        { id: 'qrcode', label: 'QR Code', icon: QrCode },
      ];

    case 'EVENTS':
      return [
        { id: 'profile', label: 'Perfil & Horários', icon: Store },
        { id: 'resources', label: 'Espaços', icon: Layers },
        { id: 'rules', label: 'Opções de Reserva', icon: Sliders },
        { id: 'qrcode', label: 'QR Code', icon: QrCode },
      ];

    case 'OTHER':
    default:
      return [
        { id: 'profile', label: 'Perfil & Horários', icon: Store },
        { id: 'services', label: 'Serviços', icon: Scissors },
        { id: 'rules', label: 'Opções de Reserva', icon: Sliders },
        { id: 'qrcode', label: 'QR Code', icon: QrCode },
      ];
  }
};

export const EstablishmentView: React.FC = () => {
  const { currentEstablishment } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  const bType = currentEstablishment.businessType;
  const categoryTabs = getCategoryTabs(bType);

  // Guarantee that activeTab is always one of the valid tabs for the active category
  useEffect(() => {
    const validTabIds = categoryTabs.map(t => t.id);
    if (!validTabIds.includes(activeTab)) {
      setActiveTab('profile');
    }
  }, [bType, categoryTabs, activeTab]);

  return (
    <div className="space-y-6 pb-12">
      {/* Category Subtitle & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              {getCategoryPageTitle(bType)}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase">
              {getCategoryBadgeLabel(bType)}
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            {currentEstablishment.name}<span className="text-[#0d9488]">.</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {getCategorySubtitle(bType)}
          </p>
        </div>

        {/* Subnav Tabs */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/90 text-xs shadow-sm overflow-x-auto">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#bde870] text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'profile' && <ProfileConfig />}
      {activeTab === 'resources' && <ResourcesConfig />}
      {activeTab === 'professionals' && <ProfessionalsConfig />}
      {activeTab === 'services' && <ServicesConfig />}
      {activeTab === 'rules' && <CategoryRulesConfig />}
      {activeTab === 'qrcode' && <QrCodeGenerator />}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-200/60">
        <span>ReservaZen © 2026</span>
        <span>Configurações isoladas por estabelecimento ({currentEstablishment.name}).</span>
      </div>
    </div>
  );
};
