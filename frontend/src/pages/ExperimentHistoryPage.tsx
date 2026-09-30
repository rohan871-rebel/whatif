import React, { useState, useEffect } from 'react';
import { History, Download, RefreshCw, AlertOctagon, BellOff, Activity, ShieldAlert } from 'lucide-react';
import { ExperimentRecord } from '../types';
import { fetchExperiments } from '../api';

export const ExperimentHistoryPage: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadExperiments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchExperiments();
      setExperiments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  return (
    <div className="space-y-6 py-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Experiment History & Audit Trail</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-white/10 text-slate-300">
              Persistent Run Log
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Historical record of all WHAT IF simulations, perturbations applied, and ghost signal alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadExperiments}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 text-slate-200 border border-white/10 text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <a
            href="/api/experiments/export-csv"
            download="ghost_signal_experiments.csv"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 text-xs font-semibold shadow-apple-glow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export History as CSV</span>
          </a>
        </div>
      </div>

      {/* Experiments Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-navy-900/90 text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-3 px-4 font-sans font-medium">Run ID</th>
                <th className="py-3 px-3 font-sans font-medium">Timestamp</th>
                <th className="py-3 px-3 font-sans font-medium">Target Record</th>
                <th className="py-3 px-3 font-sans font-medium">Perturbation Applied</th>
                <th className="py-3 px-3 font-sans font-medium">Baseline (Orig → Pert)</th>
                <th className="py-3 px-3 font-sans font-medium">GA Model (Orig → Pert)</th>
                <th className="py-3 px-3 font-sans font-medium">Ghost Signal Mode</th>
                <th className="py-3 px-4 font-sans font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    Loading historical experiments...
                  </td>
                </tr>
              ) : experiments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    No experiments logged yet. Go to the WHAT IF Simulator to run your first simulation!
                  </td>
                </tr>
              ) : (
                experiments.map((exp) => {
                  const isSilent = exp.ghost_signal_type === 'SILENT_FAILURE';
                  const isSpurious = exp.ghost_signal_type === 'SPURIOUS_ALARM';
                  return (
                    <tr key={exp.experiment_id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 text-white font-semibold">{exp.experiment_id}</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{exp.timestamp}</td>
                      <td className="py-3 px-3 text-cyan-300 font-bold">{exp.record_id}</td>
                      <td className="py-3 px-3 text-slate-200">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[11px]">
                          {exp.perturbation_type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span>{exp.baseline_before.toFixed(2)} → {exp.baseline_after.toFixed(2)} </span>
                        <span className={`text-[10px] font-bold ${
                          exp.delta_baseline > 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          ({exp.delta_baseline > 0 ? `+${exp.delta_baseline.toFixed(2)}` : exp.delta_baseline.toFixed(2)})
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-violet-300">{exp.ga_before.toFixed(2)} → {exp.ga_after.toFixed(2)} </span>
                        <span className="text-[10px] font-bold text-violet-400">
                          ({exp.delta_ga > 0 ? `+${exp.delta_ga.toFixed(2)}` : exp.delta_ga.toFixed(2)})
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {isSilent ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 text-[10px] flex items-center gap-1 font-bold">
                            <AlertOctagon className="w-3 h-3 text-rose-400" />
                            <span>SILENT FAILURE</span>
                          </span>
                        ) : isSpurious ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 text-[10px] flex items-center gap-1 font-bold">
                            <BellOff className="w-3 h-3 text-amber-400" />
                            <span>SPURIOUS ALARM</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">None (Stable)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-400 text-xs">
                        {exp.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
