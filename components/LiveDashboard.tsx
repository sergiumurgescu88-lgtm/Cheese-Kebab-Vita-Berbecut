import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, ComposedChart, Bar
} from 'recharts';
import {
  Zap, Sun, Cloud, Wind, Droplets, Thermometer, Activity,
  TrendingUp, Euro, Leaf, RefreshCcw, Wifi, WifiOff,
  AlertTriangle, Server, Battery, Gauge, Clock, MapPin,
  ArrowUpRight, ArrowDownRight, Play, Square, Sunrise, Sunset
} from 'lucide-react';
import {
  fetchLiveDashboard, LiveDashboardData, BACKEND_URL
} from '../services/liveDashboardService';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmt = (n: number, dec = 0) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtKW = (kw: number) =>
  kw >= 1000 ? `${fmt(kw / 1000, 2)} MW` : `${fmt(kw)} kW`;

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const REFRESH_INTERVAL = 30_000; // 30 secunde

// ─── STAT CARD ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  live?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon: Icon, color, trend, live }) => (
  <div className={`bg-slate-900 border border-slate-800 p-4 md:p-5 rounded-2xl relative overflow-hidden group hover:border-${color}-500/30 transition-all duration-300`}>
    <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-${color}-500/5 group-hover:bg-${color}-500/10 transition-all`} />
    <div className="flex justify-between items-start">
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider truncate">{label}</p>
        <h3 className={`text-xl md:text-2xl font-bold text-white mt-1 font-mono`}>{value}</h3>
        {sub && (
          <div className={`flex items-center gap-1 mt-1 text-${color}-400 text-[10px] font-medium`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
            {sub}
          </div>
        )}
      </div>
      <div className={`bg-${color}-500/10 p-2.5 rounded-xl border border-${color}-500/20 group-hover:scale-110 transition-transform shrink-0 ml-2`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
    </div>
    {live && (
      <div className="absolute top-3 left-3 flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full bg-${color}-400 animate-pulse`} />
      </div>
    )}
  </div>
);

// ─── WEATHER WIDGET ───────────────────────────────────────────────────────────

const WeatherWidget: React.FC<{ weather: LiveDashboardData['weather'] }> = ({ weather }) => {
  if (!weather) return null;
  const conditionIcon = weather.condition === 'Clear' ? '☀️' :
    weather.condition === 'Partly Cloudy' ? '⛅' :
    weather.condition === 'Rain' ? '🌧️' :
    weather.condition === 'Snow' ? '❄️' : '☁️';

  return (
    <div className="bg-gradient-to-br from-slate-900 to-blue-950/30 border border-blue-900/30 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weather Live</h3>
        <span className="text-[10px] text-blue-400 font-mono bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/50">
          {fmtTime(weather.fetchedAt)}
        </span>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-4xl">{conditionIcon}</span>
        <div>
          <div className="text-3xl font-bold text-white">{weather.temperature}°C</div>
          <div className="text-sm text-blue-300">{weather.condition}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { icon: Sun, label: 'Irradiance', value: `${weather.irradiance} W/m²`, color: 'amber' },
          { icon: Cloud, label: 'Cloud Cover', value: `${weather.cloudCover}%`, color: 'slate' },
          { icon: Wind, label: 'Wind', value: `${weather.windSpeed} km/h`, color: 'cyan' },
          { icon: Droplets, label: 'Humidity', value: `${weather.humidity}%`, color: 'blue' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-2 py-1.5">
            <Icon className={`w-3.5 h-3.5 text-${color}-400 shrink-0`} />
            <div>
              <div className="text-[9px] text-slate-500 uppercase">{label}</div>
              <div className="text-slate-200 font-mono text-[11px] font-bold">{value}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 text-[10px] text-slate-500 border-t border-slate-800 pt-3">
        <span className="flex items-center gap-1">🌅 {weather.sunrise}</span>
        <span className="flex items-center gap-1">UV {weather.uvIndex}</span>
        <span className="flex items-center gap-1">🌇 {weather.sunset}</span>
      </div>
    </div>
  );
};

// ─── DEVICE ROW ──────────────────────────────────────────────────────────────

const DeviceRow: React.FC<{ device: LiveDashboardData['devices'][0] }> = ({ device }) => (
  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex justify-between items-center hover:border-slate-600 transition-all">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${device.online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
      <div>
        <p className="text-slate-200 text-xs font-bold">{device.name}</p>
        <p className="text-slate-500 text-[10px] font-mono">Eff: {device.efficiencyPct.toFixed(1)}%</p>
      </div>
    </div>
    <div className="text-right">
      <p className={`text-xs font-bold font-mono ${device.online ? 'text-amber-400' : 'text-slate-500'}`}>
        {device.online ? `${device.powerKW.toFixed(1)} kW` : 'OFFLINE'}
      </p>
      <p className={`text-[10px] ${device.tempC > 60 ? 'text-red-400' : 'text-slate-400'}`}>
        {device.tempC}°C
      </p>
    </div>
  </div>
);

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-2 font-mono">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export const LiveDashboard: React.FC = () => {
  const [data, setData] = useState<LiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const [vppMode, setVppMode] = useState<'monitor' | 'freq' | 'peak'>('monitor');
  const [gridFreq, setGridFreq] = useState(50.0);
  const countRef = useRef(REFRESH_INTERVAL / 1000);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const d = await fetchLiveDashboard();
      setData(d);
      countRef.current = REFRESH_INTERVAL / 1000;
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch (e: any) {
      setError(e.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => load(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  // Countdown tick
  useEffect(() => {
    const tick = setInterval(() => {
      countRef.current = Math.max(0, countRef.current - 1);
      setCountdown(countRef.current);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // VPP freq simulation
  useEffect(() => {
    if (vppMode !== 'freq') { setGridFreq(50.0); return; }
    const iv = setInterval(() => setGridFreq(49.75 + Math.random() * 0.35), 1500);
    return () => clearInterval(iv);
  }, [vppMode]);

  const kpi = data?.kpi;
  const weather = data?.weather;
  const capacityKW = kpi?.capacityKW ?? 45000;

  // Augment chart with VPP simulation
  const chartData = (data?.hourlyChart ?? []).map(p => {
    let vppPower = p.powerKW;
    if (vppMode === 'freq' && gridFreq < 49.9) vppPower = p.powerKW * 1.08;
    if (vppMode === 'peak') vppPower = Math.min(p.powerKW, capacityKW * 0.7);
    return { ...p, vppPower: Math.round(vppPower) };
  });

  const nowHour = new Date().getHours();
  const currentIdx = chartData.findIndex(p => parseInt(p.hour) === nowHour);

  if (loading && !data) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <Sun className="w-16 h-16 text-amber-500/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCcw className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        </div>
        <p className="text-slate-400 text-sm font-mono">Fetching live data...</p>
        <p className="text-slate-600 text-xs">Open-Meteo • PVGIS • FusionSolar</p>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar pb-10">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
            <Sun className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">Live Dashboard</h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                {kpi?.stationName ?? 'Initializing...'} • Refresh în {countdown}s
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-[10px] text-red-400 bg-red-950/50 px-2 py-1 rounded border border-red-900/50">
              ⚠ {error}
            </span>
          )}
          <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <MapPin className="w-3 h-3" />
            44.427°N 26.103°E
          </div>
          <button
            onClick={() => load()}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Putere Curentă"
          value={kpi ? fmtKW(kpi.currentPowerKW) : '—'}
          sub={kpi ? `PR: ${kpi.performanceRatio}%` : undefined}
          icon={Zap}
          color="amber"
          trend="up"
          live
        />
        <StatCard
          label="Energie Azi"
          value={kpi ? `${fmt(kpi.dayEnergyKWh)} kWh` : '—'}
          sub={kpi ? `Venit: €${fmt(kpi.dayRevenueEUR)}` : undefined}
          icon={Battery}
          color="emerald"
          trend="up"
        />
        <StatCard
          label="Iradianță Live"
          value={weather ? `${weather.irradiance} W/m²` : '—'}
          sub={weather ? `${weather.condition}` : undefined}
          icon={Sun}
          color="yellow"
          live
        />
        <StatCard
          label="CO₂ Evitat"
          value={kpi ? `${fmt(kpi.co2SavedTons)} t` : '—'}
          sub={`Total ${kpi ? fmt(kpi.totalEnergyGWh, 1) : '—'} GWh`}
          icon={Leaf}
          color="green"
          trend="up"
        />
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left 2/3: Production Chart */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Producție Orară — {new Date().toLocaleDateString('ro-RO')}
            </h3>
            <div className="flex items-center gap-2">
              {vppMode !== 'monitor' && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30 animate-pulse font-mono">
                  VPP ACTIVE
                </span>
              )}
              {data?.pvgisAnnualKWh && (
                <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                  PVGIS: {fmt(data.pvgisAnnualKWh)} kWh/kWp/an
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradVpp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradIrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hour" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} interval={2} />
                <YAxis yAxisId="power" stroke="#475569" fontSize={9} tickLine={false} axisLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}MW` : `${v}kW`} />
                <YAxis yAxisId="irr" orientation="right" stroke="#0ea5e9" fontSize={9}
                  tickLine={false} axisLine={false} tickFormatter={v => `${v}W`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />

                {/* Linie verticală = ora curentă */}
                {currentIdx >= 0 && (
                  <ReferenceLine yAxisId="power" x={chartData[currentIdx]?.hour}
                    stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5}
                    label={{ value: 'ACUM', fill: '#10b981', fontSize: 9, position: 'top' }} />
                )}

                <Bar yAxisId="irr" dataKey="irradiance" fill="#0ea5e9" opacity={0.15}
                  radius={[2, 2, 0, 0]} name="Iradianță (W/m²)" />
                <Area yAxisId="power" type="monotone" dataKey="powerKW"
                  stroke="#f59e0b" strokeWidth={2.5} fill="url(#gradSolar)" name="Putere (kW)" />
                {vppMode !== 'monitor' && (
                  <Area yAxisId="power" type="monotone" dataKey="vppPower"
                    stroke="#6366f1" strokeWidth={2} strokeDasharray="6 3"
                    fill="url(#gradVpp)" name="VPP Dispatch (kW)" />
                )}
                {vppMode === 'peak' && (
                  <ReferenceLine yAxisId="power" y={capacityKW * 0.7}
                    stroke="#ef4444" strokeDasharray="4 4"
                    label={{ value: 'TSO Cap 70%', fill: '#ef4444', fontSize: 9 }} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1/3: Weather + Alarms */}
        <div className="flex flex-col gap-4">
          <WeatherWidget weather={weather ?? null} />

          {/* Alarms */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Alarme Active
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                (data?.alarms.length ?? 0) > 0
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {data?.alarms.length ?? 0}
              </span>
            </div>
            {(data?.alarms.length ?? 0) === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                <div className="text-2xl mb-2">✅</div>
                Sistem sănătos. Fără alarme.
              </div>
            ) : data?.alarms.map(a => (
              <div key={a.id} className="bg-red-950/20 border border-red-900/30 p-3 rounded-xl mb-2">
                <p className="text-white text-xs font-bold">{a.name}</p>
                <p className="text-slate-400 text-[10px]">{a.device} • {fmtTime(a.time)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DEVICE STATUS ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            Invertor Status ({data?.devices.filter(d => d.online).length ?? 0}/{data?.devices.length ?? 0} Online)
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-mono">
              Total: {kpi ? fmtKW(kpi.currentPowerKW) : '—'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data?.devices.map(d => <DeviceRow key={d.id} device={d} />)}
        </div>
      </div>

      {/* ── VPP CONTROL ── */}
      <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">VPP Orchestrator — MOD-01</h3>
              <p className="text-[10px] text-indigo-400/60 font-mono">Simulation Interface</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2 rounded-xl border border-indigo-500/20">
            <Gauge className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-mono text-slate-400">Grid Freq:</span>
            <span className={`text-sm font-bold font-mono ${gridFreq < 49.9 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {gridFreq.toFixed(3)} Hz
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              mode: 'freq' as const,
              label: 'Frequency Response',
              desc: 'Simulează eveniment 49.8 Hz — boost output +8%',
              color: 'indigo',
            },
            {
              mode: 'peak' as const,
              label: 'Peak Shaving',
              desc: 'Limitează output la 70% din capacitate (TSO setpoint)',
              color: 'amber',
            },
          ].map(({ mode, label, desc, color }) => {
            const active = vppMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setVppMode(active ? 'monitor' : mode)}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                  active
                    ? `bg-${color}-600/80 border-${color}-400 shadow-lg`
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="text-left">
                  <h4 className={`font-bold text-sm ${active ? 'text-white' : 'text-slate-200'}`}>{label}</h4>
                  <p className={`text-xs mt-0.5 ${active ? `text-${color}-200` : 'text-slate-500'}`}>{desc}</p>
                </div>
                {active
                  ? <Square className="w-5 h-5 text-white shrink-0 ml-3" />
                  : <Play className="w-5 h-5 text-slate-400 shrink-0 ml-3" />
                }
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TOTALE CUMULATIVE ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Energie Lunară', value: kpi ? `${fmt(kpi.monthEnergyMWh)} MWh` : '—', icon: Activity, color: 'blue' },
          { label: 'Energie Totală', value: kpi ? `${fmt(kpi.totalEnergyGWh, 1)} GWh` : '—', icon: Zap, color: 'amber' },
          { label: 'Venit Total', value: kpi ? `€${fmt(kpi.totalRevenueEUR)}` : '—', icon: Euro, color: 'emerald' },
          { label: 'Capacitate Parc', value: kpi ? fmtKW(kpi.capacityKW) : '—', icon: Server, color: 'purple' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{s.label}</p>
            <p className={`text-lg font-bold font-mono text-${s.color}-400 mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

    </div>
  );
};
