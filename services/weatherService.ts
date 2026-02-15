
export interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  clouds: number;
  wind_speed: number;
  visibility: number;
  description: string;
  icon: string;
  dt: number;
  sunrise: number;
  sunset: number;
}

export interface SolarMetrics {
  ghi: number; // Global Horizontal Irradiance
  dni: number; // Direct Normal Irradiance
  expectedPower: number; // kW
  efficiency: number; // %
}

export interface ForecastItem extends WeatherData, SolarMetrics {}

const API_KEY = process.env.VITE_OPENWEATHER_API_KEY || 'YOUR_API_KEY_HERE';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
const INSTALLED_CAPACITY = 100000; // 100 MW = 100,000 kW
const PANEL_EFFICIENCY_BASE = 0.18; // 18%

let weatherCache: { [key: string]: { data: any; timestamp: number } } = {};

const getCacheKey = (lat: number, lon: number, type: string) => `${lat}_${lon}_${type}`;

// Solar Calculation Logic based on MOD-06 Specifications
const calculateSolarMetrics = (weather: any, lat: number, lon: number, timestamp: number): SolarMetrics => {
  const cloudCover = weather.clouds?.all ?? weather.clouds ?? 0;
  const visibility = weather.visibility ?? 10000;
  const temp = weather.main?.temp ?? weather.temp ?? 25;

  // 1. GHI Calculation
  // GHI = GHI_max * cloud_factor * visibility_factor * sun_angle_factor
  const GHI_MAX = 1000;
  const cloudFactor = 1 - (0.75 * cloudCover / 100);
  const visibilityFactor = Math.min(visibility / 10000, 1);
  
  // Simple sun angle factor based on time of day
  const date = new Date(timestamp * 1000);
  const hour = date.getHours();
  const sunAngleFactor = Math.max(0, Math.cos(((hour - 12) / 12) * (Math.PI / 2)));

  const ghi = GHI_MAX * cloudFactor * visibilityFactor * sunAngleFactor;

  // 2. DNI Calculation
  // DNI = GHI * (1 - cloud_cover/100)^2 * 0.9
  const dni = ghi * Math.pow(1 - cloudCover / 100, 2) * 0.9;

  // 3. Efficiency Adjustment
  // temp_loss = (T - 25°C) * 0.004
  const tempLoss = Math.max(0, (temp - 25) * 0.004);
  const soilingLoss = cloudCover > 50 ? 0.02 : 0; // 2% loss if very cloudy/dusty
  const adjustedEfficiency = PANEL_EFFICIENCY_BASE * (1 - tempLoss - soilingLoss);

  // 4. Expected Power
  // Power (kW) = (GHI / 1000) * Capacity * Efficiency
  const expectedPower = (ghi / 1000) * INSTALLED_CAPACITY * adjustedEfficiency;

  return {
    ghi: Math.round(ghi),
    dni: Math.round(dni),
    expectedPower: Math.round(expectedPower),
    efficiency: parseFloat((adjustedEfficiency * 100).toFixed(2))
  };
};

export const getCurrentWeather = async (lat: number, lon: number): Promise<ForecastItem> => {
  const cacheKey = getCacheKey(lat, lon, 'current');
  const now = Date.now();

  if (weatherCache[cacheKey] && (now - weatherCache[cacheKey].timestamp < CACHE_DURATION)) {
    return weatherCache[cacheKey].data;
  }

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  );

  if (!response.ok) throw new Error('Failed to fetch current weather');
  const data = await response.json();

  const metrics = calculateSolarMetrics(data, lat, lon, data.dt);
  
  const result: ForecastItem = {
    temp: data.main.temp,
    feels_like: data.main.feels_like,
    humidity: data.main.humidity,
    clouds: data.clouds.all,
    wind_speed: data.wind.speed,
    visibility: data.visibility,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    dt: data.dt,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    ...metrics
  };

  weatherCache[cacheKey] = { data: result, timestamp: now };
  return result;
};

export const getHourlyForecast = async (lat: number, lon: number): Promise<ForecastItem[]> => {
  const cacheKey = getCacheKey(lat, lon, 'hourly');
  const now = Date.now();

  if (weatherCache[cacheKey] && (now - weatherCache[cacheKey].timestamp < CACHE_DURATION)) {
    return weatherCache[cacheKey].data;
  }

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  );

  if (!response.ok) throw new Error('Failed to fetch forecast data');
  const data = await response.json();

  const result: ForecastItem[] = data.list.map((item: any) => {
    const metrics = calculateSolarMetrics(item, lat, lon, item.dt);
    return {
      temp: item.main.temp,
      feels_like: item.main.feels_like,
      humidity: item.main.humidity,
      clouds: item.clouds.all,
      wind_speed: item.wind.speed,
      visibility: item.visibility,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      dt: item.dt,
      ...metrics
    };
  });

  weatherCache[cacheKey] = { data: result, timestamp: now };
  return result;
};
