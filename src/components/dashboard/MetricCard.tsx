import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorScheme?: 'teal' | 'emerald' | 'amber' | 'sky' | 'rose' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp = true,
  colorScheme = 'teal'
}) => {
  const schemeClasses = {
    teal: {
      bgIcon: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    sky: {
      bgIcon: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    rose: {
      bgIcon: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    purple: {
      bgIcon: 'bg-purple-50 text-purple-700 border-purple-200',
    }
  }[colorScheme];

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between group">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{title}</span>
          <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight group-hover:text-teal-700 transition-colors">
            {value}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border ${schemeClasses.bgIcon} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500 truncate text-[11px]">{subtitle}</span>}

        {trend && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend}</span>
          </span>
        )}
      </div>
    </div>
  );
};
