
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Gauge, Zap, AlertCircle, ShieldAlert } from 'lucide-react';

export const MOD02_FrequencyReg: React.FC = () => {
  const [frequency, setFrequency] = useState(50.00);
  const [history, setHistory] = useState<any[]>([]);
  const [agcActive, setAgcActive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const noise = (Math.random() - 0.5) * 0.05;
      const newFreq = 50.00 + noise;
      setFrequency(newFreq);
      setHistory(prev => [...prev.slice(-49), { time: Date.now(), val: newFreq }]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCritical = Math.abs(50.00 - frequency) > 0.04;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <div className={`w-3 h-3 rounded-full ${agcActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
          </div>
          <Gauge className={`w-12 h-12 mb-4 ${isCritical ? 'text-red-500 animate-bounce' : 'text-emerald-500'}`} />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Grid Frequency (RO-TSO)</p>
          <h2 className={`text-6xl font-black font-mono tracking-tighter ${isCritical ? 'text-red-500' : 'text-emerald-400'}`}>
            {frequency.toFixed(3)} <span className="text-2xl">Hz</span>
          </h2>
          {isCritical && (
            <div className="mt-4 flex items-center gap-2 text-red-500 font-bold text-xs animate-pulse">
               <ShieldAlert className="w-4 h-4" /> AGC INJECTING SPINNING RESERVE
            </div>
          )}
        </div>

        <div className="w-full md:w-80 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Ancillary Market</h3>
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
             <p className="text-[10px] text-slate-500 uppercase font-bold">Spinning Reserve</p>
             <p className="text-xl font-bold text-white">450 MW</p>
          </div>
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
             <p className="text-[10px] text-slate-500 uppercase font-bold">aFRR Capacity</p>
             <p className="text-xl font-bold text-emerald-400">€12.4M Avail.</p>
          </div>
          <button onClick={() => setAgcActive(!agcActive)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase transition-all">
            Toggle AGC Logic
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis hide />
            <YAxis domain={[49.9, 50.1]} stroke="#475569" fontSize={10} />
            <ReferenceLine y={50.00} stroke="#10b981" strokeDasharray="3 3" />
            <ReferenceLine y={49.95} stroke="#ef4444" strokeDasharray="3 3" label={{value: 'TRIP', position: 'insideTopLeft', fill: 'red', fontSize: 10}} />
            <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
