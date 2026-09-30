import React from 'react';
import { ArrowRight, Sliders, ShieldCheck, Cpu, Database, Activity, GitFork, HeartPulse, CheckCircle2 } from 'lucide-react';
import { WaveformCanvas } from '../components/WaveformCanvas';

interface LandingPageProps {
  onLaunch: () => void;
  onOpenSimulator: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch, onOpenSimulator }) => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-12">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            OPTIC FORGE HACKATHON RESEARCH PLATFORM
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white">
            GHOST SIGNAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400">— WHAT IF?</span>
          </h1>

          <p className="text-lg sm:text-2xl text-slate-300 font-light max-w-3xl mx-auto leading-relaxed">
            Test the reliability of AI when patient data cannot be trusted.
          </p>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Clinical AI risk models assume flawless sensor streams. In reality, loose leads, ambient photoplethysmography noise, stale telemetry caches, and motion artifacts produce deceptive <span className="text-cyan-300 font-medium">ghost signals</span> that trigger spurious alarms or silently mask acute deterioration.
          </p>

          {/* Interactive Live Telemetry Waveform */}
          <div className="max-w-3xl mx-auto my-8">
            <WaveformCanvas height={130} noiseLevel={0.08} heartRate={76} />
            <div className="text-[11px] text-slate-400 text-center mt-2 font-mono">
              Live synthetic physiological rhythm with minor ambient photoplethysmography noise simulation
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onLaunch}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-semibold text-sm transition-all shadow-apple-glow hover:scale-[1.02]"
            >
              <span>Launch Research Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-navy-850 hover:bg-navy-800 border border-white/10 hover:border-cyan-500/30 text-white font-medium text-sm transition-all shadow-apple hover:scale-[1.02]"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Open WHAT IF Simulator</span>
            </button>
          </div>
        </div>
      </section>

      {/* The Core Problem & Research Motivation */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Why Telemetry AI Fails in High-Acuity Wards
          </h2>
          <p className="text-sm text-slate-400">
            Standard machine learning models treat missingness and noise naively. This platform rigorously exposes their failure modes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Silent Failures</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a critically deteriorating patient’s pulse oximeter probe slips off, downstream imputation often fills normal medians (98% SpO2), artificially collapsing the risk score and silencing critical alerts.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Spurious Alarms & Fatigue</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transient motion artifacts can trigger brief 240 bpm telemetry spikes. Overly sensitive all-feature models trigger false alarms, exacerbating clinician desensitization and alarm fatigue.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <GitFork className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Genetic Feature Parsimony</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our Genetic Algorithm (GA) optimizes binary feature masks specifically to penalize perturbation sensitivity, dropping volatile peripheral signals while preserving acute predictive power.
            </p>
          </div>
        </div>
      </section>

      {/* Research Methodology Pipeline */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="glass-panel p-8 rounded-3xl border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400 tracking-wider">EXPERIMENTAL PROTOCOL</span>
              <h2 className="text-2xl font-bold text-white mt-1">Leakage-Free Reliability Architecture</h2>
            </div>
            <div className="text-xs text-slate-400 max-w-sm">
              All preprocessing parameters and imputations are strictly locked to training data (60%). Final models are benchmarked on untouched held-out records (20%).
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-navy-900/60 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">01 • DATA AUDIT</div>
              <div className="font-medium text-white text-sm">Configurable Research Rules</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Detects implausible physiological ranges, missing values, and stale buffer timestamps (&gt;120m).
              </p>
            </div>

            <div className="bg-navy-900/60 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">02 • BASELINE MODEL</div>
              <div className="font-medium text-white text-sm">All-Feature Random Forest</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Trained on all 9 eligible primary and derived hemodynamic features with balanced class weights.
              </p>
            </div>

            <div className="bg-navy-900/60 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">03 • GA FEATURE MASK</div>
              <div className="font-medium text-white text-sm">Robustness Optimization</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Optimizes binary chromosomes (1/0) using validation AUROC, sparsity, and perturbation sensitivity.
              </p>
            </div>

            <div className="bg-navy-900/60 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="text-xs font-mono text-cyan-400">04 • WHAT IF SIMULATOR</div>
              <div className="font-medium text-white text-sm">Adversarial Telemetry Stress</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Controlled Gaussian noise, simulated dropouts, and timestamp drift directly quantify risk score shift (|Δ|).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainable Development Goals Overview */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-navy-900 via-navy-850 to-navy-950">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider">GLOBAL IMPACT ALIGNMENT</span>
            <h2 className="text-2xl font-bold text-white mt-1">United Nations Sustainable Development Goals</h2>
            <p className="text-xs text-slate-400 mt-2">
              GHOST SIGNAL directly targets telemetry resilience in low-resource and high-acuity settings.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">SDG 3</span>
                <span className="font-semibold text-slate-200 text-sm">Good Health and Well-Being (Target 3.8)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Minimizing alarm fatigue and silent ICU failures by quantifying model robustness against loose sensors and stale telemetry streams.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">SDG 9</span>
                <span className="font-semibold text-slate-200 text-sm">Industry, Innovation and Infrastructure (Target 9.5)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pioneering fault-tolerant medical AI architectures that remain stable even when edge sensor telemetry experiences intermittent latency or hardware degradation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
