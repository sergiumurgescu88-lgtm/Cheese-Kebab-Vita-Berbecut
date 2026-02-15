import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { phases } from '../data/modules';
import { TrendingUp, Zap, Server, AlertCircle, ArrowUpRight } from 'lucide-react';

const roiData = [
  { name: 'Ph 1', value: 142 },
  { name: 'Ph 2', value: 287 },
  { name: 'Ph 3', value: 489 },
  { name: 'Ph 4', value: 649 },
];

const powerData = [
  { time: '00:00', solar: 0, battery: 40 },
  { time: '04:00', solar: 5, battery: 30 },
  { time: '08:00', solar: 60, battery: 20 },
  { time: '12:00', solar: 100, battery: 50 },
  { time: '16:00', solar: 70, battery: 80 },
  { time: '20:00', solar: 10, battery: 60 },
  { time: '23:59', solar: 0, battery: 50 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
      {/* Top Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Projected NPV', value: '€649M', sub: '+12.4%', icon: TrendingUp, color: 'emerald' },
          { label: 'Active Modules', value: '10/47', sub: 'Phase 1', icon: Server, color: 'amber' },
          { label: 'VPP Capacity', value: '3.2 GW', sub: '98% Live', icon: Zap, color: 'blue' },
          { label: 'Security Alerts', value: '2', sub: 'Critical', icon: AlertCircle, color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-4 md:p-5 rounded-2xl shadow-sm hover:border-slate-700 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl md:text-2xl font-bold text-white mt-1">{stat.value}</h3>
                <div className={`flex items-center gap-1 mt-1 text-${stat.color}-400 text-[10px] md:text-xs font-medium`}>
                   {stat.sub} <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
              <div className={`bg-${stat.color}-500/10 p-2 md:p-3 rounded-xl border border-${stat.color}-500/20 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-5 h-5 md:w-6 md:h-6 text-${stat.color}-500`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power Chart */}
        <div className="bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs md:text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> VPP Generation
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">LIVE</span>
          </div>
          <div className="h-64 md:h-80 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={powerData}>
                <defs>
                  <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="solar" stroke="#f59e0b" fill="url(#colorSolar)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROI Chart */}
        <div className="bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-800 flex flex-col">
          <h3 className="text-xs md:text-base font-bold text-white mb-6 uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Cumulative NPV
          </h3>
          <div className="h-64 md:h-80 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}M`} />
                <Tooltip 
                  cursor={{fill: '#1e293b', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Quick Links / Phases - Horizontal Scroll on Mobile */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar md:grid md:grid-cols-4">
        {phases.map((phase) => (
          <div key={phase.id} className="min-w-[240px] md:min-w-0 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-colors shrink-0">
            <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{phase.name}</h4>
            <p className="text-white font-bold mt-1 text-sm">{phase.roi}</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-emerald-500" style={{width: phase.id === 1 ? '100%' : phase.id === 2 ? '40%' : '10%'}}></div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-4 md:hidden" /> {/* Spacer for mobile */}
    </div>
  );
};