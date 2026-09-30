import React from 'react';
import { Activity, ShieldCheck, Database, Sliders, BarChart2, History, HelpCircle, Globe, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLive: boolean;
  onResetCohort: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isLive,
  onResetCohort,
  isResetting
}) => {
  const navItems = [
    { id: 'landing', label: 'Overview', icon: Activity },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'explorer', label: 'Record Explorer', icon: Database },
    { id: 'data_quality', label: 'Data Quality', icon: ShieldCheck },
    { id: 'simulator', label: 'WHAT IF Simulator', icon: Sliders, highlight: true },
    { id: 'models', label: 'Model Comparison', icon: BarChart2 },
    { id: 'experiments', label: 'History', icon: History },
    { id: 'explainability', label: 'Explainability', icon: HelpCircle },
    { id: 'methodology', label: 'Methodology', icon: HelpCircle },
    { id: 'sdg', label: 'SDGs', icon: Globe },
  ];

  return (
    <header className="sticky top-0 z-40 bg-navy-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center shadow-apple-glow group-hover:border-cyan-400/60 transition">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-slate-100 text-sm sm:text-base">
                  GHOST SIGNAL
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  WHAT IF?
                </span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                Biomedical AI Reliability Lab
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? item.highlight
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-apple-glow'
                        : 'bg-white/10 text-white shadow-sm'
                      : item.highlight
                      ? 'text-cyan-400/90 hover:text-cyan-300 hover:bg-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive && item.highlight ? 'text-cyan-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Backend status indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                isLive
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
              }`}
              title={isLive ? 'Connected to live FastAPI & scikit-learn backend' : 'Running in offline synthetic demo mode'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="hidden sm:inline">{isLive ? 'Live ML Backend' : 'Demo Mode'}</span>
            </div>

            {/* Reset Cohort CTA */}
            <button
              onClick={onResetCohort}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-navy-850 hover:bg-navy-800 text-slate-300 hover:text-white border border-white/10 transition disabled:opacity-50"
              title="Regenerate synthetic patient cohort and retrain models"
            >
              <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden md:inline">{isResetting ? 'Regenerating...' : 'Regen Cohort'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-white/5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
