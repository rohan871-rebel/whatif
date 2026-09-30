import React from 'react';
import { BookOpen, Cpu, ShieldCheck, AlertTriangle, Layers, GitBranch, ArrowRight } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Research Methodology & Technical Architecture</span>
          <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-white/10 text-slate-300">
            Optic Forge Documentation
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Detailed mathematical formulation of feature selection, data leakage prevention, and adversarial perturbation protocols.
        </p>
      </div>

      {/* 1. Problem Formulation */}
      <section className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>1. Problem Formulation: The Ghost Signal Phenomenon</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Modern hospital telemetry systems ingest continuous vitals (heart rate, pulse oximetry, arterial pressure, respiratory rate, core temperature) and feed them to machine learning risk-scoring algorithms. However, hospital telemetry streams are characterized by persistent edge degradations: loose lead connections, patient movement, photoplethysmography ambient light interference, and asynchronous network packet loss.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          When models are evaluated solely on clean, retrospectively curated benchmark datasets, they demonstrate deceptively high AUROC (&gt;0.90). When deployed into real-time environments, non-physiological telemetry artifacts alter risk scores without corresponding biological changes—producing <span className="text-cyan-300 font-semibold">Ghost Signals</span>.
        </p>
      </section>

      {/* 2. Machine Learning Pipeline & Leakage Prevention */}
      <section className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>2. Leakage-Free Preprocessing Pipeline</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-navy-900 border border-white/5 space-y-2">
            <div className="font-mono text-cyan-400 font-semibold">Training Split (60%)</div>
            <p className="text-slate-400 leading-relaxed">
              All statistical parameters (feature medians for imputation, median absolute deviations for RobustScaler, baseline tree splitting) are fit exclusively on this subset.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-navy-900 border border-white/5 space-y-2">
            <div className="font-mono text-violet-400 font-semibold">Validation Split (20%)</div>
            <p className="text-slate-400 leading-relaxed">
              Used strictly by the Genetic Algorithm optimizer to evaluate candidate chromosomes under simulated noise perturbations.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-navy-900 border border-white/5 space-y-2">
            <div className="font-mono text-emerald-400 font-semibold">Held-Out Test Split (20%)</div>
            <p className="text-slate-400 leading-relaxed">
              Completely untouched during feature selection and model fitting. Used solely for reporting final un-biased AUROC, sensitivity, and perturbation fragility metrics.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Genetic Algorithm Feature Optimizer */}
      <section className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2 text-violet-400 text-sm font-semibold uppercase tracking-wider">
          <GitBranch className="w-4 h-4" />
          <span>3. Genetic Algorithm Binary Feature Mask Optimization</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Let \( \mathbf{'{c}'} \in &#123;0, 1&#125;^D \) denote a binary chromosome representing active features in a candidate Random Forest model, where \( D = 9 \) total candidate features. The GA optimizes the following multi-objective fitness objective:
        </p>

        <div className="p-4 rounded-xl bg-navy-900 border border-violet-500/20 font-mono text-xs text-violet-200">
          Fitness(\mathbf&#123;c&#125;) = \text&#123;Val\_AUROC&#125;(\mathbf&#123;c&#125;) - 0.28 \cdot \text&#123;Perturbation\_Sensitivity&#125;(\mathbf&#123;c&#125;) - 0.06 \cdot \frac&#123;\sum_&#123;i=1&#125;^D c_i&#125;&#123;D&#125;
        </div>

        <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
          <p>
            • <span className="text-white font-medium">Val_AUROC:</span> Area Under ROC curve on the validation set, ensuring discriminative capacity is preserved.
          </p>
          <p>
            • <span className="text-white font-medium">Perturbation_Sensitivity:</span> Mean absolute score change \( \frac&#123;1&#125;&#123;N&#125; \sum |P(x_i) - P(x_i + \epsilon)| \) when controlled Gaussian noise is injected into the validation set.
          </p>
          <p>
            • <span className="text-white font-medium">Sparsity Penalty:</span> Penalizes over-parameterization, encouraging the model to drop collinear or noise-prone inputs.
          </p>
        </div>
      </section>

      {/* 4. Limitations & Future Work */}
      <section className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>4. Explicit Research Limitations & Future Roadmap</span>
        </div>
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            <span className="font-semibold text-white">1. Synthetic Cohort Envelope:</span> The demonstration cohort is generated using physiological distribution equations. While it models septic and respiratory collapse phenotypes accurately, real human physiology contains non-linear multi-organ interdependencies that cannot be fully captured without authorized longitudinal electronic health records (e.g. MIMIC-IV or eICU).
          </p>
          <p>
            <span className="font-semibold text-white">2. Uncalibrated Risk Bounds:</span> Tree split outputs from Random Forests provide relative rank-order risk indices, not true clinical probabilities. Future work will integrate conformal prediction intervals and Platt scaling.
          </p>
          <p>
            <span className="font-semibold text-white">3. Multi-Modal Waveforms:</span> Currently, the system models discrete vital readings. Future extensions will ingest raw high-frequency photoplethysmography and 12-lead ECG time-series directly.
          </p>
        </div>
      </section>
    </div>
  );
};
