import React from 'react';

interface VitalBadgeProps {
  type: 'hr' | 'spo2' | 'sbp' | 'dbp' | 'rr' | 'temp';
  value: number | null | undefined;
  label?: string;
  showRange?: boolean;
}

export const VitalBadge: React.FC<VitalBadgeProps> = ({
  type,
  value,
  label,
  showRange = false
}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-400 font-mono text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>{label || type.toUpperCase()}: MISSING</span>
      </div>
    );
  }

  // Plausibility & Physiological Boundaries
  let status: 'normal' | 'warning' | 'critical' | 'defect' = 'normal';
  let unit = '';
  let normalRange = '';

  switch (type) {
    case 'hr':
      unit = 'bpm';
      normalRange = '60-100';
      if (value < 30 || value > 240) status = 'defect';
      else if (value < 50 || value > 110) status = 'critical';
      else if (value < 60 || value > 100) status = 'warning';
      break;
    case 'spo2':
      unit = '%';
      normalRange = '95-100';
      if (value < 50 || value > 100) status = 'defect';
      else if (value < 90) status = 'critical';
      else if (value < 95) status = 'warning';
      break;
    case 'sbp':
      unit = 'mmHg';
      normalRange = '90-130';
      if (value < 40 || value > 260) status = 'defect';
      else if (value < 85 || value > 160) status = 'critical';
      else if (value < 90 || value > 135) status = 'warning';
      break;
    case 'dbp':
      unit = 'mmHg';
      normalRange = '60-85';
      if (value < 25 || value > 160) status = 'defect';
      else if (value < 50 || value > 100) status = 'critical';
      else if (value < 60 || value > 90) status = 'warning';
      break;
    case 'rr':
      unit = 'bpm';
      normalRange = '12-20';
      if (value < 4 || value > 60) status = 'defect';
      else if (value < 10 || value > 26) status = 'critical';
      else if (value < 12 || value > 22) status = 'warning';
      break;
    case 'temp':
      unit = '°C';
      normalRange = '36.5-37.5';
      if (value < 32 || value > 43) status = 'defect';
      else if (value < 35.5 || value > 38.5) status = 'critical';
      else if (value < 36.2 || value > 37.8) status = 'warning';
      break;
  }

  const styles = {
    normal: 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300',
    warning: 'bg-amber-950/30 border-amber-500/30 text-amber-300',
    critical: 'bg-rose-950/40 border-rose-500/40 text-rose-300 font-semibold',
    defect: 'bg-red-950/80 border-red-500 text-red-300 animate-pulse font-bold'
  }[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono ${styles}`}>
      {label && <span className="opacity-70 text-[10px] uppercase">{label}:</span>}
      <span>{value} {unit}</span>
      {showRange && <span className="opacity-50 text-[10px]">[{normalRange}]</span>}
    </div>
  );
};
