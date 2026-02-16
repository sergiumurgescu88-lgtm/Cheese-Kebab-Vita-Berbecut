
import React, { useState } from 'react';
import { Search, Filter, Layers, Wifi, WifiOff } from 'lucide-react';
import { modules } from '../data/modules';
import { Priority, Module, ModuleCategory } from '../types';
import { ModuleCard } from './ModuleCard';
import { ModuleDetail } from './ModuleDetail';

export const ModulesInventory: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories: ModuleCategory[] = [
    'Grid & Trading', 'O&M & Analytics', 'Hydrogen & Storage', 
    'Advanced PV', 'Compute & Digital', 'Resilience'
  ];

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = selectedPriority === 'All' || m.priority === selectedPriority;
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesPriority && matchesCategory;
  });

  const activeApiCount = modules.filter(m => m.apis.length > 0).length;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Filters */}
      <div className="flex flex-col space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search 47 intelligence modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all text-sm shadow-inner"
            />
          </div>
          
          {/* Status Legend */}
          <div className="flex items-center gap-4 bg-slate-950 px-4 rounded-xl border border-slate-800 shrink-0 py-2 md:py-0">
             <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-300 font-medium">Live API ({activeApiCount})</span>
             </div>
             <div className="w-px h-4 bg-slate-800"></div>
             <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span className="text-slate-500 font-medium">Simulation ({modules.length - activeApiCount})</span>
             </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Priority</span>
            </div>
            {['All', ...Object.values(Priority)].map((priority) => (
              <button
                key={priority}
                onClick={() => setSelectedPriority(priority)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                  selectedPriority === priority
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)]'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar border-t border-slate-800/50 pt-4">
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 shrink-0">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Category</span>
            </div>
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'All'
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_-3px_rgba(99,102,241,0.5)]'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-500 text-white shadow-[0_0_15px_-3px_rgba(99,102,241,0.5)]'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredModules.map((module) => (
          <ModuleCard 
            key={module.id} 
            module={module} 
            onClick={() => setSelectedModule(module)} 
          />
        ))}
      </div>
      
      {filteredModules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
          <Search className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">No intelligence modules match your filters.</p>
          <button 
            onClick={() => { setSelectedPriority('All'); setSelectedCategory('All'); setSearchTerm(''); }}
            className="mt-4 text-amber-500 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {selectedModule && (
        <ModuleDetail 
          module={selectedModule} 
          onClose={() => setSelectedModule(null)} 
        />
      )}
      <div className="h-4 md:hidden" />
    </div>
  );
};
