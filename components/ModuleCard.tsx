
import React from 'react';
import { Module, Priority } from '../types';
import { ChevronRight, DollarSign, Code, Wifi, WifiOff } from 'lucide-react';

interface ModuleCardProps {
  module: Module;
  onClick: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onClick }) => {
  const hasApi = module.apis && module.apis.length > 0;

  const priorityColor = {
    [Priority.CRITICAL]: 'text-red-400 bg-red-400/10 border-red-400/20',
    [Priority.ESSENTIAL]: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    [Priority.ADVANCED]: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    [Priority.INNOVATIVE]: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    [Priority.FUTURE]: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  };

  // Base classes based on API status
  const containerClasses = hasApi
    ? "bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 hover:border-amber-500/30 shadow-lg shadow-black/20"
    : "bg-[#0a0f1c] border-slate-800/50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-500";

  const titleClasses = hasApi
    ? "text-white group-hover:text-amber-400"
    : "text-slate-400 group-hover:text-slate-200";

  return (
    <div 
      onClick={onClick}
      className={`${containerClasses} border rounded-xl p-5 cursor-pointer transition-all duration-300 group relative overflow-hidden`}
    >
      {/* Visual Indicator for No API */}
      {!hasApi && (
        <div className="absolute -right-8 top-4 rotate-45 bg-slate-800 text-slate-500 text-[9px] font-bold px-10 py-1 uppercase tracking-widest border border-slate-700">
          Simulation
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-1 rounded text-xs font-semibold border ${hasApi ? priorityColor[module.priority] : 'text-slate-500 border-slate-700 bg-slate-800'}`}>
          {module.priority}
        </span>
        <span className="text-slate-500 text-xs font-mono">MOD-{module.number.toString().padStart(2, '0')}</span>
      </div>
      
      <h3 className={`font-semibold text-lg mb-2 transition-colors ${titleClasses}`}>
        {module.title}
      </h3>
      
      <p className="text-slate-500 text-sm mb-4 line-clamp-2">
        {module.description}
      </p>

      <div className={`flex items-center justify-between pt-4 border-t ${hasApi ? 'border-slate-700/50' : 'border-slate-800'}`}>
        <div className="flex gap-4">
          {module.financialImpact.npv ? (
            <div className={`flex items-center gap-1.5 text-xs ${hasApi ? 'text-emerald-400' : 'text-slate-500'}`}>
              <DollarSign className="w-3 h-3" />
              <span>{module.financialImpact.npv}</span>
            </div>
          ) : (
             <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <DollarSign className="w-3 h-3" />
              <span>--</span>
            </div>
          )}
          
          <div className={`flex items-center gap-1.5 text-xs ${hasApi ? 'text-blue-400' : 'text-slate-600'}`}>
            {hasApi ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{module.apis.length} APIs</span>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 transform group-hover:translate-x-1 transition-transform ${hasApi ? 'text-slate-500 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-400'}`} />
      </div>
    </div>
  );
};
