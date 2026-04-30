import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getStations, getHistory, StationData, HistoryPoint } from '../services/fusionSolarService';

export const ReportPDF: React.FC<{ className?: string }> = ({ className }) => {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const stations = await getStations();
      const allHistory: { station: StationData; history: HistoryPoint[] }[] = [];
      for (const s of stations) {
        const h = await getHistory(s.plantCode, 30);
        allHistory.push({ station: s, history: h });
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const now = new Date();
      const luna = now.toLocaleString('ro-RO', { month: 'long', year: 'numeric' });
      const W = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, W, 35, 'F');
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('HELIOS by Sergiu', 14, 14);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Raport Lunar Productie — ' + luna, 14, 22);
      doc.text('DATE DEMO — Credentiale reale FusionSolar necesare', 14, 29);
      doc.setTextColor(100, 116, 139);
      doc.text('Generat: ' + now.toLocaleString('ro-RO'), W - 14, 29, { align: 'right' });

      // KPI Summary
      const totalCap = stations.reduce((s, p) => s + p.capacity, 0);
      const totalMonthly = stations.reduce((s, p) => s + p.monthlyEnergy, 0);
      const totalDaily = stations.reduce((s, p) => s + p.dailyEnergy, 0);
      const alarms = stations.filter(p => p.status === 'ALARM').length;

      doc.setFillColor(30, 41, 59);
      doc.roundedRect(14, 40, 40, 22, 2, 2, 'F');
      doc.roundedRect(60, 40, 40, 22, 2, 2, 'F');
      doc.roundedRect(106, 40, 40, 22, 2, 2, 'F');
      doc.roundedRect(152, 40, 40, 22, 2, 2, 'F');

      const kpis = [
        { label: 'Capacitate Totala', value: totalCap.toFixed(1) + ' MWp', x: 34 },
        { label: 'Energie Luna', value: totalMonthly.toFixed(0) + ' MWh', x: 80 },
        { label: 'Energie Azi', value: totalDaily.toFixed(0) + ' MWh', x: 126 },
        { label: 'Alarme Active', value: String(alarms), x: 172 },
      ];
      kpis.forEach(k => {
        doc.setTextColor(245, 158, 11);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(k.value, k.x, 52, { align: 'center' });
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(k.label.toUpperCase(), k.x, 58, { align: 'center' });
      });

      // Tabel parcuri
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Portofoliu Parcuri', 14, 74);

      autoTable(doc, {
        startY: 78,
        head: [['Parc', 'Capacitate (MWp)', 'Energie Azi (MWh)', 'Energie Luna (MWh)', 'Status']],
        body: stations.map(s => [
          s.plantName,
          s.capacity.toFixed(2),
          s.dailyEnergy.toFixed(1),
          s.monthlyEnergy.toFixed(0),
          s.status,
        ]),
        headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fillColor: [30, 41, 59], textColor: [226, 232, 240], fontSize: 8 },
        alternateRowStyles: { fillColor: [20, 30, 48] },
        columnStyles: { 4: { textColor: (row: any) => row.raw === 'ALARM' ? [239, 68, 68] : [16, 185, 129] } },
        margin: { left: 14, right: 14 },
      });

      // Tabel productie 30 zile per parc
      for (const { station, history } of allHistory) {
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, W, 18, 'F');
        doc.setTextColor(245, 158, 11);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(station.plantName, 14, 12);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${station.capacity} MWp · ${station.status}`, W - 14, 12, { align: 'right' });

        autoTable(doc, {
          startY: 24,
          head: [['Data', 'Energie (MWh)', 'Peak (MW)', 'Iradiere (kWh/m²)', 'PR (%)']],
          body: history.map(h => [h.date, h.energy.toFixed(1), h.peakPower.toFixed(2), h.irradiance.toFixed(2), h.pr.toFixed(1)]),
          headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fillColor: [30, 41, 59], textColor: [226, 232, 240], fontSize: 8 },
          alternateRowStyles: { fillColor: [20, 30, 48] },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer pe fiecare pagina
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFillColor(15, 23, 42);
        doc.rect(0, doc.internal.pageSize.getHeight() - 10, W, 10, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.text('HELIOS by Sergiu · Raport DEMO · ' + luna, 14, doc.internal.pageSize.getHeight() - 3);
        doc.text(`Pagina ${i} / ${pages}`, W - 14, doc.internal.pageSize.getHeight() - 3, { align: 'right' });
      }

      doc.save(`HELIOS_Raport_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={generate} disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all text-sm font-bold disabled:opacity-50 ${className}`}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {loading ? 'Generez...' : 'Raport PDF'}
    </button>
  );
};
