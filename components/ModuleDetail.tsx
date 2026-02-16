
import React, { useState } from 'react';
import { Module, Priority } from '../types';
import { X, ExternalLink, Copy, Terminal, PlayCircle, Sparkles, Wand2, RefreshCw, LayoutDashboard, MapPin, Search, Globe, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { analyzeModuleAction, findSolarParkLocation } from '../services/geminiService';
import { GeminiService } from '../services/ai/gemini.service';

// Import Specific Module Implementations
import { ModuleSimulator } from './ModuleSimulator'; // Testing & Audit Engine
import { MOD06_Weather } from './modules/MOD06_Weather';
import { UniversalModule } from './modules/UniversalModule';
import { PerformanceBenchmarking } from './PerformanceBenchmarking'; // MOD-11
import { PredictiveMaintenance } from './PredictiveMaintenance'; // MOD-12

interface ModuleDetailProps {
  module: Module;
  onClose: () => void;
}

export const ModuleDetail: React.FC<ModuleDetailProps> = ({ module, onClose }) => {
  const [activeView, setActiveView] = useState<'overview' | 'test' | 'ai'>('test'); 
  const [aiGoal, setAiGoal] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Site Context State
  const [coords, setCoords] = useState({ lat: '44.4268', lon: '26.1025' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [siteVisual, setSiteVisual] = useState<string | null>(null);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [siteDescription, setSiteDescription] = useState<string>('');
  
  // New state to pass to simulator
  const [customLocation, setCustomLocation] = useState<{name: string, lat: number, lon: number} | null>(null);

  const geminiImageService = new GeminiService();

  const handleAiAnalysis = async () => {
    if (!aiGoal.trim()) return;
    setIsAiLoading(true);
    // User requested gemini-3-pro-preview with 32768 thinking budget
    const ai = new (await import('@google/genai')).GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Architectural directive for ${module.title}: ${aiGoal}`,
        config: { 
          thinkingConfig: { thinkingBudget: 32768 },
          systemInstruction: "You are SMART HELIOS PhD Architect. Provide deep technical blueprints, JSON schemas, and safety protocols for solar management modules."
        }
      });
      setAiResponse(response.text);
    } catch (e) {
      setAiResponse("Analysis module temporarily decoupled.");
    }
    setIsAiLoading(false);
  };

  const handleProjectSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSiteVisual(null);
    setCustomLocation(null);
    
    const result = await findSolarParkLocation(searchQuery);
    
    if (result.found) {
        setCoords({ lat: result.lat.toString(), lon: result.lon.toString() });
        setSiteDescription(result.description);
        
        // Update context for simulator
        setCustomLocation({
            name: result.name || searchQuery,
            lat: result.lat,
            lon: result.lon
        });

        // Auto-generate visual if found
        handleGenerateVisual(result.lat, result.lon, result.description, result.name);
    } else {
        alert("Project not found. Try identifying by nearest city.");
    }
    setIsSearching(false);
  };

  const handleGenerateVisual = async (lat: number | string, lon: number | string, desc?: string, name?: string) => {
      setIsGeneratingVisual(true);
      try {
          const prompt = `Satellite-style high-resolution aerial view of a solar PV park named ${name || 'Solar Asset'} located at coordinates ${lat}, ${lon}. 
          Visual context: ${desc || 'Large scale industrial solar farm, modern photovoltaic panels arranged in rows on flat terrain, surrounded by green fields.'}. 
          Cinematic lighting, hyper-realistic, 4k detail.`;
          
          const imageUrl = await geminiImageService.generateImage(prompt, "1K", "16:9");
          setSiteVisual(imageUrl);
      } catch (e) {
          console.error("Visual gen failed", e);
      } finally {
          setIsGeneratingVisual(false);
      }
  };

  const priorityColor = {
    [Priority.CRITICAL]: 'text-red-400 bg-red-400/10 border-red-400/20',
    [Priority.ESSENTIAL]: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    [Priority.ADVANCED]: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    [Priority.INNOVATIVE]: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    [Priority.FUTURE]: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  };

  // Router for Module Views
  const renderModuleContent = () => {
    switch (module.number) {
      // Use ModuleSimulator for core modules to enable Test Sequences & Audits
      case 1: // VPP Orchestrator
      case 2: // Frequency Regulation
      case 3: // Thermal Anomaly
      case 4: // Satellite Soiling
      case 5: // AI Anomaly Detection
        return <ModuleSimulator module={module} customLocation={customLocation} />;
        
      case 6: return <MOD06_Weather />;
      case 11: return <PerformanceBenchmarking />;
      case 12: return <PredictiveMaintenance />;
      default: return <UniversalModule module={module} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-slate-950 border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header Section */}
        <div className="flex-shrink-0 bg-slate-900/50 border-b border-slate-800">
          <div className="p-6 pb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityColor[module.priority]}`}>
                  {module.priority}
                </span>
                <span className="text-slate-500 font-mono text-xs">MOD-{module.number.toString().padStart(2, '0')}</span>
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight">{module.title}</h2>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 flex gap-6 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setActiveView('test')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeView === 'test' ? 'text-white border-amber-500' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <PlayCircle className="w-4 h-4" /> Live Interface
            </button>
            <button 
              onClick={() => setActiveView('overview')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeView === 'overview' ? 'text-white border-amber-500' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Technical Specs
            </button>
            <button 
              onClick={() => setActiveView('ai')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeView === 'ai' ? 'text-white border-amber-500' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" /> AI Architect
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 p-6 md:p-8 space-y-6">
          
          {/* --- GLOBAL SITE CONTEXT BAR (Added per Request) --- */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
             <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest">
                   <MapPin className="w-4 h-4" /> Site Localization
                </div>
                {siteVisual && (
                   <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono uppercase bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" /> Visual Verified
                   </span>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search Input */}
                <div className="md:col-span-5 relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Search className="w-4 h-4" /></div>
                   <input 
                      type="text" 
                      placeholder="Search live project (e.g. Parcul Solar Ucea)" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleProjectSearch()}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                   />
                   {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><RefreshCw className="w-3 h-3 text-amber-500 animate-spin" /></div>}
                </div>

                {/* Coords Input */}
                <div className="md:col-span-2 relative">
                   <input 
                      type="text" 
                      value={coords.lat} 
                      onChange={(e) => setCoords({...coords, lat: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:border-amber-500 focus:outline-none text-center"
                      placeholder="Lat"
                   />
                </div>
                <div className="md:col-span-2 relative">
                   <input 
                      type="text" 
                      value={coords.lon} 
                      onChange={(e) => setCoords({...coords, lon: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:border-amber-500 focus:outline-none text-center"
                      placeholder="Lon"
                   />
                </div>

                {/* Actions */}
                <div className="md:col-span-3 flex gap-2">
                   <button 
                      onClick={handleProjectSearch}
                      disabled={isSearching}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold uppercase transition-all"
                   >
                      Locate
                   </button>
                   <button 
                      onClick={() => handleGenerateVisual(coords.lat, coords.lon, siteDescription)}
                      disabled={isGeneratingVisual}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1"
                   >
                      {isGeneratingVisual ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                      Visual
                   </button>
                </div>
             </div>

             {/* Generated Visual Display */}
             {siteVisual && (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-700 group animate-in fade-in slide-in-from-top-2">
                   <img src={siteVisual} alt="AI Generated Site" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                   <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[9px] text-white font-mono flex items-center gap-1">
                      <Globe className="w-3 h-3 text-amber-500" />
                      AI WORKBENCH: {coords.lat}, {coords.lon}
                   </div>
                </div>
             )}
          </div>

          {activeView === 'test' && renderModuleContent()}

          {activeView === 'ai' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-indigo-950/10 border border-indigo-500/20 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Sparkles className="w-32 h-32 text-indigo-500" />
                </div>
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-xs relative z-10">
                  <Wand2 className="w-4 h-4 text-indigo-400" /> AI Recalibration Goal
                </h3>
                <div className="flex gap-2 relative z-10">
                  <input 
                    type="text" 
                    placeholder="e.g. Optimize for sub-90ms frequency response..."
                    className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none text-sm"
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiAnalysis()}
                  />
                  <button 
                    disabled={isAiLoading}
                    onClick={handleAiAnalysis}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {aiResponse && (
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-3 h-3" /> Technical Directive
                    </span>
                  </div>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'overview' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Module Description</h3>
                <p className="text-slate-200 leading-relaxed text-lg font-light">{module.description}</p>
              </section>

              <section className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Financial Impact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(module.financialImpact).map(([key, value]) => (
                    <div key={key} className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">{key}</span>
                      <p className="text-emerald-400 font-mono text-lg font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
