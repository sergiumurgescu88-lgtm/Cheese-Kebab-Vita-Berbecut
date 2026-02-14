import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Code, FileText, Paperclip, Mic, X, StopCircle, Image as ImageIcon, File as FileIcon, Trash2 } from 'lucide-react';
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
        text: "Greetings. I am SolarAI, your Technical Architect. You can upload PDFs, satellite imagery, or send voice commands. How can I assist with the infrastructure today?", 
        timestamp: new Date() 
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save history whenever messages change
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      const initialMsg: Message = { 
        role: 'assistant', 
        text: "Greetings. I am SolarAI, your Technical Architect. You can upload PDFs, satellite imagery, or send voice commands. How can I assist with the infrastructure today?", 
        timestamp: new Date() 
      };
      setMessages([initialMsg]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  // --- File Handling ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Audio Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSendAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- Base64 Conversion ---
  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data url prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // --- Send Logic ---
  const handleSendAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    
    // Add user message with audio placeholder
    const userMsg: Message = { 
        role: 'user', 
        text: "🎤 Audio Message", 
        timestamp: new Date(),
        attachments: [{ type: 'audio' }] 
    };
    setMessages(prev => [...prev, userMsg]);

    try {
        const base64Audio = await fileToBase64(audioBlob);
        const attachment: Attachment = {
            mimeType: audioBlob.type, // usually audio/webm
            data: base64Audio
        };

        const responseText = await sendMessageToGemini("", [attachment]);
        const aiMsg: Message = { role: 'assistant', text: responseText, timestamp: new Date() };
        setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        console.error("Error sending audio:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile)) return;

    const currentInput = input;
    const currentFile = selectedFile;
    
    // Reset inputs immediately
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Create attachments for UI
    const uiAttachments = [];
    if (currentFile) {
        const type = currentFile.type.startsWith('image') ? 'image' : 'pdf';
        uiAttachments.push({ 
            type: type as 'image' | 'pdf', 
            name: currentFile.name,
            // Create a temporary object URL for preview if it's an image
            url: type === 'image' ? URL.createObjectURL(currentFile) : undefined
        });
    }

    const userMsg: Message = { 
        role: 'user', 
        text: currentInput, 
        timestamp: new Date(),
        attachments: uiAttachments 
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
        const attachments: Attachment[] = [];
        if (currentFile) {
            const base64 = await fileToBase64(currentFile);
            attachments.push({
                mimeType: currentFile.type,
                data: base64
            });
        }

        const responseText = await sendMessageToGemini(currentInput, attachments);
        const aiMsg: Message = { role: 'assistant', text: responseText, timestamp: new Date() };
        setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        console.error("Error processing request:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const formatMessage = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const content = part.slice(3, -3).replace(/^[a-z]+\n/, ''); 
        return (
          <div key={index} className="my-3 bg-[#0d1117] border border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
              <span className="text-xs text-slate-400 font-mono">Code Snippet</span>
              <Code className="w-3 h-3 text-slate-500" />
            </div>
            <pre className="p-4 text-sm font-mono text-slate-300 overflow-x-auto custom-scrollbar">
              {content}
            </pre>
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative">
      {/* Chat Header */}
      <div className="bg-slate-800/80 backdrop-blur p-4 border-b border-slate-700 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30">
            <Bot className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">SolarAI Architect</h2>
            <div className="flex items-center gap-2">
               <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <p className="text-xs text-slate-400">Multimodal: Text • Vision • Audio</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="hidden md:flex gap-2">
              <div className="px-3 py-1 bg-slate-900 rounded-full border border-slate-700 text-xs text-slate-400 flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> Python
              </div>
              <div className="px-3 py-1 bg-slate-900 rounded-full border border-slate-700 text-xs text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Docs
              </div>
            </div>
            <button 
              onClick={clearHistory}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0B1120]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-amber-600' : 'bg-indigo-600'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-amber-600/10 border border-amber-500/20 text-slate-100 rounded-tr-none' 
                  : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
              }`}>
                {/* Attachments Display */}
                {msg.attachments && msg.attachments.map((att, i) => (
                    <div key={i} className="mb-2">
                        {att.type === 'image' && att.url && (
                            <img src={att.url} alt="Uploaded" className="max-w-xs rounded-lg border border-slate-600 mb-2" />
                        )}
                        {att.type === 'pdf' && (
                            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700 mb-2">
                                <FileIcon className="w-4 h-4 text-red-400" />
                                <span className="text-xs text-slate-300">{att.name}</span>
                            </div>
                        )}
                        {att.type === 'audio' && (
                            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1 italic">
                                <Mic className="w-4 h-4" /> Voice Message
                            </div>
                        )}
                    </div>
                ))}
                
                <div className="text-sm leading-relaxed">
                  {formatMessage(msg.text)}
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
               <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-slate-800 border border-slate-700 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="text-sm text-slate-400">Processing multimodal context...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="max-w-4xl mx-auto">
            {/* File Preview */}
            {selectedFile && (
                <div className="mb-3 flex items-center gap-3 bg-slate-900 w-fit px-3 py-2 rounded-lg border border-slate-600 animate-in slide-in-from-bottom-2">
                    {selectedFile.type.startsWith('image') ? <ImageIcon className="w-4 h-4 text-indigo-400" /> : <FileIcon className="w-4 h-4 text-red-400" />}
                    <span className="text-sm text-slate-300 truncate max-w-[200px]">{selectedFile.name}</span>
                    <button onClick={removeFile} className="ml-2 hover:bg-slate-700 rounded-full p-1 transition-colors">
                        <X className="w-3 h-3 text-slate-400" />
                    </button>
                </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
                <div className="mb-3 flex items-center gap-3 bg-red-900/20 w-fit px-4 py-2 rounded-lg border border-red-900/50 animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-400 font-medium">Recording...</span>
                </div>
            )}

            <div className="relative flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,application/pdf"
                />
                
                {/* File Button */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors"
                    title="Upload Image or PDF"
                >
                    <Paperclip className="w-5 h-5" />
                </button>

                {/* Voice Button */}
                <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-3 rounded-xl transition-colors ${
                        isRecording 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                    title={isRecording ? "Stop Recording" : "Send Voice Message"}
                >
                    {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type or use voice..."
                    disabled={isRecording}
                    className="flex-1 bg-slate-900/80 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl pl-4 pr-12 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-lg"
                />
                
                <button 
                    onClick={handleSend}
                    disabled={isLoading || (input.trim() === '' && !selectedFile)}
                    className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
            <p className="text-center text-[10px] text-slate-500 mt-2">
                Gemini 3 Pro Preview | Supports PDF, Images & Audio
            </p>
        </div>
      </div>
    </div>
  );
};