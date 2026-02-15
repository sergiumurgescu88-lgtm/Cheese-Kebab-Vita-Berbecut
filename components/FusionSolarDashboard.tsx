
import React, { useState, useEffect } from 'react';
import { 
  Zap, Sun, Battery, AlertTriangle, RefreshCcw, 
  Server, Wifi, WifiOff, TrendingUp, DollarSign, Activity, MapPin, Hash, User, Play, Square, Gauge
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts';
import { getPlantList, getRealtimeKPI, getDeviceStatus, getActiveAlarms, PlantData, RealtimeKPI, DeviceData, Alarm } from '../services/fusionSolarService';

export const FusionSolarDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [plant, setPlant] = useState<PlantData | null>(null);
  const [kpi, setKpi] = useState<RealtimeKPI | null>(null);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // VPP Simulation State
  const [vppMode, setVppMode] = useState<'monitor' | 'frequency_response' | 'peak_shaving'>('monitor');
  const [gridFrequency, setGridFrequency] = useState(50.00);
  const [dispatchTarget, setDispatchTarget] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Plant
      const plants = await getPlantList();
      if (plants.length > 0) {
        const activePlant = plants[0];
        setPlant(activePlant);

        // 2. Get Parallel Data
        const [kpiData, deviceData, alarmData] = await Promise.all([
          getRealtimeKPI([activePlant.stationCode]),
          getDeviceStatus(activePlant.stationCode),
          getActiveAlarms(activePlant.stationCode)
        ]);

        setKpi(kpiData);
        setDevices(deviceData);
        setAlarms(alarmData);
      }
    } catch (error) {
      console.error("Dashboard Sync Failed:", error);
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 min refresh
    return () => clearInterval(interval);
  }, []);

  // VPP Simulation Effect
  useEffect(() => {
    let interval: any;
    if (vppMode === 'frequency_response') {
      interval = setInterval(() => {
        // Simulate fluctuating grid frequency dropping below 50Hz
        const newFreq = 49.8 + Math.random() * 0.3;
        setGridFrequency(newFreq);
      }, 2000);
    } else {
      setGridFrequency(50.00);
    }
    return () => clearInterval(interval);
  }, [vppMode]);

  const toggleVPPMode = (mode: 'frequency_response' | 'peak_shaving') => {
    if (vppMode === mode) {
      setVppMode('monitor');
      setDispatchTarget(null);
    } else {
      setVppMode(mode);
      if (mode === 'peak_shaving') {
        setDispatchTarget((plant?.capacity || 45000) * 0.7); // Cap at 70%
      } else {
        setDispatchTarget(null);
      }
    }
  };

  const chartData = Array.from({ length: 24 }, (_, i) => {
    const basePower = i > 6 && i < 20 ? Math.sin((i - 6) * Math.PI / 14) * (plant?.capacity || 45000) * 0.8 : 0;
    let actualPower = basePower;
    
    // Simulate VPP effects on chart
    if (i >= new Date().getHours() && vppMode === 'peak_shaving' && dispatchTarget) {
      actualPower = Math.min(basePower, dispatchTarget);
    }
    if (i >= new Date().getHours() && vppMode === 'frequency_response') {
      actualPower = basePower + (50 - gridFrequency) * 5000; // Boost power if freq drops
    }

    return {
      time: `${i}:00`,
      power: basePower,
      vppAdjusted: actualPower,
      setpoint: dispatchTarget
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500 p-2 rounded-xl">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Huawei FusionSolar</h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${vppMode !== 'monitor' ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">
                  {vppMode === 'monitor' ? 'Live Connection' : 'VPP ORCHESTRATION ACTIVE'} • {plant?.stationName || 'Initializing...'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last Update</p>
            <p className="text-xs text-slate-300 font-mono">{lastUpdate.toLocaleTimeString()}</p>
          </div>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Info Bar for User Confirmation */}
      {plant && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
            <Hash className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Station Code</p>
              <p className="text-xs text-white font-mono">{plant.stationCode}</p>
            </div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
            <User className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Account</p>
              <p className="text-xs text-white font-mono">{plant.contactPerson || 'HelioSolar021188'}</p>
            </div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Coordinates</p>
              <p className="text-xs text-white font-mono">{plant.latitude.toFixed(3)}, {plant.longitude.toFixed(3)}</p>
            </div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
            <Activity className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Capacity</p>
              <p className="text-xs text-white font-mono">{plant.capacity.toLocaleString()} kW</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Current Power', value: `${(kpi?.inverter_power || 0).toLocaleString()} kW`, icon: Zap, color: 'amber' },
          { label: 'Daily Energy', value: `${(kpi?.day_power || 0).toLocaleString()} kWh`, icon: Battery, color: 'emerald' },
          { label: 'Daily Revenue', value: `€${(kpi?.day_income || 0).toLocaleString()}`, icon: DollarSign, color: 'blue' },
          { label: 'Performance Ratio', value: `${kpi?.performance_ratio || 0}%`, icon: Activity, color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity bg-${stat.color}-500 rounded-bl-3xl`}>
              <stat.icon className="w-8 h-8 text-white" />
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left: Production Chart with VPP Overlay */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Real-time Production
            </h3>
            <div className="flex items-center gap-3">
              {vppMode !== 'monitor' && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded border border-indigo-500/30 animate-pulse">VPP ACTIVE</span>}
              <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs text-slate-400 border border-slate-700">Today</span>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSolarHuawei" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVpp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="power" stroke="#f97316" fill="url(#colorSolarHuawei)" strokeWidth={3} name="Base Power (kW)" />
                {vppMode !== 'monitor' && (
                  <Area type="monotone" dataKey="vppAdjusted" stroke="#6366f1" fill="url(#colorVpp)" strokeWidth={2} strokeDasharray="5 5" name="VPP Dispatch (kW)" />
                )}
                {dispatchTarget && <ReferenceLine y={dispatchTarget} stroke="red" strokeDasharray="3 3" label={{ value: 'TSO Limit', fill: 'red', fontSize: 10 }} />}
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Device Status & Alarms */}
        <div className="space-y-6">
          {/* Alarms */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Active Alarms
              </h3>
              <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-md">{alarms.length}</span>
            </div>
            <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
              {alarms.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <p>No active alarms.</p>
                  <p className="text-xs mt-1">System healthy.</p>
                </div>
              ) : (
                alarms.map((alarm) => (
                  <div key={alarm.alarmId} className="bg-red-900/10 border border-red-900/30 p-3 rounded-xl flex gap-3">
                    <div className="mt-1"><AlertTriangle className="w-4 h-4 text-red-500" /></div>
                    <div>
                      <p className="text-white text-xs font-bold">{alarm.alarmName}</p>
                      <p className="text-slate-400 text-[10px]">{alarm.devName} • {new Date(alarm.raiseTime).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Devices List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-indigo-500" />
              Inverter Status
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {devices.filter(d => d.devTypeId === 1 || d.devTypeId === 38).map((device) => (
                <div key={device.id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {device.status === 1 ? (
                      <Wifi className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <p className="text-slate-200 text-xs font-bold">{device.devName}</p>
                      <p className="text-slate-500 text-[10px] font-mono">{device.esnCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-xs font-bold">{device.active_power?.toFixed(1)} kW</p>
                    <p className="text-slate-400 text-[10px]">{device.temperature || '--'}°C</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VPP Control Panel (TEST MODULE) */}
      <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">VPP Orchestrator - Active Tests</h3>
              <p className="text-xs text-indigo-300/60">Module MOD-01 Simulation Interface</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-950/50 px-4 py-2 rounded-xl border border-indigo-500/20">
             <Gauge className="w-4 h-4 text-slate-400" />
             <span className="text-xs font-mono text-slate-300">Grid Freq:</span>
             <span className={`text-sm font-bold font-mono ${gridFrequency < 49.9 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
               {gridFrequency.toFixed(3)} Hz
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => toggleVPPMode('frequency_response')}
            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
              vppMode === 'frequency_response' 
              ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500/20' 
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <div className="text-left">
              <h4 className={`font-bold ${vppMode === 'frequency_response' ? 'text-white' : 'text-slate-200'}`}>Frequency Response Test</h4>
              <p className={`text-xs ${vppMode === 'frequency_response' ? 'text-indigo-200' : 'text-slate-500'}`}>Simulate 49.8Hz Event</p>
            </div>
            {vppMode === 'frequency_response' ? <Square className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-slate-400" />}
          </button>

          <button 
            onClick={() => toggleVPPMode('peak_shaving')}
            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
              vppMode === 'peak_shaving' 
              ? 'bg-amber-600 border-amber-400 shadow-lg shadow-amber-500/20' 
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <div className="text-left">
              <h4 className={`font-bold ${vppMode === 'peak_shaving' ? 'text-white' : 'text-slate-200'}`}>Dispatch Command Test</h4>
              <p className={`text-xs ${vppMode === 'peak_shaving' ? 'text-amber-200' : 'text-slate-500'}`}>Limit Output to 70%</p>
            </div>
            {vppMode === 'peak_shaving' ? <Square className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-slate-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};
