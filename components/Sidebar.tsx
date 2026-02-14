import React from 'react';
import { LayoutDashboard, Server, Database, Activity, Settings, Sun, Bot, FileText } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'modules', label: 'Modules Inventory', icon: Server },
    { id: 'apis', label: 'API Hub', icon: Database },
    { id: 'simulation', label: 'VPP Simulation', icon: Activity },
    { id: 'solar-ai', label: 'SolarAI Architect', icon: Bot },
    { id: 'helio-sf', label: 'Helio (SF Expert)', icon: FileText }, // New Item
    { id: 'settings', label: 'System Config', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-amber-500 p-2 rounded-lg">
          <Sun className="text-slate-900 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">SMART HELIOS</h1>
          <p className="text-xs text-slate-400">v1.0.4 Enterprise</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === item.id 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-2">System Status</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm text-emerald-400 font-medium">All Systems Nominal</span>
          </div>
          <p className="text-xs text-slate-500">Uptime: 99.98%</p>
        </div>
      </div>
    </div>
  );
};
