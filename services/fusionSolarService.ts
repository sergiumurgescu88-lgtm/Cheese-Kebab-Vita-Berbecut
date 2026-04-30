// fusionSolarService.ts — Multi-plant wrapper pentru /api/fusionsolar/*
const API_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export interface StationData {
  plantCode: string; plantName: string; capacity: number;
  lat: number; lon: number; currentPower: number;
  dailyEnergy: number; monthlyEnergy: number;
  status: 'NORMAL' | 'ALARM' | 'OFFLINE'; mock: boolean;
}
export interface InvertorData {
  sn: string; model: string; activePower: number;
  efficiency: number; temperature: number;
  status: 'RUNNING' | 'FAULT' | 'STANDBY'; alarms: string[];
}
export interface RealtimeData { plant: StationData; invertors: InvertorData[]; mock: boolean; ts: number; }
export interface HistoryPoint { date: string; energy: number; peakPower: number; irradiance: number; pr: number; }

export const getStations = async (): Promise<StationData[]> => {
  const r = await fetch(`${API_BASE}/api/fusionsolar/stations`);
  const j = await r.json(); return j.data || [];
};
export const getRealtimeData = async (plantCode: string): Promise<RealtimeData | null> => {
  const r = await fetch(`${API_BASE}/api/fusionsolar/realtime/${plantCode}`);
  const j = await r.json(); return j.data || null;
};
export const getHistory = async (plantCode: string, days = 7): Promise<HistoryPoint[]> => {
  const r = await fetch(`${API_BASE}/api/fusionsolar/history/${plantCode}?days=${days}`);
  const j = await r.json(); return j.data || [];
};
// Backward compat (FusionSolarDashboard vechi)
export const getPlantList = getStations;
export const getRealtimeKPI = async () => null;
export const getDeviceStatus = async () => [];
export const getActiveAlarms = async () => [];
