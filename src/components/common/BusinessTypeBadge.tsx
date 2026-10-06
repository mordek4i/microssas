import React from 'react';
import type { BusinessType } from '../../types';
import { Utensils, Wine, Coffee, Scissors, Sparkles, Stethoscope, Activity, Building2, Briefcase } from 'lucide-react';

interface BusinessTypeBadgeProps {
  type: BusinessType;
  showIcon?: boolean;
}

export const BusinessTypeBadge: React.FC<BusinessTypeBadgeProps> = ({ type, showIcon = true }) => {
  const configMap: Record<BusinessType, { label: string; bg: string; icon: React.FC<{ className?: string }> }> = {
    RESTAURANT: {
      label: 'Restaurante',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      icon: Utensils
    },
    BAR: {
      label: 'Bar / Pub',
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      icon: Wine
    },
    CAFE: {
      label: 'Cafeteria',
      bg: 'bg-orange-50 border-orange-200 text-orange-700',
      icon: Coffee
    },
    SALON: {
      label: 'Salão de Beleza',
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      icon: Sparkles
    },
    BARBERSHOP: {
      label: 'Barbearia',
      bg: 'bg-sky-50 border-sky-200 text-sky-700',
      icon: Scissors
    },
    CLINIC: {
      label: 'Clínica',
      bg: 'bg-teal-50 border-teal-200 text-teal-700',
      icon: Stethoscope
    },
    SPA: {
      label: 'Spa & Terapias',
      bg: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      icon: Sparkles
    },
    STUDIO: {
      label: 'Studio / Fitness',
      bg: 'bg-purple-50 border-purple-200 text-purple-700',
      icon: Activity
    },
    EVENTS: {
      label: 'Espaço de Eventos',
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      icon: Building2
    },
    OTHER: {
      label: 'Outros Serviços',
      bg: 'bg-slate-50 border-slate-200 text-slate-700',
      icon: Briefcase
    }
  };

  const config = configMap[type] || configMap.OTHER;
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full border font-medium ${config.bg}`}>
      {showIcon && <IconComponent className="w-3.5 h-3.5" />}
      <span>{config.label}</span>
    </span>
  );
};

