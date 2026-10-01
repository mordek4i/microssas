import React from 'react';
import type { BookingStatus } from '../../types';
import { Clock, CheckCircle2, UserCheck, Sparkles, XCircle, UserX } from 'lucide-react';

interface StatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const config = {
    PENDING: {
      label: 'Pendente',
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      icon: Clock
    },
    CONFIRMED: {
      label: 'Confirmada',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      icon: CheckCircle2
    },
    IN_SERVICE: {
      label: 'Em Atendimento',
      bg: 'bg-teal-50 border-teal-200 text-teal-700 animate-pulse',
      icon: UserCheck
    },
    COMPLETED: {
      label: 'Concluída',
      bg: 'bg-sky-50 border-sky-200 text-sky-700',
      icon: Sparkles
    },
    CANCELLED: {
      label: 'Cancelada',
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      icon: XCircle
    },
    NO_SHOW: {
      label: 'Não Compareceu',
      bg: 'bg-slate-100 border-slate-200 text-slate-600',
      icon: UserX
    }
  }[status];

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-xs px-3 py-1.5 gap-2 font-semibold'
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses}`}>
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
