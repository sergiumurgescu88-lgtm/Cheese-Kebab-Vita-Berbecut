// liveDashboardService.ts
// Detectează automat portul backend din URL-ul curent

const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    // Dacă rulăm pe portul Vite (5173), backend-ul e pe 3002
    // Dacă rulăm direct din Express (3002), folosim același origin
    if (port === '5173' || port === '3000') {
      return `${protocol}//${hostname}:3002`;
    }
    return `${protocol}//${hostname}:${port}`;
  }
  return 'http://localhost:3002';
};

export const BACKEND_URL = getBackendUrl();

// ─── TIPURI ──────────────────────────────────────────────────────────────────

export interface LiveWeather {
  temperature: number;       // °C
  irradiance: number;        // W/m²  (estimat din cloud cover)
  cloudCover: number;        // %
  windSpeed: number;         // km/h
  humidity: number;          // %
  condition: string;         // "Clear" | "Cloudy" | "Partly Cloudy" | "Rain"
  uvIndex: number;
  sunrise: string;           // "06:23"
  sunset: string;            // "20:41"
  fetchedAt: Date;
}

export interface LivePlantKPI {
  stationCode: string;
  stationName: string;
  capacityKW: number;
  currentPowerKW: number;    // kW live
  performanceRatio: number;  // %
  dayEnergyKWh: number;
  monthEnergyMWh: number;
  totalEnergyGWh: number;
  dayRevenueEUR: number;
  totalRevenueEUR: number;
  co2SavedTons: number;
  irradiance: number;        // W/m²
  lastUpdate: Date;
}

export interface HourlyPoint {
  hour: string;
  powerKW: number;
  irradiance: number;
  temperatureC: number;
}

export interface LiveDashboardData {
  weather: LiveWeather | null;
  kpi: LivePlantKPI | null;
  hourlyChart: HourlyPoint[];
  alarms: { id: number; name: string; device: string; severity: 'critical' | 'major' | 'minor'; time: Date }[];
  devices: { id: number; name: string; powerKW: number; efficiencyPct: number; tempC: number; online: boolean }[];
  pvgisAnnualKWh: number | null;
  fetchedAt: Date;
}

// ─── WEATHER FETCH (Open-Meteo via backend proxy) ────────────────────────────

export async function fetchLiveWeather(lat: number, lon: number): Promise<LiveWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,uv_index,weather_code` +
    `&daily=sunrise,sunset&timezone=auto&forecast_days=1`;

  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('Weather fetch failed');
  const d = await r.json();

  const cur = d.current;
  const cloudCover: number = cur.cloud_cover ?? 50;
  const uvIndex: number = cur.uv_index ?? 0;

  // Estimare iradianță din cloud cover + oră solară
  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
  const solarAngle = Math.max(0, Math.sin((nowHour - 6) * Math.PI / 14)); // peak la 13:00
  const clearSkyIrradiance = solarAngle * 1000;
  const irradiance = Math.round(clearSkyIrradiance * (1 - cloudCover / 100 * 0.75));

  const wcode: number = cur.weather_code ?? 0;
  const condition = wcode === 0 ? 'Clear' :
    wcode <= 3 ? 'Partly Cloudy' :
    wcode <= 48 ? 'Foggy' :
    wcode <= 67 ? 'Rain' :
    wcode <= 77 ? 'Snow' : 'Thunderstorm';

  // Sunrise/sunset din daily
  const sunrise = d.daily?.sunrise?.[0]
    ? new Date(d.daily.sunrise[0]).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    : '06:30';
  const sunset = d.daily?.sunset?.[0]
    ? new Date(d.daily.sunset[0]).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    : '20:30';

  return {
    temperature: cur.temperature_2m ?? 20,
    irradiance,
    cloudCover,
    windSpeed: cur.wind_speed_10m ?? 0,
    humidity: cur.relative_humidity_2m ?? 50,
    condition,
    uvIndex,
    sunrise,
    sunset,
    fetchedAt: new Date(),
  };
}

// ─── PVGIS FETCH (annual yield via backend) ──────────────────────────────────

export async function fetchPVGIS(lat: number, lon: number, peakMW: number): Promise<number | null> {
  try {
    const r = await fetch(`${BACKEND_URL}/api/pvgis?lat=${lat}&lon=${lon}&peakpower=${peakMW * 1000}`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    return d?.outputs?.totals?.fixed?.E_y ?? null; // kWh/kWp/an
  } catch {
    return null;
  }
}

// ─── SOLAR POWER SIMULATION realistă ─────────────────────────────────────────
// Bazată pe: capacitate, iradianță live, temperatură panou, degradare TOPCon

function calcInstantPower(
  capacityKW: number,
  irradiance: number,       // W/m²
  ambientTempC: number,
  cloudCoverPct: number
): number {
  if (irradiance < 20) return 0;

  // Temperatura panoului (NOCT model)
  const panelTemp = ambientTempC + (irradiance / 800) * (45 - 20);
  // Coeficient temperatură TOPCon: -0.29%/°C față de STC (25°C)
  const tempFactor = 1 + (-0.0029) * (panelTemp - 25);
  // Eficiența la iradianță parțială (low-light performance TOPCon ~96%)
  const irrFactor = Math.pow(irradiance / 1000, 0.95);
  // PR sistem: cablare + invertor + soiling
  const systemPR = 0.87;

  return Math.max(0, capacityKW * irrFactor * tempFactor * systemPR);
}

// ─── GENERARE DATE ORARE pentru grafic ───────────────────────────────────────

export function generateHourlyChart(
  capacityKW: number,
  weather: LiveWeather
): HourlyPoint[] {
  const now = new Date();
  const currentHour = now.getHours();

  return Array.from({ length: 24 }, (_, h) => {
    const solarAngle = Math.max(0, Math.sin((h - 6) * Math.PI / 14));
    const baseIrr = solarAngle * 950;
    // Ore viitoare: folosim cloud cover curent; ore trecute: variem ușor
    const cloudFactor = h <= currentHour
      ? (1 - (weather.cloudCover + (Math.random() - 0.5) * 20) / 100 * 0.75)
      : (1 - weather.cloudCover / 100 * 0.75);
    const irr = Math.max(0, Math.round(baseIrr * cloudFactor));
    const temp = weather.temperature + Math.sin((h - 14) * Math.PI / 12) * 5;
    const power = h > currentHour
      ? Math.round(calcInstantPower(capacityKW, irr, temp, weather.cloudCover))
      : h === currentHour
      ? Math.round(calcInstantPower(capacityKW, weather.irradiance, weather.temperature, weather.cloudCover))
      : Math.round(calcInstantPower(capacityKW, irr, temp, weather.cloudCover) * (0.9 + Math.random() * 0.1));

    return {
      hour: `${h.toString().padStart(2, '0')}:00`,
      powerKW: power,
      irradiance: irr,
      temperatureC: Math.round(temp * 10) / 10,
    };
  });
}

// ─── KPI CALCUL DIN WEATHER + CONFIGURAȚIE PARC ──────────────────────────────

export function calcLiveKPI(
  stationCode: string,
  stationName: string,
  capacityKW: number,
  weather: LiveWeather,
  pvgisKwhPerKwp: number | null
): LivePlantKPI {
  const currentPower = calcInstantPower(
    capacityKW, weather.irradiance, weather.temperature, weather.cloudCover
  );

  const performanceRatio = weather.irradiance > 50
    ? Math.min(100, (currentPower / (capacityKW * weather.irradiance / 1000)) * 100)
    : 0;

  // Energie zilnică: integrăm curba solară estimată (trapez)
  const now = new Date();
  const hoursPassed = now.getHours() + now.getMinutes() / 60;
  const annualSpecific = pvgisKwhPerKwp ?? 1446; // kWh/kWp/an fallback Romania
  const dayFraction = 1 / 365;
  const dayEnergyKWh = Math.round(annualSpecific * capacityKW / 1000 * dayFraction * 1000 * (hoursPassed / 24) * 0.95);

  const tariffEurMWh = 72; // €/MWh spot aproximativ
  const dayRevenueEUR = Math.round(dayEnergyKWh / 1000 * tariffEurMWh);

  // Totale fictive dar realiste pentru 45 MW, 3 ani operare
  const yearsOp = 3.2;
  const totalEnergyGWh = Math.round(annualSpecific * capacityKW / 1000 / 1000 * yearsOp * 10) / 10;
  const totalRevenueEUR = Math.round(totalEnergyGWh * 1000 * tariffEurMWh);
  const co2SavedTons = Math.round(totalEnergyGWh * 1000 * 0.255); // 255 g CO2/kWh grid RO

  return {
    stationCode,
    stationName,
    capacityKW,
    currentPowerKW: Math.round(currentPower),
    performanceRatio: Math.round(performanceRatio * 10) / 10,
    dayEnergyKWh,
    monthEnergyMWh: Math.round(dayEnergyKWh * 28 / 1000),
    totalEnergyGWh,
    dayRevenueEUR,
    totalRevenueEUR,
    co2SavedTons,
    irradiance: weather.irradiance,
    lastUpdate: new Date(),
  };
}

// ─── DEVICE STATUS REALIST ────────────────────────────────────────────────────

export function generateDevices(capacityKW: number, currentPowerKW: number) {
  const nInverters = Math.ceil(capacityKW / 100); // SUN2000-100KTL
  const powerPerInv = currentPowerKW > 0 ? currentPowerKW / nInverters : 0;

  return Array.from({ length: Math.min(nInverters, 8) }, (_, i) => ({
    id: 100 + i + 1,
    name: `INV-${String(i + 1).padStart(2, '0')} (SUN2000-100KTL)`,
    powerKW: Math.round((powerPerInv + (Math.random() - 0.5) * 3) * 10) / 10,
    efficiencyPct: 98.2 + (Math.random() - 0.5) * 0.8,
    tempC: Math.round(35 + (powerPerInv / 100) * 15 + (Math.random() - 0.5) * 3),
    online: Math.random() > 0.02, // 98% uptime
  }));
}

// ─── MAIN FETCH FUNCTION ──────────────────────────────────────────────────────

const PLANT_CONFIG = {
  stationCode: '241643342',
  stationName: 'HelioSolar Plant NE-45MW',
  capacityKW: 45000,
  lat: 44.4268,
  lon: 26.1025,
};

let _pvgisCache: number | null = null;

export async function fetchLiveDashboard(): Promise<LiveDashboardData> {
  // 1. Weather live (Open-Meteo, gratuit, fără key)
  const weather = await fetchLiveWeather(PLANT_CONFIG.lat, PLANT_CONFIG.lon);

  // 2. PVGIS (cache-uit, doar la prima încărcare)
  if (_pvgisCache === null) {
    _pvgisCache = await fetchPVGIS(PLANT_CONFIG.lat, PLANT_CONFIG.lon, PLANT_CONFIG.capacityKW / 1000);
  }

  // 3. KPI calculat din weather live
  const kpi = calcLiveKPI(
    PLANT_CONFIG.stationCode,
    PLANT_CONFIG.stationName,
    PLANT_CONFIG.capacityKW,
    weather,
    _pvgisCache
  );

  // 4. Grafic orar
  const hourlyChart = generateHourlyChart(PLANT_CONFIG.capacityKW, weather);

  // 5. Alarme (1 alarmă grid dacă puterea < 50% din capacitate în orele solare)
  const nowHour = new Date().getHours();
  const isSolarHour = nowHour >= 7 && nowHour <= 19;
  const alarms = (isSolarHour && kpi.currentPowerKW < PLANT_CONFIG.capacityKW * 0.3)
    ? [{ id: 1, name: 'Output Below 30% Threshold', device: 'INV-ARRAY-01', severity: 'major' as const, time: new Date() }]
    : [];

  // 6. Device status
  const devices = generateDevices(PLANT_CONFIG.capacityKW, kpi.currentPowerKW);

  return {
    weather,
    kpi,
    hourlyChart,
    alarms,
    devices,
    pvgisAnnualKWh: _pvgisCache,
    fetchedAt: new Date(),
  };
}
