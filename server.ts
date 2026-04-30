import express from "express";
import cors from "cors";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
const TICKETS_FILE = '/tmp/helios_tickets.json';
const TG_TOKEN = '8318347456:AAGRdwa0Z7Tvhp2lzovO-C-WvnZoAq_b4DU';
const TG_CHAT = '7758960424';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000');

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
  // /api/ai/openrouter → GoogleGenAI SDK cu rotație 4 key-uri (primary pentru SFEngine)
  const GEMINI_KEYS_ROT = [
    "AIzaSyDq4yo9eWtoHD3Qa6NDFv3XhT0QRcX-CdA",
    "AIzaSyBZW0SD6e8RMMf-0hz-j5vlR-rVTWbxZ0s",
    "AIzaSyDfEdiGs6KHL2EipVQIZOxKVfsOHydiiO8",
    "AIzaSyBJsmpHyeyr28yt5fkXpWZgxkCK3xp66Mk",
    "AIzaSyCZgJy7Hon8Ees9-36OOHE0OnryvU4VI20"
  ];
  let gKeyIdx = 0;
  app.post('/api/ai/openrouter', async (req, res) => {
    const { messages, systemInstruction } = req.body;
    for (let i = 0; i < GEMINI_KEYS_ROT.length; i++) {
      const key = GEMINI_KEYS_ROT[(gKeyIdx + i) % GEMINI_KEYS_ROT.length];
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: key });
        const prompt = messages.map((m: any) => m.content).join('\n');
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            temperature: 0.6,
            maxOutputTokens: 8192
          }
        });
        gKeyIdx = (gKeyIdx + i) % GEMINI_KEYS_ROT.length;
        return res.json({ text: response.text });
      } catch (error: any) {
        const status = error?.status || error?.response?.status;
        console.warn(`Gemini key ${(gKeyIdx+i)%GEMINI_KEYS_ROT.length} failed (${status})`);
        if (i === GEMINI_KEYS_ROT.length - 1) {
          return res.status(500).json({ error: true, message: error?.message || 'Gemini failed' });
        }
      }
    }
  });


  // /api/ai/scada → OpenRouter (dedicat SCADA, nu atinge SFEngine)
  app.post('/api/ai/scada', async (req, res) => {
    const { messages, systemInstruction } = req.body;
    try {
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'google/gemini-2.5-flash',
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          ...messages
        ],
        max_tokens: 4096,
        temperature: 0.6
      }, {
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sergiu.online',
          'X-Title': 'HELIOS SCADA'
        }
      });
      res.json({ text: response.data.choices[0].message.content });
    } catch (error: any) {
      console.error('SCADA AI Error:', error.response?.data || error.message);
      res.status(500).json({ error: true, message: error.response?.data?.message || error.message });
    }
  });

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
      const formatted_address = parts.join(', ');  // FIX: fara fallback display_name (elimina cimitire/POI)
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


  // ============ TICKETS SYSTEM + TELEGRAM ============

  function loadTickets() {
    try { return JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf-8')); } catch { return []; }
  }
  function saveTickets(t: any[]) {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(t, null, 2));
  }
  async function sendTelegram(msg: string) {
    try {
      await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        chat_id: TG_CHAT, text: msg, parse_mode: 'HTML'
      });
    } catch(e) { console.error('Telegram error:', e); }
  }

  app.get('/api/tickets', (req, res) => {
    res.json(loadTickets());
  });

  app.post('/api/tickets', async (req, res) => {
    const tickets = loadTickets();
    const t = {
      id: 'TK-' + Date.now(),
      site: req.body.site,
      severitate: req.body.severitate,
      problema: req.body.problema,
      cauza: req.body.cauza,
      actiune: req.body.actiune,
      timestamp: new Date().toISOString(),
      status: 'DESCHIS'
    };
    tickets.unshift(t);
    saveTickets(tickets);
    if (t.severitate === 'critica') {
      const msg = `🚨 <b>HELIOS ALERT — TICHET CRITIC</b>\n\n` +
        `📍 <b>Site:</b> ${t.site}\n` +
        `⚠️ <b>Problemă:</b> ${t.problema}\n` +
        `🔍 <b>Cauză:</b> ${t.cauza}\n` +
        `✅ <b>Acțiune:</b> ${t.actiune}\n` +
        `🕐 <b>Timp:</b> ${new Date().toLocaleString('ro-RO')}\n` +
        `🆔 <b>ID:</b> ${t.id}\n\n` +
        `🔗 https://scada.sergiu.online`;
      await sendTelegram(msg);
    }
    res.json(t);
  });

  app.patch('/api/tickets/:id', (req, res) => {
    const tickets = loadTickets();
    const idx = tickets.findIndex((t: any) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'not found' });
    tickets[idx].status = req.body.status;
    tickets[idx].updatedAt = new Date().toISOString();
    saveTickets(tickets);
    res.json(tickets[idx]);
  });

  app.post('/api/tickets/telegram', async (req, res) => {
    const tickets = loadTickets();
    const t = tickets.find((x: any) => x.id === req.body.id);
    if (!t) return res.status(404).json({ error: 'not found' });
    const sevIcon = t.severitate==='critica'?'🚨':t.severitate==='medie'?'🟡':'🟢';
    const statIcon = t.status==='REZOLVAT'?'✅':t.status==='IN_LUCRU'?'⚙️':'📂';
    const msg = `${sevIcon} <b>HELIOS TICHET — ${t.severitate.toUpperCase()}</b>\n\n` +
      `📍 <b>Site:</b> ${t.site}\n` +
      `⚠️ <b>Problemă:</b> ${t.problema}\n` +
      `🔍 <b>Cauză:</b> ${t.cauza}\n` +
      `✅ <b>Acțiune:</b> ${t.actiune}\n` +
      `${statIcon} <b>Status:</b> ${t.status}\n` +
      `🕐 <b>Creat:</b> ${new Date(t.timestamp).toLocaleString('ro-RO')}\n` +
      `🆔 <b>ID:</b> ${t.id}\n\n` +
      `🔗 https://scada.sergiu.online`;
    try {
      await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        chat_id: TG_CHAT, text: msg, parse_mode: 'HTML'
      });
      res.json({ ok: true });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  
  // ===== TELEGRAM WEBHOOK =====
  app.post('/api/telegram/webhook', async (req, res) => {
    res.json({ ok: true });
    const msg = req.body?.message;
    if (!msg) return;
    const chatId = msg.chat?.id?.toString();
    const text = (msg.text || '').trim().toLowerCase();
    const from = msg.from?.first_name || 'User';

    async function reply(txt: string) {
      await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        chat_id: chatId, text: txt, parse_mode: 'HTML'
      });
    }

    if (text === '/start' || text === '/help') {
      await reply(
        `<b>HELIOS SCADA Bot</b> — Comenzi disponibile:\n\n` +
        `/status — KPI-uri live\n` +
        `/tichete — Tichete deschise\n` +
        `/critic — Tichete critice\n` +
        `/rezolva ID — Rezolva tichet\n` +
        `/sterge ID — Sterge tichet\n` +
        `/sites — Toate parcurile\n` +
        `/help — Aceasta lista\n\n` +
        `<a href="https://scada.sergiu.online">Deschide SCADA</a>`
      );
    } else if (text === '/status') {
      const tickets = loadTickets();
      const critice = tickets.filter((t: any) => t.severitate === 'critica' && t.status === 'DESCHIS').length;
      await reply(
        `<b>HELIOS SCADA — Status Live</b>\n\n` +
        `<b>Capacitate:</b> 901.7 MWp\n` +
        `<b>Tichete critice deschise:</b> ${critice}\n` +
        `<b>Total tichete:</b> ${tickets.length}\n` +
        `<b>Ora:</b> ${new Date().toLocaleString('ro-RO')}\n\n` +
        `<a href="https://scada.sergiu.online">Vezi SCADA Live</a>`
      );
    } else if (text === '/tichete') {
      const tickets = loadTickets().filter((t: any) => t.status === 'DESCHIS').slice(0, 5);
      if (tickets.length === 0) {
        await reply('Nu exista tichete deschise.');
      } else {
        let txt = '<b>Tichete Deschise:</b>\n\n';
        tickets.forEach((t: any) => {
          const icon = t.severitate === 'critica' ? '🚨' : t.severitate === 'medie' ? '🟡' : '🟢';
          txt += `${icon} <b>${t.site}</b> — ${t.problema}\n<code>${t.id}</code>\n\n`;
        });
        await reply(txt);
      }
    } else if (text === '/critic') {
      const tickets = loadTickets().filter((t: any) => t.severitate === 'critica' && t.status === 'DESCHIS');
      if (tickets.length === 0) {
        await reply('Nu exista tichete critice deschise.');
      } else {
        let txt = '<b>Tichete CRITICE:</b>\n\n';
        tickets.forEach((t: any) => {
          txt += `🚨 <b>${t.site}</b>\nProblema: ${t.problema}\nActiune: ${t.actiune}\nID: <code>${t.id}</code>\n\n`;
        });
        await reply(txt);
      }
    } else if (text.startsWith('/rezolva ')) {
      const id = msg.text.trim().split(' ')[1];
      const tickets = loadTickets();
      const idx = tickets.findIndex((t: any) => t.id === id);
      if (idx === -1) {
        await reply(`Tichet <code>${id}</code> negasit.`);
      } else {
        tickets[idx].status = 'REZOLVAT';
        tickets[idx].updatedAt = new Date().toISOString();
        saveTickets(tickets);
        await reply(`Tichet <code>${id}</code> marcat ca REZOLVAT.`);
      }
    } else if (text.startsWith('/sterge ')) {
      const id = msg.text.trim().split(' ')[1];
      const tickets = loadTickets();
      const filtered = tickets.filter((t: any) => t.id !== id);
      if (filtered.length === tickets.length) {
        await reply(`Tichet <code>${id}</code> negasit.`);
      } else {
        saveTickets(filtered);
        await reply(`Tichet <code>${id}</code> sters.`);
      }
    } else if (text === '/sites') {
      await reply(
        '<b>Parcuri Helios by Sergiu — 46 situri</b>\n\n' +
        '40 Operationale | 5 In constructie | 1 Finalizat\n' +
        'Capacitate totala: 901.7 MWp\n\n' +
        '<a href="https://scada.sergiu.online">Vezi harta live</a>'
      );
    } else {
      await reply('Comanda necunoscuta. Trimite /help pentru lista comenzilor.');
    }
  });

  // Register webhook on startup
  (async () => {
    try {
      await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/setWebhook`, {
        url: 'https://sergiu.online/api/telegram/webhook'
      });
      console.log('Telegram webhook registered.');
    } catch(e) { console.error('Webhook reg error:', e); }
  })();

  app.delete('/api/tickets/:id', (req, res) => {
    let tickets = loadTickets();
    tickets = tickets.filter((t: any) => t.id !== req.params.id);
    saveTickets(tickets);
    res.json({ ok: true });
  });
  // ============ END TICKETS ============


  // ============ FUSIONSOLAR MOCK ENDPOINTS ============
  const fsMockStations = [
    { plantCode: 'NE-241643342', plantName: 'Căzănești (Ialomița)', capacity: 9.13, lat: 44.55, lon: 27.45, currentPower: 6.8, dailyEnergy: 42.1, monthlyEnergy: 980, status: 'NORMAL', mock: true },
    { plantCode: 'NE-241643343', plantName: 'Mircea Vodă (Constanța)', capacity: 34, lat: 44.01, lon: 27.98, currentPower: 24.5, dailyEnergy: 156.3, monthlyEnergy: 3620, status: 'NORMAL', mock: true },
    { plantCode: 'NE-241643344', plantName: 'Babadag (Tulcea)', capacity: 18.27, lat: 44.89, lon: 28.72, currentPower: 0, dailyEnergy: 89.4, monthlyEnergy: 2100, status: 'ALARM', mock: true },
    { plantCode: 'NE-241643345', plantName: 'Șimleu Silvaniei (Sălaj)', capacity: 48, lat: 47.23, lon: 22.80, currentPower: 31.2, dailyEnergy: 198.7, monthlyEnergy: 4580, status: 'NORMAL', mock: true },
    { plantCode: 'NE-241643346', plantName: 'Stâlpu (Buzău)', capacity: 5.35, lat: 45.18, lon: 26.97, currentPower: 4.1, dailyEnergy: 26.8, monthlyEnergy: 620, status: 'NORMAL', mock: true },
  ];

  app.get('/api/fusionsolar/stations', (req: any, res: any) => {
    const stations = fsMockStations.map(s => ({
      ...s,
      currentPower: s.status === 'ALARM' ? 0 : parseFloat((s.capacity * (0.6 + Math.random() * 0.25)).toFixed(2)),
    }));
    res.json({ success: true, data: stations });
  });

  app.get('/api/fusionsolar/realtime/:plantCode', (req: any, res: any) => {
    const station = fsMockStations.find(s => s.plantCode === req.params.plantCode);
    if (!station) return res.json({ success: false, data: null });
    const invertors = Array.from({ length: 6 }, (_, i) => ({
      sn: `SN-${station.plantCode.slice(-3)}-INV${String(i+1).padStart(2,'0')}`,
      model: 'SUN2000-100KTL-M2',
      activePower: station.status === 'ALARM' && i === 2 ? 0 : parseFloat((station.capacity / 6 * (0.85 + Math.random() * 0.12) * 1000).toFixed(1)),
      efficiency: parseFloat((97.5 + Math.random() * 1.2).toFixed(1)),
      temperature: parseFloat((42 + Math.random() * 8).toFixed(1)),
      status: station.status === 'ALARM' && i === 2 ? 'FAULT' : 'RUNNING',
      alarms: station.status === 'ALARM' && i === 2 ? ['Grid Frequency Abnormal'] : [],
    }));
    res.json({ success: true, data: { plant: station, invertors, mock: true, ts: Date.now() } });
  });

  app.get('/api/fusionsolar/history/:plantCode', (req: any, res: any) => {
    const station = fsMockStations.find(s => s.plantCode === req.params.plantCode);
    if (!station) return res.json({ success: false, data: [] });
    const days = parseInt((req.query as any).days) || 7;
    const history = Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const energy = parseFloat((station.capacity * 4.5 * (0.8 + Math.random() * 0.3)).toFixed(1));
      return { date: dateStr, energy, peakPower: parseFloat((station.capacity * 0.92).toFixed(2)), irradiance: parseFloat((4.8 + Math.random() * 1.2).toFixed(2)), pr: parseFloat((82 + Math.random() * 8).toFixed(1)) };
    });
    res.json({ success: true, data: history });
  });
  // ============ END FUSIONSOLAR ============

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
