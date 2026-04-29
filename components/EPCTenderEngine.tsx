import React, { useState, useCallback } from 'react';
import {
  FileSignature, ChevronRight, ChevronLeft, Zap, CheckCircle,
  Building2, MapPin, Cpu, Euro, Calendar, Shield, Loader2,
  Copy, Printer, RefreshCw, AlertCircle, TrendingUp, BarChart3,
  Scale, Wrench
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { callNvidiaAI } from '../services/geminiService';

// ─── CONSTANTE ────────────────────────────────────────────────────────────────
const JUDETE = [
  'Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani',
  'Brașov','Brăila','Buzău','Caraș-Severin','Călărași','Cluj','Constanța',
  'Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita',
  'Hunedoara','Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș',
  'Neamț','Olt','Prahova','Satu Mare','Sălaj','Sibiu','Suceava',
  'Teleorman','Timiș','Tulcea','Vaslui','Vâlcea','Vrancea','București',
];

const TIP_CONTRACT = ['EPC (Engineer Procure Construct)', 'EPCM (EPC + Management)', 'Turnkey complet', 'O&M (Operare & Mentenanță)', 'Design & Build'];
const TIP_PANOU = ['TOPCon 665Wp', 'TOPCon 720Wp', 'TOPCon 760Wp', 'HJT 700Wp', 'Bifacial PERC 660Wp'];
const TIP_INVERTOR = ['String (Huawei SUN2000)', 'Central (Sungrow SC)', 'Hibrid cu BESS'];
const TIP_TRACKER = ['Fix (terenuri plate)', 'Single-axis (SAT +18%)', 'Dual-axis (+26%)'];
const TIP_RACORDARE = ['Medie Tensiune (MT)', 'Înaltă Tensiune (IT 110kV)', 'Fără racordare (izolat)'];
const MODELE_AI = [
  { value: 'kimi', label: 'Kimi K2.5', desc: 'Recomandat · Raționament' },
  { value: 'qwen', label: 'Qwen 3.5', desc: 'Rapid · Tehnic' },
  { value: 'deepseek', label: 'DeepSeek V3.2', desc: 'Detaliat · Calcule' },
  { value: 'glm5', label: 'GLM-5', desc: 'Alternativă' },
];

const CAPEX_LINII_DEFAULT = [
  { id: 'module',     label: 'Module PV',                  icon: '🔆', eurWp: 0.185, culoare: '#f59e0b' },
  { id: 'invertoare', label: 'Invertoare',                 icon: '⚡', eurWp: 0.038, culoare: '#10b981' },
  { id: 'structuri',  label: 'Structuri metalice + fundații', icon: '🏗️', eurWp: 0.062, culoare: '#3b82f6' },
  { id: 'bop',        label: 'Cabluri & BOP',               icon: '🔌', eurWp: 0.028, culoare: '#8b5cf6' },
  { id: 'civil',      label: 'Lucrări civile & drumuri',    icon: '🏚️', eurWp: 0.055, culoare: '#ec4899' },
  { id: 'statii',     label: 'Stație MT/IT & Trafo',        icon: '🔌', eurWp: 0.035, culoare: '#06b6d4' },
  { id: 'engineering',label: 'Engineering, PM, Autorizații',icon: '📐', eurWp: 0.022, culoare: '#f97316' },
  { id: 'commission', label: 'Commissioning & Grid tests',  icon: '✅', eurWp: 0.012, culoare: '#84cc16' },
];

const JALOANE_DEFAULT = [
  { id: 'avans',   label: 'Avans contract',      pct: 20 },
  { id: 'echip',   label: 'Livrare echipamente', pct: 30 },
  { id: 'racord',  label: 'Racordare rețea',      pct: 30 },
  { id: 'receptie',label: 'Recepție finală',      pct: 20 },
];

// ─── TIPURI ────────────────────────────────────────────────────────────────────
interface CapexLinie {
  id: string; label: string; icon: string;
  eurWp: number; culoare: string; activ?: boolean;
}

interface Jalon { id: string; label: string; pct: number; }

interface TenderForm {
  denumireProiect: string; client: string; judet: string; localitate: string;
  putere: string; suprafata: string; tipContract: string;
  tipPanou: string; putereModul: string; tipInvertor: string;
  tracker: string; bess: string; fpv: string; racordare: string; lungimeLeA: string;
  duratExecutie: string; garantieInst: string; penalitatiZi: string; penalitatiMax: string;
  avans: string; garantieExec: string; retinere: string;
  marja: string; overhead: string; risc: string; contingency: string;
  modelAI: string; noteAdditionale: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n: number, dec = 0) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const calcTotalCapex = (
  linii: CapexLinie[], putere: number, bess: string,
  marja: number, overhead: number, risc: number, contingency: number
) => {
  const putereWp = putere * 1_000_000;
  const subTotal = linii.reduce((acc, l) => acc + l.eurWp * putereWp, 0);
  const bessVal = bess === 'Da' ? putere * 120_000 : 0; // €120k/MWh, ~1h storage
  const base = subTotal + bessVal;
  const cont = base * (contingency / 100);
  const afterCont = base + cont;
  const marjaVal = afterCont * (marja / 100);
  const ohVal = afterCont * (overhead / 100);
  const riscVal = afterCont * (risc / 100);
  const total = afterCont + marjaVal + ohVal + riscVal;
  return { subTotal, bessVal, cont, afterCont, marjaVal, ohVal, riscVal, total };
};

// ─── SUB-COMPONENTE ────────────────────────────────────────────────────────────
const StepIndicator: React.FC<{ current: number }> = ({ current }) => {
  const steps = ['Client & Proiect', 'Tehnic', 'CAPEX', 'Contract', 'Generare'];
  return (
    <div className="flex items-center gap-1 sm:gap-2 mb-8 overflow-x-auto pb-1">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
            ${i < current ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : i === current ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
            {i < current ? <CheckCircle className="w-3 h-3 shrink-0" /> : <span className="w-3 text-center">{i + 1}</span>}
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < 4 && <div className={`flex-1 h-px min-w-[8px] transition-colors ${i < current ? 'bg-emerald-500/40' : 'bg-slate-700'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

interface FieldProps {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: React.ReactNode; mono?: boolean;
}
const Field: React.FC<FieldProps> = ({ label, value, onChange, placeholder, type = 'text', icon, mono }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">{icon}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full bg-slate-900 border border-slate-700 rounded-xl ${icon ? 'pl-9' : 'px-4'} pr-4 py-2.5 text-white text-sm
          focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-colors
          placeholder:text-slate-600 ${mono ? 'font-mono' : ''}`} />
    </div>
  </div>
);

interface SelectProps {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; icon?: React.ReactNode;
}
const Select: React.FC<SelectProps> = ({ label, value, onChange, options, icon }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10">{icon}</div>}
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`w-full bg-slate-900 border border-slate-700 rounded-xl ${icon ? 'pl-9' : 'px-4'} pr-4 py-2.5 text-white text-sm
          focus:border-amber-500 focus:outline-none transition-colors appearance-none cursor-pointer`}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">{icon}</div>
    <div>
      <h3 className="text-white font-bold text-lg">{title}</h3>
      {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const EPCTenderEngine: React.FC = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TenderForm>({
    denumireProiect: '', client: '', judet: 'Ilfov', localitate: '',
    putere: '10', suprafata: '15', tipContract: TIP_CONTRACT[0],
    tipPanou: TIP_PANOU[0], putereModul: '665', tipInvertor: TIP_INVERTOR[0],
    tracker: TIP_TRACKER[0], bess: 'Nu', fpv: 'Nu', racordare: TIP_RACORDARE[0], lungimeLeA: '2',
    duratExecutie: '12', garantieInst: '5', penalitatiZi: '0.05', penalitatiMax: '10',
    avans: '20', garantieExec: '10', retinere: '5',
    marja: '8', overhead: '3', risc: '2', contingency: '5',
    modelAI: 'kimi', noteAdditionale: '',
  });

  const [capexLinii, setCapexLinii] = useState<CapexLinie[]>(
    CAPEX_LINII_DEFAULT.map(l => ({ ...l, activ: true }))
  );
  const [jaloane, setJaloane] = useState<Jalon[]>(JALOANE_DEFAULT);
  const [outputTab, setOutputTab] = useState<'tehnic' | 'financiar' | 'plan' | 'clauze'>('tehnic');

  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<{ tehnic: string; financiar: string; plan: string; clauze: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const upd = useCallback((k: keyof TenderForm, v: string) => setForm(f => ({ ...f, [k]: v })), []);

  // ── CALCULE CAPEX ─────────────────────────────────────────────────────────
  const putereNum = parseFloat(form.putere) || 0;
  const liniiActive = capexLinii.filter(l => l.activ);
  const calcResult = calcTotalCapex(
    liniiActive, putereNum, form.bess,
    parseFloat(form.marja) || 0,
    parseFloat(form.overhead) || 0,
    parseFloat(form.risc) || 0,
    parseFloat(form.contingency) || 0,
  );

  const numModules = putereNum > 0 ? Math.round((putereNum * 1_000_000) / (parseFloat(form.putereModul) || 665)) : 0;
  const eurWpTotal = putereNum > 0 ? calcResult.total / (putereNum * 1_000_000) : 0;

  // ── PIE DATA ──────────────────────────────────────────────────────────────
  const pieData = liniiActive.map(l => ({
    name: l.label.split(' ').slice(0, 2).join(' '),
    value: Math.round(l.eurWp * putereNum * 1_000_000),
    fill: l.culoare,
  }));
  if (form.bess === 'Da') pieData.push({ name: 'BESS Stocare', value: Math.round(putereNum * 120_000), fill: '#e11d48' });

  // ── AI CALL ───────────────────────────────────────────────────────────────
  const buildPrompt = (sectiune: string) => {
    const capexSumar = liniiActive.map(l =>
      `${l.label}: ${fmt(l.eurWp * putereNum * 1_000_000)} € (${l.eurWp.toFixed(3)} €/Wp)`
    ).join('\n');

    return `Ești expert EPC solar cu 15+ ani experiență în România și Europa. Generează ofertă tehnică-comercială profesională SECȚIUNEA: ${sectiune}.

DATELE PROIECTULUI:
- Proiect: ${form.denumireProiect || 'Parc Fotovoltaic'}
- Client: ${form.client || 'Client Confidențial'}
- Locație: ${form.localitate}, Județul ${form.judet}
- Putere instalată: ${form.putere} MWp
- Suprafață teren: ${form.suprafata} ha
- Tip contract: ${form.tipContract}

SPECIFICAȚII TEHNICE:
- Module: ${form.tipPanou} (${numModules.toLocaleString()} buc)
- Invertoare: ${form.tipInvertor}
- Tracking: ${form.tracker}
- BESS: ${form.bess}
- FPV Floating: ${form.fpv}
- Racordare: ${form.racordare}, lungime LEA: ${form.lungimeLeA} km

CAPEX TOTAL: ${fmt(calcResult.total)} € (${eurWpTotal.toFixed(3)} €/Wp)
Breakdown:
${capexSumar}
Contingency ${form.contingency}%: ${fmt(calcResult.cont)} €
Marjă ${form.marja}%: ${fmt(calcResult.marjaVal)} €
Overhead ${form.overhead}%: ${fmt(calcResult.ohVal)} €
Risc ${form.risc}%: ${fmt(calcResult.riscVal)} €

CONDIȚII CONTRACTUALE:
- Durată execuție: ${form.duratExecutie} luni
- Garanție instalație: ${form.garantieInst} ani
- Penalități: ${form.penalitatiZi}%/zi, max ${form.penalitatiMax}%
- Avans solicitat: ${form.avans}%
- Garanție bună execuție: ${form.garantieExec}%
- Reținere garanție: ${form.retinere}%

NOTE SPECIALE:
${form.noteAdditionale || 'Nicio notă adițională.'}

INSTRUCȚIUNI PENTRU SECȚIUNEA "${sectiune}":
${sectiune === 'Ofertă Tehnică' ? `
Generează o ofertă tehnică detaliată (minim 600 cuvinte) cu:
1. Introducere și prezentare Ofertant (companie EPC experimentată)
2. Scopul lucrărilor și limitele contractului
3. Soluție tehnică propusă detaliată (echipamente, branduri recomandate: Huawei/LONGi/Sungrow/Solaredge)
4. Garanții echipamente (module 25 ani produs, 30 ani performanță; invertoare 5 ani ext.)
5. Standarde aplicabile (IEC 62446, SR EN 50618, EN 62305, IEEE 1547)
6. Livrabile tehnice (As-built, FAT/SAT rapoarte, O&M manual)
7. Echipa de proiect (PM, Inginer Proiectare, Șef Șantier, Safety Officer)
8. Metodologie execuție (WBS nivel 2)
Folosește format profesional cu secțiuni numerotate.` : ''}
${sectiune === 'Financiar & Comercial' ? `
Generează secțiunea financiară detaliată cu:
1. Structura prețului (tabel cu categorii CAPEX exact din datele primite)
2. Prețul total ofertat și prețul pe Wp
3. Condiții de plată cu jaloanele: ${jaloane.map(j => `${j.label} ${j.pct}%`).join(', ')}
4. Clauza de ajustare preț (escaladare materiale - ISIC/PRODCOM index)
5. Costuri O&M post-garanție recomandate (€/MWp/an)
6. Analiza simplă: payback estimat la tarif PPA 55 €/MWh
7. Nota privind TVA, garanții bancare, asigurări CAR/EAR
Folosește tabele text bine structurate.` : ''}
${sectiune === 'Plan Execuție' ? `
Generează un plan de execuție detaliat pe ${form.duratExecutie} luni cu:
1. Faze principale și durată (Gantt descriptiv)
2. Jaloane (milestones) cheie cu date relative (Luna X)
3. Resurse necesare pe faze (echipe, utilaje)
4. Dependențe critice și drumul critic
5. Plan achiziții echipamente (lead time module 12-16 săpt)
6. Riscuri planning și mitigare
Structurează pe luni: L1-L2 Proiectare, L3-L6 Achiziții, L${Math.floor(parseInt(form.duratExecutie)*0.35)}-L${Math.floor(parseInt(form.duratExecutie)*0.8)} Execuție, L${Math.floor(parseInt(form.duratExecutie)*0.8)}-L${form.duratExecutie} Commissioning` : ''}
${sectiune === 'Clauze Contractuale' ? `
Generează clauze contractuale profesionale conforme dreptului român:
1. Definiții și interpretare
2. Obiectul contractului și obligațiile principale
3. Clauza de penalități (${form.penalitatiZi}%/zi, max ${form.penalitatiMax}% din valoare)
4. Clauza de garanție (${form.garantieInst} ani, remediere defecte < 72h)
5. Forță majoră (definire, notificare, consecințe)
6. Limitarea răspunderii
7. Proprietate intelectuală (drept IP, documentație as-built)
8. Confidențialitate și GDPR
9. Reziliere și consecințe
10. Legea aplicabilă: drept român, arbitraj CCIR București
Stil juridic profesional, referințe la Codul Civil 2024.` : ''}`;
  };

  const generateSection = async (sectiune: string): Promise<string> => {
    const prompt = buildPrompt(sectiune);
    // Primary: openrouter
    try {
      const res = await fetch('/api/ai/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: 'epc_tender_expert' }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content || data.text || data.response || '';
        if (text.length > 200) return text;
      }
    } catch (_) {}
    // Fallback: NVIDIA
    const result = await callNvidiaAI(form.modelAI as any, prompt, 'epc_tender_expert');
    return result || 'Eroare generare secțiune.';
  };

  const handleGenerate = async () => {
    if (!form.denumireProiect.trim() || !form.client.trim()) {
      setErr('Completați minim: Denumire Proiect și Client.');
      return;
    }
    setErr(null);
    setGenerating(true);
    setOutput(null);
    try {
      const [tehnic, financiar, plan, clauze] = await Promise.all([
        generateSection('Ofertă Tehnică'),
        generateSection('Financiar & Comercial'),
        generateSection('Plan Execuție'),
        generateSection('Clauze Contractuale'),
      ]);
      setOutput({ tehnic, financiar, plan, clauze });
      setOutputTab('tehnic');
    } catch (e) {
      setErr('Eroare generare ofertă. Verificați modelul AI selectat.');
    }
    setGenerating(false);
  };

  // ── PDF EXPORT ────────────────────────────────────────────────────────────
  const handlePDF = async () => {
    if (!output) return;
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = 210; const margin = 18;
      const textW = pageW - margin * 2;

      // Cover
      doc.setFillColor(2, 6, 23);
      doc.rect(0, 0, 210, 297, 'F');
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 0, 6, 297, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('OFERTĂ TEHNICO-COMERCIALĂ', margin, 60);
      doc.setFontSize(18);
      doc.setTextColor(245, 158, 11);
      doc.text('EPC — PARC FOTOVOLTAIC', margin, 75);
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Proiect: ${form.denumireProiect || 'Nedefinit'}`, margin, 95);
      doc.text(`Client: ${form.client || 'Confidențial'}`, margin, 103);
      doc.text(`Locație: ${form.localitate || ''}, Jud. ${form.judet}`, margin, 111);
      doc.text(`Putere: ${form.putere} MWp  |  Suprafață: ${form.suprafata} ha`, margin, 119);
      doc.text(`Tip Contract: ${form.tipContract}`, margin, 127);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(16);
      doc.text(`VALOARE OFERTATĂ: ${fmt(calcResult.total)} €`, margin, 145);
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text(`(${eurWpTotal.toFixed(3)} €/Wp  |  ${fmt(calcResult.total / 1_000_000, 2)} M€)`, margin, 154);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text(`Generat de HELIOS EPC Tender Engine  |  ${new Date().toLocaleDateString('ro-RO')}`, margin, 275);
      doc.text('Document confidențial — destinat exclusiv clientului indicat', margin, 281);

      const addSection = (title: string, content: string) => {
        doc.addPage();
        doc.setFillColor(2, 6, 23);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setFillColor(245, 158, 11);
        doc.rect(0, 0, 6, 297, 'F');
        doc.setTextColor(245, 158, 11);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(title, margin, 22);
        doc.setDrawColor(245, 158, 11, 0.3);
        doc.setLineWidth(0.3);
        doc.line(margin, 26, pageW - margin, 26);
        doc.setTextColor(210, 210, 210);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(content, textW);
        let y = 34;
        lines.forEach((line: string) => {
          if (y > 280) { doc.addPage(); doc.setFillColor(2, 6, 23); doc.rect(0, 0, 210, 297, 'F'); doc.setFillColor(245, 158, 11); doc.rect(0, 0, 6, 297, 'F'); y = 20; }
          doc.text(line, margin, y);
          y += 4.5;
        });
      };

      addSection('1. OFERTĂ TEHNICĂ', output.tehnic);
      addSection('2. FINANCIAR & COMERCIAL', output.financiar);
      addSection('3. PLAN DE EXECUȚIE', output.plan);
      addSection('4. CLAUZE CONTRACTUALE', output.clauze);

      doc.save(`Oferta_EPC_${(form.denumireProiect || 'Proiect').replace(/\s/g, '_')}_${form.putere}MWp.pdf`);
    } catch (e) {
      alert('Eroare PDF. Verificați că jspdf este instalat: npm i jspdf');
    }
  };

  const handleCopy = () => {
    if (!output) return;
    const txt = `OFERTĂ TEHNICO-COMERCIALĂ EPC\n${form.denumireProiect} — ${form.putere} MWp\nClient: ${form.client}\n\n--- TEHNIC ---\n${output.tehnic}\n\n--- FINANCIAR ---\n${output.financiar}\n\n--- PLAN EXECUȚIE ---\n${output.plan}\n\n--- CLAUZE ---\n${output.clauze}`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── RENDER STEPS ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── STEP 0: CLIENT & PROIECT ─────────────────────────────────────────
      case 0: return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <SectionHeader icon={<Building2 className="w-5 h-5" />} title="Date Client & Proiect" subtitle="Identificare proiect și beneficiar" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Denumire Proiect *" value={form.denumireProiect} onChange={v => upd('denumireProiect', v)} placeholder="ex: Parc FV Căzănești 9MW" icon={<FileSignature className="w-4 h-4" />} />
            <Field label="Client / Beneficiar *" value={form.client} onChange={v => upd('client', v)} placeholder="ex: WALDEVAR Energy SRL" icon={<Building2 className="w-4 h-4" />} />
            <Select label="Județ" value={form.judet} onChange={v => upd('judet', v)} options={JUDETE} icon={<MapPin className="w-4 h-4" />} />
            <Field label="Localitate" value={form.localitate} onChange={v => upd('localitate', v)} placeholder="ex: Căzănești" icon={<MapPin className="w-4 h-4" />} />
            <Field label="Putere Instalată (MWp)" value={form.putere} onChange={v => upd('putere', v)} type="number" placeholder="ex: 9" icon={<Zap className="w-4 h-4" />} mono />
            <Field label="Suprafață Teren (ha)" value={form.suprafata} onChange={v => upd('suprafata', v)} type="number" placeholder="ex: 15" icon={<MapPin className="w-4 h-4" />} mono />
          </div>
          <Select label="Tip Contract EPC" value={form.tipContract} onChange={v => upd('tipContract', v)} options={TIP_CONTRACT} />

          {/* Preview KPI rapid */}
          {putereNum > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 grid grid-cols-3 gap-4">
              <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Module estimate</p><p className="text-amber-400 font-mono text-lg font-bold">{numModules.toLocaleString()}</p><p className="text-slate-600 text-[10px]">buc ({form.putereModul}Wp)</p></div>
              <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">CAPEX estimat</p><p className="text-amber-400 font-mono text-lg font-bold">{fmt(calcResult.total / 1_000_000, 2)}M€</p><p className="text-slate-600 text-[10px]">{eurWpTotal.toFixed(3)} €/Wp</p></div>
              <div><p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Producție anuală</p><p className="text-emerald-400 font-mono text-lg font-bold">{fmt(putereNum * 1_300_000 / 1_000_000, 1)} GWh</p><p className="text-slate-600 text-[10px]">~1300 kWh/kWp</p></div>
            </div>
          )}
        </div>
      );

      // ── STEP 1: TEHNIC ───────────────────────────────────────────────────
      case 1: return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <SectionHeader icon={<Cpu className="w-5 h-5" />} title="Specificații Tehnice" subtitle="Echipamente principale și configurare sistem" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select label="Tip Panou Fotovoltaic" value={form.tipPanou} onChange={v => upd('tipPanou', v)} options={TIP_PANOU} />
            <Field label="Putere Modul (Wp)" value={form.putereModul} onChange={v => upd('putereModul', v)} type="number" placeholder="665" mono />
            <Select label="Tip Invertor" value={form.tipInvertor} onChange={v => upd('tipInvertor', v)} options={TIP_INVERTOR} />
            <Select label="Sistem de Tracking" value={form.tracker} onChange={v => upd('tracker', v)} options={TIP_TRACKER} />
            <Select label="Racordare la Rețea" value={form.racordare} onChange={v => upd('racordare', v)} options={TIP_RACORDARE} />
            <Field label="Lungime LEA / cablu (km)" value={form.lungimeLeA} onChange={v => upd('lungimeLeA', v)} type="number" placeholder="2" mono />
          </div>

          {/* Toggle BESS și FPV */}
          <div className="grid grid-cols-2 gap-4">
            {(['bess', 'fpv'] as const).map((key, i) => (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {key === 'bess' ? '🔋 Stocare BESS' : '🌊 Floating PV (FPV)'}
                </p>
                <div className="flex gap-2">
                  {['Da', 'Nu'].map(opt => (
                    <button key={opt} onClick={() => upd(key, opt)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border
                        ${form[key] === opt ? (opt === 'Da' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-700 border-slate-600 text-white')
                          : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                {key === 'bess' && form.bess === 'Da' && (
                  <p className="text-[10px] text-amber-400 mt-2 font-mono">+{fmt(putereNum * 120_000)} € (1h storage)</p>
                )}
              </div>
            ))}
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Estimare sistem</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div><p className="text-slate-500 text-[10px]">Module</p><p className="text-white font-mono font-bold">{numModules.toLocaleString()} buc</p></div>
              <div><p className="text-slate-500 text-[10px]">Rânduri estimat</p><p className="text-white font-mono font-bold">{Math.round(numModules / 30).toLocaleString()}</p></div>
              <div><p className="text-slate-500 text-[10px]">Suprafață panouri</p><p className="text-white font-mono font-bold">{fmt(numModules * 2.8 / 10_000, 1)} ha</p></div>
              <div><p className="text-slate-500 text-[10px]">Bonus tracker</p><p className="text-emerald-400 font-mono font-bold">{form.tracker.includes('Single') ? '+18%' : form.tracker.includes('Dual') ? '+26%' : '—'}</p></div>
            </div>
          </div>
        </div>
      );

      // ── STEP 2: CAPEX ────────────────────────────────────────────────────
      case 2: return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <SectionHeader icon={<Euro className="w-5 h-5" />} title="Structură CAPEX" subtitle="Editați prețurile unitare — totalurile se calculează automat" />

          {/* Tabel CAPEX editabil */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-slate-700">
              <div className="col-span-1"></div>
              <div className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categorie</div>
              <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">€/Wp</div>
              <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Total €</div>
              <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">%</div>
            </div>
            {capexLinii.map((linie, idx) => {
              const total = linie.eurWp * putereNum * 1_000_000;
              const pct = calcResult.subTotal > 0 ? (total / calcResult.subTotal * 100) : 0;
              return (
                <div key={linie.id} className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-slate-800/60 transition-all
                  ${!linie.activ ? 'opacity-40' : 'hover:bg-slate-800/30'}`}>
                  <div className="col-span-1">
                    <input type="checkbox" checked={linie.activ !== false} onChange={e => setCapexLinii(prev => prev.map((l, i) => i === idx ? { ...l, activ: e.target.checked } : l))}
                      className="w-3.5 h-3.5 accent-amber-500 cursor-pointer" />
                  </div>
                  <div className="col-span-5 flex items-center gap-2">
                    <span className="text-base">{linie.icon}</span>
                    <span className="text-slate-200 text-xs">{linie.label}</span>
                  </div>
                  <div className="col-span-2">
                    <input type="number" value={linie.eurWp} step="0.001"
                      onChange={e => setCapexLinii(prev => prev.map((l, i) => i === idx ? { ...l, eurWp: parseFloat(e.target.value) || 0 } : l))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-amber-400 text-right focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div className="col-span-2 text-right text-xs font-mono text-slate-200">{linie.activ !== false ? fmt(total) : '—'}</div>
                  <div className="col-span-2 text-right text-xs font-mono text-slate-500">{linie.activ !== false ? pct.toFixed(1) + '%' : '—'}</div>
                </div>
              );
            })}
            {/* BESS row dacă activ */}
            {form.bess === 'Da' && (
              <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-slate-800/60 bg-red-950/10">
                <div className="col-span-1"></div>
                <div className="col-span-5 flex items-center gap-2"><span className="text-base">🔋</span><span className="text-slate-200 text-xs">BESS Stocare (1h)</span></div>
                <div className="col-span-2 text-right text-xs font-mono text-slate-500">0.120</div>
                <div className="col-span-2 text-right text-xs font-mono text-slate-200">{fmt(putereNum * 120_000)}</div>
                <div className="col-span-2 text-right text-xs font-mono text-slate-500">—</div>
              </div>
            )}
            {/* Contingency */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-amber-500/20 bg-amber-500/5">
              <div className="col-span-1"></div>
              <div className="col-span-5 text-slate-300 text-xs font-bold">⚠️ Contingency</div>
              <div className="col-span-2"><input type="number" value={form.contingency} onChange={e => upd('contingency', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-amber-400 text-right focus:border-amber-500 focus:outline-none" /></div>
              <div className="col-span-2 text-right text-xs font-mono text-slate-200">{fmt(calcResult.cont)}</div>
              <div className="col-span-2 text-right text-xs font-mono text-amber-400">{form.contingency}%</div>
            </div>
          </div>

          {/* Marjă / Overhead / Risc */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'marja', label: 'Marjă profit (%)', val: form.marja, total: calcResult.marjaVal },
              { key: 'overhead', label: 'Overhead G&A (%)', val: form.overhead, total: calcResult.ohVal },
              { key: 'risc', label: 'Risc comercial (%)', val: form.risc, total: calcResult.riscVal },
            ].map(({ key, label, val, total }) => (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">{label}</label>
                <input type="number" value={val} onChange={e => upd(key as keyof TenderForm, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-amber-400 text-center focus:border-amber-500 focus:outline-none" />
                <p className="text-slate-600 text-[10px] font-mono text-center mt-1">+{fmt(total)} €</p>
              </div>
            ))}
          </div>

          {/* Total box */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">PREȚ TOTAL OFERTAT</p>
              <p className="text-4xl font-black text-amber-400 font-mono">{fmt(calcResult.total)} <span className="text-2xl">€</span></p>
              <p className="text-slate-500 text-sm font-mono mt-1">{eurWpTotal.toFixed(3)} €/Wp · {fmt(calcResult.total / 1_000_000, 3)} M€</p>
            </div>
            <div className="w-full md:w-48 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${fmt(v)} €`} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 10 }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );

      // ── STEP 3: CONTRACT ─────────────────────────────────────────────────
      case 3: return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <SectionHeader icon={<Scale className="w-5 h-5" />} title="Condiții Contractuale" subtitle="Termene, garanții și jaloane de plată" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Durată execuție (luni)" value={form.duratExecutie} onChange={v => upd('duratExecutie', v)} type="number" placeholder="12" icon={<Calendar className="w-4 h-4" />} mono />
            <Field label="Garanție instalație (ani)" value={form.garantieInst} onChange={v => upd('garantieInst', v)} type="number" placeholder="5" icon={<Shield className="w-4 h-4" />} mono />
            <Field label="Penalități zilnice (%/zi)" value={form.penalitatiZi} onChange={v => upd('penalitatiZi', v)} type="number" placeholder="0.05" mono />
            <Field label="Penalități maxime (% din valoare)" value={form.penalitatiMax} onChange={v => upd('penalitatiMax', v)} type="number" placeholder="10" mono />
            <Field label="Avans solicitat (%)" value={form.avans} onChange={v => upd('avans', v)} type="number" placeholder="20" mono />
            <Field label="Garanție bună execuție (%)" value={form.garantieExec} onChange={v => upd('garantieExec', v)} type="number" placeholder="10" mono />
            <Field label="Reținere garanție (%)" value={form.retinere} onChange={v => upd('retinere', v)} type="number" placeholder="5" mono />
          </div>

          {/* Jaloane plată */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Jaloane de Plată</p>
            <div className="space-y-2">
              {jaloane.map((j, idx) => (
                <div key={j.id} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">{idx + 1}</div>
                  <div className="flex-1 text-slate-200 text-sm">{j.label}</div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={j.pct} onChange={e => setJaloane(prev => prev.map((jj, i) => i === idx ? { ...jj, pct: parseInt(e.target.value) || 0 } : jj))}
                      className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm font-mono text-amber-400 text-center focus:border-amber-500 focus:outline-none" />
                    <span className="text-slate-500 text-sm">%</span>
                    <span className="text-slate-500 font-mono text-xs w-28 text-right">{fmt(calcResult.total * j.pct / 100)} €</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between px-3">
                <span className="text-[10px] text-slate-500">Total jaloane</span>
                <span className={`text-[10px] font-mono font-bold ${jaloane.reduce((a, j) => a + j.pct, 0) === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {jaloane.reduce((a, j) => a + j.pct, 0)}% {jaloane.reduce((a, j) => a + j.pct, 0) !== 100 && '⚠️ trebuie 100%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      );

      // ── STEP 4: GENERARE ─────────────────────────────────────────────────
      case 4: return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <SectionHeader icon={<Zap className="w-5 h-5" />} title="Generare Ofertă AI" subtitle="Selectați modelul și adăugați note speciale" />

          {/* Model AI selector */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Model AI</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {MODELE_AI.map(m => (
                <button key={m.value} onClick={() => upd('modelAI', m.value)}
                  className={`p-3 rounded-xl border text-left transition-all
                    ${form.modelAI === m.value ? 'bg-amber-500/15 border-amber-500/50 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                  <p className="font-bold text-sm">{m.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-70">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Note / Instrucțiuni Adiționale</label>
            <textarea value={form.noteAdditionale} onChange={e => upd('noteAdditionale', e.target.value)}
              placeholder="ex: Includeți clauze speciale pentru finanțare PTJ, referite la standardul IEC 62548..."
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 focus:outline-none resize-none placeholder:text-slate-600" />
          </div>

          {/* Sumar complet */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sumar Ofertă</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {[
                ['Proiect', form.denumireProiect || '—'],
                ['Client', form.client || '—'],
                ['Locație', `${form.localitate || '—'}, ${form.judet}`],
                ['Putere', `${form.putere} MWp`],
                ['Contract', form.tipContract.split(' ')[0]],
                ['Module', `${numModules.toLocaleString()} buc`],
                ['Tracker', form.tracker.split(' ')[0]],
                ['BESS', form.bess],
                ['Durată', `${form.duratExecutie} luni`],
                ['Valoare', `${fmt(calcResult.total)} €`],
                ['€/Wp', `${eurWpTotal.toFixed(3)} €/Wp`],
                ['Marjă', `${form.marja}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-500 text-xs">{k}</span>
                  <span className="text-white font-mono text-xs font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 bg-red-950/30 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {err}
            </div>
          )}

          <button onClick={handleGenerate} disabled={generating}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-lg py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3">
            {generating ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Generez oferta (4 secțiuni)...</>
            ) : (
              <><FileSignature className="w-6 h-6" /> GENEREAZĂ OFERTĂ COMPLETĂ</>
            )}
          </button>

          {/* OUTPUT */}
          {output && (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Tab bar */}
              <div className="flex border-b border-slate-800 bg-slate-900/80">
                {([
                  { id: 'tehnic', label: 'Ofertă Tehnică', icon: <Wrench className="w-3.5 h-3.5" /> },
                  { id: 'financiar', label: 'Financiar', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                  { id: 'plan', label: 'Plan Execuție', icon: <Calendar className="w-3.5 h-3.5" /> },
                  { id: 'clauze', label: 'Clauze', icon: <Scale className="w-3.5 h-3.5" /> },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setOutputTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap
                      ${outputTab === t.id ? 'text-amber-400 border-amber-500 bg-amber-500/5' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              {/* Content */}
              <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-mono text-[12px]">
                  {output[outputTab]}
                </div>
              </div>
              {/* Actions */}
              <div className="border-t border-slate-800 p-4 flex gap-3 bg-slate-900/60">
                <button onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-all">
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiat!' : 'Copiază tot'}
                </button>
                <button onClick={handlePDF}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-all">
                  <Printer className="w-4 h-4" /> Export PDF
                </button>
                <div className="flex-1"></div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-950/30 border border-emerald-500/20 px-3 py-1 rounded-lg">
                  <CheckCircle className="w-3 h-3" /> Generat cu {MODELE_AI.find(m => m.value === form.modelAI)?.label}
                </div>
              </div>
            </div>
          )}
        </div>
      );

      default: return null;
    }
  };

  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#020617] text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <FileSignature className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-black text-white">EPC TENDER ENGINE</h1>
                <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">MOD-02</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">LIVE</span>
              </div>
              <p className="text-slate-400 text-xs">Generare automată oferte tehnico-comerciale EPC solare</p>
            </div>
          </div>
          {putereNum > 0 && (
            <div className="hidden md:flex items-center gap-4 bg-slate-800/50 rounded-xl px-4 py-2.5 border border-slate-700">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Valoare</p>
                <p className="text-amber-400 font-mono font-black text-lg">{fmt(calcResult.total / 1_000_000, 2)}M€</p>
              </div>
              <div className="w-px h-8 bg-slate-700"></div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase">€/Wp</p>
                <p className="text-white font-mono font-bold text-lg">{eurWpTotal.toFixed(3)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <StepIndicator current={step} />
        {renderStep()}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm">
            <ChevronLeft className="w-4 h-4" /> Înapoi
          </button>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} onClick={() => setStep(i)} className={`w-2 h-2 rounded-full cursor-pointer transition-all
                ${i === step ? 'bg-amber-500 w-6' : i < step ? 'bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600'}`} />
            ))}
          </div>
          {step < 4 ? (
            <button onClick={() => setStep(s => Math.min(4, s + 1))}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition-all text-sm">
              Continuă <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-24"></div>
          )}
        </div>
      </div>
    </div>
  );
};
