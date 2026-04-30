import React, { useState, useEffect } from 'react';
import { Zap, AlertTriangle, RefreshCcw, Activity, Thermometer, Sun, ChevronRight, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getStations, getRealtimeData, getHistory, StationData, InvertorData, HistoryPoint } from '../services/fusionSolarService';
import { ReportPDF } from './ReportPDF';

export const FusionSolarDashboard: React.FC = () => {
  const [stations, setStations] = useState<StationData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [invertors, setInvertors] = useState<InvertorData[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchStations = async () => {
    try {
      const data = await getStations();
      setStations(data);
      if (!selected && data.length > 0) setSelected(data[0].plantCode);
    } finally { setLoading(false); setLastUpdate(new Date()); }
  };

  const fetchDetails = async (plantCode: string) => {
    setDetailLoading(true);
    const [rt, hist] = await Promise.all([getRealtimeData(plantCode), getHistory(plantCode, 7)]);
    if (rt) setInvertors(rt.invertors);
    if (hist) setHistory(hist);
    setDetailLoading(false);
  };

  useEffect(() => { fetchStations(); const i = setInterval(fetchStations, 300000); return () => clearInterval(i); }, []);
  useEffect(() => { if (selected) fetchDetails(selected); }, [selected]);

  const totalPower = stations.reduce((s, p) => s + p.currentPower, 0);
  const totalCap = stations.reduce((s, p) => s + p.capacity, 0);
  const alarms = stations.filter(p => p.status === 'ALARM').length;
  const selectedStation = stations.find(s => s.plantCode === selected);
  const cf = totalCap > 0 ? ((totalPower / totalCap) * 100).toFixed(1) : '0';

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#020617]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">Connecting to FusionSolar...</p>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-[#020617] p-4 md:p-6 space-y-5 custom-scrollbar">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" /> FusionSolar Live
          </h2>
          <p className="text-slate-500 text-[11px] font-mono mt-0.5">
            MOCK MODE · {stations.length} parcuri · actualizat {lastUpdate.toLocaleTimeString('ro')}
          </p>
        </div>
        <ReportPDF className="mr-1" />
        <button onClick={fetchStations} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Putere Live', value: `${totalPower.toFixed(1)} MW`, icon: Zap, color: 'amber', sub: `CF ${cf}%` },
          { label: 'Capacitate', value: `${totalCap.toFixed(1)} MWp`, icon: Activity, color: 'sky', sub: `${stations.length} parcuri` },
          { label: 'Energie Azi', value: `${stations.reduce((s,p)=>s+p.dailyEnergy,0).toFixed(0)} MWh`, icon: Sun, color: 'emerald', sub: 'total portofoliu' },
          { label: 'Alarme Active', value: String(alarms), icon: AlertTriangle, color: alarms > 0 ? 'red' : 'slate', sub: alarms > 0 ? 'necesită atenție' : 'toate OK' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-${color}-500/30 transition-all`}>
            <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 text-${color}-400`} />
            </div>
            <div className="text-xl font-black text-white">{value}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{label}</div>
            <div className={`text-[10px] text-${color}-400 mt-1`}>{sub}</div>
          </div>
        ))}
      </div>

      {/* PLANT GRID + DETAIL */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Plant Cards */}
        <div className="xl:col-span-2 space-y-2">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Parcuri</h3>
          {stations.map(s => (
            <button key={s.plantCode} onClick={() => setSelected(s.plantCode)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${selected === s.plantCode ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm">{s.plantName}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${s.status === 'ALARM' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {s.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{s.currentPower.toFixed(1)} <span className="text-slate-600">MW</span></span>
                <span className="text-slate-500">{s.capacity} MWp capacitate</span>
              </div>
              <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min((s.currentPower / s.capacity) * 100, 100)}%` }} />
              </div>
              <div className="text-[10px] text-slate-600 mt-1">{s.dailyEnergy.toFixed(0)} MWh azi</div>
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="xl:col-span-3 space-y-4">
          {selectedStation && (
            <>
              {/* History Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                  {selectedStation.plantName} — Producție 7 Zile
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={history} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 11 }} labelStyle={{ color: '#94a3b8' }} />
                    <Area type="monotone" dataKey="energy" stroke="#f59e0b" fill="url(#energyGrad)" strokeWidth={2} name="MWh" />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {history.slice(-1).map(h => [
                    { label: 'PR', value: `${h.pr.toFixed(1)}%` },
                    { label: 'Peak', value: `${h.peakPower.toFixed(1)} MW` },
                    { label: 'Iradianță', value: `${h.irradiance.toFixed(2)} kWh/m²` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                      <div className="text-white font-bold text-sm">{value}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{label}</div>
                    </div>
                  )))}
                </div>
              </div>

              {/* Invertors Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Invertoare Live</h3>
                {detailLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invertors.map(inv => (
                      <div key={inv.sn} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${inv.status === 'RUNNING' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-red-400 animate-pulse'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs font-bold truncate">{inv.sn}</div>
                          <div className="text-[10px] text-slate-500">{inv.model}</div>
                          {inv.alarms.length > 0 && (
                            <div className="text-[10px] text-red-400 mt-0.5">⚠ {inv.alarms[0]}</div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 space-y-0.5">
                          <div className="text-amber-400 font-bold text-xs">{inv.activePower.toFixed(1)} kW</div>
                          <div className="text-slate-500 text-[10px] flex items-center gap-1 justify-end">
                            <Thermometer className="w-2.5 h-2.5" />{inv.temperature.toFixed(0)}°C
                          </div>
                          <div className="text-slate-600 text-[10px]">η {inv.efficiency.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
