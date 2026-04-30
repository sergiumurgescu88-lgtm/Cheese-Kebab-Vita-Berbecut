import React, { useState, useEffect } from 'react';

interface TeamMember { initials: string; name: string; role: string; phase: string; color: string; }
interface Alert { type: 'danger' | 'warn' | 'info'; text: string; }
interface BudgetRow { name: string; plan: string; actual: string; diff: string; diffType: 'pos' | 'neg' | 'pend'; pct: number; }
interface Phase { label: string; start: number; end: number; color: string; done: boolean; }
interface Milestone { month: number; label: string; }
interface Project {
  id: number; name: string; mw: number; county: string; ptj: string; tech: string;
  status: 'active' | 'hold' | 'fin'; progress: number;
  capex: string; irr: string; npv: string; payback: string; grant: string;
  irrRaw: number; alerts: Alert[]; team: TeamMember[];
  phases: Phase[]; milestones: Milestone[]; budget: BudgetRow[];
  budgetTotal: { plan: string; actual: string; diff: string; diffType: 'pos' | 'neg' | 'pend' };
}

const PROJECTS: Project[] = [
  {
    id: 1, name: 'Căzănești', mw: 9, county: 'Olt', ptj: 'Gorj 24%', tech: 'String invertor',
    status: 'active', progress: 72, capex: '€4.2M', irr: '14.8%', npv: '€1.1M', payback: '7.2 ani', grant: '€1.01M', irrRaw: 14.8,
    phases: [
      { label: 'Permise & avize', start: 0, end: 3, color: '#10b981', done: true },
      { label: 'Proiectare tehnică', start: 1, end: 5, color: '#60a5fa', done: true },
      { label: 'Achiziție echip.', start: 2, end: 6, color: '#a78bfa', done: false },
      { label: 'Construcție civilă', start: 3, end: 8, color: '#f59e0b', done: false },
      { label: 'Punere funcțiune', start: 7, end: 9, color: '#10b981', done: false },
    ],
    milestones: [{ month: 3, label: 'Aviz ISC' }, { month: 5, label: 'Livrare panouri' }, { month: 9, label: 'CoU' }],
    budget: [
      { name: 'Panouri solare 15MW TOPCon', plan: '€1.62M', actual: '€1.58M', diff: '-€40k', diffType: 'pos', pct: 98 },
      { name: 'Invertoare SMA Tripower X', plan: '€380k', actual: '€412k', diff: '+€32k', diffType: 'neg', pct: 108 },
      { name: 'Structuri metalice + montaj', plan: '€890k', actual: '—', diff: 'în curs', diffType: 'pend', pct: 0 },
      { name: 'Racordare MEA + transformator', plan: '€620k', actual: '—', diff: 'planificat', diffType: 'pend', pct: 0 },
    ],
    budgetTotal: { plan: '€4.2M', actual: '€1.99M', diff: '-€8k vs plan', diffType: 'pos' },
    alerts: [
      { type: 'danger', text: "Aviz ISC în așteptare — risc depășire deadline Aug '25" },
      { type: 'warn', text: 'Livrare invertoare SMA întârziată 3 săptămâni (furnizor DE)' },
      { type: 'info', text: "Grant PTJ Gorj: dosar complet, aprobare estimată Mai '25" },
    ],
    team: [
      { initials: 'IM', name: 'Ion Marin', role: 'Project Manager EPC', phase: 'Construcție', color: '#f59e0b' },
      { initials: 'AP', name: 'Ana Popa', role: 'Inginer proiectant', phase: 'Proiectare', color: '#60a5fa' },
      { initials: 'RD', name: 'Radu Dumitrescu', role: 'Responsabil permise', phase: 'Avize ISC', color: '#10b981' },
    ],
  },
  {
    id: 2, name: 'Drăgășani', mw: 15, county: 'Vâlcea', ptj: 'Vâlcea 18%', tech: 'Central invertor',
    status: 'active', progress: 45, capex: '€7.1M', irr: '13.9%', npv: '€2.4M', payback: '7.8 ani', grant: '€1.28M', irrRaw: 13.9,
    phases: [
      { label: 'Permise & avize', start: 0, end: 4, color: '#10b981', done: true },
      { label: 'Proiectare tehnică', start: 2, end: 6, color: '#60a5fa', done: false },
      { label: 'Achiziție echip.', start: 4, end: 7, color: '#a78bfa', done: false },
      { label: 'Construcție civilă', start: 6, end: 10, color: '#f59e0b', done: false },
      { label: 'Punere funcțiune', start: 9, end: 11, color: '#10b981', done: false },
    ],
    milestones: [{ month: 4, label: 'Autorizație AC' }, { month: 7, label: 'Livrare inv.' }, { month: 11, label: 'CoU' }],
    budget: [
      { name: 'Panouri bifaciale 550W (1460 buc)', plan: '€2.81M', actual: '€2.78M', diff: '-€30k', diffType: 'pos', pct: 99 },
      { name: 'Invertoare ABB PVS-100', plan: '€640k', actual: '—', diff: 'comandă plasată', diffType: 'pend', pct: 0 },
      { name: 'Structuri + montaj', plan: '€1.42M', actual: '—', diff: 'planificat', diffType: 'pend', pct: 0 },
      { name: 'Racordare Distribuție Oltenia', plan: '€980k', actual: '—', diff: 'planificat', diffType: 'pend', pct: 0 },
    ],
    budgetTotal: { plan: '€7.1M', actual: '€2.78M', diff: '-€30k vs plan', diffType: 'pos' },
    alerts: [
      { type: 'warn', text: 'Autorizație construire în avizare CJ Vâlcea — estimat 6 săpt.' },
      { type: 'info', text: 'Grant PTJ Vâlcea: scoring preliminar 87/100 — aprobare probabilă' },
    ],
    team: [
      { initials: 'MM', name: 'Maria Mihai', role: 'Project Manager', phase: 'Avizare', color: '#a78bfa' },
      { initials: 'CV', name: 'Cosmin Voicu', role: 'Inginer rețele', phase: 'Racordare', color: '#60a5fa' },
      { initials: 'SB', name: 'Sorin Badea', role: 'Coordonator EPC', phase: 'Construcție', color: '#f59e0b' },
    ],
  },
  {
    id: 3, name: 'Turnu Măgurele', mw: 24, county: 'Teleorman', ptj: 'Teleorman 21%', tech: 'Central + BESS',
    status: 'active', progress: 28, capex: '€11.8M', irr: '15.2%', npv: '€4.1M', payback: '6.9 ani', grant: '€2.48M', irrRaw: 15.2,
    phases: [
      { label: 'Permise & avize', start: 0, end: 5, color: '#10b981', done: false },
      { label: 'Proiectare tehnică', start: 3, end: 7, color: '#60a5fa', done: false },
      { label: 'Achiziție echip.', start: 5, end: 9, color: '#a78bfa', done: false },
      { label: 'Construcție civilă', start: 8, end: 12, color: '#f59e0b', done: false },
      { label: 'Punere funcțiune', start: 11, end: 13, color: '#10b981', done: false },
    ],
    milestones: [{ month: 5, label: 'Aviz Transelectrica' }, { month: 9, label: 'Livrare BESS' }, { month: 13, label: 'CoU' }],
    budget: [
      { name: 'Panouri TOPCon 600W (5600 buc)', plan: '€4.2M', actual: '—', diff: 'planificat', diffType: 'pend', pct: 0 },
      { name: 'BESS 4MWh CATL', plan: '€2.1M', actual: '—', diff: 'negociere', diffType: 'pend', pct: 0 },
      { name: 'Invertoare Huawei SUN2000', plan: '€1.05M', actual: '—', diff: 'planificat', diffType: 'pend', pct: 0 },
      { name: 'Structuri + montaj + civil', plan: '€2.4M', actual: '—', diff: 'planificat', diffType: 'pend', pct: 0 },
    ],
    budgetTotal: { plan: '€11.8M', actual: '—', diff: 'faza avizare', diffType: 'pend' },
    alerts: [
      { type: 'danger', text: 'Aviz Transelectrica — studiu rețea solicitat, durată estimată 4 luni' },
      { type: 'warn', text: 'BESS CATL — lead time 14 luni, comandă urgentă recomandată' },
      { type: 'info', text: 'Grant PTJ Teleorman: fereastră depunere deschisă 15 Iun 2025' },
    ],
    team: [
      { initials: 'DI', name: 'Dan Ionescu', role: 'Director proiect', phase: 'Avizare', color: '#f59e0b' },
      { initials: 'LP', name: 'Laura Pop', role: 'Specialist BESS', phase: 'Proiectare', color: '#a78bfa' },
      { initials: 'AG', name: 'Alexandru Gheorghe', role: 'Ing. conectare rețea', phase: 'Transelectrica', color: '#60a5fa' },
    ],
  },
  {
    id: 4, name: 'Balș', mw: 6, county: 'Olt', ptj: 'Gorj 24%', tech: 'String invertor',
    status: 'hold', progress: 15, capex: '€2.9M', irr: '12.1%', npv: '€0.6M', payback: '8.4 ani', grant: '€0.70M', irrRaw: 12.1,
    phases: [
      { label: 'Permise & avize', start: 0, end: 3, color: '#10b981', done: true },
      { label: 'Proiectare tehnică', start: 2, end: 6, color: '#60a5fa', done: false },
      { label: 'Achiziție echip.', start: 5, end: 8, color: '#a78bfa', done: false },
      { label: 'Construcție civilă', start: 7, end: 10, color: '#ef4444', done: false },
      { label: 'Punere funcțiune', start: 9, end: 11, color: '#10b981', done: false },
    ],
    milestones: [{ month: 3, label: 'Aviz ISC' }, { month: 11, label: 'CoU' }],
    budget: [
      { name: 'Panouri 400W (2200 buc)', plan: '€0.88M', actual: '—', diff: 'blocat', diffType: 'pend', pct: 0 },
      { name: 'Invertoare Fronius Symo', plan: '€210k', actual: '—', diff: 'blocat', diffType: 'pend', pct: 0 },
      { name: 'Structuri + montaj', plan: '€580k', actual: '—', diff: 'blocat', diffType: 'pend', pct: 0 },
      { name: 'Racordare E-Distributie', plan: '€420k', actual: '—', diff: 'blocat', diffType: 'pend', pct: 0 },
    ],
    budgetTotal: { plan: '€2.9M', actual: '—', diff: 'proiect blocat', diffType: 'pend' },
    alerts: [
      { type: 'danger', text: 'BLOCAT: Litigiu teren — proces în instanță, termen Oct 2025' },
      { type: 'danger', text: 'Autorizație construire suspendată până la rezolvarea litigiului' },
      { type: 'info', text: 'Echipa juridică a depus contestație — estimat soluționare Q3 2025' },
    ],
    team: [
      { initials: 'VN', name: 'Victor Nicu', role: 'Project Manager', phase: 'Suspendat', color: '#ef4444' },
      { initials: 'CJ', name: 'Cabinet Juridic', role: 'Reprezentant legal', phase: 'Litigiu', color: '#a78bfa' },
    ],
  },
  {
    id: 5, name: 'Caracal', mw: 18, county: 'Olt', ptj: 'Olt 22%', tech: 'Central invertor',
    status: 'active', progress: 88, capex: '€8.6M', irr: '16.1%', npv: '€3.2M', payback: '6.5 ani', grant: '€1.89M', irrRaw: 16.1,
    phases: [
      { label: 'Permise & avize', start: 0, end: 2, color: '#10b981', done: true },
      { label: 'Proiectare tehnică', start: 1, end: 4, color: '#60a5fa', done: true },
      { label: 'Achiziție echip.', start: 3, end: 6, color: '#a78bfa', done: true },
      { label: 'Construcție civilă', start: 5, end: 9, color: '#10b981', done: true },
      { label: 'Punere funcțiune', start: 8, end: 10, color: '#f59e0b', done: false },
    ],
    milestones: [{ month: 2, label: 'AC obținut' }, { month: 6, label: 'Livrare echip.' }, { month: 10, label: 'CoU' }],
    budget: [
      { name: 'Panouri bifaciale 580W (4500 buc)', plan: '€3.24M', actual: '€3.21M', diff: '-€30k', diffType: 'pos', pct: 99 },
      { name: 'Invertoare ABB TRIO 50kW', plan: '€760k', actual: '€748k', diff: '-€12k', diffType: 'pos', pct: 98 },
      { name: 'Structuri metalice + montaj', plan: '€1.68M', actual: '€1.72M', diff: '+€40k', diffType: 'neg', pct: 102 },
      { name: 'Racordare E-Distributie + transf.', plan: '€1.12M', actual: '€1.09M', diff: '-€30k', diffType: 'pos', pct: 97 },
    ],
    budgetTotal: { plan: '€8.6M', actual: '€7.77M', diff: '-€32k vs plan', diffType: 'pos' },
    alerts: [
      { type: 'info', text: 'Punere în funcțiune programată: 15 Aug 2025 — pe track' },
      { type: 'warn', text: 'Inspecție ANRE programată 28 Iul — pregătire documentație necesară' },
    ],
    team: [
      { initials: 'GF', name: 'Gheorghe Florescu', role: 'Director EPC', phase: 'Punere funcțiune', color: '#f59e0b' },
      { initials: 'MT', name: 'Mihaela Tudor', role: 'Inginer instalații', phase: 'Testare', color: '#10b981' },
      { initials: 'PI', name: 'Pavel Ionescu', role: 'Responsabil ANRE', phase: 'Autorizare', color: '#60a5fa' },
    ],
  },
];

const MONTHS = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TOTAL_MONTHS = 10;
const TODAY_MONTH = 4;

const progressColor = (p: number, status: string) => {
  if (status === 'hold') return 'bg-red-500';
  if (p >= 80) return 'bg-emerald-500';
  if (p >= 50) return 'bg-amber-500';
  return 'bg-blue-400';
};

const progressTextColor = (p: number, status: string) => {
  if (status === 'hold') return 'text-red-400';
  if (p >= 80) return 'text-emerald-400';
  if (p >= 50) return 'text-amber-400';
  return 'text-blue-400';
};

export const ProjectCMDCenter: React.FC = () => {
  const [selectedId, setSelectedId] = useState<number>(1);
  const [time, setTime] = useState(new Date());
  const selected = PROJECTS.find((p) => p.id === selectedId)!;
  const totalMW = PROJECTS.reduce((s, p) => s + p.mw, 0);
  const totalDanger = PROJECTS.reduce((s, p) => s + p.alerts.filter((a) => a.type === 'danger').length, 0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#020617] overflow-hidden">

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 h-11 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 6px #10b981' }} />
          <span className="font-mono text-amber-400 font-semibold text-sm tracking-widest">PROJECT CMD CENTER</span>
          <span className="text-slate-500 text-xs">— Helios by Sergiu Energy Portfolio</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-500 text-xs">
            {time.toLocaleTimeString('ro-RO')} — {time.toLocaleDateString('ro-RO')}
          </span>
          <button className="px-3 py-1 text-xs border border-slate-700 text-slate-400 rounded hover:border-amber-500 hover:text-amber-400 transition-colors">Filtre</button>
          <button className="px-3 py-1 text-xs border border-slate-700 text-slate-400 rounded hover:border-amber-500 hover:text-amber-400 transition-colors">Export PDF</button>
          <button className="px-3 py-1 text-xs bg-amber-500 text-black font-semibold rounded hover:bg-amber-400 transition-colors">+ Proiect Nou</button>
        </div>
      </div>

      {/* KPI BAR */}
      <div className="grid grid-cols-5 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        {[
          { val: `${totalMW} MW`, lbl: 'Portofoliu Total', cls: 'text-amber-400', bg: '' },
          { val: '5 Active', lbl: 'Proiecte în derulare', cls: 'text-emerald-400', bg: '' },
          { val: '€34.6M', lbl: 'CAPEX Total', cls: 'text-blue-400', bg: '' },
          { val: '14.4%', lbl: 'IRR Mediu Portofoliu', cls: 'text-emerald-400', bg: '' },
          { val: `⚠ ${totalDanger} Alerte`, lbl: 'Acțiuni necesare', cls: 'text-red-400', bg: 'bg-red-500/5' },
        ].map((k, i) => (
          <div key={i} className={`flex flex-col items-center justify-center py-3 border-r border-slate-800 last:border-r-0 ${k.bg}`}>
            <div className={`font-mono text-base font-semibold ${k.cls}`}>{k.val}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* LEFT — Project List */}
        <div className="w-80 flex-shrink-0 border-r border-slate-800 flex flex-col overflow-hidden bg-slate-900/50">
          <div className="px-3 py-2 border-b border-slate-800 bg-slate-900 flex justify-between items-center flex-shrink-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Proiecte</span>
            <span className="text-[10px] text-slate-600 cursor-pointer hover:text-slate-400 transition-colors">deadline ↑</span>
          </div>
          <div className="overflow-y-auto flex-1">
            {PROJECTS.map((p) => {
              const isSel = p.id === selectedId;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`px-3 py-3 border-b border-slate-800 cursor-pointer transition-colors border-l-2 ${
                    isSel ? 'bg-slate-800 border-l-amber-500' : 'border-l-transparent hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100">{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">{p.mw}MW</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.county} · PTJ {p.ptj}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 font-medium ${
                      p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      p.status === 'hold' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      {p.status === 'active' ? 'Activ' : p.status === 'hold' ? 'Blocat' : 'Finalizat'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-slate-600">Progres EPC</span>
                      <span className={`font-mono text-[10px] font-semibold ${progressTextColor(p.progress, p.status)}`}>{p.progress}%</span>
                    </div>
                    <div className="h-1 bg-slate-700 rounded overflow-hidden">
                      <div className={`h-full rounded transition-all ${progressColor(p.progress, p.status)}`} style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[11px] text-slate-500">CAPEX <span className="font-mono font-semibold text-amber-400">{p.capex}</span></span>
                    <span className="text-[11px] text-slate-500">IRR <span className="font-mono font-semibold text-emerald-400">{p.irr}</span></span>
                    <span className="text-[11px] text-slate-500">Grant <span className="font-mono font-semibold text-blue-400">{p.grant}</span></span>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {['Gantt', 'SF', 'Financiar', 'Documente', 'Echipă'].map((a) => (
                      <button key={a} onClick={(e) => e.stopPropagation()} className="text-[10px] px-2 py-0.5 border border-slate-700 text-slate-500 rounded hover:border-amber-500 hover:text-amber-400 transition-colors">
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Detail Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#020617]">

          {/* Detail Header */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900 flex justify-between items-start flex-shrink-0">
            <div>
              <div className="text-sm font-semibold text-slate-100">{selected.name} — {selected.mw}MW · {selected.county}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {selected.tech} · PTJ {selected.ptj} ·{' '}
                <span className={selected.status === 'active' ? 'text-emerald-400' : selected.status === 'hold' ? 'text-red-400' : 'text-blue-400'}>
                  ● {selected.status === 'active' ? 'Activ' : selected.status === 'hold' ? 'Blocat' : 'Finalizat'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs border border-slate-700 text-slate-400 rounded hover:border-amber-500 hover:text-amber-400 transition-colors">Editează</button>
              <button className="px-3 py-1 text-xs border border-slate-700 text-slate-400 rounded hover:border-amber-500 hover:text-amber-400 transition-colors">Export</button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-800">
              {[
                { lbl: 'CAPEX Total', val: selected.capex, sub: 'buget aprobat', topCls: 'bg-amber-500', valCls: 'text-amber-400', extra: null },
                { lbl: 'IRR Proiectat', val: selected.irr, sub: `+${(selected.irrRaw - 12).toFixed(1)}% vs benchmark`, topCls: 'bg-emerald-500', valCls: 'text-emerald-400', extra: null },
                { lbl: 'NPV (20 ani)', val: selected.npv, sub: 'la actualizare 8%', topCls: 'bg-blue-400', valCls: 'text-blue-400', extra: null },
                { lbl: 'Perioadă Recuperare', val: selected.payback, sub: 'din punere funcțiune', topCls: 'bg-purple-400', valCls: 'text-purple-400', extra: null },
                { lbl: 'Grant PTJ Aprobat', val: selected.grant, sub: 'nerambursabil', topCls: 'bg-amber-500', valCls: 'text-amber-400', extra: null },
                { lbl: 'Progres EPC', val: `${selected.progress}%`, sub: '', topCls: selected.progress >= 80 ? 'bg-emerald-500' : selected.progress >= 50 ? 'bg-amber-500' : 'bg-blue-400', valCls: progressTextColor(selected.progress, selected.status), extra: 'bar' },
              ].map((k, i) => (
                <div key={i} className="bg-slate-900 rounded-lg border border-slate-800 p-3 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${k.topCls}`} />
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{k.lbl}</div>
                  <div className={`font-mono text-base font-semibold mt-1 ${k.valCls}`}>{k.val}</div>
                  {k.extra === 'bar' ? (
                    <div className="mt-2 h-1 bg-slate-700 rounded overflow-hidden">
                      <div className={`h-full rounded ${progressColor(selected.progress, selected.status)}`} style={{ width: `${selected.progress}%` }} />
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-600 mt-1">{k.sub}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Gantt */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Gantt EPC — 2025</span>
                <span className="text-[10px] text-slate-600">faze fixe + milestone-uri editabile</span>
              </div>
              <div className="flex gap-1 mb-2 pl-24">
                {MONTHS.slice(0, TOTAL_MONTHS).map((m, i) => (
                  <div key={i} className="flex-1 text-[9px] text-slate-600 text-center font-mono">{m}</div>
                ))}
              </div>
              {selected.phases.map((ph, pi) => (
                <div key={pi} className="flex items-center gap-2 mb-1.5">
                  <div className="w-24 text-[10px] text-slate-500 text-right flex-shrink-0 leading-tight">{ph.label}</div>
                  <div className="flex-1 h-4 bg-slate-800 rounded relative border border-slate-700 overflow-visible">
                    <div
                      className="h-full rounded absolute"
                      style={{
                        left: `${(ph.start / TOTAL_MONTHS) * 100}%`,
                        width: `${((ph.end - ph.start) / TOTAL_MONTHS) * 100}%`,
                        background: ph.color,
                        opacity: ph.done ? 0.7 : 0.9,
                      }}
                    />
                    <div className="absolute top-0 bottom-0 w-px bg-amber-500/40 z-10" style={{ left: `${(TODAY_MONTH / TOTAL_MONTHS) * 100}%` }} />
                    {selected.milestones
                      .filter((m) => m.month >= ph.start && m.month <= ph.end)
                      .map((m, mi) => (
                        <div
                          key={mi}
                          title={m.label}
                          className="absolute w-2.5 h-2.5 bg-amber-400 z-20 cursor-pointer hover:scale-125 transition-transform"
                          style={{ left: `calc(${(m.month / TOTAL_MONTHS) * 100}% - 5px)`, top: '-3px', transform: 'rotate(45deg)', borderRadius: '1px' }}
                        />
                      ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-4 mt-3 flex-wrap">
                {[{ c: '#10b981', l: 'Finalizat' }, { c: '#f59e0b', l: 'În derulare' }, { c: '#60a5fa', l: 'Planificat' }].map((g, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="inline-block w-3 h-0.5 rounded" style={{ background: g.c }} />{g.l}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 text-[10px] text-amber-400">
                  <span className="inline-block w-2.5 h-2.5 bg-amber-400" style={{ transform: 'rotate(45deg)', borderRadius: '1px' }} />Milestone
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="inline-block w-px h-3 bg-amber-500/50" />Azi (Mai)
                </span>
              </div>
            </div>

            {/* Budget vs Actual */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Buget vs Actual CAPEX</span>
                <div className="flex gap-3">
                  <span className="text-[10px] text-blue-400">■ Plan</span>
                  <span className="text-[10px] text-emerald-400">■ Actual</span>
                  <span className="text-[10px] text-slate-500">■ Δ</span>
                </div>
              </div>
              {selected.budget.map((b, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40 last:border-0">
                    <span className="text-[11px] text-slate-400 flex-1 mr-4">{b.name}</span>
                    <div className="flex gap-4 flex-shrink-0">
                      <span className="font-mono text-[11px] font-medium text-blue-400">{b.plan}</span>
                      <span className="font-mono text-[11px] font-medium text-emerald-400">{b.actual}</span>
                      <span className={`font-mono text-[11px] font-medium ${b.diffType === 'pos' ? 'text-emerald-400' : b.diffType === 'neg' ? 'text-red-400' : 'text-slate-500'}`}>{b.diff}</span>
                    </div>
                  </div>
                  {b.pct > 0 && (
                    <div className="h-0.5 bg-slate-800 rounded mb-1 overflow-hidden">
                      <div className={`h-full rounded ${b.pct > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(b.pct, 100)}%` }} />
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-700">
                <span className="text-[11px] font-semibold text-slate-100">TOTAL CAPEX</span>
                <div className="flex gap-4">
                  <span className="font-mono text-[11px] font-medium text-blue-400">{selected.budgetTotal.plan}</span>
                  <span className="font-mono text-[11px] font-medium text-emerald-400">{selected.budgetTotal.actual}</span>
                  <span className={`font-mono text-[11px] font-medium ${selected.budgetTotal.diffType === 'pos' ? 'text-emerald-400' : selected.budgetTotal.diffType === 'neg' ? 'text-red-400' : 'text-slate-500'}`}>{selected.budgetTotal.diff}</span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="p-4 border-b border-slate-800">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Alerte & Blocaje</div>
              {selected.alerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded border mb-2 last:mb-0 text-[11px] leading-relaxed ${
                  a.type === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                  a.type === 'warn' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                  'bg-blue-500/10 border-blue-500/30 text-blue-300'
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5 ${
                    a.type === 'danger' ? 'bg-red-500 text-white' :
                    a.type === 'warn' ? 'bg-amber-500 text-black' :
                    'bg-blue-500 text-white'
                  }`}>
                    {a.type === 'info' ? 'i' : '!'}
                  </span>
                  {a.text}
                </div>
              ))}
            </div>

            {/* Team */}
            <div className="p-4">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Echipă Responsabilă</div>
              {selected.team.map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 font-mono"
                    style={{ background: `${m.color}20`, color: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-200">{m.name}</div>
                    <div className="text-[10px] text-slate-500">{m.role}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded">{m.phase}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
