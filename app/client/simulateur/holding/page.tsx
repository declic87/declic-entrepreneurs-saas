'use client';
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, FileText, FileSpreadsheet, TrendingDown, Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function SimulateurHolding() {
  const [inputs, setInputs] = useState({
    valeurTitres: 500000,
    prixAcquisition: 100000,
    anneesDetention: 8,
    typeApport: 'apport_cession' as 'apport_cession' | 'cession_directe',
    reinvestissement: true,
  });
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const results = useMemo(() => {
    const plusValue = inputs.valeurTitres - inputs.prixAcquisition;
    let abattement = 0;
    if (inputs.anneesDetention >= 8) abattement = plusValue * 0.85;
    else if (inputs.anneesDetention >= 4) abattement = plusValue * 0.50;
    else if (inputs.anneesDetention >= 1) abattement = plusValue * 0.25;

    const pvImposableCession = plusValue - abattement;
    const flatTax = pvImposableCession * 0.30;
    const netCession = inputs.valeurTitres - flatTax;

    const reportIS = inputs.typeApport === 'apport_cession' ? plusValue : 0;
    const netApport = inputs.valeurTitres;
    const isSortie = inputs.reinvestissement ? 0 : plusValue * 0.25;
    const netFinalApport = netApport - isSortie;
    const economie = inputs.typeApport === 'apport_cession' ? flatTax - isSortie : 0;

    return {
      plusValue, abattement,
      cessionDirecte: { pvImposable: pvImposableCession, impot: flatTax, netPercu: netCession },
      apportCession: { reportIS, isSortie, netPercu: netFinalApport },
      economie, tauxEconomie: flatTax > 0 ? (economie / flatTax) * 100 : 0,
    };
  }, [inputs]);

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(20);
      pdf.text('Simulation Holding', 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Valeur: ${currency(inputs.valeurTitres)}`, 20, 40);
      pdf.text(`Plus-value: ${currency(results.plusValue)}`, 20, 50);
      pdf.text(`Economie: ${currency(results.economie)}`, 20, 60);
      pdf.save(`holding-${Date.now()}.pdf`);
    } finally { setExportingPDF(false); }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['Type', 'Impôt', 'Net perçu'],
        ['Cession directe', results.cessionDirecte.impot, results.cessionDirecte.netPercu],
        ['Apport-cession', results.apportCession.isSortie, results.apportCession.netPercu],
        ['', '', ''],
        ['Économie', results.economie, ''],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Holding');
      XLSX.writeFile(wb, `holding-${Date.now()}.xlsx`);
    } finally { setExportingExcel(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 mb-6">
          <ArrowLeft size={20} />Retour
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur Holding</h1>
          <p className="text-xl text-slate-600">Apport-cession • Intégration fiscale • Report d'IS</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="p-6 bg-white shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="text-violet-600" size={24} />Configuration
            </h3>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Valeur des titres (€)</Label>
                <Input type="number" value={inputs.valeurTitres as any} onChange={(e) => setInputs({...inputs, valeurTitres: Number(e.target.value) || 0})} className="h-12" />
              </div>
              <div>
                <Label className="mb-2 block">Prix d'acquisition (€)</Label>
                <Input type="number" value={inputs.prixAcquisition as any} onChange={(e) => setInputs({...inputs, prixAcquisition: Number(e.target.value) || 0})} className="h-12" />
              </div>
              <div>
                <Label className="mb-2 block">Années de détention</Label>
                <Input type="number" value={inputs.anneesDetention as any} onChange={(e) => setInputs({...inputs, anneesDetention: Number(e.target.value) || 0})} className="h-12" />
                <p className="text-xs text-slate-500 mt-1">Abattement renforcé si ≥8 ans</p>
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <input type="checkbox" checked={inputs.reinvestissement} onChange={(e) => setInputs({...inputs, reinvestissement: e.target.checked})} className="w-4 h-4" />
                  Réinvestissement
                </Label>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Button onClick={exportToPDF} disabled={exportingPDF} className="w-full bg-red-600 hover:bg-red-700 h-12">
                <FileText size={18} className="mr-2" />{exportingPDF ? 'PDF...' : 'Export PDF'}
              </Button>
              <Button onClick={exportToExcel} disabled={exportingExcel} className="w-full bg-green-600 hover:bg-green-700 h-12">
                <FileSpreadsheet size={18} className="mr-2" />{exportingExcel ? 'Excel...' : 'Export Excel'}
              </Button>
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-5 bg-white">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Plus-value</p>
                <p className="text-3xl font-black">{currency(results.plusValue)}</p>
              </Card>
              <Card className="p-5 bg-violet-50">
                <p className="text-xs text-violet-700 uppercase font-bold mb-1">Abattement</p>
                <p className="text-3xl font-black text-violet-900">{currency(results.abattement)}</p>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Cession Directe</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500">PV imposable</p>
                    <p className="text-lg font-bold">{currency(results.cessionDirecte.pvImposable)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Flat tax 30%</p>
                    <p className="text-lg font-bold text-red-600">{currency(results.cessionDirecte.impot)}</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-slate-500 uppercase font-bold">Net perçu</p>
                    <p className="text-3xl font-black">{currency(results.cessionDirecte.netPercu)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 ring-2 ring-violet-400">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-violet-700 uppercase">Apport-Cession</h3>
                  <span className="px-2 py-1 bg-violet-600 text-white text-xs font-bold rounded-full">Optimal</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-violet-700">Report d'IS</p>
                    <p className="text-lg font-bold text-violet-900">{currency(results.apportCession.reportIS)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-violet-700">IS à payer (si sortie)</p>
                    <p className="text-lg font-bold text-violet-600">{currency(results.apportCession.isSortie)}</p>
                  </div>
                  <div className="pt-4 border-t border-violet-200">
                    <p className="text-xs text-violet-700 uppercase font-bold">Net perçu</p>
                    <p className="text-3xl font-black text-violet-900">{currency(results.apportCession.netPercu)}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-8 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown size={32} />
                    <h3 className="text-2xl font-bold">Économie fiscale</h3>
                  </div>
                  <p className="text-violet-100">Grâce à l'apport-cession</p>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-black">{currency(results.economie)}</p>
                  <p className="text-xl text-violet-200 mt-2">{results.tauxEconomie.toFixed(1)}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="text-violet-600" size={24} />Avantages
              </h3>
              <div className="space-y-3">
                {[
                  'Report d\'imposition de la plus-value (art. 150-0 B ter)',
                  'Pas de taxation immédiate si réinvestissement',
                  'IS différé jusqu\'à la sortie des fonds',
                  'Optimisation patrimoniale et transmission facilitée',
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-slate-700">{a}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}