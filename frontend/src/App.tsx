import React, { useState, useEffect } from 'react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { ExperimentHistoryPage } from './pages/ExperimentHistoryPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { SDGPage } from './pages/SDGPage';

import { DashboardSummary, VitalRecord } from './types';
import { checkBackendHealth, fetchDashboardSummary, resetSyntheticCohort } from './api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [selectedRecordForSim, setSelectedRecordForSim] = useState<VitalRecord | null>(null);

  // Initial load
  const loadState = async () => {
    setIsLoadingSummary(true);
    const live = await checkBackendHealth();
    setIsLive(live);
    const summary = await fetchDashboardSummary();
    setDashboardSummary(summary);
    setIsLoadingSummary(false);
  };

  useEffect(() => {
    loadState();
    const interval = setInterval(async () => {
      const live = await checkBackendHealth();
      setIsLive(live);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResetCohort = async () => {
    setIsResetting(true);
    try {
      await resetSyntheticCohort(600);
      await loadState();
    } catch (err) {
      console.error('Failed to reset cohort:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelectRecordForSimulation = (record: VitalRecord) => {
    setSelectedRecordForSim(record);
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Persistent Research Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLive={isLive}
        onResetCohort={handleResetCohort}
        isResetting={isResetting}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'landing' && (
          <LandingPage
            onLaunch={() => setActiveTab('dashboard')}
            onOpenSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            summary={dashboardSummary}
            onNavigateTab={setActiveTab}
            isLoading={isLoadingSummary}
          />
        )}

        {activeTab === 'explorer' && (
          <ExplorerPage
            onSelectRecordForSimulation={handleSelectRecordForSimulation}
          />
        )}

        {activeTab === 'data_quality' && (
          <DataQualityPage />
        )}

        {activeTab === 'simulator' && (
          <SimulatorPage
            initialRecord={selectedRecordForSim}
          />
        )}

        {activeTab === 'models' && (
          <ModelComparisonPage />
        )}

        {activeTab === 'experiments' && (
          <ExperimentHistoryPage />
        )}

        {activeTab === 'explainability' && (
          <ExplainabilityPage />
        )}

        {activeTab === 'methodology' && (
          <MethodologyPage />
        )}

        {activeTab === 'sdg' && (
          <SDGPage />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 bg-navy-950/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="text-slate-300 font-medium">
              GHOST SIGNAL — WHAT IF? • Optic Forge Hackathon
            </div>
            <div>
              Biomedical AI Reliability & Telemetry Perturbation Research Platform
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono">
            <span className="text-slate-400">Target SDG 3 & SDG 9</span>
            <span>•</span>
            <span className="text-cyan-400">Random Forest & Genetic Algorithm</span>
            <span>•</span>
            <span className="text-amber-400">Not for Clinical Diagnosis</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
