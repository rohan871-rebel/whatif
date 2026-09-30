import React from 'react';
import { AlertOctagon, BellOff, Activity, ShieldAlert } from 'lucide-react';

interface GhostSignalAlertProps {
  type: 'SILENT_FAILURE' | 'SPURIOUS_ALARM' | 'VOLATILITY_DRIFT' | null;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  baselineDelta: number;
  gaDelta: number;
}

export const GhostSignalAlert: React.FC<GhostSignalAlertProps> = ({
  type,
  severity,
  baselineDelta,
  gaDelta
}) => {
  if (!type || severity === 'NONE') return null;

  const isSilentFailure = type === 'SILENT_FAILURE';
  const isSpuriousAlarm = type === 'SPURIOUS_ALARM';

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isSilentFailure
        ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
        : isSpuriousAlarm
        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
        : 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl border shrink-0 ${
          isSilentFailure
            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            : isSpuriousAlarm
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
        }`}>
          {isSilentFailure ? (
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          ) : isSpuriousAlarm ? (
            <BellOff className="w-5 h-5 animate-pulse" />
          ) : (
            <ShieldAlert className="w-5 h-5" />
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-sm uppercase">
              {isSilentFailure
                ? 'CRITICAL GHOST SIGNAL: SILENT FAILURE (FALSE NEGATIVE)'
                : isSpuriousAlarm
                ? 'GHOST SIGNAL DETECTED: SPURIOUS ALARM (FALSE POSITIVE)'
                : 'HIGH VOLATILITY PREDICTION CHANGE DETECTED'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-current">
              SEVERITY: {severity}
            </span>
          </div>

          <p className="text-xs opacity-90 leading-relaxed">
            {isSilentFailure && (
              <>
                The baseline Random Forest score collapsed below the 0.50 decision threshold because sensor missingness forced default imputation. True physiological deterioration is actively masked from clinicians.
              </>
            )}
            {isSpuriousAlarm && (
              <>
                Sensor noise alone pushed a stable patient across the decision threshold into the high-risk category. In clinical wards, this induces severe alarm fatigue and unnecessary emergency alerts.
              </>
            )}
            {!isSilentFailure && !isSpuriousAlarm && (
              <>
                Risk score shifted significantly (|Δ| ≥ 0.20) purely from sensor perturbation, demonstrating elevated baseline model fragility.
              </>
            )}
          </p>

          <div className="flex items-center gap-4 pt-2 text-[11px] font-mono">
            <div>Baseline Model Shift: <span className="font-bold">{baselineDelta > 0 ? `+${baselineDelta}` : baselineDelta}</span></div>
            <div>GA-Selected Model Shift: <span className="font-bold text-cyan-300">{gaDelta > 0 ? `+${gaDelta}` : gaDelta}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
