import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Play, RotateCcw, AlertTriangle, ShieldCheck, Activity, BarChart2, CheckCircle2, Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { VitalRecord, WhatIfRequest, WhatIfResponse } from '../types';
import { fetchRecords, runWhatIfSimulation } from '../api';
import { WaveformCanvas } from '../components/WaveformCanvas';
import { GhostSignalAlert } from '../components/GhostSignalAlert';

interface SimulatorPageProps {
  initialRecord: VitalRecord | null;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ initialRecord }) => {
  const [availableRecords, setAvailableRecords] = useState<VitalRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [currentRecord, setCurrentRecord] = useState<VitalRecord | null>(null);

  // Editable Vitals State
  const [vitals, setVitals] = useState<{
    heart_rate: number | '';
    spo2: number | '';
    systolic_bp: number | '';
    diastolic_bp: number | '';
    respiratory_rate: number | '';
    temperature: number | '';
  }>({
    heart_rate: 75,
    spo2: 98,
    systolic_bp: 120,
    diastolic_bp: 80,
    respiratory_rate: 16,
    temperature: 37.0
  });

  // Perturbation Parameters
  const [noiseStd, setNoiseStd] = useState<number>(0.0);
  const [droppedFields, setDroppedFields] = useState<string[]>([]);
  const [staleMinutes, setStaleMinutes] = useState<number>(0);
  const [customNotes, setCustomNotes] = useState<string>('');

  // Simulation Execution State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load cohort records for selector dropdown
  useEffect(() => {
    fetchRecords({ limit: 100 }).then(res => {
      setAvailableRecords(res.records);
      if (initialRecord) {
        loadRecord(initialRecord);
      } else if (res.records.length > 0) {
        loadRecord(res.records[0]);
      }
    });
  }, [initialRecord]);

  const loadRecord = (rec: VitalRecord) => {
    setSelectedRecordId(rec.record_id);
    setCurrentRecord(rec);
    setVitals({
      heart_rate: rec.heart_rate ?? '',
      spo2: rec.spo2 ?? '',
      systolic_bp: rec.systolic_bp ?? '',
      diastolic_bp: rec.diastolic_bp ?? '',
      respiratory_rate: rec.respiratory_rate ?? '',
      temperature: rec.temperature ?? ''
    });
    setNoiseStd(0.0);
    setDroppedFields([]);
    setStaleMinutes(0);
    setResult(null);
    setValidationError(null);
  };

  const handleRecordSelectChange = (recId: string) => {
    const found = availableRecords.find(r => r.record_id === recId);
    if (found) {
      loadRecord(found);
    }
  };

  const toggleDropField = (field: string) => {
    if (droppedFields.includes(field)) {
      setDroppedFields(droppedFields.filter(f => f !== field));
    } else {
      setDroppedFields([...droppedFields, field]);
    }
  };

  const handleResetToBaseline = () => {
    if (currentRecord) {
      loadRecord(currentRecord);
    }
  };

  const handleRunSimulation = async () => {
    setValidationError(null);

    // Form input validation
    if (vitals.heart_rate !== '' && (vitals.heart_rate < 0 || vitals.heart_rate > 350)) {
      setValidationError('Heart rate must be between 0 and 350 bpm.');
      return;
    }
    if (vitals.spo2 !== '' && (vitals.spo2 < 0 || vitals.spo2 > 100)) {
      setValidationError('SpO2 must be between 0 and 100%.');
      return;
    }
    if (vitals.systolic_bp !== '' && (vitals.systolic_bp < 0 || vitals.systolic_bp > 350)) {
      setValidationError('Systolic BP must be between 0 and 350 mmHg.');
      return;
    }
    if (vitals.temperature !== '' && (vitals.temperature < 25 || vitals.temperature > 48)) {
      setValidationError('Core temperature must be between 25°C and 48°C.');
      return;
    }

    setIsRunning(true);
    try {
      const payload: WhatIfRequest = {
        record_id: selectedRecordId,
        vitals: {
          heart_rate: vitals.heart_rate === '' ? null : Number(vitals.heart_rate),
          spo2: vitals.spo2 === '' ? null : Number(vitals.spo2),
          systolic_bp: vitals.systolic_bp === '' ? null : Number(vitals.systolic_bp),
          diastolic_bp: vitals.diastolic_bp === '' ? null : Number(vitals.diastolic_bp),
          respiratory_rate: vitals.respiratory_rate === '' ? null : Number(vitals.respiratory_rate),
          temperature: vitals.temperature === '' ? null : Number(vitals.temperature),
        },
        noise_std: noiseStd,
        dropped_fields: droppedFields,
        timestamp_stale_minutes: staleMinutes,
        custom_notes: customNotes || undefined
      };

      const res = await runWhatIfSimulation(payload);
      setResult(res);
    } catch (err: any) {
      setValidationError(err.message || 'Simulation execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  // Radar data comparing baseline vs perturbed vitals (normalized to 0-100 scale for clean visual display)
  const radarData = result ? [
    {
      subject: 'HR (bpm)',
      Original: Math.min(100, ((result.original_vitals.heart_rate || 75) / 160) * 100),
      Perturbed: Math.min(100, ((result.perturbed_vitals.heart_rate || 75) / 160) * 100),
    },
    {
      subject: 'SpO2 (%)',
      Original: result.original_vitals.spo2 || 98,
      Perturbed: result.perturbed_vitals.spo2 || 98,
    },
    {
      subject: 'SBP (mmHg)',
      Original: Math.min(100, ((result.original_vitals.systolic_bp || 120) / 200) * 100),
      Perturbed: Math.min(100, ((result.perturbed_vitals.systolic_bp || 120) / 200) * 100),
    },
    {
      subject: 'Resp (bpm)',
      Original: Math.min(100, ((result.original_vitals.respiratory_rate || 16) / 40) * 100),
      Perturbed: Math.min(100, ((result.perturbed_vitals.respiratory_rate || 16) / 40) * 100),
    },
    {
      subject: 'Temp (°C)',
      Original: Math.min(100, (((result.original_vitals.temperature || 37) - 34) / 7) * 100),
      Perturbed: Math.min(100, (((result.perturbed_vitals.temperature || 37) - 34) / 7) * 100),
    },
  ] : [];

  return (
    <div className="space-y-8 py-6">
      {/* Header and Research Statement */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>WHAT IF? Telemetry Stress Simulator</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Interactive Lab
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simulate sensor noise, missing readings, and stale buffers to expose ghost signal failure modes.
          </p>
        </div>

        {/* Record Selection Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="patient-record-select" className="text-xs text-slate-400 font-mono">Select Patient Record:</label>
          <select
            id="patient-record-select"
            aria-label="Select Patient Record"
            value={selectedRecordId}
            onChange={(e) => handleRecordSelectChange(e.target.value)}
            className="bg-navy-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {availableRecords.map((r) => (
              <option key={r.record_id} value={r.record_id}>
                {r.record_id} {r.is_critical ? '(Critical)' : '(Non-Critical)'} - {r.quality_status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Validation or Error Message */}
      {validationError && (
        <div role="alert" className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Live Waveform Canvas Feedback */}
      <div className="space-y-2">
        <WaveformCanvas
          height={110}
          noiseLevel={noiseStd}
          heartRate={typeof vitals.heart_rate === 'number' ? vitals.heart_rate : 75}
          isStale={staleMinutes >= 120}
        />
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vital Inputs & Noise Sliders */}
        <div className="lg:col-span-6 space-y-6">
          {/* Vitals Editor Card */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                1. Physiological Vital Signs
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Direct Parameter Tuning</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Heart Rate */}
              <div>
                <label htmlFor="vital-heart-rate" className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Heart Rate</span>
                  <span className="font-mono text-cyan-400">{vitals.heart_rate} bpm</span>
                </label>
                <input
                  id="vital-heart-rate"
                  type="number"
                  aria-label="Heart Rate in bpm"
                  value={vitals.heart_rate}
                  onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>

              {/* SpO2 / Oxygen Saturation */}
              <div>
                <label htmlFor="vital-spo2" className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Oxygen Saturation (SpO₂)</span>
                  <span className="font-mono text-cyan-400">{vitals.spo2} %</span>
                </label>
                <input
                  id="vital-spo2"
                  type="number"
                  aria-label="Oxygen Saturation (SpO2) percentage"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>

              {/* Systolic BP */}
              <div>
                <label htmlFor="vital-systolic-bp" className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Systolic BP</span>
                  <span className="font-mono text-cyan-400">{vitals.systolic_bp} mmHg</span>
                </label>
                <input
                  id="vital-systolic-bp"
                  type="number"
                  aria-label="Systolic Blood Pressure in mmHg"
                  value={vitals.systolic_bp}
                  onChange={(e) => setVitals({ ...vitals, systolic_bp: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>

              {/* Diastolic BP */}
              <div>
                <label htmlFor="vital-diastolic-bp" className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Diastolic BP</span>
                  <span className="font-mono text-cyan-400">{vitals.diastolic_bp} mmHg</span>
                </label>
                <input
                  id="vital-diastolic-bp"
                  type="number"
                  aria-label="Diastolic Blood Pressure in mmHg"
                  value={vitals.diastolic_bp}
                  onChange={(e) => setVitals({ ...vitals, diastolic_bp: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>

              {/* Respiratory Rate */}
              <div>
                <label htmlFor="vital-respiratory-rate" className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Respiratory Rate</span>
                  <span className="font-mono text-cyan-400">{vitals.respiratory_rate} bpm</span>
                </label>
                <input
                  id="vital-respiratory-rate"
                  type="number"
                  aria-label="Respiratory Rate in breaths per minute"
                  value={vitals.respiratory_rate}
                  onChange={(e) => setVitals({ ...vitals, respiratory_rate: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>

              {/* Temperature */}
              <div>
                <label htmlFor="vital-temperature" className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Temperature</span>
                  <span className="font-mono text-cyan-400">{vitals.temperature} °C</span>
                </label>
                <input
                  id="vital-temperature"
                  type="number"
                  step="0.1"
                  aria-label="Body Temperature in Celsius"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Sensor Perturbation Controls Card */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                2. Telemetry Perturbations & Noise
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">Adversarial Stress</span>
            </div>

            {/* Gaussian Noise Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Sensor Gaussian Noise Magnitude (σ):</span>
                <span className="font-mono font-bold text-cyan-400">
                  {Math.round(noiseStd * 100)}%
                </span>
              </div>
              <input
                type="range"
                aria-label="Sensor Gaussian Noise Magnitude (σ)"
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={noiseStd}
                min="0"
                max="1"
                step="0.05"
                value={noiseStd}
                onChange={(e) => setNoiseStd(Number(e.target.value))}
                className="w-full h-1.5 bg-navy-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0% (Clean)</span>
                <span>50% (High Artifact)</span>
                <span>100% (Extreme Noise)</span>
              </div>
            </div>

            {/* Sensor Dropout Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="text-xs text-slate-300">Simulate Sensor Dropouts (Probe Detachment):</div>
              <div className="grid grid-cols-3 gap-2">
                {['spo2', 'heart_rate', 'systolic_bp', 'respiratory_rate', 'temperature', 'diastolic_bp'].map((field) => {
                  const isDropped = droppedFields.includes(field);
                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => toggleDropField(field)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition flex items-center justify-between ${
                        isDropped
                          ? 'bg-rose-950/50 border-rose-500 text-rose-300 font-bold'
                          : 'bg-navy-900 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{field.replace('_', ' ').toUpperCase()}</span>
                      <span className={`w-2 h-2 rounded-full ${isDropped ? 'bg-rose-500' : 'bg-slate-600'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stale Timestamp Slider */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Timestamp Staleness Drift:</span>
                <span className="font-mono text-amber-400">+{staleMinutes} minutes ({Math.round(staleMinutes / 60)} hrs)</span>
              </div>
              <input
                type="range"
                aria-label="Timestamp Staleness Drift in minutes"
                aria-valuemin={0}
                aria-valuemax={1440}
                aria-valuenow={staleMinutes}
                min="0"
                max="1440"
                step="30"
                value={staleMinutes}
                onChange={(e) => setStaleMinutes(Number(e.target.value))}
                className="w-full h-1.5 bg-navy-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Experiment Notes */}
            <div className="space-y-1 pt-2 border-t border-white/5">
              <label htmlFor="experiment-notes" className="block text-xs text-slate-400">Experiment Hypothesis / Custom Notes (optional):</label>
              <input
                id="experiment-notes"
                type="text"
                placeholder="e.g. Testing SpO2 detachment while tachycardic"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleResetToBaseline}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-300 border border-white/10 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Vitals</span>
              </button>
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isRunning}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs shadow-apple-glow transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Computing Inference...' : 'Run WHAT IF Experiment'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Model Outputs & Comparison Charts */}
        <div className="lg:col-span-6 space-y-6">
          {result ? (
            <>
              {/* Ghost Signal Alert Banner if triggered */}
              <GhostSignalAlert
                type={result.ghost_signal_type}
                severity={result.ghost_signal_severity}
                baselineDelta={result.delta_baseline}
                gaDelta={result.delta_ga}
              />

              {/* Score Migration Comparison Card */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Model Risk Outputs (Decision Threshold = 0.50)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Score Range [0.0 - 1.0]</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Baseline RF Card */}
                  <div className="p-4 rounded-xl bg-navy-900 border border-white/10 space-y-2">
                    <div className="text-xs font-mono text-cyan-400 flex items-center justify-between">
                      <span>Baseline RF</span>
                      <span className="text-[10px] text-slate-400">All Features</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-mono text-white">
                        {result.baseline_risk_perturbed.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400">
                        (orig: {result.baseline_risk_original.toFixed(2)})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-white/5">
                      <span className="text-slate-400">Score Shift (|Δ|):</span>
                      <span className={`font-bold ${
                        Math.abs(result.delta_baseline) >= 0.20 ? 'text-rose-400' : 'text-slate-200'
                      }`}>
                        {result.delta_baseline > 0 ? `+${result.delta_baseline.toFixed(2)}` : result.delta_baseline.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* GA-Selected RF Card */}
                  <div className="p-4 rounded-xl bg-navy-900 border border-violet-500/20 space-y-2">
                    <div className="text-xs font-mono text-violet-400 flex items-center justify-between">
                      <span>GA Robust RF</span>
                      <span className="text-[10px] text-violet-300">Feature Mask</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-mono text-white">
                        {result.ga_risk_perturbed.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400">
                        (orig: {result.ga_risk_original.toFixed(2)})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-white/5">
                      <span className="text-slate-400">Score Shift (|Δ|):</span>
                      <span className="font-bold text-violet-300">
                        {result.delta_ga > 0 ? `+${result.delta_ga.toFixed(2)}` : result.delta_ga.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Comparison Visual Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Baseline Model Drift</span>
                    <span className="font-mono">{result.delta_baseline > 0 ? `+${result.delta_baseline.toFixed(2)}` : result.delta_baseline.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-navy-900 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, result.baseline_risk_perturbed * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>GA Robust Model Drift</span>
                    <span className="font-mono text-violet-300">{result.delta_ga > 0 ? `+${result.delta_ga.toFixed(2)}` : result.delta_ga.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-navy-900 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-violet-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, result.ga_risk_perturbed * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Radar Chart: Original vs Perturbed Vitals Envelope */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="text-xs font-semibold text-white uppercase tracking-wider">
                  Hemodynamic Envelope (Original vs Perturbed)
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Original" dataKey="Original" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.25} />
                      <Radar name="Perturbed" dataKey="Perturbed" stroke="#F43F5E" fill="#F43F5E" fillOpacity={0.25} />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#CBD5E1' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plain-Language Explainability Feed */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2">
                <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Explainability Attribution</span>
                </div>
                <div className="p-3 rounded-xl bg-navy-900 text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed border border-white/5">
                  {result.plain_language_explanation}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-white/10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Simulator Ready</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Adjust vital parameters, inject noise or sensor dropouts on the left, and click <span className="text-cyan-300 font-medium">'Run WHAT IF Experiment'</span> to evaluate model score migration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
