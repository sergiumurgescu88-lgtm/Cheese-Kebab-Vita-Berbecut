import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Code, FileText, Paperclip, Mic, X, StopCircle, Image as ImageIcon, File as FileIcon, Trash2, Info, Layout, Cpu, Globe, TrendingUp, Shield } from 'lucide-react';
import { sendMessageToGemini, Attachment } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  attachments?: { type: 'image' | 'audio' | 'pdf', url?: string, name?: string }[];
}

const HISTORY_KEY = 'solar_ai_chat_history';

export const SolarChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [
      { 
        role: 'assistant', 
        text: "Greetings. I am SolarAI, your Technical Architect. I specialize in Romanian and US solar portfolio orchestration. How can I assist with the infrastructure today?", 
        timestamp: new Date() 
      }
    ];
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

  const capabilities = [
    { title: "Portfolio Mapping", icon: Globe, desc: "GPS tracking of 25+ Romanian parks" },
    { title: "Funding Eligibility", icon: Layout, desc: "PTJ & Modernization Fund advisor" },
    { title: "Infrastructure Design", icon: Cpu, desc: "R&D backed technical advice" },
    { title: "ROI Simulation", icon: TrendingUp, desc: "NPV & Payback period calculations" },
    { title: "Asset Resilience", icon: Shield, desc: "Climate risk & security assessment" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  const clearHistory = () => {
    if (window.confirm('Reset SolarAI context?')) {
      const initialMsg: Message = { 
        role: 'assistant', 
        text: "Greetings. I am SolarAI. Context cleared. How shall we begin the new architectural session?", 
        timestamp: new Date() 
      };
      setMessages([initialMsg]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSendAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    const userMsg: Message = { role: 'user', text: "🎤 Audio Instruction", timestamp: new Date(), attachments: [{ type: 'audio' }] };
    setMessages(prev => [...prev, userMsg]);
    try {
        const base64Audio = await fileToBase64(audioBlob);
        const attachment: Attachment = { mimeType: audioBlob.type, data: base64Audio };
        const responseText = await sendMessageToGemini("", [attachment], 'architect');
        setMessages(prev => [...prev, { role: 'assistant', text: responseText, timestamp: new Date() }]);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile)) return;
    const currentInput = input;
    const currentFile = selectedFile;
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const uiAttachments: any[] = [];
    if (currentFile) {
        const type = currentFile.type.startsWith('image') ? 'image' : 'pdf';
        uiAttachments.push({ type, name: currentFile.name, url: type === 'image' ? URL.createObjectURL(currentFile) : undefined });
    }

    setMessages(prev => [...prev, { role: 'user', text: currentInput, timestamp: new Date(), attachments: uiAttachments }]);
    setIsLoading(true);

    try {
        const attachments: Attachment[] = [];
        if (currentFile) {
            const base64 = await fileToBase64(currentFile);
            attachments.push({ mimeType: currentFile.type, data: base64 });
        }
        const responseText = await sendMessageToGemini(currentInput, attachments, 'architect');
        setMessages(prev => [...prev, { role: 'assistant', text: responseText, timestamp: new Date() }]);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const formatMessage = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const content = part.slice(3, -3).replace(/^[a-z]+\n/, ''); 
        return (
          <div key={index} className="my-3 bg-[#0d1117] border border-indigo-700/50 rounded-lg overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-900/30 border-b border-indigo-700/50">
              <span className="text-indigo-400 font-bold uppercase tracking-tighter">architect_code</span>
              <Code className="w-3 h-3 text-indigo-500" />
            </div>
            <pre className="p-4 text-slate-300 overflow-x-auto custom-scrollbar">{content}</pre>
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="flex h-full gap-4 md:gap-6 animate-in fade-in duration-500 relative overflow-hidden border-x border-slate-800">
      
      {/* LEFT: Interactive Chat Interface */}
      <div className="flex-1 flex flex-col bg-[#050510] border-r border-indigo-900/30 overflow-hidden relative shadow-2xl">
        {/* Header */}
        <div className="bg-[#0a0a1a]/95 backdrop-blur p-3 md:p-4 border-b border-indigo-800/50 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-900/30 p-1.5 md:p-2 rounded-xl border border-indigo-500/30">
              <Bot className="w-5 h-5 md:w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-bold tracking-wide flex items-center gap-2 text-xs md:text-base whitespace-nowrap">
                SolarAI Architect
                <span className="hidden sm:inline px-2 py-0.5 rounded text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-mono">PRO</span>
              </h2>
              <p className="text-[10px] text-indigo-400/70 font-mono uppercase tracking-tighter">Visionary Infrastructure Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setShowMobileInfo(!showMobileInfo)} className="xl:hidden p-2 hover:bg-indigo-900/30 rounded-lg text-indigo-500">
              {showMobileInfo ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            </button>
            <button onClick={clearHistory} className="p-2 hover:bg-indigo-900/30 rounded-lg text-indigo-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#050510] custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
                msg.role === 'user' ? 'bg-slate-800 border-slate-600' : 'bg-indigo-900/20 border-indigo-500/30 shadow-[0_0_15px_-5px_rgba(99,102,241,0.5)]'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-indigo-300" />}
              </div>
              <div className={`px-4 py-3 rounded-xl max-w-[85%] text-xs md:text-sm leading-relaxed shadow-lg ${
                msg.role === 'user' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-[#0a0a20] text-indigo-50 border border-indigo-900/50'
              }`}>
                {msg.attachments?.map((att, i) => (
                  <div key={i} className="mb-2">
                    {att.type === 'image' && att.url && <img src={att.url} alt="Site" className="max-w-xs rounded-lg border border-slate-600 mb-2" />}
                    {att.type === 'pdf' && <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700 mb-2"><FileIcon className="w-4 h-4 text-red-400" /><span className="text-xs">{att.name}</span></div>}
                    {att.type === 'audio' && <div className="flex items-center gap-2 text-indigo-400 text-[10px] mb-1 italic uppercase tracking-widest"><Mic className="w-3 h-3" /> Voice Segment Attached</div>}
                  </div>
                ))}
                {formatMessage(msg.text)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
               <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-900/20 border border-indigo-500/30 flex items-center justify-center">
                 <Bot className="w-4 h-4 text-indigo-300" />
               </div>
               <div className="bg-[#0a0a20] border border-indigo-900/50 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg">
                 <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                 <span className="text-[10px] text-indigo-300 font-mono uppercase tracking-widest">Architectural Synthesis...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 md:p-4 bg-[#0a0a1a] border-t border-indigo-900/50 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {selectedFile && <div className="flex items-center gap-2 bg-indigo-900/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 text-[10px] text-indigo-300 w-fit"><ImageIcon className="w-3 h-3" /> {selectedFile.name} <button onClick={removeFile}><X className="w-3 h-3 hover:text-white" /></button></div>}
            {isRecording && <div className="flex items-center gap-2 bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-500/30 text-[10px] text-red-400 w-fit animate-pulse">RECORDING...</div>}
            <div className="relative flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
              <button onClick={() => fileInputRef.current?.click()} className="p-2.5 md:p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-colors"><Paperclip className="w-5 h-5" /></button>
              <button onClick={isRecording ? stopRecording : startRecording} className={`p-2.5 md:p-3 rounded-xl transition-colors ${isRecording ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>{isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Query Digital Architect..."
                className="flex-1 bg-[#050510] border border-indigo-900 hover:border-indigo-700 focus:border-indigo-500 rounded-lg pl-4 pr-12 py-3 text-xs md:text-sm text-indigo-50 placeholder-indigo-900/40 focus:outline-none transition-all font-mono shadow-inner"
              />
              <button onClick={handleSend} disabled={isLoading || (!input.trim() && !selectedFile)} className="absolute right-2 p-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-md disabled:opacity-50"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Capabilities Panel */}
      <div className={`absolute inset-0 z-20 bg-[#050510] p-4 overflow-y-auto transition-transform duration-300 xl:relative xl:transform-none xl:w-80 xl:bg-transparent xl:p-0 xl:flex xl:flex-col xl:gap-4 xl:overflow-y-auto xl:pr-2 custom-scrollbar ${showMobileInfo ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-6 xl:hidden">
          <div className="flex items-center gap-2"><div className="bg-indigo-500/20 p-2 rounded-lg"><Bot className="w-5 h-5 text-indigo-400" /></div><h3 className="text-indigo-400 font-bold text-lg tracking-tight">Capabilities</h3></div>
          <button onClick={() => setShowMobileInfo(false)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <div className="bg-indigo-950/30 border border-indigo-900/50 p-4 rounded-xl mb-4 xl:mb-0 shadow-inner">
          <h3 className="text-indigo-400 font-bold text-[10px] md:text-xs mb-1 uppercase tracking-widest">Architectural Core</h3>
          <p className="text-[10px] text-indigo-600 font-mono">STATUS: HIGH CAPACITY</p>
        </div>
        <div className="flex flex-col gap-3 pb-10 xl:pb-0">
          {capabilities.map((cap, idx) => (
            <div key={idx} className="bg-slate-900/80 border border-slate-700 hover:border-indigo-500/50 p-4 rounded-xl transition-all duration-300 group hover:bg-[#0a0a20] shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-indigo-900/30 group-hover:text-indigo-400 text-slate-400 transition-colors shadow-inner"><cap.icon className="w-4 h-4 md:w-5 h-5" /></div>
                <div><h4 className="text-slate-200 font-bold text-xs md:text-sm group-hover:text-indigo-200 uppercase tracking-tight">{cap.title}</h4><p className="text-[10px] md:text-xs text-slate-500 mt-1 leading-snug group-hover:text-indigo-400/70">{cap.desc}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};