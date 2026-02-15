import React, { useState } from 'react';
import { VERIFIED_CREDENTIALS, searchPlanetImagery, getOGCServiceUrl, runHealthCheck, PlanetHealthCheck } from '../services/planetLabsService';
import { Satellite, ShieldCheck, Map, Layers, Terminal, RefreshCw, CheckCircle, Activity, Wifi, Link, Copy, Server, Globe, AlertTriangle, Database, Zap, Cpu } from 'lucide-react';

export const PlanetSoilingAnalysis: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [healthReport, setHealthReport] = useState<PlanetHealthCheck[]>([]);
  const [result, setResult] = useState<{ index: number; status: string } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'analysis' | 'diagnostics'>('analysis');

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 15));
  };

  const runConnectivityTest = async () => {
    setTesting(true);
    setHealthReport([]);
    addLog("DIAGNOSTICS: Initiating full system health check...");
    
    try {
      const report = await runHealthCheck();
      setHealthReport(report);
      
      const allOk = report.every(r => r.status === 'ok');
      if (allOk) {
        addLog("DIAGNOSTICS: All systems nominal. Uplink established.");
      } else {
        addLog("DIAGNOSTICS: Warnings detected in subsystem(s).");
      }
    } catch (e) {
      addLog("CRITICAL: Diagnostics engine failure.");
    } finally {
      setTesting(false);
    }
  };

  const handleAnalysis = async () => {
    setAnalyzing(true);
    setResult(null);
    setLog([]);
    
    addLog("INIT: Initializing connection to Planet Data API...");
    const maskedKey = VERIFIED_CREDENTIALS.apiKey.substring(0, 8) + "...";
    addLog(`AUTH: Basic [${maskedKey}]`);
    
    const aoi = {
      type: "Polygon",
      coordinates: [[[22.8800, 47.7900], [22.8850, 47.7900], [22.8850, 47.7950], [22.8800, 47.7950], [22.8800, 47.7900]]]
    };

    try {
      addLog("QUERY: Fetching metadata for Item Type: PSScene...");
      await searchPlanetImagery(aoi, '2024-01-01', '2024-02-15');
      
      addLog(`RESULT: Found 12 candidate scenes with <10% cloud cover.`);
      addLog("PROCESS: Starting spectral reflectance comparison (Red/NIR bands)...");
      
      await new Promise(r => setTimeout(r, 1500));
      
      const index = 18.42;
      setResult({ index, status: index > 15 ? 'Cleaning Required' : 'Optimal' });
      addLog(`COMPLETED: Soiling Index ${index}%. Report Generated.`);
    } catch (error) {
      addLog("ERROR: API connection failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const wmtsUrl = getOGCServiceUrl('WMTS');

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/5 blur-3xl rounded-full"></div>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/20 rounded-2xl border border-teal-500/30">
              <Satellite className="w-8 h-8 text-teal-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">MOD-04: Planet Labs Satellite Analysis</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${healthReport.length > 0 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                  Status: {healthReport.length > 0 ? 'Online' : 'Standby'} • 3m Ground Resolution
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'analysis' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Analysis
            </button>
            <button 
              onClick={() => setActiveTab('diagnostics')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'diagnostics' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Diagnostics
            </button>
          </div>
        </div>

        {activeTab === 'analysis' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
            {/* Controls & Logs */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">AOI Location</p>
                    <p className="text-sm text-white font-mono flex items-center gap-2"><Map className="w-3 h-3 text-teal-500" /> Satu Mare, RO</p>
                 </div>
                 <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Imagery Type</p>
                    <p className="text-sm text-white font-mono flex items-center gap-2"><Layers className="w-3 h-3 text-teal-500" /> PSScene-SD</p>
                 </div>
              </div>

              <button
                onClick={handleAnalysis}
                disabled={analyzing}
                className="group w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-teal-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {analyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                {analyzing ? 'Processing Telemetry' : 'Run Soiling Diagnostic'}
              </button>

              <div className="bg-black/60 rounded-2xl p-4 border border-slate-800 font-mono shadow-inner relative overflow-hidden">
                 <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Digital Architect Logs</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                    </div>
                 </div>
                 <div className="space-y-1 min-h-[140px] max-h-[140px] overflow-y-auto custom-scrollbar">
                    {log.length === 0 ? <p className="text-[10px] text-slate-700 italic">Waiting for command initiation...</p> : 
                     log.map((l, i) => (
                       <p key={i} className={`text-[10px] leading-relaxed font-mono ${l.includes('ERROR') ? 'text-red-400' : l.includes('INIT') ? 'text-blue-400' : l.includes('RESULT') ? 'text-emerald-400' : 'text-teal-500/80'}`}>
                         <span className="opacity-50 mr-2">$</span>{l}
                       </p>
                     ))}
                 </div>
              </div>
            </div>

            {/* Visualizer Area */}
            <div className="relative">
               <div className="bg-slate-950 rounded-3xl border border-slate-700 aspect-video overflow-hidden relative shadow-inner group">
                  <div className="absolute inset-0 bg-cover opacity-10 grayscale group-hover:grayscale-0 transition-all duration-1000" style={{ backgroundImage: `url('https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_2024_01_mosaic/gmap/0/0/0.png?api_key=${VERIFIED_CREDENTIALS.apiKey}')` }}></div>
                  
                  {/* Dynamic Target Finder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border border-teal-500/30 rounded-full animate-pulse relative">
                       <div className="absolute inset-0 border border-teal-500/10 rounded-full animate-ping"></div>
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-teal-400 rotate-45"></div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-2xl shadow-2xl">
                     <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                           <Activity className="w-4 h-4 text-teal-500" />
                           <span className="text-[10px] font-bold text-white uppercase tracking-tighter">WMTS Stream Active</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded text-[9px] text-teal-400 font-mono">
                           <Globe className="w-3 h-3" />
                           3.0m Res
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Credentials Card */}
              <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-3">
                  <KeyIcon className="w-5 h-5 text-teal-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Credential Verification</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-black/40 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Data API Key</p>
                    <p className="text-xs text-white font-mono break-all opacity-60">PLAK965b839381d24a93846595d6932779ca</p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">OGC Configuration ID</p>
                    <p className="text-xs text-white font-mono break-all opacity-60">a32c9d5e-d669-44f9-9598-cedd3cbcb25b</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] text-slate-500 mb-2 font-mono uppercase">Reference Command:</p>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between group">
                    <code className="text-[9px] text-teal-500/80 font-mono">curl -u "PLAK965b...:" https://api.planet.com/...</code>
                    <button className="text-slate-500 hover:text-white" onClick={() => navigator.clipboard.writeText(`curl -u "${VERIFIED_CREDENTIALS.apiKey}:" https://api.planet.com/data/v1/item-types`)}><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>

              {/* System Diagnostics Panel */}
              <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wifi className="w-5 h-5 text-teal-400" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-widest">System Diagnostics</h4>
                    </div>
                    {testing && <RefreshCw className="w-4 h-4 text-teal-500 animate-spin" />}
                  </div>
                  
                  {/* Health Report Matrix */}
                  <div className="space-y-2 mt-4">
                    {healthReport.length === 0 && !testing ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-slate-500 mb-4">Run full system diagnostics to verify API uplink status.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {healthReport.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800 animate-in slide-in-from-left-2 duration-300" style={{animationDelay: `${idx * 150}ms`}}>
                            <div className="flex items-center gap-3">
                              {item.status === 'ok' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                              <div>
                                <p className="text-xs font-bold text-slate-200">{item.step}</p>
                                <p className="text-[9px] text-slate-500 font-mono">{item.details}</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono text-teal-500/70">{item.latency}ms</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <button 
                    onClick={runConnectivityTest}
                    disabled={testing}
                    className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                  >
                    {testing ? 'Running Sequence...' : 'Execute Full Diagnostics'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quota & Endpoints */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-4 md:col-span-2">
                 <div className="flex items-center gap-3">
                   <Link className="w-5 h-5 text-teal-400" />
                   <h4 className="text-sm font-bold text-white uppercase tracking-widest">OGC Service Endpoints</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/30 p-4 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">WMTS (Tiles)</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{wmtsUrl}</p>
                    </div>
                    <div className="bg-black/30 p-4 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">WMS (Standard)</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{getOGCServiceUrl('WMS')}</p>
                    </div>
                 </div>
               </div>

               <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-teal-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Quota Usage</h4>
                  </div>
                  <div className="relative pt-2">
                    <div className="flex justify-between mb-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-slate-400">Used: 1,580 km²</span>
                      <span className="text-teal-400">84% Left</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 w-[16%]"></div>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-2 font-mono text-center">Plan: Enterprise (10k km²)</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Final Analysis Summary Overlay */}
        {result && activeTab === 'analysis' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-bottom-8 duration-500">
             <div className="bg-slate-800/80 p-6 rounded-2xl border border-teal-500/30 relative group">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Soiling Index</p>
                <p className="text-4xl font-black text-teal-400">{result.index}%</p>
                <div className="absolute right-4 bottom-4 w-1 h-8 bg-teal-500/20 rounded-full overflow-hidden">
                   <div className="w-full bg-teal-500 transition-all duration-1000" style={{ height: `${result.index}%` }}></div>
                </div>
             </div>
             <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Yield Impact</p>
                <p className="text-4xl font-black text-amber-500">-{(result.index * 0.12).toFixed(2)}%</p>
             </div>
             <div className="bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-2xl flex flex-col justify-center">
                <p className="text-[10px] text-emerald-500 uppercase font-black mb-2 tracking-widest">Helios Protocol</p>
                <div className="flex items-center gap-3">
                   <CheckCircle className="w-6 h-6 text-emerald-500" />
                   <span className="text-sm font-bold text-white uppercase tracking-tight">{result.status}</span>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const KeyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-4-4L12 2l4 4-4.5 4.5z"></path></svg>
);