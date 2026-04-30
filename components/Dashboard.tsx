import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, MapPin, CheckCircle, Clock, Factory, Users, TrendingUp, ChevronRight } from 'lucide-react';

const proiecteActive = [
  { nume: 'Căzănești', mw: 9, judet: 'Ialomița', progres: 72, status: 'Construcție', culoare: 'amber' },
  { nume: 'Mircea Vodă', mw: 34, judet: 'Constanța', progres: 45, status: 'Construcție', culoare: 'amber' },
  { nume: 'Babadag', mw: 18, judet: 'Tulcea', progres: 88, status: 'Finalizare', culoare: 'emerald' },
  { nume: 'Șimleu Silvaniei', mw: 48, judet: 'Sălaj', progres: 31, status: 'Construcție', culoare: 'amber' },
  { nume: 'Zorleni', mw: 6, judet: 'Vaslui', progres: 60, status: 'Construcție', culoare: 'amber' },
];

const proiecteFinalizate = [
  { nume: 'Mihăilești', mw: 63, judet: 'Giurgiu', an: 2023 },
  { nume: 'Satu Mare', mw: 73, judet: 'Satu Mare', an: 2023 },
  { nume: 'Kinisi', mw: 130, judet: 'Georgia', an: 2024 },
];

const productieData = [
  { luna: 'Ian', mwh: 12400 },
  { luna: 'Feb', mwh: 18200 },
  { luna: 'Mar', mwh: 31500 },
  { luna: 'Apr', mwh: 42800 },
  { luna: 'Mai', mwh: 58300 },
  { luna: 'Iun', mwh: 67100 },
  { luna: 'Iul', mwh: 71200 },
  { luna: 'Aug', mwh: 68900 },
  { luna: 'Sep', mwh: 49400 },
  { luna: 'Oct', mwh: 33100 },
  { luna: 'Nov', mwh: 16200 },
  { luna: 'Dec', mwh: 10800 },
];

export const Dashboard: React.FC = () => {
  const [tabActiv, setTabActiv] = useState<'active'|'finalizate'>('active');

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Portofoliu WALDEVAR Energy</h1>
          <p className="text-slate-400 text-xs mt-1">Lider EPC solar România · Date actualizate Q2 2026</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-bold">LIVE</span>
        </div>
      </div>

      {/* KPI-uri principale */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Capacitate Instalată', value: '1.5 GW', sub: 'Total portofoliu', icon: Zap, color: 'amber' },
          { label: 'Proiecte Finalizate', value: '61+', sub: 'La cheie', icon: CheckCircle, color: 'emerald' },
          { label: 'Angajați', value: '2.000+', sub: 'Forță de muncă proprie', icon: Users, color: 'blue' },
          { label: 'Fabrică FPV', value: '600 MW', sub: 'În construcție lângă București', icon: Factory, color: 'violet' },
        ].map((kpi, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-xl md:text-2xl font-bold text-white mt-1">{kpi.value}</h3>
                <p className="text-slate-400 text-[10px] mt-1">{kpi.sub}</p>
              </div>
              <div className={`bg-${kpi.color}-500/10 p-2 rounded-xl border border-${kpi.color}-500/20 group-hover:scale-110 transition-transform`}>
                <kpi.icon className={`w-5 h-5 text-${kpi.color}-500`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Proiecte + Grafic */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Proiecte — 3/5 */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setTabActiv('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tabActiv === 'active' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
              >
                În Execuție ({proiecteActive.length})
              </button>
              <button
                onClick={() => setTabActiv('finalizate')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tabActiv === 'finalizate' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'}`}
              >
                Finalizate ({proiecteFinalizate.length})
              </button>
            </div>
            <span className="text-slate-500 text-xs">
              {tabActiv === 'active'
                ? `${proiecteActive.reduce((s,p) => s+p.mw, 0)} MW activi`
                : `${proiecteFinalizate.reduce((s,p) => s+p.mw, 0)} MW finalizați`}
            </span>
          </div>

          {/* Lista proiecte active */}
          {tabActiv === 'active' && (
            <div className="space-y-3">
              {proiecteActive.map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 hover:bg-slate-800 transition-all cursor-pointer group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <span className="text-amber-400 text-xs font-black">{p.mw}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-bold">{p.nume}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.culoare === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.culoare === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{width: `${p.progres}%`}}
                        />
                      </div>
                      <span className="text-slate-400 text-[10px] w-8 text-right">{p.progres}%</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-500 text-[10px]">{p.judet} · {p.mw} MWp</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Lista proiecte finalizate */}
          {tabActiv === 'finalizate' && (
            <div className="space-y-3">
              {proiecteFinalizate.map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 hover:bg-slate-800 transition-all cursor-pointer group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-bold">{p.nume}</span>
                      <span className="text-emerald-400 text-xs font-bold">{p.mw} MWp</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-500 text-[10px]">{p.judet} · Finalizat {p.an}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grafic producție — 2/5 */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Producție Estimată 2026</h3>
          </div>
          <p className="text-slate-500 text-[10px] mb-4">MWh / lună · Portofoliu activ</p>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productieData}>
                <defs>
                  <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="luna" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '11px' }}
                  formatter={(v: number) => [`${v.toLocaleString('ro-RO')} MWh`, 'Producție']}
                />
                <Area type="monotone" dataKey="mwh" stroke="#f59e0b" fill="url(#gradProd)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center gap-2 text-slate-600 text-[10px]">
        <Clock className="w-3 h-3" />
        <span>Date actualizate Q2 2026 · HELIOS Platform v3.1 · WALDEVAR Energy</span>
      </div>

    </div>
  );
};
