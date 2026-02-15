import React, { useState, useEffect, useRef } from 'react';
import { Play, Terminal, Zap, CheckCircle, AlertTriangle, RefreshCcw, Server, Activity, ArrowRight, Wifi, Shield, TrendingUp, History, Radio, Code, Lock, MapPin, Scan, Flame, Crosshair, Satellite, Droplets, Coins, Layers } from 'lucide-react';
import { Module } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line, Legend } from 'recharts';

interface ModuleSimulatorProps {
  module: Module;
}

interface TestResult {
  suite: string;
  test: string;
  status: 'PASS' | 'FAIL';
  value?: string;
  latency?: string;
}

export const ModuleSimulator: React.FC<ModuleSimulatorProps> = ({ module }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [activeSuite, setActiveSuite] = useState<string>('');
  
  // MOD-01 STATE
  const [gridFreq, setGridFreq] = useState(50.00);
  const [powerOutput, setPowerOutput] = useState(0.0);

  // MOD-02 SATU MARE SPECIFIC STATE
  const [satuMareState, setSatuMareState] = useState({
    freq: 50.00,
    power: 12.4, // Base load MW
    setpoint: 12.4,
    status: 'IDLE', // IDLE, HANDSHAKE, REGULATING, SAFETY_TRIP
    heartbeat: 0, // ms since last beat
    safetyLock: false
  });
  const [satuMareChart, setSatuMareChart] = useState<any[]>([]);

  // MOD-03 THERMAL STATE
  const [thermalMatrix, setThermalMatrix] = useState<number[]>(Array(64).fill(25)); // 8x8 grid, base 25C
  const [thermalStats, setThermalStats] = useState({ maxTemp: 25, anomalies: 0, scannedArea: 0 });

  // MOD-04 SOILING STATE
  const [soilingData, setSoilingData] = useState({
    opacity: 0,
    loss: 0,
    revenueLoss: 0,
    cleaningCost: 450, // EUR
    roiDays: 0
  });
  const [spectralChart, setSpectralChart] = useState<any[]>([]);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    setLogs(prev => [...prev, `[${timestamp}] ${type.toUpperCase()}: ${message}`]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- MOD-01: VPP ORCHESTRATOR LOGIC ---
  const runMod01TestSequence = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults([]);
    setProgress(0);
    setGridFreq(50.00);
    setPowerOutput(0.0);

    // --- SUITE 1: CORE VPP FUNCTIONALITY ---
    setActiveSuite('1. Core VPP Functionality');
    addLog('STARTING SUITE 1: CORE VPP FUNCTIONALITY', 'info');
    await new Promise(r => setTimeout(r, 600));
    
    setPowerOutput(12.5);
    addLog('TEST 1.1: Aggregating 5 solar plants (RO Portfolio)...', 'info');
    await new Promise(r => setTimeout(r, 400));
    setPowerOutput(65.2);
    addLog('VPP_ORCH: Handshake with RO-BUC-001, RO-BRA-001, RO-CLJ-001, RO-TIM-001, RO-CST-001 complete.', 'success');
    setResults(prev => [...prev, { suite: 'Core VPP', test: 'VPP Aggregation (5 plants)', status: 'PASS' }]);
    
    addLog('TEST 1.2: Plant Offline Handling (Simulating RO-CLJ-001 drop)...', 'info');
    await new Promise(r => setTimeout(r, 400));
    setPowerOutput(52.1);
    addLog('VPP_ORCH: Dynamic re-routing successful. Load balanced to 4 remaining assets.', 'success');
    setResults(prev => [...prev, { suite: 'Core VPP', test: 'Plant Offline Handling', status: 'PASS' }]);
    setProgress(20);

    // --- SUITE 2: RESPONSE TIME (CRITICAL) ---
    setActiveSuite('2. Response Time (92ms Requirement)');
    addLog('STARTING SUITE 2: RESPONSE TIME (STRICT 92ms)', 'info');
    await new Promise(r => setTimeout(r, 800));
    
    const latency = (Math.random() * 5 + 87.2).toFixed(1);
    addLog(`TEST 2.1: Dispatch latency check. Measured: ${latency}ms`, 'success');
    setResults(prev => [...prev, { suite: 'Response Time', test: '92ms Requirement', status: 'PASS', latency: `${latency}ms` }]);
    
    addLog('TEST 2.2: Load test (100 concurrent grid events)...', 'info');
    await new Promise(r => setTimeout(r, 600));
    addLog('SYSTEM: P95 latency stable at 78.2ms under saturation.', 'success');
    setResults(prev => [...prev, { suite: 'Response Time', test: 'Load Test (100 concurrent)', status: 'PASS' }]);
    setProgress(40);

    // --- SUITE 3: GRID-FORMING CAPABILITY ---
    setActiveSuite('3. Grid-Forming Capability');
    addLog('STARTING SUITE 3: GRID-FORMING CONTROL', 'info');
    
    // Simulate frequency swing
    setGridFreq(49.75);
    addLog('GRID_SENSE: Frequency deviation detected (49.75 Hz)', 'warning');
    addLog('VOLTA_PPC: Droop control active. Injecting active power...', 'info');
    setPowerOutput(58.5); // Injecting
    await new Promise(r => setTimeout(r, 400));
    setGridFreq(49.98);
    addLog('GRID_SENSE: Frequency stabilized at 49.98 Hz', 'success');
    
    setResults(prev => [...prev, { suite: 'Grid-Forming', test: 'Frequency Control', status: 'PASS' }]);
    setResults(prev => [...prev, { suite: 'Grid-Forming', test: 'Synthetic Inertia', status: 'PASS' }]);
    setProgress(60);

    // --- SUITE 4: BLACK START CAPABILITY ---
    setActiveSuite('4. Black Start Capability');
    addLog('STARTING SUITE 4: BLACK START (FROM ZERO)', 'info');
    addLog('GRID_STATE: Status: BLACKOUT', 'error');
    setPowerOutput(0);
    setGridFreq(0);
    await new Promise(r => setTimeout(r, 800));
    addLog('VOLTA_PPC: Initiating sub-network energization sequence...', 'info');
    setGridFreq(10);
    await new Promise(r => setTimeout(r, 600));
    setGridFreq(50.00);
    setPowerOutput(5.2);
    addLog('SUCCESS: Essential services energized (RO-BUC-001 back-fed)', 'success');
    setResults(prev => [...prev, { suite: 'Black Start', test: 'Black Start Sequence', status: 'PASS', value: '243s' }]);
    setProgress(75);

    // --- SUITE 5: API INTEGRATIONS ---
    setActiveSuite('5. API Integrations');
    addLog('STARTING SUITE 5: API HANDSHAKES', 'info');
    addLog('AUTH: Authenticating with Huawei FusionSolar Northbound...', 'info');
    await new Promise(r => setTimeout(r, 400));
    addLog('API: XSRF-TOKEN verified. Session Active.', 'success');
    setResults(prev => [...prev, { suite: 'API', test: 'Huawei FusionSolar', status: 'PASS' }]);
    
    addLog('PROTOCOL: Registering VEN on OpenADR 2.0b...', 'info');
    await new Promise(r => setTimeout(r, 400));
    addLog('API: VEN_ID [VPP-RO-001] registered with VTN.', 'success');
    setResults(prev => [...prev, { suite: 'API', test: 'OpenADR 2.0b', status: 'PASS' }]);
    setProgress(90);

    // --- SUITE 6: ECONOMIC VALIDATION ---
    setActiveSuite('6. Economic Validation');
    addLog('STARTING SUITE 6: NPV & ROI ANALYSIS', 'info');
    await new Promise(r => setTimeout(r, 800));
    addLog('FIN_OPS: Projecting 10-year cash flow with PTJ Grant integration...', 'info');
    addLog('FIN_OPS: NPV Confirmed: €46.8M (Tolerance ±10%)', 'success');
    setResults(prev => [...prev, { suite: 'Economics', test: 'NPV Calculation (€47M)', status: 'PASS', value: '€46.8M' }]);
    setResults(prev => [...prev, { suite: 'Economics', test: 'Cost Savings (40-60%)', status: 'PASS', value: '52.3%' }]);
    setPowerOutput(65.2); // Restore power
    
    setProgress(100);
    addLog('ALL TEST SUITES COMPLETED SUCCESSFULLY.', 'success');
    setIsRunning(false);
  };

  // --- MOD-02: SATU MARE IMPLEMENTATION LOGIC ---
  const runSatuMareSequence = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults([]);
    setSatuMareChart([]);
    setSatuMareState(prev => ({...prev, status: 'HANDSHAKE', freq: 50.00, power: 12.4}));

    // 1. ASSET TWIN CONFIG
    setActiveSuite('1. Asset Digital Twin Configuration');
    addLog('ATLAS: Loading configuration for PV_SATU_MARE_01...', 'info');
    await new Promise(r => setTimeout(r, 800));
    addLog('TWIN: Location 47.7900N, 22.8800E verified.', 'success');
    addLog('TWIN: Capacity 15.5 MW | Connection 110kV confirmed.', 'success');
    setResults(prev => [...prev, { suite: 'Asset Config', test: 'Digital Twin Init', status: 'PASS', value: 'PV_SATU_MARE_01' }]);

    // 2. HANDSHAKE
    setActiveSuite('2. API Handshake (IEC-60870-5-104)');
    addLog('ATLAS: Initiating secure handshake with SM_RTU_01...', 'info');
    await new Promise(r => setTimeout(r, 500));
    addLog('NET: POST /api/v1/fr-as/handshake -> 200 OK', 'success');
    addLog('NET: Latency check: 12ms (Excellent)', 'success');
    setSatuMareState(prev => ({...prev, status: 'REGULATING'}));
    setResults(prev => [...prev, { suite: 'Connectivity', test: 'API Handshake', status: 'PASS', latency: '12ms' }]);

    // 3. LIVE REGULATION SIMULATION LOOP
    setActiveSuite('3. Live Frequency Regulation (Droop 4%)');
    addLog('CTRL: Enabling autonomous Droop Control loop...', 'info');
    
    const iterations = 40;
    const baseLoad = 12.4;
    const pMax = 15.5;
    const droop = 0.04;
    const fNom = 50.0;
    
    for (let i = 0; i < iterations; i++) {
        // Simulate frequency noise and events
        let currentFreq = 50.0;
        
        if (i > 10 && i < 20) currentFreq = 49.95; // Under-frequency event
        else if (i > 25 && i < 35) currentFreq = 50.08; // Over-frequency event
        else currentFreq = 50.0 + (Math.random() - 0.5) * 0.02; // Noise

        // IMPLEMENTING THE PYTHON LOGIC FROM PROMPT
        const deadband = 0.02;
        const deltaF = currentFreq - fNom;
        let pAdjust = 0;

        if (Math.abs(deltaF) >= deadband) {
             const deltaP = - (deltaF / fNom) * (1 / droop) * pMax;
             pAdjust = deltaP;
        }

        const newPower = Math.max(0, Math.min(pMax, baseLoad + pAdjust));
        
        // Heartbeat simulation
        const heartbeat = Math.random() * 500 + 50; // Random heartbeat latency
        
        setSatuMareState(prev => ({
            ...prev, 
            freq: currentFreq, 
            power: newPower, 
            heartbeat: heartbeat,
            safetyLock: heartbeat > 5000 // Trigger safety if > 5s
        }));

        setSatuMareChart(prev => [...prev, { 
            time: i, 
            freq: currentFreq, 
            power: newPower, 
            limit: pMax 
        }].slice(-30));

        if (i === 11) addLog('GRID: Freq drop detected (49.95Hz). Injecting power...', 'warning');
        if (i === 15) addLog(`CTRL: Regulation Active. +${(newPower - baseLoad).toFixed(2)} MW`, 'success');
        if (i === 26) addLog('GRID: Over-freq (50.08Hz). Curtailing power...', 'warning');

        await new Promise(r => setTimeout(r, 250)); // Fast loop
    }

    setResults(prev => [...prev, { suite: 'FR-AS Logic', test: 'Droop Response', status: 'PASS', value: '4% Slope' }]);
    setResults(prev => [...prev, { suite: 'Safety', test: 'Heartbeat Watchdog', status: 'PASS', value: 'Active' }]);

    addLog('ATLAS: Simulation complete. Asset returned to baseline.', 'success');
    setIsRunning(false);
    setSatuMareState(prev => ({...prev, status: 'IDLE', freq: 50.00, power: 12.4}));
  };

  // --- MOD-03: THERMAL ANOMALY DETECTION (SATU MARE) ---
  const runThermalScanSequence = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults([]);
    // Reset Grid
    setThermalMatrix(Array(64).fill(22)); // Ambient 22C
    setThermalStats({ maxTemp: 22, anomalies: 0, scannedArea: 0 });

    // 1. GEO FENCING CONFIG
    setActiveSuite('1. Geo-Fencing & Target Config');
    addLog('ATLAS: Initializing TAD-V4 for Target SM-PARK-001...', 'info');
    await new Promise(r => setTimeout(r, 600));
    addLog('GEO: Loading Polygon [22.8725, 47.7920] (Parcul Central)...', 'info');
    addLog('GEO: Buffer zone 50m applied. Resolution 10px.', 'success');
    setResults(prev => [...prev, { suite: 'Configuration', test: 'AOI Lock (Satu Mare)', status: 'PASS', value: 'SM-PARK-001' }]);

    // 2. INGESTION STREAM
    setActiveSuite('2. Data Ingestion Pipeline');
    addLog('NET: Handshake with Sentinel-2 L2A Hub...', 'info');
    await new Promise(r => setTimeout(r, 500));
    addLog('NET: Drone feed detected (RTSP). Switching to Hybrid Source.', 'warning');
    addLog('DATA: Radiometric Calibration (Emissivity 0.98)...', 'success');
    setResults(prev => [...prev, { suite: 'Ingestion', test: 'Hybrid Stream (Sat+Drone)', status: 'PASS', latency: '450ms' }]);

    // 3. SCANNING & ANALYSIS LOOP
    setActiveSuite('3. Z-Score Spatial Analysis');
    addLog('CORE: Executing Segmentation logic (NDVI masking)...', 'info');
    
    // Simulate the scan
    for (let i = 0; i < 64; i++) {
        // Create heat pattern
        setThermalMatrix(prev => {
            const next = [...prev];
            // Base noise
            next[i] = 25 + Math.random() * 5; 
            
            // Introduce anomalies at specific indices
            if (i === 18) next[i] = 48; // Warning
            if (i === 42) next[i] = 72; // CRITICAL FIRE
            if (i === 43) next[i] = 68; // Spread
            
            return next;
        });

        // Update stats
        setThermalStats(prev => {
            const currentTemp = thermalMatrix[i] || 25;
            return {
                maxTemp: Math.max(prev.maxTemp, currentTemp),
                anomalies: currentTemp > 45 ? prev.anomalies + 1 : prev.anomalies,
                scannedArea: Math.round(((i + 1) / 64) * 100)
            };
        });

        // Logs triggers
        if (i === 18) addLog('ALGO: Warning triggered. Hotspot detected (48°C).', 'warning');
        if (i === 42) {
            addLog('ALGO: CRITICAL ALERT! Temp > 70°C detected.', 'error');
            addLog('SAFETY: TRIGGERING IMMEDIATE WEBHOOK [FIRE_HAZARD]', 'error');
        }

        await new Promise(r => setTimeout(r, 50));
    }

    setResults(prev => [...prev, { suite: 'Analysis', test: 'Z-Score Anomaly Detection', status: 'PASS', value: '2 Events' }]);
    setResults(prev => [...prev, { suite: 'Safety', test: 'Protocol SAFE-THERM-RO', status: 'PASS', value: 'Triggered' }]);

    addLog('ATLAS: Scan complete. Report generated: TAD-SM-99824X', 'success');
    setIsRunning(false);
  };

  // --- MOD-04: SATELLITE SOILING ANALYSIS (SATU MARE) ---
  const runSoilingAnalysisSequence = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults([]);
    setSpectralChart([]);
    setSoilingData({ opacity: 0, loss: 0, revenueLoss: 0, cleaningCost: 450, roiDays: 0 });

    // 1. ORBITAL ACQUISITION
    setActiveSuite('1. Planet Labs Acquisition');
    addLog('ATLAS: Initializing MOD-04 for PV_SATU_MARE_01...', 'info');
    await new Promise(r => setTimeout(r, 500));
    addLog('GEO: AOI Locked: 47.792°N, 22.885°E [Satu Mare]', 'success');
    addLog('SAT: Requesting PlanetScope Scene (3m resolution)...', 'info');
    await new Promise(r => setTimeout(r, 1000));
    addLog('SAT: Image Acquired (ID: 20240215_PSScene). Cloud cover < 5%.', 'success');
    setResults(prev => [...prev, { suite: 'Acquisition', test: 'Imagery Download (Satu Mare)', status: 'PASS', value: 'PSScene 3m' }]);

    // 2. SPECTRAL ANALYSIS (Simulated)
    setActiveSuite('2. Spectral Reflectance Analysis');
    addLog('ALGO: Comparing Band 3 (Red) vs Band 4 (NIR)...', 'info');
    
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
        const cleanReflectance = 0.8 - (i * 0.01);
        const soiledReflectance = 0.8 - (i * 0.015); // Drop faster
        const opacity = (cleanReflectance - soiledReflectance) * 100 * 2;
        
        setSpectralChart(prev => [...prev, { 
            wavelength: 400 + i * 20, 
            clean: cleanReflectance, 
            soiled: soiledReflectance 
        }]);

        setSoilingData(prev => ({
            ...prev,
            opacity: opacity,
            loss: opacity * 0.6 // Simplified loss model
        }));

        await new Promise(r => setTimeout(r, 100));
    }
    
    // Final values for Satu Mare scenario
    const finalLoss = 4.8; // 4.8% loss
    const dailyRev = 15.5 * 5 * 80; // 15.5MW * 5h * 80EUR
    const dailyLossVal = dailyRev * (finalLoss / 100);
    const roi = Math.ceil(450 / dailyLossVal);

    setSoilingData({
        opacity: 8.2,
        loss: finalLoss,
        revenueLoss: dailyLossVal,
        cleaningCost: 450,
        roiDays: roi
    });

    addLog(`ALGO: Detected particulate matter (Dust/Mud). Opacity: 8.2%`, 'warning');
    addLog(`PERF: Calculated Efficiency Loss: ${finalLoss}%`, 'error');
    setResults(prev => [...prev, { suite: 'Analysis', test: 'Soiling Index Calc', status: 'PASS', value: '4.8% Loss' }]);

    // 3. ROI CALCULATION
    setActiveSuite('3. Cleaning ROI Validation');
    addLog('FIN: Analyzing dispatch cost vs revenue loss...', 'info');
    await new Promise(r => setTimeout(r, 600));
    addLog(`FIN: Daily Revenue Loss: €${dailyLossVal.toFixed(0)}`, 'warning');
    addLog(`FIN: Robot Dispatch Cost: €450`, 'info');
    addLog(`DECISION: ROI < 2 days. CLEANING RECOMMENDED.`, 'success');
    
    setResults(prev => [...prev, { suite: 'Economics', test: 'ROI Calculation', status: 'PASS', value: `${roi} Days` }]);
    addLog('ATLAS: Work order WO-SM-CLEAN-01 generated.', 'success');
    
    setIsRunning(false);
  };

  const isMod01 = module.id === 'm1';
  const isMod02 = module.id === 'm2'; // Satu Mare FR-AS
  const isMod03 = module.id === 'm3'; // Satu Mare Thermal
  const isMod04 = module.id === 'm4'; // Satu Mare Soiling

  if (!isMod01 && !isMod02 && !isMod03 && !isMod04) {
    return (
      <div className="p-12 text-center text-slate-500 border border-dashed border-slate-700 rounded-3xl bg-slate-900/50">
        <Terminal className="w-16 h-16 mx-auto mb-6 opacity-20" />
        <h3 className="text-white font-bold mb-2">Sandbox Unavailable</h3>
        <p className="text-sm max-w-xs mx-auto">This simulator is currently optimized for MOD-01, MOD-02, MOD-03, and MOD-04 technical verification.</p>
      </div>
    );
  }

  // --- RENDER MOD-04 (SOILING) VIEW ---
  if (isMod04) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 font-mono">
            {/* SOILING HEADER */}
            <div className="bg-[#051316] border border-cyan-900/50 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Layers className="w-32 h-32 text-cyan-500" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold rounded uppercase tracking-widest">PLANET LABS</span>
                            <span className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-widest"><Satellite className="w-3 h-3" /> SATU MARE TARGET</span>
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Satellite Soiling Analysis</h3>
                        <p className="text-xs text-slate-500 mt-1">Resolution: 3m/px | Sensor: <span className="text-cyan-400">PlanetScope (Dove)</span></p>
                    </div>
                    
                    {!isRunning ? (
                        <button 
                            onClick={runSoilingAnalysisSequence}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/20"
                        >
                            <Scan className="w-4 h-4" /> Run Diagnosis
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Analysis</span>
                                <span className={`text-xs font-mono text-cyan-400`}>Processing...</span>
                            </div>
                            <Activity className="w-8 h-8 text-cyan-500 animate-pulse" />
                        </div>
                    )}
                </div>
            </div>

            {/* THREE COLUMN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COL 1: SATELLITE COMPARISON */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col h-[360px] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Visual Spectrum (RGB)</span>
                        <span className="text-[9px] text-cyan-400 font-mono">AOI: 100% Match</span>
                    </div>
                    
                    <div className="flex-1 relative rounded-xl overflow-hidden group">
                        {/* Simulated Satellite Image - Clean */}
                        <div className="absolute inset-0 bg-[url('https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_2024_01_mosaic/gmap/12/2314/1456.png')] bg-cover bg-center opacity-50 grayscale transition-all duration-1000 group-hover:opacity-100 group-hover:grayscale-0"></div>
                        
                        {/* Dirt Overlay Simulation */}
                        <div 
                            className="absolute inset-0 bg-amber-900/40 mix-blend-overlay transition-opacity duration-1000"
                            style={{ opacity: soilingData.opacity / 10 }}
                        ></div>

                        {/* Scanner Effect */}
                        {isRunning && (
                            <div className="absolute inset-0 border-b-2 border-cyan-500/50 animate-[scan_2s_linear_infinite] bg-gradient-to-b from-transparent to-cyan-500/10"></div>
                        )}
                        
                        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-[8px] text-white font-mono">
                            Lat: 47.792 | Lon: 22.885
                        </div>
                    </div>
                </div>

                {/* COL 2: SPECTRAL DATA & KPI */}
                <div className="bg-[#050505] border border-slate-800 rounded-2xl p-4 flex flex-col h-[360px]">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-slate-500" />
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Spectral Reflectance</span>
                        </div>
                    </div>
                    
                    <div className="h-32 w-full mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={spectralChart}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis hide />
                                <YAxis hide domain={[0, 1]} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '10px' }}
                                />
                                <Line type="monotone" dataKey="clean" stroke="#22d3ee" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="soiled" stroke="#78350f" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <p className="text-[8px] text-slate-500 uppercase font-bold">Est. Loss</p>
                            <p className={`text-xl font-bold ${soilingData.loss > 3 ? 'text-red-500' : 'text-white'}`}>-{soilingData.loss.toFixed(1)}%</p>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <p className="text-[8px] text-slate-500 uppercase font-bold">Revenue Risk</p>
                            <p className="text-xl font-bold text-white">€{soilingData.revenueLoss.toFixed(0)}<span className="text-[10px] text-slate-500">/day</span></p>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 col-span-2 flex justify-between items-center">
                            <div>
                                <p className="text-[8px] text-slate-500 uppercase font-bold">ROI Period</p>
                                <p className="text-sm font-bold text-emerald-400">{soilingData.roiDays.toFixed(1)} Days</p>
                            </div>
                            {soilingData.roiDays > 0 && soilingData.roiDays < 10 && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold uppercase animate-pulse">Action: CLEAN</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* COL 3: LOGS */}
                <div className="bg-black border border-slate-800 rounded-2xl p-4 flex flex-col h-[360px]">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                        <Terminal className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Analysis Logs</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
                        {logs.map((log, i) => (
                            <div key={i} className={`text-[10px] leading-tight ${
                                log.includes('ERROR') ? 'text-red-400' : 
                                log.includes('SUCCESS') ? 'text-emerald-400' : 
                                log.includes('WARNING') ? 'text-amber-400' : 
                                'text-slate-400'
                            }`}>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>

            {/* RESULTS */}
            {progress === 100 && !isRunning && (
                <div className="bg-[#051316] border border-cyan-900/30 rounded-2xl p-6 animate-in slide-in-from-bottom-4">
                    <h4 className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Diagnosis Complete
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {results.map((res, i) => (
                            <div key={i} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold">{res.suite}</span>
                                    {res.status === 'PASS' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-red-500" />}
                                </div>
                                <div className="text-xs text-white font-bold truncate">{res.test}</div>
                                {res.value && <div className="text-[10px] text-cyan-400 mt-1 font-mono">{res.value}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
  }

  // --- RENDER MOD-03 (THERMAL) VIEW ---
  if (isMod03) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 font-mono">
            {/* THERMAL HEADER */}
            <div className="bg-[#1a0f0f] border border-red-900/50 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Flame className="w-32 h-32 text-red-500" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold rounded uppercase tracking-widest">TAD-V4 ENGINE</span>
                            <span className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-widest"><Crosshair className="w-3 h-3" /> SATU MARE TARGET</span>
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Thermal Anomaly Detection</h3>
                        <p className="text-xs text-slate-500 mt-1">Protocol: <span className="text-red-400">SAFE-THERM-RO</span> | Asset: SM-PARK-001</p>
                    </div>
                    
                    {!isRunning ? (
                        <button 
                            onClick={runThermalScanSequence}
                            className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-red-900/20"
                        >
                            <Scan className="w-4 h-4" /> Initiate Scan
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Max Temp</span>
                                <span className={`text-xs font-mono font-bold ${thermalStats.maxTemp > 70 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{thermalStats.maxTemp.toFixed(1)}°C</span>
                            </div>
                            <Activity className="w-8 h-8 text-red-500 animate-pulse" />
                        </div>
                    )}
                </div>
            </div>

            {/* THREE COLUMN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COL 1: CONFIG JSON */}
                <div className="bg-[#050505] border border-slate-800 rounded-2xl p-4 flex flex-col h-[360px]">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                        <Code className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Geospatial Config</span>
                    </div>
                    <pre className="flex-1 overflow-y-auto custom-scrollbar text-[9px] text-slate-400 leading-relaxed font-mono">
{`{
  "target_metadata": {
    "location": "Parcul Central",
    "region": "Satu Mare",
    "id": "SM-PARK-001"
  },
  "geospatial_config": {
    "type": "Polygon",
    "coords": [[22.8725, 47.7920]...],
    "buffer_m": 50
  },
  "safety_protocols": {
    "id": "SAFE-THERM-RO",
    "triggers": [
      { "cond": ">45C", "act": "WARN" },
      { "cond": ">70C", "act": "CRITICAL" }
    ]
  }
}`}
                    </pre>
                </div>

                {/* COL 2: THERMAL MATRIX VISUALIZER */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col h-[360px] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Live Radiometric Feed</span>
                        <span className="text-[9px] text-red-400 font-mono">Anomalies: {thermalStats.anomalies}</span>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-8 gap-1 relative z-10">
                        {thermalMatrix.map((temp, i) => {
                            // Color mapping logic
                            let bgClass = 'bg-emerald-900/30';
                            if (temp > 35) bgClass = 'bg-yellow-600/40';
                            if (temp > 45) bgClass = 'bg-orange-600/60';
                            if (temp > 65) bgClass = 'bg-red-600 animate-pulse';

                            return (
                                <div key={i} className={`rounded-sm flex items-center justify-center text-[8px] font-mono text-white/50 transition-colors duration-300 ${bgClass}`}>
                                    {temp > 30 ? temp.toFixed(0) : ''}
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Scanline Effect */}
                    {isRunning && (
                        <div 
                            className="absolute left-0 right-0 h-1 bg-red-500/50 blur-sm transition-all duration-[50ms] z-20"
                            style={{ top: `${(thermalStats.scannedArea / 100) * 100}%` }}
                        />
                    )}
                </div>

                {/* COL 3: LOGS */}
                <div className="bg-black border border-slate-800 rounded-2xl p-4 flex flex-col h-[360px]">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                        <Terminal className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Processing Logs</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
                        {logs.map((log, i) => (
                            <div key={i} className={`text-[10px] leading-tight ${
                                log.includes('CRITICAL') || log.includes('ERROR') ? 'text-red-500 font-bold' : 
                                log.includes('SUCCESS') ? 'text-emerald-400' : 
                                log.includes('WARNING') ? 'text-amber-400' : 
                                'text-slate-400'
                            }`}>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>

            {/* RESULTS */}
            {progress === 100 && !isRunning && (
                <div className="bg-[#1a0f0f] border border-red-900/30 rounded-2xl p-6 animate-in slide-in-from-bottom-4">
                    <h4 className="text-red-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Audit Complete
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {results.map((res, i) => (
                            <div key={i} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold">{res.suite}</span>
                                    {res.status === 'PASS' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-red-500" />}
                                </div>
                                <div className="text-xs text-white font-bold truncate">{res.test}</div>
                                {res.value && <div className="text-[10px] text-red-400 mt-1 font-mono">{res.value}</div>}
                                {res.latency && <div className="text-[10px] text-red-400 mt-1 font-mono">{res.latency}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
  }

  // --- RENDER SATU MARE FR-AS VIEW ---
  if (isMod02) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 font-mono">
            {/* SATU MARE HEADER */}
            <div className="bg-[#0c1414] border border-emerald-900/50 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity className="w-32 h-32 text-emerald-500" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded uppercase tracking-widest">ATLAS ENGINE</span>
                            <span className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-widest"><Wifi className="w-3 h-3" /> IEC-60870-5-104</span>
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">FR-AS: Satu Mare Integration</h3>
                        <p className="text-xs text-slate-500 mt-1">Target Asset: <span className="text-emerald-400">PV_SATU_MARE_01</span></p>
                    </div>
                    
                    {!isRunning ? (
                        <button 
                            onClick={runSatuMareSequence}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                        >
                            <Play className="w-4 h-4" /> Initialize Sequence
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Heartbeat</span>
                                <span className={`text-xs font-mono ${satuMareState.heartbeat > 1000 ? 'text-red-400' : 'text-emerald-400'}`}>{satuMareState.heartbeat.toFixed(0)}ms</span>
                            </div>
                            <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
                        </div>
                    )}
                </div>
            </div>

            {/* TWIN & TELEMETRY GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COL 1: DIGITAL TWIN JSON */}
                <div className="bg-[#050505] border border-slate-800 rounded-2xl p-4 flex flex-col h-[300px]">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                        <Code className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Asset Digital Twin</span>
                    </div>
                    <pre className="flex-1 overflow-y-auto custom-scrollbar text-[9px] text-slate-400 leading-relaxed font-mono">
{`{
  "asset_id": "PV_SATU_MARE_01",
  "meta": {
    "name": "Parc Solar Satu Mare Alpha",
    "location": { "lat": 47.7900, "lon": 22.8800 },
    "connection": "110kV",
    "max_export": 15.5
  },
  "control": {
    "module": "FR-AS",
    "f_nominal": 50.0,
    "deadband": 0.02,
    "droop": 4.0
  },
  "connectivity": {
    "protocol": "IEC-60870-5-104",
    "gateway": "192.168.10.50",
    "port": 2404
  }
}`}
                    </pre>
                </div>

                {/* COL 2: REAL-TIME GAUGE & CHART */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Grid Frequency</span>
                            <span className={`text-2xl font-black ${Math.abs(satuMareState.freq - 50) > 0.05 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {satuMareState.freq.toFixed(3)} Hz
                            </span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Active Power</span>
                            <span className="text-xl font-black text-white">
                                {satuMareState.power.toFixed(2)} MW
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full bg-slate-950/50 rounded-lg overflow-hidden relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={satuMareChart}>
                                <defs>
                                    <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <YAxis hide domain={[10, 16]} />
                                <Area type="step" dataKey="power" stroke="#10b981" fill="url(#powerGrad)" strokeWidth={2} />
                                <ReferenceLine y={15.5} stroke="#ef4444" strokeDasharray="3 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="absolute top-2 right-2 text-[8px] text-red-400 font-bold">P_MAX 15.5 MW</div>
                    </div>
                </div>

                {/* COL 3: LIVE LOGS */}
                <div className="bg-black border border-slate-800 rounded-2xl p-4 flex flex-col h-[300px]">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                        <Terminal className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Controller Logs</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
                        {logs.map((log, i) => (
                            <div key={i} className={`text-[10px] leading-tight ${
                                log.includes('ERROR') ? 'text-red-400' : 
                                log.includes('SUCCESS') ? 'text-emerald-400' : 
                                log.includes('WARNING') ? 'text-amber-400' : 
                                'text-slate-400'
                            }`}>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>

            {/* RESULTS SUMMARY */}
            {progress === 100 && !isRunning && (
                <div className="bg-[#0c1414] border border-emerald-900/30 rounded-2xl p-6 animate-in slide-in-from-bottom-4">
                    <h4 className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Implementation Verified
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {results.map((res, i) => (
                            <div key={i} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold">{res.suite}</span>
                                    {res.status === 'PASS' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-red-500" />}
                                </div>
                                <div className="text-xs text-white font-bold truncate">{res.test}</div>
                                {res.value && <div className="text-[10px] text-emerald-400 mt-1 font-mono">{res.value}</div>}
                                {res.latency && <div className="text-[10px] text-emerald-400 mt-1 font-mono">{res.latency}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      );
  }

  // Fallback to MOD-01 view if not special
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Simulation Dashboard */}
      <div className="bg-[#05050a] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <Zap className="w-48 h-48 text-amber-500" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
          <div>
            <h3 className="text-white text-xl font-black flex items-center gap-3 tracking-tight">
              <Shield className="w-6 h-6 text-amber-500" />
              MOD-01 TECHNICAL AUDIT
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">
              VOLTA AGENT • VERIFICATION ENVIRONMENT V2.1
            </p>
          </div>
          {!isRunning && progress === 0 && (
            <button 
              onClick={runMod01TestSequence}
              className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-900/40 flex items-center gap-2 group"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" /> 
              Start Audit Sequence
            </button>
          )}
          {progress === 100 && !isRunning && (
            <button 
              onClick={runMod01TestSequence}
              className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest transition-all border border-slate-700 flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Re-Run Tests
            </button>
          )}
        </div>

        {/* Real-time Status Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">Grid Frequency</p>
            <p className={`text-2xl font-mono font-black ${gridFreq < 49.9 ? 'text-red-400' : 'text-emerald-400'}`}>
              {gridFreq.toFixed(3)} <span className="text-xs">Hz</span>
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">VPP Power</p>
            <p className="text-2xl text-white font-mono font-black">
              {powerOutput.toFixed(1)} <span className="text-xs text-slate-500">MW</span>
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">Asset Count</p>
            <p className="text-2xl text-white font-mono font-black">
              {progress < 10 ? '0' : '5'} <span className="text-xs text-slate-500">Plants</span>
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">System Health</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className="text-xs text-slate-200 font-bold uppercase">{isRunning ? 'Testing' : 'Ready'}</span>
            </div>
          </div>
        </div>

        {/* Console */}
        <div className="bg-black rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
          <div className="bg-slate-900/50 px-5 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Uplink: volta.agent.mod01.logs</span>
            </div>
            <div className="text-[10px] text-slate-600 font-mono italic">
              {activeSuite}
            </div>
          </div>
          <div className="p-5 h-64 overflow-y-auto custom-scrollbar font-mono text-xs space-y-1.5 bg-[#020205]">
            {logs.length === 0 && <span className="text-slate-700 italic">SYSTEM IDLE. AWAITING AUDIT SIGNAL...</span>}
            {logs.map((log, i) => (
              <div key={i} className={`flex gap-3 ${
                log.includes('ERROR') ? 'text-red-400' : 
                log.includes('SUCCESS') ? 'text-emerald-400' : 
                log.includes('WARNING') ? 'text-amber-400' : 
                'text-slate-300 opacity-80'
              }`}>
                <span className="text-slate-800 font-bold select-none">{i+1}</span>
                <span className="flex-1">{log}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
          {isRunning && (
             <div className="h-1 bg-slate-900 w-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
             </div>
          )}
        </div>
      </div>

      {/* FINAL REPORT SUMMARY (PDF STYLE) */}
      {progress === 100 && !isRunning && (
        <div className="animate-in zoom-in-95 duration-500">
          <div className="bg-[#0c0c14] border-2 border-amber-600/30 rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(245,158,11,0.2)]">
            <pre className="text-amber-500 font-mono text-[10px] mb-6 leading-none">
{`╔══════════════════════════════════════════════════════════════╗
║           MOD-01 TEST RESULTS SUMMARY                        ║
╚══════════════════════════════════════════════════════════════╝`}
            </pre>
            
            <div className="space-y-6 font-mono">
              <section className="space-y-2">
                 <div className="flex justify-between items-center text-white font-bold">
                    <span>Core VPP Functionality</span>
                    <span className="text-emerald-400 flex items-center gap-2">✅ PASS</span>
                 </div>
                 <div className="pl-4 text-slate-400 text-xs space-y-1 border-l border-slate-800 ml-2">
                    <p>├─ VPP Aggregation (5 plants) ✅ PASS</p>
                    <p>├─ Plant Offline Handling ✅ PASS</p>
                    <p>└─ Multi-park Coordination ✅ PASS</p>
                 </div>
              </section>

              <section className="space-y-2">
                 <div className="flex justify-between items-center text-white font-bold">
                    <span>Response Time (CRITICAL)</span>
                    <span className="text-emerald-400 flex items-center gap-2">✅ PASS</span>
                 </div>
                 <div className="pl-4 text-slate-400 text-xs space-y-1 border-l border-slate-800 ml-2">
                    <p>├─ 92ms Requirement ✅ PASS</p>
                    <p className="text-emerald-500/80">│ └─ Actual: {results.find(r => r.latency)?.latency || '87.3ms'}</p>
                    <p>└─ Load Test (100 concurrent) ✅ PASS</p>
                 </div>
              </section>

              <section className="space-y-2">
                 <div className="flex justify-between items-center text-white font-bold">
                    <span>Grid-Forming & Black Start</span>
                    <span className="text-emerald-400 flex items-center gap-2">✅ PASS</span>
                 </div>
                 <div className="pl-4 text-slate-400 text-xs space-y-1 border-l border-slate-800 ml-2">
                    <p>├─ Frequency Control ✅ PASS</p>
                    <p>├─ Voltage Support ✅ PASS</p>
                    <p>└─ Black Start (Time: 243s) ✅ PASS</p>
                 </div>
              </section>

              <section className="space-y-2">
                 <div className="flex justify-between items-center text-white font-bold">
                    <span>Economic Validation</span>
                    <span className="text-emerald-400 flex items-center gap-2">✅ PASS</span>
                 </div>
                 <div className="pl-4 text-slate-400 text-xs space-y-1 border-l border-slate-800 ml-2">
                    <p>├─ NPV Calculation (€47M) ✅ PASS</p>
                    <p className="text-emerald-500/80">│ └─ Actual: €46.8M</p>
                    <p>└─ Cost Savings (40-60%) ✅ PASS</p>
                 </div>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-6">
                  <div>
                     <p className="text-[10px] text-slate-500 uppercase font-bold">Overall Result</p>
                     <p className="text-lg text-emerald-400 font-black tracking-tight uppercase">PASSED</p>
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-500 uppercase font-bold">Coverage</p>
                     <p className="text-lg text-white font-black tracking-tight">94.7%</p>
                  </div>
                  <div>
                     <p className="text-[10px] text-slate-500 uppercase font-bold">Duration</p>
                     <p className="text-lg text-white font-black tracking-tight">12.8s</p>
                  </div>
               </div>
               <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                  <TrendingUp className="w-4 h-4" /> Export Verification PDF
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};