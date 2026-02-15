import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, Anchor, Settings, Battery, Box, Eye, Puzzle, Radio,
  Send, Bot, User, Cpu, Activity, Trash2, Info, X, Paperclip, Mic, StopCircle
} from 'lucide-react';
import { sendMessageToGemini, Attachment } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  attachments?: { type: 'audio' | 'image' | 'pdf', name?: string }[];
}

const HISTORY_KEY = 'volta_chat_history';

export const VoltaSection: React.FC = () => {
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const instruments = [
    { title: "PoC Measurement", icon: Anchor, desc: "Source of Truth at Connection Point" },
    { title: "Auto Power Control", icon: Settings, desc: "Active P & Reactive Q Regulation" },
    { title: "BESS Hybridization", icon: Battery, desc: "Eliminate Curtailment" },
    { title: "Integrated HW/SW", icon: Box, desc: "Turnkey PLC + IPC Cabinet" },
    { title: "OneView® Interface", icon: Eye, desc: "Unified Live & History" },
    { title: "Flexible Integration", icon: Puzzle, desc: "Custom or Standard Config" },
    { title: "Multi-Protocol", icon: Radio, desc: "Modbus, IEC 104/101 Support" }
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
    return [{ role: 'assistant', text: "VOLTA Active. Ready to orchestrate Solar, Wind, and BESS. What is your grid requirement?", timestamp: new Date() }];
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
    if (currentFile) uiAtts.push({ type: 'pdf', name: currentFile.name });

    setMessages(prev => [...prev, { role: 'user', text: currentInput, timestamp: new Date(), attachments: uiAtts }]);
    setIsLoading(true);

    try {
      const atts: Attachment[] = [];
      if (currentFile) atts.push({ mimeType: currentFile.type, data: await fileToBase64(currentFile) });
      const responseText = await sendMessageToGemini(currentInput, atts, 'volta');
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
        setMessages(prev => [...prev, { role: 'user', text: "🎤 Controller Command Log", timestamp: new Date(), attachments: [{ type: 'audio' }] }]);
        const base64 = await fileToBase64(audioBlob);
        const res = await sendMessageToGemini("", [{ mimeType: audioBlob.type, data: base64 }], 'volta');
        setMessages(prev => [...prev, { role: 'assistant', text: res, timestamp: new Date() }]);
        setIsLoading(false);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start(); setIsRecording(true);
    } catch (e) { alert("Mic denied"); }
  };

  return (
    <div className="flex h-full gap-4 md:gap-6 animate-in fade-in duration-500 relative overflow-hidden border-x border-slate-800">
      <div className="flex-1 flex flex-col bg-[#1a1405] border-r border-amber-900/50 overflow-hidden relative shadow-2xl">
        <div className="bg-[#261e0b]/95 backdrop-blur p-3 md:p-4 border-b border-amber-800/50 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-900/30 p-1.5 md:p-2 rounded-xl border border-amber-500/30 shadow-[0_0_10px_-2px_rgba(245,158,11,0.4)]"><Zap className="w-5 h-5 md:w-6 h-6 text-amber-400" /></div>
            <div>
              <h2 className="text-white font-bold tracking-wide flex items-center gap-2 text-xs md:text-base">VOLTA Master PPC <span className="hidden sm:inline px-2 py-0.5 rounded text-[9px] bg-amber-950 text-amber-300 border border-amber-700/50 font-mono">LIVE</span></h2>
              <p className="text-[10px] text-amber-400/70 font-mono uppercase tracking-tighter">Active Grid Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setShowMobileInfo(!showMobileInfo)} className="xl:hidden p-2 hover:bg-amber-900/30 rounded-lg text-amber-500">{showMobileInfo ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}</button>
            <button onClick={() => setMessages([{ role: 'assistant', text: "VOLTA logs cleared.", timestamp: new Date() }])} className="p-2 hover:bg-amber-900/30 rounded-lg text-amber-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#1a1405] custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${msg.role === 'user' ? 'bg-slate-800 border-slate-600' : 'bg-amber-900/20 border-amber-500/30 shadow-inner'}`}>{msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-amber-300" />}</div>
              <div className={`px-4 py-3 rounded-xl max-w-[85%] text-xs md:text-sm leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-[#2b220d] text-amber-50 border border-amber-900/50'}`}>
                {msg.attachments?.map((att, i) => <div key={i} className="mb-2">{att.type === 'audio' && <div className="text-[10px] text-amber-400 italic flex items-center gap-2"><Mic className="w-3 h-3"/> Active Controller Log</div>}</div>)}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {isLoading && <div className="flex gap-4"><div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-900/20 border border-amber-500/30 flex items-center justify-center shadow-inner"><Bot className="w-4 h-4 text-amber-300" /></div><div className="bg-[#2b220d] border border-amber-900/50 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg"><Cpu className="w-4 h-4 text-amber-400 animate-spin" /><span className="text-[10px] text-amber-300 font-mono uppercase tracking-widest">Calculating set-points...</span></div></div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 md:p-4 bg-[#261e0b] border-t border-amber-900/50 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {selectedFile && <div className="text-[10px] text-amber-400 bg-amber-900/20 px-2 py-1 rounded w-fit flex gap-2">{selectedFile.name} <button onClick={() => setSelectedFile(null)}><X className="w-3 h-3"/></button></div>}
            <div className="relative flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={e => e.target.files && setSelectedFile(e.target.files[0])} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-800 text-slate-400 rounded-xl"><Paperclip className="w-5 h-5"/></button>
              <button onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording} className={`p-3 rounded-xl ${isRecording ? 'bg-red-900 text-red-400' : 'bg-slate-800 text-slate-400'}`}>{isRecording ? <StopCircle className="w-5 h-5"/> : <Mic className="w-5 h-5" />}</button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Command VOLTA Controller..." className="flex-1 bg-[#140f03] border border-amber-900 focus:border-amber-500 rounded-lg pl-4 pr-12 py-3 text-xs md:text-sm text-amber-50 focus:outline-none transition-all font-mono shadow-inner" />
              <button onClick={handleSend} disabled={isLoading} className="absolute right-2 p-2 bg-amber-700 text-white rounded-md"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
      <div className={`absolute inset-0 z-20 bg-[#1a1405] p-4 overflow-y-auto transition-transform duration-300 xl:relative xl:transform-none xl:w-80 xl:bg-transparent xl:p-0 xl:flex xl:flex-col xl:gap-4 xl:overflow-y-auto xl:pr-2 custom-scrollbar ${showMobileInfo ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-6 xl:hidden"><div className="flex items-center gap-2"><div className="bg-amber-500/20 p-2 rounded-lg"><Zap className="w-5 h-5 text-amber-400" /></div><h3 className="text-amber-400 font-bold text-lg">Instruments</h3></div><button onClick={() => setShowMobileInfo(false)} className="text-slate-500"><X className="w-6 h-6" /></button></div>
        <div className="bg-amber-950/30 border border-amber-900/50 p-4 rounded-xl mb-4 xl:mb-0 shadow-inner"><h3 className="text-amber-400 font-bold text-[10px] md:text-xs mb-1 uppercase tracking-widest">PPC Core</h3><p className="text-[10px] text-amber-600 font-mono">VOLTA HYBRID MASTER ACTIVE</p></div>
        <div className="flex flex-col gap-3 pb-10 xl:pb-0">{instruments.map((power, idx) => (<div key={idx} className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl group hover:bg-[#2b220d] transition-all shadow-sm"><div className="flex items-start gap-3"><div className="p-2 rounded-lg bg-slate-800 group-hover:text-amber-400 text-slate-400"><power.icon className="w-5 h-5" /></div><div><h4 className="text-slate-200 font-bold text-xs uppercase">{power.title}</h4><p className="text-[10px] text-slate-500 mt-1">{power.desc}</p></div></div></div>))}</div>
      </div>
    </div>
  );
};