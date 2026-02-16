
import React, { useState, useEffect } from 'react';
import { fetchOneCall } from '../../services/realWeatherService';
import { Flame, Thermometer, Map as MapIcon, AlertTriangle, Scan } from 'lucide-react';

export const MOD03_ThermalAnomaly: React.FC = () => {
  const [ambientTemp, setAmbientTemp] = useState(22);
  const [scanned, setScanned] = useState(false);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    fetchOneCall(44.4, 26.1).then(d => setAmbientTemp(d.current.temp));
  }, []);

  const runScan = () => {
    setScanned(true);
    setAnomalies([]);
    setTimeout(() => {
       setAnomalies([
         { id: 1, temp: ambientTemp + 18, type: 'Hotspot', severity: 'CRITICAL', zone: 'Inverter B-4' },
         { id: 2, temp: ambientTemp + 12, type: 'String Mismatch', severity: 'WARNING', zone: 'Panel 1442' }
       ]);
       setScanned(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex justify-between items-center">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-500">
             <Thermometer className="w-6 h-6" />
           </div>
           <div>
             <h3 className="text-xl font-bold text-white">IR Thermal Core</h3>
             <p className="text-xs text-slate-500">Ambient Baseline: {ambientTemp.toFixed(1)}°C</p>
           </div>
        </div>
        <button onClick={runScan} disabled={scanned} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition-all disabled:opacity-50">
          <Scan className={`w-4 h-4 ${scanned ? 'animate-spin' : ''}`} /> {scanned ? 'Scanning...' : 'Start Drone IR Scan'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
        <div className="bg-slate-950 rounded-3xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://api.planet.com/basemaps/v1/planet-tiles/global_monthly_2024_01_mosaic/gmap/12/2314/1456.png')] bg-cover opacity-20 grayscale group-hover:grayscale-0 transition-all duration-700"></div>
          {anomalies.map(a => (
            <div key={a.id} className={`absolute w-8 h-8 rounded-full border-2 ${a.severity === 'CRITICAL' ? 'border-red-500 bg-red-500/30' : 'border-amber-500 bg-amber-500/30'} animate-pulse`} style={{ top: a.id === 1 ? '30%' : '60%', left: a.id === 1 ? '40%' : '55%' }}>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[10px] text-white border border-slate-700">
                {a.type}: {a.temp.toFixed(1)}°C
              </div>
            </div>
          ))}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
             <MapIcon className="w-3 h-3" /> SATU MARE CLUSTER
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl overflow-y-auto custom-scrollbar">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Detection Log</h4>
          <div className="space-y-3">
            {anomalies.length === 0 ? (
              <p className="text-slate-600 text-sm italic">System standby. Ready for radiometric ingestion.</p>
            ) : (
              anomalies.map(a => (
                <div key={a.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3">
                  {a.severity === 'CRITICAL' ? <Flame className="w-5 h-5 text-red-500" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
                  <div>
                    <p className="text-sm font-bold text-white">{a.type} Detected</p>
                    <p className="text-xs text-slate-500">{a.zone} • ΔT: +{(a.temp - ambientTemp).toFixed(1)}°C</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
