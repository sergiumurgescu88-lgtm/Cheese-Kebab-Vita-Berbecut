import React from 'react';
import { LayoutDashboard, Server, Activity, Settings, Sun, Bot, FileText, Cpu, Zap, TrendingUp, X, CloudSun } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'modules', label: 'Modules Inventory', icon: Server },
    { id: 'fusionsolar', label: 'FusionSolar Live', icon: Sun },
    { id: 'weather', label: 'Weather Forecast', icon: CloudSun },
    { id: 'omni-scada', label: 'OMNI-SCADA', icon: Activity },
    { id: 'volta', label: 'VOLTA (Master PPC)', icon: Zap },
    { id: 'mercuria', label: 'MERCURIA (Trading)', icon: TrendingUp },
    { id: 'solar-ai', label: 'SolarAI Architect', icon: Bot },
    { id: 'helio-sf', label: 'Helio (SF Expert)', icon: FileText },
    { id: 'atlas', label: 'Atlas (Tech Engine)', icon: Cpu },
    { id: 'settings', label: 'System Config', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-[60] transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-screen w-72 bg-[#020617] border-r border-slate-800 flex flex-col z-[70]
        transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:translate-x-0 md:w-64
        ${isOpen ? 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)]' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-500/10">
              <Sun className="text-slate-950 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tighter leading-none">SMART HELIOS</h1>
              <p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mt-1">v1.0.5 Enterprise</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 group
                ${activeTab === item.id 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner' 
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${activeTab === item.id ? 'text-amber-500' : 'text-slate-600'}`} />
              <span className="uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-inner">
            <div className="flex items-center justify-between mb-2">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Health</p>
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs text-slate-300 font-bold">Systems Nominal</p>
            <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-[99.98%]"></div>
            </div>
            <p className="text-[9px] text-slate-600 mt-2 font-mono uppercase">Sync Latency: 42ms</p>
          </div>
        </div>
      </div>
    </>
  );
};