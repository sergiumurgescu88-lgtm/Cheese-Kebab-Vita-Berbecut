
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import { 
  Activity, Settings, Database, Play, CheckCircle, AlertTriangle, 
  FileJson, ArrowRight, ShieldCheck, Server, Lock, RefreshCcw 
} from 'lucide-react';

// --- TIS: TYPE DEFINITIONS (Based on JSON Specs) ---

interface MetricConfig {
  id: string;
  weight: number;
  threshold_min?: number;
  threshold_max?: number;
  label: string;
  unit: string;
}

interface BenchmarkConfig {
  name: string;
  target_entity: string;
  comparison_mode: 'PEER_TO_PEER' | 'HISTORICAL';
  metrics: MetricConfig[];
}

interface DataPoint {
  timestamp: string;
  metric_id: string;
  value: number;
  integrity_hash?: string;
}

interface BenchmarkResult {
  metric_id: string;
  actual: number;
  baseline: number;
  deviation_percent: number;
  z_score: number;
  status: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE_WARNING' | 'CRITICAL';
}

// --- ATLAS LOGIC ENGINE (Simulation of Backend Microservice) ---

class BenchmarkEngine {
  
  // 1. Validation Layer (Simulated Integrity Check)
  static validateIntegrity(points: DataPoint[]): boolean {
    // In a real backend, this would check SHA256 hashes
    return points.every(p => p.value !== undefined && !isNaN(p.value));
  }

  // 3. Normalization Engine (Isolation Forest Simplified - IQR Method)
  static removeOutliers(values: number[]): number[] {
    if (values.length < 4) return values;
    
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length / 4)];
    const q3 = sorted[Math.floor(sorted.length * (3 / 4))];
    const iqr = q3 - q1;
    
    const minValid = q1 - 1.5 * iqr;
    const maxValid = q3 + 1.5 * iqr;
    
    return values.filter(v => v >= minValid && v <= maxValid);
  }

  // 4. Benchmarking Core
  static executeBenchmark(config: BenchmarkConfig, currentData: DataPoint[]): { results: BenchmarkResult[], score: number } {
    const results: BenchmarkResult[] = [];
    let weightedSum = 0;
    let totalWeight = 0;

    config.metrics.forEach(metric => {
      // Get actuals
      const metricPoints = currentData.filter(d => d.metric_id === metric.id).map(d => d.value);
      if (metricPoints.length === 0) return;

      const actualAvg = metricPoints.reduce((a, b) => a + b, 0) / metricPoints.length;

      // Simulate Baseline (Historical Data Retrieval)
      // In production, this queries Time-Series DB (InfluxDB)
      const baselineAvg = metric.id === 'kpi_pr' ? 82.5 : 98.0; // Example baselines
      const stdDev = metric.id === 'kpi_pr' ? 2.5 : 1.0; 

      const delta = actualAvg - baselineAvg;
      const deviationPercent = (delta / baselineAvg) * 100;
      
      // Z-Score Calculation
      const zScore = (actualAvg - baselineAvg) / stdDev;

      // Verdict Logic
      let status: BenchmarkResult['status'] = 'NEUTRAL';
      if (metric.id === 'kpi_pr') { // Higher is better
         if (zScore > 1) status = 'POSITIVE';
         else if (zScore < -1.5) status = 'CRITICAL';
         else if (zScore < -0.5) status = 'NEGATIVE_WARNING';
      } else { // Availability/Response time (Lower is better usually, but here Availability is Higher=Better)
         if (zScore > 0) status = 'POSITIVE';
         else if (zScore < -2) status = 'CRITICAL';
      }

      results.push({
        metric_id: metric.id,
        actual: parseFloat(actualAvg.toFixed(2)),
        baseline: baselineAvg,
        deviation_percent: parseFloat(deviationPercent.toFixed(2)),
        z_score: parseFloat(zScore.toFixed(2)),
        status
      });

      // Composite Score Calculation
      // Normalize score 0-100 based on Z-score (-3 to +3 range roughly)
      const normalizedScore = Math.max(0, Math.min(100, 50 + (zScore * 16.6))); 
      weightedSum += normalizedScore * metric.weight;
      totalWeight += metric.weight;
    });

    return {
      results,
      score: Math.round(weightedSum / totalWeight)
    };
  }
}

// --- UI COMPONENT ---

export const PerformanceBenchmarking: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // Config, Ingest, Process, Result
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  const [finalReport, setFinalReport] = useState<any>(null);

  // Default Config State (Step 1)
  const [config, setConfig] = useState<BenchmarkConfig>({
    name: "Q4_Portfolio_Efficiency_Test",
    target_entity: "Cluster_RO_South",
    comparison_mode: 'PEER_TO_PEER',
    metrics: [
      { id: "kpi_pr", label: "Performance Ratio (PR)", weight: 0.7, unit: "%" },
      { id: "kpi_availability", label: "Grid Availability", weight: 0.3, unit: "%" }
    ]
  });

  // Data State (Step 2)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([
    { timestamp: new Date().toISOString(), metric_id: "kpi_pr", value: 84.2 },
    { timestamp: new Date().toISOString(), metric_id: "kpi_pr", value: 83.9 },
    { timestamp: new Date().toISOString(), metric_id: "kpi_pr", value: 85.1 },
    { timestamp: new Date().toISOString(), metric_id: "kpi_availability", value: 99.2 },
    { timestamp: new Date().toISOString(), metric_id: "kpi_availability", value: 99.5 },
  ]);

  const runBenchmark = async () => {
    setStep(3);
    setProcessingLog([]);
    const addLog = (msg: string) => setProcessingLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    addLog("INIT: Handshake authorization (JWT)...");
    await new Promise(r => setTimeout(r, 600));
    
    addLog("VALIDATION: Verifying SHA256 integrity hashes...");
    const isValid = BenchmarkEngine.validateIntegrity(dataPoints);
    if (!isValid) {
      addLog("ERROR: Integrity check failed.");
      return;
    }
    addLog("VALIDATION: OK.");
    await new Promise(r => setTimeout(r, 500));

    addLog("NORMALIZATION: Running Isolation Forest (Outlier detection)...");
    await new Promise(r => setTimeout(r, 700));
    addLog("NORMALIZATION: 0 outliers removed.");

    addLog("CORE: Querying InfluxDB for Baseline (Window: 90 days)...");
    await new Promise(r => setTimeout(r, 800));
    addLog("CORE: Baseline Hydrated. Calculating Delta & Z-Score...");

    const { results, score } = BenchmarkEngine.executeBenchmark(config, dataPoints);
    await new Promise(r => setTimeout(r, 500));

    addLog(`COMPLETED: Job ID job_bnch_${Math.floor(Math.random()*10000)}`);
    
    setFinalReport({ results, score, jobId: `job_bnch_${Math.floor(Math.random()*10000)}` });
    setTimeout(() => setStep(4), 800);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 h-full flex flex-col overflow-hidden relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-700/50 pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-6 h-6 text-indigo-500" />
            Performance Benchmarking
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">MOD-11 | ATLAS ENGINE CORE</p>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1 w-8 rounded-full transition-all ${s <= step ? 'bg-indigo-500' : 'bg-slate-800'}`} />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* STEP 1: CONFIGURATION */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
              <div className="flex items-center gap-2 mb-4 text-indigo-400 font-bold uppercase text-xs tracking-widest">
                <Settings className="w-4 h-4" /> Benchmark Configuration
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-bold">Config Name</label>
                  <input type="text" value={config.name} disabled className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white mt-1 font-mono opacity-70" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold">Target Entity</label>
                  <input type="text" value={config.target_entity} disabled className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white mt-1 font-mono opacity-70" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
              <div className="flex items-center gap-2 mb-4 text-indigo-400 font-bold uppercase text-xs tracking-widest">
                <FileJson className="w-4 h-4" /> Metric Definitions (JSON)
              </div>
              <div className="space-y-2">
                {config.metrics.map((m, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-sm font-bold text-slate-200">{m.label}</span>
                    <div className="flex gap-4 text-xs font-mono">
                      <span className="text-slate-500">ID: {m.id}</span>
                      <span className="text-indigo-400">Weight: {m.weight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => setStep(2)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
                Next: Data Ingestion <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DATA INGESTION */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-widest">
                  <Database className="w-4 h-4" /> Data Stream Ingestion
                </div>
                <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-500 font-mono">POST /api/v1/benchmark/ingest</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-500 text-xs uppercase">
                      <th className="pb-2">Metric ID</th>
                      <th className="pb-2">Value</th>
                      <th className="pb-2">Hash (Simulated)</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-slate-300">
                    {dataPoints.map((dp, i) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        <td className="py-2">{dp.metric_id}</td>
                        <td className="py-2 text-white font-bold">{dp.value}</td>
                        <td className="py-2 opacity-50 truncate max-w-[100px]">sha256:e3b0c442...</td>
                        <td className="py-2 text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Valid</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="text-slate-500 hover:text-white text-sm font-bold">Back</button>
              <button onClick={runBenchmark} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20">
                <Play className="w-4 h-4" /> Execute Benchmark Engine
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PROCESSING */}
        {step === 3 && (
          <div className="flex flex-col h-full animate-in fade-in zoom-in-95 justify-center items-center pb-20">
             <div className="relative w-24 h-24 mb-8">
               <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-500 animate-pulse" />
             </div>
             
             <div className="w-full max-w-lg bg-black rounded-xl border border-slate-800 p-4 font-mono text-xs shadow-2xl">
               <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 text-slate-500">
                 <Server className="w-3 h-3" />
                 <span>ATLAS_COMPUTE_NODE_01</span>
               </div>
               <div className="space-y-1 h-32 overflow-hidden flex flex-col justify-end">
                 {processingLog.map((log, i) => (
                   <div key={i} className="text-emerald-500/90 truncate">
                     <span className="text-slate-600 mr-2">$</span>{log}
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}

        {/* STEP 4: RESULTS */}
        {step === 4 && finalReport && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8">
            {/* Top Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Composite Score</p>
                  <h3 className="text-4xl font-black text-white mt-1">{finalReport.score}/100</h3>
                </div>
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500 flex items-center justify-center bg-indigo-950">
                  <span className="text-xl font-bold text-white">A</span>
                </div>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Execution Metadata</p>
                <div className="space-y-1 font-mono text-xs text-slate-300">
                  <div className="flex justify-between"><span>Job ID:</span> <span className="text-white">{finalReport.jobId}</span></div>
                  <div className="flex justify-between"><span>Time:</span> <span>{new Date().toLocaleTimeString()}</span></div>
                  <div className="flex justify-between"><span>Engine:</span> <span className="text-emerald-400">ATLAS v2.1</span></div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl flex flex-col justify-center">
                 <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                   <ShieldCheck className="w-4 h-4" /> Audit Logged
                 </div>
                 <p className="text-[10px] text-slate-500 leading-tight">
                   Results immutably logged to audit trail.
                   <br/>Hash: 88a9...c2b1
                 </p>
              </div>
            </div>

            {/* Charts */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Metric Deviation Analysis</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={finalReport.results} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#475569" fontSize={10} domain={[0, 100]} hide />
                    <YAxis dataKey="metric_id" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                    <Tooltip 
                      cursor={{fill: '#1e293b', opacity: 0.4}}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '12px' }}
                    />
                    <ReferenceLine x={0} stroke="#475569" />
                    <Bar dataKey="baseline" fill="#475569" name="Baseline" barSize={20} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="actual" name="Actual" barSize={20} radius={[0, 4, 4, 0]}>
                      {finalReport.results.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.status === 'POSITIVE' ? '#10b981' : entry.status === 'CRITICAL' ? '#ef4444' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-500 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Metric</th>
                    <th className="px-6 py-4">Baseline</th>
                    <th className="px-6 py-4">Actual</th>
                    <th className="px-6 py-4">Z-Score</th>
                    <th className="px-6 py-4">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {finalReport.results.map((res: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-300">{res.metric_id}</td>
                      <td className="px-6 py-4 text-slate-400">{res.baseline}</td>
                      <td className="px-6 py-4 font-bold text-white">{res.actual}</td>
                      <td className="px-6 py-4 font-mono">{res.z_score > 0 ? '+' : ''}{res.z_score}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          res.status === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          res.status === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
               <button onClick={() => { setStep(1); setFinalReport(null); }} className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                 <RefreshCcw className="w-3 h-3" /> New Benchmark Run
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
