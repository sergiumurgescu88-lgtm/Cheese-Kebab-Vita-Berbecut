import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ModuleCard } from './components/ModuleCard';
import { ModuleDetail } from './components/ModuleDetail';
import { HeliosAssistant } from './components/HeliosAssistant';
import { SolarChat } from './components/SolarChat';
import { HeliosChat } from './components/HeliosChat'; // Import HelioChat
import { modules } from './data/modules';
import { Priority, Module, ModuleCategory } from './types';
import { Search, Filter, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'solar-ai':
        return <SolarChat />;
      case 'helio-sf': // New Route
        return <HeliosChat />;
      case 'modules':
      case 'apis':
        return (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col space-y-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
              {/* Top Row: Search and Priority */}
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                  <Filter className="w-5 h-5 text-slate-400 mr-2" />
                  {['All', ...Object.values(Priority)].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setSelectedPriority(priority)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedPriority === priority
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Row: Categories */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-t border-slate-700 pt-4">
                <Layers className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
                <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === 'All'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredModules.map((module) => (
                <ModuleCard 
                  key={module.id} 
                  module={module} 
                  onClick={() => setSelectedModule(module)} 
                />
              ))}
            </div>
            
            {filteredModules.length === 0 && (
              <div className="text-center py-20 text-slate-500">
                No modules found matching your criteria.
              </div>
            )}
          </div>
        );
      case 'simulation':
        return (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">VPP Simulation Environment</h2>
              <p className="text-slate-400">Connecting to Digital Twin nodes...</p>
            </div>
          </div>
        );
      default:
        return <div className="text-slate-400">Section under construction</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">
              {activeTab === 'apis' ? 'API Documentation Hub' : activeTab.replace('-', ' ')}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Welcome back, Lead Architect.
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <div className="text-sm font-medium text-white">System Time</div>
               <div className="text-xs text-amber-500 font-mono">2025-02-14 14:32:05 UTC</div>
             </div>
             <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
               <span className="text-sm font-bold text-white">SA</span>
             </div>
          </div>
        </header>

        {renderContent()}
      </main>

      {selectedModule && (
        <ModuleDetail 
          module={selectedModule} 
          onClose={() => setSelectedModule(null)} 
        />
      )}

      {/* Hide the floating assistant if we are on the dedicated Chat pages */}
      {activeTab !== 'solar-ai' && activeTab !== 'helio-sf' && <HeliosAssistant />}
    </div>
  );
};

export default App;
