'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket, FileText, FileSpreadsheet, ArrowLeft, Info, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function SimulateurACRE() {
  const [inputs, setInputs] = useState({
    ca: 40000,
    typeActivite: 'micro' as 'micro' | 'societe',
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const results = useMemo(() => {
    const annees = [];
    
    for (let annee = 1; annee <= 4; annee++) {
      let tauxCotisations = 0;
      let exoneration = 0;
      
      if (inputs.typeActivite === 'micro') {
        // Micro-entreprise : ACRE = 50% d'exonération année 1
        if (annee === 1) {
          tauxCotisations = 0.11; // 50% de 22%
          exoneration = inputs.ca * (0.22 - 0.11);
        } else {
          tauxCotisations = 0.22;
          exoneration = 0;
        }
      } else {
        // Société : exonération dégressive sur 3 ans
        if (annee === 1) {
          tauxCotisations = 0.225; // 50% d'exonération sur base 45%
          exoneration = inputs.ca * (0.45 - 0.225);
        } else if (annee === 2) {
          tauxCotisations = 0.3375; // 25% d'exonération
          exoneration = inputs.ca * (0.45 - 0.3375);
        } else if (annee === 3) {
          tauxCotisations = 0.39375; // 12.5% d'exonération
          exoneration = inputs.ca * (0.45 - 0.39375);
        } else {
          tauxCotisations = 0.45;
          exoneration = 0;
        }
      }
      
      const cotisations = Math.round(inputs.ca * tauxCotisations);
      const netDisponible = inputs.ca - cotisations;
      
      annees.push({
        annee,
        tauxCotisations: (tauxCotisations * 100).toFixed(1),
        cotisations,
        exoneration: Math.round(exoneration),
        netDisponible,
        tauxExoneration: annee === 1 ? 50 : annee === 2 ? 25 : annee === 3 ? 12.5 : 0
      });
    }
    
    const economieTotal = annees.reduce((sum, a) => sum + a.exoneration, 0);
    const cotisationsSansACRE = annees.reduce((sum, a) => 
      sum + (inputs.typeActivite === 'micro' ? inputs.ca * 0.22 : inputs.ca * 0.45), 0
    );
    const cotisationsAvecACRE = annees.reduce((sum, a) => sum + a.cotisations, 0);
    const tauxEconomie = ((economieTotal / cotisationsSansACRE) * 100).toFixed(1);

    let commentaire = '';
    if (inputs.typeActivite === 'micro') {
      commentaire = '✅ En micro-entreprise, l\'ACRE vous offre 50% de réduction sur l\'année 1. Économie immédiate sur vos cotisations !';
    } else {
      commentaire = '✅ En société, l\'ACRE est dégressive sur 3 ans (50% / 25% / 12.5%). Accompagnement progressif vers le régime normal.';
    }

    return {
      annees,
      economieTotal,
      cotisationsSansACRE,
      cotisationsAvecACRE,
      tauxEconomie,
      commentaire
    };
  }, [inputs]);

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(16, 185, 129);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SIMULATEUR ACRE 2026', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text('Aide à la Création ou Reprise d\'Entreprise', pageWidth / 2, 30, { align: 'center' });
      pdf.text(`${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VOS DONNÉES', 20, 65);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      let y = 75;
      [
        `CA annuel : ${currency(inputs.ca)}`,
        `Type : ${inputs.typeActivite === 'micro' ? 'Micro-entreprise' : 'Société'}`,
      ].forEach(h => { pdf.text(h, 25, y); y += 7; });

      y += 10;
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(20, y - 5, pageWidth - 40, 25, 3, 3, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ÉCONOMIE TOTALE ACRE', 25, y + 5);
      pdf.setFontSize(20);
      pdf.text(currency(results.economieTotal), 25, y + 15);

      y += 35;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROJECTION 4 ANS', 20, y);
      
      y += 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Année', 22, y);
      pdf.text('Taux', 60, y);
      pdf.text('Cotisations', 100, y);
      pdf.text('Exonération', 145, y);
      
      pdf.setLineWidth(0.5);
      pdf.line(20, y + 2, pageWidth - 20, y + 2);
      
      y += 8;
      pdf.setFont('helvetica', 'normal');
      
      results.annees.forEach(a => {
        if (a.annee === 1) {
          pdf.setFillColor(220, 252, 231);
          pdf.rect(20, y - 5, pageWidth - 40, 7, 'F');
        }
        
        pdf.text(`Année ${a.annee}`, 22, y);
        pdf.text(`${a.tauxCotisations}%`, 60, y);
        pdf.text(currency(a.cotisations), 100, y);
        pdf.setFont('helvetica', 'bold');
        pdf.text(a.exoneration > 0 ? currency(a.exoneration) : '-', 145, y);
        pdf.setFont('helvetica', 'normal');
        y += 7;
      });

      pdf.save(`acre-${Date.now()}.pdf`);
    } finally {
      setExportingPDF(false);
    }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const data = [
        ['SIMULATEUR ACRE 2026', ''],
        ['', ''],
        ['CA annuel', inputs.ca],
        ['Type', inputs.typeActivite === 'micro' ? 'Micro-entreprise' : 'Société'],
        ['', ''],
        ['PROJECTION 4 ANS', '', '', ''],
        ['Année', 'Taux cotis', 'Cotisations', 'Exonération', 'Net disponible'],
        ...results.annees.map(a => [a.annee, a.tauxCotisations + '%', a.cotisations, a.exoneration, a.netDisponible]),
        ['', '', '', '', ''],
        ['ÉCONOMIE TOTALE', '', '', results.economieTotal, ''],
        ['Taux économie', '', '', results.tauxEconomie + '%', ''],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'ACRE');
      XLSX.writeFile(wb, `acre-${Date.now()}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Rubik', sans-serif; }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 mb-6 font-medium">
          <ArrowLeft size={20} />Retour
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur ACRE</h1>
          <p className="text-xl text-slate-600">Aide à la Création ou Reprise d'Entreprise • LFSS 2026</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="p-6 bg-white shadow-xl sticky top-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Rocket className="text-green-600" size={24} />Config
            </h3>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">CA annuel (€)</Label>
                <Input type="number" value={inputs.ca as any} onChange={(e) => setInputs({...inputs, ca: Number(e.target.value) || 0})} className="h-12 text-lg font-bold" />
              </div>
              <div>
                <Label className="mb-2 block">Type d'activité</Label>
                <select value={inputs.typeActivite} onChange={(e) => setInputs({...inputs, typeActivite: e.target.value as any})} className="w-full h-12 px-3 rounded-md border font-semibold">
                  <option value="micro">Micro-entreprise</option>
                  <option value="societe">Société (SASU/EURL)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {inputs.typeActivite === 'micro' ? '1 an (50%)' : '3 ans dégressif'}
                </p>
              </div>

              <Card className="p-4 bg-green-50 border-green-200 mt-6">
                <p className="text-xs text-green-700 mb-1">Économie totale</p>
                <p className="text-3xl font-black text-green-900">{currency(results.economieTotal)}</p>
                <p className="text-xs text-green-700 mt-1">soit {results.tauxEconomie}% d'économie</p>
              </Card>
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
            <Card className="p-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-green-100 text-sm mb-2">Économie ACRE</p>
                  <p className="text-5xl font-black mb-2">{currency(results.economieTotal)}</p>
                  <p className="text-green-100">Sur 4 ans</p>
                </div>
                <div>
                  <p className="text-green-100 text-sm mb-2">Économie année 1</p>
                  <p className="text-5xl font-black mb-2">{currency(results.annees[0].exoneration)}</p>
                  <p className="text-green-100">{results.annees[0].tauxExoneration}% de réduction</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">Comment ça marche ?</h3>
                  <p className="text-blue-800 text-sm">{results.commentaire}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="text-green-600" size={24} />
                Projection 4 ans
              </h3>
              <div className="space-y-3">
                {results.annees.map((a) => (
                  <div 
                    key={a.annee} 
                    className={`p-4 rounded-lg border-2 ${
                      a.annee === 1 
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${
                          a.annee === 1 ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {a.annee}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">Année {a.annee}</h4>
                          <p className="text-xs text-slate-500">Taux cotisations : {a.tauxCotisations}%</p>
                        </div>
                      </div>
                      {a.tauxExoneration > 0 && (
                        <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                          -{a.tauxExoneration}%
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Cotisations</p>
                        <p className="text-lg font-bold text-red-600">-{currency(a.cotisations)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Exonération</p>
                        <p className={`text-lg font-bold ${a.exoneration > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                          {a.exoneration > 0 ? currency(a.exoneration) : 'Aucune'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Net disponible</p>
                        <p className="text-lg font-bold text-emerald-600">{currency(a.netDisponible)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-green-600" size={24} />
                Comparaison avec/sans ACRE
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-700 font-bold mb-2">SANS ACRE</p>
                  <p className="text-3xl font-black text-red-900 mb-1">{currency(results.cotisationsSansACRE)}</p>
                  <p className="text-xs text-red-700">Cotisations totales 4 ans</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 font-bold mb-2">AVEC ACRE</p>
                  <p className="text-3xl font-black text-green-900 mb-1">{currency(results.cotisationsAvecACRE)}</p>
                  <p className="text-xs text-green-700">Cotisations totales 4 ans</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-amber-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-amber-900 mb-3">Conditions d'éligibilité ACRE 2026</h3>
                  <ul className="space-y-2 text-sm text-amber-800">
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Demandeurs d'emploi</strong> indemnisés ou non indemnisés depuis plus de 6 mois</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Bénéficiaires du RSA, ASS, ATA</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Jeunes de 18 à 25 ans</strong> (ou jusqu'à 29 ans pour les personnes reconnues handicapées)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Salariés repreneurs</strong> d'une entreprise en difficulté</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Bénéficiaires du CAPE</strong> (Contrat d'Appui au Projet d'Entreprise)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✓</span>
                      <span><strong>Créateurs/repreneurs en QPV</strong> (Quartier Prioritaire de la Politique de la Ville)</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-xs text-amber-900 font-bold">
                    ⚠️ Demande à faire dans les 45 jours suivant la création/reprise de l'entreprise
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-slate-100">
              <div className="flex items-start gap-3">
                <Info className="text-slate-500 flex-shrink-0" size={20} />
                <div className="text-xs text-slate-600">
                  <p className="font-bold mb-2">Calcul ACRE 2026 :</p>
                  <ul className="space-y-1">
                    <li>• <strong>Micro-entreprise :</strong> 50% d'exonération pendant 1 an (taux ramené à 11% au lieu de 22%)</li>
                    <li>• <strong>Société :</strong> Exonération dégressive sur 3 ans (50% / 25% / 12.5%)</li>
                    <li>• <strong>Plafond :</strong> Exonération totale jusqu'à 32 994€ de revenus (1 PASS 2026)</li>
                    <li>• <strong>Entre 32 994€ et 43 992€ :</strong> Exonération dégressive</li>
                    <li>• <strong>Au-delà de 43 992€ :</strong> Pas d'exonération</li>
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