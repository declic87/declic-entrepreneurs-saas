'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface PrevisionInputs {
  caYear1: number;
  croissanceAnnuelle: number;
  chargesFixes: number;
  tauxMargeVariable: number;
  investissementInitial: number;
  apportPerso: number;
  emprunt: number;
  tauxEmprunt: number;
  dureeEmprunt: number;
  salaireMensuel: number;
}

interface ResultatMensuel {
  mois: number;
  ca: number;
  margeVariable: number;
  chargesFixes: number;
  salaire: number;
  mensualiteEmprunt: number;
  resultatNet: number;
  tresorerieCumulee: number;
}

export default function SimulateurPrevisionnel() {
  const [inputs, setInputs] = useState<PrevisionInputs>({
    caYear1: 100000,
    croissanceAnnuelle: 15,
    chargesFixes: 2000,
    tauxMargeVariable: 70,
    investissementInitial: 15000,
    apportPerso: 10000,
    emprunt: 5000,
    tauxEmprunt: 4.5,
    dureeEmprunt: 36,
    salaireMensuel: 2000,
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const previsions = useMemo(() => {
    const mois: ResultatMensuel[] = [];
    let tresorerie = inputs.apportPerso - inputs.investissementInitial;
    
    const mensualiteEmprunt = inputs.emprunt > 0
      ? (inputs.emprunt * (inputs.tauxEmprunt / 100 / 12)) / (1 - Math.pow(1 + inputs.tauxEmprunt / 100 / 12, -inputs.dureeEmprunt))
      : 0;

    for (let m = 1; m <= 36; m++) {
      const annee = Math.floor((m - 1) / 12);
      const caMensuel = (inputs.caYear1 * Math.pow(1 + inputs.croissanceAnnuelle / 100, annee)) / 12;
      
      const margeVariable = caMensuel * (inputs.tauxMargeVariable / 100);
      const resultatAvantSalaire = margeVariable - inputs.chargesFixes;
      const resultatNet = resultatAvantSalaire - inputs.salaireMensuel - mensualiteEmprunt;
      
      tresorerie += resultatNet;

      mois.push({
        mois: m,
        ca: caMensuel,
        margeVariable,
        chargesFixes: inputs.chargesFixes,
        salaire: inputs.salaireMensuel,
        mensualiteEmprunt,
        resultatNet,
        tresorerieCumulee: tresorerie,
      });
    }

    const totalCA = mois.reduce((sum, m) => sum + m.ca, 0);
    const totalResultat = mois.reduce((sum, m) => sum + m.resultatNet, 0);
    const tresoMin = Math.min(...mois.map(m => m.tresorerieCumulee));
    const tresoFinale = mois[35].tresorerieCumulee;
    const moisRentabilite = mois.findIndex(m => m.tresorerieCumulee > inputs.apportPerso);
    const besoinTresorerie = tresoMin < 0 ? Math.abs(tresoMin) : 0;

    return {
      mois,
      kpis: {
        totalCA,
        totalResultat,
        tresoMin,
        tresoFinale,
        moisRentabilite: moisRentabilite === -1 ? null : moisRentabilite + 1,
        besoinTresorerie,
        tauxRentabilite: (totalResultat / totalCA) * 100,
      }
    };
  }, [inputs]);

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BUSINESS PLAN PRÉVISIONNEL', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text('Projection 36 mois', pageWidth / 2, 30, { align: 'center' });
      pdf.text(`${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 38, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('HYPOTHÈSES', 20, 65);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      let y = 75;
      [
        `CA Année 1 : ${currency(inputs.caYear1)}`,
        `Croissance : ${inputs.croissanceAnnuelle}%`,
        `Charges fixes : ${currency(inputs.chargesFixes)}/mois`,
        `Marge : ${inputs.tauxMargeVariable}%`,
        `Investissement : ${currency(inputs.investissementInitial)}`,
        `Apport : ${currency(inputs.apportPerso)}`,
        `Emprunt : ${currency(inputs.emprunt)}`,
        `Salaire : ${currency(inputs.salaireMensuel)}/mois`,
      ].forEach(h => { pdf.text(h, 20, y); y += 6; });

      pdf.save(`business-plan-${Date.now()}.pdf`);
    } finally {
      setExportingPDF(false);
    }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['Mois', 'CA', 'Résultat', 'Trésorerie'],
        ...previsions.mois.map(m => [m.mois, m.ca, m.resultatNet, m.tresorerieCumulee])
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Prévisionnel');
      XLSX.writeFile(wb, `business-plan-${Date.now()}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-12">
          <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
            <ArrowLeft size={20} />
            <span>Retour</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-slate-900 mb-3">Business Plan Prévisionnel</h1>
              <p className="text-xl text-slate-600">Projection 36 mois</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full">
              <Calendar size={16} />
              <span className="text-sm font-bold">3 ans</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white shadow-lg sticky top-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={24} />
                Hypothèses
              </h3>

              <div className="space-y-5">
                <div>
                  <Label className="mb-2 block">CA Année 1 (€)</Label>
                  <Input type="number" value={inputs.caYear1 as any} onChange={(e) => setInputs({...inputs, caYear1: Number(e.target.value) || 0})} className="h-12" />
                </div>
                <div>
                  <Label className="mb-2 block">Croissance annuelle (%)</Label>
                  <Input type="number" value={inputs.croissanceAnnuelle as any} onChange={(e) => setInputs({...inputs, croissanceAnnuelle: Number(e.target.value) || 0})} className="h-12" />
                </div>
                <div>
                  <Label className="mb-2 block">Charges fixes mensuelles (€)</Label>
                  <Input type="number" value={inputs.chargesFixes as any} onChange={(e) => setInputs({...inputs, chargesFixes: Number(e.target.value) || 0})} className="h-12" />
                </div>
                <div>
                  <Label className="mb-2 block">Marge brute (%)</Label>
                  <Input type="number" value={inputs.tauxMargeVariable as any} onChange={(e) => setInputs({...inputs, tauxMargeVariable: Number(e.target.value) || 0})} className="h-12" />
                </div>
                <div>
                  <Label className="mb-2 block">Investissement initial (€)</Label>
                  <Input type="number" value={inputs.investissementInitial as any} onChange={(e) => setInputs({...inputs, investissementInitial: Number(e.target.value) || 0})} className="h-12" />
                </div>
                <div>
                  <Label className="mb-2 block">Apport personnel (€)</Label>
                  <Input type="number" value={inputs.apportPerso as any} onChange={(e) => setInputs({...inputs, apportPerso: Number(e.target.value) || 0})} className="h-12" />
                </div>
                <div>
                  <Label className="mb-2 block">Emprunt (€)</Label>
                  <Input type="number" value={inputs.emprunt as any} onChange={(e) => setInputs({...inputs, emprunt: Number(e.target.value) || 0})} className="h-12" />
                </div>
                {inputs.emprunt > 0 && (
                  <>
                    <div>
                      <Label className="mb-2 block">Taux (%)</Label>
                      <Input type="number" step="0.1" value={inputs.tauxEmprunt as any} onChange={(e) => setInputs({...inputs, tauxEmprunt: Number(e.target.value) || 0})} className="h-12" />
                    </div>
                    <div>
                      <Label className="mb-2 block">Durée (mois)</Label>
                      <Input type="number" value={inputs.dureeEmprunt as any} onChange={(e) => setInputs({...inputs, dureeEmprunt: Number(e.target.value) || 0})} className="h-12" />
                    </div>
                  </>
                )}
                <div>
                  <Label className="mb-2 block">Salaire mensuel (€)</Label>
                  <Input type="number" value={inputs.salaireMensuel as any} onChange={(e) => setInputs({...inputs, salaireMensuel: Number(e.target.value) || 0})} className="h-12" />
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button onClick={exportToPDF} disabled={exportingPDF} className="w-full bg-red-600 hover:bg-red-700 h-12">
                  <FileText size={18} className="mr-2" />
                  {exportingPDF ? 'PDF...' : 'Export PDF'}
                </Button>
                <Button onClick={exportToExcel} disabled={exportingExcel} className="w-full bg-green-600 hover:bg-green-700 h-12">
                  <FileSpreadsheet size={18} className="mr-2" />
                  {exportingExcel ? 'Excel...' : 'Export Excel'}
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-5 bg-white">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">CA Total</p>
                <p className="text-2xl font-black">{currency(previsions.kpis.totalCA)}</p>
              </Card>
              <Card className="p-5 bg-emerald-50">
                <p className="text-xs text-emerald-700 uppercase font-bold mb-1">Résultat</p>
                <p className="text-2xl font-black text-emerald-900">{currency(previsions.kpis.totalResultat)}</p>
              </Card>
              <Card className="p-5 bg-white">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Tréso Finale</p>
                <p className="text-2xl font-black">{currency(previsions.kpis.tresoFinale)}</p>
              </Card>
              <Card className="p-5 bg-white">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Point Mort</p>
                <p className="text-2xl font-black">{previsions.kpis.moisRentabilite ? `M${previsions.kpis.moisRentabilite}` : 'N/A'}</p>
              </Card>
            </div>

            {previsions.kpis.besoinTresorerie > 0 && (
              <Card className="p-6 bg-red-50 border-red-200">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="text-red-600" size={24} />
                  <div>
                    <h3 className="font-bold text-red-900 mb-2">Alerte Trésorerie</h3>
                    <p className="text-red-700">Besoin : <strong>{currency(previsions.kpis.besoinTresorerie)}</strong></p>
                  </div>
                </div>
              </Card>
            )}

            {previsions.kpis.tresoFinale > inputs.apportPerso && (
              <Card className="p-6 bg-emerald-50 border-emerald-200">
                <div className="flex items-start gap-4">
                  <CheckCircle className="text-emerald-600" size={24} />
                  <div>
                    <h3 className="font-bold text-emerald-900 mb-2">Projet Viable</h3>
                    <p className="text-emerald-700">Excédent : <strong>{currency(previsions.kpis.tresoFinale - inputs.apportPerso)}</strong></p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="text-blue-600" size={24} />
                12 premiers mois
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left py-3 px-2">Mois</th>
                      <th className="text-right py-3 px-2">CA</th>
                      <th className="text-right py-3 px-2">Résultat</th>
                      <th className="text-right py-3 px-2">Trésorerie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previsions.mois.slice(0, 12).map((m) => (
                      <tr key={m.mois} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-2 font-semibold">M{m.mois}</td>
                        <td className="text-right py-3 px-2">{currency(m.ca)}</td>
                        <td className={`text-right py-3 px-2 font-bold ${m.resultatNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {currency(m.resultatNet)}
                        </td>
                        <td className={`text-right py-3 px-2 font-bold ${m.tresorerieCumulee >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {currency(m.tresorerieCumulee)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}