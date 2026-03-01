'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, FileText, FileSpreadsheet, TrendingUp, Info, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface Inputs {
  ca: number;
  charges: number;
  situationFamiliale: 'celibataire' | 'marie' | 'pacs';
  nbParts: number;
  autresRevenus: number;
  nbEnfants: number;
  pctRemuneration: number;
}

interface RegimeResult {
  nom: string;
  couleur: string;
  is: number;
  cotisations: number;
  ir: number;
  totalPrelevements: number;
  netDisponible: number;
  tauxGlobal: number;
  retraite: number;
  protectionSociale: string;
}

export default function ComparaisonFiscale() {
  const [inputs, setInputs] = useState<Inputs>({
    ca: 100000,
    charges: 30000,
    situationFamiliale: 'celibataire',
    nbParts: 1,
    autresRevenus: 0,
    nbEnfants: 0,
    pctRemuneration: 60,
  });

  const [results, setResults] = useState<RegimeResult[]>([]);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const benefice = inputs.ca - inputs.charges;

  useEffect(() => {
    calculateAll();
  }, [inputs]);

  function calculateIR(revenu: number, parts: number): number {
    const qf = revenu / parts;
    let impot = 0;

    if (qf <= 11294) impot = 0;
    else if (qf <= 28797) impot = (qf - 11294) * 0.11;
    else if (qf <= 82341) impot = (28797 - 11294) * 0.11 + (qf - 28797) * 0.30;
    else if (qf <= 177106) impot = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (qf - 82341) * 0.41;
    else impot = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (177106 - 82341) * 0.41 + (qf - 177106) * 0.45;

    return Math.max(0, Math.round(impot * parts));
  }

  function calculateAll() {
    const microResult = calcMicro();
    const sasuISResult = calcSASU_IS();
    const sasuIRResult = calcSASU_IR();
    const eurlISResult = calcEURL_IS();

    setResults([microResult, sasuISResult, sasuIRResult, eurlISResult]);
  }

  function calcMicro(): RegimeResult {
    const abattement = inputs.ca * 0.34;
    const revenuImposable = inputs.ca - abattement;
    const cotisations = Math.round(inputs.ca * 0.22);
    const ir = calculateIR(revenuImposable + inputs.autresRevenus, inputs.nbParts);
    const totalPrelevements = cotisations + ir;
    const netDisponible = inputs.ca - totalPrelevements;

    return {
      nom: 'Micro-entreprise',
      couleur: '#3B82F6',
      is: 0,
      cotisations,
      ir,
      totalPrelevements,
      netDisponible,
      tauxGlobal: (totalPrelevements / inputs.ca) * 100,
      retraite: cotisations * 0.25,
      protectionSociale: 'SSI - Standard',
    };
  }

  function calcSASU_IS(): RegimeResult {
    const is = benefice <= 42500 ? benefice * 0.15 : 42500 * 0.15 + (benefice - 42500) * 0.25;
    const beneficeNetIS = benefice - is;
    const remuneration = beneficeNetIS * (inputs.pctRemuneration / 100);
    const dividendes = beneficeNetIS * ((100 - inputs.pctRemuneration) / 100);

    const cotisations = Math.round(remuneration * 0.80);
    const netSalaire = remuneration - cotisations;
    const ir = calculateIR(netSalaire + inputs.autresRevenus, inputs.nbParts);
    const flatTax = Math.round(dividendes * 0.30);
    const dividendesNets = dividendes - flatTax;

    const totalPrelevements = is + cotisations + ir + flatTax;
    const netDisponible = netSalaire + dividendesNets - ir;

    return {
      nom: 'SASU à l\'IS',
      couleur: '#10B981',
      is: Math.round(is),
      cotisations,
      ir: ir + flatTax,
      totalPrelevements,
      netDisponible,
      tauxGlobal: (totalPrelevements / inputs.ca) * 100,
      retraite: cotisations * 0.28,
      protectionSociale: 'Régime général - Complet',
    };
  }

  function calcSASU_IR(): RegimeResult {
    const cotisations = Math.round(benefice * 0.45);
    const revenuImposable = benefice - cotisations;
    const ir = calculateIR(revenuImposable + inputs.autresRevenus, inputs.nbParts);
    const totalPrelevements = cotisations + ir;
    const netDisponible = benefice - totalPrelevements;

    return {
      nom: 'SASU à l\'IR',
      couleur: '#F59E0B',
      is: 0,
      cotisations,
      ir,
      totalPrelevements,
      netDisponible,
      tauxGlobal: (totalPrelevements / inputs.ca) * 100,
      retraite: cotisations * 0.28,
      protectionSociale: 'Régime général - Complet',
    };
  }

  function calcEURL_IS(): RegimeResult {
    const is = benefice <= 42500 ? benefice * 0.15 : 42500 * 0.15 + (benefice - 42500) * 0.25;
    const beneficeNetIS = benefice - is;
    const remuneration = beneficeNetIS * 0.7;
    const dividendes = beneficeNetIS * 0.3;

    const cotisations = Math.round(remuneration * 0.45);
    const netRemun = remuneration - cotisations;
    const ir = calculateIR(netRemun + inputs.autresRevenus, inputs.nbParts);

    const dividendesImposables = dividendes * 0.9;
    const cotisSSI = Math.round(dividendesImposables * 0.172);
    const flatTax = Math.round(dividendes * 0.30);
    const dividendesNets = dividendes - cotisSSI - flatTax;

    const totalPrelevements = is + cotisations + cotisSSI + ir + flatTax;
    const netDisponible = netRemun + dividendesNets - ir;

    return {
      nom: 'EURL à l\'IS',
      couleur: '#8B5CF6',
      is: Math.round(is),
      cotisations: cotisations + cotisSSI,
      ir: ir + flatTax,
      totalPrelevements,
      netDisponible,
      tauxGlobal: (totalPrelevements / inputs.ca) * 100,
      retraite: cotisations * 0.35,
      protectionSociale: 'SSI - Intermédiaire',
    };
  }

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(20);
      pdf.text('Comparaison Fiscale 2026', 20, 20);
      pdf.setFontSize(12);
      pdf.text(`CA: ${currency(inputs.ca)} | Charges: ${currency(inputs.charges)}`, 20, 40);
      pdf.text(`Bénéfice: ${currency(benefice)}`, 20, 50);
      
      let y = 70;
      results.forEach(r => {
        pdf.setFontSize(14);
        pdf.text(r.nom, 20, y);
        pdf.setFontSize(10);
        pdf.text(`Net disponible: ${currency(r.netDisponible)}`, 20, y + 10);
        pdf.text(`Taux: ${r.tauxGlobal.toFixed(1)}%`, 20, y + 20);
        y += 35;
      });

      pdf.save(`comparaison-fiscale-${Date.now()}.pdf`);
    } finally {
      setExportingPDF(false);
    }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const data = [
        ['Régime', 'IS', 'Cotisations', 'IR', 'Total', 'Net disponible', 'Taux %'],
        ...results.map(r => [r.nom, r.is, r.cotisations, r.ir, r.totalPrelevements, r.netDisponible, r.tauxGlobal.toFixed(2)])
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Comparatif');
      XLSX.writeFile(wb, `comparaison-fiscale-${Date.now()}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  }

  const bestRegime = results.reduce((best, current) => 
    current.netDisponible > best.netDisponible ? current : best
  , results[0] || { nom: '', netDisponible: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>

        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm mb-6">
            <Sparkles size={16} />
            <span className="font-bold">Loi de Finances 2026</span>
          </div>
          <h1 className="text-6xl font-black mb-4">Comparaison Fiscale</h1>
          <p className="text-xl text-slate-300">Micro • SASU IS • SASU IR • EURL IS</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur sticky top-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Calculator className="text-blue-400" size={24} />
                Vos données
              </h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 mb-2 block">CA annuel (€)</Label>
                  <Input type="number" value={inputs.ca} onChange={(e) => setInputs({...inputs, ca: Number(e.target.value)})} className="bg-slate-700 border-slate-600 text-white h-12 text-lg" />
                </div>
                <div>
                  <Label className="text-slate-300 mb-2 block">Charges (€)</Label>
                  <Input type="number" value={inputs.charges} onChange={(e) => setInputs({...inputs, charges: Number(e.target.value)})} className="bg-slate-700 border-slate-600 text-white h-12 text-lg" />
                </div>
                <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <p className="text-xs text-blue-300 mb-1">Bénéfice</p>
                  <p className="text-3xl font-black text-white">{currency(benefice)}</p>
                </div>
                <div>
                  <Label className="text-slate-300 mb-2 block">Situation</Label>
                  <Select value={inputs.situationFamiliale} onValueChange={(v: any) => setInputs({...inputs, situationFamiliale: v})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="celibataire">Célibataire</SelectItem>
                      <SelectItem value="marie">Marié(e)</SelectItem>
                      <SelectItem value="pacs">Pacsé(e)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 mb-2 block">Parts fiscales</Label>
                  <Input type="number" step="0.5" value={inputs.nbParts} onChange={(e) => setInputs({...inputs, nbParts: Number(e.target.value)})} className="bg-slate-700 border-slate-600 text-white h-12" />
                </div>
                <div>
                  <Label className="text-slate-300 mb-2 block">Autres revenus (€)</Label>
                  <Input type="number" value={inputs.autresRevenus} onChange={(e) => setInputs({...inputs, autresRevenus: Number(e.target.value)})} className="bg-slate-700 border-slate-600 text-white h-12" />
                </div>
                <div>
                  <Label className="text-slate-300 mb-2 block">% Rémunération (IS)</Label>
                  <Input type="range" min="0" max="100" step="5" value={inputs.pctRemuneration} onChange={(e) => setInputs({...inputs, pctRemuneration: Number(e.target.value)})} className="w-full" />
                  <p className="text-sm text-slate-400 mt-1">{inputs.pctRemuneration}% salaire / {100 - inputs.pctRemuneration}% dividendes</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button onClick={exportToPDF} disabled={exportingPDF} className="w-full bg-red-600 hover:bg-red-700 h-12">
                  <FileText size={18} className="mr-2" />
                  {exportingPDF ? 'Génération...' : 'Export PDF'}
                </Button>
                <Button onClick={exportToExcel} disabled={exportingExcel} className="w-full bg-green-600 hover:bg-green-700 h-12">
                  <FileSpreadsheet size={18} className="mr-2" />
                  {exportingExcel ? 'Génération...' : 'Export Excel'}
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {results.map((r) => (
              <Card key={r.nom} className={`p-6 backdrop-blur transition-all ${r.nom === bestRegime.nom ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-amber-400 ring-2 ring-amber-400' : 'bg-slate-800/30 border-slate-700'}`}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.couleur }} />
                      <h3 className="text-2xl font-bold">{r.nom}</h3>
                      {r.nom === bestRegime.nom && (
                        <span className="px-3 py-1 bg-amber-400 text-slate-900 text-xs font-black rounded-full uppercase">
                          ✨ Optimal
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">Taux global : {r.tauxGlobal.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400 mb-1">Net disponible</p>
                    <p className="text-4xl font-black text-green-400">{currency(r.netDisponible)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {r.is > 0 && (
                    <div className="bg-slate-700/40 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">IS</p>
                      <p className="text-lg font-bold text-red-400">-{currency(r.is)}</p>
                    </div>
                  )}
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Cotisations</p>
                    <p className="text-lg font-bold text-orange-400">-{currency(r.cotisations)}</p>
                  </div>
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">IR</p>
                    <p className="text-lg font-bold text-yellow-400">-{currency(r.ir)}</p>
                  </div>
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Retraite/an</p>
                    <p className="text-lg font-bold text-blue-400">{currency(r.retraite)}</p>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="p-6 bg-blue-500/10 border-blue-500/30">
              <div className="flex items-start gap-3">
                <Info className="text-blue-400 flex-shrink-0" size={20} />
                <div className="text-sm text-blue-100">
                  <p className="font-bold mb-2">Méthodologie</p>
                  <ul className="space-y-1 text-blue-200/80 text-xs">
                    <li>• IS : 15% jusqu'à 42 500€, 25% au-delà</li>
                    <li>• Cotisations assimilé salarié : 80% du brut</li>
                    <li>• Cotisations TNS : 45%</li>
                    <li>• Flat tax dividendes : 30%</li>
                    <li>• Barème IR 2026 avec quotient familial</li>
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