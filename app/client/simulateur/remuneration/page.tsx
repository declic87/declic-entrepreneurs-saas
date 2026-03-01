'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, FileText, FileSpreadsheet, ArrowLeft, Info, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function SimulateurRemuneration() {
  const [inputs, setInputs] = useState({
    benefice: 80000,
    pctSalaire: 60,
    typeStructure: 'SASU' as 'SASU' | 'EURL',
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const scenarios = useMemo(() => {
    return [0, 20, 40, 60, 80, 100].map(pct => {
      const salaireBrut = inputs.benefice * (pct / 100);
      const tresorerie = inputs.benefice * ((100 - pct) / 100);
      
      const tauxCotis = inputs.typeStructure === 'SASU' ? 0.80 : 0.45;
      const cotisations = salaireBrut * tauxCotis;
      const salaireNet = salaireBrut - cotisations;
      
      const droitsRetraite = inputs.typeStructure === 'SASU' 
        ? cotisations * 0.28 
        : cotisations * 0.35;
      
      const protectionSociale = inputs.typeStructure === 'SASU'
        ? 'Régime général (assimilé salarié)'
        : 'SSI (Travailleur non salarié)';

      let commentaire = '';
      if (pct === 0) {
        commentaire = '⚠️ Aucun salaire = pas de couverture sociale ni de droits retraite. À éviter.';
      } else if (pct === 100) {
        commentaire = '✅ Maximise vos droits retraite mais cotisations élevées. Pas de dividendes.';
      } else if (pct >= 60 && pct <= 80) {
        commentaire = '✅ Équilibre recommandé : bonne couverture sociale + trésorerie disponible.';
      } else if (pct < 40) {
        commentaire = '💡 Priorité à la trésorerie. Attention aux faibles droits retraite.';
      }

      return {
        pct,
        salaireBrut,
        cotisations,
        salaireNet,
        tresorerie,
        droitsRetraite,
        protectionSociale,
        commentaire,
        tauxCotis: tauxCotis * 100,
      };
    });
  }, [inputs]);

  const currentScenario = scenarios.find(s => s.pct === inputs.pctSalaire) || scenarios[3];

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(251, 146, 60);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RÉMUNÉRATION DIRIGEANT', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text('Optimisation salaire / trésorerie', pageWidth / 2, 30, { align: 'center' });
      pdf.text(`${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VOS DONNÉES', 20, 65);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      let y = 75;
      [
        `Bénéfice : ${currency(inputs.benefice)}`,
        `Structure : ${inputs.typeStructure}`,
        `Répartition choisie : ${inputs.pctSalaire}% salaire / ${100 - inputs.pctSalaire}% trésorerie`,
      ].forEach(h => { pdf.text(h, 25, y); y += 7; });

      y += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPARATIF 6 SCÉNARIOS', 20, y);
      
      y += 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Salaire', 22, y);
      pdf.text('Cotis', 60, y);
      pdf.text('Net', 90, y);
      pdf.text('Tréso', 120, y);
      pdf.text('Retraite', 155, y);
      
      pdf.setLineWidth(0.5);
      pdf.line(20, y + 2, pageWidth - 20, y + 2);
      
      y += 8;
      pdf.setFont('helvetica', 'normal');
      
      scenarios.forEach(s => {
        if (s.pct === inputs.pctSalaire) {
          pdf.setFillColor(255, 237, 213);
          pdf.rect(20, y - 5, pageWidth - 40, 7, 'F');
        }
        
        pdf.text(`${s.pct}%`, 22, y);
        pdf.text(currency(s.cotisations), 60, y);
        pdf.text(currency(s.salaireNet), 90, y);
        pdf.text(currency(s.tresorerie), 120, y);
        pdf.text(currency(s.droitsRetraite), 155, y);
        y += 7;
      });

      pdf.save(`remuneration-${Date.now()}.pdf`);
    } finally {
      setExportingPDF(false);
    }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const data = [
        ['RÉMUNÉRATION DIRIGEANT', ''],
        ['Date', new Date().toLocaleDateString('fr-FR')],
        ['', ''],
        ['Bénéfice', inputs.benefice],
        ['Structure', inputs.typeStructure],
        ['', ''],
        ['COMPARATIF SCÉNARIOS', '', '', '', '', ''],
        ['Salaire %', 'Salaire brut', 'Cotisations', 'Salaire net', 'Trésorerie', 'Droits retraite/an'],
        ...scenarios.map(s => [s.pct + '%', s.salaireBrut, s.cotisations, s.salaireNet, s.tresorerie, s.droitsRetraite])
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Scénarios');
      XLSX.writeFile(wb, `remuneration-${Date.now()}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Montserrat', sans-serif; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-6 font-medium">
          <ArrowLeft size={20} />Retour
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-3">Rémunération Dirigeant</h1>
          <p className="text-xl text-slate-600">Optimisation salaire / trésorerie</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <Card className="p-6 bg-white shadow-xl sticky top-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Wallet className="text-orange-600" size={24} />Config
            </h3>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Bénéfice (€)</Label>
                <Input type="number" value={inputs.benefice as any} onChange={(e) => setInputs({...inputs, benefice: Number(e.target.value) || 0})} className="h-12 text-lg font-bold" />
              </div>
              <div>
                <Label className="mb-2 block">Structure</Label>
                <select value={inputs.typeStructure} onChange={(e) => setInputs({...inputs, typeStructure: e.target.value as any})} className="w-full h-12 px-3 rounded-md border font-semibold">
                  <option value="SASU">SASU</option>
                  <option value="EURL">EURL</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Cotis: {inputs.typeStructure === 'SASU' ? '80%' : '45%'}
                </p>
              </div>
              <div>
                <Label className="mb-2 block">% Salaire: {inputs.pctSalaire}%</Label>
                <Input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="20" 
                  value={inputs.pctSalaire as any} 
                  onChange={(e) => setInputs({...inputs, pctSalaire: Number(e.target.value)})} 
                  className="w-full" 
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
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

          <div className="lg:col-span-4 space-y-6">
            <Card className="p-8 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
              <h3 className="text-2xl font-bold mb-6">Scénario actuel ({currentScenario.pct}% salaire)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Salaire net</p>
                  <p className="text-3xl font-black">{currency(currentScenario.salaireNet)}</p>
                </div>
                <div>
                  <p className="text-orange-100 text-sm mb-1">Trésorerie</p>
                  <p className="text-3xl font-black">{currency(currentScenario.tresorerie)}</p>
                </div>
                <div>
                  <p className="text-orange-100 text-sm mb-1">Cotisations</p>
                  <p className="text-3xl font-black">-{currency(currentScenario.cotisations)}</p>
                </div>
                <div>
                  <p className="text-orange-100 text-sm mb-1">Retraite/an</p>
                  <p className="text-3xl font-black">{currency(currentScenario.droitsRetraite)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">Analyse</h3>
                  <p className="text-blue-800 text-sm">{currentScenario.commentaire}</p>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              {scenarios.map(s => (
                <Card 
                  key={s.pct} 
                  className={`p-6 cursor-pointer transition-all ${
                    s.pct === inputs.pctSalaire 
                      ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 ring-2 ring-orange-400' 
                      : 'bg-white hover:border-orange-200'
                  }`}
                  onClick={() => setInputs({...inputs, pctSalaire: s.pct})}
                >
                  <h3 className="font-bold text-lg mb-4">{s.pct}% Salaire</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-500">Salaire brut</p>
                      <p className="font-bold">{currency(s.salaireBrut)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Cotisations</p>
                      <p className="font-bold text-red-600">-{currency(s.cotisations)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Salaire net</p>
                      <p className="font-bold text-emerald-600">{currency(s.salaireNet)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Trésorerie</p>
                      <p className="font-bold text-blue-600">{currency(s.tresorerie)}</p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-slate-500 text-xs">Droits retraite/an</p>
                      <p className="font-bold text-purple-600">{currency(s.droitsRetraite)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-orange-600" size={24} />
                Tableau comparatif
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-2">Scénario</th>
                      <th className="text-right py-3 px-2">Cotisations</th>
                      <th className="text-right py-3 px-2">Salaire net</th>
                      <th className="text-right py-3 px-2">Trésorerie</th>
                      <th className="text-right py-3 px-2">Retraite/an</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map(s => (
                      <tr 
                        key={s.pct} 
                        className={`border-b hover:bg-orange-50 cursor-pointer ${
                          s.pct === inputs.pctSalaire ? 'bg-orange-50 font-bold' : ''
                        }`}
                        onClick={() => setInputs({...inputs, pctSalaire: s.pct})}
                      >
                        <td className="py-3 px-2">{s.pct}% Salaire</td>
                        <td className="text-right text-red-600">{currency(s.cotisations)}</td>
                        <td className="text-right text-emerald-600">{currency(s.salaireNet)}</td>
                        <td className="text-right text-blue-600">{currency(s.tresorerie)}</td>
                        <td className="text-right text-purple-600">{currency(s.droitsRetraite)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6 bg-amber-50 border-amber-200">
              <h3 className="font-bold text-amber-900 mb-3">À savoir :</h3>
              <ul className="space-y-2 text-sm text-amber-800">
                <li>• <strong>SASU :</strong> Cotisations 80% mais protection complète (régime général)</li>
                <li>• <strong>EURL :</strong> Cotisations 45% mais protection SSI (moins complète)</li>
                <li>• <strong>Retraite :</strong> Plus vous cotisez, plus vos droits sont élevés</li>
                <li>• <strong>Trésorerie :</strong> Permet de distribuer des dividendes ou réinvestir</li>
                <li>• <strong>Optimum :</strong> 60-80% salaire = bon équilibre cotis/tréso/retraite</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}