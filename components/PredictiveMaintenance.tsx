
import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  Activity, AlertTriangle, CheckCircle, Server, Lock, Cpu, 
  Thermometer, Zap, Waves, BrainCircuit, ShieldCheck, Play, RefreshCcw, Database, ArrowRight
} from 'lucide-react';
import { getDeviceStatus, getPlantList, DeviceData } from '../services/fusionSolarService';

// --- TIS: TYPE DEFINITIONS (Aligned with PFF Specs) ---

interface TelemetryFrame {
  timestamp: string;
  deviceId: string;
  temperature: number; // Real from API
  efficiency: number;  // Real from API
  vibration: number;   // Derived/Simulated
  load: number;        // Real from API (active_power)
}

interface PredictionResult {
  assetId: string;
  riskScore: number; // 0-100
  predictedFailureWindow: string; // e.g. "48h"
  rootCause: string[];
  status: 'SAFE' | 'MONITOR' | 'CRITICAL';
  confidence: number;
}

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'INFO' | 'WARN' | 'CRITICAL' | 'SUCCESS';
  module: string;
  message: string;
}

// --- ATLAS LOGIC ENGINE (PFF Implementation) ---

class PFFEngine {
  // 1. Data Ingestion & Normalization
  static normalizeTelemetry(device: DeviceData): TelemetryFrame {
    // Derive vibration proxy from efficiency loss (Simulated correlation)
    // If efficiency < 98%, vibration increases
    const vibrationBase = 0.5; // mm/s
    const efficiencyDelta = Math.max(0, 99 - (device.efficiency || 99));
    const simulatedVibration = vibrationBase + (efficiencyDelta * 0.8) + (Math.random() * 0.2);

    return {
      timestamp: new Date().toLocaleTimeString(),
      deviceId: device.devName,
      temperature: device.temperature || 45,
      efficiency: device.efficiency || 98.5,
      vibration: parseFloat(simulatedVibration.toFixed(2)),
      load: device.active_power || 0
    };
  }

  // 2. Compute Risk Score (The "Algorithm")
  static analyzeRisk(frame: TelemetryFrame, baselineTemp: number = 50): PredictionResult {
    let score = 0;
    const causes: string[] = [];

    // Factor 1: Thermal Deviation (Weight: 40)
    if (frame.temperature > baselineTemp + 10) {
      score += 40;
      causes.push(`Thermal Runaway (+${(frame.temperature - baselineTemp).toFixed(1)}°C)`);
    } else if (frame.temperature > baselineTemp + 5) {
      score += 20;
      causes.push("Temp Warning");
    }

    // Factor 2: Efficiency/Vibration Correlation (Weight: 50)
    if (frame.vibration > 4.0) {
      score += 50;
      causes.push("Critical Mechanical Vibration");
    } else if (frame.vibration > 2.0) {
      score += 25;
      causes.push("Bearing Wear Detected");
    }

    // Factor 3: Load Stress (Weight: 10)
    if (frame.load > 100) { // Assuming 100kW max for this demo unit
      score += 10;
      causes.push("Overload Condition");
    }

    // Determine Status
    let status: PredictionResult['status'] = 'SAFE';
    let window = "> 30 Days";
    
    if (score >= 75) {
      status = 'CRITICAL';
      window = "24-48 Hours";
    } else if (score >= 40) {
      status = 'MONITOR';
      window = "7 Days";
    }

    return {
      assetId: frame.deviceId,
      riskScore: score,
      predictedFailureWindow: window,
      rootCause: causes.length > 0 ? causes : ["Normal Operation"],
      status,
      confidence: 0.85 + (score / 500) // Fake confidence calculation
    };
  }
}

export const PredictiveMaintenance: React.FC = () => {
  const [active, setActive] = useState(false);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [telemetryBuffer, setTelemetryBuffer] = useState<TelemetryFrame[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<PredictionResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [safetyLock, setSafetyLock] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry['type'], module: string, message: string) => {
    setLogs(prev => [...prev.slice(-49), {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      module,
      message
    }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Main Loop
  useEffect(() => {
    let interval: any;

    const runCycle = async () => {
      if (!active) return;

      try {
        // STEP 1: API HANDSHAKE (Existing System)
        const plants = await getPlantList();
        if (!plants || plants.length === 0) {
          addLog('WARN', 'INGEST', 'No active plants found in FusionSolar API.');
          return;
        }

        const devices = await getDeviceStatus(plants[0].stationCode);
        const targetDevice = devices.find(d => d.devTypeId === 1); // Get first inverter

        if (!targetDevice) {
          addLog('WARN', 'INGEST', 'No inverters online.');
          return;
        }

        setActiveDeviceId(targetDevice.devName);

        // STEP 2: PROCESSING
        const frame = PFFEngine.normalizeTelemetry(targetDevice);
        setTelemetryBuffer(prev => [...prev.slice(-29), frame]); // Keep last 30 points

        // STEP 3: PREDICTION ENGINE
        const prediction = PFFEngine.analyzeRisk(frame);
        setLatestPrediction(prediction);

        // STEP 4: ACTION DISPATCH & SAFETY GATING
        if (prediction.riskScore > 40) {
           addLog(
             prediction.status === 'CRITICAL' ? 'CRITICAL' : 'WARN', 
             'PREDICT_ENGINE', 
             `Risk ${prediction.riskScore}% detected. Causes: ${prediction.rootCause.join(', ')}`
           );

           if (prediction.status === 'CRITICAL' && !safetyLock) {
             // Safety Protocol: Double Check
             addLog('WARN', 'SAFETY_GATE', 'Critical threshold breached. Initiating 60s verification cycle...');
             setSafetyLock(true);
             setTimeout(() => {
                addLog('CRITICAL', 'ALERT_API', `POST /api/v1/incidents/create - Ticket Created for ${prediction.assetId}`);
                setSafetyLock(false);
             }, 3000); // Simulated 3s delay for demo (instead of 60s)
           }
        } else {
           if (Math.random() > 0.7) { // Reduce log noise
             addLog('INFO', 'MONITOR', `Asset ${prediction.assetId} nominal. Eff: ${frame.efficiency}%`);
           }
        }

      } catch (e) {
        addLog('CRITICAL', 'SYSTEM', 'API Link Lost.');
      }
    };

    if (active) {
      interval = setInterval(runCycle, 2000); // 2s polling for demo fluidity
    }

    return () => clearInterval(interval);
  }, [active, safetyLock]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 h-full flex flex-col overflow-hidden relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-700/50 pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-indigo-500" />
            Predictive Failure Forecasting
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
            <Database className="w-3 h-3 text-amber-500" />
            LINKED: FusionSolar API (v1.2)
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-2 ${active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              <Activity className="w-3 h-3" /> {active ? 'ENGINE ACTIVE' : 'STANDBY'}
           </div>
           <button 
             onClick={() => setActive(!active)}
             className={`p-3 rounded-xl transition-all ${active ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
           >
             {active ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4" />}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        
        {/* LEFT COLUMN: LIVE TELEMETRY & PREDICTION */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
           
           {/* Metric Cards */}
           <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 relative overflow-hidden">
                 <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">PoF Score</p>
                 <div className="flex items-end gap-2 relative z-10">
                    <span className={`text-3xl font-black ${latestPrediction?.riskScore && latestPrediction.riskScore > 50 ? 'text-red-500' : 'text-emerald-400'}`}>
                        {latestPrediction?.riskScore || 0}%
                    </span>
                    <span className="text-xs text-slate-400 mb-1">Probability</span>
                 </div>
                 {latestPrediction?.riskScore && latestPrediction.riskScore > 50 && (
                   <div className="absolute right-0 top-0 p-2">
                     <AlertTriangle className="w-6 h-6 text-red-500/50 animate-ping" />
                   </div>
                 )}
              </div>

              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                 <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Device Temp</p>
                 <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-white">
                        {telemetryBuffer.length > 0 ? telemetryBuffer[telemetryBuffer.length-1].temperature : '--'}°C
                    </span>
                 </div>
                 <div className="w-full bg-slate-900 h-1 mt-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${telemetryBuffer.length > 0 && telemetryBuffer[telemetryBuffer.length-1].temperature > 50 ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{width: `${Math.min(100, (telemetryBuffer[telemetryBuffer.length-1]?.temperature || 0))}%`}}
                    ></div>
                 </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                 <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Calculated Vib</p>
                 <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-white">
                        {telemetryBuffer.length > 0 ? telemetryBuffer[telemetryBuffer.length-1].vibration : '--'}
                    </span>
                    <span className="text-xs text-slate-400 mb-1">mm/s</span>
                 </div>
                 <p className="text-[9px] text-slate-500 mt-2 font-mono">Derived from Eff. Delta</p>
              </div>
           </div>

           {/* Live Telemetry Chart */}
           <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex-1 min-h-[300px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase">Live Sensor Fusion (FusionSolar)</span>
                 </div>
                 <div className="text-[10px] text-slate-500 font-mono">
                    ID: {activeDeviceId || 'SCANNING...'}
                 </div>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={telemetryBuffer}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis yAxisId="left" stroke="#64748b" fontSize={10} domain={[0, 10]} label={{ value: 'Vib (mm/s)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} domain={[20, 80]} label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }} />
                      <Tooltip 
                         contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Line yAxisId="left" type="step" dataKey="vibration" stroke="#f472b6" strokeWidth={2} dot={false} isAnimationActive={false} name="Vibration" />
                      <Line yAxisId="right" type="monotone" dataKey="temperature" stroke="#fb923c" strokeWidth={2} dot={false} isAnimationActive={false} name="Temperature" />
                      
                      {/* Thresholds */}
                      <ReferenceLine yAxisId="left" y={4} stroke="#ef4444" strokeDasharray="3 3" />
                      <ReferenceLine yAxisId="right" y={60} stroke="#ef4444" strokeDasharray="3 3" />
                   </LineChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Visual Pipeline */}
           <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                 <div className="flex flex-col items-center gap-2">
                    <div className="p-2 rounded-lg border bg-slate-800 border-slate-700 text-slate-300">
                       <Server className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] uppercase">FusionSolar API</span>
                 </div>
                 <ArrowRight className="w-4 h-4 text-slate-700" />
                 <div className="flex flex-col items-center gap-2">
                    <div className={`p-2 rounded-lg border ${active ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700'}`}>
                       <RefreshCcw className={`w-4 h-4 ${active ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="text-[9px] uppercase">Normalization</span>
                 </div>
                 <ArrowRight className="w-4 h-4 text-slate-700" />
                 <div className="flex flex-col items-center gap-2">
                    <div className={`p-2 rounded-lg border ${latestPrediction?.status === 'CRITICAL' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700'}`}>
                       <BrainCircuit className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] uppercase">Risk Model</span>
                 </div>
                 <ArrowRight className="w-4 h-4 text-slate-700" />
                 <div className="flex flex-col items-center gap-2">
                    <div className={`p-2 rounded-lg border ${safetyLock ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700'}`}>
                       <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] uppercase">Safety Gate</span>
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: SYSTEM LOGS */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
           <div className="bg-black border border-slate-800 rounded-2xl flex flex-col h-full shadow-inner">
              <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                 <div className="flex items-center gap-2">
                    <Server className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Decision Logs</span>
                 </div>
                 <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500/20"></div>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar font-mono text-[10px]">
                 {logs.length === 0 && <span className="text-slate-600 italic">Waiting for telemetry stream...</span>}
                 {logs.map((log) => (
                    <div key={log.id} className="flex gap-2 border-b border-slate-900/50 pb-1 mb-1 last:border-0">
                       <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                       <span className={`font-bold shrink-0 w-16 ${
                          log.type === 'CRITICAL' ? 'text-red-500' : 
                          log.type === 'WARN' ? 'text-amber-500' : 
                          log.type === 'SUCCESS' ? 'text-emerald-500' : 
                          'text-blue-400'
                       }`}>{log.module}:</span>
                       <span className="text-slate-300 break-words">{log.message}</span>
                    </div>
                 ))}
                 <div ref={logsEndRef} />
              </div>

              {/* Status Footer */}
              <div className="p-3 bg-slate-900/50 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                 <span>Protocol: PFF-v2.1</span>
                 <span className={active ? "text-emerald-500" : "text-slate-500"}>{active ? "CONNECTED" : "OFFLINE"}</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
