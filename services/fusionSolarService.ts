// FusionSolar Service - Frontend
// Communicates with the Backend Proxy running on port 3001

export interface PlantData {
  stationCode: string;
  stationName: string;
  capacity: number;
  contactPerson?: string;
  latitude: number;
  longitude: number;
}

export interface RealtimeKPI {
  inverter_power: number; // kW
  day_power: number;      // kWh
  month_power: number;    // kWh
  total_power: number;    // kWh
  day_income: number;     // Currency
  total_income: number;   // Currency
  performance_ratio: number; // %
}

export interface DeviceData {
  id: number;
  devName: string;
  devTypeId: number; // 1=Inverter, 38=Residential Inverter, 47=Battery
  esnCode: string;
  status: number; // 0=Disconnected, 1=Connected
  active_power?: number;
  efficiency?: number;
  temperature?: number;
}

export interface Alarm {
  alarmId: number;
  alarmName: string;
  status: number; // 1=Active
  raiseTime: number;
  severity: number; // 1=Critical, 2=Major, 3=Minor, 4=Warning
  devName: string;
}

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3001';
// Set MOCK_MODE to true to test with your ID immediately without backend setup
const MOCK_MODE = true; 

// --- MOCK DATA GENERATOR (Customized for NE=241643342) ---
const getMockPlantData = (): PlantData[] => [{
  stationCode: '241643342',
  stationName: 'HelioSolar Plant (NE=241643342)',
  capacity: 45000, // 45 MW
  contactPerson: 'HelioSolar021188',
  latitude: 44.4268,
  longitude: 26.1025
}];

const getMockKPI = (): RealtimeKPI => ({
  inverter_power: 32450 + Math.random() * 800, // Dynamic power simulation
  day_power: 185000,
  month_power: 4500000,
  total_power: 189000000,
  day_income: 24500, // EUR
  total_income: 22500000,
  performance_ratio: 86.2
});

const getMockDevices = (): DeviceData[] => [
  { id: 101, devName: 'Inv-01 (SUN2000-100KTL)', devTypeId: 1, esnCode: 'SN-2416-001', status: 1, active_power: 98.5, efficiency: 98.8, temperature: 45 },
  { id: 102, devName: 'Inv-02 (SUN2000-100KTL)', devTypeId: 1, esnCode: 'SN-2416-002', status: 1, active_power: 99.2, efficiency: 98.7, temperature: 46 },
  { id: 103, devName: 'Inv-03 (SUN2000-100KTL)', devTypeId: 1, esnCode: 'SN-2416-003', status: 1, active_power: 97.8, efficiency: 98.5, temperature: 44 },
  { id: 104, devName: 'BESS-01 (Luna2000)', devTypeId: 47, esnCode: 'BAT-2416-001', status: 1, active_power: -120, efficiency: 96, temperature: 32 },
];

const getMockAlarms = (): Alarm[] => [
  { alarmId: 1, alarmName: 'Grid Frequency Abnormal', status: 1, raiseTime: Date.now() - 1800000, severity: 2, devName: 'Inv-02' },
];

// --- API CLIENT ---

async function callProxy(endpoint: string, body: any = {}) {
  if (MOCK_MODE) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));
    
    console.log(`[FusionSolar Mock] Request to ${endpoint} for Station: 241643342`);

    if (endpoint === '/thirdData/getStationList') return { success: true, data: getMockPlantData() };
    if (endpoint === '/thirdData/getStationRealKpi') return { success: true, data: [{ dataItemMap: getMockKPI() }] };
    if (endpoint === '/thirdData/getDevList') return { success: true, data: getMockDevices() };
    if (endpoint === '/thirdData/getDevRealKpi') return { success: true, data: getMockDevices().map(d => ({ id: d.id, dataItemMap: d })) };
    if (endpoint === '/thirdData/getAlarmList') return { success: true, data: getMockAlarms() };
    return { success: false, failCode: 404 };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, body })
    });
    return await response.json();
  } catch (error) {
    console.error('FusionSolar Service Error:', error);
    throw error;
  }
}

// --- EXPORTED FUNCTIONS ---

export const getPlantList = async (): Promise<PlantData[]> => {
  const res = await callProxy('/thirdData/getStationList');
  return res.success ? res.data : [];
};

export const getRealtimeKPI = async (stationCodes: string[]): Promise<RealtimeKPI | null> => {
  const res = await callProxy('/thirdData/getStationRealKpi', { stationCodes: stationCodes.join(',') });
  return res.success && res.data && res.data.length > 0 ? res.data[0].dataItemMap : null;
};

export const getDeviceStatus = async (stationCode: string): Promise<DeviceData[]> => {
  const listRes = await callProxy('/thirdData/getDevList', { stationCode });
  if (!listRes.success) return [];
  
  const devices = listRes.data as DeviceData[];
  const inverterIds = devices.filter(d => d.devTypeId === 1 || d.devTypeId === 38).map(d => d.id);

  if (inverterIds.length > 0) {
    const kpiRes = await callProxy('/thirdData/getDevRealKpi', { devIds: inverterIds.join(','), devTypeId: 1 });
    if (kpiRes.success) {
      return devices.map(dev => {
        const kpi = kpiRes.data.find((k: any) => k.id === dev.id);
        return kpi ? { ...dev, ...kpi.dataItemMap } : dev;
      });
    }
  }
  return devices;
};

export const getActiveAlarms = async (stationCode: string): Promise<Alarm[]> => {
  const res = await callProxy('/thirdData/getAlarmList', { stationCode, status: 1 });
  return res.success ? res.data : [];
};