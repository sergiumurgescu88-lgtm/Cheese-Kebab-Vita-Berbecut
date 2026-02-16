
import React, { useState, useEffect } from 'react';
import { Module } from '../../types';
import { analyzeModuleAction } from '../../services/geminiService';
import { Sparkles, Activity, Terminal, Play } from 'lucide-react';

export const UniversalModule: React.FC<{ module: Module }> = ({ module }) => {
  const [simulation, setSimulation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    // Use the Gemini Service to hallucinate a plausible output for this module
    const res = await analyzeModuleAction(module.title, "Generate a realistic simulation log and status report for this module.");
    setSimulation(res);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Activity className="w-64 h-64" /></div>
        <h2 className="text-2xl font-bold text-white mb-2">{module.title}</h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto mb-8">{module.description}</p>
        
        {!simulation ? (
          <button 
            onClick={runSimulation}
            disabled={loading}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-3 mx-auto disabled:opacity-50"
          >
            {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {loading ? 'Initializing Core...' : 'Activate Module Core'}
          </button>
        ) : (
          <div className="text-left bg-black/50 p-6 rounded-2xl border border-slate-700 font-mono text-xs text-slate-300 overflow-y-auto max-h-[400px] custom-scrollbar shadow-inner">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2 text-indigo-400 font-bold uppercase">
              <Terminal className="w-4 h-4" /> System Output
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{simulation}</div>
            <button onClick={() => setSimulation(null)} className="mt-4 text-xs text-slate-500 hover:text-white underline">Reset Simulation</button>
          </div>
        )}
      </div>
    </div>
  );
};
