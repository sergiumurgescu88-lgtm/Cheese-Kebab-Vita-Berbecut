
import React, { useState, useEffect, useMemo } from 'react';
import { fetchOneCall, estimateSolarIrradiance } from '../../services/realWeatherService';
import { 
  Zap, Activity, TrendingUp, Shield, BarChart3, Radio, 
  Wifi, Power, AlertCircle, CheckCircle2, Server, 
  Network, Cpu, Play, Square, RefreshCcw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine, ComposedChart, Line
} from 'recharts';

interface VPPNode {
  id: string;
  name: string;
  capacity: number;
  status: 'online' | 'offline' | 'stabilizing';
  region: 'RO' | 'US';
  load: number;
}

export const MOD01_VPP: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<any[]>([]);
  const [nodes, setNodes] = useState<VPPNode[]>([
    { id: 'ro-1', name: 'Ucea South', capacity: 58, status: 'online', region: 'RO', load: 42 },
    { id: 'ro-2', name: 'Rătești Main', capacity: 42, status: 'online', region: 'RO', load: 31 },
    { id: 'us-1', name: 'Nevada Solar 1', capacity: 250, status: 'online', region: 'US', load: 180 },
    { id: 'us-2', name: 'Arizona Peak', capacity: 150, status: 'online', region: 'US', load: 90 },
  ]);

  // Simulation States
  const [isSimulatingEvent, setIsSimulatingEvent] = useState(false);
  const [gridFrequency, setGridFrequency] = useState(50.00);
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'warn' | 'success'}[]>([]);

  const addLog = (msg: string, type: 'info' | 'warn' | 'success' = 'info') => {
    setLogs(prev => [{ msg, type }, ...prev].slice(0, 5));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const weather = await fetchOneCall(44.4268, 26.1025);
        const data = weather.hourly.slice(0, 24).map((h: any) => {
          const solar = estimateSolarIrradiance(44.42, 26.10, h.clouds, h.uvi, h.dt);
          return {
            time: new Date(h.dt * 1000).getHours() + ':00',
            ghi: solar.ghi,
            available: (solar.ghi / 1000) * 3200, // 3.2GW base
            dispatch: (solar.ghi / 1000) * 3200 * 0.92 // VPP optimized dispatch
          };
        });
        setForecast(data);
        addLog("Satellite telemetry synchronized with VPP dispatch hub.", "success");
      } catch (e) {
        addLog("Telemetry uplink failed. Reverting to backup LEO.", "warn");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Total MW Calculation
  const totalMW = useMemo(() => {
    return nodes.reduce((acc, n) => n.status === 'online' ? acc + n.load : acc, 0);
  }, [nodes]);

  // --- INTERACTIVE TESTS ---

  const triggerNodeFailure = () => {
    setIsSimulatingEvent(true);
    setActiveEvent('NODE_OUTAGE');
    addLog("CRITICAL: Node US-1 reported sudden disconnection.", "warn");
    
    setNodes(prev => prev.map(n => n.id === 'us-1' ? { ...n, status: 'offline' } : n));
    
    setTimeout(() => {
      addLog("VPP_ORCH: Balancing load to RO-1 and US-2. Latency: 89ms", "info");
      setNodes(prev => prev.map(n => n.id !== 'us-1' && n.status === 'online' ? { ...n, load: n.load * 1.25 } : n));
      addLog("Grid stabilized. Capacity loss mitigated via dynamic re-routing.", "success");
      setIsSimulatingEvent(false);
    }, 2000);
  };

  const triggerFrequencyEvent = () => {
    setIsSimulatingEvent(true);
    setActiveEvent('FREQ_DROOP');
    addLog("GRID_SENSE: Frequency dip detected (49.82 Hz)", "warn");
    
    let currentF = 50.00;
    const interval = setInterval(() => {
      currentF -= 0.05;
      setGridFrequency(currentF);
      if (currentF <= 49.80) {
        clearInterval(interval);
        addLog("VOLTA_PPC: Injecting synthetic inertia. Active power boost +15%", "info");
        setTimeout(() => {
          setGridFrequency(50.00);
          addLog("Frequency recovery successful (50.01 Hz)", "success");
          setIsSimulatingEvent(false);
          setActiveEvent(null);
        }, 1500);
      }
    }, 100);
  };

  const runBlackStart = () => {
    setLoading(true);
    addLog("SYSTEM: Initiating Black Start Sequence.", "info");
    setNodes(nodes.map(n => ({ ...n, status: 'offline', load: 0 })));
    
    setTimeout(() => {
      addLog("SEQ: Back-feeding RO cluster internal bus...", "info");
      setNodes(prev => prev.map(n => n.region === 'RO' ? { ...n, status: 'online', load: n.capacity * 0.1 } : n));
      setTimeout(() => {
        addLog("SEQ: Synchronizing 110kV US tie-lines...", "info");
        setNodes(prev => prev.map(n => ({ ...n, status: 'online', load: n.capacity * 0.8 })));
        setLoading(false);
        addLog("VPP: Full portfolio synchronized. Grid-forming active.", "success");
      }, 2000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-mono">
      {/* VPP CONTROL DECK */}
      <div className="bg-[#020617] border border-amber-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Cpu className="w-64 h-64 text-amber-500" />
        </div>
        
        <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                <Shield className="w-7 h-7 text-amber-500" />
                VPP MASTER ORCHESTRATOR
              </h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
                Protocol: OpenADR 2.0b | Response Target: 0.092s
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Grid Frequency</p>
                <div className="flex items-end gap-2">
                  <span className={`text-2xl font-black ${Math.abs(gridFrequency - 50) > 0.05 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                    {gridFrequency.toFixed(2)} Hz
                  </span>
                  <Activity className="w-4 h-4 text-slate-600 mb-1" />
                </div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Real-time Dispatch</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white">
                    {totalMW.toLocaleString()} <span className="text-xs">MW</span>
                  </span>
                  <Zap className="w-4 h-4 text-amber-500 mb-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Test Buttons Panel */}
          <div className="flex flex-col gap-2 min-w-[240px]">
            <p className="text-[10px] text-slate-600 font-bold uppercase mb-2">Technical Audit Subsystems</p>
            <button 
              onClick={triggerNodeFailure}
              disabled={isSimulatingEvent || loading}
              className="group bg-slate-900 hover:bg-red-950/30 border border-slate-800 hover:border-red-500/50 p-3 rounded-xl flex items-center justify-between transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20">
                  <Network className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-xs font-bold text-slate-300">Node Failure Test</span>
              </div>
              <Play className="w-3 h-3 text-slate-600" />
            </button>
            
            <button 
              onClick={triggerFrequencyEvent}
              disabled={isSimulatingEvent || loading}
              className="group bg-slate-900 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/50 p-3 rounded-xl flex items-center justify-between transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20">
                  <Activity className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs font-bold text-slate-300">Frequency Drop</span>
              </div>
              <Play className="w-3 h-3 text-slate-600" />
            </button>

            <button 
              onClick={runBlackStart}
              disabled={isSimulatingEvent || loading}
              className="group bg-slate-900 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/50 p-3 rounded-xl flex items-center justify-between transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20">
                  <RefreshCcw className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-xs font-bold text-slate-300">Black Start Drill</span>
              </div>
              <Play className="w-3 h-3 text-slate-600" />
            </button>
          </div>
        </div>

        {/* LOGS OVERLAY */}
        <div className="mt-6 bg-black/40 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <Radio className="w-3 h-3" /> Event Command Logs
          </div>
          <div className="space-y-1.5 h-24 overflow-y-auto custom-scrollbar">
            {logs.length === 0 ? <p className="text-slate-700 text-xs italic">Awaiting telemetry signal...</p> : 
              logs.map((log, i) => (
                <div key={i} className={`text-xs flex gap-2 animate-in slide-in-from-left-2 ${
                  log.type === 'warn' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  <span className="opacity-50">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                  <span className="font-bold">{log.msg}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* TOPOLOGY & PERFORMANCE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TOPOLOGY VIEW */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <Network className="w-4 h-4 text-amber-500" /> Virtual Topology
          </h3>
          <div className="space-y-4 flex-1">
            {nodes.map(node => (
              <div key={node.id} className={`p-4 rounded-2xl border transition-all ${
                node.status === 'online' ? 'bg-slate-950 border-slate-800' : 'bg-red-950/10 border-red-900/50 opacity-60'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs font-bold text-white">{node.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{node.region} Cluster | {node.capacity}MW</p>
                  </div>
                  {node.status === 'online' ? 
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                    <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                  }
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${node.status === 'online' ? 'bg-amber-500' : 'bg-red-500'}`} 
                    style={{ width: `${(node.load / node.capacity) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-[9px] font-mono text-slate-500 uppercase">
                  <span>Usage: {node.load.toFixed(1)} MW</span>
                  <span>{node.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PERFORMANCE CHART */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 h-[450px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Global Dispatch Efficiency</h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase">24H Virtual Plant Simulation</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> <span className="text-[10px] text-slate-400">VPP Dispatch</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-slate-700 rounded-full"></div> <span className="text-[10px] text-slate-400">Available</span></div>
            </div>
          </div>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} interval={4} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="available" 
                  fill="#1e293b" 
                  stroke="#334155" 
                  fillOpacity={0.5} 
                  name="GHI Potential" 
                />
                <Area 
                  type="monotone" 
                  dataKey="dispatch" 
                  fill="url(#colorVpp)" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  name="VPP Dynamic Dispatch" 
                />
                <ReferenceLine y={totalMW} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Live Output', position: 'right', fill: '#f43f5e', fontSize: 10 }} />
                <defs>
                  <linearGradient id="colorVpp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
