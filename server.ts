import express from "express";
import cors from "cors";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- FusionSolar Proxy Logic ---
  let tokenCache = {
    token: null,
    expiresAt: 0
  };

  const BASE_URL = process.env.FUSIONSOLAR_BASEURL || 'https://eu5.fusionsolar.huawei.com';
  const API_USER = process.env.FUSIONSOLAR_USERNAME;
  const SYSTEM_CODE = process.env.FUSIONSOLAR_SYSTEMCODE;

  async function getAuthToken() {
    const now = Date.now();
    if (tokenCache.token && now < tokenCache.expiresAt) {
      return tokenCache.token;
    }

    try {
      const response = await axios.post(`${BASE_URL}/thirdData/login`, {
        userName: API_USER,
        systemCode: SYSTEM_CODE
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        tokenCache = {
          token: response.headers['xsrf-token'],
          expiresAt: now + (25 * 60 * 1000)
        };
        return tokenCache.token;
      } else {
        throw new Error(`Login failed: ${response.data.failCode}`);
      }
    } catch (error: any) {
      console.error('FusionSolar Auth Error:', error.message);
      throw error;
    }
  }

  app.post('/api/proxy', async (req, res) => {
    const { endpoint, body } = req.body;
    try {
      const token = await getAuthToken();
      const response = await axios.post(`${BASE_URL}${endpoint}`, body || {}, {
        headers: {
          'Content-Type': 'application/json',
          'XSRF-TOKEN': token
        }
      });
      res.json(response.data);
    } catch (error: any) {
      if (error.response && (error.response.status === 401 || error.response.data?.failCode === 305)) {
        tokenCache.token = null;
      }
      res.status(error.response?.status || 500).json({
        success: false,
        message: error.message,
        data: error.response?.data
      });
    }
  });

  // --- NVIDIA AI Proxy Logic ---
  const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

  const AI_MODELS = {
    kimi: {
      key: "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",
      model: "moonshotai/kimi-k2.5" 
    },
    qwen: {
      key: "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",
      model: "qwen/qwen3.5-122b-a10b"
    },
    glm5: {
      key: "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",
      model: "z-ai/glm5"
    },
    deepseek: {
      key: "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",
      model: "deepseek-ai/deepseek-v3.2"
    }
  };

  const createAIRoute = (name: keyof typeof AI_MODELS) => {
    app.post(`/api/ai/${name}`, async (req, res) => {
      const { messages, systemInstruction } = req.body;
      const config = AI_MODELS[name];

      try {
        const response = await axios.post(`${NVIDIA_BASE_URL}/chat/completions`, {
          model: config.model,
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            ...messages
          ],
          temperature: (name === 'deepseek' || name === 'kimi' || name === 'glm5') ? 1 : 0.6,
          top_p: (name === 'kimi' || name === 'glm5') ? 1 : 0.95,
          max_tokens: (name === 'qwen' || name === 'kimi') ? 16384 : 8192,
          ...( (name === 'qwen' || name === 'deepseek' || name === 'kimi' || name === 'glm5') ? { 
            chat_template_kwargs: { 
              [name === 'deepseek' ? 'thinking' : 'enable_thinking']: true,
              ...(name === 'glm5' ? { clear_thinking: false } : {})
            } 
          } : {})
        }, {
          headers: {
            "Authorization": `Bearer ${config.key}`,
            "Content-Type": "application/json"
          }
        });

        res.json({ text: response.data.choices[0].message.content });
      } catch (error: any) {
        console.error(`AI Error [${name}]:`, error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
          error: true,
          message: error.response?.data?.message || error.message
        });
      }
    });
  };

  createAIRoute("kimi");
  createAIRoute("qwen");
  createAIRoute("glm5");
  createAIRoute("deepseek");

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Smart Renowable Energy Full-Stack' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
