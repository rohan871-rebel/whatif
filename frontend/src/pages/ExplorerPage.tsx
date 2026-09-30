import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Download, Upload, Eye, Sliders, AlertTriangle, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { VitalRecord } from '../types';
import { fetchRecords, uploadDatasetCsv } from '../api';
import { VitalBadge } from '../components/VitalBadge';

interface ExplorerPageProps {
  onSelectRecordForSimulation: (record: VitalRecord) => void;
}

export const ExplorerPage: React.FC<ExplorerPageProps> = ({ onSelectRecordForSimulation }) => {
  const [records, setRecords] = useState<VitalRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  const [criticalFilter, setCriticalFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('record_id');
  const [order, setOrder] = useState('ASC');
  const [page, setPage] = useState(0);
  const limit = 20;
  const [isLoading, setIsLoading] = useState(false);

  // Selected Record Modal / Drawer
  const [selectedRecord, setSelectedRecord] = useState<VitalRecord | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchRecords({
        search: search.trim() || undefined,
        quality_status: qualityFilter || undefined,
        is_critical: criticalFilter,
        sort_by: sortBy,
        order: order,
        limit: limit,
        offset: page * limit
      });
      setRecords(res.records);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, qualityFilter, criticalFilter, sortBy, order, page]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setOrder('ASC');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadMessage(null);
    setUploadError(null);
    try {
      const res = await uploadDatasetCsv(file);
      setUploadMessage(`Success: ${res.message} (${res.total_records} records ingested).`);
      loadData();
    } catch (err: any) {
      setUploadError(err.message || 'CSV upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header and Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Patient & Telemetry Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Anonymized research cohort. Inspect vital streams, sensor defect flags, and risk scores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Sample CSV */}
          <a
            href="/api/records/sample-csv"
            download="ghost_signal_sample_vitals.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 text-slate-200 border border-white/10 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sample CSV</span>
          </a>

          {/* Upload CSV button */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Ingesting...' : 'Upload CSV'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Upload Feedback */}
      {uploadMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{uploadMessage}</span>
          <button onClick={() => setUploadMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Record ID (e.g. REC-1001)..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Quality Status Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Status:</span>
          <select
            value={qualityFilter}
            onChange={(e) => { setQualityFilter(e.target.value); setPage(0); }}
            className="bg-navy-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="CLEAN">Clean (No Warnings)</option>
            <option value="WARNING">Warning (Missing / Stale)</option>
            <option value="DEFECT">Defect (Severe Implausibility)</option>
          </select>
        </div>

        {/* Critical Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Acuity:</span>
          <select
            value={criticalFilter === undefined ? '' : String(criticalFilter)}
            onChange={(e) => {
              const val = e.target.value;
              setCriticalFilter(val === '' ? undefined : Number(val));
              setPage(0);
            }}
            className="bg-navy-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Acuities</option>
            <option value="1">Critical Only (1)</option>
            <option value="0">Non-Critical Only (0)</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-900/90 text-slate-400 border-b border-white/10 select-none">
              <tr>
                <th
                  onClick={() => handleSort('record_id')}
                  className="py-3 px-4 font-mono font-medium cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Record ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('heart_rate')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-white"
                >
                  Heart Rate
                </th>
                <th
                  onClick={() => handleSort('spo2')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-white"
                >
                  SpO2
                </th>
                <th
                  onClick={() => handleSort('systolic_bp')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-white"
                >
                  BP (Sys/Dia)
                </th>
                <th
                  onClick={() => handleSort('respiratory_rate')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-white"
                >
                  Resp Rate
                </th>
                <th
                  onClick={() => handleSort('temperature')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-white"
                >
                  Temp
                </th>
                <th
                  onClick={() => handleSort('baseline_risk')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-white"
                >
                  Baseline Risk
                </th>
                <th
                  onClick={() => handleSort('ga_risk')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-white"
                >
                  GA Risk
                </th>
                <th className="py-3 px-3 font-medium">Quality</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isCrit = r.is_critical === 1;
                  return (
                    <tr
                      key={r.record_id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-3 px-4 text-white font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span>{r.record_id}</span>
                          {isCrit && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="True critical event" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <VitalBadge type="hr" value={r.heart_rate} />
                      </td>
                      <td className="py-3 px-3">
                        <VitalBadge type="spo2" value={r.spo2} />
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-300">
                          {r.systolic_bp ?? '—'} / {r.diastolic_bp ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <VitalBadge type="rr" value={r.respiratory_rate} />
                      </td>
                      <td className="py-3 px-3">
                        <VitalBadge type="temp" value={r.temperature} />
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${
                          (r.baseline_risk ?? 0) >= 0.5 ? 'text-rose-400' : 'text-slate-300'
                        }`}>
                          {r.baseline_risk !== null && r.baseline_risk !== undefined ? r.baseline_risk.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${
                          (r.ga_risk ?? 0) >= 0.5 ? 'text-violet-400' : 'text-slate-300'
                        }`}>
                          {r.ga_risk !== null && r.ga_risk !== undefined ? r.ga_risk.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium border ${
                          r.quality_status === 'CLEAN'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                            : r.quality_status === 'WARNING'
                            ? 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                            : 'bg-rose-950/60 text-rose-400 border-rose-800/60 animate-pulse'
                        }`}>
                          {r.quality_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedRecord(r)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                            title="View Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectRecordForSimulation(r)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-sans transition"
                            title="Load record into WHAT IF Simulator"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>Simulate</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-navy-900/60 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-mono">{Math.min(total, page * limit + 1)}</span> to{' '}
            <span className="text-white font-mono">{Math.min(total, (page + 1) * limit)}</span> of{' '}
            <span className="text-white font-mono">{total}</span> records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 text-slate-200 border border-white/10 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span className="font-mono text-slate-300">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * limit >= total}
              className="px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 text-slate-200 border border-white/10 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-navy-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-apple">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">RECORD INSPECTION</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{selectedRecord.record_id}</span>
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    {selectedRecord.is_critical ? 'CRITICAL EVENT' : 'NON-CRITICAL'}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vital Signs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-navy-850 border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase">Heart Rate</div>
                <div className="text-lg font-mono font-bold text-white">{selectedRecord.heart_rate ?? 'Missing'} bpm</div>
              </div>
              <div className="p-3 rounded-xl bg-navy-850 border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase">SpO2</div>
                <div className="text-lg font-mono font-bold text-white">{selectedRecord.spo2 ?? 'Missing'} %</div>
              </div>
              <div className="p-3 rounded-xl bg-navy-850 border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase">Blood Pressure</div>
                <div className="text-lg font-mono font-bold text-white">{selectedRecord.systolic_bp ?? '—'} / {selectedRecord.diastolic_bp ?? '—'}</div>
              </div>
              <div className="p-3 rounded-xl bg-navy-850 border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase">Respiratory Rate</div>
                <div className="text-lg font-mono font-bold text-white">{selectedRecord.respiratory_rate ?? 'Missing'} bpm</div>
              </div>
              <div className="p-3 rounded-xl bg-navy-850 border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase">Temperature</div>
                <div className="text-lg font-mono font-bold text-white">{selectedRecord.temperature ?? 'Missing'} °C</div>
              </div>
              <div className="p-3 rounded-xl bg-navy-850 border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase">Timestamp</div>
                <div className="text-xs font-mono text-slate-300 mt-1">{selectedRecord.timestamp}</div>
              </div>
            </div>

            {/* Quality status & warnings */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Quality Audit Results</div>
              {selectedRecord.quality_warnings && selectedRecord.quality_warnings.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedRecord.quality_warnings.map((w, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Telemetry readings conform to research plausibility rules. No defects detected.</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const rec = selectedRecord;
                  setSelectedRecord(null);
                  onSelectRecordForSimulation(rec);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 text-xs font-semibold shadow-apple-glow transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Load into WHAT IF Simulator</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
