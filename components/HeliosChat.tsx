
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Code, FileText, Paperclip, Mic, X, StopCircle, Image as ImageIcon, File as FileIcon, Trash2, ScrollText, Info, Gavel, FileCheck, Lightbulb, Map, Wind } from 'lucide-react';
import { sendMessageToGemini, Attachment } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  attachments?: { type: 'image' | 'audio' | 'pdf', url?: string, name?: string }[];
}

const HISTORY_KEY = 'helio_sf_chat_history';

export const HeliosChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
      } catch (e) { console.error(e); }
    }
    return [{ role: 'assistant', text: "Salut. Sunt HELIO, expertul tău în HG 907/2016. Să generăm SF-ul tău de impact astăzi.", timestamp: new Date() }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages)); }, [messages]);

  const clearHistory = () => {
    if (window.confirm('Reset HELIO SF session?')) {
      setMessages([{ role: 'assistant', text: "Salut. Sunt HELIO. Gata pentru un nou studiu de fezabilitate.", timestamp: new Date() }]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  // Fix: Added missing removeFile function to clear selected files and reset file input
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

  const handleSendAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: "🎤 Instrucțiune Audio SF", timestamp: new Date(), attachments: [{ type: 'audio' }] }]);
    try {
        const base64 = await fileToBase64(audioBlob);
        const response = await sendMessageToGemini("", [{ mimeType: audioBlob.type, data: base64 }], 'sf_expert');
        setMessages(prev => [...prev, { role: 'assistant', text: response, timestamp: new Date() }]);
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
    setInput(''); setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const uiAtts: any[] = [];
    if (currentFile) uiAtts.push({ type: currentFile.type.startsWith('image') ? 'image' : 'pdf', name: currentFile.name, url: currentFile.type.startsWith('image') ? URL.createObjectURL(currentFile) : undefined });

    setMessages(prev => [...prev, { role: 'user', text: currentInput, timestamp: new Date(), attachments: uiAtts }]);
    setIsLoading(true);
    try {
        const atts: Attachment[] = [];
        if (currentFile) atts.push({ mimeType: currentFile.type, data: await fileToBase64(currentFile) });
        const res = await sendMessageToGemini(currentInput, atts, 'sf_expert');
        setMessages(prev => [...prev, { role: 'assistant', text: res, timestamp: new Date() }]);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const capabilities = [
    { title: "HG 907 Compliance", icon: Gavel, desc: "Legal rigour in SF drafting" },
    { title: "Anexa 4 Engine", icon: FileCheck, desc: "Automated structure generation" },
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
              <p className="text-[10px] text-teal-400/70 font-mono uppercase tracking-tighter">Technical & Legal Synthesis</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setShowMobileInfo(!showMobileInfo)} className="xl:hidden p-2 hover:bg-teal-900/30 rounded-lg text-teal-500">{showMobileInfo ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}</button>
            <button onClick={clearHistory} className="p-2 hover:bg-teal-900/30 rounded-lg text-teal-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#051010] custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${msg.role === 'user' ? 'bg-slate-800 border-slate-600' : 'bg-teal-900/20 border-teal-500/30 shadow-inner'}`}>{msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-teal-300" />}</div>
              <div className={`px-4 py-3 rounded-xl max-w-[85%] text-xs md:text-sm shadow-lg ${msg.role === 'user' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-[#0a2020] text-teal-50 border border-teal-900/50'}`}>
                {msg.attachments?.map((att, i) => <div key={i} className="mb-2">{att.type === 'audio' && <div className="flex items-center gap-2 text-teal-400 text-[10px] italic"><Mic className="w-3 h-3" /> Audio Attached</div>}{att.type === 'image' && att.url && <img src={att.url} className="max-w-xs rounded-lg" />}</div>)}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {isLoading && <div className="flex gap-4"><div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-900/20 border border-teal-500/30 flex items-center justify-center"><Bot className="w-4 h-4 text-teal-300" /></div><div className="bg-[#0a2020] border border-teal-900/50 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg"><Sparkles className="w-4 h-4 text-teal-400 animate-spin" /><span className="text-[10px] text-teal-300 font-mono uppercase tracking-widest">HG 907 Processing...</span></div></div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 md:p-4 bg-[#0a1a1a] border-t border-teal-900/50 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {selectedFile && <div className="text-[10px] text-teal-400 bg-teal-900/20 px-2 py-1 rounded w-fit flex gap-2">{selectedFile.name} <button onClick={removeFile}><X className="w-3 h-3"/></button></div>}
            <div className="relative flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={e => {if(e.target.files) setSelectedFile(e.target.files[0])}} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-800 text-slate-400 rounded-xl"><Paperclip className="w-5 h-5"/></button>
              <button onClick={isRecording ? () => {if(mediaRecorderRef.current) mediaRecorderRef.current.stop(); setIsRecording(false);} : startRecording} className={`p-3 rounded-xl ${isRecording ? 'bg-red-900 text-red-400' : 'bg-slate-800 text-slate-400'}`}>{isRecording ? <StopCircle className="w-5 h-5"/> : <Mic className="w-5 h-5" />}</button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Enter SF requirements..." className="flex-1 bg-[#051313] border border-teal-900 focus:border-teal-500 rounded-lg pl-4 pr-12 py-3 text-xs md:text-sm text-teal-50 focus:outline-none transition-all font-mono shadow-inner" />
              <button onClick={handleSend} disabled={isLoading} className="absolute right-2 p-2 bg-teal-700 text-white rounded-md"><Send className="w-4 h-4" /></button>
            </div>
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
