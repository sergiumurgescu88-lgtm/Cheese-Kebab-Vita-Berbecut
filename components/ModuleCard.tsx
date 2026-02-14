import React from 'react';
import { Module, Priority } from '../types';
import { ChevronRight, DollarSign, Code } from 'lucide-react';

interface ModuleCardProps {
  module: Module;
  onClick: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onClick }) => {
  const priorityColor = {
    [Priority.CRITICAL]: 'text-red-400 bg-red-400/10 border-red-400/20',
    [Priority.ESSENTIAL]: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    [Priority.ADVANCED]: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    [Priority.INNOVATIVE]: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    [Priority.FUTURE]: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  };

  return (
    <div 
      onClick={onClick}
      className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/30 rounded-xl p-5 cursor-pointer transition-all duration-300 group"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2 py-1 rounded text-xs font-semibold border ${priorityColor[module.priority]}`}>
          {module.priority}
        </span>
        <span className="text-slate-500 text-xs font-mono">MOD-{module.number.toString().padStart(2, '0')}</span>
      </div>
      
      <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-amber-400 transition-colors">
        {module.title}
      </h3>
      
      <p className="text-slate-400 text-sm mb-4 line-clamp-2">
        {module.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex gap-4">
          {module.financialImpact.npv && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <DollarSign className="w-3 h-3" />
              <span>{module.financialImpact.npv}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-blue-400 text-xs">
            <Code className="w-3 h-3" />
            <span>{module.apis.length} APIs</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};