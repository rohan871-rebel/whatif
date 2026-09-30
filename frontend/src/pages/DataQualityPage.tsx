import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Sliders, CheckCircle, RefreshCw, Save } from 'lucide-react';
import { DataQualityReport, RuleConfig } from '../types';
import { fetchDataQualityReport, updateRuleConfig } from '../api';

export const DataQualityPage: React.FC = () => {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [rules, setRules] = useState<RuleConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDataQualityReport();
      setReport(data);
      setRules(data.rule_configs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setIsSaving(true);
    try {
      const updated = await updateRuleConfig(editingRule);
      setRules(updated);
      setEditingRule(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadReport();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header and Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Data Quality & Telemetry Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time detection of sensor dropouts, boundary inversions, and stale buffer timestamps.
          </p>
        </div>

        <button
          onClick={loadReport}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 text-slate-200 border border-white/10 text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Re-audit Cohort</span>
        </button>
      </div>

      {/* Threshold Nature Banner */}
      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
        <div>
          <span className="font-semibold text-white">Research Boundary Framework: </span>
          All thresholds listed below are explicitly labeled as <span className="underline decoration-cyan-400">configurable research rules</span>, not universal clinical diagnostic guidelines.
        </div>
      </div>

      {/* Cohort Quality Distribution Summary */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="text-xs text-slate-400 uppercase font-medium">Audited Records</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{report.total_checked}</div>
            <div className="text-[11px] text-slate-500 mt-1">100% telemetry coverage</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
            <div className="text-xs text-emerald-400 uppercase font-medium">Clean Telemetry</div>
            <div className="text-2xl font-bold text-emerald-300 mt-1 font-mono">{report.clean_count}</div>
            <div className="text-[11px] text-emerald-500/80 mt-1">
              {((report.clean_count / (report.total_checked || 1)) * 100).toFixed(1)}% within boundaries
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10">
            <div className="text-xs text-amber-400 uppercase font-medium">Warnings (Missing / Stale)</div>
            <div className="text-2xl font-bold text-amber-300 mt-1 font-mono">{report.warning_count}</div>
            <div className="text-[11px] text-amber-500/80 mt-1">Requires model imputation</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10">
            <div className="text-xs text-rose-400 uppercase font-medium">Defects (Sensor Spikes)</div>
            <div className="text-2xl font-bold text-rose-300 mt-1 font-mono">{report.defect_count}</div>
            <div className="text-[11px] text-rose-500/80 mt-1">Extreme artifact / detachment</div>
          </div>
        </div>
      )}

      {/* Configurable Research Rules Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Configurable Research Rule Set</h2>
            <p className="text-xs text-slate-400">Customize boundary bounds and staleness limits</p>
          </div>
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle className="w-3.5 h-3.5" /> Rule updated & cohort re-audited
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.rule_id}
              className="p-4 rounded-xl bg-navy-900 border border-white/5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{rule.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    rule.severity === 'CRITICAL'
                      ? 'bg-rose-950/40 text-rose-400 border-rose-800/40'
                      : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                  }`}>
                    {rule.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{rule.description}</p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <div className="text-slate-300">
                  {rule.min_plausible !== null && rule.min_plausible !== undefined && `Min: ${rule.min_plausible}`}
                  {rule.max_plausible !== null && rule.max_plausible !== undefined && ` | Max: ${rule.max_plausible}`}
                  {rule.max_stale_minutes !== null && rule.max_stale_minutes !== undefined && `Stale > ${rule.max_stale_minutes}m`}
                </div>
                <button
                  onClick={() => setEditingRule({ ...rule })}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-cyan-300 text-[11px] transition"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Cohort Telemetry Warnings Feed */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Active Telemetry Warnings & Violations</h2>
            <p className="text-xs text-slate-400">Detailed inspection of anomalous sensor streams</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {report?.warnings?.length || 0} active flags
          </span>
        </div>

        <div className="divide-y divide-white/5 max-h-96 overflow-y-auto pr-2">
          {report?.warnings?.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No active warnings detected in current cohort.
            </div>
          ) : (
            report?.warnings?.map((w, index) => (
              <div key={index} className="py-3 flex items-start gap-3 text-xs">
                <div className="mt-0.5 shrink-0">
                  {w.severity === 'CRITICAL' ? (
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-white">{w.record_id}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-300">
                      {w.field}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{w.timestamp}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{w.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRule}
            className="glass-panel bg-navy-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5"
          >
            <div>
              <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">CONFIGURE RULE</span>
              <h3 className="text-lg font-bold text-white">{editingRule.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{editingRule.description}</p>
            </div>

            <div className="space-y-3">
              {editingRule.min_plausible !== undefined && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Minimum Plausible Value</label>
                  <input
                    type="number"
                    step="any"
                    value={editingRule.min_plausible ?? ''}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      min_plausible: e.target.value === '' ? null : Number(e.target.value)
                    })}
                    className="w-full px-3 py-1.5 rounded-lg bg-navy-850 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {editingRule.max_plausible !== undefined && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Maximum Plausible Value</label>
                  <input
                    type="number"
                    step="any"
                    value={editingRule.max_plausible ?? ''}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      max_plausible: e.target.value === '' ? null : Number(e.target.value)
                    })}
                    className="w-full px-3 py-1.5 rounded-lg bg-navy-850 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {editingRule.max_stale_minutes !== undefined && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Max Stale Telemetry (Minutes)</label>
                  <input
                    type="number"
                    value={editingRule.max_stale_minutes ?? ''}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      max_stale_minutes: e.target.value === '' ? null : Number(e.target.value)
                    })}
                    className="w-full px-3 py-1.5 rounded-lg bg-navy-850 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold text-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save & Re-audit'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
