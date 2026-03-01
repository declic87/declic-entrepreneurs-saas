'use client';
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, FileText, FileSpreadsheet, TrendingDown, Shield, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function SimulateurTransmission() {
  const [inputs, setInputs] = useState({
    valeurEntreprise: 500000,
    nbEnfants: 2,
    abattement: 100000,
    typeDonation: 'dutreil' as 'dutreil' | 'classique',
    anneesDetention: 8,
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const BAREME = [
    { seuil: 8072, taux: 0.05 },
    { seuil: 12109, taux: 0.10 },
    { seuil: 15932, taux: 0.15 },
    { seuil: 552324, taux: 0.20 },
    { seuil: 902838, taux: 0.30 },
    { seuil: 1805677, taux: 0.40 },
    { seuil: Infinity, taux: 0.45 },
  ];

  function calcDroits(base: number): number {
    let droits = 0, reste = base, prev = 0;
    for (const t of BAREME) {
      const tranche = Math.min(reste, t.seuil - prev);
      if (tranche > 0) { droits += tranche * t.taux; reste -= tranche; }
      prev = t.seuil;
      if (reste <= 0) break;
    }
    return Math.round(droits);
  }

  const results = useMemo(() => {
    const part = inputs.valeurEntreprise / inputs.nbEnfants;
    const baseClassique = Math.max(0, part - inputs.abattement);
    const droitsClassique = calcDroits(baseClassique);
    const coutClassique = droitsClassique * inputs.nbEnfants;

    const exoDutreil = inputs.typeDonation === 'dutreil' ? part * 0.75 : 0;
    const baseDutreil = Math.max(0, part - exoDutreil - inputs.abattement);
    const droitsDutreil = calcDroits(baseDutreil);
    const coutDutreil = droitsDutreil * inputs.nbEnfants;

    return {
      part,
      classique: { base: baseClassique, droits: droitsClassique, cout: coutClassique },
      dutreil: { exo: exoDutreil, base: baseDutreil, droits: droitsDutreil, cout: coutDutreil },
      economie: coutClassique - coutDutreil,
      tauxEco: coutClassique > 0 ? ((coutClassique - coutDutreil) / coutClassique) * 100 : 0,
    };
  }, [inputs]);

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      pdf.text('Transmission - Pacte Dutreil', 20, 20);
      pdf.text(`Valeur: ${currency(inputs.valeurEntreprise)}`, 20, 40);
      pdf.text(`Economie: ${currency(results.economie)}`, 20, 50);
      pdf.save(`transmission-${Date.now()}.pdf`);
    } finally { setExportingPDF(false); }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['Type', 'Coût'],
        ['Classique', results.classique.cout],
        ['Dutreil', results.dutreil.cout],
        ['Économie', results.economie]
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Transmission');
      XLSX.writeFile(wb, `transmission-${Date.now()}.xlsx`);
    } finally { setExportingExcel(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6">
          <ArrowLeft size={20} />Retour
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-3">Transmission d'Entreprise</h1>
          <p className="text-xl text-slate-600">Pacte Dutreil & Donations</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="p-6 bg-white shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Gift className="text-indigo-600" size={24} />Configuration
            </h3>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Valeur entreprise (€)</Label>
                <Input type="number" value={inputs.valeurEntreprise as any} onChange={(e) => setInputs({...inputs, valeurEntreprise: Number(e.target.value) || 0})} className="h-12" />
              </div>
              <div>
                <Label className="mb-2 block">Nombre d'enfants</Label>
                <Input type="number" value={inputs.nbEnfants as any} onChange={(e) => setInputs({...inputs, nbEnfants: Number(e.target.value) || 1})} className="h-12" />
              </div>
              <div>
                <Label className="mb-2 block">Abattement (€)</Label>
                <Input type="number" value={inputs.abattement as any} onChange={(e) => setInputs({...inputs, abattement: Number(e.target.value) || 0})} className="h-12" />
              </div>
              <div>
                <Label className="mb-2 block">Années de détention</Label>
                <Input type="number" value={inputs.anneesDetention as any} onChange={(e) => setInputs({...inputs, anneesDetention: Number(e.target.value) || 0})} className="h-12" />
              </div>
              <div>
                <Label className="mb-3 block">Type donation</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setInputs({...inputs, typeDonation: 'classique'})} className={`p-3 rounded-lg border-2 font-bold ${inputs.typeDonation === 'classique' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200'}`}>
                    Classique
                  </button>
                  <button onClick={() => setInputs({...inputs, typeDonation: 'dutreil'})} className={`p-3 rounded-lg border-2 font-bold ${inputs.typeDonation === 'dutreil' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200'}`}>
                    Dutreil
                  </button>
                </div>
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
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Donation Classique</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Part par enfant</p>
                    <p className="text-lg font-bold">{currency(results.part)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Base imposable</p>
                    <p className="text-lg font-bold">{currency(results.classique.base)}</p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-slate-500 uppercase">Coût Total</p>
                    <p className="text-3xl font-black">{currency(results.classique.cout)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 ring-2 ring-emerald-400">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-emerald-700 uppercase">Pacte Dutreil</h3>
                  <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">-75%</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-emerald-700">Exonération 75%</p>
                    <p className="text-lg font-bold text-emerald-900">{currency(results.dutreil.exo)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700">Base imposable</p>
                    <p className="text-lg font-bold text-emerald-900">{currency(results.dutreil.base)}</p>
                  </div>
                  <div className="pt-3 border-t border-emerald-200">
                    <p className="text-xs text-emerald-700 uppercase">Coût Total</p>
                    <p className="text-3xl font-black text-emerald-900">{currency(results.dutreil.cout)}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown size={32} />
                    <h3 className="text-2xl font-bold">Économie réalisée</h3>
                  </div>
                  <p className="text-indigo-100">Grâce au Pacte Dutreil</p>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-black">{currency(results.economie)}</p>
                  <p className="text-xl text-indigo-200 mt-2">soit {results.tauxEco.toFixed(1)}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-amber-900 mb-3">Conditions du Pacte Dutreil</h3>
                  <ul className="space-y-2 text-sm text-amber-800">
                    <li className="flex items-start gap-2">
                      <span>•</span><span>Engagement collectif : <strong>2 ans minimum</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span><span>Engagement individuel : <strong>4 ans</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span><span>Fonction de direction : <strong>3 ans</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span><span>Exonération : <strong>75% de la valeur</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}