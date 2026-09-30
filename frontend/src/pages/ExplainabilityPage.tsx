import React from 'react';
import { HelpCircle, AlertTriangle, ShieldCheck, Cpu, GitBranch, Info } from 'lucide-react';

export const ExplainabilityPage: React.FC = () => {
  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Explainability & Model Transparency</span>
          <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Interpretability Lab
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Understanding feature decision boundaries, score attribution shifts, and the critical distinction between statistical association and clinical causation.
        </p>
      </div>

      {/* Critical Epistemic Notice */}
      <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-white">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>METHODOLOGICAL DISCLAIMER: CORRELATION ≠ CAUSATION</span>
        </div>
        <p className="leading-relaxed text-slate-300">
          In this research platform, feature importance and SHAP-style attributions describe how Random Forest decision trees partition input dimensions in statistical training space. <span className="text-amber-300 font-medium">They do not represent physiological causation, etiology, or biological mechanisms.</span> Clinicians must never assume that altering a statistical input feature will therapeutically alter patient outcome.
        </p>
      </div>

      {/* How the Models Differ Under Stress */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold">
            <Cpu className="w-4 h-4" />
            <span>Baseline Random Forest Architecture</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The baseline model incorporates all 9 physiological and derived hemodynamic features. While this yields marginally high in-distribution validation accuracy, it introduces severe fragility to edge telemetry faults. If an ancillary sensor like peripheral skin temperature experiences severe motion artifacts or cold exposure, the baseline model splits on this spurious signal, driving risk hallucinations.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-500 border-t border-white/5">
            Susceptibility: High Multi-collinear Sensitivity • High Vulnerability to Single-Sensor Dropout
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-violet-500/20 space-y-3">
          <div className="flex items-center gap-2 text-violet-400 text-sm font-semibold">
            <GitBranch className="w-4 h-4" />
            <span>Genetic Algorithm (GA) Feature Selector</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The GA feature optimizer evaluates candidate binary masks over successive generations. Its multi-objective fitness function directly rewards validation AUROC while penalizing perturbation vulnerability under Gaussian noise. The resulting model retains core hemodynamic drivers (Heart Rate, Shock Index, SpO2) while pruning noisy peripheral signals, dampening overall risk volatility.
          </p>
          <div className="pt-2 text-[11px] font-mono text-emerald-400 border-t border-white/5">
            Benefit: Robustness Gain • Attenuated False Alarms • Resilient to Peripheral Lead Slip
          </div>
        </div>
      </div>

      {/* Case Studies in Ghost Signal Mitigation */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          Case Studies: Ghost Signal Pathologies in Practice
        </h2>

        <div className="space-y-4">
          {/* Case 1 */}
          <div className="p-4 rounded-xl bg-navy-900 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="text-rose-400">Case A: The Silent Failure Dropout</span>
              <span className="font-mono text-[10px] text-slate-500">Scenario: Hypoxic Deterioration with Pulse Ox Slip</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A patient’s true SpO2 drops to 82% during acute respiratory fatigue. However, due to severe diaphoresis, the pulse oximetry probe slips off the finger. Downstream naive data processing imputes the cohort median (98%). The baseline model risk score plummets from 0.88 down to 0.22, silencing clinical monitors while the patient is deteriorating.
            </p>
            <div className="text-[11px] text-cyan-300 font-mono">
              Mitigation: Data quality monitor alerts on missingness before passing vectors to inference, flagging the imputation artifact.
            </div>
          </div>

          {/* Case 2 */}
          <div className="p-4 rounded-xl bg-navy-900 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="text-amber-400">Case B: The Spurious Tachycardia Spike</span>
              <span className="font-mono text-[10px] text-slate-500">Scenario: Patient Shivering / Tremor</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Muscle tremors during blood pressure cuff inflation introduce extreme high-frequency noise, causing telemetry to log a momentary heart rate of 245 bpm. The baseline model immediately triggers a critical alarm (score jumps to 0.74). The GA model, having learned to rely on cross-correlated shock indices rather than isolated volatile spikes, dampens the spike to 0.38, preventing unnecessary nurse dispatch.
            </p>
            <div className="text-[11px] text-violet-300 font-mono">
              Mitigation: GA feature parsimony and plausible boundary filtering effectively discard non-physiological motion artifacts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
