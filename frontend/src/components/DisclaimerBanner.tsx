import React, { useState } from 'react';
import { AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside aria-label="Research Disclaimer" className="bg-navy-900/90 border-b border-white/10 px-4 py-2 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-medium text-slate-200">
            RESEARCH DEMONSTRATION ONLY:
          </span>
          <span className="text-slate-300">
            Not for diagnosis, triage, treatment, or real-patient decisions. Risk scores are uncalibrated model outputs.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
            SYNTHETIC DEMO DATA — NOT CLINICAL EVIDENCE
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition text-[11px] underline underline-offset-2"
          >
            <Info className="w-3 h-3" />
            <span>{expanded ? 'Hide Safety Notice' : 'Safety Policy'}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-400 leading-relaxed grid md:grid-cols-3 gap-4">
          <div className="bg-navy-850/50 p-3 rounded-lg border border-white/5">
            <div className="font-semibold text-slate-200 mb-1">No Diagnostic Claim</div>
            <p>
              This software is strictly an academic benchmark simulating machine learning fragility under noisy telemetry. It does not possess medical certification (CE / FDA) and must never be deployed in hospital care.
            </p>
          </div>
          <div className="bg-navy-850/50 p-3 rounded-lg border border-white/5">
            <div className="font-semibold text-slate-200 mb-1">Uncalibrated Risk Outputs</div>
            <p>
              Risk numbers produced by Random Forest classifiers reflect mathematical tree split proportions, NOT calibrated epidemiological probabilities of physiological collapse.
            </p>
          </div>
          <div className="bg-navy-850/50 p-3 rounded-lg border border-white/5">
            <div className="font-semibold text-slate-200 mb-1">Synthetic Cohort Boundary</div>
            <p>
              Demonstration records are computer-generated approximations of physiological ranges. No real patient health information (PHI) has been accessed or stored.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
