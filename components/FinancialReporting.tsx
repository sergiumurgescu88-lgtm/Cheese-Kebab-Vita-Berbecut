import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Download, BarChart3, PieChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RePieChart, Pie, Cell } from 'recharts';

// Demo data — will be replaced with real API data
const DEMO_PARCS = [
  { name: 'Căzănești', mw: 9.13, monthlyMWh: 1840, theoreticalMWh: 2100, priceEUR: 0.090, investmentMEUR: 7.5, status: 'operational' },
  { name: 'Mircea Vodă', mw: 34, monthlyMWh: 6820, theoreticalMWh: 7800, priceEUR: 0.090, investmentMEUR: 28.0, status: 'operational' },
  { name: 'Roata de Jos', mw: 12, monthlyMWh: 2100, theoreticalMWh: 2800, priceEUR: 0.090, investmentMEUR: 9.8, status: 'alarm' },
  { name: 'Șimleu Silvaniei', mw: 48, monthlyMWh: 4180, theoreticalMWh: 11000, priceEUR: 0.090, investmentMEUR: 39.5, status: 'construction' },
  { name: 'Babadag', mw: 18.27, monthlyMWh: 3200, theoreticalMWh: 3600, priceEUR: 0.090, investmentMEUR: 15.0, status: 'operational' },
  { name: 'Stâlpu', mw: 5.35, monthlyMWh: 980, theoreticalMWh: 1100, priceEUR: 0.090, investmentMEUR: 4.4, status: 'operational' },
  { name: 'Iancu Jianu', mw: 8.5, monthlyMWh: 1520, theoreticalMWh: 1750, priceEUR: 0.090, investmentMEUR: 7.0, status: 'operational' },
  { name: 'Arad Vest', mw: 28, monthlyMWh: 2100, theoreticalMWh: 6400, priceEUR: 0.090, investmentMEUR: 23.0, status: 'construction' },
];

const COLORS = ['#f59e0b', '#06b6d4', '#10b981', '#f87171', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export default function FinancialReporting() {
  const [parcs] = useState(DEMO_PARCS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const totalMonthlyRevenue = parcs.reduce((s, p) => s + (p.monthlyMWh * 1000 * p.priceEUR), 0);
  const totalTheoreticalRevenue = parcs.reduce((s, p) => s + (p.theoreticalMWh * 1000 * p.priceEUR), 0);
  const totalLosses = totalTheoreticalRevenue - totalMonthlyRevenue;
  const totalInvestment = parcs.reduce((s, p) => s + p.investmentMEUR, 0);
  const annualRevenueEstimate = totalMonthlyRevenue * 12;
  const simpleROI = (annualRevenueEstimate / (totalInvestment * 1000000)) * 100;

  const chartData = parcs.map(p => ({
    name: p.name,
    venit: Math.round(p.monthlyMWh * 1000 * p.priceEUR),
    pierdere: Math.round((p.theoreticalMWh - p.monthlyMWh) * 1000 * p.priceEUR),
    target: Math.round(p.theoreticalMWh * 1000 * p.priceEUR),
  }));

  const pieData = [
    { name: 'Venit Real', value: Math.round(totalMonthlyRevenue) },
    { name: 'Pierdere Anomalii', value: Math.round(totalLosses) },
  ];

  const kpiCards = [
    { label: 'Venit Lunar Estimat', value: `€${(totalMonthlyRevenue / 1000).toFixed(1)}K`, icon: DollarSign, color: 'emerald', sub: 'din producție reală' },
    { label: 'Pierderi din Anomalii', value: `€${(totalLosses / 1000).toFixed(1)}K`, icon: AlertTriangle, color: 'red', sub: `${((totalLosses/totalTheoreticalRevenue)*100).toFixed(1)}% din target` },
    { label: 'ROI Anual Estimat', value: `${simpleROI.toFixed(1)}%`, icon: TrendingUp, color: 'amber', sub: 'simplu, non-discountat' },
    { label: 'Investiție Totală', value: `€${totalInvestment.toFixed(1)}M`, icon: BarChart3, color: 'cyan', sub: `${parcs.length} parcuri` },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-800 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent" /> Raportare Financiară
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">DATE DEMO — Preț SPOT €90/MWh hardcodat · API OPCOM în dezvoltare</p>
        </div>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 text-${kpi.color}-400`} />
            </div>
            <div className={`text-xl font-black text-${kpi.color}-400`}>{kpi.value}</div>
            <div className="text-[10px] text-slate-600 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue vs Target */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Venit Real vs. Target Contractual (lunar)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '11px' }} formatter={(v: number) => [`€${v.toLocaleString('ro-RO')}`, '']} />
                <Bar dataKey="venit" fill="#f59e0b" radius={[4,4,0,0]} name="Venit Real" />
                <Bar dataKey="pierdere" fill="#f87171" radius={[4,4,0,0]} name="Pierdere" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Distribuție Venit vs. Pierdere</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f87171'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '11px' }} formatter={(v: number) => [`€${v.toLocaleString('ro-RO')}`, '']} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-slate-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Venit</div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400"><div className="w-2 h-2 rounded-full bg-red-400"></div>Pierdere</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detalii per Parc</h3>
          <span className="text-[10px] text-slate-600 font-mono">Preț: €90/MWh</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="text-left p-3 text-slate-500 font-medium">Parc</th>
                <th className="text-right p-3 text-slate-500 font-medium">MWp</th>
                <th className="text-right p-3 text-slate-500 font-medium">Producție (MWh)</th>
                <th className="text-right p-3 text-slate-500 font-medium">Target (MWh)</th>
                <th className="text-right p-3 text-slate-500 font-medium">Venit Lunar</th>
                <th className="text-right p-3 text-slate-500 font-medium">Pierdere</th>
                <th className="text-right p-3 text-slate-500 font-medium">ROI Est.</th>
                <th className="text-center p-3 text-slate-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {parcs.map((p, i) => {
                const venit = p.monthlyMWh * 1000 * p.priceEUR;
                const pierdere = (p.theoreticalMWh - p.monthlyMWh) * 1000 * p.priceEUR;
                const roi = ((venit * 12) / (p.investmentMEUR * 1000000)) * 100;
                return (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-slate-300 font-medium">{p.name}</td>
                    <td className="p-3 text-right text-slate-400">{p.mw}</td>
                    <td className="p-3 text-right text-slate-300">{p.monthlyMWh.toLocaleString('ro-RO')}</td>
                    <td className="p-3 text-right text-slate-500">{p.theoreticalMWh.toLocaleString('ro-RO')}</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">€{venit.toLocaleString('ro-RO', {maximumFractionDigits:0})}</td>
                    <td className="p-3 text-right text-red-400">{pierdere > 0 ? `€${pierdere.toLocaleString('ro-RO', {maximumFractionDigits:0})}` : '—'}</td>
                    <td className="p-3 text-right text-amber-400 font-bold">{roi.toFixed(1)}%</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.status === 'operational' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : p.status === 'alarm' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {p.status === 'operational' ? 'Operațional' : p.status === 'alarm' ? 'Alarmă' : 'Construcție'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-slate-600 text-[10px]">
        <PieChart className="w-3 h-3" />
        <span>Date actualizate Aprilie 2026 · HELIOS Financial Module v1.0 · Preț SPOT €90/MWh (estimat)</span>
      </div>
    </div>
  );
}
