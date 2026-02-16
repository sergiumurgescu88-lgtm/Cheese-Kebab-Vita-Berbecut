
import { GoogleGenAI, Type, Schema } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Analyze Image (Gemini 3 Pro Preview)
   * Uses Thinking Mode for complex analysis
   */
  async analyzeImage(base64Data: string, mimeType: string, prompt: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType } }
          ]
        }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 32768 } // Max thinking budget for deep analysis
      }
    });
    return response.text;
  }

  /**
   * Edit Image (Gemini 2.5 Flash Image)
   * Fast editing with text prompt
   */
  async editImage(base64Data: string, mimeType: string, editPrompt: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: editPrompt }
          ]
        }
      ]
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image part returned in edit response");
  }

  /**
   * Generate Image (Gemini 3 Pro Image Preview)
   * High fidelity generation with size and aspect ratio control
   */
  async generateImage(
    prompt: string, 
    size: "1K" | "2K" | "4K" = "1K", 
    aspectRatio: string = "1:1"
  ) {
    // Check for API key selection as per Veo/Pro-Image rules
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: aspectRatio
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  }
}
