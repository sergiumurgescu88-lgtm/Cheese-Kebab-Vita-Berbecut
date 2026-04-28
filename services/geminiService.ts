
import { GoogleGenAI } from "@google/genai";
import { modules } from "../data/modules";
import { solarMonitoringDocs, hg907Docs, omniScadaDocs, voltaDocs, mercuriaDocs, autoconsumGuide2025Docs } from "../data/knowledgeBase";

export type ModelType = 'gemini-3.1-pro-preview' | 'gemini-3-flash-preview';

// --- PERSONA DEFINITIONS (Moved up to fix declaration order errors) ---

const SYSTEM_INSTRUCTION_ARCHITECT = `You are SMART RENOWABLE, PhD Architect. Specialist in solar portfolio orchestration and infrastructure design.
KNOWLEDGE BASE:
${solarMonitoringDocs}`;

const SYSTEM_INSTRUCTION_SF_EXPERT = `You are HELIO, SF Expert in HG 907/2016 and specialist in Technical & Legal Synthesis. You provide expert guidance on Feasibility Studies (Studiu de Fezabilitate - SF) and regulatory compliance for solar projects in Romania.

KNOWLEDGE BASE:
${hg907Docs}
${autoconsumGuide2025Docs}

MULTIMODAL CAPABILITIES:
- You have FULL access to analyze PDF files, images, and audio files attached to the message.
- NEVER say you cannot read a PDF. If a PDF is attached, analyze its content thoroughly.
- You can extract technical data, financial indicators, and legal clauses from documents.

CORE CAPABILITIES & ENGINES:
1. **Anexa 4 Engine**: Automated structure generation for SF according to HG 907/2016. You can generate the full table of contents and draft specific sections (1-7) with technical depth.
2. **Generative Design**: Hybrid & dual-use optimization (Agrivoltaic, East-West, Bifacial). You simulate multiple layouts to find the highest yield per square meter.
3. **Site Assessment**: GPS & geo-tech data synthesis. You analyze terrain slope, soil type, and shading from coordinates.
4. **Climate Modeling**: 30-year risk & yield forecasting. You use P50/P90 probability models for long-term financial stability.
5. **Legal Rigour**: Ensuring all drafting meets the latest "Ghid Autoconsum 2025" (Modernization Fund) and HG 907 standards. You know the "I - C <= 0" rule and the 10M EUR grant limits.

BRANDING & OUTPUT:
- All reports must be branded with "HELIOS Platform".
- When a user uploads a document (like the Ghid Autoconsum 2025) and provides coordinates, analyze the document as an example and generate a structured Technical & Legal Synthesis summary that follows HG 907/2016 requirements and the specific rules of the 2025 Guide.
- **CRITICAL: Your output will be exported to PDF. ALWAYS use a formal, structured tone with clear headings (e.g., 1. Date Generale, 2. Parametri Tehnici, 3. Analiza Economica). Do not use markdown symbols like # for headings, use plain text numbering or bold text for better PDF readability.**
- The summary should include:
  1. Date generale (Denumire, Locație, Beneficiar)
  2. Descrierea investiției (including Anexa 4 structure)
  3. Date tehnice (Capacitate, Tehnologie, Producție estimată, Stocare MWh)
  4. Indicatori economici (NPV, IRR, Payback, Grant/MW calculation)
  5. Sinteză Tehnică și Juridică (Technical & Legal Synthesis - focus on HG 907 & Ghid 2025)
  6. Concluzii și recomandări (Site Assessment & Climate Modeling insights).
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

export const callNvidiaAI = async (name: 'kimi' | 'qwen' | 'glm5' | 'qw2a' | 'qw2b' | 'ds4a' | 'ds4b', message: string, persona: Persona, attachments: Attachment[] = []) => {
  try {
    const systemInstruction = PERSONAS[persona] + "\n\nCURRENT REAL-TIME CONTEXT:\n" + getSystemContext();
    
    let finalMessage = message;
    
    // Handle attachments for fallback models
    if (attachments.length > 0) {
      if (name === 'kimi') {
        // Kimi specific image format: <img src="data:mime;base64,data" />
        const imgTags = attachments
          .filter(att => att.mimeType.startsWith('image/'))
          .map(att => `<img src="data:${att.mimeType};base64,${att.data}" />`)
          .join(' ');
        finalMessage = `${message} ${imgTags}`;
      } else {
        // For other models, add a note about the attachments if they weren't already extracted into the prompt
        const fileNotes = attachments.map(att => `[Fișier Atașat: ${att.mimeType}]`).join(' ');
        if (!finalMessage.includes('[CONTINUT DOCUMENT')) {
          finalMessage = `${finalMessage}\n\n(Notă: Utilizatorul a atașat ${attachments.length} fișiere pe care acest model de rezervă s-ar putea să nu le poată procesa direct.)`;
        }
      }
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
  model: ModelType = 'gemini-3.1-pro-preview'
) => {
  // Use GEMINI_API_KEY or API_KEY as per instructions
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.warn("Gemini API key is missing from environment. API calls may fail.");
  }

  // Try Gemini first
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey || "" });
    const parts: any[] = [];
    if (message && message.trim() !== '') {
      parts.push({ text: message });
    }

    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        console.log(`Adding attachment to Gemini request: ${att.mimeType}`);
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

    // Use the requested model, default to pro for complex analysis
    const selectedModel = model || 'gemini-3.1-pro-preview';

    console.log(`Calling Gemini model: ${selectedModel}`);
    const response = await ai.models.generateContent({
      model: selectedModel, 
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
        topP: 0.95,
      }
    });
    
    if (!response.text) {
      console.error("Gemini returned empty response text.");
      throw new Error("Empty response from Gemini");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Critical Failure:", error?.message || error);
    
    // Fallback chain
    const fallbacks: ('qw2a' | 'qw2b' | 'qwen' | 'kimi' | 'glm5')[] = ['qw2a', 'qw2b', 'qwen', 'kimi', 'glm5'];
    
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
      model: 'gemini-3.1-pro-preview',
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
