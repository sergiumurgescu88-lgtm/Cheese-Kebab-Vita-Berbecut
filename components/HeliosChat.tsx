
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Code, FileText, Paperclip, Mic, X, StopCircle, Image as ImageIcon, File as FileIcon, Trash2, ScrollText, Info, Gavel, FileCheck, Lightbulb, Map, Wind, Download, MapPin, FileCode } from 'lucide-react';
import { sendMessageToGemini, Attachment } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as mammoth from 'mammoth';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  attachments?: { type: 'image' | 'audio' | 'pdf' | 'word' | 'file', url?: string, name?: string }[];
  isReport?: boolean;
}

const HISTORY_KEY = 'helio_sf_chat_history';

interface HeliosChatProps {
  setActiveTab: (tab: string) => void;
}

export const HeliosChat: React.FC<HeliosChatProps> = ({ setActiveTab }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
      } catch (e) { console.error(e); }
    }
    return [{ role: 'assistant', text: "Salut. Sunt SMART RENOWABLE, expertul tău în HG 907/2016. Să generăm SF-ul tău de impact astăzi.", timestamp: new Date() }];
  });
  const [input, setInput] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiModel, setAiModel] = useState<'gemini' | 'kimi' | 'qwen' | 'glm5' | 'deepseek'>('qwen');
  const [isRecording, setIsRecording] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages)); }, [messages]);

  const clearHistory = () => {
    if (window.confirm('Reset SMART RENOWABLE SF session?')) {
      setMessages([{ role: 'assistant', text: "Salut. Sunt SMART RENOWABLE. Gata pentru un nou studiu de fezabilitate.", timestamp: new Date() }]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = e => reject(e);
    });
  };

  const generatePDF = (text: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Helper for Header on every page
    const addHeader = (pdf: jsPDF) => {
      pdf.setFillColor(5, 16, 16); // Very Dark Teal
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      // Electric Blue Accent Line
      pdf.setDrawColor(0, 212, 255);
      pdf.setLineWidth(1);
      pdf.line(0, 35, pageWidth, 35);
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('Smart Renowable Energy', margin, 18);
      pdf.setFontSize(9);
      pdf.setTextColor(0, 212, 255);
      pdf.text('HELIOS SF EXPERT ENGINE | HG 907/2016 & GHID 2025 COMPLIANT', margin, 28);
    };

    addHeader(doc);
    
    // Content
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    
    const splitText = doc.splitTextToSize(text, contentWidth);
    let cursorY = 45;
    const lineHeight = 7;

    for (let i = 0; i < splitText.length; i++) {
      if (cursorY > pageHeight - 25) {
        doc.addPage();
        addHeader(doc);
        cursorY = 45;
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(11);
      }
      doc.text(splitText[i], margin, cursorY);
      cursorY += lineHeight;
    }
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Bottom Accent
      doc.setDrawColor(0, 212, 255, 0.3);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Document generat automat de HELIO SF Expert | Data: ${new Date().toLocaleDateString()} | Pagina ${i} din ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    doc.save(`SF_Smart_Renowable_${new Date().getTime()}.pdf`);
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: `🎤 Instrucțiune Audio SF ${lat && lon ? `(Locație: ${lat}, ${lon})` : ''}`, timestamp: new Date(), attachments: [{ type: 'audio' }] }]);
    try {
        const base64 = await fileToBase64(audioBlob);
        const contextMsg = lat && lon ? `Locație: Lat ${lat}, Lon ${lon}. ` : "";
        
        let response;
        if (aiModel === 'gemini') {
          response = await sendMessageToGemini(contextMsg, [{ mimeType: audioBlob.type, data: base64 }], 'sf_expert');
        } else {
          const { callNvidiaAI } = await import('../services/geminiService');
          response = await callNvidiaAI(aiModel, contextMsg || "Audio processed (text context only)", 'sf_expert', [{ mimeType: audioBlob.type, data: base64 }]);
        }
        
        setMessages(prev => [...prev, { role: 'assistant', text: response, timestamp: new Date(), isReport: true }]);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder; audioChunksRef.current = [];
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => { handleSendAudio(new Blob(audioChunksRef.current, { type: 'audio/webm' })); stream.getTracks().forEach(t => t.stop()); };
      mediaRecorder.start(); setIsRecording(true);
    } catch (e) { alert("Mic denied"); }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    const currentInput = input; const currentFile = selectedFile;
    const currentLat = lat; const currentLon = lon;
    
    setInput(''); setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const uiAtts: any[] = [];
    if (currentFile) {
      let type: 'image' | 'audio' | 'pdf' | 'word' | 'file' = 'file';
      if (currentFile.type.startsWith('image')) type = 'image';
      else if (currentFile.type === 'application/pdf') type = 'pdf';
      else if (currentFile.type.includes('word') || currentFile.name.endsWith('.docx') || currentFile.name.endsWith('.doc')) type = 'word';
      
      uiAtts.push({ 
        type, 
        name: currentFile.name, 
        url: currentFile.type.startsWith('image') ? URL.createObjectURL(currentFile) : undefined 
      });
    }

    const displayInput = currentLat && currentLon 
      ? `${currentInput}\n[Locație: ${currentLat}, ${currentLon}]`
      : currentInput;

    setMessages(prev => [...prev, { role: 'user', text: displayInput, timestamp: new Date(), attachments: uiAtts }]);
    setIsLoading(true);
    try {
        const atts: Attachment[] = [];
        let finalPrompt = currentLat && currentLon 
          ? `LOCAȚIE GPS: Lat ${currentLat}, Lon ${currentLon}\n\n${currentInput}`
          : currentInput;

        // FORCE Gemini for file analysis as requested
        const effectiveModel = currentFile ? 'gemini' : aiModel;

        if (currentFile) {
          console.log(`Processing file: ${currentFile.name} (${currentFile.type})`);
          if (currentFile.type === 'application/pdf' || currentFile.type.startsWith('image/')) {
            atts.push({ mimeType: currentFile.type, data: await fileToBase64(currentFile) });
          } else if (currentFile.type.includes('word') || currentFile.name.endsWith('.docx') || currentFile.name.endsWith('.doc')) {
            // Try text extraction for Word files to ensure all models can "see" the content
            try {
              const arrayBuffer = await currentFile.arrayBuffer();
              const result = await mammoth.extractRawText({ arrayBuffer });
              if (result.value) {
                console.log(`Extracted text from Word file: ${result.value.substring(0, 100)}...`);
                finalPrompt = `[CONTINUT DOCUMENT WORD: ${currentFile.name}]\n${result.value}\n\n[INSTRUCTIUNE UTILIZATOR]\n${finalPrompt}`;
              } else {
                console.warn("Mammoth returned empty text, sending as binary");
                atts.push({ mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', data: await fileToBase64(currentFile) });
              }
            } catch (err) {
              console.warn("Mammoth extraction failed, sending as binary", err);
              atts.push({ mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', data: await fileToBase64(currentFile) });
            }
          } else {
            // Fallback for other files
            if (currentFile.size < 2 * 1024 * 1024) { // 2MB limit for unknown files
               atts.push({ mimeType: currentFile.type || 'application/octet-stream', data: await fileToBase64(currentFile) });
            }
          }
        }

        let res;
        if (effectiveModel === 'gemini') {
          // Use gemini-3.1-pro-preview for complex analysis of files
          res = await sendMessageToGemini(finalPrompt, atts, 'sf_expert', 'gemini-3.1-pro-preview');
        } else {
          const { callNvidiaAI } = await import('../services/geminiService');
          res = await callNvidiaAI(effectiveModel as any, finalPrompt, 'sf_expert', atts);
        }
        
        setMessages(prev => [...prev, { role: 'assistant', text: res, timestamp: new Date(), isReport: true }]);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const capabilities = [
    { title: "HG 907 Compliance", icon: Gavel, desc: "Legal rigour in SF drafting" },
    { title: "Ghid Autoconsum 2025", icon: FileCheck, desc: "Modernization Fund (FM) Rules" },
    { title: "Anexa 4 Engine", icon: ScrollText, desc: "Automated structure generation" },
    { title: "Generative Design", icon: Lightbulb, desc: "Hybrid & dual-use optimization" },
    { title: "Site Assessment", icon: Map, desc: "GPS & geo-tech data synthesis" },
    { title: "Climate Modeling", icon: Wind, desc: "30-year risk & yield forecasting" }
  ];

  return (
    <div className="flex h-full gap-4 md:gap-6 animate-in fade-in duration-500 relative overflow-hidden border-x border-slate-800">
      <div className="flex-1 flex flex-col bg-[#051010] border-r border-teal-900/30 overflow-hidden relative shadow-2xl">
        <div className="bg-[#0a1a1a]/95 backdrop-blur p-3 md:p-4 border-b border-teal-800/50 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-teal-900/30 p-1.5 md:p-2 rounded-xl border border-teal-500/30"><ScrollText className="w-5 h-5 md:w-6 h-6 text-teal-400" /></div>
            <div>
              <h2 className="text-white font-bold tracking-wide flex items-center gap-2 text-xs md:text-base">HELIO SF Expert <span className="hidden sm:inline px-2 py-0.5 rounded text-[9px] bg-teal-950 text-teal-300 border border-teal-700/50 font-mono">HG 907</span></h2>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-teal-400/70 font-mono uppercase tracking-tighter">Technical & Legal Synthesis</p>
                <span className="w-1 h-1 rounded-full bg-teal-800"></span>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }} className="text-[9px] text-amber-500/80 hover:text-amber-400 font-bold uppercase tracking-tight underline underline-offset-2">Upgrade Limits</a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <select 
              value={aiModel} 
              onChange={(e) => setAiModel(e.target.value as any)}
              className="bg-teal-950 border border-teal-800 text-teal-300 text-[10px] rounded-lg px-2 py-1 focus:outline-none focus:border-teal-500 font-mono"
            >
              <option value="gemini">Gemini 3 Pro</option>
              <option value="deepseek">DeepSeek V3.2</option>
              <option value="qwen">Qwen 3.5 397B</option>
              <option value="kimi">Kimi K2.5</option>
              <option value="glm5">GLM-5 Thinking</option>
            </select>
            <button onClick={() => setShowMobileInfo(!showMobileInfo)} className="xl:hidden p-2 hover:bg-teal-900/30 rounded-lg text-teal-500">{showMobileInfo ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}</button>
            <button onClick={clearHistory} className="p-2 hover:bg-teal-900/30 rounded-lg text-teal-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#051010] custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${msg.role === 'user' ? 'bg-slate-800 border-slate-600' : 'bg-teal-900/20 border-teal-500/30 shadow-inner'}`}>{msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-teal-300" />}</div>
              <div className={`px-4 py-3 rounded-xl max-w-[85%] text-xs md:text-sm shadow-lg relative group ${msg.role === 'user' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-[#0a2020] text-teal-50 border border-teal-900/50'}`}>
                {msg.attachments?.map((att, i) => (
                  <div key={i} className="mb-2">
                    {att.type === 'audio' && <div className="flex items-center gap-2 text-teal-400 text-[10px] italic"><Mic className="w-3 h-3" /> Audio Attached</div>}
                    {att.type === 'image' && att.url && <img src={att.url} className="max-w-xs rounded-lg" />}
                    {att.type === 'pdf' && <div className="flex items-center gap-2 text-teal-400 text-[10px] italic"><FileText className="w-3 h-3" /> PDF: {att.name}</div>}
                    {att.type === 'word' && <div className="flex items-center gap-2 text-teal-400 text-[10px] italic"><FileCode className="w-3 h-3" /> Word: {att.name}</div>}
                    {att.type === 'file' && <div className="flex items-center gap-2 text-teal-400 text-[10px] italic"><Paperclip className="w-3 h-3" /> File: {att.name}</div>}
                  </div>
                ))}
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.role === 'assistant' && msg.isReport && (
                  <button 
                    onClick={() => generatePDF(msg.text)}
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-[10px] uppercase font-bold transition-all"
                  >
                    <Download className="w-3 h-3" /> Export PDF Report
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex gap-4"><div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-900/20 border border-teal-500/30 flex items-center justify-center"><Bot className="w-4 h-4 text-teal-300" /></div><div className="bg-[#0a2020] border border-teal-900/50 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg"><Sparkles className="w-4 h-4 text-teal-400 animate-spin" /><span className="text-[10px] text-teal-300 font-mono uppercase tracking-widest">HG 907 Processing...</span></div></div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 md:p-6 bg-[#0a1a1a] border-t border-teal-900/50 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Top Row: GPS & File Status */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-teal-500 group-focus-within:text-teal-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    value={lat} 
                    onChange={e => setLat(e.target.value)} 
                    placeholder="Latitudine (ex: 44.4268)" 
                    className="w-full bg-[#051313] border border-teal-900/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-teal-50 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 font-mono transition-all"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-teal-500 group-focus-within:text-teal-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    value={lon} 
                    onChange={e => setLon(e.target.value)} 
                    placeholder="Longitudine (ex: 26.1025)" 
                    className="w-full bg-[#051313] border border-teal-900/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-teal-50 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 font-mono transition-all"
                  />
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 px-3 py-2 bg-teal-500/10 border border-teal-500/30 rounded-xl animate-in zoom-in duration-300">
                  <FileIcon className="w-4 h-4 text-teal-400" />
                  <span className="text-[10px] font-bold text-teal-200 truncate max-w-[150px]">{selectedFile.name}</span>
                  <button onClick={removeFile} className="p-1 hover:bg-teal-500/20 rounded-full text-teal-400 hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Row: Main Controls */}
            <div className="flex flex-wrap md:flex-nowrap items-end gap-3">
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex flex-col items-center justify-center gap-1 px-3 md:px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 transition-all group min-w-[70px] md:min-w-[80px]"
                  title="Încarcă Document SF"
                >
                  <Paperclip className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Atașează</span>
                </button>
                
                <button 
                  onClick={isRecording ? () => {if(mediaRecorderRef.current) mediaRecorderRef.current.stop(); setIsRecording(false);} : startRecording} 
                  className={`flex flex-col items-center justify-center gap-1 px-3 md:px-4 py-3 rounded-2xl border transition-all min-w-[70px] md:min-w-[80px] ${
                    isRecording 
                      ? 'bg-red-900/40 border-red-500 text-red-400 animate-pulse' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  title="Înregistrare Audio"
                >
                  {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  <span className="text-[9px] font-black uppercase tracking-tighter">{isRecording ? 'Stop' : 'Audio'}</span>
                </button>
              </div>

              <div className="flex-1 relative min-w-[200px] w-full">
                <textarea 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }} 
                  placeholder="Descrie cerințele SF sau încarcă un model..." 
                  className="w-full bg-[#051313] border border-teal-900/50 focus:border-teal-500 rounded-2xl pl-4 pr-14 py-4 text-sm text-teal-50 focus:outline-none transition-all font-mono shadow-inner min-h-[64px] max-h-[200px] resize-none"
                />
                <button 
                  onClick={handleSend} 
                  disabled={isLoading || (!input.trim() && !selectedFile)} 
                  className="absolute right-3 bottom-3 p-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-teal-900/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx,image/*" onChange={e => {if(e.target.files) setSelectedFile(e.target.files[0])}} className="hidden" />
          </div>
        </div>
      </div>
      <div className={`absolute inset-0 z-20 bg-[#051010] p-4 overflow-y-auto transition-transform duration-300 xl:relative xl:transform-none xl:w-80 xl:bg-transparent xl:p-0 xl:flex xl:flex-col xl:gap-4 xl:overflow-y-auto xl:pr-2 custom-scrollbar ${showMobileInfo ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-6 xl:hidden"><div className="flex items-center gap-2"><div className="bg-teal-500/20 p-2 rounded-lg"><ScrollText className="w-5 h-5 text-teal-400" /></div><h3 className="text-teal-400 font-bold text-lg">Capabilities</h3></div><button onClick={() => setShowMobileInfo(false)} className="text-slate-500"><X className="w-6 h-6" /></button></div>
        <div className="bg-teal-950/30 border border-teal-900/50 p-4 rounded-xl mb-4 xl:mb-0 shadow-inner"><h3 className="text-teal-400 font-bold text-[10px] mb-1 uppercase tracking-widest">SF Core</h3><p className="text-[10px] text-teal-600 font-mono">HG 907 EXPERT ACTIVE</p></div>
        <div className="flex flex-col gap-3 pb-10 xl:pb-0">{capabilities.map((cap, idx) => (<div key={idx} className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl group hover:bg-[#0a2020] transition-all shadow-sm"><div className="flex items-start gap-3"><div className="p-2 rounded-lg bg-slate-800 group-hover:text-teal-400 text-slate-400"><cap.icon className="w-5 h-5" /></div><div><h4 className="text-slate-200 font-bold text-xs uppercase">{cap.title}</h4><p className="text-[10px] text-slate-500 mt-1">{cap.desc}</p></div></div></div>))}</div>
      </div>
    </div>
  );
};
