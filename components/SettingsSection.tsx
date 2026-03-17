import React, { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Globe, Key, Save, Moon, Cpu, Database, ExternalLink, CreditCard, AlertTriangle } from 'lucide-react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const SettingsSection: React.FC = () => {
  const [apiKey, setApiKey] = useState('••••••••••••••••••••••••••••');
  const [showKey, setShowKey] = useState(false);
  const [hasPaidKey, setHasPaidKey] = useState(false);
  const activeProjectId = "588412172690";

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasPaidKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasPaidKey(selected);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 custom-scrollbar">
      <div className="max-w-3xl space-y-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-white uppercase tracking-tight text-sm md:text-base">Billing & API Limits</h3>
            </div>
            {hasPaidKey ? (
              <div className="flex flex-col items-end">
                <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">PAID TIER ACTIVE</span>
                <span className="text-[9px] text-slate-500 mt-1 font-mono">Project: {activeProjectId}</span>
              </div>
            ) : (
              <div className="flex flex-col items-end">
                <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">FREE TIER (LIMITED)</span>
                <span className="text-[9px] text-slate-500 mt-1 font-mono">Context: {activeProjectId}</span>
              </div>
            )}
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase">Cum evităm limitele?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pentru a asigura generarea rapoartelor SF fără întreruperi și cu viteză maximă, recomandăm utilizarea unui <strong>API Key dintr-un proiect Google Cloud cu facturare activată</strong>.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Documentație Billing
                  </a>
                </div>
              </div>
              <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 uppercase leading-relaxed">
                    Fără un Key plătit, poți întâmpina erori de tip "Rate Limit Exceeded" în timpul orelor de vârf sau la procesarea documentelor mari.
                  </p>
                </div>
                <button 
                  onClick={handleSelectKey}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
                >
                  {hasPaidKey ? "Schimbă API Key (Paid)" : "Configurează Paid API Key"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-800/20">
            <Key className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-white uppercase tracking-tight text-sm md:text-base">Gemini API Configuration</h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-xs md:text-sm text-slate-400">Secure gateway for Helios, Atlas, and Volta AI agents. Project-level API key required.</p>
            <div className="relative">
              <input 
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs md:text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500/50 shadow-inner"
              />
              <button 
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <div className="flex items-center gap-2">
               <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">ENCRYPTED</div>
               <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Verified: 2025-02-14 14:32</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notifications */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                 <Bell className="w-5 h-5 text-indigo-400" />
               </div>
               <h3 className="font-bold text-white uppercase tracking-tight text-sm">System Alerts</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Thermal Anomalies', desc: 'Hardware level diagnostics' },
                { label: 'Market Volatility', desc: 'Trading strategy alerts' },
                { label: 'Network Health', desc: 'SCADA connectivity loss' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div>
                    <p className="text-xs md:text-sm font-bold text-slate-200">{item.label}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{item.desc}</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white shadow-inner"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Localization */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
                 <Globe className="w-5 h-5 text-sky-400" />
               </div>
               <h3 className="font-bold text-white uppercase tracking-tight text-sm">Localization</h3>
            </div>
            <div className="space-y-5">
               <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Primary Language</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-300 focus:outline-none focus:border-sky-500/50">
                    <option>English (Global)</option>
                    <option>Romanian (Market)</option>
                    <option>German (EU)</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Data Precision</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-300 focus:outline-none focus:border-sky-500/50">
                    <option>Scientific (0.0001)</option>
                    <option>Standard (0.01)</option>
                    <option>Integer (0)</option>
                  </select>
               </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-white hover:bg-slate-800 transition-all uppercase tracking-widest">
            Discard
          </button>
          <button className="px-8 py-3 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-xl shadow-amber-500/10 hover:bg-amber-400 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </div>
      <div className="h-4 md:hidden" />
    </div>
  );
};