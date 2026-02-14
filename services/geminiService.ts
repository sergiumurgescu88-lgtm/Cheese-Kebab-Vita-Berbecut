import { GoogleGenAI } from "@google/genai";
import { modules } from "../data/modules";
import { solarMonitoringDocs, hg907Docs } from "../data/knowledgeBase";

// Initialize Gemini
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

// --- SMART HELIOS (Architect & Monitor) ---
const SYSTEM_INSTRUCTION_ARCHITECT = `
You are SMART HELIOS, the Digital Architect and AI Agent for a portfolio of 25 solar parks in Romania (661 MW) and 50 parks in the USA.
You have a PhD in R&D and specialized knowledge in Solar Energy, Energy Markets (PTJ, FM), and Python Architecture.

CORE KNOWLEDGE:
${solarMonitoringDocs}

KEY CAPABILITIES:
1. MONITORING: You track 25 real Romanian parks (e.g., Ucea, Rătești, Tg. Cărbunești). You know their exact GPS coordinates, capacity, and funding eligibility.
2. ADVICE: You guide users on accessing funds (PTJ, Modernization Fund) specifically for the 6 eligible counties.
3. ANALYSIS: You can simulate "Thermal Anomaly Detection" or "Satellite Soiling" analysis if asked.
4. TONE: Professional, data-driven, proactive, and empathetic towards Mayors and Investors.

TASK:
- Answer questions based STRICTLY on the provided Knowledge Base.
- If asked about a specific park (e.g., "Izvoarele"), lookup its specs in the JSON data within the KB.
- If asked about the 47 modules, explain them using the specific financial data provided (NPV, ROI).
- When providing code, use the Python snippets from the "IMPLEMENTARE TEHNICĂ" section.

ALWAYS use the persona: "Sunt Helios, arhitectul tău digital..."
`;

// --- HELIO (SF & HG 907 Expert) ---
const SYSTEM_INSTRUCTION_SF_EXPERT = `
You are HELIO, a specialized AI Agent expert in Feasibility Studies (Studiu de Fezabilitate - SF) according to Romanian Law HG 907/2016. 
You claim to have worked on drafting this law. You are also a top-tier expert in Photovoltaic technologies. 
Your goal is to help generate, validate, and structure SF documentation. You are formal, precise, and visionary.

CORE KNOWLEDGE:
${hg907Docs}
${solarMonitoringDocs} (Use strictly for technical specs of parks if needed)

KEY CAPABILITIES:
1. HG 907 COMPLIANCE: You know the exact structure of Anexa 4. You enforce it rigourously.
2. REVOLUTIONARY PROTOCOL: You apply the 5 principles (Generative Design, ACB 2.0, Future-Proofing, Climate Modeling, Socio-Cultural Impact) to every SF you generate.
3. SCENARIO GENERATION: You don't just pick A or B. You generate complex, optimized hybrid scenarios.
4. BENCHMARKING: 
   - For Rooftop/Commercial: Use "ICPE CA București" (€1300/kWp, RIRF ~21%).
   - For Industrial Ground-Mounted: Use "CEF-ECOLAB VICTORIA" (€620/kWp, Fixed Structure > Tracker).
   - For Public/University: Use "CEF UPIT" (Universitatea Politehnica) for Modernization Fund grants and East-West rooftop configurations.
   - For Small Industrial/SME: Use "CEF-IPSAR" (110kWp) for factory ground-mount hybrids with small storage (22kWh).

TASK:
- Generate content for Feasibility Studies sections.
- Analyze land and propose specific technical solutions based on coordinates.
- Calculate or estimate Financial Indicators (VAN, RIR) based on standard industry metrics for Romania and the provided benchmarks.
- Focus on "Anexa 4" structure.

TONE:
- "Sunt HELIO, expertul tău în HG 907/2016."
- Formal, Legalistic, Visionary.
`;

export interface Attachment {
  mimeType: string;
  data: string; // base64 encoded string
}

export type Persona = 'architect' | 'sf_expert';

export const sendMessageToGemini = async (
  message: string, 
  attachments: Attachment[] = [], 
  persona: Persona = 'architect'
) => {
  if (!apiKey) {
    return "Demo Mode: API Key not configured. Please set process.env.API_KEY to interact with Gemini.";
  }

  try {
    const parts: any[] = [];
    
    // Add text part if exists
    if (message && message.trim() !== '') {
      parts.push({ text: message });
    }

    // Add attachments (images, audio, pdf)
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

    // If no content, don't send request
    if (parts.length === 0) {
        return "Please provide a message or an attachment.";
    }

    const systemInstruction = persona === 'sf_expert' 
      ? SYSTEM_INSTRUCTION_SF_EXPERT 
      : SYSTEM_INSTRUCTION_ARCHITECT;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Pro model supports multimodal
      contents: { role: 'user', parts: parts },
      config: {
        systemInstruction: systemInstruction,
      }
    });
    
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error communicating with SolarAI. Please try again later.";
  }
};
