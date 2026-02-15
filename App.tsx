import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ModulesInventory } from './components/ModulesInventory';
import { SolarChat } from './components/SolarChat';
import { HeliosChat } from './components/HeliosChat';
import { AtlasChat } from './components/AtlasChat';
import { OmniScadaSection } from './components/OmniScadaSection';
import { VoltaSection } from './components/VoltaSection';
import { MercuriaSection } from './components/MercuriaSection';
import { SettingsSection } from './components/SettingsSection';
import { WeatherForecast } from './components/WeatherForecast';
import { FusionSolarDashboard } from './components/FusionSolarDashboard';
import { GlobalCommandPalette } from './components/GlobalCommandPalette';
import { Menu, Sun, Bell, User as UserIcon, Command } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'modules': return <ModulesInventory />;
      case 'omni-scada': return <OmniScadaSection />;
      case 'volta': return <VoltaSection />;
      case 'mercuria': return <MercuriaSection />;
      case 'solar-ai': return <SolarChat />;
      case 'helio-sf': return <HeliosChat />;
      case 'atlas': return <AtlasChat />;
      case 'settings': return <SettingsSection />;
      case 'weather': return <WeatherForecast />;
      case 'fusionsolar': return <FusionSolarDashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-dvh bg-[#020617] text-slate-200 overflow-hidden font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <GlobalCommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        
        {/* Universal Header */}
        <header className="h-16 md:h-20 border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-sm md:text-xl font-bold text-white capitalize truncate max-w-[140px] md:max-w-none">
                {activeTab.replace('-', ' ')}
              </h2>
              <div className="flex items-center gap-2 md:hidden">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Core Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             <button 
               onClick={() => setIsCommandPaletteOpen(true)}
               className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-500 hover:text-white hover:border-slate-500 transition-all"
             >
               <Command className="w-3 h-3" />
               <span>Quick Search...</span>
               <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">⌘K</span>
             </button>
             <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg relative">
               <Bell className="w-5 h-5" />
               <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-amber-500 rounded-full border border-[#020617]"></span>
             </button>
             <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center border border-slate-700 shadow-lg cursor-pointer">
               <UserIcon className="w-4 h-4 md:w-5 h-5 text-slate-300" />
             </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden bg-[#020617]">
          <div className="max-w-7xl mx-auto h-full w-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;