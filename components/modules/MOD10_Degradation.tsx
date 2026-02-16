
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Layers, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

export const MOD10_Degradation: React.FC = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Simulate 10-year degradation timeline
    const timeline = Array.from({ length: 120 }, (_, i) => {
      const month = i + 1;
      const baseEfficiency = 100;
      // Normal degradation: 0.5% per year
      const normal = baseEfficiency * Math.pow(0.995, month / 12);
      // Actual simulation (random stress events)
      const stress = month > 60 && month < 72 ? 0.98 : 1.0; 
      const actual = normal * stress * (0.998 + Math.random() * 0.004);
      
      return {
        month,
        year: (month / 12).toFixed(1),
        normal: parseFloat(normal.toFixed(2)),
        actual: parseFloat(actual.toFixed(2))
      };
    });
    setData(timeline);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="space-y-2">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Active Monitoring</p>
            <h4 className="text-2xl font-black text-white">1.79M Panels</h4>
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
               <ShieldCheck className="w-4 h-4" /> Individual panel ID lock active
            </div>
         </div>
         <div className="space-y-2">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Annual Degradation</p>
            <h4 className="text-2xl font-black text-white">-0.52%</h4>
            <p className="text-xs text-slate-400">Average across portfolio</p>
         </div>
         <div className="space-y-2">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Failure Window</p>
            <h4 className="text-2xl font-black text-amber-500">6 Months</h4>
            <p className="text-xs text-slate-400">Advance prediction lead</p>
         </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl h-[400px]">
        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
           <Activity className="w-5 h-5 text-indigo-500" /> 10-Year Degradation Curve (Real vs Nominal)
        </h3>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="year" stroke="#475569" fontSize={10} interval={12} label={{value: 'Years', position: 'insideBottom', offset: -5, fill: '#475569'}} />
            <YAxis domain={[90, 100]} stroke="#475569" fontSize={10} label={{value: '% Efficiency', angle: -90, position: 'insideLeft', fill: '#475569'}} />
            <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b'}} />
            <Area type="monotone" dataKey="normal" stroke="#334155" fill="none" strokeWidth={1} strokeDasharray="5 5" name="Nominal (Standard)" />
            <Area type="monotone" dataKey="actual" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={3} name="Actual (Aggregated)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-3xl flex items-center gap-4">
         <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
         <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-white font-bold">LID Detection:</span> Light Induced Degradation patterns identified in 2.4% of the US cluster panels. 
            Automated warranty claim payload generated for MOD-14 filing.
         </p>
      </div>
    </div>
  );
};
