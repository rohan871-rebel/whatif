import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral' | 'accent';
  badge?: string;
  glowColor?: 'cyan' | 'purple' | 'amber' | 'emerald';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral',
  badge,
  glowColor = 'cyan'
}) => {
  const glowClasses = {
    cyan: 'hover:border-cyan-500/30 hover:shadow-apple-glow',
    purple: 'hover:border-violet-500/30 hover:shadow-apple-glow-purple',
    amber: 'hover:border-amber-500/30',
    emerald: 'hover:border-emerald-500/30'
  }[glowColor];

  const trendColors = {
    positive: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    negative: 'text-rose-400 bg-rose-950/40 border-rose-800/40',
    neutral: 'text-slate-400 bg-slate-900 border-white/10',
    accent: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
  }[trendType];

  return (
    <div className={`glass-panel p-5 rounded-2xl transition-all duration-300 ${glowClasses}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">{value}</span>
        {badge && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs">
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
          {trend && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${trendColors}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
