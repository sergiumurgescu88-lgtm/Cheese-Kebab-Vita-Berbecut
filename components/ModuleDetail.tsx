
import React, { useState } from 'react';
import { Module, Priority } from '../types';
import { X, ExternalLink, Copy, Terminal, PlayCircle, Sparkles, Wand2, RefreshCw, LayoutDashboard } from 'lucide-react';
import { PlanetSoilingAnalysis } from './PlanetSoilingAnalysis';
import { ModuleSimulator } from './ModuleSimulator';
import { PerformanceBenchmarking } from './PerformanceBenchmarking';
import { PredictiveMaintenance } from './PredictiveMaintenance';
import { analyzeModuleAction } from '../services/geminiService';

interface ModuleDetailProps {
  module: Module;
  onClose: () => void;
}

export const ModuleDetail: React.FC<ModuleDetailProps> = ({ module, onClose }) => {
  const [activeView, setActiveView] = useState<'overview' | 'test' | 'ai'>('overview');
  const [aiGoal, setAiGoal] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiAnalysis = async () => {
    if (!aiGoal.trim()) return;
    setIsAiLoading(true);
    const res = await analyzeModuleAction(module.title, aiGoal);
    setAiResponse(res);
    setIsAiLoading(false);
  };

  const priorityColor = {
    [Priority.CRITICAL]: 'text-red-400 bg-red-400/10 border-red-400/20',
    [Priority.ESSENTIAL]: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    [Priority.ADVANCED]: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    [Priority.INNOVATIVE]: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    [Priority.FUTURE]: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-3xl bg-slate-950 border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header Section */}
        <div className="flex-shrink-0 bg-slate-900/50 border-b border-slate-800">
          <div className="p-6 pb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityColor[module.priority]}`}>
                  {module.priority}
                </span>
                <span className="text-slate-500 font-mono text-xs">MOD-{module.number.toString().padStart(2, '0')}</span>
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight">{module.title}</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 flex gap-6 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setActiveView('overview')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeView === 'overview' 
                  ? 'text-white border-amber-500' 
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview
            </button>
            <button 
              onClick={() => setActiveView('ai')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeView === 'ai' 
                  ? 'text-white border-amber-500' 
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" /> AI Engine
            </button>
            <button 
              onClick={() => setActiveView('test')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeView === 'test' 
                  ? 'text-white border-amber-500' 
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <PlayCircle className="w-4 h-4" /> Test Module
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 p-6 md:p-8">
          
          {activeView === 'test' && (
             <div className="animate-in fade-in duration-300 h-full">
               {/* Module Specific Components */}
               {module.id === 'm11' ? (
                 <PerformanceBenchmarking />
               ) : module.id === 'm12' ? (
                 <PredictiveMaintenance />
               ) : (
                 <ModuleSimulator module={module} />
               )}
             </div>
          )}

          {activeView === 'ai' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-indigo-950/10 border border-indigo-500/20 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Sparkles className="w-32 h-32 text-indigo-500" />
                </div>
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-xs relative z-10">
                  <Wand2 className="w-4 h-4 text-indigo-400" /> AI Recalibration Goal
                </h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-lg relative z-10">
                  Describe how you want to optimize this module. ATLAS will provide a technical blueprint.
                </p>
                <div className="flex gap-2 relative z-10">
                  <input 
                    type="text" 
                    placeholder="e.g. Optimize for sub-90ms frequency response..."
                    className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none text-sm placeholder-slate-600"
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiAnalysis()}
                  />
                  <button 
                    disabled={isAiLoading}
                    onClick={handleAiAnalysis}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-900/20"
                  >
                    {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span className="hidden sm:inline">Analyze</span>
                  </button>
                </div>
              </div>

              {aiResponse && (
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4 animate-in fade-in zoom-in-95 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-3 h-3" /> ATLAS Technical Directive
                    </span>
                    <button onClick={() => setAiResponse(null)} className="text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* SPECIAL INTEGRATION: MOD-04 Planet Labs */}
              {module.id === 'm4' && (
                <section>
                   <PlanetSoilingAnalysis />
                </section>
              )}

              {/* Overview Text */}
              <section>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Module Description</h3>
                <p className="text-slate-200 leading-relaxed text-lg font-light">{module.description}</p>
              </section>

              {/* Financial Impact */}
              <section className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  Financial Impact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(module.financialImpact).map(([key, value]) => (
                    <div key={key} className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">{key}</span>
                      <p className="text-emerald-400 font-mono text-lg font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* API Integration */}
              <section>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
                  API Integrations
                </h3>
                <div className="space-y-4">
                  {module.apis.map((api, idx) => (
                    <div key={idx} className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
                      <div className="px-5 py-3 flex items-center justify-between bg-slate-900/50 border-b border-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-slate-800 rounded-lg text-slate-400">
                            <Terminal className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-slate-200 text-sm">{api.provider}</span>
                          {api.protocol && (
                            <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-mono text-slate-400 border border-slate-700">{api.protocol}</span>
                          )}
                        </div>
                        {api.docsUrl && (
                          <a href={api.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors">
                            Docs <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      
                      <div className="p-5 space-y-4">
                        {api.description && (
                          <p className="text-sm text-slate-400 leading-relaxed">
                            {api.description}
                          </p>
                        )}
                        
                        {api.rateLimit && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Rate Limit</span>
                            <span className="text-xs text-slate-400 font-mono">{api.rateLimit}</span>
                          </div>
                        )}
                        
                        {api.codeSnippet && (
                          <div className="relative group">
                            <pre className="bg-[#0b0f19] p-4 rounded-lg overflow-x-auto custom-scrollbar text-xs font-mono text-slate-300 border border-slate-800">
                              <code>{api.codeSnippet}</code>
                            </pre>
                            <button className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
