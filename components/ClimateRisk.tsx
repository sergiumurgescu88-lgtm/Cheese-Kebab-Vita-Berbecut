import React, { useState } from 'react';
import { CloudLightning, Wind, Droplets, ThermometerSnowflake, Sun, Shield, AlertTriangle, MapPin } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

// Demo climate risk data per known parcs
const RISK_DB: Record<string, {
  lat: number; lon: number;
  grindina: number; inundatii: number; vant: number; seceta: number; inghet: number;
  note: string;
}> = {
  'Căzănești': { lat: 44.6, lon: 27.0, grindina: 6, inundatii: 4, vant: 5, seceta: 7, inghet: 3, note: 'Zonă de câmpie — risc moderat grindină, secetă ridicată vara' },
  'Mircea Vodă': { lat: 44.3, lon: 28.2, grindina: 5, inundatii: 3, vant: 7, seceta: 6, inghet: 2, note: 'Apropiere litoral — vânt marin intens, ierni blânde' },
  'Roata de Jos': { lat: 43.9, lon: 25.5, grindina: 7, inundatii: 5, vant: 4, seceta: 8, inghet: 4, note: 'Dolj — secetă extremă frecventă, grindină puternică primăvara' },
  'Șimleu Silvaniei': { lat: 47.2, lon: 22.8, grindina: 8, inundatii: 6, vant: 5, seceta: 5, inghet: 7, note: 'Transilvania — grindină și îngheț tardiv primăvara, risc ridicat' },
  'Babadag': { lat: 44.9, lon: 28.7, grindina: 4, inundatii: 2, vant: 9, seceta: 6, inghet: 2, note: 'Delta/Dobrogea — vânt extrem constant, risc de degradare mecanică' },
  'Stâlpu': { lat: 45.3, lon: 26.8, grindina: 6, inundatii: 5, vant: 5, seceta: 6, inghet: 5, note: 'Buzău — climat temperat continental, riscuri echilibrate' },
  'Iancu Jianu': { lat: 44.5, lon: 24.0, grindina: 6, inundatii: 4, vant: 4, seceta: 7, inghet: 4, note: 'Oltenia — secetă ridicată, risc moderat grindină' },
  'Arad Vest': { lat: 46.2, lon: 21.3, grindina: 7, inundatii: 3, vant: 6, seceta: 6, inghet: 6, note: 'Crișana — grindină și îngheț, vânt din vest' },
};

const RISK_LABELS: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  grindina: { label: 'Grindină', icon: CloudLightning, color: '#f59e0b', desc: 'Daune mecanice panouri — necesară asigurare CASCO' },
  inundatii: { label: 'Inundații', icon: Droplets, color: '#3b82f6', desc: 'Risc fundații și cabluri — drenaj obligatoriu' },
  vant: { label: 'Vânt Extrem', icon: Wind, color: '#06b6d4', desc: 'Degradare mecanică structuri — verificare anuală' },
  seceta: { label: 'Secetă / Soiling', icon: Sun, color: '#f87171', desc: 'Murdărire accelerată — program spălare lunară' },
  inghet: { label: 'Îngheț Tardiv', icon: ThermometerSnowflake, color: '#8b5cf6', desc: 'Daune cristale gheață — panouri cu rezistență -40°C' },
};

function scorColor(scor: number): string {
  if (scor <= 3) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (scor <= 6) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}

export default function ClimateRisk() {
  const [parc, setParc] = useState('Căzănești');
  const data = RISK_DB[parc];
  const riscMediu = Math.round((data.grindina + data.inundatii + data.vant + data.seceta + data.inghet) / 5);

  const radarData = [
    { subject: 'Grindină', A: data.grindina, fullMark: 10 },
    { subject: 'Inundații', A: data.inundatii, fullMark: 10 },
    { subject: 'Vânt', A: data.vant, fullMark: 10 },
    { subject: 'Secetă', A: data.seceta, fullMark: 10 },
    { subject: 'Îngheț', A: data.inghet, fullMark: 10 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" /> Evaluare Risc Climatic
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">DATE DEMO — Bazat pe istoric 10 ani + model Open-Meteo · Scor 1-10</p>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-500" />
          <select
            value={parc}
            onChange={e => setParc(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2 focus:border-cyan-500 focus:outline-none"
          >
            {Object.keys(RISK_DB).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Scor General */}
      <div className={`glass rounded-2xl p-6 border ${scorColor(riscMediu)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-1">Scor Risc General</div>
            <div className="text-4xl font-black">{riscMediu}<span className="text-lg font-normal opacity-50">/10</span></div>
            <div className="text-sm mt-1 opacity-80">{data.note}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-1">Coordonate</div>
            <div className="text-sm font-mono opacity-80">{data.lat}°N, {data.lon}°E</div>
            <div className="text-[10px] opacity-50 mt-1">Romania</div>
          </div>
        </div>
      </div>

      {/* Grid Cards + Radar */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {Object.entries(RISK_LABELS).map(([key, cfg]) => {
            const scor = data[key as keyof typeof data] as number;
            const Icon = cfg.icon;
            return (
              <div key={key} className={`bg-slate-900 border rounded-2xl p-4 ${scorColor(scor)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    <span className="text-sm font-bold">{cfg.label}</span>
                  </div>
                  <span className="text-lg font-black">{scor}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${scor * 10}%`, backgroundColor: cfg.color }} />
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed">{cfg.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Profil Risc</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#475569', fontSize: 9 }} />
                <Radar name={parc} dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recomandări */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Recomandări Asigurare & Protecție
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="text-sm font-bold text-white mb-1">Asigurare CASCO Parc FV</div>
            <div className="text-xs text-slate-400">Acoperire grindină, vânt, incendiu. Valoare asigurată: €{Math.round(data.grindina * 1.2)}k/MWp estimat.</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="text-sm font-bold text-white mb-1">Program Mentenanță Preventivă</div>
            <div className="text-xs text-slate-400">Spălare panouri la {data.seceta > 6 ? '2 săptămâni' : '1 lună'} în perioada aprilie-septembrie.</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="text-sm font-bold text-white mb-1">Structuri Anti-Vânt</div>
            <div className="text-xs text-slate-400">{data.vant > 7 ? 'Obligatoriu: tracker cu blocare automată la >20 m/s' : 'Recomandat: verificare anuală a prinderilor'}</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="text-sm font-bold text-white mb-1">Monitorizare Iarnă</div>
            <div className="text-xs text-slate-400">{data.inghet > 6 ? 'Sistem dezgheț electric pe cabluri DC/AC' : 'Verificare izolație și conectori înainte de iarnă'}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-600 text-[10px]">
        <Shield className="w-3 h-3" />
        <span>Date: Open-Meteo Historical + PVGIS-SARAH3 · Model v1.0 · HELIOS Climate Risk Module</span>
      </div>
    </div>
  );
}
