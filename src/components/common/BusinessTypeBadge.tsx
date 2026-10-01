import React from 'react';
import type { BusinessType } from '../../types';
import { Utensils, Scissors, Sparkles, Activity, Building2 } from 'lucide-react';

interface BusinessTypeBadgeProps {
  type: BusinessType;
  showIcon?: boolean;
}

export const BusinessTypeBadge: React.FC<BusinessTypeBadgeProps> = ({ type, showIcon = true }) => {
  const config = {
    RESTAURANT: {
      label: 'Restaurante / Bar',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      icon: Utensils
    },
    SALON: {
      label: 'Salão / Barbearia',
      bg: 'bg-sky-50 border-sky-200 text-sky-700',
      icon: Scissors
    },
    CLINIC: {
      label: 'Clínica / Spa',
      bg: 'bg-pink-50 border-pink-200 text-pink-700',
      icon: Sparkles
    },
    STUDIO: {
      label: 'Studio / Fitness',
      bg: 'bg-purple-50 border-purple-200 text-purple-700',
      icon: Activity
    },
    EVENTS: {
      label: 'Espaço de Eventos',
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      icon: Building2
    }
  }[type];

  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full border font-medium ${config.bg}`}>
      {showIcon && <IconComponent className="w-3.5 h-3.5" />}
      <span>{config.label}</span>
    </span>
  );
};
