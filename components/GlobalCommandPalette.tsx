import React, { useState, useEffect } from 'react';
import { Search, Command, Sparkles, ArrowRight, X, Zap, Server, Shield } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';

export const GlobalCommandPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // If not open, parent should open it. 
        // For simplicity here, we assume it's controlled by parent.
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setAnswer(null);
    try {
      const res = await sendMessageToGemini(query, [], 'atlas', 'gemini-3-flash-preview');
      setAnswer(res);
    } catch (e) {
      setAnswer("Search engine unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center gap-4">
          <div className="bg-amber-500/20 p-2 rounded-xl">
            <Search className="w-6 h-6 text-amber-500" />
          </div>
          <input 
            autoFocus
            type="text" 
            placeholder="Ask AI anything about the 47 modules..."
            className="flex-1 bg-transparent border-none text-xl text-white placeholder-slate-600 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Scanning Intelligence Modules...</p>
            </div>
          ) : answer ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[10px] tracking-widest">
                <Sparkles className="w-3 h-3" /> Helios Response
              </div>
              <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap bg-slate-800/40 p-5 rounded-2xl border border-slate-700">
                {answer}
              </div>
              <div className="flex justify-end">
                <button onClick={() => { setQuery(''); setAnswer(null); }} className="text-xs text-amber-500 hover:underline">Clear and search again</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Summarize MOD-01', icon: Zap },
                { label: 'Audit API Security', icon: Shield },
                { label: 'Check VPP Capacity', icon: Server },
                { label: 'Simulate ROI', icon: ArrowRight },
              ].map((suggestion) => (
                <button 
                  key={suggestion.label}
                  onClick={() => { setQuery(suggestion.label); }}
                  className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700 transition-all text-left group"
                >
                  <suggestion.icon className="w-5 h-5 text-slate-500 group-hover:text-amber-500" />
                  <span className="text-sm text-slate-400 group-hover:text-white font-medium">{suggestion.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-slate-800/50 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <span className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600">ENTER</span> to search
            <span className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600 ml-2">ESC</span> to close
          </div>
          <div className="flex items-center gap-1 text-[10px] text-amber-500/60 font-bold uppercase">
            Powered by Gemini 3 Flash
          </div>
        </div>
      </div>
    </div>
  );
};