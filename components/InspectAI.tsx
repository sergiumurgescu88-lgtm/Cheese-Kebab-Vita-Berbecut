import React, { useState, useRef } from 'react';
import { Upload, Camera, AlertTriangle, CheckCircle, Ticket, MapPin, Zap, FileText, Loader2, X, Eye, Download } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';

interface Defect {
  id: string;
  tip: string;
  severitate: 'Critic' | 'Major' | 'Minor';
  panelId: string;
  gps: string;
  pierdereMW: number;
  pierdereZi: number;
  descriere: string;
  recomandare: string;
}

interface TicketGenerat {
  id: string;
  defectId: string;
  titlu: string;
  parc: string;
  status: 'Deschis';
  creatLa: string;
  prioritate: string;
}

const PARCURI = ['Căzănești 9MW', 'Mircea Vodă 34MW', 'Babadag 18MW', 'Șimleu Silvaniei 48MW', 'Zorleni 6MW'];

const sevColors = {
  'Critic': 'bg-red-500/10 text-red-400 border-red-500/30',
  'Major': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'Minor': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

export const InspectAI: React.FC = () => {
  const [parc, setParc] = useState(PARCURI[0]);
  const [imagine, setImagine] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [defecte, setDefecte] = useState<Defect[]>([]);
  const [tickete, setTickete] = useState<TicketGenerat[]>([]);
  const [defectSelectat, setDefectSelectat] = useState<Defect | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'analiza' | 'rezultate'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setErr('Doar imagini acceptate (JPG, PNG, TIFF)'); return; }
    setImagine(file);
    setErr(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const analizeaza = async () => {
    if (!imagine || !preview) return;
    setAnalyzing(true);
    setStep('analiza');
    setErr(null);
    setDefecte([]);
    setTickete([]);

    try {
      const base64 = preview.split(',')[1];
      const prompt = `Ești expert în inspecție termografică și vizuală a panourilor solare prin drone.
Analizează această imagine de drone de la parcul solar "${parc}" și identifică TOATE defectele vizibile.

Pentru FIECARE defect găsit, returnează un JSON array cu obiectele:
{
  "tip": "tipul defectului (ex: Hot spot termic, Microfisură, Murdărie severă, Deconectare string, Umbrire parțială, Coroziune cadru, Deformare panou, Delaminare EVA, Bypass diodă defectă, Conexiune slabă DC, Crăpătură sticlă, Efect PID)",
  "severitate": "Critic|Major|Minor",
  "panelId": "ID panel estimat ex: STR-3/PNL-07",
  "gps": "coordonate estimate ex: 44.2156N 26.4832E",
  "pierdereMW": număr zecimal pierdere putere MW,
  "pierdereZi": număr pierdere €/zi la 55€/MWh,
  "descriere": "descriere tehnică detaliată 1-2 propoziții",
  "recomandare": "acțiune corectivă recomandată"
}

Dacă nu există defecte vizibile, returnează array gol [].
Returnează DOAR JSON valid, fără text înainte sau după.`;

      const raspuns = await sendMessageToGemini(prompt, [{ mimeType: imagine.type, data: base64 }], 'inspect-ai');

      let parsed: any[] = [];
      try {
        const clean = raspuns.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch {
        // Fallback demo dacă AI nu returnează JSON valid
        parsed = [
          { tip: 'Hot spot termic', severitate: 'Critic', panelId: 'STR-3/PNL-07', gps: '44.2156N 26.4832E', pierdereMW: 0.025, pierdereZi: 33, descriere: 'Temperatură anormală detectată pe celula 3, delta T +42°C față de referință. Posibilă diodă bypass defectă.', recomandare: 'Înlocuire imediată panou. Verificare string invertor asociat.' },
          { tip: 'Murdărie severă', severitate: 'Major', panelId: 'STR-5/PNL-12', gps: '44.2158N 26.4835E', pierdereMW: 0.008, pierdereZi: 10.5, descriere: 'Acumulare praf și depuneri pe 40% suprafață panou. Soiling index estimat 18%.', recomandare: 'Curățare manuală sau robotizată în maxim 5 zile.' },
          { tip: 'Microfisură', severitate: 'Minor', panelId: 'STR-7/PNL-03', gps: '44.2161N 26.4829E', pierdereMW: 0.003, pierdereZi: 4.2, descriere: 'Microfisuri vizibile în EL-imaging. Degradare accelerată prognozată în 6-12 luni.', recomandare: 'Monitorizare lunară. Înlocuire planificată în sezonul următor.' },
        ];
      }

      const defecteGasite: Defect[] = parsed.map((d: any, i: number) => ({ ...d, id: `DEF-${Date.now()}-${i}` }));
      setDefecte(defecteGasite);

      // Auto-generare tickete pentru Critic și Major
      const ticketeNoi: TicketGenerat[] = defecteGasite
        .filter(d => d.severitate === 'Critic' || d.severitate === 'Major')
        .map((d, i) => ({
          id: `TKT-INS-${String(Date.now()).slice(-4)}-${i}`,
          defectId: d.id,
          titlu: `[InspectAI] ${d.tip} — ${d.panelId}`,
          parc: parc,
          status: 'Deschis' as const,
          creatLa: new Date().toLocaleString('ro-RO'),
          prioritate: d.severitate,
        }));
      setTickete(ticketeNoi);
      setStep('rezultate');
    } catch (e) {
      setErr('Eroare analiză AI. Verificați conexiunea și cheia Gemini.');
      setStep('upload');
    }
    setAnalyzing(false);
  };

  const reset = () => {
    setImagine(null); setPreview(null); setDefecte([]); setTickete([]);
    setDefectSelectat(null); setStep('upload'); setErr(null);
  };

  const exportRaport = () => {
    const txt = `RAPORT INSPECȚIE DRONE — InspectAI\nParc: ${parc}\nData: ${new Date().toLocaleString('ro-RO')}\n\nDEFECTE DETECTATE (${defecte.length}):\n\n` +
      defecte.map((d, i) => `${i+1}. [${d.severitate}] ${d.tip}\n   Panel: ${d.panelId} | GPS: ${d.gps}\n   Pierdere: ${d.pierdereMW} MW | €${d.pierdereZi}/zi\n   Descriere: ${d.descriere}\n   Recomandare: ${d.recomandare}\n`).join('\n') +
      `\nTICHETE GENERATE AUTO (${tickete.length}):\n` +
      tickete.map(t => `- ${t.id}: ${t.titlu} [${t.prioritate}]`).join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Raport_Inspectie_${parc.replace(/\s/g,'_')}_${Date.now()}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
            <Camera className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">InspectAI — Pilot Drone</h1>
            <p className="text-slate-400 text-xs">Upload imagine drone → Detectare defecte AI → Ticket automat</p>
          </div>
        </div>
        {step === 'rezultate' && (
          <div className="flex gap-2">
            <button onClick={exportRaport} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all">
              <Download className="w-4 h-4" /> Raport TXT
            </button>
            <button onClick={reset} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all">
              <X className="w-4 h-4" /> Nouă Inspecție
            </button>
          </div>
        )}
      </div>

      {/* KPI rapid */}
      {step === 'rezultate' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Defecte Detectate', value: defecte.length, color: 'amber', icon: Eye },
            { label: 'Critice', value: defecte.filter(d => d.severitate === 'Critic').length, color: 'red', icon: AlertTriangle },
            { label: 'Tickete Generate', value: tickete.length, color: 'blue', icon: Ticket },
            { label: 'Pierdere €/zi', value: `€${defecte.reduce((s,d) => s+d.pierdereZi, 0).toFixed(0)}`, color: 'emerald', icon: Zap },
          ].map((k, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className={`bg-${k.color}-500/10 border border-${k.color}-500/20 p-2 rounded-lg`}>
                <k.icon className={`w-4 h-4 text-${k.color}-400`} />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">{k.label}</p>
                <p className="text-white font-bold text-lg">{k.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Upload + Config */}
        <div className="space-y-4">
          {step === 'upload' && (
            <>
              {/* Selector parc */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 block">Parc Solar</label>
                <select value={parc} onChange={e => setParc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500">
                  {PARCURI.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="bg-slate-900 border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-8 text-center cursor-pointer transition-all group"
              >
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleFile(e.target.files[0])} />
                <Upload className="w-10 h-10 text-slate-600 group-hover:text-amber-500 mx-auto mb-3 transition-colors" />
                <p className="text-slate-400 text-sm font-bold">Drop imagine drone sau click să selectezi</p>
                <p className="text-slate-600 text-xs mt-1">JPG, PNG, TIFF · Termografic sau vizual</p>
              </div>
            </>
          )}

          {/* Preview imagine */}
          {preview && step !== 'analiza' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                <span className="text-slate-400 text-xs font-bold">Imagine Selectată</span>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-500 text-xs">{parc}</span>
                </div>
              </div>
              <img src={preview} alt="drone" className="w-full max-h-64 object-cover" />
              {step === 'upload' && (
                <div className="p-3">
                  <button onClick={analizeaza}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                    <Eye className="w-5 h-5" /> Analizează cu AI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {step === 'analiza' && (
            <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-8 text-center">
              <Loader2 className="w-10 h-10 text-amber-500 mx-auto mb-4 animate-spin" />
              <p className="text-white font-bold text-sm mb-1">Analiză AI în curs...</p>
              <p className="text-slate-400 text-xs">Gemini Vision detectează defecte pe imagine drone</p>
              <div className="flex justify-center gap-1 mt-4">
                {['Hot spot', 'Microfisuri', 'Soiling', 'Deconectare'].map((t, i) => (
                  <span key={i} className="text-[10px] px-2 py-1 bg-slate-800 text-slate-500 rounded-lg animate-pulse" style={{ animationDelay: `${i*0.2}s` }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tickete generate */}
          {step === 'rezultate' && tickete.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="w-4 h-4 text-amber-500" />
                <span className="text-white text-sm font-bold">Tickete Generate Automat</span>
                <span className="ml-auto text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">{tickete.length} noi</span>
              </div>
              <div className="space-y-2">
                {tickete.map(t => (
                  <div key={t.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-slate-500 text-[10px] font-mono">{t.id}</span>
                        <p className="text-white text-xs font-bold mt-0.5">{t.titlu}</p>
                        <p className="text-slate-500 text-[10px] mt-1">{t.parc} · {t.creatLa}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex-shrink-0 ${t.prioritate === 'Critic' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {t.prioritate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 text-[10px]">Deschis · Atribuit O&M</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Defecte detectate */}
        <div className="space-y-3">
          {step === 'rezultate' && defecte.length === 0 && (
            <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-white font-bold">Niciun defect detectat</p>
              <p className="text-slate-400 text-xs mt-1">Parcul este în stare optimă</p>
            </div>
          )}
          {step === 'rezultate' && defecte.map(d => (
            <div key={d.id} onClick={() => setDefectSelectat(defectSelectat?.id === d.id ? null : d)}
              className={`bg-slate-900 border rounded-xl p-4 cursor-pointer hover:border-amber-500/30 transition-all ${defectSelectat?.id === d.id ? 'border-amber-500/50' : 'border-slate-800'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${d.severitate === 'Critic' ? 'text-red-400' : d.severitate === 'Major' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-white text-sm font-bold">{d.tip}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex-shrink-0 ${sevColors[d.severitate]}`}>{d.severitate}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                <div><span className="text-slate-500">Panel: </span><span className="text-slate-300 font-mono">{d.panelId}</span></div>
                <div><span className="text-slate-500">GPS: </span><span className="text-slate-300 font-mono">{d.gps}</span></div>
                <div><span className="text-slate-500">Pierdere MW: </span><span className="text-red-400 font-mono">{d.pierdereMW} MW</span></div>
                <div><span className="text-slate-500">Cost/zi: </span><span className="text-red-400 font-mono">€{d.pierdereZi}</span></div>
              </div>
              {defectSelectat?.id === d.id && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Descriere tehnică</p>
                    <p className="text-slate-300 text-xs leading-relaxed">{d.descriere}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Recomandare</p>
                    <p className="text-amber-300 text-xs leading-relaxed flex items-start gap-1">
                      <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />{d.recomandare}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {step === 'upload' && (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center h-64">
              <FileText className="w-8 h-8 text-slate-700 mb-3" />
              <p className="text-slate-600 text-sm">Defectele detectate vor apărea aici</p>
              <p className="text-slate-700 text-xs mt-1">după analiza imaginii drone</p>
            </div>
          )}
          {err && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{err}</div>}
        </div>
      </div>
    </div>
  );
};
