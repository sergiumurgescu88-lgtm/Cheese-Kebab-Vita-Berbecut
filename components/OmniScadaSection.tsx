import React, { useState, useRef, useEffect } from 'react';
import { 
  Monitor, Unlock, Layers, Database, Zap, 
  TrendingUp, Briefcase, Bell, FileText, RefreshCw,
  Send, Bot, User, Cpu, Activity, Trash2, Info, X, Paperclip, Mic, StopCircle, FileIcon, FileCode, CheckCircle2, Plus, ChevronDown
} from 'lucide-react';
import { sendMessageToGemini, Attachment } from '../services/geminiService';
import * as mammoth from 'mammoth';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  attachments?: { type: 'image' | 'audio' | 'pdf' | 'word' | 'file', name?: string }[];
}

const HISTORY_KEY = 'omni_scada_chat_history';

export const OmniScadaSection: React.FC = () => {
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [aiModel, setAiModel] = useState<'gemini' | 'kimi' | 'qwen' | 'glm5' | 'deepseek'>('qwen');
  const [sectiune, setSectiune] = useState<'chat' | 'ticketing'>('chat');
  type TicketStatus = 'Deschis' | 'Atribuit' | 'In Lucru' | 'Rezolvat' | 'Verificat';
  type TicketPriority = 'Critic' | 'Major' | 'Minor';
  interface Ticket { id: string; titlu: string; parc: string; judet: string; prioritate: TicketPriority; status: TicketStatus; echipa: string; creatLa: string; descriere: string; }
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 'TKT-001', titlu: 'Drop productie >15% - String 3', parc: 'Cazanesti', judet: 'Ialomita', prioritate: 'Critic', status: 'In Lucru', echipa: 'O&M Sud', creatLa: '2026-04-30 06:12', descriere: 'Productie string 3 la 82% fata de expected. Delta T +18C.' },
    { id: 'TKT-002', titlu: 'Invertor offline - ID INV-07', parc: 'Mircea Voda', judet: 'Constanta', prioritate: 'Critic', status: 'Atribuit', echipa: 'O&M Est', creatLa: '2026-04-30 07:45', descriere: 'Invertor INV-07 offline de 2h. Fara comunicatie Modbus.' },
    { id: 'TKT-003', titlu: 'Soiling index >12% - Sector B', parc: 'Babadag', judet: 'Tulcea', prioritate: 'Major', status: 'Deschis', echipa: 'Necunoscut', creatLa: '2026-04-30 08:00', descriere: 'Analiza satelit indica acumulare praf. Curatare programata necesara.' },
    { id: 'TKT-004', titlu: 'Alerta degradare panou - Lot 12', parc: 'Simleu Silvaniei', judet: 'Salaj', prioritate: 'Minor', status: 'Rezolvat', echipa: 'O&M Nord', creatLa: '2026-04-29 14:30', descriere: 'Degradare 0.8%/an detectata. Inlocuire planificata.' },
    { id: 'TKT-005', titlu: 'Temperatura cablu DC anormala', parc: 'Zorleni', judet: 'Vaslui', prioritate: 'Major', status: 'Verificat', echipa: 'O&M Est', creatLa: '2026-04-28 11:20', descriere: 'Temperatura cablu DC a depasit 85C. Conexiune refacuta.' },
  ]);
  const [filtruStatus, setFiltruStatus] = useState<TicketStatus | 'Toate'>('Toate');
  const [ticketSelectat, setTicketSelectat] = useState<Ticket | null>(null);
  const statusColors: Record<TicketStatus, string> = {
    'Deschis': 'bg-red-500/10 text-red-400 border-red-500/30',
    'Atribuit': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'In Lucru': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Rezolvat': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Verificat': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };
  const prioritateColors: Record<TicketPriority, string> = { 'Critic': 'text-red-400', 'Major': 'text-amber-400', 'Minor': 'text-slate-400' };
  const avanseazaStatus = (ticket: Ticket) => {
    const flow: TicketStatus[] = ['Deschis', 'Atribuit', 'In Lucru', 'Rezolvat', 'Verificat'];
    const idx = flow.indexOf(ticket.status);
    if (idx < flow.length - 1) {
      const next = flow[idx + 1];
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: next } : t));
      setTicketSelectat(prev => prev && prev.id === ticket.id ? { ...prev, status: next } : prev);
    }
  };
  const ticketsFiltrate = filtruStatus === 'Toate' ? tickets : tickets.filter(t => t.status === filtruStatus);
  
  const superpowers = [
    { title: "Unified View", icon: Monitor, desc: "Single window for Solar, Wind, BESS" },
    { title: "OEM Independence", icon: Unlock, desc: "Total control over your data" },
    { title: "Multi-brand", icon: Layers, desc: "Integrate 300+ asset types" },
    { title: "Data Normalization", icon: Database, desc: "Single source of truth" },
    { title: "Real-time Control", icon: Zap, desc: "Actionable bi-directional control" },
    { title: "Predictive Maint.", icon: TrendingUp, desc: "Advanced analytics & forecasting" },
    { title: "Trader Access", icon: Briefcase, desc: "Direct market gateway" },
    { title: "Smart Alarms", icon: Bell, desc: "Reduced noise, historical context" },
    { title: "Auto Reporting", icon: FileText, desc: "Automated compliance reports" },
    { title: "Retrofit", icon: RefreshCw, desc: "Modernize legacy assets" }
  ];

  // --- Chat Logic ---
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
      } catch (e) { console.error(e); }
    }
    return [{ role: 'assistant', text: "OMNI-SCADA Online. Unified Control Platform ready. What is your operational challenge?", timestamp: new Date() }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages)); }, [messages]);

  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = e => reject(e);
    });
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    const currentInput = input; const currentFile = selectedFile;
    setInput(''); setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const uiAtts: any[] = [];
    if (currentFile) {
      let type: 'image' | 'audio' | 'pdf' | 'word' | 'file' = 'file';
      if (currentFile.type.startsWith('image')) type = 'image';
      else if (currentFile.type === 'application/pdf') type = 'pdf';
      else if (currentFile.type.includes('word') || currentFile.name.endsWith('.docx') || currentFile.name.endsWith('.doc')) type = 'word';
      
      uiAtts.push({ type, name: currentFile.name });
    }

    setMessages(prev => [...prev, { role: 'user', text: currentInput, timestamp: new Date(), attachments: uiAtts }]);
    setIsLoading(true);

    try {
      const atts: Attachment[] = [];
      let finalPrompt = currentInput;

      if (currentFile) {
        if (currentFile.type === 'application/pdf' || currentFile.type.startsWith('image/')) {
          atts.push({ mimeType: currentFile.type, data: await fileToBase64(currentFile) });
        } else if (currentFile.type.includes('word') || currentFile.name.endsWith('.docx') || currentFile.name.endsWith('.doc')) {
          // Extract text from docx
          const arrayBuffer = await currentFile.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          finalPrompt = `[CONTINUT DOCUMENT WORD: ${currentFile.name}]\n${result.value}\n\n[INSTRUCTIUNE UTILIZATOR]\n${finalPrompt}`;
        } else {
          // Fallback for other files
          if (currentFile.size < 1024 * 1024) { // 1MB limit for unknown files
             atts.push({ mimeType: currentFile.type || 'application/octet-stream', data: await fileToBase64(currentFile) });
          }
        }
      }
      
      let responseText;
      const effectiveModel = currentFile ? 'gemini' : aiModel;
      
      if (effectiveModel === 'gemini') {
        responseText = await sendMessageToGemini(finalPrompt, atts, 'omni-scada', 'gemini-3.1-pro-preview');
      } else {
        const { callNvidiaAI } = await import('../services/geminiService');
        responseText = await callNvidiaAI(effectiveModel as any, finalPrompt, 'omni-scada', atts);
      }
      
      setMessages(prev => [...prev, { role: 'assistant', text: responseText, timestamp: new Date() }]);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder; audioChunksRef.current = [];
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        setIsLoading(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setMessages(prev => [...prev, { role: 'user', text: "🎤 Telemetry Voice Log", timestamp: new Date(), attachments: [{ type: 'audio' }] }]);
        const base64 = await fileToBase64(audioBlob);
        
        let res;
        if (aiModel === 'gemini') {
          res = await sendMessageToGemini("", [{ mimeType: audioBlob.type, data: base64 }], 'omni-scada');
        } else {
          const { callNvidiaAI } = await import('../services/geminiService');
          res = await callNvidiaAI(aiModel, "Audio processed (text context only)", 'omni-scada', [{ mimeType: audioBlob.type, data: base64 }]);
        }
        
        setMessages(prev => [...prev, { role: 'assistant', text: res, timestamp: new Date() }]);
        setIsLoading(false);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start(); setIsRecording(true);
    } catch (e) { alert("Mic denied"); }
  };

  return (
    <div className="flex h-full gap-4 md:gap-6 animate-in fade-in duration-500 relative overflow-hidden border-x border-slate-800">
      <div className="flex-1 flex flex-col bg-[#05181c] border-r border-cyan-900/30 overflow-hidden relative shadow-2xl">
        <div className="bg-[#082025]/95 backdrop-blur p-3 md:p-4 border-b border-cyan-800/50 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-900/30 p-1.5 md:p-2 rounded-xl border border-cyan-500/30 shadow-inner"><Activity className="w-5 h-5 md:w-6 h-6 text-cyan-400" /></div>
            <div>
              <h2 className="text-white font-bold tracking-wide flex items-center gap-2 text-xs md:text-base">OMNI-SCADA <span className="hidden sm:inline px-2 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-mono">LIVE</span></h2>
              <p className="text-[10px] text-cyan-400/70 font-mono truncate uppercase tracking-tighter">CNS Integration Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
              <button onClick={() => setSectiune('chat')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sectiune === 'chat' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>Chat</button>
              <button onClick={() => setSectiune('ticketing')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sectiune === 'ticketing' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}>
                Ticketing {tickets.filter(t => t.status === 'Deschis' || t.status === 'Atribuit').length > 0 && <span className="ml-1 bg-red-500 text-white text-[9px] rounded-full px-1">{tickets.filter(t => t.status === 'Deschis' || t.status === 'Atribuit').length}</span>}
              </button>
            </div>
            <select 
              value={aiModel} 
              onChange={(e) => setAiModel(e.target.value as any)}
              className="bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="gemini">Gemini 3 Pro</option>
              <option value="deepseek">DeepSeek V3.2</option>
              <option value="qwen">Qwen 3.5 397B</option>
              <option value="kimi">Kimi K2.5</option>
              <option value="glm5">GLM-5 Thinking</option>
            </select>
            <button onClick={() => setShowMobileInfo(!showMobileInfo)} className="xl:hidden p-2 hover:bg-cyan-900/30 rounded-lg text-cyan-500">{showMobileInfo ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}</button>
            <button onClick={() => setMessages([{ role: 'assistant', text: "SCADA Session Reset.", timestamp: new Date() }])} className="p-2 hover:bg-cyan-900/30 rounded-lg text-cyan-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        {sectiune === 'ticketing' && (
          <div className="flex-1 overflow-y-auto p-4 bg-[#05181c] custom-scrollbar">
            {/* Filtre */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['Toate','Deschis','Atribuit','In Lucru','Rezolvat','Verificat'] as const).map(s => (
                <button key={s} onClick={() => setFiltruStatus(s)} className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${filtruStatus === s ? 'bg-amber-500 text-black border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-500/50'}`}>{s} {s !== 'Toate' && `(${tickets.filter(t => t.status === s).length})`}</button>
              ))}
            </div>
            {/* Grid tickets + detaliu */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="space-y-2">
                {ticketsFiltrate.map(t => (
                  <div key={t.id} onClick={() => setTicketSelectat(t)} className={`bg-slate-900 border rounded-xl p-3 cursor-pointer hover:border-cyan-500/50 transition-all ${ticketSelectat?.id === t.id ? 'border-cyan-500' : 'border-slate-800'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-500 text-[10px] font-mono">{t.id}</span>
                          <span className={`text-[10px] font-bold ${prioritateColors[t.prioritate]}`}>● {t.prioritate}</span>
                        </div>
                        <p className="text-white text-xs font-bold truncate">{t.titlu}</p>
                        <p className="text-slate-500 text-[10px] mt-1">{t.parc} · {t.judet}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex-shrink-0 ${statusColors[t.status]}`}>{t.status}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-slate-600 text-[10px]">Echipa: {t.echipa}</span>
                      <span className="text-slate-600 text-[10px]">{t.creatLa}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Detaliu ticket */}
              {ticketSelectat ? (
                <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4 h-fit">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-cyan-400 font-mono text-xs">{ticketSelectat.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${statusColors[ticketSelectat.status]}`}>{ticketSelectat.status}</span>
                  </div>
                  <h3 className="text-white font-bold text-sm mb-2">{ticketSelectat.titlu}</h3>
                  <p className="text-slate-400 text-xs mb-3">{ticketSelectat.descriere}</p>
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-[10px]"><span className="text-slate-500">Parc:</span><span className="text-slate-300">{ticketSelectat.parc} · {ticketSelectat.judet}</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-slate-500">Prioritate:</span><span className={prioritateColors[ticketSelectat.prioritate]}>{ticketSelectat.prioritate}</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-slate-500">Echipa:</span><span className="text-slate-300">{ticketSelectat.echipa}</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-slate-500">Creat la:</span><span className="text-slate-300">{ticketSelectat.creatLa}</span></div>
                  </div>
                  {ticketSelectat.status !== 'Verificat' && (
                    <button onClick={() => avanseazaStatus(ticketSelectat)} className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                      <ChevronDown className="w-4 h-4 rotate-[-90deg]" /> Avansează Status
                    </button>
                  )}
                  {ticketSelectat.status === 'Verificat' && (
                    <div className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Ticket Închis
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex items-center justify-center h-40">
                  <p className="text-slate-600 text-xs">Selectează un ticket pentru detalii</p>
                </div>
              )}
            </div>
          </div>
        )}
        {sectiune === 'chat' && <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#05181c] custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border shadow-inner ${msg.role === 'user' ? 'bg-slate-800 border-slate-600' : 'bg-cyan-900/20 border-cyan-500/30'}`}>{msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-cyan-300" />}</div>
              <div className={`px-4 py-3 rounded-xl max-w-[85%] text-xs md:text-sm leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-[#0a272e] text-cyan-50 border border-cyan-900/50'}`}>
                {msg.attachments?.map((att, i) => (
                  <div key={i} className="mb-2">
                    {att.type === 'audio' && <div className="text-[10px] text-cyan-400 italic flex items-center gap-2"><Mic className="w-3 h-3"/> Audio Log Recorded</div>}
                    {att.type === 'pdf' && <div className="text-[10px] text-cyan-400 italic flex items-center gap-2"><FileText className="w-3 h-3"/> PDF: {att.name}</div>}
                    {att.type === 'word' && <div className="text-[10px] text-cyan-400 italic flex items-center gap-2"><FileCode className="w-3 h-3"/> Word: {att.name}</div>}
                    {att.type === 'file' && <div className="text-[10px] text-cyan-400 italic flex items-center gap-2"><Paperclip className="w-3 h-3"/> File: {att.name}</div>}
                  </div>
                ))}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {isLoading && <div className="flex gap-4"><div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-900/20 border border-cyan-500/30 flex items-center justify-center shadow-inner"><Bot className="w-4 h-4 text-cyan-300" /></div><div className="bg-[#0a272e] border border-cyan-900/50 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg"><Cpu className="w-4 h-4 text-cyan-400 animate-spin" /><span className="text-[10px] text-cyan-300 font-mono uppercase tracking-widest">Normalizing telemetry...</span></div></div>}
          <div ref={messagesEndRef} />
        </div>}
        <div className="p-3 md:p-4 bg-[#082025] border-t border-cyan-900/50 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {selectedFile && <div className="text-[10px] text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded w-fit flex gap-2">{selectedFile.name} <button onClick={() => setSelectedFile(null)}><X className="w-3 h-3"/></button></div>}
            <div className="relative flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={e => e.target.files && setSelectedFile(e.target.files[0])} className="hidden" accept=".pdf,.doc,.docx,image/*" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-800 text-slate-400 rounded-xl" title="Încarcă Document Tehnic"><Paperclip className="w-5 h-5"/></button>
              <button onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording} className={`p-3 rounded-xl ${isRecording ? 'bg-red-900 text-red-400' : 'bg-slate-800 text-slate-400'}`}>{isRecording ? <StopCircle className="w-5 h-5"/> : <Mic className="w-5 h-5" />}</button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Query Central Nervous System..." className="flex-1 bg-[#051316] border border-cyan-900 focus:border-cyan-500 rounded-lg pl-4 pr-12 py-3 text-xs md:text-sm text-cyan-50 placeholder-cyan-900/40 focus:outline-none transition-all font-mono shadow-inner" />
              <button onClick={handleSend} disabled={isLoading} className="absolute right-2 p-2 bg-cyan-700 text-white rounded-md"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
      <div className={`absolute inset-0 z-20 bg-[#05181c] p-4 overflow-y-auto transition-transform duration-300 xl:relative xl:transform-none xl:w-80 xl:bg-transparent xl:p-0 xl:flex xl:flex-col xl:gap-4 xl:overflow-y-auto xl:pr-2 custom-scrollbar ${showMobileInfo ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-6 xl:hidden"><div className="flex items-center gap-2"><div className="bg-cyan-500/20 p-2 rounded-lg"><Monitor className="w-5 h-5 text-cyan-400" /></div><h3 className="text-cyan-400 font-bold text-lg tracking-tight">Capabilities</h3></div><button onClick={() => setShowMobileInfo(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button></div>
        <div className="bg-cyan-950/30 border border-cyan-900/50 p-4 rounded-xl mb-4 xl:mb-0 shadow-inner"><h3 className="text-cyan-400 font-bold text-[10px] md:text-xs mb-1 uppercase tracking-widest">CNS Modules</h3><p className="text-[10px] text-cyan-600 font-mono">STATUS: 10/10 DEPLOYED</p></div>
        <div className="flex flex-col gap-3 pb-10 xl:pb-0">{superpowers.map((power, idx) => (<div key={idx} className="bg-slate-900/80 border border-slate-700 hover:border-cyan-500/50 p-4 rounded-xl transition-all duration-300 group hover:bg-[#0a272e] shadow-sm"><div className="flex items-start gap-3"><div className="p-2 rounded-lg bg-slate-800 group-hover:bg-cyan-900/30 group-hover:text-cyan-400 text-slate-400 transition-colors shadow-inner"><power.icon className="w-4 h-4 md:w-5 h-5" /></div><div><h4 className="text-slate-200 font-bold text-xs md:text-sm group-hover:text-cyan-200 uppercase tracking-tight">{power.title}</h4><p className="text-[10px] md:text-xs text-slate-500 mt-1 leading-snug group-hover:text-cyan-400/70">{power.desc}</p></div></div></div>))}</div>
      </div>
    </div>
  );
};