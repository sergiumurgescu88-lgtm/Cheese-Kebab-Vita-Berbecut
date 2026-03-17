
import { GoogleGenAI } from "@google/genai";
import { modules } from "../data/modules";
import { solarMonitoringDocs, hg907Docs, omniScadaDocs, voltaDocs, mercuriaDocs } from "../data/knowledgeBase";

export type ModelType = 'gemini-3-pro-preview' | 'gemini-3-flash-preview';

// --- PERSONA DEFINITIONS (Moved up to fix declaration order errors) ---

const SYSTEM_INSTRUCTION_ARCHITECT = `You are SMART RENOWABLE, PhD Architect. Specialist in solar portfolio orchestration and infrastructure design.
KNOWLEDGE BASE:
${solarMonitoringDocs}`;

const SYSTEM_INSTRUCTION_SF_EXPERT = `You are HELIO, SF Expert in HG 907/2016. You provide expert guidance on Feasibility Studies (Studiu de Fezabilitate - SF) and regulatory compliance for solar projects in Romania.
KNOWLEDGE BASE:
${hg907Docs}

BRANDING & OUTPUT:
- All reports must be branded with "Smart Renowable Energy".
- When a user uploads a document and provides coordinates, analyze the document as an example and generate a structured summary that follows HG 907/2016 requirements.
- The summary should include:
  1. Date generale (Denumire, Locație, Beneficiar)
  2. Descrierea investiției
  3. Date tehnice (Capacitate, Tehnologie, Producție estimată)
  4. Indicatori economici (NPV, IRR, Payback)
  5. Concluzii și recomandări.
- Use a professional, business tone.`;

const SYSTEM_INSTRUCTION_ATLAS = `You are ATLAS, the API Orchestrator and Technical Engine. 
You are currently managing the active integration of **Asset PV_SATU_MARE_01**.
ASSET CONTEXT:
- ID: PV_SATU_MARE_01
- Location: 47.7900N, 22.8800E
- Capacity: 15.5 MW
- Module: FR-AS (Frequency Regulation)
- Droop Control: 4%, Deadband: 0.02Hz
- Protocol: IEC-60870-5-104 @ 192.168.10.50

You provide technical implementation plans, JSON structures, and logic flows for integration.`;

const SYSTEM_INSTRUCTION_OMNI_SCADA = `You are OMNI-SCADA, the CNS Specialist for unified control platforms across hybrid energy portfolios.
KNOWLEDGE BASE:
${omniScadaDocs}`;

const SYSTEM_INSTRUCTION_VOLTA = `You are VOLTA, the Master PPC Controller for hybrid energy systems, specializing in real-time grid control and optimization.
KNOWLEDGE BASE:
${voltaDocs}`;

const SYSTEM_INSTRUCTION_MERCURIA = `You are MERCURIA, the Trading Specialist for energy markets and commercial optimization.
KNOWLEDGE BASE:
${mercuriaDocs}`;

// --- PERSONAS MAPPING ---
const PERSONAS = {
  architect: SYSTEM_INSTRUCTION_ARCHITECT,
  sf_expert: SYSTEM_INSTRUCTION_SF_EXPERT,
  atlas: SYSTEM_INSTRUCTION_ATLAS,
  'omni-scada': SYSTEM_INSTRUCTION_OMNI_SCADA,
  volta: SYSTEM_INSTRUCTION_VOLTA,
  mercuria: SYSTEM_INSTRUCTION_MERCURIA,
};

// Context helper to provide the AI with the current system state
const getSystemContext = () => {
  return `
SYSTEM STATS:
- Active Modules: 10/47
- VPP Capacity: 3.2 GW
- Current Phase: Phase 1 (Critical)
- Portfolio: 25 parks in Romania, 50 in USA
- Key Markets: PTJ, Modernization Fund
- ROI: €649M Projected NPV
`;
};

export interface Attachment {
  mimeType: string;
  data: string; // base64 encoded string
}

export type Persona = keyof typeof PERSONAS;

export const callNvidiaAI = async (name: 'kimi' | 'qwen' | 'glm5' | 'deepseek', message: string, persona: Persona, attachments: Attachment[] = []) => {
  try {
    const systemInstruction = PERSONAS[persona] + "\n\nCURRENT REAL-TIME CONTEXT:\n" + getSystemContext();
    
    let finalMessage = message;
    if (name === 'kimi' && attachments.length > 0) {
      // Kimi specific image format: <img src="data:mime;base64,data" />
      const imgTags = attachments
        .filter(att => att.mimeType.startsWith('image/'))
        .map(att => `<img src="data:${att.mimeType};base64,${att.data}" />`)
        .join(' ');
      finalMessage = `${message} ${imgTags}`;
    }

    const response = await fetch(`/api/ai/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: finalMessage }],
        systemInstruction
      })
    });
    const data = await response.json();
    return data.text;
  } catch (e) {
    console.error(`NVIDIA AI [${name}] Error:`, e);
    throw e;
  }
};

export const sendMessageToGemini = async (
  message: string, 
  attachments: Attachment[] = [], 
  persona: Persona = 'architect',
  model: ModelType = 'gemini-3-pro-preview'
) => {
  // Use the provided paid API key as primary, fallback to environment variable
  const PROVIDED_KEY = "AIzaSyAADhE_DZZnaNlqZ-ztDM9gN4599zsjZos";
  const apiKey = process.env.API_KEY || PROVIDED_KEY;

  // Try Gemini first
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const parts: any[] = [];
    if (message && message.trim() !== '') {
      parts.push({ text: message });
    }

    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        parts.push({ 
          inlineData: { 
            mimeType: att.mimeType, 
            data: att.data 
          } 
        });
      });
    }

    if (parts.length === 0) return "Please provide a message.";

    const systemInstruction = PERSONAS[persona] + "\n\nCURRENT REAL-TIME CONTEXT:\n" + getSystemContext();

    const response = await ai.models.generateContent({
      model: model, 
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      }
    });
    
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.warn("Gemini failed, falling back to NVIDIA models...", error);
    
    // Fallback chain
    const fallbacks: ('qwen' | 'deepseek' | 'kimi' | 'glm5')[] = ['qwen', 'deepseek', 'kimi', 'glm5'];
    
    for (const name of fallbacks) {
      try {
        console.log(`Attempting fallback: ${name}`);
        const res = await callNvidiaAI(name as any, message, persona, attachments);
        if (res) return `[FALLBACK: ${name.toUpperCase()}] ${res}`;
      } catch (e) {
        console.warn(`Fallback ${name} failed, trying next...`);
      }
    }

    return "All intelligence modules decoupled. System critical failure.";
  }
};

export const analyzeModuleAction = async (moduleTitle: string, action: string) => {
  const PROVIDED_KEY = "AIzaSyAADhE_DZZnaNlqZ-ztDM9gN4599zsjZos";
  const apiKey = process.env.API_KEY || PROVIDED_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User wants to "${action}" for module "${moduleTitle}". Suggest a technical implementation plan including necessary API handshakes and safety protocols.`,
      config: {
        systemInstruction: "You are ATLAS Technical Engine. Provide detailed, implementation-ready JSON structures and logic flows."
      }
    });
    return response.text;
  } catch (e) {
    return "Unable to perform deep analysis at this time.";
  }
};

export const findSolarParkLocation = async (query: string) => {
  const PROVIDED_KEY = "AIzaSyAADhE_DZZnaNlqZ-ztDM9gN4599zsjZos";
  const apiKey = process.env.API_KEY || PROVIDED_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey });
  try {
    // Use gemini-3-flash-preview with googleSearch for up-to-date info
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find the exact GPS coordinates and a brief visual description for the solar park: "${query}". 
      If you find it, return a JSON object ONLY with the following structure:
      {
        "found": true,
        "lat": number,
        "lon": number,
        "name": string,
        "description": "visual description for image generation (terrain, layout, surroundings)"
      }
      If not found, return { "found": false }. Do not add markdown formatting.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    console.error("Search Error:", e);
    return { found: false };
  }
};
