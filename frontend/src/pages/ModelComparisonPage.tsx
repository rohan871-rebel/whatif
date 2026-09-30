import React, { useState, useEffect } from 'react';
import { BarChart2, CheckCircle, ShieldCheck, Zap, Sliders, Info, GitCommit } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ModelComparisonResponse } from '../types';
import { fetchModelComparison } from '../api';

export const ModelComparisonPage: React.FC = () => {
  const [data, setData] = useState<ModelComparisonResponse | null>(null);
  const [threshold, setThreshold] = useState<number>(0.50);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadComparison = async (th: number) => {
    setIsLoading(true);
    try {
      const res = await fetchModelComparison(th);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComparison(threshold);
  }, [threshold]);

  if (!data) {
    return (
      <div className="py-20 text-center space-y-3 font-mono text-xs text-slate-400">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading model evaluation benchmarks...</p>
      </div>
    );
  }

  const base = data.baseline_model;
  const ga = data.ga_model;

  // Merge ROC points for synchronized chart
  const rocPlotData = base.roc_curve.map((pt, i) => {
    const gaPt = ga.roc_curve[i] || { tpr: pt.tpr };
    return {
      fpr: pt.fpr,
      baseline_tpr: pt.tpr,
      ga_tpr: gaPt.tpr
    };
  });

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Model Reliability & Robustness Benchmark
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Baseline Random Forest (all eligible features) vs GA-Optimized Random Forest on untouched held-out records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-violet-950/60 text-violet-300 border border-violet-700/50">
            Split: 60% Train / 20% Val / 20% Held-Out Test
          </span>
        </div>
      </div>

      {/* Decision Threshold Interactive Slider */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Clinical Decision Threshold Tuning</span>
          </span>
          <span className="font-mono text-cyan-400 text-sm font-bold">
            Threshold τ = {threshold.toFixed(2)}
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Adjust the decision threshold to observe real-time tradeoffs between Critical-Event Recall and False-Negative Count on the test cohort.
        </p>
        <input
          type="range"
          min="0.10"
          max="0.90"
          step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full h-1.5 bg-navy-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>0.10 (High Sensitivity / Many Alarms)</span>
          <span>0.50 (Standard Benchmark)</span>
          <span>0.90 (High Specificity / High False Negatives)</span>
        </div>
      </div>

      {/* Comparative Metrics Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-card">
        <div className="p-5 border-b border-white/10 bg-navy-900/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Comparative Performance on Held-Out Test Split ({data.dataset_summary.test_samples} patients)
          </h2>
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            GA Perturbation Resilience Gain: +{data.robustness_gain_percent}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-navy-900/90 text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-3 px-4 font-sans font-medium">Metric Description</th>
                <th className="py-3 px-4 text-cyan-400 font-semibold">Baseline RF (All Features)</th>
                <th className="py-3 px-4 text-violet-400 font-semibold">GA-Selected RF (Mask)</th>
                <th className="py-3 px-4 font-sans font-medium">Reliability Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {/* AUROC */}
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white">AUROC (Discrimination)</td>
                <td className="py-3 px-4 text-cyan-300 font-bold text-sm">{base.auroc.toFixed(3)}</td>
                <td className="py-3 px-4 text-violet-300 font-bold text-sm">{ga.auroc.toFixed(3)}</td>
                <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                  Both models exhibit high discrimination on clean test vitals.
                </td>
              </tr>

              {/* Critical Event Recall */}
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white">Critical Event Recall (Sensitivity)</td>
                <td className="py-3 px-4">{base.recall_sensitivity.toFixed(3)}</td>
                <td className="py-3 px-4 font-bold text-violet-300">{ga.recall_sensitivity.toFixed(3)}</td>
                <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                  Proportion of truly critical patients flagged at threshold τ.
                </td>
              </tr>

              {/* False Negative Rate */}
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white">False Negative Rate (FNR = 1 - Recall)</td>
                <td className="py-3 px-4 text-rose-300">{base.false_negative_rate.toFixed(3)}</td>
                <td className="py-3 px-4 text-rose-300 font-bold">{ga.false_negative_rate.toFixed(3)}</td>
                <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                  Proportion of deteriorating patients missed by the model.
                </td>
              </tr>

              {/* False Negative Count */}
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white">False Negative Count (Missed Patients)</td>
                <td className="py-3 px-4 text-rose-400 font-bold">{base.false_negative_count} / {base.critical_cases_count}</td>
                <td className="py-3 px-4 text-rose-400 font-bold">{ga.false_negative_count} / {ga.critical_cases_count}</td>
                <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                  Number of critical test patients incorrectly classified as non-critical.
                </td>
              </tr>

              {/* Mean Absolute Score Change */}
              <tr className="bg-white/[0.02]">
                <td className="py-3 px-4 font-sans font-medium text-white">
                  Mean Absolute Score Change (MASC) under Perturbation
                </td>
                <td className="py-3 px-4 text-amber-300 font-bold">{base.mean_absolute_score_change.toFixed(3)}</td>
                <td className="py-3 px-4 text-emerald-300 font-bold">{ga.mean_absolute_score_change.toFixed(3)}</td>
                <td className="py-3 px-4 font-sans text-emerald-400 text-[11px]">
                  Lower is better. GA achieves lower score volatility under standard 20% Gaussian noise.
                </td>
              </tr>

              {/* Selected Feature Count */}
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white">Selected Feature Count</td>
                <td className="py-3 px-4">{base.selected_features_count} / {base.all_feature_names.length}</td>
                <td className="py-3 px-4 font-bold text-violet-300">{ga.selected_features_count} / {ga.all_feature_names.length}</td>
                <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                  GA reduces dimensionality by discarding noise-sensitive inputs.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Selection Mask Badges */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Genetic Algorithm Binary Feature Mask
          </h2>
          <p className="text-xs text-slate-400">
            Active chromosome: 1 = included in model training, 0 = pruned for robustness.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {ga.all_feature_names.map((feat, idx) => {
            const isIncluded = ga.feature_mask[idx] === 1;
            return (
              <div
                key={feat}
                className={`p-3 rounded-xl border flex flex-col justify-between font-mono text-xs transition ${
                  isIncluded
                    ? 'bg-violet-950/30 border-violet-500/40 text-violet-200'
                    : 'bg-navy-900 border-white/5 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-sans font-bold">
                    {isIncluded ? 'GENE = 1 (ACTIVE)' : 'GENE = 0 (PRUNED)'}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${isIncluded ? 'bg-violet-400' : 'bg-slate-600'}`} />
                </div>
                <div className="font-semibold text-white text-xs">
                  {feat.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROC Curves Visualization */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Receiver Operating Characteristic (ROC) Comparison
            </h2>
            <p className="text-xs text-slate-400">Comparing True Positive Rate vs False Positive Rate</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-cyan-400">Baseline AUROC: {base.auroc.toFixed(3)}</span>
            <span className="text-violet-400">GA AUROC: {ga.auroc.toFixed(3)}</span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rocPlotData}>
              <XAxis dataKey="fpr" tick={{ fill: '#94A3B8', fontSize: 10 }} label={{ value: 'False Positive Rate (FPR)', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} label={{ value: 'True Positive Rate (TPR)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B1120', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#CBD5E1' }} />
              <Line type="monotone" dataKey="baseline_tpr" name="Baseline RF (All Features)" stroke="#06B6D4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ga_tpr" name="GA-Selected RF" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
