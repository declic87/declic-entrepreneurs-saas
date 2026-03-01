'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, FileText, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function SimulateurIK() {
  const [inputs, setInputs] = useState({ cv: 5, kmAnnuels: 10000, joursAnnuels: 200 });
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

  const BAREME_2025 = [
    { cv: 3, tranche1: 0.529, tranche2: 0.316, tranche3: 0.370, seuil1: 5000, seuil2: 20000 },
    { cv: 4, tranche1: 0.606, tranche2: 0.340, tranche3: 0.407, seuil1: 5000, seuil2: 20000 },
    { cv: 5, tranche1: 0.636, tranche2: 0.357, tranche3: 0.427, seuil1: 5000, seuil2: 20000 },
    { cv: 6, tranche1: 0.665, tranche2: 0.374, tranche3: 0.447, seuil1: 5000, seuil2: 20000 },
    { cv: 7, tranche1: 0.697, tranche2: 0.394, tranche3: 0.470, seuil1: 5000, seuil2: 20000 },
  ];

  const bareme = BAREME_2025.find(b => b.cv === inputs.cv) || BAREME_2025[2];
  let indemnite = 0;
  if (inputs.kmAnnuels <= bareme.seuil1) indemnite = inputs.kmAnnuels * bareme.tranche1;
  else if (inputs.kmAnnuels <= bareme.seuil2) indemnite = bareme.seuil1 * bareme.tranche1 + (inputs.kmAnnuels - bareme.seuil1) * bareme.tranche2;
  else indemnite = bareme.seuil1 * bareme.tranche1 + (bareme.seuil2 - bareme.seuil1) * bareme.tranche2 + (inputs.kmAnnuels - bareme.seuil2) * bareme.tranche3;

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      pdf.text('Indemnités Kilométriques 2025', 20, 20);
      pdf.text(`CV: ${inputs.cv} | Km: ${inputs.kmAnnuels}`, 20, 40);
      pdf.text(`Indemnité annuelle: ${currency(indemnite)}`, 20, 50);
      pdf.save(`ik-${Date.now()}.pdf`);
    } finally { setExportingPDF(false); }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['CV', 'Km', 'Indemnité'], [inputs.cv, inputs.kmAnnuels, indemnite]]);
      XLSX.utils.book_append_sheet(wb, ws, 'IK');
      XLSX.writeFile(wb, `ik-${Date.now()}.xlsx`);
    } finally { setExportingExcel(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 mb-6">
          <ArrowLeft size={20} />Retour
        </Link>
        <h1 className="text-5xl font-black text-slate-900 mb-3">Indemnités Kilométriques</h1>
        <p className="text-xl text-slate-600 mb-12">Barème fiscal 2025 (CGI art. 83-3)</p>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 bg-white shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Car className="text-cyan-600" size={24} />Configuration</h3>
            <div className="space-y-5">
              <div><Label className="mb-2 block">Puissance fiscale (CV)</Label>
                <select value={inputs.cv} onChange={(e) => setInputs({...inputs, cv: Number(e.target.value)})} className="w-full h-12 px-3 rounded-md border border-slate-300">
                  {[3,4,5,6,7].map(cv => <option key={cv} value={cv}>{cv} CV</option>)}
                </select>
              </div>
              <div><Label className="mb-2 block">Kilomètres annuels</Label>
                <Input type="number" value={inputs.kmAnnuels as any} onChange={(e) => setInputs({...inputs, kmAnnuels: Number(e.target.value) || 0})} className="h-12" />
              </div>
              <div><Label className="mb-2 block">Jours travaillés/an</Label>
                <Input type="number" value={inputs.joursAnnuels as any} onChange={(e) => setInputs({...inputs, joursAnnuels: Number(e.target.value) || 0})} className="h-12" />
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

          <div className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-cyan-600 to-blue-600 text-white">
              <p className="text-sm text-cyan-100 mb-2">Indemnité annuelle</p>
              <p className="text-5xl font-black mb-4">{currency(indemnite)}</p>
              <p className="text-cyan-100">soit {currency(indemnite / 12)}/mois</p>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold mb-4">Barème {inputs.cv} CV</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-slate-50 rounded">
                  <span>0 à {bareme.seuil1.toLocaleString()} km</span>
                  <span className="font-bold">{bareme.tranche1} €/km</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded">
                  <span>{bareme.seuil1.toLocaleString()} à {bareme.seuil2.toLocaleString()} km</span>
                  <span className="font-bold">{bareme.tranche2} €/km</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded">
                  <span>+ de {bareme.seuil2.toLocaleString()} km</span>
                  <span className="font-bold">{bareme.tranche3} €/km</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}