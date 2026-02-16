
import React, { useEffect, useState } from 'react';
import { fetchOneCall, estimateSolarIrradiance } from '../../services/realWeatherService';
import { Cloud, Sun, Wind, Gauge, RefreshCcw, BarChart3, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const MOD06_Weather: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useState({ lat: 44.4268, lon: 26.1025 });

  const loadData = async () => {
    setLoading(true);
    try {
      const weather = await fetchOneCall(location.lat, location.lon);
      
      // If hourly is empty (Tier 3 fallback), generate a simple curve for current day
      let forecastList = weather.hourly;
      if (!forecastList || forecastList.length === 0) {
        forecastList = Array.from({ length: 24 }, (_, i) => {
          const now = new Date();
          now.setHours(i, 0, 0, 0);
          return {
            dt: Math.floor(now.getTime() / 1000),
            temp: weather.current.temp,
            clouds: weather.current.clouds,
            uvi: weather.current.uvi
          };
        });
      }

      const history = forecastList.slice(0, 48).map((h: any) => ({
        time: new Date(h.dt * 1000).getHours() + ':00',
        displayTime: new Date(h.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp: h.temp,
        ...estimateSolarIrradiance(location.lat, location.lon, h.clouds, h.uvi, h.dt)
      }));
      
      setData({ 
        current: weather.current, 
        forecast: history,
        source: weather.source || 'OpenWeather 3.0'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center text-amber-500 animate-pulse bg-slate-900/20 rounded-3xl border border-slate-800">
      <RefreshCcw className="w-8 h-8 animate-spin mb-4" />
      <p className="text-xs uppercase tracking-widest font-mono">Synchronizing Hyperlocal Satellite Ensemble...</p>
    </div>
  );

  if (!data) return <div className="p-10 text-center text-red-500">Telemetry Lost. Check Antenna.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
          <Info className="w-3 h-3" />
          Data Stream: {data.source}
        </div>
        <button onClick={loadData} className="p-1.5 text-slate-500 hover:text-white transition-colors">
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 group hover:border-amber-500/30 transition-all">
           <Sun className="w-5 h-5 text-amber-500 mb-2" />
           <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">GHI Current</p>
           <h4 className="text-2xl font-black text-white">{data.forecast[0]?.ghi || 0} <span className="text-xs text-slate-500 font-normal">W/m²</span></h4>
        </div>
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 group hover:border-blue-500/30 transition-all">
           <Wind className="w-5 h-5 text-blue-500 mb-2" />
           <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Wind Speed</p>
           <h4 className="text-2xl font-black text-white">{data.current.wind_speed} <span className="text-xs text-slate-500 font-normal">m/s</span></h4>
        </div>
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 group hover:border-slate-500/30 transition-all">
           <Cloud className="w-5 h-5 text-slate-400 mb-2" />
           <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Cloud Cover</p>
           <h4 className="text-2xl font-black text-white">{data.current.clouds}%</h4>
        </div>
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 group hover:border-emerald-500/30 transition-all">
           <Gauge className="w-5 h-5 text-emerald-500 mb-2" />
           <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">UV Index</p>
           <h4 className="text-2xl font-black text-white">{data.current.uvi || 'N/A'}</h4>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl h-[400px] shadow-2xl">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-white font-bold flex items-center gap-2 tracking-tight">
             <BarChart3 className="w-5 h-5 text-amber-500" />
             Irradiance Vector Forecast (DNI/GHI/DHI)
           </h3>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={data.forecast}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="displayTime" stroke="#475569" fontSize={10} interval={data.source.includes('Forecast') ? 2 : 4} />
            <YAxis stroke="#475569" fontSize={10} />
            <Tooltip 
              contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px'}} 
              labelStyle={{color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px'}}
            />
            <Area type="monotone" dataKey="ghi" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} name="GHI (Global)" />
            <Area type="monotone" dataKey="dni" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} strokeWidth={2} name="DNI (Direct)" />
            <Area type="monotone" dataKey="dhi" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.05} strokeWidth={1} name="DHI (Diffuse)" />
            <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold'}} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
