import React from 'react';
import { Database, AlertTriangle, ShieldCheck, Sliders, ArrowUpRight, BarChart2, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { DashboardSummary } from '../types';
import { MetricCard } from '../components/MetricCard';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  onNavigateTab: (tab: string) => void;
  isLoading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  onNavigateTab,
  isLoading
}) => {
  if (isLoading || !summary) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Loading cohort telemetry & model states...</p>
      </div>
    );
  }

  const hrData = summary.vitals_distributions?.heart_rate || [];
  const spo2Data = summary.vitals_distributions?.spo2 || [];
  const sbpData = summary.vitals_distributions?.systolic_bp || [];
  const baselineRiskData = summary.risk_distributions?.baseline_risk || [];
  const gaRiskData = summary.risk_distributions?.ga_risk || [];

  return (
    <div className="space-y-8 py-6">
      {/* Top Header & Synthetic Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Research Cohort Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time telemetry quality distributions and baseline vs GA model stability indices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-700/50">
            {summary.synthetic_label}
          </span>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Cohort Records"
          value={summary.total_records.toLocaleString()}
          subtitle="Anonymized research profiles"
          icon={Database}
          trend={`${summary.clean_records} clean`}
          trendType="positive"
          glowColor="cyan"
        />

        <MetricCard
          title="Critical Cases (Target = 1)"
          value={summary.critical_records.toLocaleString()}
          subtitle={`${((summary.critical_records / (summary.total_records || 1)) * 100).toFixed(1)}% cohort prevalence`}
          icon={AlertTriangle}
          trend="Ground truth critical"
          trendType="accent"
          glowColor="purple"
        />

        <MetricCard
          title="Telemetry Warnings / Defects"
          value={(summary.warning_records + summary.defect_records).toLocaleString()}
          subtitle={`${summary.defect_records} severe implausibilities`}
          icon={ShieldCheck}
          trend={summary.defect_records > 0 ? 'Defects Active' : 'Normal'}
          trendType={summary.defect_records > 0 ? 'negative' : 'positive'}
          glowColor="amber"
        />

        <MetricCard
          title="GA Robustness Gain"
          value={summary.mean_robustness_delta > 0 ? `+${summary.mean_robustness_delta}%` : `${summary.mean_robustness_delta}%`}
          subtitle="Noise sensitivity reduction"
          icon={Zap}
          trend="vs Baseline RF"
          trendType="positive"
          glowColor="emerald"
        />
      </div>

      {/* Model Performance Overview Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="text-xs font-mono uppercase text-cyan-400">BENCHMARK EVALUATION (HELD-OUT TEST SPLIT)</div>
          <div className="text-lg font-semibold text-white">
            Baseline RF AUROC: <span className="text-cyan-300 font-mono font-bold">{summary.baseline_auroc.toFixed(3)}</span> | GA-Selected RF AUROC: <span className="text-violet-300 font-mono font-bold">{summary.ga_auroc.toFixed(3)}</span>
          </div>
          <div className="text-xs text-slate-400">
            GA feature selection maintains high discrimination while shedding noise-sensitive peripheral vitals.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('models')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-200 border border-white/10 text-xs font-medium transition"
          >
            <span>Model Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('simulator')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 text-xs font-semibold shadow-apple-glow transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Launch WHAT IF Test</span>
          </button>
        </div>
      </div>

      {/* Vital Sign Distributions Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heart Rate Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Heart Rate Distribution</span>
            <span className="text-[10px] font-mono text-slate-400">BPM</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hrData}>
                <XAxis dataKey="bin" tick={{ fill: '#94A3B8', fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={35} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#06B6D4' }}
                />
                <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SpO2 Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">SpO2 Distribution</span>
            <span className="text-[10px] font-mono text-slate-400">% Oxygen Saturation</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spo2Data}>
                <XAxis dataKey="bin" tick={{ fill: '#94A3B8', fontSize: 9 }} interval={0} height={35} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#38BDF8' }}
                />
                <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Systolic BP Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Systolic BP Distribution</span>
            <span className="text-[10px] font-mono text-slate-400">mmHg</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sbpData}>
                <XAxis dataKey="bin" tick={{ fill: '#94A3B8', fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={35} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#8B5CF6' }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Risk-Score Spectrum Comparison */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Cohort Risk Score Spectrum</h2>
            <p className="text-xs text-slate-400">Comparing probability densities across Baseline RF vs GA-selected RF</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500" />
              <span className="text-slate-300">Baseline Model</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-violet-500" />
              <span className="text-slate-300">GA Robust Model</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <div className="text-xs font-mono text-cyan-400">Baseline RF Risk Scores</div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={baselineRiskData}>
                  <XAxis dataKey="range" tick={{ fill: '#94A3B8', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1120', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]}>
                    {baselineRiskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index >= 5 ? '#F43F5E' : '#06B6D4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono text-violet-400">GA-Selected RF Risk Scores</div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gaRiskData}>
                  <XAxis dataKey="range" tick={{ fill: '#94A3B8', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1120', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                    {gaRiskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index >= 5 ? '#F43F5E' : '#8B5CF6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
