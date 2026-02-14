import React from 'react';
import { Module } from '../types';
import { X, ExternalLink, Copy, Terminal } from 'lucide-react';

interface ModuleDetailProps {
  module: Module;
  onClose: () => void;
}

export const ModuleDetail: React.FC<ModuleDetailProps> = ({ module, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-700 h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 border-b border-slate-800 p-6 flex items-center justify-between">
          <div>
            <span className="text-amber-500 font-mono text-sm mb-1 block">MODULE {module.number}</span>
            <h2 className="text-2xl font-bold text-white">{module.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Overview */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Overview</h3>
            <p className="text-slate-300 leading-relaxed">{module.description}</p>
          </section>

          {/* Financial Impact */}
          <section className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
              Financial Impact
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(module.financialImpact).map(([key, value]) => (
                <div key={key} className="bg-slate-900 rounded-lg p-3">
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{key}</span>
                  <p className="text-emerald-400 font-mono font-medium mt-1">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* API Integration */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              API Integrations
            </h3>
            <div className="space-y-6">
              {module.apis.map((api, idx) => (
                <div key={idx} className="border border-slate-700 rounded-xl overflow-hidden">
                  <div className="bg-slate-800/80 px-4 py-3 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-3">
                      <Terminal className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-200">{api.provider}</span>
                      {api.protocol && (
                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">{api.protocol}</span>
                      )}
                    </div>
                    {api.docsUrl && (
                      <a href={api.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        Docs <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  
                  <div className="p-4 bg-slate-900">
                    {api.description && (
                      <div className="mb-3 text-sm text-slate-400 italic border-l-2 border-slate-700 pl-3">
                        {api.description}
                      </div>
                    )}
                    
                    {api.rateLimit && (
                      <div className="mb-3 text-xs text-amber-500/80 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 border border-amber-500/30 rounded bg-amber-500/10">Rate Limit</span>
                        {api.rateLimit}
                      </div>
                    )}
                    
                    {api.codeSnippet && (
                      <div className="relative group">
                        <pre className="bg-[#0d1117] p-4 rounded-lg overflow-x-auto custom-scrollbar text-sm font-mono text-slate-300 border border-slate-800">
                          <code>{api.codeSnippet}</code>
                        </pre>
                        <button className="absolute top-2 right-2 p-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};