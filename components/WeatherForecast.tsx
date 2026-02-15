
import React, { useState, useEffect } from 'react';
import { 
  Cloud, Sun, Wind, Droplets, Eye, Sunrise, Sunset, 
  Zap, TrendingUp, RefreshCcw, Info, Sparkles, AlertTriangle, 
  MapPin, Calendar, Clock, BarChart3, ChevronRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCurrentWeather, getHourlyForecast, ForecastItem } from '../services/weatherService';
import { GoogleGenAI } from "@google/genai";

export const WeatherForecast: React.FC = () => {
  const [location] = useState({
    lat: 45.18, // Tulcea
    lon: 28.80,
    name: 'Tulcea Solar Park'
  });

  const [current, setCurrent] = useState<ForecastItem | null>(null);
  const [hourly, setHourly] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentData = await getCurrentWeather(location.lat, location.lon);
      const hourlyData = await getHourlyForecast(location.lat, location.lon);
      setCurrent(currentData);
      setHourly(hourlyData);
    } catch (err: any) {
      setError(err.message === 'Failed to fetch' ? 'API Key invalid or missing in .env.local' : 'Error loading weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000); // 10 min refresh
    return () => clearInterval(interval);
  }, []);

  const runAiAnalysis = async () => {
    if (!current || isAnalyzing) return;
    setIsAnalyzing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        As Helios AI Architect, analyze the following weather and solar metrics for our 100MW Tulcea Park and provide 3-4 bullet point operational recommendations:
        Current: ${current.temp}°C, ${current.description}, Clouds: ${current.clouds}%, Wind: ${current.wind_speed}m/s.
        Solar Metrics: GHI ${current.ghi}W/m², DNI ${current.dni}W/m², Expected Power: ${current.expectedPower}kW, Efficiency: ${current.efficiency}%.
        Format as concise maintenance or grid strategy advice.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setAiAnalysis(response.text || "No analysis available.");
    } catch (err) {
      setAiAnalysis("Could not connect to AI services. Check API key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading && !current) {
    return (
      <div className="h-full flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono uppercase tracking-widest text-xs">Syncing MOD-06 Satellite Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#020617] p-8">
        <div className="max-w-md w-full bg-red-950/20 border border-red-900/50 p-8 rounded-3xl text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-2">Integration Offline</h2>
          <p className="text-red-400 text-sm mb-6">{error}</p>
          <div className="bg-slate-900/50 p-4 rounded-xl text-left mb-6 font-mono text-[10px] text-slate-500">
            <p>1. Check .env.local for VITE_OPENWEATHER_API_KEY</p>
            <p>2. Ensure API Key has permissions for 2.5 API</p>
            <p>3. Verify internet connectivity</p>
          </div>
          <button onClick={fetchData} className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const chartData = hourly.slice(0, 24).map(item => ({
    time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    power: item.expectedPower,
    ghi: item.ghi
  }));

  return (
    <div className="h-full flex flex-col xl:flex-row gap-6 animate-in fade-in duration-500 bg-[#020617] overflow-hidden">
      
      {/* LEFT COLUMN: Data Dashboard */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
                <Sun className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Current GHI</span>
            </div>
            <h4 className="text-2xl font-bold text-white mb-1">{current?.ghi} <span className="text-xs font-normal text-slate-500">W/m²</span></h4>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Premium Irradiance</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-500">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Power Predict</span>
            </div>
            <h4 className="text-2xl font-bold text-white mb-1">{((current?.expectedPower ?? 0) / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-500">MW</span></h4>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Active Forecast</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-500">
                <Cloud className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Condition</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-1 capitalize truncate">{current?.description}</h4>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Clouds: {current?.clouds}%</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Efficiency</span>
            </div>
            <h4 className="text-2xl font-bold text-white mb-1">{current?.efficiency}%</h4>
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest">Temp Adj: Optimal</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col min-h-[450px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">24-Hour Production Forecast</h3>
              </div>
              <p className="text-xs text-slate-500 font-mono">SITE: {location.name} | LAT: {location.lat} LON: {location.lon}</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
               <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
               <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Live Prediction Engine</span>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}MW`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="power" stroke="#f59e0b" fill="url(#colorPower)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5-Day Forecast Grid */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Hourly Operations Roadmap</h3>
              <button onClick={fetchData} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                <RefreshCcw className="w-4 h-4" />
              </button>
           </div>
           <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar custom-scrollbar">
              {hourly.slice(0, 15).map((item, idx) => (
                <div key={idx} className="min-w-[140px] bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center hover:border-amber-500/30 transition-colors cursor-pointer group">
                  <span className="text-[10px] text-slate-500 font-mono mb-2">
                    {new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <img src={`https://openweathermap.org/img/wn/${item.icon}@2x.png`} alt="icon" className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-white mb-1">{Math.round(item.temp)}°C</span>
                  <span className="text-[9px] text-slate-500 uppercase font-bold text-center leading-tight mb-2 truncate w-full">{item.description}</span>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-auto overflow-hidden">
                     <div className="h-full bg-amber-500" style={{width: `${(item.ghi / 1000) * 100}%`}}></div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* RIGHT COLUMN: AI Agent Panel (MOD-06 Intelligence) */}
      <div className="w-full xl:w-96 bg-[#050510] border-l border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Helios Intelligence</h3>
                <p className="text-[10px] text-amber-500/70 font-mono uppercase tracking-widest">MOD-06 Active Agent</p>
              </div>
           </div>

           <div className="space-y-4">
              <button 
                onClick={runAiAnalysis}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Operations Advice
                  </>
                )}
              </button>

              {aiAnalysis && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl animate-in slide-in-from-right-4 duration-500 shadow-inner">
                  <div className="flex items-center gap-2 mb-3 text-amber-500">
                     <Info className="w-4 h-4" />
                     <span className="text-[10px] font-bold uppercase tracking-widest">Helios Protocol Recommendation</span>
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-line font-medium italic">
                    {aiAnalysis}
                  </div>
                </div>
              )}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
           <section>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Environment Diagnostics</h4>
              <div className="space-y-3">
                 {[
                   { label: 'Cloud Coverage', value: `${current?.clouds}%`, icon: Cloud, color: 'text-sky-400' },
                   { label: 'Wind Velocity', value: `${current?.wind_speed} m/s`, icon: Wind, color: 'text-emerald-400' },
                   { label: 'Atmos. Humidity', value: `${current?.humidity}%`, icon: Droplets, color: 'text-indigo-400' },
                   { label: 'Optical Visibility', value: `${(current?.visibility ?? 0) / 1000} km`, icon: Eye, color: 'text-slate-400' },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-xl group hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-3">
                         <item.icon className={`w-4 h-4 ${item.color}`} />
                         <span className="text-xs text-slate-400">{item.label}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">{item.value}</span>
                   </div>
                 ))}
              </div>
           </section>

           <section>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Celestial Tracking</h4>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center">
                    <Sunrise className="w-5 h-5 text-amber-500 mb-2" />
                    <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Sunrise</span>
                    <span className="text-xs font-mono text-white">
                      {current ? new Date(current.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                 </div>
                 <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center">
                    <Sunset className="w-5 h-5 text-orange-500 mb-2" />
                    <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Sunset</span>
                    <span className="text-xs font-mono text-white">
                      {current ? new Date(current.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                 </div>
              </div>
           </section>

           <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-500" />
              <div>
                 <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest leading-none">Sensor Coordinates</p>
                 <p className="text-[10px] text-slate-200 font-mono mt-1">{location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
