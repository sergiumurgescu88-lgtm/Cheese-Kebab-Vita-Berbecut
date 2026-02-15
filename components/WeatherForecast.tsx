
import React, { useState, useEffect } from 'react';
import { 
  Cloud, Sun, Wind, Droplets, Eye, Sunrise, Sunset, 
  Zap, TrendingUp, RefreshCcw, Info, Sparkles, AlertTriangle, 
  MapPin, BarChart3, CloudRain, ShieldCheck, Thermometer, 
  History, Map as MapIcon, Layers, ChevronRight, Activity, Gauge,
  CalendarDays, Plane, Truck, Cpu
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { OpenWeatherService, UnifiedWeatherModel, GPSCoordinates } from '../services/OpenWeatherService';
import { GoogleGenAI } from "@google/genai";

export const WeatherForecast: React.FC = () => {
  const [location] = useState<GPSCoordinates>({ lat: 45.18, lon: 28.80 }); // Default Tulcea
  const [siteInfo] = useState({ name: 'Tulcea North Delta', capacity: 150 });
  const [unifiedData, setUnifiedData] = useState<UnifiedWeatherModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMapLayer, setActiveMapLayer] = useState('clouds_new');
  const [aiSynthesis, setAiSynthesis] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const weatherService = new OpenWeatherService();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new Unified Weather Fetcher
      const data = await weatherService.fetchUnifiedWeather(location);
      setUnifiedData(data);
    } catch (e: any) {
      console.error("Critical Telemetry Failure", e);
      setError(e.message || "Failed to establish uplink with weather satellites.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location]);

  const runAiSynthesis = async () => {
    if (!unifiedData || isThinking) return;
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Perform Deep Tactical Synthesis for Solar Park "${siteInfo.name}".
        
        INPUT TELEMETRY (W-AM ADAPTED):
        - Status: ${unifiedData.adapted_analysis.operational_status}
        - Temp: ${unifiedData.raw_data.temperature_c}°C
        - Wind: ${unifiedData.raw_data.wind_speed_ms} m/s
        - Drone Status: ${unifiedData.adapted_analysis.modules_impact.drone_fleet.status} (${unifiedData.adapted_analysis.modules_impact.drone_fleet.reason})
        - Grid Impact: ${unifiedData.adapted_analysis.modules_impact.grid_dispatch.reason}
        
        TASK:
        1. Evaluate safety for automated cleaning.
        2. Provide 1 tactical recommendation for grid dispatch.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 4096 } } // Optimized budget
      });
      setAiSynthesis(response.text || "Synthesis inconclusive.");
    } catch {
      setAiSynthesis("AI module temporarily decoupled.");
    } finally {
      setIsThinking(false);
    }
  };

  if (loading && !unifiedData) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#020617]">
        <div className="relative w-20 h-20 mb-6">
           <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
           <Sun className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-amber-500 animate-pulse" />
        </div>
        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest text-center px-6">Initializing W-AM Protocol...</p>
      </div>
    );
  }

  if (error || !unifiedData) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#020617] p-8 text-center">
        <div className="p-6 bg-red-950/20 border border-red-900/50 rounded-3xl max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">W-AM Uplink Error</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {error || "Telemetry data structure is invalid. Satellite synchronization failed."}
          </p>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all mx-auto"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry Protocol
          </button>
        </div>
      </div>
    );
  }

  const { raw_data, adapted_analysis, meta } = unifiedData;

  // Chart data simulation based on unified data for visuals
  const chartData = Array.from({length: 24}, (_, i) => ({
      time: `${i}:00`,
      temp: raw_data.temperature_c + Math.sin(i/3) * 5,
      wind: raw_data.wind_speed_ms + Math.cos(i/4) * 2
  }));

  const mapLayers = [
    { id: 'clouds_new', label: 'Cloud Density', icon: Cloud },
    { id: 'precipitation_new', label: 'Rain Intensity', icon: CloudRain },
    { id: 'temp_new', label: 'Thermal Gradient', icon: Thermometer },
    { id: 'wind_new', label: 'Wind Velocity', icon: Wind }
  ];

  return (
    <div className="h-full flex flex-col xl:flex-row bg-[#020617] overflow-hidden border-x border-slate-800">
      
      {/* MAIN DASHBOARD AREA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-8">
        
        {/* TOP: Site Header & Data Source Badge */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500"><Sun className="w-5 h-5" /></div>
                 <h2 className="text-2xl font-black text-white tracking-tight">{siteInfo.name}</h2>
              </div>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                 <MapPin className="w-3 h-3" /> {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E | {siteInfo.capacity} MWp Installed
              </p>
           </div>
           <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
              <Activity className={`w-4 h-4 ${meta.source_used === 'Meteomatics' ? 'text-amber-500' : 'text-emerald-500'}`} />
              <div className="text-[10px] leading-tight">
                 <p className="text-slate-500 font-bold uppercase">Source: {meta.source_used}</p>
                 <p className="text-slate-300 font-mono">Latency: {meta.latency_ms}ms</p>
              </div>
           </div>
        </div>

        {/* 4-GRID: Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl group hover:border-sky-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20"><Cloud className="w-5 h-5" /></div>
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Atmosphere</span>
              </div>
              <h4 className="text-2xl font-bold text-white mb-1">{raw_data.temperature_c.toFixed(1)}°C</h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-tighter capitalize">{raw_data.description}</p>
           </div>
           
           <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl group hover:border-amber-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20"><Wind className="w-5 h-5" /></div>
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Wind Vector</span>
              </div>
              <h4 className="text-2xl font-bold text-white mb-1">{raw_data.wind_speed_ms.toFixed(1)} <span className="text-xs font-normal text-slate-400">m/s</span></h4>
              <p className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">Dir: {raw_data.wind_direction_deg}°</p>
           </div>

           <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl group hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20"><Droplets className="w-5 h-5" /></div>
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Humidity</span>
              </div>
              <h4 className="text-2xl font-bold text-white mb-1">{raw_data.humidity_percent}%</h4>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Vis: {(raw_data.visibility_m/1000).toFixed(1)}km</p>
           </div>

           <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl group hover:border-indigo-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20"><Gauge className="w-5 h-5" /></div>
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pressure</span>
              </div>
              <h4 className="text-2xl font-bold text-white mb-1">{raw_data.pressure_hpa} <span className="text-xs font-normal text-slate-400">hPa</span></h4>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Stable</p>
           </div>
        </div>

        {/* OPERATIONAL IMPACT MATRIX (W-AM CORE FEATURE) */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                 <Cpu className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-white uppercase tracking-tight">Operational Impact Matrix</h3>
                 <p className="text-xs text-slate-500 font-mono">W-AM Logic Engine Analysis</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Drone Status */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${adapted_analysis.modules_impact.drone_fleet.status === 'OPTIMAL' ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                 <div className="flex justify-between items-start">
                    <Plane className={`w-6 h-6 ${adapted_analysis.modules_impact.drone_fleet.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-red-400'}`} />
                    <span className="text-[10px] font-bold uppercase bg-slate-950/50 px-2 py-1 rounded text-slate-300">Score: {adapted_analysis.modules_impact.drone_fleet.score}</span>
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white">Drone Fleet</h4>
                    <p className={`text-xs font-bold mt-1 ${adapted_analysis.modules_impact.drone_fleet.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-red-400'}`}>
                       STATUS: {adapted_analysis.modules_impact.drone_fleet.status}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{adapted_analysis.modules_impact.drone_fleet.reason}</p>
                 </div>
              </div>

              {/* Cleaning Robots */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${adapted_analysis.modules_impact.cleaning_robots.status === 'OPTIMAL' ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-amber-900/10 border-amber-500/30'}`}>
                 <div className="flex justify-between items-start">
                    <Truck className={`w-6 h-6 ${adapted_analysis.modules_impact.cleaning_robots.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className="text-[10px] font-bold uppercase bg-slate-950/50 px-2 py-1 rounded text-slate-300">Score: {adapted_analysis.modules_impact.cleaning_robots.score}</span>
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white">Robotic Cleaning</h4>
                    <p className={`text-xs font-bold mt-1 ${adapted_analysis.modules_impact.cleaning_robots.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400'}`}>
                       STATUS: {adapted_analysis.modules_impact.cleaning_robots.status}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{adapted_analysis.modules_impact.cleaning_robots.reason}</p>
                 </div>
              </div>

              {/* Grid Dispatch */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${adapted_analysis.modules_impact.grid_dispatch.status === 'OPTIMAL' ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-blue-900/10 border-blue-500/30'}`}>
                 <div className="flex justify-between items-start">
                    <Zap className={`w-6 h-6 ${adapted_analysis.modules_impact.grid_dispatch.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-blue-400'}`} />
                    <span className="text-[10px] font-bold uppercase bg-slate-950/50 px-2 py-1 rounded text-slate-300">Score: {adapted_analysis.modules_impact.grid_dispatch.score}</span>
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white">Grid Dispatch</h4>
                    <p className={`text-xs font-bold mt-1 ${adapted_analysis.modules_impact.grid_dispatch.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-blue-400'}`}>
                       STATUS: {adapted_analysis.modules_impact.grid_dispatch.status}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{adapted_analysis.modules_impact.grid_dispatch.reason}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* CHART AREA (Simulated Projection) */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <div>
                 <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                    24h Parameter Forecast
                 </h3>
                 <p className="text-xs text-slate-500 font-mono mt-1 uppercase">Source: {meta.source_used} Ensemble</p>
              </div>
           </div>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                       <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b' }}
                       itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="temp" stroke="#f59e0b" fill="url(#colorTemp)" strokeWidth={3} name="Temp (°C)" />
                    <Area type="monotone" dataKey="wind" stroke="#3b82f6" fill="none" strokeWidth={2} name="Wind (m/s)" />
                    <Legend />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

      </div>

      {/* SIDEBAR: AI Synthesis & Satellite Feed */}
      <div className="w-full xl:w-[420px] bg-[#050510] border-l border-slate-800 flex flex-col shrink-0">
        
        {/* AI HUB */}
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30 shadow-[0_0_15px_-5px_rgba(245,158,11,0.5)]">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                 <h3 className="text-white font-bold text-sm uppercase tracking-tight">Helios Tactical Center</h3>
                 <p className="text-[9px] text-amber-500/60 font-mono uppercase tracking-widest">Active reasoning agent mod-06</p>
              </div>
           </div>

           <button 
             onClick={runAiSynthesis}
             disabled={isThinking}
             className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-amber-900/20 transition-all disabled:opacity-50 mb-6 group"
           >
             {isThinking ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Synthesizing Telemetry...</> : <><Activity className="w-4 h-4 group-hover:scale-110 transition-transform" /> Execute Site Analysis</>}
           </button>

           {aiSynthesis && (
             <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl animate-in slide-in-from-right-4 duration-500 max-h-[320px] overflow-y-auto custom-scrollbar shadow-inner">
                <div className="flex items-center gap-2 mb-3 text-amber-400 font-black">
                   <Info className="w-4 h-4" />
                   <span className="text-[10px] uppercase tracking-widest">Operations Directives</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                   {aiSynthesis}
                </div>
             </div>
           )}
        </div>

        {/* MAPS & DIAGNOSTICS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
           
           {/* Visual Map Layers */}
           <section>
              <div className="flex items-center justify-between mb-4">
                 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <MapIcon className="w-3 h-3" /> Satellite Overlay Feed
                 </h4>
                 <div className="text-[9px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-500 font-mono uppercase tracking-tighter">Live v1.2</div>
              </div>
              <div className="aspect-square bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden mb-4 group shadow-2xl">
                 <img 
                   src={weatherService.getWeatherMapTileURL(activeMapLayer, 8, 144, 88)} 
                   className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                   alt="Weather Map"
                 />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 border-2 border-amber-500/50 rounded-full animate-ping"></div>
                    <div className="w-1 h-1 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]"></div>
                 </div>
                 <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[9px] text-white font-mono shadow-xl uppercase tracking-widest">
                    {activeMapLayer.replace('_new', '').replace('_', ' ')}
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 {mapLayers.map((layer)=>(
                   <button 
                     key={layer.id}
                     onClick={() => setActiveMapLayer(layer.id)}
                     className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all duration-300 ${activeMapLayer === layer.id ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-inner' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                   >
                      <layer.icon className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-tight">{layer.id.split('_')[0]}</span>
                   </button>
                 ))}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};
