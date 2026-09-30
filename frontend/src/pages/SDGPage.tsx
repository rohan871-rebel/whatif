import React from 'react';
import { Globe, HeartPulse, Building2, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const SDGPage: React.FC = () => {
  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>UN Sustainable Development Goals (SDG) Alignment</span>
          <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Global Goals
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Direct alignment with international targets for safe medical digital infrastructure and alarm fatigue mitigation.
        </p>
      </div>

      {/* Safety & Non-Claim Notice */}
      <div className="p-4 rounded-xl bg-navy-900 border border-white/10 text-xs text-slate-300 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white">Academic Research Alignment Statement: </span>
          The alignments described below represent the technical motivation and research framing of the GHOST SIGNAL benchmark platform. This software does not make claims of proven clinical trial outcomes or quantified epidemiological impact.
        </div>
      </div>

      {/* Primary Alignments: SDG 3 and SDG 9 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* SDG 3 */}
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-lg font-mono">
              3
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">PRIMARY ALIGNMENT</span>
              <h2 className="text-lg font-bold text-white">Good Health and Well-Being</h2>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <div className="font-semibold text-white">Target 3.8 & 3.d: Safe Early Warning & Digital Health Reliability</div>
            <p>
              Telemetry alarm fatigue is one of the leading safety hazards in acute care hospitals worldwide. Clinicians are exposed to hundreds of nuisance alerts per shift, leading to desensitization and missed true decompensation events.
            </p>
            <p>
              By quantifying how sensor noise pushes all-feature models into false-alarm cascades and demonstrating how Genetic Algorithm feature masks dampen spurious shifts, GHOST SIGNAL directly advances research into alarm fatigue reduction.
            </p>

            <div className="pt-2 border-t border-emerald-500/20">
              <div className="text-[11px] font-mono text-emerald-400 font-semibold mb-1">Algorithmic Output Mapping:</div>
              <ul className="space-y-1 text-[11px] text-slate-300">
                <li>• <strong className="text-white">False Negative Rate (FNR):</strong> Evaluates Silent Failures where missing vitals mask acute patient deterioration.</li>
                <li>• <strong className="text-white">Mean Absolute Score Change (MASC):</strong> Quantifies Spurious Alarms induced by sensor noise spikes.</li>
                <li>• <strong className="text-white">Pre-Inference Data Quality Flags:</strong> Audits vital signs for physiological bounds and stale buffers.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SDG 9 */}
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-cyan-950/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-lg font-mono">
              9
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">PRIMARY ALIGNMENT</span>
              <h2 className="text-lg font-bold text-white">Industry, Innovation and Infrastructure</h2>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <div className="font-semibold text-white">Target 9.5: Resilient Scientific and Technological Infrastructure</div>
            <p>
              In resource-constrained community clinics and rural field hospitals, high-end continuous telemetry monitoring devices are often unavailable, older, or experience intermittent edge connectivity with packet dropouts.
            </p>
            <p>
              GHOST SIGNAL pioneers fault-tolerant algorithmic benchmarks that evaluate model stability under missingness and stale telemetry buffers, ensuring that future clinical AI models do not collapse when operating on degraded edge infrastructure.
            </p>
          </div>
        </div>
      </div>

      {/* Future Roadmap Alignment: SDG 10 */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-base font-mono">
            10
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">
              FUTURE RESEARCH EXTENSION (NOT CLAIMED AS COMPLETED WORK)
            </span>
            <h2 className="text-base font-bold text-white">Reduced Inequalities (Subgroup Reliability Auditing)</h2>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Recent clinical literature (e.g. Sjoding et al., New England Journal of Medicine) has demonstrated racial and demographic disparities in pulse oximeter calibration: standard photoplethysmography sensors exhibit higher rates of occult hypoxemia (falsely normal readings in hypoxic patients) in patients with darker skin pigmentation.
        </p>

        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-white">Future Roadmap:</span> Under an authorized ethical IRB protocol with real de-identified multi-center cohorts, GHOST SIGNAL will be extended to audit whether GA-selected feature subsets attenuate or exacerbate subgroup calibration disparities across demographic partitions.
        </p>
      </div>
    </div>
  );
};
