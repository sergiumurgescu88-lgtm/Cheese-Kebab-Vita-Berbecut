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
  const PORT = parseInt(process.env.PORT || '3001');

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

  // ─── PVGIS (European Commission, fără API key) ───────────────────────────
  app.get('/api/pvgis', async (req, res) => {
    const { lat, lon, peakpower = '1' } = req.query;
    try {
      const url = `https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=${lat}&lon=${lon}&peakpower=${peakpower}&loss=14&outputformat=json&mountingplace=free&pvtechchoice=crystSi`;
      const r = await axios.get(url, { timeout: 15000 });
      res.json(r.data);
    } catch(e: any) { res.status(502).json({ error: e.message }); }
  });

  // ─── GEOCODE (Nominatim OpenStreetMap, fără API key) ────────────────────
  app.get('/api/geocode', async (req, res) => {
    const { lat, lon } = req.query;
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
      const r = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'HELIO-SF-Platform/1.0 (contact@helioplatform.ro)' }
      });
      const a = r.data?.address || {};
      // Construim adresa din componente — evităm POI-uri (cimitire, biserici etc.)
      const strada = a.road || a.pedestrian || a.path || '';
      const localitate = a.village || a.town || a.city || a.municipality || '';
      const comuna = a.county || a.state_district || '';
      const judet = a.state || '';
      const parts = [strada, localitate, comuna, judet].filter(Boolean);
      const formatted_address = parts.join(', ') || r.data?.display_name || '';
      // Wrap în format compatibil cu ce așteaptă SFEngine (results[0].formatted_address)
      res.json({ results: [{ formatted_address }] });
    } catch(e: any) { res.status(502).json({ error: e.message }); }
  });

  // ─── ELEVATION (Open-Elevation, fără API key) ────────────────────────────
  app.get('/api/elevation', async (req, res) => {
    const { lat, lon } = req.query;
    try {
      // Open-Meteo elevation — gratuit, fiabil, fără API key
      const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
      const r = await axios.get(url, { timeout: 10000 });
      const elev = r.data?.elevation?.[0] ?? null;
      // Wrap în formatul open-elevation pentru compatibilitate cu SFEngine
      res.json({ results: [{ elevation: elev, latitude: lat, longitude: lon }] });
    } catch(e: any) { res.status(502).json({ error: e.message }); }
  });

  // ─── AIR QUALITY (OpenAQ sau Open-Meteo AQI, fără API key) ──────────────
  app.get('/api/airquality', async (req, res) => {
    const { lat, lon } = req.query;
    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5&timezone=auto`;
      const r = await axios.get(url, { timeout: 10000 });
      const aqi = r.data?.current?.european_aqi ?? 50;
      const pm10 = r.data?.current?.pm10 ?? 0;
      const pm25 = r.data?.current?.pm2_5 ?? 0;
      const dominant = pm25 > pm10 * 0.6 ? 'pm25' : 'pm10';
      const category = aqi <= 20 ? 'Excellent' : aqi <= 40 ? 'Good' : aqi <= 60 ? 'Fair' : aqi <= 80 ? 'Moderate' : aqi <= 100 ? 'Poor' : 'Very Poor';
      res.json({ indexes: [{ aqi, category, dominantPollutant: dominant }] });
    } catch(e: any) { res.status(502).json({ error: e.message }); }
  });

  // ─── STATIC MAP (placeholder SVG — fără Google Maps key) ────────────────
  app.get('/api/staticmap', async (req, res) => {
    const { lat, lon } = req.query;
    const zoom = 14;
    // Folosim tile OSM via redirect — fără API key
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lon as string)-0.01},${parseFloat(lat as string)-0.01},${parseFloat(lon as string)+0.01},${parseFloat(lat as string)+0.01}&layer=mapnik&marker=${lat},${lon}`;
    // Returnăm SVG cu link embed
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="#e8f4e8"/><text x="300" y="130" text-anchor="middle" font-family="Arial" font-size="15" fill="#2d6a2d" font-weight="bold">📍 Amplasament Parc Fotovoltaic</text><text x="300" y="158" text-anchor="middle" font-family="Arial" font-size="12" fill="#444">${lat}, ${lon}</text><text x="300" y="185" text-anchor="middle" font-family="Arial" font-size="11" fill="#666">OpenStreetMap © contributors</text></svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  // ─── PLACES (returnează empty — fără Google Maps key) ───────────────────
  app.get('/api/places', async (req, res) => {
    res.json({ results: [] });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'HELIOS Platform Full-Stack' });
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
