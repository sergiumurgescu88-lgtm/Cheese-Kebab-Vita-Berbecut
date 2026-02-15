import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Code, Cpu, Network, X, Trash2, Zap, Info, Layers, Database, Globe, Shield, Paperclip, Mic, StopCircle, FileIcon, Image as ImageIcon } from 'lucide-react';
import { sendMessageToGemini, Attachment } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  attachments?: { type: 'image' | 'audio' | 'pdf', url?: string, name?: string }[];
}

const HISTORY_KEY = 'atlas_tech_chat_history';

export const AtlasChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
      } catch (e) { console.error(e); }
    }
    return [{ role: 'assistant', text: "ATLAS Systems Online. Integration Engine Active. 47 Modules loaded. Which API shall we architect?", timestamp: new Date() }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const capabilities = [
    { title: "API Orchestration", icon: Network, desc: "Connect Planet Labs, Solcast, Huawei" },
    { title: "JSON Schema Design", icon: Code, desc: "Production-ready data structures" },
    { title: "System Integration", icon: Layers, desc: "REST, gRPC, MQTT & Modbus expertise" },
    { title: "Latency Opt.", icon: Zap, desc: "System-wide 0.092s response tuning" },
    { title: "Code Generation", icon: Terminal, desc: "Python/TS snippets for 47 modules" }
  ];

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
    if (currentFile) uiAtts.push({ type: currentFile.type.startsWith('image') ? 'image' : 'pdf', name: currentFile.name, url: currentFile.type.startsWith('image') ? URL.createObjectURL(currentFile) : undefined });

    setMessages(prev => [...prev, { role: 'user', text: currentInput, timestamp: new Date(), attachments: uiAtts }]);
    setIsLoading(true);

    try {
        const atts: Attachment[] = [];
        if (currentFile) atts.push({ mimeType: currentFile.type, data: await fileToBase64(currentFile) });
        const res = await sendMessageToGemini(currentInput, atts, 'atlas');
        setMessages(prev => [...prev, { role: 'assistant', text: res, timestamp: new Date() }]);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
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
        setMessages(prev => [...prev, { role: 'user', text: "🎤 System API Command", timestamp: new Date(), attachments: [{ type: 'audio' }] }]);
        const base64 = await fileToBase64(audioBlob);
        const res = await sendMessageToGemini("", [{ mimeType: audioBlob.type, data: base64 }], 'atlas');
        setMessages(prev => [...prev, { role: 'assistant', text: res, timestamp: new Date() }]);
        setIsLoading(false);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start(); setIsRecording(true);
    } catch (e) { alert("Mic denied"); }
  };

  const formatMessage = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const content = part.slice(3, -3).replace(/^[a-z]+\n/, ''); 
        return (<div key={index} className="my-3 bg-[#0d1117] border border-violet-700/50 rounded-lg overflow-hidden font-mono text-sm"><div className="flex items-center justify-between px-3 py-1.5 bg-violet-900/30 border-b border-violet-700/50"><span className="text-xs text-violet-300">implementation_code</span><div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-red-500/50"></div><div className="w-2 h-2 rounded-full bg-green-500/50"></div></div></div><pre className="p-4 text-violet-100 overflow-x-auto custom-scrollbar">{content}</pre></div>);
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="flex h-full gap-4 md:gap-6 animate-in fade-in duration-500 relative overflow-hidden border-x border-slate-800">
      <div className="flex-1 flex flex-col bg-[#050510] border-r border-violet-900/30 overflow-hidden relative shadow-2xl">
        <div className="bg-[#0a0a1a]/95 backdrop-blur p-3 md:p-4 border-b border-violet-800/50 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-violet-900/30 p-1.5 md:p-2 rounded-xl border border-violet-500/30 shadow-[0_0_15px_-3px_rgba(139,92,246,0.5)]"><Network className="w-5 h-5 md:w-6 h-6 text-violet-400" /></div>
            <div>
              <h2 className="text-white font-bold tracking-wide flex items-center gap-2 text-xs md:text-base">ATLAS Engine <span className="hidden sm:inline px-2 py-0.5 rounded text-[9px] bg-violet-900/80 text-violet-300 border border-violet-700/50 font-mono">v3.0.1</span></h2>
              <p className="text-[10px] text-violet-300/70 font-mono uppercase tracking-tighter">API Orchestration Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setShowMobileInfo(!showMobileInfo)} className="xl:hidden p-2 hover:bg-violet-900/30 rounded-lg text-violet-500">{showMobileInfo ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}</button>
            <button onClick={() => setMessages([{ role: 'assistant', text: "ATLAS Logs purged.", timestamp: new Date() }])} className="p-2 hover:bg-violet-900/30 rounded-lg text-violet-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#050510] custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${msg.role === 'user' ? 'bg-slate-800 border-slate-600' : 'bg-violet-900/50 border-violet-500/50 shadow-inner'}`}>{msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Terminal className="w-4 h-4 text-violet-300" />}</div>
              <div className={`px-4 py-3 rounded-xl max-w-[85%] text-xs md:text-sm shadow-lg ${msg.role === 'user' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-[#0F0F23] text-slate-300 border border-violet-900/40'}`}>
                {msg.attachments?.map((att, i) => <div key={i} className="mb-2">{att.type === 'audio' && <div className="text-[10px] text-violet-400 italic flex items-center gap-2"><Mic className="w-3 h-3"/> Audio Segment Attached</div>}</div>)}
                {formatMessage(msg.text)}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex gap-4"><div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-900/50 border border-violet-500/50 flex items-center justify-center"><Terminal className="w-4 h-4 text-violet-300" /></div><div className="bg-[#0F0F23] border border-violet-900/40 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg"><Zap className="w-4 h-4 text-violet-400 animate-pulse" /><span className="text-[10px] text-violet-300 font-mono uppercase tracking-widest">Compiling architecture...</span></div></div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 md:p-4 bg-[#0a0a1a] border-t border-violet-900/50 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {selectedFile && <div className="text-[10px] text-violet-400 bg-violet-900/20 px-2 py-1 rounded w-fit flex gap-2">{selectedFile.name} <button onClick={() => setSelectedFile(null)}><X className="w-3 h-3"/></button></div>}
            <div className="relative flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={e => e.target.files && setSelectedFile(e.target.files[0])} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-800 text-slate-400 rounded-xl"><Paperclip className="w-5 h-5"/></button>
              <button onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording} className={`p-3 rounded-xl ${isRecording ? 'bg-red-900 text-red-400' : 'bg-slate-800 text-slate-400'}`}>{isRecording ? <StopCircle className="w-5 h-5"/> : <Mic className="w-5 h-5" />}</button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Initialize module deployment..." className="flex-1 bg-[#050510] border border-violet-900 focus:border-violet-500 rounded-lg pl-4 pr-12 py-3 text-xs md:text-sm text-violet-100 placeholder-violet-900/50 focus:outline-none transition-all font-mono shadow-inner" />
              <button onClick={handleSend} disabled={isLoading} className="absolute right-2 p-2 bg-violet-700 text-white rounded-md shadow-[0_0_10px_-2px_rgba(139,92,246,0.5)]"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
      <div className={`absolute inset-0 z-20 bg-[#050510] p-4 overflow-y-auto transition-transform duration-300 xl:relative xl:transform-none xl:w-80 xl:bg-transparent xl:p-0 xl:flex xl:flex-col xl:gap-4 xl:overflow-y-auto xl:pr-2 custom-scrollbar ${showMobileInfo ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-6 xl:hidden"><div className="flex items-center gap-2"><div className="bg-violet-500/20 p-2 rounded-lg"><Network className="w-5 h-5 text-violet-400" /></div><h3 className="text-violet-400 font-bold text-lg">Capabilities</h3></div><button onClick={() => setShowMobileInfo(false)} className="text-slate-500"><X className="w-6 h-6" /></button></div>
        <div className="bg-violet-950/30 border border-violet-900/50 p-4 rounded-xl mb-4 xl:mb-0 shadow-inner"><h3 className="text-violet-400 font-bold text-[10px] mb-1 uppercase tracking-widest">Tech Core</h3><p className="text-[10px] text-violet-600 font-mono">INTEGRATION ENGINE ACTIVE</p></div>
        <div className="flex flex-col gap-3 pb-10 xl:pb-0">{capabilities.map((cap, idx) => (<div key={idx} className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl group hover:bg-[#0F0F23] transition-all shadow-sm"><div className="flex items-start gap-3"><div className="p-2 rounded-lg bg-slate-800 group-hover:text-violet-400 text-slate-400"><cap.icon className="w-5 h-5" /></div><div><h4 className="text-slate-200 font-bold text-xs uppercase">{cap.title}</h4><p className="text-[10px] text-slate-500 mt-1">{cap.desc}</p></div></div></div>))}</div>
      </div>
    </div>
  );
};