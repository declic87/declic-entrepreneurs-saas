'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, FileText, FileSpreadsheet, ArrowLeft, Info, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function SimulateurRentabilite() {
  const [inputs, setInputs] = useState({
    chargesFixes: 3000,
    tauxMarge: 60,
    objectifSalaire: 2500,
    objectifBenefice: 5000,
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const results = useMemo(() => {
    // POINT MORT (couvrir charges fixes uniquement)
    const pointMort = inputs.chargesFixes / (inputs.tauxMarge / 100);
    
    // CA OBJECTIF SALAIRE
    const caObjectifSalaire = (inputs.chargesFixes + inputs.objectifSalaire) / (inputs.tauxMarge / 100);
    const margeContribSalaire = caObjectifSalaire * (inputs.tauxMarge / 100);
    const resultatSalaire = margeContribSalaire - inputs.chargesFixes;
    
    // CA OBJECTIF BÉNÉFICE
    const caObjectifBenefice = (inputs.chargesFixes + inputs.objectifBenefice) / (inputs.tauxMarge / 100);
    const margeContribBenefice = caObjectifBenefice * (inputs.tauxMarge / 100);
    
    // ANALYSE PAR NIVEAUX DE CA
    const scenarios = [0.5, 0.75, 1, 1.25, 1.5, 2].map(multiplicateur => {
      const ca = pointMort * multiplicateur;
      const margeContribution = ca * (inputs.tauxMarge / 100);
      const resultat = margeContribution - inputs.chargesFixes;
      const tauxRentabilite = (resultat / ca) * 100;
      
      let statut = '';
      if (resultat < 0) statut = 'Perte';
      else if (resultat === 0) statut = 'Équilibre';
      else if (resultat < inputs.objectifSalaire) statut = 'Bénéfice faible';
      else if (resultat < inputs.objectifBenefice) statut = 'Objectif partiel';
      else statut = 'Objectif atteint';
      
      return {
        multiplicateur,
        ca,
        margeContribution,
        chargesFixes: inputs.chargesFixes,
        resultat,
        tauxRentabilite,
        statut
      };
    });

    // COMMENTAIRES
    let commentairePointMort = '';
    if (inputs.tauxMarge >= 70) {
      commentairePointMort = `✅ Excellent taux de marge (${inputs.tauxMarge}%). Point mort facilement atteignable.`;
    } else if (inputs.tauxMarge >= 50) {
      commentairePointMort = `💡 Bon taux de marge (${inputs.tauxMarge}%). Seuil de rentabilité raisonnable.`;
    } else {
      commentairePointMort = `⚠️ Marge faible (${inputs.tauxMarge}%). Point mort élevé, attention à la viabilité.`;
    }

    let commentaireSalaire = '';
    if (caObjectifSalaire < pointMort * 1.5) {
      commentaireSalaire = `✅ Objectif salaire atteignable rapidement (${((caObjectifSalaire / pointMort) * 100 - 100).toFixed(0)}% au-dessus du point mort).`;
    } else if (caObjectifSalaire < pointMort * 2) {
      commentaireSalaire = `💡 Objectif salaire nécessite +${((caObjectifSalaire / pointMort) * 100 - 100).toFixed(0)}% de CA vs point mort. Réaliste avec effort commercial.`;
    } else {
      commentaireSalaire = `⚠️ Objectif salaire ambitieux (${((caObjectifSalaire / pointMort) * 100 - 100).toFixed(0)}% au-dessus du point mort). Revoyez vos charges ou votre marge.`;
    }

    return {
      pointMort: {
        ca: pointMort,
        commentaire: commentairePointMort
      },
      objectifSalaire: {
        ca: caObjectifSalaire,
        margeContribution: margeContribSalaire,
        resultat: resultatSalaire,
        commentaire: commentaireSalaire
      },
      objectifBenefice: {
        ca: caObjectifBenefice,
        margeContribution: margeContribBenefice
      },
      scenarios
    };
  }, [inputs]);

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(245, 158, 11);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('POINT MORT & RENTABILITÉ', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text('Seuil de rentabilité • CA objectif', pageWidth / 2, 30, { align: 'center' });
      pdf.text(`${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VOS DONNÉES', 20, 65);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      let y = 75;
      [
        `Charges fixes : ${currency(inputs.chargesFixes)}/mois`,
        `Taux marge : ${inputs.tauxMarge}%`,
        `Objectif salaire : ${currency(inputs.objectifSalaire)}/mois`,
        `Objectif bénéfice : ${currency(inputs.objectifBenefice)}/mois`,
      ].forEach(h => { pdf.text(h, 25, y); y += 7; });

      y += 10;
      pdf.setFillColor(255, 237, 213);
      pdf.roundedRect(20, y - 5, pageWidth - 40, 25, 3, 3, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('POINT MORT MENSUEL', 25, y + 5);
      pdf.setFontSize(20);
      pdf.text(currency(results.pointMort.ca), 25, y + 15);

      y += 35;
      pdf.setFontSize(12);
      pdf.text('CA OBJECTIF SALAIRE', 25, y);
      pdf.setFontSize(16);
      pdf.text(currency(results.objectifSalaire.ca), 25, y + 10);

      pdf.save(`rentabilite-${Date.now()}.pdf`);
    } finally {
      setExportingPDF(false);
    }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const data = [
        ['POINT MORT & RENTABILITÉ', ''],
        ['', ''],
        ['Charges fixes', inputs.chargesFixes],
        ['Taux marge', inputs.tauxMarge + '%'],
        ['', ''],
        ['RÉSULTATS', ''],
        ['Point mort mensuel', results.pointMort.ca],
        ['CA objectif salaire', results.objectifSalaire.ca],
        ['CA objectif bénéfice', results.objectifBenefice.ca],
        ['', ''],
        ['SCÉNARIOS', '', '', ''],
        ['Multiplicateur', 'CA', 'Résultat', 'Statut'],
        ...results.scenarios.map(s => [s.multiplicateur + 'x', s.ca, s.resultat, s.statut])
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Rentabilité');
      XLSX.writeFile(wb, `rentabilite-${Date.now()}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Lexend', sans-serif; }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-6 font-medium">
          <ArrowLeft size={20} />Retour
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-3">Point Mort & Rentabilité</h1>
          <p className="text-xl text-slate-600">Seuil de rentabilité • CA objectif • Analyse marge</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="p-6 bg-white shadow-xl sticky top-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Target className="text-orange-600" size={24} />Config
            </h3>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Charges fixes/mois (€)</Label>
                <Input type="number" value={inputs.chargesFixes as any} onChange={(e) => setInputs({...inputs, chargesFixes: Number(e.target.value) || 0})} className="h-12 text-lg font-bold" />
                <p className="text-xs text-slate-500 mt-1">Loyer, assurances, salaires fixes...</p>
              </div>
              <div>
                <Label className="mb-2 block">Taux de marge (%)</Label>
                <Input type="number" value={inputs.tauxMarge as any} onChange={(e) => setInputs({...inputs, tauxMarge: Number(e.target.value) || 0})} className="h-12 text-lg" />
                <p className="text-xs text-slate-500 mt-1">Service : 70-100% • Négoce : 30-50%</p>
              </div>
              <div>
                <Label className="mb-2 block">Objectif salaire/mois (€)</Label>
                <Input type="number" value={inputs.objectifSalaire as any} onChange={(e) => setInputs({...inputs, objectifSalaire: Number(e.target.value) || 0})} className="h-12 text-lg" />
              </div>
              <div>
                <Label className="mb-2 block">Objectif bénéfice/mois (€)</Label>
                <Input type="number" value={inputs.objectifBenefice as any} onChange={(e) => setInputs({...inputs, objectifBenefice: Number(e.target.value) || 0})} className="h-12 text-lg" />
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

          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <p className="text-orange-100 text-sm mb-2">Point mort mensuel</p>
              <p className="text-6xl font-black mb-4">{currency(results.pointMort.ca)}</p>
              <p className="text-orange-100">CA minimum pour couvrir les charges fixes</p>
            </Card>

            <Card className="p-6 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-3">
                <Info className="text-amber-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-amber-900 mb-2">Analyse point mort</h3>
                  <p className="text-amber-800 text-sm">{results.pointMort.commentaire}</p>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Target className="text-blue-600" size={20} />
                  CA objectif salaire
                </h3>
                <p className="text-4xl font-black text-blue-600 mb-4">{currency(results.objectifSalaire.ca)}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Marge contribution</span>
                    <span className="font-bold">{currency(results.objectifSalaire.margeContribution)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Charges fixes</span>
                    <span className="font-bold text-red-600">-{currency(inputs.chargesFixes)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold">Disponible</span>
                    <span className="font-bold text-emerald-600">{currency(results.objectifSalaire.resultat)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-purple-600" size={20} />
                  CA objectif bénéfice
                </h3>
                <p className="text-4xl font-black text-purple-600 mb-4">{currency(results.objectifBenefice.ca)}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Marge contribution</span>
                    <span className="font-bold">{currency(results.objectifBenefice.margeContribution)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Charges fixes</span>
                    <span className="font-bold text-red-600">-{currency(inputs.chargesFixes)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold">Bénéfice</span>
                    <span className="font-bold text-emerald-600">{currency(inputs.objectifBenefice)}</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">Objectif salaire</h3>
                  <p className="text-blue-800 text-sm">{results.objectifSalaire.commentaire}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4">Scénarios par niveau de CA</h3>
              <div className="space-y-3">
                {results.scenarios.map((s) => {
                  let bgColor = 'bg-red-50 border-red-200';
                  let textColor = 'text-red-900';
                  if (s.statut === 'Objectif atteint') { bgColor = 'bg-emerald-50 border-emerald-200'; textColor = 'text-emerald-900'; }
                  else if (s.statut === 'Objectif partiel') { bgColor = 'bg-blue-50 border-blue-200'; textColor = 'text-blue-900'; }
                  else if (s.statut === 'Bénéfice faible') { bgColor = 'bg-amber-50 border-amber-200'; textColor = 'text-amber-900'; }
                  else if (s.statut === 'Équilibre') { bgColor = 'bg-slate-100 border-slate-300'; textColor = 'text-slate-900'; }
                  
                  return (
                    <div key={s.multiplicateur} className={`p-4 rounded-lg border-2 ${bgColor}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-slate-900">CA : {currency(s.ca)} <span className="text-sm font-normal text-slate-500">({s.multiplicateur}x point mort)</span></p>
                          <p className="text-xs text-slate-600">Marge : {currency(s.margeContribution)} • Charges : {currency(s.chargesFixes)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${textColor} ${bgColor}`}>
                          {s.statut}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500">Résultat</p>
                          <p className={`text-2xl font-black ${s.resultat >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {currency(s.resultat)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Taux rentabilité</p>
                          <p className="text-2xl font-black text-slate-900">{s.tauxRentabilite.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 bg-slate-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-slate-500 flex-shrink-0" size={20} />
                <div className="text-xs text-slate-600">
                  <p className="font-bold mb-2">Formules de calcul :</p>
                  <ul className="space-y-1">
                    <li>• <strong>Point mort :</strong> Charges fixes ÷ Taux de marge</li>
                    <li>• <strong>Marge de contribution :</strong> CA × Taux de marge</li>
                    <li>• <strong>Résultat :</strong> Marge de contribution - Charges fixes</li>
                    <li>• <strong>CA objectif :</strong> (Charges fixes + Objectif) ÷ Taux de marge</li>
                    <li>• <strong>Taux rentabilité :</strong> (Résultat ÷ CA) × 100</li>
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