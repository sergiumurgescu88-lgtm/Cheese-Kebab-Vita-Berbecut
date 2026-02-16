
import React, { useState, useRef } from 'react';
import { GeminiService } from '../services/ai/gemini.service';
import { 
  Sparkles, Image as ImageIcon, Wand2, Search, Download, 
  Trash2, RefreshCw, Layers, Maximize, Cpu, Send, Upload,
  AlertCircle, AspectRatio
} from 'lucide-react';

export const AIImageWorkbench: React.FC = () => {
  const [mode, setMode] = useState<'generate' | 'edit' | 'analyze'>('generate');
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{base64: string, mime: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const gemini = new GeminiService();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ratios = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResultImage(null);
    try {
      const url = await gemini.generateImage(prompt, imageSize, aspectRatio);
      setResultImage(url);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFile({
          base64: (reader.result as string).split(',')[1],
          mime: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    setLoading(true);
    setError(null);
    setAnalysisText(null);
    try {
      const res = await gemini.analyzeImage(uploadedFile.base64, uploadedFile.mime, prompt || "Analyze this solar infrastructure image for defects.");
      setAnalysisText(res || null);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!uploadedFile) return;
    setLoading(true);
    setError(null);
    setResultImage(null);
    try {
      const url = await gemini.editImage(uploadedFile.base64, uploadedFile.mime, prompt);
      setResultImage(url);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Edit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-4 md:p-8 space-y-6 overflow-y-auto custom-scrollbar bg-[#020617]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-500" />
            AI IMAGE WORKBENCH
          </h2>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">powered by gemini 3 pro & nano banana</p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
          {(['generate', 'edit', 'analyze'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResultImage(null); setAnalysisText(null); setError(null); }}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-amber-500 text-slate-950' : 'text-slate-500 hover:text-white'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INPUT PANEL */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
            {(mode === 'edit' || mode === 'analyze') && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition-all overflow-hidden relative group"
              >
                {uploadedFile ? (
                  <img src={`data:${uploadedFile.mime};base64,${uploadedFile.base64}`} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                ) : (
                  <div className="flex flex-col items-center text-slate-600">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-bold uppercase">Upload Source</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <p className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full">Change Image</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                {mode === 'generate' ? 'Creation Prompt' : mode === 'edit' ? 'Edit Instruction' : 'Analysis Context'}
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'generate' ? "A futuristic solar city with green hydrogen drones..." : 
                  mode === 'edit' ? "Add a retro filter, remove the background..." :
                  "Describe the structural integrity of these panels..."
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-amber-500 focus:outline-none min-h-[120px] resize-none"
              />
            </div>

            {mode === 'generate' && (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Output Fidelity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1K', '2K', '4K'] as const).map(s => (
                      <button 
                        key={s}
                        onClick={() => setImageSize(s)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${imageSize === s ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Aspect Ratio</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ratios.map(r => (
                      <button 
                        key={r}
                        onClick={() => setAspectRatio(r)}
                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${aspectRatio === r ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button 
              disabled={loading || (!prompt && mode === 'generate') || (!uploadedFile && (mode === 'edit' || mode === 'analyze'))}
              onClick={mode === 'generate' ? handleGenerate : mode === 'edit' ? handleEdit : handleAnalyze}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-900/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : mode === 'generate' ? <ImageIcon className="w-5 h-5" /> : mode === 'edit' ? <Wand2 className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              {loading ? 'Processing...' : `Run ${mode === 'analyze' ? 'Reasoning' : 'GenAI'}`}
            </button>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                   <Cpu className="w-4 h-4 text-indigo-400" />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Nano Banana Edge</h4>
             </div>
             <p className="text-[10px] text-slate-500 leading-relaxed uppercase">
                Simulated Edge Node Active.
                <br/>
                Local radiometric pre-processing enabled.
             </p>
          </div>
        </div>

        {/* RESULT PANEL */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden min-h-[600px] flex flex-col relative shadow-2xl">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                  <Sparkles className="w-8 h-8 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">
                  {mode === 'analyze' ? 'Thinking (Budget: 32k)...' : 'Synthesizing Pixels...'}
                </p>
              </div>
            ) : resultImage ? (
              <div className="flex-1 relative group bg-black flex items-center justify-center">
                <img src={resultImage} className="max-w-full max-h-full object-contain" />
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                   <a href={resultImage} download={`helios_gen_${Date.now()}.png`} className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl border border-white/10 text-white cursor-pointer">
                      <Download className="w-5 h-5" />
                   </a>
                   <button onClick={() => setResultImage(null)} className="p-3 bg-red-500/20 backdrop-blur-md hover:bg-red-500/40 rounded-2xl border border-red-500/20 text-red-500">
                      <Trash2 className="w-5 h-5" />
                   </button>
                </div>
                <div className="absolute bottom-6 left-6 bg-slate-950/80 backdrop-blur border border-slate-800 px-4 py-2 rounded-xl text-[10px] font-black text-amber-500 uppercase tracking-widest">
                   {mode} Complete | {imageSize}
                </div>
              </div>
            ) : analysisText ? (
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                 <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <Maximize className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-white uppercase tracking-widest text-lg">Structural Analysis Report</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Gemini 3 Pro Thinking Protocol</p>
                    </div>
                 </div>
                 <div className="prose prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap font-mono text-slate-300 leading-relaxed">
                      {analysisText}
                    </div>
                 </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-700 p-8 text-center">
                 <div className="p-8 bg-slate-950 rounded-full border border-slate-800 mb-6 shadow-inner">
                    <ImageIcon className="w-16 h-16 opacity-20" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-600 uppercase tracking-widest">Workbench Ready</h3>
                 <p className="text-xs mt-2 max-w-sm">
                   Select a mode on the left to begin. Generate new assets, edit existing ones, or perform deep technical analysis.
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
