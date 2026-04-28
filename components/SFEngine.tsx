import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FileText, Upload, ChevronRight, ChevronLeft, Zap,
  Copy, Edit3, Loader2, CheckCircle, Sun,
  Battery, MapPin, Euro, Building2, Cpu, Printer,
  TrendingUp, AlertCircle, RotateCcw
} from 'lucide-react';
import { sendMessageToGemini, callNvidiaAI } from '../services/geminiService';

// ─── CONSTANTE ────────────────────────────────────────────────
const JUDETE = [
  'Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani',
  'Brașov','Brăila','Buzău','Caraș-Severin','Călărași','Cluj','Constanța',
  'Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita',
  'Hunedoara','Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș',
  'Neamț','Olt','Prahova','Satu Mare','Sălaj','Sibiu','Suceava',
  'Teleorman','Timiș','Tulcea','Vaslui','Vâlcea','Vrancea','București',
];

const PTJ_JUDETE = ['Gorj', 'Hunedoara', 'Dolj', 'Galați', 'Prahova', 'Mureș'];
const PTJ_GRANTS: Record<string, number> = {
  'Gorj': 24, 'Hunedoara': 20, 'Dolj': 18, 'Galați': 15, 'Prahova': 8, 'Mureș': 12,
};

// ─── CALCULATOARE FINANCIARE ──────────────────────────────────
const calcProductieAnuala = (putere: number, tarifMwh: number) =>
  putere * 1300 * tarifMwh; // kWh/kWp * MWp * €/MWh ≈ €/an

const calcNPV = (putere: number, tarifMwh: number, durata: number, investitie: number, iradiantaPVGIS: number = 1446, trackerBonus: number = 1.0): number => {
  const productieNetaP50 = putere * iradiantaPVGIS * 0.890 * trackerBonus;
  const opex = putere * 12000; // €12k/MW/an consistent cu tabelDCF
  const cfAn = productieNetaP50 * tarifMwh - opex;
  let npv = -investitie; // VANF/C pe investitie totala
  for (let x = 1; x <= durata; x++) npv += cfAn / Math.pow(1.08, x);
  return Math.round(npv);
};

const calcIRR = (putere: number, tarifMwh: number, investitie: number, iradiantaPVGIS: number = 1446, trackerBonus: number = 1.0): number => {
  if (!investitie) return 0;
  const productieNetaP50 = putere * iradiantaPVGIS * 0.890 * trackerBonus;
  const cfAn = productieNetaP50 * tarifMwh - putere * 12000;
  let lo = 0, hi = 1;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    let npv = -investitie;
    for (let x = 1; x <= 25; x++) npv += cfAn / Math.pow(1 + mid, x);
    if (npv > 0) lo = mid; else hi = mid;
  }
  return Math.round((lo + hi) * 500) / 10;
};

const calcPayback = (putere: number, tarifMwh: number, investitie: number, iradiantaPVGIS: number = 1446, trackerBonus: number = 1.0): number => {
  const productieNetaP50 = putere * iradiantaPVGIS * 0.890 * trackerBonus;
  const cf = productieNetaP50 * tarifMwh - putere * 12000;
  if (!cf) return 0;
  return Math.round((investitie / cf) * 10) / 10;
};

// ─── TIPURI ───────────────────────────────────────────────────
interface SFFormData {
  denumire: string;
  beneficiar: string;
  judet: string;
  localitate: string;
  gps: string;
  suprafata: string;
  putere: string;
  tipPanou: string;
  tipInvertor: string;
  bess: string;
  tracker: string;
  fpv: string;
  tipFinantare: string;
  valoareInvestitie: string;
  grantSolicitat: string;
  durataConcesiune: string;
  tarifPPA: string;
  modelAI: string;
  limba: string;
}

interface Attachment {
  mimeType: string;
  data: string;
  name: string;
}

// ─── SUB-COMPONENTE ───────────────────────────────────────────
const StepIndicator: React.FC<{ current: number }> = ({ current }) => {
  const steps = ['Date Generale', 'Parametri Tehnici', 'Finanțare', 'Generare AI'];
  return (
    <div className="flex items-center gap-1 sm:gap-2 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
              ${i < current
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : i === current
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
          >
            {i < current
              ? <CheckCircle className="w-3 h-3 shrink-0" />
              : <span className="w-3 text-center">{i + 1}</span>
            }
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < 3 && (
            <div className={`flex-1 h-px transition-colors ${i < current ? 'bg-emerald-500/40' : 'bg-slate-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
}
const Field: React.FC<FieldProps> = ({ label, value, onChange, onBlur, placeholder, type = 'text', icon }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white
          placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:bg-slate-800
          transition-all py-2.5 ${icon ? 'pl-9 pr-3' : 'px-3'}`}
      />
    </div>
  </div>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}
const SelectField: React.FC<SelectFieldProps> = ({ label, value, onChange, options, icon }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10">
          {icon}
        </div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white
          focus:outline-none focus:border-amber-500/60 transition-all py-2.5 appearance-none cursor-pointer
          ${icon ? 'pl-9 pr-3' : 'px-3'}`}
      >
        <option value="">— Selectează —</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  </div>
);

// ─── COMPONENT PRINCIPAL ──────────────────────────────────────
export const SFEngine: React.FC = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<SFFormData>({
    denumire: '',
    beneficiar: '',
    judet: '',
    localitate: '',
    gps: '',
    suprafata: '',
    putere: '',
    tipPanou: 'TOPCon Bifacial',
    tipInvertor: 'String',
    bess: 'Nu',
    tracker: 'Fix',
    fpv: 'Nu',
    tipFinantare: 'PTJ',
    valoareInvestitie: '',
    grantSolicitat: '',
    durataConcesiune: '25',
    tarifPPA: '65',
    modelAI: 'gemini',
    limba: 'romana',
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sfOutput, setSfOutput] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [capProgress, setCapProgress] = useState<{current: number, total: number, label: string} | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof SFFormData) => (val: string) =>
    setFormData(prev => ({ ...prev, [key]: val }));
  // ─── SOLAR & GEO DATA ────────────────────────────────────
  const [solarData, setSolarData] = useState<{productie: number, irradiance: number, elevation?: number} | null>(null);
  const [climateData, setClimateData] = useState<{tempMaxAbsolut:number,tempMinAbsolut:number,tempMedieAnuala:number,windMaxAbsolut:number,windMediu:number,precipitatiiAnuale:number,zilePloaieAn:number,zileZapadaAn:number,perioadaDate:string} | null>(null);
  const [geoAddress, setGeoAddress] = useState<string>('');
  const [loadingSolar, setLoadingSolar] = useState(false);
  const [satelliteUrl, setSatelliteUrl] = useState<string>('');
  const [aqiData, setAqiData] = useState<{aqi: number, category: string, pollutant: string} | null>(null);
  const [placesData, setPlacesData] = useState<{localities: {name: string, distance: number}[], institutions: {name: string, vicinity: string, distance: number}[]} | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const leafletMarker = useRef<L.Marker | null>(null);

  // ─── LEAFLET MAP INIT ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const map = L.map(mapRef.current, { zoomControl: true }).setView([45.9, 24.9], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41]
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const gpsVal = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      if (leafletMarker.current) {
        leafletMarker.current.setLatLng([lat, lng]);
      } else {
        leafletMarker.current = L.marker([lat, lng], { icon }).addTo(map);
      }
      setFormData(prev => ({ ...prev, gps: gpsVal }));
      setTimeout(() => {
        const el = document.querySelector('input[placeholder="ex: 44.1234, 25.4567"]') as HTMLInputElement;
        if (el) { el.value = gpsVal; }
      }, 50);
    });
    leafletMap.current = map;
    const ro = new ResizeObserver(() => {
      map.invalidateSize({animate: false, pan: false});
    });
    ro.observe(mapRef.current);
    return () => { ro.disconnect(); map.remove(); leafletMap.current = null; };
  }, []);

  // Sync marker când GPS e introdus manual
  useEffect(() => {
    if (!leafletMap.current) return;
    const parts = formData.gps.split(',').map(s => s.trim());
    if (parts.length !== 2) return;
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lon)) return;
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41]
    });
    if (leafletMarker.current) {
      leafletMarker.current.setLatLng([lat, lon]);
    } else {
      leafletMarker.current = L.marker([lat, lon], { icon }).addTo(leafletMap.current);
    }
    leafletMap.current.setView([lat, lon], 14);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (leafletMap.current) leafletMap.current.invalidateSize({animate: false, pan: false});
      });
    });
  }, [formData.gps]);

  const fetchSolarData = async (gpsVal: string) => {
    const parts = gpsVal.split(',').map(s => s.trim());
    if (parts.length !== 2) return;
    const [lat, lon] = parts;
    if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) return;
    setLoadingSolar(true);
    try {
      const putereVal = parseFloat(formData.putere) || 1;
      const [pvRes, geoRes, elevRes] = await Promise.all([
        fetch(`/api/pvgis?lat=${lat}&lon=${lon}&peakpower=${putereVal * 1000}`),
        fetch(`/api/geocode?lat=${lat}&lon=${lon}`),
        fetch(`/api/elevation?lat=${lat}&lon=${lon}`)
      ]);
      const pvData = await pvRes.json();
      const geoData = await geoRes.json();
      if (pvData?.outputs?.totals?.fixed?.E_y) {
        const elevData = await elevRes.json();
        const elevMeters = elevData?.results?.[0]?.elevation ? Math.round(elevData.results[0].elevation) : undefined;
        setSolarData({
          productie: Math.round(pvData.outputs.totals.fixed.E_y / 1000),
          irradiance: Math.round(pvData.outputs.totals.fixed['H(i)_y'] || 0),
          elevation: elevMeters
        });
      }
      if (geoData?.results?.[0]?.formatted_address) {
        const rawAddr = geoData.results[0].formatted_address;
        const cleanAddr = rawAddr.replace(/\.sta\s+/g, ', ').replace(/\.str,/g, ', Str. ').replace(/\s{2,}/g, ' ').trim();
        setGeoAddress(cleanAddr);
      }
      setSatelliteUrl(`/api/staticmap?lat=${lat}&lon=${lon}`);
      try {
        const aqiRes = await fetch(`/api/airquality?lat=${lat}&lon=${lon}`);
        const aqiJson = await aqiRes.json();
        const idx = aqiJson?.indexes?.[0];
        if (idx) setAqiData({ aqi: idx.aqi, category: idx.category, pollutant: idx.dominantPollutant });
      } catch(e) { console.warn('AQI fetch error', e); }
      try {
        const placesRes = await fetch(`/api/places?lat=${lat}&lon=${lon}`);
        try {
          const climateRes = await fetch(`/api/climate?lat=${lat}&lon=${lon}`);
          const climateJson = await climateRes.json();
          if (!climateJson.error) setClimateData(climateJson);
        } catch(e) { console.warn('Climate fetch fail', e); }
        const placesJson = await placesRes.json();
        if (placesJson?.localities) setPlacesData(placesJson);
      } catch(e) { console.warn('Places fetch error', e); }
    } catch(e) { console.warn('Solar/Geo fetch error', e); }
    setLoadingSolar(false);
  };

  // ─── CALCULE AUTO ─────────────────────────────────────────
  const ptjEligibil = PTJ_JUDETE.includes(formData.judet);
  const grantLimita = PTJ_GRANTS[formData.judet] || 0;
  const putere = parseFloat(formData.putere) || 0;
  const investitie = parseFloat(formData.valoareInvestitie) || 0;
  const grant = parseFloat(formData.grantSolicitat) || 0;
  const tarif = parseFloat(formData.tarifPPA) || 65;
  const durata = parseInt(formData.durataConcesiune) || 25;

  const iradiantaCalc = solarData?.irradiance ?? 1446;
  const trackerBonusGlobal = formData.tracker?.includes('Single-axis') ? 1.135 : formData.tracker?.includes('Dual-axis') ? 1.27 : 1.0;
  const capExNet = investitie - grant; // FIX: NPV/IRR/Payback pe capEx NET (dupa grant)
  const npv = putere && investitie ? calcNPV(putere, tarif, durata, capExNet, iradiantaCalc, trackerBonusGlobal) : 0;
  const irr = putere && investitie ? calcIRR(putere, tarif, capExNet, iradiantaCalc, trackerBonusGlobal) : 0;
  const payback = putere && investitie ? calcPayback(putere, tarif, capExNet, iradiantaCalc, trackerBonusGlobal) : 0;
  const grantPerMw = putere && grant ? Math.round(grant / putere / 1000) : 0; // k€/MW
  const iCRule = npv; // Regula I-C = VANF/C (NPV pe investitie totala). Daca <0 → eligibil grant
  // LCOE = (CapEx + OpEx*25ani) / Productie_totala_25ani
  const aqiValLCOE = aqiData?.aqi ?? 50;
  const soilingLCOE = aqiValLCOE > 100 ? 4.5 : aqiValLCOE > 50 ? 2.5 : 1.5;
  const totalPierderiLCOE = 3.2 + 2.0 + 1.5 + 0.8 + 1.0 + soilingLCOE + 1.0;
  const productieP50 = Math.round(putere * (parseFloat((typeof solarData !== 'undefined' && solarData?.irradiance) ? String(solarData.irradiance) : '1446')) * (1 - totalPierderiLCOE / 100) * trackerBonusGlobal);
  const opexAn1 = putere * 12000;
  const productie25ani = Array.from({length: 25}, (_, i) => Math.round(productieP50 * Math.pow(0.996, i))).reduce((a, b) => a + b, 0);
  const opex25ani = Array.from({length: 25}, (_, i) => Math.round(opexAn1 * Math.pow(1.02, i))).reduce((a, b) => a + b, 0);
  const lcoe = investitie && productie25ani ? Math.round((investitie + opex25ani) / productie25ani * 100) / 100 : 0;

  // ─── UPLOAD DOCUMENTE ─────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const data = (ev.target?.result as string).split(',')[1];
        setAttachments(prev => [...prev, { mimeType: file.type, data, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  // ─── PROMPT GENERATOR ─────────────────────────────────────

  // ─── KNOWLEDGE BASE SF (extras din 7 SF-uri reale 2022-2025) ───────────────
  const kb6_legislativ = `ACTE NORMATIVE APLICABILE (din SF-uri reale 2022-2025):
- HG nr. 907/2016 privind etapele de elaborare și conținutul-cadru al documentațiilor tehnico-economice
- Legea nr. 123/2012 a energiei electrice și a gazelor naturale, cu modificările ulterioare
- OUG-944/2021: capacități ≤1 MW nu necesită autorizație înființare, doar notificare operator distribuție
- Directiva (UE) 2018/2001 privind promovarea utilizării energiei din surse regenerabile (obiectiv 40% RES până în 2030)
- Regulamentul (UE) 2021/1119 — Legea europeană a climei: neutralitate climatică 2050, reducere 55% emisii față de 1990 până în 2030
- Directiva (UE) 2019/944 privind normele comune pentru piața internă de energie electrică
- HG nr. 1.076/2021 privind PNIESC 2021-2030 (Plan Național Integrat Energie și Schimbări Climatice)
- OUG nr. 60/2022 privind cadrul instituțional și financiar de implementare a Fondului pentru Modernizare
- Legea nr. 220/2008 pentru stabilirea sistemului de promovare a producerii energiei din surse regenerabile
- Ordinele ANRE privind racordarea la rețea și condițiile de funcționare pentru prosumatori
- Regulamentul (UE) 2019/941 privind pregătirea pentru riscuri în sectorul energiei electrice
- OUG nr. 212/2020 privind stabilirea unor măsuri la nivelul administrației publice centrale`;

  const kb7_financiar = `METODOLOGIE ANALIZĂ FINANCIARĂ (model din SF-uri reale PHY GEO 2024, UPIT 2025, WTB 2022):
Metoda: flux net de numerar actualizat (DCF), metoda incrementală exclusiv pentru proiect.
Perioadă referință: 20 ani operare + 1 an implementare = 21 ani total.
Valoare reziduală: amortizare liniară — durata de viață echipamente 25 ani, referință 20 ani → reziduală 20% din investiție.
Fluxurile non-monetare (amortizare, subvenții) nu se includ în FCF.

INDICATORI DIN SF-URI REALE (referință comparativă):
SF PHY GEO 2024 (1 MWp sol, vânzare piață, rată actualizare 5%):
  RIRF/C = 10,32% | VNAF/C = +709.130 lei | B/C = 1,24 | Cashflow an1 = 380.520 lei
SF UPIT 2025 (0,9 MWp acoperiș + stocare LFP, FM 2025, entitate publică, rată 4%):
  RIRF/C = 3,15% (sub prag → justifică grant) | VANF/C = -530.953 lei (negativ ✓) | B/C = 3,74
  Perioadă recuperare simplă: 12,4 ani | Economii cumulate 20 ani: ~15.200.000 lei
  Indicator ACE: 374,6 lei/MWh | Cost CO2 evitat: ~454 lei/tonă
SF WTB 2022 (2 MWp acoperiș, PNRR C6, rată 5%):
  Cost investiție: 3.402.397 lei fără TVA | Implementare: 24 luni

CONDIȚIE ADMITERE GRANT PUBLIC (FM/PNRR):
VANF/C NEGATIV + RIRF/C sub rata de actualizare → proiectul nu e fezabil fără grant (obligatoriu pentru finanțare nerambursabilă).
CONCLUZIE TIP: "Valorile negative ale VANF/C și RIRF/C sub pragul de actualizare demonstrează că proiectul nu este fezabil financiar fără finanțare nerambursabilă, justificând acordarea grantului. Raportul B/C supraunitar confirmă eficiența economică ridicată și valoarea publică generată."`;

  const kb8_eligibilitate = `GHID SOLICITANT FM 2025 — DATE ESENȚIALE (Ministerul Energiei):
Grant: 100% cheltuieli eligibile | Max 10 milioane euro/beneficiar
Plafon/MW (fără pompe căldură): MAX 1.300.000 euro/MW fără TVA
Plafon/MW (cu pompe căldură): MAX 1.500.000 euro/MW fără TVA
Termen finalizare: 31.12.2029 | Selecție: "primul venit, primul evaluat"
Costuri operare: NEELIGIBILE | TVA: eligibil în limita plafoanelor

BENEFICIARI ELIGIBILI FM 2025 (lista completă):
- Unități administrativ-teritoriale (UAT) și sub-diviziuni
- Unități din sistemul național de apărare, ordine publică și siguranță națională
- Unități din sistemul administrației penitenciare
- Spitale finanțate integral din fonduri publice
- Instituții publice (Legea 500/2002 art.2 pct.30) — EXCLUS regii autonome și societăți cu capital de stat
- Culte recunoscute oficial în România (Legea 489/2006)
- Instituții de învățământ superior de stat
- Institute naționale de cercetare-dezvoltare de drept public (OG 57/2002)
- Asociații de Dezvoltare Intercomunitară (OUG 57/2019 Codul administrativ)
- Centre sociale și centre de îngrijiri paliative finanțate integral din fonduri publice
- Agenția Națională pentru Sport și instituții subordonate
- Comitetul Olimpic și Sportiv Român și instituții subordonate

CONDIȚII TEHNICE OBLIGATORII FM 2025:
- Stocare OBLIGATORIE: capacitate ≥ 2 ore la puterea nominală instalată
- Tehnologie stocare INTERZISĂ: plumb, NiCd, NiMH → OBLIGATORIU LiFePO4/Li-Ion
- Factor capacitate minim: 11,4% (echivalent 1.000 h/an)
- 100% energie produsă destinată autoconsumului propriu
- Activități economice ale beneficiarului: strict auxiliare, max 20% din capacitate anuală
- Panouri monocristaline: eficiență > 19% | Policristaline: > 18%
- Invertoare: eficiență europeană > 97%

DOCUMENTE OBLIGATORII (Ghid FM 2025):
- SF în format PDF căutabil (nu scanat), toate documentele în română
- Facturi electricitate 12 luni consecutive 2023-2025 (Anexa C)
- Autorizare ANRE a proiectantului (Anexa F) — obligatoriu 2025
- Extras CF actualizat (Anexa A) | Simulări PVGIS (Anexa C)
- Deviz general conform HG 907/2016 (Anexa D) | Grafic Gantt (Anexa E)
- Depunere: platforma MySmis 2021 — https://mysmis2021.gov.ro/`;

  const kb9_om = `COSTURI O&M ANUALE (model SF ECOLAB 2025, 1 MWp la sol):
Mentenanță preventivă: curățare panouri 4x/an (24.000 lei) + termografiere dronă 4x/an (14.000 lei) + verificări electrice DC/AC 4x/an (10.000 lei) + cosire vegetație 8x/an (16.000 lei) + verificare structuri 2x/an (4.000 lei) + calibrare SCADA 2x/an (3.000 lei) = 71.000 lei/an
Mentenanță corectivă: înlocuire panouri 5buc/an (11.000 lei) + conectori MC4 (3.000 lei) + cabluri DC (7.000 lei) + service invertoare (10.000 lei) + diverse (9.800 lei) = 44.800 lei/an
Monitorizare & utilități: abonament SCADA 9.600 lei + internet SIM 4G 2.400 lei + energie auxiliară 6.000 lei = 18.000 lei/an
Costuri suplimentare: asigurare all-risk 0,6% CapEx (24.000 lei) + audit ANRE anual (8.000 lei) + securitate 24/7 (6.000 lei) + fond rezervă 0,7% CapEx (28.000 lei) + administrare O&M (6.000 lei) = 72.000 lei/an
TOTAL O&M fără personal pază ~1 MWp sol: ~205.800 lei/an (~0,63% din investiție/an)

Model SF PHY GEO 2024 (1 MWp sol, vânzare piață, simplificat):
O&M programat: 22.491 lei/an | Neplanificat: 4.998 lei/an | Echilibrare energie: 43.533 lei/an
Taxe OPCOM: 17.701 lei/an | Asigurare: 9.996 lei/an | TOTAL: 98.839 lei/an`;

  const kb10_riscuri = `TABEL ANALIZĂ RISCURI (model SF UPIT 2025):
Risc tehnic | Producție FV sub estimări P50 | Probabilitate Medie | Impact Mediu | Simulare PVGIS conservativă; monitorizare real-time; intervenție rapidă
Risc tehnic | Defecțiuni echipamente după garanție | Probabilitate Scăzut | Impact Mediu | Garanție 15 ani panouri, 5 ani invertoare, 10 ani baterii; contract O&M multianual
Risc financiar | Creștere costuri implementare față de deviz | Probabilitate Medie | Impact Mediu | Licitație deschisă; contract ferm prețuri fixe; rezervă 10% neprevăzute în deviz
Risc financiar | Scădere prețuri energie pe piața angro | Probabilitate Scăzut | Impact Scăzut | 100% autoconsum — proiectul nu depinde de vânzare energie la piață
Risc legislativ | Modificare cadru legal prosumatori | Probabilitate Scăzut | Impact Scăzut | Conformitate Legea 123/2012; statut prosumator protejat legislativ
Risc implementare | Depășire termen 31.12.2029 | Probabilitate Scăzut | Impact Ridicat | Grafic realist 11-18 luni; demarare imediată post-contractare; monitorizare săptămânală
Risc mediu | Condiții meteorologice extreme (grindină, vânt) | Probabilitate Scăzut | Impact Scăzut | Structuri SR EN 1991; asigurare all-risk; amplasament zonă risc scăzut

ANALIZĂ SENZITIVITATE (model SF UPIT 2025, entitate publică cu grant FM):
Preț energie +20%: impact pozitiv moderat asupra VANF | Preț energie -20%: proiectul rămâne nefezabil fără grant
Cost investiție +10%: VANF mai negativ, proiect rămâne nefezabil fără grant | Producție FV ±10%: sensibilitate redusă
Costuri O&M +20%: impact scăzut asupra VANF | CONCLUZIE: proiectul rămâne nefezabil în toate scenariile → confirmă necesitatea finanțării nerambursabile.

INDICATORI TEHNICO-ECONOMICI (model SF UPIT 2025, 0,9 MWp + stocare FM 2025):
Factor de capacitate: 14,83% (≥11,4% minim ghid ✓) | Grad autoconsum: 100% ✓
Autonomie stocare: ≥ 2,15 ore (≥2 ore minim FM ✓) | Tehnologie stocare: LiFePO4 (non-Pb ✓)
Grant/MW: ~1.055.222 euro/MW (≤1.300.000 euro/MW ✓) | Durată implementare: 11 luni
Factor emisii rețea SEN: 0,608 kgCO2/kWh (mix SEN 2024, sursa ANRE/Eurostat)
[Referință: 900 kWp → 1.169 MWh/an → ~711 tCO2/an evitat | 1.000 kWp → ~1.300 MWh/an → ~790 tCO2/an]`;

  const kb11_avize = `CAPITOL 6 — URBANISM ȘI AVIZE (model din SF-uri reale WTB 2022, POLI 2023, ECOLAB 2025):
Sisteme acoperiș ≤1 MW: autorizație de construire simplificată sau notificare primărie
Sisteme la sol >50 kW: Certificat de Urbanism + Autorizație de Construire obligatorii
Terenul: în proprietatea/administrarea beneficiarului, extras CF actualizat, fără litigii
Protecție mediu: NU se supune EIM (HG 445/2009) | respectă principiul DNSH (Regulament UE 2020/852)
Amplasament NU pe: teren arabil cls I-II, arie protejată Natura 2000, zonă protecție cursuri apă
Deșeuri panouri: gestionate conform DEEE (HG 1037/2010)

AVIZE NECESARE:
- Aviz Tehnic de Racordare (ATR): operator distribuție județean conform Ord. ANRE nr. 59/2013
- Contor bidirecțional smart meter: instalat de operator distribuție după PIF
- Protecții anti-ilotare: obligatorii conform normelor ANRE
- Notificare ANRE + operator distribuție: conform OUG-944/2021 (capacități ≤1 MW — notificare, NU autorizație)
- Autorizație înființare ANRE: obligatorie DOAR pentru capacități >1 MW
- Studiu geotehnic: obligatoriu pentru fundații la sol; nu este cazul pentru acoperiș
- Categoria geotehnică C1 RISC REDUS conform NP 074-2014 (referință SF PHY GEO 2024, Șomcuta Mare: ag=0.15g, Tc=0.7s)`;

  const kb12_implementare = `CAPITOL 7 — IMPLEMENTARE (model din SF-uri reale):
Etapa 1 (L1-L2): Proceduri administrative — CU, AC, aviz distribuitor, licitație EPC, contract constructor autorizat ANRE
Etapa 2 (L3-L8): Execuție — structuri susținere, montaj panouri, invertoare, tablouri DC/AC, cabluri, BESS, SCADA, racordare internă
Etapa 3 (L9-final): PIF — probe SAT, recepție HG 273/1994, aviz final ANRE, notificare operator, contor bidirecțional, documentație as-built
Disponibilitate sistem: >98% anual | Degradare panouri: 0,4-0,5%/an conform garanție
Intervenție la alarmare: <4h | Inspecție anuală: termografiere dronă + verificări electrice complete
Fond rezervă: ~0,7% CapEx/an pentru cheltuieli neplanificate

CAPITOL 8 — CONCLUZII TIP (model SF-uri reale 2022-2025):
1. FEZABILITATE TEHNICĂ: Amplasament cu condiții optime; factor capacitate realizat > 11,4% minim ghid ✓
2. FEZABILITATE FINANCIARĂ (entitate publică/FM): VANF/C negativ + RIRF/C sub rata actualizare → grant justificat; B/C >3,6 → eficiență economică ridicată; economii cumulate 20 ani = multiple din investiția inițială
3. FEZABILITATE ECONOMICĂ: Reducere CO2 ~0,608 tCO2/MWh față de mix SEN; cost/tCO2 evitată sub prețul certificatelor ETS 2024
4. SCENARIUL RECOMANDAT: Scenariul 1 (sistem fix) — investiție mai redusă, O&M inferior, producție echivalentă sau superioară față de Scenariul 2
5. FINANȚARE: Fond Modernizare Program-cheie 1 Ediția 2025 — grant 100% cheltuieli eligibile, depunere MySmis 2021`;


  const buildPrompt = (): string => `Ești HELIO, expert în elaborarea Studiilor de Fezabilitate conform HG 907/2016. Generează un SF COMPLET, DETALIAT și PROFESIONAL în limba română pentru proiectul fotovoltaic de mai jos.

REGULI FORMATARE — RESPECTĂ OBLIGATORIU:
1. Fiecare capitol principal pe linie nouă: "CAPITOLUL 1. TITLU"
2. Fiecare subcapitol pe linie nouă: "1.1 Titlul subcapitolului"
3. Listele legislative și tehnice: fiecare element pe linie nouă cu "- " la început
4. Între paragrafe: linie goală
5. Tabelele: "Coloana1 | Coloana2 | Coloana3" cu separator "---|---|---"
6. Folosește "- " pentru bullet points (nu litere, nu cifre pentru liste simple)
7. MINIM 500 cuvinte per capitol principal
8. TOTAL minim 5000 cuvinte

⚠️ VALORI FIXE — SURSĂ UNICĂ DE ADEVĂR — NU MODIFICA, NU RECALCULA, NU INTERPRETA ALTFEL:
- Producție netă P50 an 1: ${productieP50.toLocaleString()} MWh/an — ACEASTA este singura valoare validă de producție în TOT documentul
- LCOE: ${lcoe} EUR/MWh
- NPV: ${npv.toLocaleString()} EUR
- IRR: ${irr}%
- Payback: ${payback} ani
INTERDICȚIE ABSOLUTĂ: Nu folosi nicio altă valoare de producție (nu 5575, nu 5580, nu valoarea brută PVGIS). Nu expune în text niciun raționament intern, nicio corecție, nicio notă de tipul "revin la", "am greșit", "eroarea fiind că". Documentul final nu conține gândire internă vizibilă.

DATE PROIECT:
- Denumire: ${formData.denumire}
- Beneficiar: ${formData.beneficiar}
- Județ: ${formData.judet}${ptjEligibil ? ` (ELIGIBIL PTJ — Grant max €${grantLimita}M)` : ''}
- Localitate: ${formData.localitate}
- Coordonate GPS: ${formData.gps}
- Suprafață teren: ${formData.suprafata} ha
- Putere instalată: ${formData.putere} MWp
- Tip panou fotovoltaic: ${formData.tipPanou}
- Tip invertor: ${formData.tipInvertor}
- Stocare BESS: ${formData.bess}
- Sistem tracker: ${formData.tracker}
- Sistem FPV (plutitor): ${formData.fpv}
- Tip finanțare: ${formData.tipFinantare}
- Valoare totală investiție: ${parseInt(formData.valoareInvestitie || '0').toLocaleString()} EUR
- Grant solicitat: ${parseInt(formData.grantSolicitat || '0').toLocaleString()} EUR
- Durată concesiune/exploatare: ${formData.durataConcesiune} ani
- Tarif PPA estimat: ${formData.tarifPPA} EUR/MWh

DOCUMENTE TEHNICE CLIENT:
${attachments.find(a => a.name?.toLowerCase().includes('urban')) ? '✅ Certificat Urbanism — ÎNCĂRCAT' : '⚠️ Certificat Urbanism — LIPSĂ (menționează în Cap 6 că trebuie obținut)'}
${attachments.find(a => a.name?.toLowerCase().includes('geoteh')) ? '✅ Studiu Geotehnic — ÎNCĂRCAT' : '⚠️ Studiu Geotehnic — LIPSĂ (menționează în Cap 3 și 6 că trebuie comandat)'}
${attachments.find(a => a.name?.toLowerCase().includes('atr') || a.name?.toLowerCase().includes('racord')) ? '✅ ATR Racordare — ÎNCĂRCAT' : '⚠️ ATR Racordare — LIPSĂ (menționează în Cap 6 și 8 că trebuie solicitat de urgență)'}

DATE REALE AMPLASAMENT (surse API):
${solarData ? `- Producție brută PVGIS (pre-pierderi, NU folosi ca producție netă): ${solarData.productie.toLocaleString()} MWh/an — ATENȚIE: aceasta este energia brută DC estimată de PVGIS, ÎNAINTE de aplicarea pierderilor de sistem (invertor, cabluri, soiling, temperatură, umbrire). Producția netă P50 reală este calculată separat și prezentată mai jos.` : ''}
${solarData?.irradiance ? `- Iradianță solară optimă: ${solarData.irradiance} kWh/m²/an` : ''}
${solarData?.elevation !== undefined ? `- Altitudine teren: ${solarData.elevation}m deasupra nivelului mării` : ''}
${aqiData ? `- Calitate aer (AQI): ${aqiData.aqi} — ${aqiData.category}, poluant dominant: ${aqiData.pollutant.toUpperCase()}` : ''}
${climateData ? `- DATE CLIMATICE REALE (OpenMeteo, ${climateData.perioadaDate}):
  - Temperatura maximă absolută: ${climateData.tempMaxAbsolut}°C
  - Temperatura minimă absolută: ${climateData.tempMinAbsolut}°C
  - Temperatura medie anuală: ${climateData.tempMedieAnuala}°C
  - Viteza maximă vânt înregistrată: ${climateData.windMaxAbsolut} km/h
  - Viteza medie vânt: ${climateData.windMediu} km/h
  - Precipitații anuale: ${climateData.precipitatiiAnuale} mm/an
  - Zile cu ploaie/an: ${climateData.zilePloaieAn} zile
  - Zile cu zăpadă/an: ${climateData.zileZapadaAn} zile
  UTILIZEAZĂ aceste date în Cap 3.1.2 (rezistență structuri la vânt ${climateData.windMaxAbsolut} km/h), Cap 4.2 (vulnerabilități: temp max ${climateData.tempMaxAbsolut}°C afectează randament panouri, ${climateData.zileZapadaAn} zile zăpadă/an, ${climateData.zilePloaieAn} zile ploaie justifică ${Math.ceil(climateData.zilePloaieAn/20)} curățări/an).` : ''}
${placesData?.localities?.length ? `- Localități în proximitate: ${placesData.localities.map(l => `${l.name} (${l.distance} km)`).join(', ')}` : ''}
${geoAddress ? `- Adresă geocodată: ${geoAddress}` : ''}

INDICATORI FINANCIARI PRE-CALCULAȚI (includ în Capitolul 4):
- NPV (rată actualizare 8%, ${durata} ani): ${npv.toLocaleString()} EUR
- IRR estimat: ${irr}%
- Payback estimat: ${payback} ani
- Grant/MW: ~${grantPerMw} k€/MW
- Regula I - C = ${iCRule.toLocaleString()} EUR ${iCRule <= 0 ? '— CONFORM (valoare negativă sau zero, eligibil)' : '— ATENȚIE: NECONFORM (valoare pozitivă, neeligibil grant)'}
- LCOE (Cost Nivelat Energie) = ${lcoe} EUR/MWh — folosește EXCLUSIV această valoare în tot documentul, NU inventa alte valori LCOE


KNOWLEDGE BASE EXTRAS DIN 7 SF-URI REALE (2022-2025):

LEGISLAȚIE APLICABILĂ (KB6):
${kb6_legislativ}

METODOLOGIE FINANCIARĂ & INDICATORI REALI (KB7):
${kb7_financiar}

ELIGIBILITATE FM 2025 (KB8):
${kb8_eligibilitate}

COSTURI O&M REALE (KB9):
${kb9_om}

RISCURI, SENZITIVITATE & INDICATORI TEHNICO-ECONOMICI (KB10):
${kb10_riscuri}

URBANISM & AVIZE (KB11):
${kb11_avize}

IMPLEMENTARE & CONCLUZII (KB12):
${kb12_implementare}



INSTRUCȚIUNI FORMATARE OBLIGATORII:
- Fiecare capitol începe pe linie nouă cu "CAPITOLUL X. TITLU"
- Fiecare subcapitol (ex: 1.1, 2.3) începe pe linie nouă separată
- Listele folosesc "- " la început de linie (un rând per element)
- Între paragrafe lasă o linie goală
- Tabelele folosesc format: Coloana1 | Coloana2 | Coloana3
- Titlurile subcapitolelor sunt SCURTE (max 10 cuvinte), pe linie proprie
- NU combina mai multe subcapitole în același paragraf

STRUCTURA OBLIGATORIE — Respectă exact structura HG 907/2016 Anexa 4:

CAPITOLUL 1. INFORMAȚII GENERALE PRIVIND OBIECTUL DE INVESTIȚII

1.1 Denumirea obiectivului de investiții
1.2 Ordonator principal de credite / Investitor — date complete (denumire, adresă, tel, email)
1.3 Ordonator de credite ierarhic superior — dacă nu este cazul, menționează explicit
1.4 Beneficiarul investiției — date complete
1.5 Elaboratorul studiului de fezabilitate — HELIO Platform, date contact

CAPITOLUL 2. SITUAȚIA ACTUALĂ ȘI NECESITATEA REALIZĂRII OBIECTIVULUI DE INVESTIȚII

2.1 Concluziile studiului de prefezabilitate — dacă nu există, menționează explicit
2.2 Prezentarea contextului actual — cadru legislativ european și național, lista acte normative cu "- " pentru fiecare act pe rând nou: OUG, HG, Legi, Directive UE relevante pentru energia regenerabilă 2024-2026
2.3 Analiza situației existente și identificarea deficiențelor — situația terenului, infrastructura existentă
2.4 Analiza cererii de bunuri și servicii — justificarea necesității investiției, cererea de energie în zonă
2.5 Obiective preconizate a fi atinse — obiective generale și specifice SMART, indicatori de rezultat măsurabili

CAPITOLUL 3. IDENTIFICAREA ȘI PREZENTAREA SCENARIILOR/OPȚIUNILOR TEHNICO-ECONOMICE

3.1 Scenariul 1 — Soluția propusă: ${formData.tipPanou} + ${formData.tracker}${formData.bess !== 'Nu' ? ` + BESS ${formData.bess}` : ''}
3.1.1 Particularități ale amplasamentului — coordonate GPS: ${formData.gps}, altitudine: ${solarData?.elevation ?? 'N/A'}m, iradianță PVGIS: ${solarData?.irradiance ?? 'N/A'} kWh/m²/an, AQI: ${aqiData?.aqi ?? 'N/A'}
3.1.2 Descrierea tehnică — panouri ${formData.tipPanou}, invertor ${formData.tipInvertor}, structuri ${formData.tracker}${formData.bess !== 'Nu' ? `, BESS ${formData.bess}` : ''}, sistem evacuare MT, SCADA${formData.fpv !== 'Nu' ? `, sistem FPV plutitor` : ''}
3.1.3 Costurile estimative — deviz HG907 pe categorii: C1 teren 1%, C2 utilități 3%, C3 proiectare 4%, C4.1 echipamente 67%, C4.2 montaj 20%, C5 șantier 2.5%, C6 neprevăzute 2.5%. Total fără TVA: ${parseInt(formData.valoareInvestitie || '0').toLocaleString()} EUR. REPRODUCE TABELUL EXACT din secțiunea 3.1.3, NU recalcula procentele.
3.1.4 Studii de specialitate necesare — topografic, geotehnic, hidrologic, electromagnetic
3.1.5 Grafic orientativ realizare — proiectare (L1-L3), avizare (L4-L9), construcție (L10-L20), PIF (L21-L24)
3.2 Scenariul 0 — Situația de referință (fără investiție) — menținerea consumului din rețea, costuri oportunitate, impact mediu

CAPITOLUL 4. ANALIZA SCENARIILOR/OPȚIUNILOR TEHNICO-ECONOMICE PROPUSE

4.1 Cadrul de analiză — metodologie DCF, rata actualizare 8%, perioadă ${durata} ani
4.2 Analiza vulnerabilităților climatice — P50/P90 producție, fenomene extreme, degradare panouri${aqiData ? `, impactul AQI=${aqiData.aqi} (poluant: ${aqiData.pollutant.toUpperCase()}) asupra soiling effect` : ''}
4.3 Sustenabilitatea investiției — locuri de muncă create, impact comunitate, reducere CO2 (tone/an), conformitate DNSH
4.4 Analiza financiară — NPV = ${npv.toLocaleString()} EUR, IRR = ${irr}%, Payback = ${payback} ani, tarif PPA ${formData.tarifPPA} EUR/MWh. Surse: ${formData.tipFinantare}, grant ${parseInt(formData.grantSolicitat || '0').toLocaleString()} EUR${formData.tipFinantare === 'PTJ' || formData.tipFinantare === 'Fond Modernizare' ? `. Regulă I-C: ${iCRule.toLocaleString()} EUR ${iCRule <= 0 ? '— ELIGIBIL' : '— NEELIGIBIL'}` : ''}
4.5 Analiza economică — beneficii socio-economice, valoare adăugată locală
4.6 Analiza de sensitivitate — variație ±10% tarif PPA, ±15% CapEx, ±5% producție anuală
4.7 Analiza de riscuri:
4.7.1 Riscuri tehnice — disponibilitate echipamente, performanță vs. proiectată, degradare accelerată
4.7.2 Riscuri financiare — volatilitate preț energie, dobânzi, inflație OpEx
4.7.3 Riscuri de reglementare și climatice — modificări legislative, fenomene extreme

CAPITOLUL 5. SCENARIUL/OPȚIUNEA TEHNICO-ECONOMICĂ OPTIMĂ RECOMANDATĂ

5.1 Compararea scenariilor — tabel comparativ Scenariu 1 vs. Scenariu 0
5.2 Selectarea și justificarea scenariului optim — argumentare tehnică și financiară
5.3 Descrierea scenariului optim — soluție tehnică completă selectată
5.4 Principalii indicatori tehnico-economici — tabel centralizator
5.5 Conformitatea cu reglementările — HG 907/2016, directive UE, standarde tehnice
5.6 Sursele de finanțare — structura financiară: grant + cofinanțare proprie + credit

CAPITOLUL 6. URBANISM, ACORDURI ȘI AVIZE CONFORME

6.1 Certificat de urbanism — condiții obținere, documente necesare
6.2 Extras de carte funciară — situație juridică teren, suprafață ${formData.suprafata} ha
6.3 Protecția mediului — procedura EIM, acord de mediu, evaluare Natura 2000
6.4 Avize conforme necesare:
- Aviz Tehnic de Racordare (ATR) — operator distribuție / Transelectrica
- Aviz ANRE
- Aviz ISC
- Avize deținători utilități (apă, gaz, telecomunicații, drumuri)
- Aviz AACR dacă aplicabil
- Aviz MApN dacă aplicabil
6.5 Studiu topografic vizat OCPI — scară, coordonate Stereo 70
6.6 Studii specifice — geotehnic, hidrologic, electromagnetic

CAPITOLUL 7. IMPLEMENTAREA INVESTIȚIEI

7.1 Entitatea responsabilă — ${formData.beneficiar}, structura organizatorică
7.2 Strategia de implementare — management proiect, jaloane cheie, grafic Gantt
7.3 Strategia de exploatare și întreținere — plan O&M pe ${durata} ani, mentenanță preventivă și corectivă
7.4 Recomandări privind capacitatea managerială — echipă dedicată, diriginte de șantier

CAPITOLUL 8. CONCLUZII ȘI RECOMANDĂRI

8.1 Sinteza viabilității tehnice — producție garantabilă: ${solarData ? `${solarData.productie.toLocaleString()} MWh/an` : 'conform PVGIS'}
8.2 Sinteza viabilității financiare — NPV = ${npv.toLocaleString()} EUR, IRR = ${irr}%, Payback = ${payback} ani
8.3 Recomandare generală — VIABIL / CONDIȚIONAT VIABIL / NEVIABIL cu justificare completă
8.4 Pași următori — studii teren, ATR, PPA, depunere cerere finanțare
8.5 Calendar propus — faze și termene pe luni


INSTRUCȚIUNI STIL:
- Limbaj tehnic-juridic profesional conform documentelor de finanțare europeană
- Ton obiectiv, bazat pe date reale furnizate
- Fiecare subcapitol minim 150 cuvinte, fiecare capitol minim 500 cuvinte
- Total document minim 5000 cuvinte
- Listele legislative OBLIGATORIU cu "- " la fiecare act normativ pe rând separat
- Tabelele cu separatori "|" între coloane`;

  // ─── GENERARE SF PE CAPITOLE ──────────────────────────────
  const callAI = async (prompt: string, capNr: number): Promise<string> => {
    let result: string | null = null;

    // PRIMARY: Gemini 2.5 Flash via /api/ai/openrouter (2 chei rotativ in server)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log('Gemini primary pentru cap ' + capNr + ' (attempt ' + (attempt+1) + ')');
        const gemRes = await fetch('/api/ai/openrouter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
        });
        const gemData = await gemRes.json();
        if (gemData?.error === true && (gemData?.message?.includes('503') || gemData?.message?.includes('high demand') || gemData?.message?.includes('epuizate'))) {
          console.warn('Gemini 503 - retry in 60s...');
          await new Promise(r => setTimeout(r, 60000));
          continue;
        }
        result = gemData?.text || null;
        if (result && result.length > 200) {
          console.log('Gemini OK, lungime: ' + result.length);
          return result.replace(/undefined/g, '').replace(/\s{3,}/g, '\n').trim();
        }
        break;
      } catch(e) { console.warn('Gemini primary fail', e); }
    }

    // FALLBACK: NVIDIA rotativ pe 4 modele
    const modelMap: Record<number, 'ds4a'|'ds4b'|'qw2a'|'qw2b'> = {
      1: 'ds4a', 2: 'ds4a',
      3: 'qw2a', 4: 'qw2a',
      5: 'ds4b', 6: 'ds4b',
      7: 'qw2b', 8: 'qw2b',
    };
    const primary = modelMap[capNr] || 'ds4a';
    const fallbacks: ('ds4a'|'ds4b'|'qw2a'|'qw2b')[] = ['qw2a','qw2b','ds4b','ds4a'];
    console.log('NVIDIA fallback ' + primary + ' pentru cap ' + capNr);
    try { result = await callNvidiaAI(primary as any, prompt, 'sf_expert'); } catch(e) { console.warn(primary + ' fail', e); }
    if (!result || result.length < 200) {
      for (const fb of fallbacks) {
        try { result = await callNvidiaAI(fb as any, prompt, 'sf_expert'); if (result && result.length > 200) break; } catch(e) { console.warn(fb + ' fail', e); }
      }
    }

    return (result || '').replace(/undefined/g, '').replace(/\s{3,}/g, '\n').trim();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    console.log('=== HELIO DEBUG ===');
    console.log('tracker:', formData.tracker);
    console.log('trackerBonusGlobal:', trackerBonusGlobal);
    console.log('productieP50:', productieP50);
    console.log('npv:', npv, 'irr:', irr, 'payback:', payback);
    console.log('===================');
    setSfOutput('');
    setIsDone(false);
    setEditMode(false);
    setCapProgress(null);
    setStep(4);

    const baseContext = buildPrompt().split('STRUCTURA OBLIGATORIE')[0];
    const putere = parseFloat(formData.putere || '0');
    const durata = formData.durata || '25';
    const grantPerMw = putere > 0 ? Math.round(parseInt(formData.grantSolicitat||'0')/putere/1000) : 0;
    const iradiantaReala = solarData?.irradiance ?? 1446;
    const aqiValDCF = aqiData?.aqi ?? 50;
    const soilingDCF = aqiValDCF > 100 ? 4.5 : aqiValDCF > 50 ? 2.5 : 1.5;
    const totalPierderiDCF = 3.2 + 2.0 + 1.5 + 0.8 + 1.0 + soilingDCF + 1.0;
    const productieNetaP50 = Math.round(putere * iradiantaReala * (1 - totalPierderiDCF / 100) * trackerBonusGlobal);  // FIX: include tracker
    const venAn = productieNetaP50 * parseFloat(formData.tarifPPA||'0');
    const capEx = parseInt(formData.valoareInvestitie||'0') - parseInt(formData.grantSolicitat||'0');
    // npv, irr, payback — folosim valorile calculate în componentă (liniile 330-332)

    // ─── GENERARE TABEL DCF 25 ANI ───────────────────────────
    const durataInt = parseInt(durata);
    const degradare = 0.004; // 0.4%/an degradare TOPCon
    const opexInitial = putere * 12000; // €12k/MW/an consistent KB9
    const opexCrestere = 0.02; // 2%/an crestere OpEx
    const dcfRows: string[] = [];
    dcfRows.push('| An | Producție (MWh) | Venituri PPA (€) | OpEx (€) | EBITDA (€) | FCF (€) | Factor 8% | FCF Actualizat (€) | FCF Cumulat (€) |');
    dcfRows.push('|---|---|---|---|---|---|---|---|---|');
    const investitieTotal = parseInt(formData.valoareInvestitie||'0');
    let fcfCumulat = -capEx; // FIX: porneste din capEx net (investitie - grant) pentru NPV corect
    let fcfCumulatAn1 = 0;
    let totalFCF = 0;
    let totalFCFact = 0;
    for (let an = 1; an <= durataInt; an++) {
      const productieAn = Math.round(venAn / parseFloat(formData.tarifPPA||'1') * Math.pow(1-degradare, an-1));
      const venituriAn = Math.round(productieAn * parseFloat(formData.tarifPPA||'0'));
      const opexAn = Math.round(opexInitial * Math.pow(1+opexCrestere, an-1));
      const ebitda = venituriAn - opexAn;
      const fcf = ebitda;
      const factor = Math.pow(1.08, an);
      const fcfAct = Math.round(fcf / factor);
      fcfCumulat += fcfAct;
      if (an === 1) fcfCumulatAn1 = fcfCumulat;
      totalFCF += fcf;
      totalFCFact += fcfAct;
      dcfRows.push(`| ${an} | ${productieAn.toLocaleString()} | ${venituriAn.toLocaleString()} | ${opexAn.toLocaleString()} | ${ebitda.toLocaleString()} | ${fcf.toLocaleString()} | ${(1/factor).toFixed(4)} | ${fcfAct.toLocaleString()} | ${fcfCumulat.toLocaleString()} |`);
    }
    dcfRows.push(`| **TOTAL** | — | — | — | — | **${totalFCF.toLocaleString()}** | — | **${totalFCFact.toLocaleString()}** | — |`);
    const tabelDCF = dcfRows.join('\n');

    // ─── GENERARE BILANȚ ENERGETIC ───────────────────────────
    const productieAnBruta = solarData?.irradiance ? Math.round(putere * solarData.irradiance) : Math.round(putere * 1300);
    const irradianta = solarData?.irradiance ?? 1400;
    const aqiVal = aqiData?.aqi ?? 50;
    const soiling = aqiVal > 100 ? 4.5 : aqiVal > 50 ? 2.5 : 1.5;  // FIX: AQI<50→1.5%
    const pierdereTempProc = 3.2;
    const pierdereInvertorProc = 2.0;
    const pierdereCD_Proc = 1.5;
    const pierdereCAProc = 0.8;
    const pierdereUmbrireProc = 1.0;
    const disponibilitate = 99.0;
    const totalPierderiProc = pierdereTempProc + pierdereInvertorProc + pierdereCD_Proc + pierdereCAProc + pierdereUmbrireProc + soiling + (100 - disponibilitate);
    // BONUS TRACKER — identic cu productieP50 din scope global
    const trackerBonus = formData.tracker?.includes('Single-axis') ? 1.135 : formData.tracker?.includes('Dual-axis') ? 1.27 : 1.0;
    const productieNeta = productieP50; // foloseste valoarea pre-calculata din scope global
    const productieP90 = Math.round(productieP50 * 0.91);
    // LCOE din scope global (calculat corect la linia ~363, injectat în baseContext)
    const tabelBilant = [
      '| Etapă | Valoare | Pierdere | Observații |',
      '|---|---|---|---|',
      `| Iradianță PVGIS | ${irradianta} kWh/m²/an | — | Date reale PVGIS-SARAH2 |`,
      `| Producție brută DC | ${productieAnBruta.toLocaleString()} MWh/an | — | E_y PVGIS |`,
      `| Pierderi temperatură | -${pierdereTempProc}% | ${Math.round(productieAnBruta*pierdereTempProc/100).toLocaleString()} MWh | Coef. temp. -0.35%/°C |`,
      `| Pierderi soiling | -${soiling}% | ${Math.round(productieAnBruta*soiling/100).toLocaleString()} MWh | AQI=${aqiVal} (corelat) |`,
      `| Pierderi invertor | -${pierdereInvertorProc}% | ${Math.round(productieAnBruta*pierdereInvertorProc/100).toLocaleString()} MWh | Randament 98% |`,
      `| Pierderi cabluri DC | -${pierdereCD_Proc}% | ${Math.round(productieAnBruta*pierdereCD_Proc/100).toLocaleString()} MWh | Secțiuni optimizate |`,
      `| Pierderi cabluri AC | -${pierdereCAProc}% | ${Math.round(productieAnBruta*pierdereCAProc/100).toLocaleString()} MWh | Transformator+MT |`,
      `| Pierderi umbrire | -${pierdereUmbrireProc}% | ${Math.round(productieAnBruta*pierdereUmbrireProc/100).toLocaleString()} MWh | Layout optimizat |`,
      `| Disponibilitate rețea | ${disponibilitate}% | ${Math.round(productieAnBruta*(100-disponibilitate)/100).toLocaleString()} MWh | SLA operator |`,
      `| **Producție netă P50** | **${productieNeta.toLocaleString()} MWh/an** | **Total: -${totalPierderiProc.toFixed(1)}%** | **Garantat bancabil** |`,
      `| Producție netă P90 | ${productieP90.toLocaleString()} MWh/an | -9% vs P50 | Scenariu conservator |`,
      `| LCOE estimat | ${lcoe} EUR/MWh | — | (CapEx+OpEx25ani)/Productie25ani |`,
    ].join('\n');
    // ─────────────────────────────────────────────────────────

    const CAPITOLE = [
      { nr: 1, titlu: 'INFORMAȚII GENERALE PRIVIND OBIECTUL DE INVESTIȚII',
        instructiuni: `Generează CAPITOLUL 1 complet (minim 1500 cuvinte):
1.1 Denumirea obiectivului de investiții — numele complet oficial
1.2 Ordonator principal de credite / Investitor — date complete: denumire, adresă sediu, reprezentant legal, CUI, nr. ONRC, telefon, email
1.3 Ordonator de credite ierarhic superior — dacă investiție privată, menționează explicit și justifică
1.4 Beneficiarul investiției — date complete, rol în proiect (dezvoltator/proprietar/operator)
1.5 Elaboratorul studiului de fezabilitate — HELIO Platform: calitate, competențe, metodologie (date PVGIS, modelare climatică, design generativ)
IMPORTANT VALORI DE REFERINȚĂ — folosește EXCLUSIV aceste valori în tot documentul:
- Producție anuală P50 NET = ${productieP50.toLocaleString()} MWh/an (după pierderi 12%)
- Iradianță PVGIS = ${irradianta} kWh/m²/an (aceasta e kWh/kWp/an, NU MWh total!)
- Putere instalată = ${putere} MWp
- Formula: ${putere} MWp × ${irradianta} kWh/kWp × ${((1 - totalPierderiProc/100)).toFixed(3)} (eficiență după pierderi ${totalPierderiProc.toFixed(1)}%) × ${trackerBonusGlobal.toFixed(3)} (bonus tracker) = ${productieP50.toLocaleString()} MWh/an
NU scrie niciodată că producția e ${irradianta} MWh/an — aceasta e iradianța specifică, nu producția totală!
Fiecare subcapitol minim 250 cuvinte. Ton profesional tehnico-juridic conform finanțare europeană.` },
      { nr: 2, titlu: 'SITUAȚIA ACTUALĂ ȘI NECESITATEA REALIZĂRII OBIECTIVULUI DE INVESTIȚII',
        instructiuni: `IMPORTANT ANTI-CORUPERE: Scrie EXCLUSIV în română curată și corectă. INTERZIS: simboluri speciale (@, #, |, {, }, \\, ~), cuvinte engleze în mijlocul frazelor, placeholder-e necompletate, coduri tehnice în text narativ. Fiecare propoziție să fie completă și corectă gramatical.

Generează CAPITOLUL 2 complet (minim 3000 cuvinte) cu subcapitolele:

2.1 Concluziile studiului de prefezabilitate
Justifică comasarea fazelor conform HG 907/2016 art.7. Prezintă concluziile tehnice și financiare preliminare: producție validată ${productieP50.toLocaleString()} MWh/an, NPV = ${npv.toLocaleString()} EUR, IRR = ${irr}%, eligibilitate grant confirmată.

2.2 Prezentarea contextului actual — cadru legislativ
Lista completă acte normative aplicabile (fiecare pe rând nou cu "- "):
Directive UE: RED II 2018/2001, Fit for 55, European Climate Law 2021/1119, DNSH 2020/852, Directiva 2019/944.
Legi naționale: HG 907/2016, Legea 123/2012, OUG 944/2021, Legea 220/2008, HG 1076/2021 PNIESC, OUG 60/2022.
Analiză piața energiei România 2025-2026: prețuri OPCOM, pondere RES, deficit capacitate.

2.3 Analiza situației existente
Amplasament: ${formData.localitate} jud. ${formData.judet}, suprafață ${formData.suprafata} ha, coordonate GPS.
Infrastructură existentă: acces rutier, rețea MT proximă, utilități.
Deficiențe energetice regionale identificate.

2.4 Analiza cererii de bunuri și servicii
Cerere energie curată în regiune, potențiali beneficiari PPA, piața contractelor PPA România.
Tarif PPA estimat: ${formData.tarifPPA} EUR/MWh.

2.5 Obiective SMART
Specific: ${putere} MWp, producție P50 = ${productieP50.toLocaleString()} MWh/an.
Measurable: monitorizare SCADA, termografii anuale.
Achievable: tehnologie TOPCon bifacial, eficiență peste 22%.
Relevant: aliniere PNIESC, tranziție energetică jud. ${formData.judet}.
Time-bound: implementare 18 luni, PPA semnat la punere în funcțiune.

Fiecare subcapitol minim 500 cuvinte. Ton profesional tehnico-juridic.` },
      { nr: 3, titlu: 'IDENTIFICAREA ȘI PREZENTAREA SCENARIILOR/OPȚIUNILOR TEHNICO-ECONOMICE',
        instructiuni: `Generează SUBCAPITOLELE 3.1 - 3.1.3 (minim 2500 cuvinte):
3.1 Scenariul 1 — Soluția propusă: ${formData.tipPanou} + ${formData.tracker}${formData.bess !== 'Nu' ? ' + BESS ' + formData.bess : ''}${formData.fpv !== 'Nu' ? ' + FPV ' + formData.fpv : ''}. Prezintă justificarea tehnică a alegerii soluției.
3.1.1 Particularități amplasament: GPS ${formData.gps || 'N/A'}, altitudine ${solarData?.elevation ?? 'N/A'}m, iradianță ${solarData?.irradiance ?? 'N/A'} kWh/m²/an, AQI ${aqiData?.aqi ?? 'N/A'} (${aqiData?.pollutant ?? 'N/A'})
BILANȚ ENERGETIC COMPLET — REPRODUCE TABELUL EXACT:
${tabelBilant}
Comentează fiecare etapă de pierdere, justifică valorile tehnic, prezintă P50 vs P90 și implicațiile pentru bancabilitate.
3.1.2 Descrierea tehnică constructivă detaliată — prezintă fișe tehnice complete pentru: panouri ${formData.tipPanou} (eficiență, putere, garanție, certificări, producători), invertoare ${formData.tipInvertor} (topologie, randament, protecții), structuri ${formData.tracker} (material, rezistență vânt max ${climateData?.windMaxAbsolut ?? 150} km/h conform date reale OpenMeteo, sarcini zăpadă ${climateData?.zileZapadaAn ?? 20} zile/an, fundații)${formData.bess !== "Nu" ? ", BESS " + formData.bess + " (chimie LFP, cicluri, BMS, aplicații)" : ""}, sistem SCADA (monitorizare string-level, alertare, dashboard, securitate VPN).
3.1.3 Deviz general conform HG 907/2016 — REPRODUCE TABELUL EXACT:
${(() => {
  const inv = parseInt(formData.valoareInvestitie||'0');
  const c1 = Math.round(inv * 0.010); // C1 obtinere+amenajare teren 1%
  const c2 = Math.round(inv * 0.030); // C2 asigurare utilitati 3%
  const c3 = Math.round(inv * 0.040); // C3 proiectare+asistenta tehnica 4%
  const c4echip = Math.round(inv * 0.670); // C4.1 echipamente 67% (total 100%)
  const c4montaj = Math.round(inv * 0.200); // C4.2 montaj+racordare 20%
  const c5 = Math.round(inv * 0.025); // C5 organizare santier 2.5%
  const c6 = Math.round(inv * 0.025); // C6 diverse+neprevazute max 10% HG907
  const c4total = c4echip + c4montaj;
  const totalFaraTVA = c1+c2+c3+c4total+c5+c6;
  const tva = Math.round(totalFaraTVA * 0.19);
  const rows = [
    '| Capitol | Denumire | Valoare (EUR) | % din total |',
    '|---|---|---|---|',
    `| C1 | Cheltuieli pentru obținerea și amenajarea terenului | ${c1.toLocaleString()} | 1% |`,
    `| C2 | Cheltuieli pentru asigurarea utilităților necesare | ${c2.toLocaleString()} | 3% |`,
    `| C3 | Cheltuieli pentru proiectare și asistență tehnică | ${c3.toLocaleString()} | 4% |`,
    `| C4.1 | Echipamente: panouri ${formData.tipPanou}, invertoare, BESS, tracker, SCADA | ${c4echip.toLocaleString()} | 67% |`,
    `| C4.2 | Montaj, racordare SEN, stație MT, cabluri DC/AC | ${c4montaj.toLocaleString()} | 20% |`,
    `| C5 | Organizare șantier | ${c5.toLocaleString()} | 2.5% |`,
    `| C6 | Cheltuieli diverse și neprevăzute (max 10% HG907) | ${c6.toLocaleString()} | 2.5% |`,
    `| **TOTAL fără TVA** | — | **${totalFaraTVA.toLocaleString()}** | **100%** |`,
    `| TVA 19% | — | ${tva.toLocaleString()} | — |`,
    `| **TOTAL cu TVA** | — | **${(totalFaraTVA+tva).toLocaleString()}** | — |`,
  ];
  return rows.join('\n');
})()}
Analizează fiecare capitol de cheltuieli, justifică procentele față de prețurile pieței 2025, compară cu referințe similare din România.
3.1.4 Studii de specialitate necesare (minim 500 cuvinte) — descrie detaliat fiecare studiu obligatoriu:
Studiu topografic: ridicare topo Stereo70, scara 1:500, vizare OCPI.
Studiu geotehnic: foraje 4-6 buc, stratificatie sol, capacitate portanta, nivel apa freatica, agresivitate chimica, parametri seismici ag=0.15g Tc=0.7s conform P100/1-2019.
Studiu hidrologic: cote inundatii, servituti, zone protectie cursuri apa.
Studiu electromagnetic EMC: interferente cu retele telecomunicatii.
Studiu solutie racordare: traseu MT, punct racordare, lucrari necesare.
Studiu umbrire si layout: optimizare distante randuri, pierderi umbra sub 1%.
3.1.5 Grafic orientativ de realizare (minim 300 cuvinte) — tabel pe luni:
Luna 1-3: proiectare PT+DDE, obtinere CU, comanda studii specialitate.
Luna 4-9: obtinere avize ATR, mediu APM, ISC, utilitati.
Luna 10-18: executie lucrari, montaj echipamente, racordare SEN.
Luna 19-21: teste la rece si la cald, punere in functiune, receptie, licenta ANRE.
3.2 Scenariul 0 — Situatia de referinta fara investitie (minim 500 cuvinte): analiza completa a impactului neimplementarii: costuri oportunitate pe 25 ani la tarif piata, grant european neaccesat, deficit energetic regional perpetuat, emisii CO2 neevitate pe 25 ani, stagnare economica regionala.
Fiecare subcapitol minim 400 cuvinte.` },
      { nr: 4, titlu: 'ANALIZA SCENARIILOR/OPȚIUNILOR TEHNICO-ECONOMICE PROPUSE',
        instructiuni: `Generează CAPITOLUL 4 complet (minim 4000 cuvinte):
4.1 Cadrul de analiză DCF: ipoteze macroeconomice, WACC 8% justificat, orizont ${durata} ani, structura fluxuri numerar, valoare reziduală
4.2 Vulnerabilități climatice: P50/P90, fenomene extreme, degradare panouri, AQI=${aqiData?.aqi ?? 'N/A'} soiling effect detaliat, costuri curățare integrate OpEx
4.3 Situația utilităților: rețele existente, capacitate evacuare SEN, consum propriu tehnologic. ATENȚIE CRITICĂ: iradianța PVGIS = ${solarData?.irradiance ?? 1446} kWh/m²/an este resursa solară per kWp instalat — NU este producția parcului. Producția netă P50 a parcului = ${productieNetaP50.toLocaleString()} MWh/an (calculată din putere × iradianță × PR × tracker). Nu confunda cele două valori în text.
4.4 Sustenabilitate:
4.4.1 Impact social: locuri muncă construcție+O&M, comunitate locală, taxe, efect antrenare
4.4.2 Forța de muncă: structura echipelor proiectare/construcție/operare
4.4.3 Impact mediu: reducere CO2 (tone/an), DNSH pe 6 obiective, procedura EIM APM ${formData.judet || ''}
4.5 Analiza financiară detaliată — INCLUDE OBLIGATORIU tabelul de mai jos EXACT cum este, fără modificări:
NPV=${npv.toLocaleString()} EUR | IRR=${irr}% | Payback=${payback} ani | WACC=8% | CapEx net=${capEx.toLocaleString()} EUR
Grant ${formData.tipFinantare}: ${parseInt(formData.grantSolicitat||'0').toLocaleString()} EUR (${grantPerMw} k€/MW)${(formData.tipFinantare==='PTJ'||formData.tipFinantare==='Fond Modernizare') ? ' | Regula I-C: calcul detaliat eligibilitate' : ''}
LCOE = ${lcoe} EUR/MWh — FOLOSEȘTE EXCLUSIV această valoare precalculată. NU recalcula, NU modifica, NU folosi altă formulă. Formula reală: (InvestițieTotală + OpEx25ani) / Producție25ani = ${lcoe} EUR/MWh.
DSCR mediu = EBITDA / serviciul datoriei — prezintă per an în tabel separat

TABEL FLUX NUMERAR DCF ${durata} ANI (REPRODUCE EXACT — NU REGENERA, NU MODIFICA NICIO VALOARE):
VALOARI CONTROL: FCF Cumulat An 1 = ${fcfCumulatAn1.toLocaleString()} EUR | CapEx NET (investiție-grant) = ${capEx.toLocaleString()} EUR
${tabelDCF}

Analizează tabelul: identifică anul break-even, evoluția FCF cumulat, comentează sustenabilitatea.
4.6 Analiza economică: beneficii socio-economice cuantificate, valoare adăugată locală
4.7 Analiza cost-eficacitate: LCOE calculat, comparație cu alternative
4.8 Analiza sensitivitate: scenariul de baza este NPV=${npv.toLocaleString()} EUR | IRR=${irr}% | Payback=${payback} ani. Genereaza tabel complet cu variații ±10% PPA, ±15% CapEx, ±5% producție — impact NPV/IRR/Payback. FOLOSESTE EXACT aceste valori de baza, NU inventa alte valori.
4.9 Matrice riscuri:
4.9.1 Riscuri tehnice: probabilitate×impact, măsuri mitigare
4.9.2 Riscuri financiare: probabilitate×impact, măsuri mitigare
4.9.3 Riscuri reglementare+climatice: probabilitate×impact, măsuri mitigare
Fiecare subcapitol minim 400 cuvinte.` },
      { nr: 5, titlu: 'SCENARIUL/OPȚIUNEA TEHNICO-ECONOMICĂ OPTIMĂ RECOMANDATĂ',
        instructiuni: `Generează CAPITOLUL 5 complet (minim 2500 cuvinte):
5.1 Compararea scenariilor: tabel detaliat Scenariu 1 vs Scenariu 0 pe criterii: putere, producție, CO2, locuri muncă, NPV, IRR, Payback, impact rețea, sustenabilitate, eligibilitate finanțare
5.2 Selectarea și justificarea scenariului optim: argumentare tehnică și financiară completă, avantaje ${formData.tipPanou}+${formData.tracker}, valoarea BESS, LCOE competitiv
5.3 Descrierea scenariului optim: layout parc ${formData.suprafata || ''} ha, configurație electrică DC+AC, topologie rețea, protecții, punct racordare SEN
5.4 Tabel indicatori tehnico-economici — REPRODUCE TABELUL EXACT DE MAI JOS, NU LĂSA GOL:
| Indicator | Valoare | Unitate | Status |
|-----------|---------|---------|--------|
| Putere instalată | ${putere} | MWp | — |
| Suprafață | ${formData.suprafata || ''} | ha | — |
| Producție anuală (P50 net) | ${productieP50.toLocaleString()} | MWh/an | — |
| Iradianță PVGIS | ${solarData?.irradiance ?? 'N/A'} | kWh/m²/an | — |
| Valoare investiție | ${parseInt(formData.valoareInvestitie||'0').toLocaleString()} | EUR | — |
| Grant solicitat | ${parseInt(formData.grantSolicitat||'0').toLocaleString()} | EUR | — |
| NPV (8%, ${durata}ani) | ${npv.toLocaleString()} | EUR | ${npv > 0 ? 'POZITIV' : 'NEGATIV'} |
| IRR | ${irr} | % | ${irr > 8 ? 'OK (>WACC)' : 'SUB WACC'} |
| Payback | ${payback} | ani | ${payback < 12 ? 'ACCEPTABIL' : 'LUNG'} |
5.5 Conformitatea cu reglementările: HG 907/2016, directive UE, standarde IEC, normative ANRE
5.6 Sursele de finanțare — prezintă DETALIAT structura financiară bazată pe datele reale:
Tip finanțare: ${formData.tipFinantare}
Grant solicitat: ${parseInt(formData.grantSolicitat||'0').toLocaleString()} EUR (${grantPerMw} k€/MW)
Investiție totală: ${parseInt(formData.valoareInvestitie||'0').toLocaleString()} EUR
Cofinanțare proprie: ${(parseInt(formData.valoareInvestitie||'0') - parseInt(formData.grantSolicitat||'0')).toLocaleString()} EUR
Regula I-C (VANF/C pe investiție totală) = ${iCRule.toLocaleString()} EUR → ${iCRule <= 0 ? 'ELIGIBIL — NPV negativ confirmă necesitatea grantului' : 'NEELIGIBIL — NPV pozitiv, proiect autosustenabil'}

${formData.tipFinantare === 'PTJ' ? `REGULI PTJ SPECIFICE JUDEȚULUI ${formData.judet}:
- Buget total PTJ România: €2.53 miliarde (Reg. UE 2021/1056)
- Județ prioritar: ${formData.judet} — plafon grant max €${PTJ_GRANTS[formData.judet] || grantLimita}M
- Condiție obligatorie I-C≤0: investiția nu poate depăși costurile eligibile
- Grant/MW maxim: 200 k€/MW pentru solar utility-scale
- Criterii eligibilitate: entitate privată sau publică, teren în proprietate/concesiune min 25 ani, PUZ aprobat, studiu fezabilitate conform HG 907/2016
- Documente dosar: SF complet, deviz general, plan situație, CF teren, CUI, statut, bilanț, studiu impact mediu, acord rețea Transelectrica/Distribuție
- Greșeli frecvente respingere: I>C (regula nerespectată), lipsă acord rețea, suprafață insuficientă, deviz nedetaliat pe categorii HG 907
- Punctaj grilă evaluare: capacitate financiară (20p), maturitate proiect (30p), impact social (25p), impact mediu CO2 (25p)
- Termen estimat depunere: sesiune 2025-2026, verifică ghidul specific MIPE` : ''}
${formData.tipFinantare === 'Fond Modernizare' ? `REGULI FOND MODERNIZARE:
- Administrat de AFM România, finanțare 100% grant pentru entități publice
- Prioritate: primării, consilii județene, instituții publice
- Plafon: până la €5M per proiect solar
- Condiție: beneficiar public, teren domeniu public, avize complete
- Documente: HCL aprobare proiect, SF HG 907, studiu oportunitate, deviz complet` : ''}
Prezintă structura de finanțare în tabel, justifică eligibilitatea, detaliază condițiile creditului bancar dacă există cofinanțare, prezintă calendarul tragerilor.
Fiecare subcapitol minim 400 cuvinte.` },
      { nr: 6, titlu: 'URBANISM, ACORDURI ȘI AVIZE CONFORME',
        instructiuni: `Generează CAPITOLUL 6 complet (minim 2500 cuvinte):
6.1 Certificat de urbanism: procedură detaliată Primăria ${formData.localitate || ''} / CJ ${formData.judet || ''}, documente necesare, termene, conținut CU, valabilitate
6.2 Extras CF: situație juridică ${formData.suprafata || ''} ha, drept proprietate/concesiune, sarcini, compatibilitate investiție, modificare categorie folosință
6.3 Protecția mediului: procedura EIM completă la APM ${formData.judet || ''}: etape, memoriu prezentare, evaluare adecvată Natura 2000, condiții acord mediu, monitorizare
6.4 Avize conforme necesare — descriere detaliată fiecare aviz, autoritate emitentă, documente, termen:
- Aviz Tehnic de Racordare (ATR) — operator distribuție / Transelectrica, studiu soluție racordare, capacitate, nivel tensiune, costuri
- Aviz ANRE — înființare capacitate producere, licență, condiții
- Aviz ISC — verificare proiect DTAC
- Avize utilități — apă/canal, gaze, telecomunicații, drumuri
- Aviz AACR — glare/reflexie, obstaculare zbor, procedură, criterii. IMPORTANT: NU inventa distanța față de aeroport — distanța față de orașul ${formData.localitate || ""} NU este distanța față de aeroport. Menționează că distanța exactă față de aeroport va fi verificată în faza de proiectare tehnică.
- Aviz MApN — coexistență infrastructură apărare, radare
- Aviz PUZ dacă necesar
6.5 Studiu topografic OCPI: Stereo 70, Marea Neagră 1975, scară 1:500-1:1000, vizare OCPI ${formData.judet || ''}
6.6 Studii specifice: geotehnic (foraje, stratificație, apă freatică, agresivitate chimică), hidrologic (cote inundații), electromagnetic (EMC)
Fiecare subcapitol minim 350 cuvinte.` },
      { nr: 7, titlu: 'IMPLEMENTAREA INVESTIȚIEI',
        instructiuni: `Generează CAPITOLUL 7 complet (minim 2000 cuvinte):
7.1 Entitatea responsabilă: ${formData.beneficiar || 'Beneficiarul'}, structura PMU, echipa dedicată (director proiect, inginer șef, responsabil financiar, responsabil achiziții, responsabil mediu), experiență proiecte similare
7.2 Strategia de implementare: contract EPC la cheie, transfer risc, supervizare independentă. Grafic Gantt detaliat pe faze+activități, jaloane cheie: semnare contract finanțare, ordin începere, livrare echipamente majore, finalizare construcție, instalare panouri/invertoare/BESS, teste la rece, teste la cald, PIF, licență ANRE, operare comercială
7.3 Plan O&M pe ${durata} ani: mentenanță preventivă (termografii drone, verificare structuri tracker, testare invertoare+BESS, curățare panouri robotizată față AQI ${aqiData?.aqi ?? ''}+PM${aqiData?.pollutant ?? ''}), mentenanță corectivă (stoc piese schimb, timp răspuns 24h), înlocuiri planificate (invertoare an 12-15, BESS conform cicluri), SCADA 24/7, costuri O&M FIXATE la ${Math.round(putere * 12000).toLocaleString()} EUR/an (€12k/MW/an, An1) cu creștere 2%/an — FOLOSEȘTE EXACT această valoare, NU inventa altă cifră
7.4 Capacitate managerială: Diriginte Șantier autorizat ISC independent, expert tranzacționare energie pentru BESS pe piețele echilibrare+PID, consultant financiar monitorizare KPIs
Fiecare subcapitol minim 400 cuvinte.` },
      { nr: 8, titlu: 'CONCLUZII ȘI RECOMANDĂRI',
        instructiuni: `Generează CAPITOLUL 8 complet (minim 2000 cuvinte) + tabel centralizator:
8.1 Sinteza viabilității tehnice: tehnologie ${formData.tipPanou}+${formData.tracker}${formData.bess !== 'Nu' ? '+BESS ' + formData.bess : ''}, amplasament (iradianță ${solarData?.irradiance ?? 'N/A'} kWh/m²/an, altitudine ${solarData?.elevation ?? 'N/A'}m), producție garantabilă P50 = ${productieP50.toLocaleString()} MWh/an, robustețe tehnică, conformitate standarde
8.2 Sinteza viabilității financiare: NPV=${npv.toLocaleString()} EUR (${npv > 0 ? 'POZITIV' : 'NEGATIV'}), IRR=${irr}% (${irr > 8 ? 'peste WACC 8%' : 'sub WACC 8%'}), Payback=${payback} ani, dependența de grant, structura finanțare
8.3 Recomandare generală VIABIL/CONDIȚIONAT VIABIL/NEVIABIL: verdict motivat complet pe toate aspectele tehnice, financiare, juridice și de reglementare
8.4 Pași următori: MINIM 600 cuvinte, fiecare pas explicat detaliat minim 3 rânduri:
- Pas 1: Clarificare ghid ${formData.tipFinantare} — verificare apel deschis MySMIS2021, plafoane actualizate, calendar depunere, condiții eligibilitate
- Pas 2: Hotărâre Consiliu Local — aprobare SF, alocare fonduri studii teren, împuternicire primar
- Pas 3: Studii teren obligatorii — geotehnic (foraje 4-6 buc), topografic OCPI Stereo70, hidrologic, electromagnetic EMC
- Pas 4: Certificat Urbanism — depunere documentație Primărie/CJ ${formData.judet || ""}, termen 30 zile, verificare PUG/PUZ
- Pas 5: Solicitare ATR — depunere operator distribuție, studiu soluție racordare, confirmare capacitate evacuare
- Pas 6: Procedura mediu APM — memoriu prezentare, verificare Natura 2000, Acord de Mediu
- Pas 7: Achiziție publică EPC — caiet sarcini, licitație deschisă Legea 98/2016, criterii calitate-preț
- Pas 8: Depunere cerere finanțare — dosar complet MySMIS2021, SF+deviz+studii+avize+CF+CUI
- Pas 9: Semnare contract finanțare — verificare clauze, grafic trageri, raportare periodică
- Pas 10: Monitorizare implementare — rapoarte progres, cereri rambursare, audit final, PIF ANRE
8.5 Calendar pe luni: Luna 1 (aprobare SF+strategie), Luna 2-3 (CU+studii teren), Luna 4-6 (cerere finanțare+ATR), Luna 7-12 (Acord Mediu+AC), Luna 13-24 (execuție EPC+PIF)

La final include tabel centralizator complet:
| Indicator | Valoare | Unitate | Status |
|-----------|---------|---------|--------|
| Putere instalată | ${putere} | MWp | — |
| Suprafață | ${formData.suprafata || ''} | ha | — |
| Producție anuală estimată (P50 net) | ${productieP50.toLocaleString()} | MWh/an | — |
| Iradianță PVGIS | ${solarData?.irradiance ?? 'N/A'} | kWh/m²/an | — |
| Altitudine amplasament | ${solarData?.elevation ?? 'N/A'} | m | — |
| AQI amplasament | ${aqiData?.aqi ?? 'N/A'} | index | ${aqiData?.category ?? ''} |
| Valoare investiție | ${parseInt(formData.valoareInvestitie||'0').toLocaleString()} | EUR | — |
| Grant solicitat | ${parseInt(formData.grantSolicitat||'0').toLocaleString()} | EUR | — |
| Grant/MW | ${grantPerMw} | k€/MW | — |
| NPV (8%, ${durata}ani) | ${npv.toLocaleString()} | EUR | ${npv > 0 ? 'POZITIV' : 'NEGATIV'} |
| IRR | ${irr} | % | ${irr > 8 ? 'OK (>WACC 8%)' : 'SUB WACC'} |
| Payback | ${payback} | ani | ${payback < 12 ? 'ACCEPTABIL' : 'LUNG'} |
| Tarif PPA | ${formData.tarifPPA || ''} | EUR/MWh | — |
Fiecare subcapitol minim 400 cuvinte.` }
    ];

    let fullSF = '';
    const TOTAL = CAPITOLE.length;

    try {
      for (let idx = 0; idx < CAPITOLE.length; idx++) {
        const cap = CAPITOLE[idx];
        setCapProgress({ current: idx + 1, total: TOTAL, label: 'Cap. ' + cap.nr + ' — ' + cap.titlu });

        const capPrompt = baseContext + '\n\nINSTRUCȚIUNI PENTRU ACEST CAPITOL:\n' + cap.instructiuni + '\n\nREGULI OBLIGATORII:\n- Limbaj tehnic-juridic profesional\n- Listele legislative cu "- " pe rând separat\n- Tabelele cu separatori "|"\n- NU include alte capitole — DOAR capitolul cerut\n- NU scrie titlul CAPITOLUL X — începe direct cu 1.1 / 2.1 etc.\n- Fiecare subcapitol (5.1, 5.2 etc.) apare O SINGURA DATA — NU repeta, NU reformula\n- NU regenera Capitol 1, 2, 3 sau orice alt capitol in interiorul raspunsului tau\n- NU adauga titluri noi dupa ce ai terminat subcapitolele cerute\n- Cand ai terminat ultimul subcapitol cerut, OPRESTE-TE IMEDIAT — fara continut suplimentar';

        const result = await callAI(capPrompt, cap.nr);
        if (result) {
          fullSF += '\n\nCAPITOLUL ' + cap.nr + '. ' + cap.titlu + '\n\n' + result;
          setSfOutput(fullSF.trim());
          if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
        // Pauza între capitole — mai mare după cap grele (3,4)
        if (idx < CAPITOLE.length - 1) {
          const pause = (cap.nr === 3 || cap.nr === 4) ? 60000 : 45000;
          setCapProgress({ current: idx + 1, total: TOTAL, label: 'Pauză ' + (pause/1000) + 's → Cap. ' + CAPITOLE[idx+1].nr + '...' });
          await new Promise(r => setTimeout(r, pause));
        }
      }

      setCapProgress(null);
      setIsDone(true);
      setGenerating(false);
    } catch (err) {
      setSfOutput(fullSF + '\n\nEroare la generare capitol. Reîncearcă.');
      setCapProgress(null);
      setGenerating(false);
      setIsDone(true);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sfOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStep(0);
    setSfOutput('');
    setIsDone(false);
    setGenerating(false);
    setEditMode(false);
  };

  // ─── PDF EXPORT — PROFESSIONAL A4 ─────────────────────────
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const today = new Date().toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' });
    const todayShort = new Date().toLocaleDateString('ro-RO');

    const parseContent = (text: string): string => {
      const lines = text.split('\n');
      let html = '';
      let inList = false;
      let inTable = false;
      let tableRows: string[] = [];
      let firstChapter = true;
      const e = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const flushList = () => { if (inList) { html += '</ul>'; inList = false; } };
      const flushTable = () => {
        if (inTable && tableRows.length > 0) {
          html += '<table class="sf-table"><thead>';
          tableRows.forEach((r,i) => {
            const cells = r.split('|').filter(c => c.trim() !== '');
            if (i === 0) html += '<tr>' + cells.map(c => `<th>${e(c.trim())}</th>`).join('') + '</tr></thead><tbody>';
            else html += '<tr>' + cells.map(c => `<td>${e(c.trim())}</td>`).join('') + '</tr>';
          });
          html += '</tbody></table>';
          inTable = false; tableRows = [];
        }
      };
      for (const line of lines) {
        const t = line.trim();
        if (/^[-=]{3,}$/.test(t)) { flushList(); flushTable(); html += '<hr class="sf-hr">'; continue; }
        if (t.startsWith('|')) {
          if (t.includes('---')) continue;
          flushList(); inTable = true;
          tableRows.push(t.replace(/^\||\|$/g,'')); continue;
        } else { flushTable(); }
        if (/^CAPITOLUL\s+\d+/.test(t)) {
          flushList();
          if (!firstChapter) html += '</div>';
          html += `<div class="${firstChapter ? 'first-cap' : 'cap-section'}"><h2 class="cap-title">${e(t)}</h2>`;
          firstChapter = false; continue;
        }
        if (/^\d+\.\d+(\.\d+)?\.?\s+\S/.test(t)) {
          flushList();
          html += `<h3 class="sub-title">${e(t)}</h3>`; continue;
        }
        if (/^[\-•]\s+/.test(t)) {
          flushTable();
          if (!inList) { html += '<ul class="sf-list">'; inList = true; }
          html += `<li>${e(t.replace(/^[\-•]\s+/,''))}</li>`; continue;
        }
        flushList();
        if (!t) continue;
        html += `<p class="sf-para">${e(t).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}</p>`;
      }
      flushList(); flushTable();
      if (!firstChapter) html += '</div>';
      return html;
    };

    const html = `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8">
<title>SF — ${formData.denumire || 'Proiect'}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Inter:wght@400;500;600;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#fff;}
body{font-family:'Merriweather',Georgia,serif;font-size:10.5pt;line-height:1.9;color:#1a1a2e;}
/* ── COVER PAGE ── */
.cover{width:210mm;min-height:297mm;padding:0;display:flex;flex-direction:column;page-break-after:always;position:relative;}
.cover-top{background:#0f172a;padding:28px 32px 22px;display:flex;align-items:center;gap:16px;}
.cover-logo{font-family:'Inter',sans-serif;font-size:28pt;font-weight:900;color:#fbbf24;letter-spacing:6px;}
.cover-logo-sub{font-family:'Inter',sans-serif;font-size:7.5pt;color:#94a3b8;letter-spacing:3.5px;margin-top:4px;}
.cover-badge{margin-left:auto;background:#1e3a5f;border:1px solid #3b82f6;border-radius:4px;padding:6px 14px;font-family:'Inter',sans-serif;font-size:8pt;color:#93c5fd;text-align:center;}
.cover-stripe{height:6px;background:linear-gradient(90deg,#f59e0b,#3b82f6,#10b981);}
.cover-body{flex:1;padding:40px 42px 32px;display:flex;flex-direction:column;}
.cover-type{font-family:'Inter',sans-serif;font-size:9pt;font-weight:700;color:#3b82f6;letter-spacing:4px;text-transform:uppercase;margin-bottom:10px;}
.cover-title{font-family:'Inter',sans-serif;font-size:22pt;font-weight:900;color:#0f172a;line-height:1.25;margin-bottom:8px;}
.cover-subtitle{font-family:'Inter',sans-serif;font-size:10pt;color:#64748b;margin-bottom:36px;}
.cover-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px 28px;margin-bottom:20px;}
.cover-card-title{font-family:'Inter',sans-serif;font-size:7.5pt;font-weight:700;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;}
.cover-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 32px;}
.cover-field label{font-family:'Inter',sans-serif;font-size:7.5pt;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;display:block;margin-bottom:2px;}
.cover-field span{font-family:'Inter',sans-serif;font-size:10pt;font-weight:600;color:#0f172a;}
.cover-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
.kpi-box{background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:14px 12px;text-align:center;}
.kpi-val{font-family:'Inter',sans-serif;font-size:13pt;font-weight:900;color:#0f172a;}
.kpi-lbl{font-family:'Inter',sans-serif;font-size:7pt;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-top:3px;}
.kpi-box.ok .kpi-val{color:#059669;}
.kpi-box.warn .kpi-val{color:#d97706;}
.cover-gps{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;font-family:'Inter',sans-serif;font-size:8.5pt;color:#166534;}
.cover-bottom{margin-top:auto;padding:20px 42px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;}
.cover-footer-brand{font-family:'Inter',sans-serif;font-size:8pt;color:#64748b;}
.cover-footer-date{font-family:'Inter',sans-serif;font-size:8pt;color:#94a3b8;}
/* ── TOC PAGE ── */
.toc-page{width:210mm;min-height:297mm;padding:52px 42px;page-break-after:always;}
.toc-title{font-family:'Inter',sans-serif;font-size:16pt;font-weight:900;color:#0f172a;margin-bottom:8px;}
.toc-line{height:3px;background:#0f172a;width:48px;margin-bottom:32px;}
.toc-item{display:flex;align-items:baseline;margin-bottom:10px;font-family:'Inter',sans-serif;}
.toc-item.cap{font-size:10.5pt;font-weight:700;color:#0f172a;margin-top:16px;margin-bottom:6px;}
.toc-item.sub{font-size:9pt;font-weight:400;color:#475569;padding-left:20px;}
.toc-dots{flex:1;border-bottom:1px dotted #cbd5e1;margin:0 8px;margin-bottom:3px;}
.toc-pg{font-size:8.5pt;color:#64748b;min-width:20px;text-align:right;}
/* ── CONTENT PAGES ── */
.content-wrap{width:210mm;padding:22mm 22mm 18mm 25mm;}
@page{size:A4;margin:0;}
.page-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #0f172a;padding-bottom:8px;margin-bottom:20px;}
.ph-brand{font-family:'Inter',sans-serif;font-size:8pt;font-weight:700;color:#0f172a;letter-spacing:2px;}
.ph-title{font-family:'Inter',sans-serif;font-size:7.5pt;color:#64748b;max-width:280px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.page-footer{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:20px;}
.pf-info{font-family:'Inter',sans-serif;font-size:7pt;color:#94a3b8;}
.cap-section{page-break-before:always;}
.first-cap{page-break-before:avoid;}
.cap-title{font-family:'Inter',sans-serif;font-size:13pt;font-weight:900;color:#fff;background:#0f172a;padding:12px 18px;margin:0 -0px 18px;letter-spacing:0.3px;page-break-after:avoid;}
.sub-title{font-family:'Inter',sans-serif;font-size:10.5pt;font-weight:700;color:#1e40af;margin:22px 0 8px;page-break-after:avoid;}
.sf-para{margin-bottom:11px;text-align:justify;font-size:10.5pt;}
.sf-list{margin:8px 0 14px 22px;}
.sf-list li{margin-bottom:6px;line-height:1.75;font-size:10.5pt;}
.sf-hr{border:none;border-top:1px solid #e2e8f0;margin:14px 0;}
.sf-table{width:100%;border-collapse:collapse;margin:14px 0 20px;font-family:'Inter',sans-serif;font-size:8.5pt;}
.sf-table thead th{background:#0f172a;color:#fff;padding:8px 10px;text-align:left;font-weight:700;}
.sf-table td{padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top;}
.sf-table tr:nth-child(even) td{background:#f8fafc;}
@media print{
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .cover,.toc-page,.content-wrap{page-break-after:always;}
  .cap-section{page-break-before:always;}
  .cap-title,.sub-title{page-break-after:avoid;}
}
</style>
</head>
<body>
<!-- ═══ COVER ═══ -->
<div class="cover">
  <div class="cover-top">
    <div><div class="cover-logo">⚡ HELIOS</div><div class="cover-logo-sub">PLATFORMA INTELIGENTĂ PENTRU ENERGIE SOLARĂ</div></div>
    <div class="cover-badge">HG 907/2016<br>CONFORM</div>
  </div>
  <div class="cover-stripe"></div>
  <div class="cover-body">
    <div class="cover-type">Studiu de Fezabilitate</div>
    <div class="cover-title">${formData.denumire || 'Proiect Fotovoltaic'}</div>
    <div class="cover-subtitle">Conform HG 907/2016 — Anexa 4 | Generat: ${today}</div>
    <div class="cover-card">
      <div class="cover-card-title">Date Identificare Proiect</div>
      <div class="cover-grid">
        <div class="cover-field"><label>Beneficiar</label><span>${formData.beneficiar || '—'}</span></div>
        <div class="cover-field"><label>Amplasament</label><span>${formData.localitate || '—'}, jud. ${formData.judet || '—'}</span></div>
        <div class="cover-field"><label>Putere Instalată</label><span>${formData.putere || '—'} MWp</span></div>
        <div class="cover-field"><label>Suprafață</label><span>${formData.suprafata || '—'} ha</span></div>
        <div class="cover-field"><label>Tip Finanțare</label><span>${formData.tipFinantare}</span></div>
        <div class="cover-field"><label>Valoare Investiție</label><span>€${parseInt(formData.valoareInvestitie||'0').toLocaleString()}</span></div>
      </div>
    </div>
    <div class="cover-kpi">
      <div class="kpi-box ${npv > 0 ? 'ok' : 'warn'}"><div class="kpi-val">€${npv > 1000000 ? (npv/1000000).toFixed(1)+'M' : npv.toLocaleString()}</div><div class="kpi-lbl">NPV</div></div>
      <div class="kpi-box ${irr > 8 ? 'ok' : 'warn'}"><div class="kpi-val">${irr}%</div><div class="kpi-lbl">IRR</div></div>
      <div class="kpi-box ${payback < 12 ? 'ok' : 'warn'}"><div class="kpi-val">${payback} ani</div><div class="kpi-lbl">Payback</div></div>
      <div class="kpi-box"><div class="kpi-val">${formData.tarifPPA || '—'}</div><div class="kpi-lbl">€/MWh PPA</div></div>
    </div>
    ${formData.gps ? `<div class="cover-gps">📍 GPS: ${formData.gps} &nbsp;|&nbsp; Alt: ${solarData?.elevation ?? '—'}m &nbsp;|&nbsp; AQI: ${aqiData?.aqi ?? '—'} &nbsp;|&nbsp; Iradianță: ${solarData?.irradiance ?? '—'} kWh/m²/an</div>` : ''}
  </div>
  <div class="cover-bottom">
    <div class="cover-footer-brand">⚡ HELIOS Platform &bull; by Sergiu</div>
    <div class="cover-footer-date">${todayShort}</div>
  </div>
</div>
<!-- ═══ TOC ═══ -->
<div class="toc-page">
  <div class="toc-title">Cuprins</div>
  <div class="toc-line"></div>
  ${[
    ['1','INFORMAȚII GENERALE PRIVIND OBIECTUL DE INVESTIȚII',true,'3'],
    ['1.1','Denumirea obiectivului de investiții',false,'3'],
    ['1.2','Ordonator principal de credite / Investitor',false,'4'],
    ['1.4','Beneficiarul investiției',false,'5'],
    ['1.5','Elaboratorul studiului de fezabilitate',false,'6'],
    ['2','SITUAȚIA ACTUALĂ ȘI NECESITATEA REALIZĂRII OBIECTIVULUI',true,'8'],
    ['2.1','Concluziile studiului de prefezabilitate',false,'8'],
    ['2.2','Prezentarea contextului actual',false,'9'],
    ['2.3','Analiza situației existente',false,'11'],
    ['2.4','Analiza cererii de bunuri și servicii',false,'13'],
    ['2.5','Obiective preconizate a fi atinse',false,'15'],
    ['3','IDENTIFICAREA ȘI PREZENTAREA SCENARIILOR TEHNICO-ECONOMICE',true,'17'],
    ['3.1','Scenariul 1 — Soluția propusă',false,'17'],
    ['3.2','Scenariul 0 — Situația de referință',false,'24'],
    ['4','ANALIZA SCENARIILOR TEHNICO-ECONOMICE PROPUSE',true,'26'],
    ['4.1','Cadrul de analiză — metodologie DCF',false,'26'],
    ['4.4','Sustenabilitatea investiției',false,'30'],
    ['4.5','Analiza financiară',false,'33'],
    ['4.6','Analiza de sensitivitate',false,'40'],
    ['4.7','Analiza de riscuri',false,'43'],
    ['5','SCENARIUL/OPȚIUNEA TEHNICO-ECONOMICĂ OPTIMĂ RECOMANDATĂ',true,'47'],
    ['6','URBANISM, ACORDURI ȘI AVIZE CONFORME',true,'54'],
    ['7','IMPLEMENTAREA INVESTIȚIEI',true,'60'],
    ['8','CONCLUZII ȘI RECOMANDĂRI',true,'66'],
  ].map(([n,t,cap,pg]) => `<div class="toc-item ${cap?'cap':'sub'}"><span>${n}. ${t}</span><span class="toc-dots"></span><span class="toc-pg">${pg}</span></div>`).join('')}
</div>
<!-- ═══ CONTENT ═══ -->
<div class="content-wrap">
  <div class="page-header">
    <div class="ph-brand">⚡ HELIOS</div>
    <div class="ph-title">${formData.denumire || 'Studiu de Fezabilitate'} | ${formData.beneficiar || ''}</div>
  </div>
  ${parseContent(sfOutput)}
  <div class="page-footer">
    <div class="pf-info">Document generat de HELIOS Platform &bull; HG 907/2016 Compliant</div>
    <div class="pf-info">${todayShort}</div>
  </div>
</div>
</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 800);
  };


    // ─── RENDER STEP 0: DATE GENERALE ─────────────────────────
  const renderStep0 = () => (
    <div className="grid grid-cols-1 gap-4">
      <Field label="Denumire proiect" value={formData.denumire} onChange={set('denumire')}
        placeholder="ex: Parc FV Giurgiu Nord 34MW" icon={<FileText className="w-4 h-4" />} />
      <Field label="Beneficiar (firmă)" value={formData.beneficiar} onChange={set('beneficiar')}
        placeholder="ex: Green Energy SRL" icon={<Building2 className="w-4 h-4" />} />
      <SelectField
        label="Județ"
        value={formData.judet}
        onChange={set('judet')}
        options={JUDETE.map(j => ({
          value: j,
          label: PTJ_JUDETE.includes(j) ? `${j} ★ PTJ` : j,
        }))}
        icon={<MapPin className="w-4 h-4" />}
      />
      <Field label="Localitate / Comună" value={formData.localitate} onChange={set('localitate')}
        placeholder="ex: Izvoarele" />
      <div>
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-xs font-medium text-slate-400 leading-tight">🗺️ Click pe hartă → GPS automat</span>
          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) return;
              navigator.geolocation.getCurrentPosition(pos => {
                const gpsVal = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
                set('gps')(gpsVal);
                setTimeout(() => fetchSolarData(gpsVal), 100);
              });
            }}
            className="shrink-0 text-xs px-3 py-2 bg-sky-500/20 border border-sky-500/40 text-sky-400 rounded-lg whitespace-nowrap"
          >
            📍 Localizează-mă
          </button>
        </div>
        <div ref={mapRef} style={{height: '260px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(100,116,139,0.3)', position: 'relative', zIndex: 1}} />
      </div>
      <Field label="Coordonate GPS (lat, lon)" value={formData.gps} onChange={(v) => { set('gps')(v); fetchSolarData(v); }} onBlur={() => fetchSolarData(formData.gps)}
        placeholder="ex: 44.1234, 25.4567" icon={<MapPin className="w-4 h-4" />} />
      {/* Solar Data Card */}
      {(loadingSolar || solarData || geoAddress) && (
        <div className="col-span-2 bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4">
          {loadingSolar && <span className="text-emerald-400 text-xs animate-pulse">⚡ Se încarcă date solare PVGIS...</span>}
          {geoAddress && !loadingSolar && <span className="text-slate-300 text-xs">📍 {geoAddress}</span>}
          {solarData && !loadingSolar && (
            <>
              <span className="text-emerald-400 text-xs font-bold">☀️ Producție anuală: {solarData.productie.toLocaleString()} kWh/an</span>
              {solarData.irradiance > 0 && <span className="text-amber-400 text-xs">🌞 Iradianță optimă: {solarData.irradiance} kWh/m²/an</span>}
              {solarData.elevation !== undefined && <span className="text-sky-400 text-xs">⛰️ Altitudine: {solarData.elevation}m deasupra mării</span>}
              {aqiData && <span className={`text-xs ${aqiData.aqi <= 50 ? 'text-emerald-400' : aqiData.aqi <= 100 ? 'text-amber-400' : 'text-red-400'}`}>🌬️ AQI: {aqiData.aqi} — {aqiData.category} ({aqiData.pollutant.toUpperCase()})</span>}
              {placesData?.localities?.[0] && <span className="text-violet-400 text-xs">🏘️ Cel mai apropiat oraș: {placesData.localities[0].name} ({placesData.localities[0].distance} km)</span>}
            </>
          )}
        </div>
      )}
      {satelliteUrl && !loadingSolar && (
        <div className="col-span-2 rounded-xl overflow-hidden border border-slate-600/50">
          <div className="bg-slate-800/60 px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-slate-400">🗺️ Localizare teren (OpenStreetMap)</span>
          </div>
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(satelliteUrl.split('lon=')[1])-0.02},${parseFloat(satelliteUrl.split('lat=')[1])-0.015},${parseFloat(satelliteUrl.split('lon=')[1])+0.02},${parseFloat(satelliteUrl.split('lat=')[1])+0.015}&layer=mapnik&marker=${satelliteUrl.split('lat=')[1].split('&')[0]},${satelliteUrl.split('lon=')[1]}`}
            className="w-full"
            style={{height: '280px', border: 'none'}}
          />
        </div>
      )}
      <Field label="Suprafață teren (ha)" value={formData.suprafata} onChange={set('suprafata')}
        placeholder="ex: 45" type="number" />

      {ptjEligibil && (
        <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-400">JUDEȚ ELIGIBIL PTJ</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Grant disponibil: max €{grantLimita}M · Fond Modernizare activ · Termen sesiune 2026
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // ─── RENDER STEP 1: PARAMETRI TEHNICI ─────────────────────
  const renderStep1 = () => (
    <div className="grid grid-cols-1 gap-4">
      <Field label="Putere instalată (MWp)" value={formData.putere} onChange={set('putere')}
        placeholder="ex: 34" type="number" icon={<Sun className="w-4 h-4" />} />
      <SelectField label="Tip panou fotovoltaic" value={formData.tipPanou} onChange={set('tipPanou')}
        options={[
          { value: 'TOPCon Bifacial', label: 'TOPCon Bifacial (recomandat 2026)' },
          { value: 'Monocristalin HJT', label: 'HJT Monocristalin (randament maxim)' },
          { value: 'Policristalin standard', label: 'Policristalin standard' },
          { value: 'Perovskite-Silicon Tandem', label: 'Perovskite-Silicon Tandem' },
        ]} icon={<Sun className="w-4 h-4" />}
      />
      <SelectField label="Tip invertor" value={formData.tipInvertor} onChange={set('tipInvertor')}
        options={[
          { value: 'String', label: 'String Invertor (≤5MW/unit)' },
          { value: 'Central HV', label: 'Central HV (>1MW, recomandat utility)' },
          { value: 'Microinvertor', label: 'Microinvertor (rooftop)' },
        ]} icon={<Cpu className="w-4 h-4" />}
      />
      <SelectField label="Stocare BESS" value={formData.bess} onChange={set('bess')}
        options={[
          { value: 'Nu', label: 'Fără stocare' },
          { value: 'BESS 1h', label: 'BESS 1h (peak shaving)' },
          { value: 'BESS 2h', label: 'BESS 2h (recomandat utility)' },
          { value: 'BESS 4h', label: 'BESS 4h (grid-scale arbitrage)' },
        ]} icon={<Battery className="w-4 h-4" />}
      />
      {formData.tipFinantare === 'Fond Modernizare' && formData.bess === 'Nu' && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-semibold">
          <span className="text-base leading-none">⚠️</span>
          <span>FM 2025 impune stocare obligatorie (min. 2h, LiFePO4). Selectați BESS 2h sau 4h pentru eligibilitate.</span>
        </div>
      )}
      <SelectField label="Sistem tracker" value={formData.tracker} onChange={set('tracker')}
        options={[
          { value: 'Fix', label: 'Fix — structuri fixe (standard)' },
          { value: 'Single-axis (1-ax)', label: 'Single-axis tracker (+12-15% producție)' },
          { value: 'Dual-axis (2-ax)', label: 'Dual-axis tracker (+25-30% producție)' },
        ]}
      />
      <SelectField label="Sistem FPV (plutitor)" value={formData.fpv} onChange={set('fpv')}
        options={[
          { value: 'Nu', label: 'Ground-mount standard' },
          { value: 'Da — Sungrow FPV', label: 'FPV Sungrow (+10-15% eficiență)' },
          { value: 'Da — Ciel & Terre', label: 'FPV Ciel & Terre (Hydrelio®)' },
          { value: 'Da — generic', label: 'FPV alt producător' },
        ]}
      />
    </div>
  );

  // ─── RENDER STEP 2: FINANȚARE ─────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-5">
      {/* Tip finanțare */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tip finanțare</p>
        <div className="flex flex-wrap gap-2">
          {(['PTJ', 'Fond Modernizare', 'Privat', 'Mixt'] as const).map(t => (
            <button key={t} onClick={() => set('tipFinantare')(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all
                ${formData.tipFinantare === t
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Field label="Valoare totală investiție (EUR)" value={formData.valoareInvestitie}
          onChange={set('valoareInvestitie')} placeholder="ex: 25000000" type="number"
          icon={<Euro className="w-4 h-4" />}
        />
        <Field label="Grant solicitat (EUR)" value={formData.grantSolicitat}
          onChange={set('grantSolicitat')} placeholder="ex: 12000000" type="number"
          icon={<Euro className="w-4 h-4" />}
        />
        <Field label="Durată concesiune/exploatare (ani)" value={formData.durataConcesiune}
          onChange={set('durataConcesiune')} placeholder="25" type="number"
        />
        <Field label="Tarif PPA estimat (EUR/MWh)" value={formData.tarifPPA}
          onChange={set('tarifPPA')} placeholder="65" type="number"
        />
      </div>

      {/* KPI Cards auto-calculate */}
      {putere > 0 && investitie > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'NPV estimat',
              value: npv >= 0 ? `€${(npv / 1e6).toFixed(1)}M` : `-€${Math.abs(npv / 1e6).toFixed(1)}M`,
              ok: npv > 0,
              icon: <TrendingUp className="w-4 h-4" />,
            },
            {
              label: 'IRR estimat',
              value: `${irr}%`,
              ok: irr > 8,
              icon: <TrendingUp className="w-4 h-4" />,
            },
            {
              label: 'Payback',
              value: `${payback} ani`,
              ok: payback < 12,
              icon: <TrendingUp className="w-4 h-4" />,
            },
            {
              label: 'I - C (grant)',
              value: `${iCRule <= 0 ? '✓' : '✗'} €${(iCRule / 1e6).toFixed(1)}M`,
              ok: iCRule <= 0,
              icon: iCRule <= 0 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />,
            },
          ].map((kpi, i) => (
            <div key={i}
              className={`p-3 rounded-xl border text-center transition-all
                ${kpi.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
                }`}>
              <div className={`flex justify-center mb-1 ${kpi.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {kpi.icon}
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-bold leading-tight">{kpi.label}</p>
              <p className={`text-sm font-bold mt-0.5 ${kpi.ok ? 'text-emerald-300' : 'text-red-300'}`}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── RENDER STEP 3: GENERARE AI ───────────────────────────
  const renderStep3 = () => (
    <div className="space-y-5">
      {/* Upload documente */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Upload documente (opțional — îmbunătățesc calitatea SF)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {['Certificat Urbanism', 'Studiu Geotehnic', 'ATR Racordare'].map(doc => (
            <button key={doc} onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 p-3 bg-slate-800/40 border border-slate-700 border-dashed
                rounded-xl text-xs text-slate-400 hover:border-amber-500/40 hover:text-amber-400 transition-all">
              <Upload className="w-4 h-4 shrink-0" />
              <span>{doc}</span>
            </button>
          ))}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.png,.jpeg"
          multiple onChange={handleFileUpload} className="hidden" />
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachments.map((a, i) => (
              <span key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400">
                <FileText className="w-3 h-3" />
                {a.name}
                <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                  className="text-emerald-600 hover:text-red-400 ml-1 transition-colors">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Model AI */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Model AI</p>
        <div className="flex gap-2">
          {[
            { value: 'gemini', label: 'Gemini Pro', desc: 'Recomandat · PDF' },
            { value: 'deepseek', label: 'DeepSeek', desc: 'Rapid' },
            { value: 'qwen', label: 'Qwen', desc: 'Alternativă' },
          ].map(m => (
            <button key={m.value} onClick={() => set('modelAI')(m.value)}
              className={`flex-1 p-3 rounded-xl border text-center transition-all
                ${formData.modelAI === m.value
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}>
              <p className="text-xs font-bold">{m.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Limbă */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Limbă output</p>
        <div className="flex gap-2">
          {[
            { value: 'romana', label: '🇷🇴 Română' },
            { value: 'engleza', label: '🇬🇧 English' },
          ].map(l => (
            <button key={l.value} onClick={() => set('limba')(l.value)}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all
                ${formData.limba === l.value
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sumar proiect */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Sumar proiect — verifică înainte de generare
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {[
            ['Proiect', formData.denumire || '—'],
            ['Beneficiar', formData.beneficiar || '—'],
            ['Locație', formData.localitate && formData.judet ? `${formData.localitate}, ${formData.judet}` : '—'],
            ['Putere', formData.putere ? `${formData.putere} MWp` : '—'],
            ['Tehnologie', `${formData.tipPanou} · ${formData.tracker}`],
            ['Investiție', investitie ? `€${investitie.toLocaleString()}` : '—'],
            ['Grant', grant ? `€${grant.toLocaleString()}` : '—'],
            ['Finanțare', formData.tipFinantare],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-slate-500 shrink-0">{k}:</span>
              <span className="text-slate-200 font-medium truncate">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── RENDER OUTPUT ────────────────────────────────────────
  const renderOutput = () => (
    <div className="space-y-4">
      {/* Status bar */}
      {generating && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-400">HELIO generează SF complet...</p>
              {capProgress && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Capitol {capProgress.current}/{capProgress.total}: {capProgress.label}
                </p>
              )}
            </div>
            {capProgress && (
              <span className="text-xs font-bold text-amber-400 shrink-0">
                {Math.round(capProgress.current / capProgress.total * 100)}%
              </span>
            )}
          </div>
          {capProgress && (
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.round(capProgress.current / capProgress.total * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {isDone && (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-400">SF Generat cu Succes</p>
            <p className="text-xs text-slate-500 mt-0.5">
              ~{sfOutput.trim() ? sfOutput.trim().split(/\s+/).length.toLocaleString() : '0'} cuvinte · 7 capitole · HG 907/2016
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700
                border border-slate-600 rounded-lg text-xs text-slate-400 hover:text-white transition-all">
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiat!' : 'Copiază'}
            </button>
            <button onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs transition-all
                ${editMode
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-400 hover:text-white'
                }`}>
              <Edit3 className="w-3.5 h-3.5" />
              Editează
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30
                border border-emerald-500/40 rounded-lg text-xs text-emerald-400 font-bold transition-all">
              <Printer className="w-3.5 h-3.5" />
              Export PDF
            </button>
          </div>
        </div>
      )}

      {/* Output area */}
      <div ref={outputRef}
        className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 max-h-[58vh] overflow-y-auto custom-scrollbar">
        {editMode ? (
          <textarea
            value={sfOutput}
            onChange={e => setSfOutput(e.target.value)}
            className="w-full bg-transparent text-[13px] sm:text-xs text-slate-300 leading-relaxed font-mono
              resize-none outline-none min-h-[400px]"
            style={{ minHeight: '400px' }}
          />
        ) : (
          <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
            {sfOutput}
            {generating && (
              <span className="inline-block w-2 h-3.5 bg-amber-400 animate-pulse ml-0.5 align-middle rounded-sm" />
            )}
          </pre>
        )}
      </div>

      <button onClick={handleReset}
        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
        <RotateCcw className="w-3.5 h-3.5" />
        Generează SF nou
      </button>
    </div>
  );

  // ─── RENDER PRINCIPAL ─────────────────────────────────────
  return (
    <div className="min-h-full p-4 md:p-8 bg-[#020617]">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
                HELIOS SF ENGINE
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Generator Studii de Fezabilitate · HG 907/2016 · AI-Powered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">HELIO ACTIV</span>
          </div>
        </div>

        {/* Step indicator — ascuns pe output */}
        {step < 4 && <StepIndicator current={step} />}

        {/* Card principal */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 md:p-6">

          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderOutput()}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-800">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-2 px-4 py-3 sm:py-2 bg-slate-800 border border-slate-700 rounded-xl
                  text-sm text-slate-400 hover:text-white hover:border-slate-500 min-w-[90px] justify-center
                  disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95">
                <ChevronLeft className="w-4 h-4" />
                Înapoi
              </button>

              <span className="text-xs text-slate-600">{step + 1} / 4</span>

              {step < 3 ? (
                <button
                  onClick={() => setStep(s => Math.min(3, s + 1))}
                  className="flex items-center gap-2 px-5 py-3 sm:py-2 bg-amber-500/20 border border-amber-500/40
                    rounded-xl text-sm text-amber-400 font-bold hover:bg-amber-500/30 transition-all min-w-[110px] justify-center active:scale-95">
                  Continuă
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : formData.tipFinantare === 'Fond Modernizare' && formData.bess === 'Nu' ? (
                <div className="flex flex-col items-end gap-1">
                  <button disabled
                    className="flex items-center gap-2 px-6 py-2.5
                      bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 font-bold
                      opacity-60 cursor-not-allowed">
                    <Zap className="w-4 h-4" />
                    Generează SF Complet
                  </button>
                  <span className="text-[10px] text-red-400 font-semibold">⚠️ Selectați BESS pentru FM 2025</span>
                </div>
              ) : (
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-6 py-2.5
                    bg-gradient-to-r from-amber-500/20 to-emerald-500/20
                    border border-amber-500/40 rounded-xl text-sm text-amber-400 font-bold
                    hover:from-amber-500/30 hover:to-emerald-500/30 transition-all">
                  <Zap className="w-4 h-4" />
                  Generează SF Complet
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SFEngine;
