'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, FileText, FileSpreadsheet, ArrowLeft, Info, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function SimulateurDividendes() {
  const [inputs, setInputs] = useState({
    dividendesBruts: 50000,
    tmi: 30,
    nbParts: 1,
    capitalSocial: 10000,
    typeStructure: 'SASU' as 'SASU' | 'EURL',
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const results = useMemo(() => {
    // PFU (Flat Tax 31.4% en 2026)
    const pfuTotal = inputs.dividendesBruts * 0.314;
    const netPFU = inputs.dividendesBruts - pfuTotal;

    // BARÈME PROGRESSIF (avec abattement 40%)
    const abattement40 = inputs.dividendesBruts * 0.40;
    const baseBareme = inputs.dividendesBruts - abattement40;
    const qf = baseBareme / inputs.nbParts;
    
    let irBareme = 0;
    if (qf <= 11294) irBareme = 0;
    else if (qf <= 28797) irBareme = (qf - 11294) * 0.11;
    else if (qf <= 82341) irBareme = (28797 - 11294) * 0.11 + (qf - 28797) * 0.30;
    else if (qf <= 177106) irBareme = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (qf - 82341) * 0.41;
    else irBareme = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (177106 - 82341) * 0.41 + (qf - 177106) * 0.45;
    
    irBareme = Math.round(irBareme * inputs.nbParts);
    const psBareme = inputs.dividendesBruts * 0.172;
    const totalBareme = irBareme + psBareme;
    const netBareme = inputs.dividendesBruts - totalBareme;

    // COTISATIONS SSI EURL (si dividendes > 10% capital)
    const seuil10Pct = inputs.capitalSocial * 0.10;
    const dividendesExcedentaires = Math.max(0, inputs.dividendesBruts - seuil10Pct);
    const cotisSSI = inputs.typeStructure === 'EURL' ? dividendesExcedentaires * 0.9 * 0.172 : 0;

    // COMPARAISON AVEC SALAIRE ÉQUIVALENT
    const salaireBrutEquiv = inputs.dividendesBruts;
    const cotisationsSalaire = inputs.typeStructure === 'SASU' ? salaireBrutEquiv * 0.80 : salaireBrutEquiv * 0.45;
    const salaireNet = salaireBrutEquiv - cotisationsSalaire;
    const irSalaire = (() => {
      const qfSal = salaireNet / inputs.nbParts;
      let ir = 0;
      if (qfSal <= 11294) ir = 0;
      else if (qfSal <= 28797) ir = (qfSal - 11294) * 0.11;
      else if (qfSal <= 82341) ir = (28797 - 11294) * 0.11 + (qfSal - 28797) * 0.30;
      else if (qfSal <= 177106) ir = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (qfSal - 82341) * 0.41;
      else ir = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (177106 - 82341) * 0.41 + (qfSal - 177106) * 0.45;
      return Math.round(ir * inputs.nbParts);
    })();
    const netSalaire = salaireNet - irSalaire;

    // RECOMMANDATION
    const meilleur = netPFU > netBareme ? 'PFU' : 'Barème';
    const economie = Math.abs(netPFU - netBareme);

    // COMMENTAIRES
    let commentairePFU = '';
    if (inputs.tmi >= 30) {
      commentairePFU = '✅ Le PFU (31.4% en 2026) est généralement plus avantageux avec un TMI supérieur ou égal à 30%.';
    } else {
      commentairePFU = '💡 Le barème progressif peut être intéressant avec votre TMI.';
    }

    let commentaireBareme = '';
    if (inputs.nbParts >= 2) {
      commentaireBareme = '✅ Avec plusieurs parts fiscales, le quotient familial améliore le barème.';
    }
    commentaireBareme += ` L'abattement de 40% réduit la base imposable à ${currency(baseBareme)}.`;

    let commentaireSSI = '';
    if (inputs.typeStructure === 'EURL' && dividendesExcedentaires > 0) {
      commentaireSSI = `⚠️ En EURL, les dividendes au-delà de 10% du capital (${currency(seuil10Pct)}) sont soumis aux cotisations sociales (17.2%). Montant concerné : ${currency(dividendesExcedentaires)}.`;
    } else if (inputs.typeStructure === 'EURL') {
      commentaireSSI = '✅ Vos dividendes restent sous le seuil des 10% du capital, pas de cotisations SSI.';
    }

    let commentaireSalaire = '';
    if (netSalaire < netPFU) {
      const diff = netPFU - netSalaire;
      commentaireSalaire = `💡 Les dividendes vous font gagner ${currency(diff)} vs un salaire équivalent, mais vous perdez en droits retraite.`;
    } else {
      commentaireSalaire = `⚠️ Un salaire serait plus avantageux financièrement (${currency(netSalaire)} vs ${currency(netPFU)}), et vous ouvrirait des droits sociaux.`;
    }

    return {
      pfu: {
        impot: pfuTotal,
        net: netPFU,
        detailIR: inputs.dividendesBruts * 0.142,
        detailPS: inputs.dividendesBruts * 0.172,
        commentaire: commentairePFU
      },
      bareme: {
        abattement: abattement40,
        baseImposable: baseBareme,
        ir: irBareme,
        ps: psBareme,
        total: totalBareme,
        net: netBareme,
        commentaire: commentaireBareme
      },
      ssi: {
        seuil: seuil10Pct,
        excedent: dividendesExcedentaires,
        cotisations: cotisSSI,
        commentaire: commentaireSSI
      },
      salaire: {
        brut: salaireBrutEquiv,
        cotisations: cotisationsSalaire,
        net: salaireNet,
        ir: irSalaire,
        netFinal: netSalaire,
        commentaire: commentaireSalaire
      },
      meilleur,
      economie
    };
  }, [inputs]);

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SIMULATION DIVIDENDES 2026', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text('PFU 31.4% vs Barème progressif • Loi de Finances 2026', pageWidth / 2, 30, { align: 'center' });
      pdf.text(`${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VOS DONNÉES', 20, 65);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      let y = 75;
      [
        `Dividendes bruts : ${currency(inputs.dividendesBruts)}`,
        `TMI : ${inputs.tmi}%`,
        `Parts fiscales : ${inputs.nbParts}`,
        `Structure : ${inputs.typeStructure}`,
        `Capital social : ${currency(inputs.capitalSocial)}`,
      ].forEach(h => { pdf.text(h, 25, y); y += 7; });

      y += 10;
      pdf.setFillColor(results.meilleur === 'PFU' ? 220 : 245, 252, 231);
      pdf.roundedRect(20, y - 5, 80, 30, 3, 3, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PFU (31.4%)', 25, y + 5);
      pdf.setFontSize(16);
      pdf.text(currency(results.pfu.net), 25, y + 18);

      pdf.setFillColor(results.meilleur === 'Barème' ? 220 : 245, 252, 231);
      pdf.roundedRect(110, y - 5, 80, 30, 3, 3, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Barème progressif', 115, y + 5);
      pdf.setFontSize(16);
      pdf.text(currency(results.bareme.net), 115, y + 18);

      y += 40;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Recommandation : ${results.meilleur} (économie de ${currency(results.economie)})`, 20, y);

      pdf.save(`dividendes-${Date.now()}.pdf`);
    } finally {
      setExportingPDF(false);
    }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const data = [
        ['SIMULATION DIVIDENDES 2026', ''],
        ['', ''],
        ['Dividendes bruts', inputs.dividendesBruts],
        ['TMI', inputs.tmi + '%'],
        ['Parts fiscales', inputs.nbParts],
        ['Structure', inputs.typeStructure],
        ['', ''],
        ['PFU (30%)', ''],
        ['Impôt total', results.pfu.impot],
        ['Net perçu', results.pfu.net],
        ['', ''],
        ['BARÈME PROGRESSIF', ''],
        ['Abattement 40%', results.bareme.abattement],
        ['Base imposable', results.bareme.baseImposable],
        ['IR', results.bareme.ir],
        ['PS 17.2%', results.bareme.ps],
        ['Net perçu', results.bareme.net],
        ['', ''],
        ['RECOMMANDATION', results.meilleur],
        ['Économie', results.economie],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Simulation');
      XLSX.writeFile(wb, `dividendes-${Date.now()}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Raleway', sans-serif; }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-6 font-medium">
          <ArrowLeft size={20} />Retour
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur Dividendes</h1>
          <p className="text-xl text-slate-600">PFU 31.4% vs Barème progressif • Loi de Finances 2026</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="p-6 bg-white shadow-xl sticky top-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="text-purple-600" size={24} />Configuration
            </h3>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Dividendes bruts (€)</Label>
                <Input type="number" value={inputs.dividendesBruts as any} onChange={(e) => setInputs({...inputs, dividendesBruts: Number(e.target.value) || 0})} className="h-12 text-lg font-bold" />
              </div>
              <div>
                <Label className="mb-2 block">TMI (%)</Label>
                <select value={inputs.tmi} onChange={(e) => setInputs({...inputs, tmi: Number(e.target.value)})} className="w-full h-12 px-3 rounded-md border font-semibold">
                  <option value={0}>0%</option>
                  <option value={11}>11%</option>
                  <option value={30}>30%</option>
                  <option value={41}>41%</option>
                  <option value={45}>45%</option>
                </select>
              </div>
              <div>
                <Label className="mb-2 block">Parts fiscales</Label>
                <Input type="number" step="0.5" value={inputs.nbParts as any} onChange={(e) => setInputs({...inputs, nbParts: Number(e.target.value) || 1})} className="h-12" />
              </div>
              <div>
                <Label className="mb-2 block">Structure</Label>
                <select value={inputs.typeStructure} onChange={(e) => setInputs({...inputs, typeStructure: e.target.value as any})} className="w-full h-12 px-3 rounded-md border font-semibold">
                  <option value="SASU">SASU</option>
                  <option value="EURL">EURL</option>
                </select>
              </div>
              {inputs.typeStructure === 'EURL' && (
                <div>
                  <Label className="mb-2 block">Capital social (€)</Label>
                  <Input type="number" value={inputs.capitalSocial as any} onChange={(e) => setInputs({...inputs, capitalSocial: Number(e.target.value) || 0})} className="h-12" />
                  <p className="text-xs text-slate-500 mt-1">Pour calcul cotisations SSI</p>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3">
              <Button onClick={exportToPDF} disabled={exportingPDF} className="w-full bg-red-600 hover:bg-red-700 h-12 font-bold">
                {exportingPDF ? 'PDF...' : <><FileText size={18} className="mr-2" />Export PDF</>}
              </Button>
              <Button onClick={exportToExcel} disabled={exportingExcel} className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold">
                {exportingExcel ? 'Excel...' : <><FileSpreadsheet size={18} className="mr-2" />Export Excel</>}
              </Button>
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className={`p-6 ${results.meilleur === 'PFU' ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 ring-2 ring-emerald-400' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">PFU (Flat Tax 31.4%)</h3>
                  {results.meilleur === 'PFU' && <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">OPTIMAL</span>}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500">IR (14.2%)</p>
                    <p className="font-bold text-red-600">-{currency(results.pfu.detailIR)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">PS (17.2%)</p>
                    <p className="font-bold text-red-600">-{currency(results.pfu.detailPS)}</p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-slate-500 uppercase font-bold">Net perçu</p>
                    <p className="text-4xl font-black text-emerald-600">{currency(results.pfu.net)}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-800">{results.pfu.commentaire}</p>
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${results.meilleur === 'Barème' ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 ring-2 ring-emerald-400' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Barème progressif</h3>
                  {results.meilleur === 'Barème' && <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">OPTIMAL</span>}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500">Abattement 40%</p>
                    <p className="font-bold text-green-600">+{currency(results.bareme.abattement)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">IR (après abattement)</p>
                    <p className="font-bold text-red-600">-{currency(results.bareme.ir)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">PS 17.2%</p>
                    <p className="font-bold text-red-600">-{currency(results.bareme.ps)}</p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-slate-500 uppercase font-bold">Net perçu</p>
                    <p className="text-4xl font-black text-emerald-600">{currency(results.bareme.net)}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-800">{results.bareme.commentaire}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Recommandation : {results.meilleur}</h3>
                  <p className="text-purple-100">Économie de {currency(results.economie)} par rapport à l'autre option</p>
                </div>
                <CheckCircle size={48} />
              </div>
            </Card>

            {inputs.typeStructure === 'EURL' && (
              <Card className="p-6 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-amber-900 mb-2">Cotisations SSI (EURL uniquement)</h3>
                    <p className="text-sm text-amber-800 mb-3">{results.ssi.commentaire}</p>
                    {results.ssi.cotisations > 0 && (
                      <div className="p-3 bg-white rounded">
                        <p className="text-xs text-slate-500">Cotisations SSI à payer</p>
                        <p className="text-2xl font-black text-amber-900">{currency(results.ssi.cotisations)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4">Comparaison avec un salaire équivalent</h3>
              <p className="text-sm text-slate-600 mb-4">{results.salaire.commentaire}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Salaire brut</p>
                  <p className="text-2xl font-bold">{currency(results.salaire.brut)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Cotisations</p>
                  <p className="text-2xl font-bold text-red-600">-{currency(results.salaire.cotisations)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">IR</p>
                  <p className="text-2xl font-bold text-red-600">-{currency(results.salaire.ir)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1 font-bold">Net final</p>
                  <p className="text-2xl font-black text-blue-900">{currency(results.salaire.netFinal)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-slate-100">
              <div className="flex items-start gap-3">
                <Info className="text-slate-500 flex-shrink-0" size={20} />
                <div className="text-xs text-slate-600">
                  <p className="font-bold mb-2">Méthodologie LF 2026 :</p>
                  <ul className="space-y-1">
                    <li>• <strong>PFU :</strong> Prélèvement forfaitaire unique de 31.4% (14.2% IR + 17.2% PS) - LF 2026</li>
                    <li>• <strong>Barème :</strong> Abattement de 40% + barème progressif de l'IR + PS 17.2%</li>
                    <li>• <strong>EURL :</strong> Dividendes {'>'} 10% du capital soumis à cotisations SSI (17.2% sur 90%)</li>
                    <li>• <strong>SASU :</strong> Pas de cotisations sociales sur les dividendes</li>
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