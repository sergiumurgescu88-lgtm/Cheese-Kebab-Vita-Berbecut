
// Real OpenWeather Service implementation
// Uses the provided API Key: 23b85268b0536b1f52f36e48e37aa24e

const API_KEY = '23b85268b0536b1f52f36e48e37aa24e';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const ONE_CALL_URL = 'https://api.openweathermap.org/data/3.0/onecall';

export interface WeatherData {
  temp: number;
  humidity: number;
  clouds: number;
  wind_speed: number;
  uvi: number;
  visibility: number;
  pressure: number;
  description: string;
  icon: string;
  dt: number;
}

export interface SolarIrradianceData {
  ghi: number; // Global Horizontal Irradiance (W/m2)
  dni: number; // Direct Normal Irradiance (W/m2)
  dhi: number; // Diffuse Horizontal Irradiance (W/m2)
}

export interface AirQuality {
  aqi: number; // 1-5
  co: number;
  no: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  nh3: number;
}

// Fetch Comprehensive Weather with robust fallbacks
export const fetchOneCall = async (lat: number, lon: number) => {
  // --- TIER 1: ONECALL 3.0 (PREFERRED) ---
  try {
    const response = await fetch(`${ONE_CALL_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&exclude=minutely`);
    if (response.ok) {
      return await response.json();
    }
    if (response.status === 401) {
      console.warn("OneCall 3.0 Unauthorized: Key likely restricted to 2.5 tier. Engaging TIER 2 Fallback.");
    } else {
      throw new Error(`OneCall API failed: ${response.status}`);
    }
  } catch (e) {
    console.error("OneCall 3.0 Error:", e);
  }

  // --- TIER 2: FORECAST 2.5 (HOURLY/3H DATA) ---
  try {
    const response = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    if (response.ok) {
      const data = await response.json();
      // Map 2.5 Forecast to a structure compatible with our 3.0-ready components
      return {
        current: {
          temp: data.list[0].main.temp,
          humidity: data.list[0].main.humidity,
          clouds: data.list[0].clouds.all,
          wind_speed: data.list[0].wind.speed,
          pressure: data.list[0].main.pressure,
          visibility: data.list[0].visibility || 10000,
          uvi: 0, // Not available in 2.5 forecast
          dt: data.list[0].dt,
          weather: data.list[0].weather
        },
        hourly: data.list.map((item: any) => ({
          dt: item.dt,
          temp: item.main.temp,
          clouds: item.clouds.all,
          uvi: 0,
          weather: item.weather
        })),
        daily: [],
        source: 'OpenWeather 2.5 Forecast'
      };
    }
  } catch (e) {
    console.error("Forecast 2.5 Fallback Error:", e);
  }

  // --- TIER 3: CURRENT WEATHER 2.5 (BASIC DATA) ---
  try {
    const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const data = await response.json();
    return {
      current: {
        temp: data.main.temp,
        humidity: data.main.humidity,
        clouds: data.clouds.all,
        wind_speed: data.wind.speed,
        pressure: data.main.pressure,
        visibility: data.visibility || 10000,
        uvi: 0,
        dt: data.dt,
        weather: data.weather
      },
      hourly: [],
      daily: [],
      source: 'OpenWeather 2.5 Current'
    };
  } catch (e) {
    throw new Error("All weather API tiers failed.");
  }
};

// Fetch Air Pollution
export const fetchAirQuality = async (lat: number, lon: number): Promise<AirQuality> => {
  try {
    const response = await fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    const data = await response.json();
    return data.list[0].components;
  } catch (e) {
    console.error("Air Pollution API error", e);
    return { aqi: 1, co: 0, no: 0, no2: 0, o3: 0, so2: 0, pm2_5: 0, pm10: 0, nh3: 0 };
  }
};

/**
 * Solar Irradiance Estimation Logic (MOD-06 Core)
 * Enhanced to handle missing UVI or data from 2.5 APIs.
 */
export const estimateSolarIrradiance = (lat: number, lon: number, clouds: number, uvi: number, timestamp: number): SolarIrradianceData => {
  const date = new Date(timestamp * 1000);
  const hour = date.getHours();
  
  // Night check
  if (hour < 5 || hour > 20) return { ghi: 0, dni: 0, dhi: 0 };

  // 1. Calculate Sun Altitude (Simplified)
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180));
  const hourAngle = (hour - 12) * 15;
  const latRad = lat * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);
  const hrRad = hourAngle * (Math.PI / 180);
  
  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hrRad);
  const altitude = Math.asin(sinAlt) * (180 / Math.PI);

  if (altitude <= 0) return { ghi: 0, dni: 0, dhi: 0 };

  // 2. Clear Sky GHI (Haurwitz model simplified)
  const I0 = 1367; // Solar constant
  const clearSkyGHI = I0 * sinAlt * 0.7; // Basic atmospheric transmittance

  // 3. Cloud Impact (Non-linear)
  const cloudFactor = 1 - (0.75 * Math.pow(clouds / 100, 3));
  const ghi = clearSkyGHI * cloudFactor;

  // 4. DNI/DHI partition (Simplified Reindl model)
  const kt = ghi / (I0 * sinAlt); // Clearness index
  let diffuseFraction = 1;
  if (kt > 0.3 && kt <= 0.7) diffuseFraction = 1.1 - 1.13 * kt;
  else if (kt > 0.7) diffuseFraction = 0.3;

  const dhi = ghi * diffuseFraction;
  const dni = (ghi - dhi) / sinAlt;

  return {
    ghi: Math.round(ghi),
    dni: Math.round(dni),
    dhi: Math.round(dhi)
  };
};
