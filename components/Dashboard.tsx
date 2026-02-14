import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { modules, phases } from '../data/modules';
import { TrendingUp, Zap, Server, AlertCircle } from 'lucide-react';

const roiData = [
  { name: 'Phase 1', value: 142 },
  { name: 'Phase 2', value: 287 },
  { name: 'Phase 3', value: 489 },
  { name: 'Phase 4', value: 649 },
];

const powerData = [
  { time: '00:00', solar: 0, battery: 40, demand: 20 },
  { time: '04:00', solar: 0, battery: 30, demand: 25 },
  { time: '08:00', solar: 60, battery: 20, demand: 60 },
  { time: '12:00', solar: 100, battery: 50, demand: 70 },
  { time: '16:00', solar: 70, battery: 80, demand: 65 },
  { time: '20:00', solar: 10, battery: 60, demand: 50 },
  { time: '23:59', solar: 0, battery: 50, demand: 30 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Projected NPV</p>
              <h3 className="text-2xl font-bold text-white mt-1">€649M</h3>
              <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12% vs last projection
              </p>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Active Modules</p>
              <h3 className="text-2xl font-bold text-white mt-1">10<span className="text-slate-500 text-base">/47</span></h3>
              <p className="text-amber-400 text-xs mt-1">Phase 1 Critical</p>
            </div>
            <div className="bg-amber-500/10 p-2 rounded-lg">
              <Server className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">VPP Capacity</p>
              <h3 className="text-2xl font-bold text-white mt-1">3.2 GW</h3>
              <p className="text-blue-400 text-xs mt-1">98% Availability</p>
            </div>
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Active Alerts</p>
              <h3 className="text-2xl font-bold text-white mt-1">2</h3>
              <p className="text-red-400 text-xs mt-1">Thermal Anomalies Detected</p>
            </div>
            <div className="bg-red-500/10 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power Chart */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6">Real-Time VPP Generation</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={powerData}>
                <defs>
                  <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="solar" stackId="1" stroke="#f59e0b" fill="url(#colorSolar)" name="Solar Gen" />
                <Area type="monotone" dataKey="battery" stackId="1" stroke="#0ea5e9" fill="url(#colorBattery)" name="Battery Output" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROI Chart */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6">Financial Impact (Cumulative NPV)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `€${value}M`} />
                <Tooltip 
                  cursor={{fill: '#334155', opacity: 0.2}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  formatter={(value) => [`€${value}M`, 'NPV']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Quick Links / Phases */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {phases.map((phase) => (
          <div key={phase.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
            <h4 className="text-slate-300 font-medium">{phase.name}</h4>
            <p className="text-emerald-400 font-bold mt-1">{phase.roi}</p>
          </div>
        ))}
      </div>
    </div>
  );
};