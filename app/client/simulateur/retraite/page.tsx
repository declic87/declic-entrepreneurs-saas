'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, FileText, FileSpreadsheet, ArrowLeft, Info, TrendingUp, Calendar, Award } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const SMIC_ANNUEL_2026 = 21203;

export default function SimulateurRetraite() {
  const [inputs, setInputs] = useState({
    salaireBrutAnnuel: 30000,
    anneeNaissance: 1990,
    typeStatut: 'assimile' as 'assimile' | 'tns',
    nbAnneesActivite: 35,
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const results = useMemo(() => {
    // VALIDATION TRIMESTRES
    const seuilTrimestre = SMIC_ANNUEL_2026 * 0.25; // ~5301€
    const trimestresValides = Math.min(4, Math.floor(inputs.salaireBrutAnnuel / seuilTrimestre));
    
    let commentaireTrimestres = '';
    if (trimestresValides === 4) {
      commentaireTrimestres = '✅ Vous validez les 4 trimestres maximum. Parfait pour votre retraite !';
    } else if (trimestresValides >= 2) {
      commentaireTrimestres = `💡 Vous validez ${trimestresValides} trimestres sur 4. Pour valider les 4, il faut gagner ${currency(SMIC_ANNUEL_2026)} minimum/an.`;
    } else {
      commentaireTrimestres = `⚠️ Seulement ${trimestresValides} trimestre(s) validé(s). Insuffisant pour une bonne retraite. Augmentez votre rémunération à ${currency(SMIC_ANNUEL_2026)} minimum.`;
    }

    // ÂGE DE DÉPART
    const AGE_LEGAL_2026 = 64;
    const TRIMESTRES_REQUIS_2026 = 172; // 43 ans
    const trimestresTotal = trimestresValides * inputs.nbAnneesActivite;
    const anneesManquantes = Math.max(0, Math.ceil((TRIMESTRES_REQUIS_2026 - trimestresTotal) / 4));
    const ageDepartEffectif = Math.max(AGE_LEGAL_2026, inputs.anneeNaissance + AGE_LEGAL_2026);
    const ageDepartTauxPlein = ageDepartEffectif + anneesManquantes;

    let commentaireAge = '';
    if (trimestresTotal >= TRIMESTRES_REQUIS_2026) {
      commentaireAge = `✅ Avec ${inputs.nbAnneesActivite} ans de carrière, vous aurez ${trimestresTotal} trimestres. Retraite à taux plein à ${AGE_LEGAL_2026} ans !`;
    } else {
      commentaireAge = `💡 Il vous manque ${TRIMESTRES_REQUIS_2026 - trimestresTotal} trimestres (${anneesManquantes} ans) pour le taux plein. Départ possible à ${ageDepartTauxPlein} ans.`;
    }

    // POINTS RETRAITE (estimation)
    let pointsAnnuels = 0;
    let typeRegime = '';
    let pensionEstimee = 0;

    if (inputs.typeStatut === 'assimile') {
      // Assimilé salarié : AGIRC-ARRCO
      typeRegime = 'AGIRC-ARRCO (Régime général)';
      const salaireBrut = inputs.salaireBrutAnnuel;
      const tauxAcquisition = 0.2743; // Points AGIRC-ARRCO 2026
      const prixAchat = 18.7726; // Prix d'achat point 2026
      pointsAnnuels = (salaireBrut * tauxAcquisition) / prixAchat;
      const pointsTotal = pointsAnnuels * inputs.nbAnneesActivite;
      const valeurPoint2026 = 1.4159; // Valeur point AGIRC-ARRCO
      pensionEstimee = pointsTotal * valeurPoint2026 * 12;
    } else {
      // TNS : Régime de base + complémentaire
      typeRegime = 'SSI (Base + Complémentaire RCI)';
      const revenu = inputs.salaireBrutAnnuel;
      // Base : environ 0.55 points par € cotisé
      const cotisBase = revenu * 0.176;
      const pointsBase = cotisBase * 0.55;
      // Complémentaire RCI
      const cotisCompl = revenu * 0.07;
      const pointsCompl = cotisCompl * 1;
      pointsAnnuels = pointsBase + pointsCompl;
      const pointsTotal = pointsAnnuels * inputs.nbAnneesActivite;
      const valeurPointBase = 0.6155;
      const valeurPointRCI = 1.2588;
      pensionEstimee = ((pointsBase * inputs.nbAnneesActivite * valeurPointBase) + (pointsCompl * inputs.nbAnneesActivite * valeurPointRCI)) * 12;
    }

    const tauxRemplacement = (pensionEstimee / inputs.salaireBrutAnnuel) * 100;

    let commentairePension = '';
    if (tauxRemplacement >= 70) {
      commentairePension = `✅ Excellent taux de remplacement (${tauxRemplacement.toFixed(0)}%). Votre retraite sera confortable.`;
    } else if (tauxRemplacement >= 50) {
      commentairePension = `💡 Taux de remplacement correct (${tauxRemplacement.toFixed(0)}%). Pensez à compléter avec épargne privée.`;
    } else {
      commentairePension = `⚠️ Taux de remplacement faible (${tauxRemplacement.toFixed(0)}%). Prévoyez impérativement une épargne retraite complémentaire.`;
    }

    // COMPARATIF TNS vs ASSIMILÉ
    const comparatif = {
      assimile: {
        cotisations: inputs.salaireBrutAnnuel * 0.28,
        pointsAnnuels: (inputs.salaireBrutAnnuel * 0.2743) / 18.7726,
        pension: ((inputs.salaireBrutAnnuel * 0.2743) / 18.7726) * inputs.nbAnneesActivite * 1.4159 * 12
      },
      tns: {
        cotisations: inputs.salaireBrutAnnuel * 0.176 + inputs.salaireBrutAnnuel * 0.07,
        pointsAnnuels: (inputs.salaireBrutAnnuel * 0.176 * 0.55) + (inputs.salaireBrutAnnuel * 0.07 * 1),
        pension: ((inputs.salaireBrutAnnuel * 0.176 * 0.55) * inputs.nbAnneesActivite * 0.6155 + (inputs.salaireBrutAnnuel * 0.07 * 1) * inputs.nbAnneesActivite * 1.2588) * 12
      }
    };

    return {
      trimestres: {
        seuilTrimestre,
        valides: trimestresValides,
        total: trimestresTotal,
        requis: TRIMESTRES_REQUIS_2026,
        manquants: Math.max(0, TRIMESTRES_REQUIS_2026 - trimestresTotal),
        commentaire: commentaireTrimestres
      },
      age: {
        legal: AGE_LEGAL_2026,
        departEffectif: ageDepartEffectif,
        tauxPlein: ageDepartTauxPlein,
        anneesManquantes,
        commentaire: commentaireAge
      },
      points: {
        annuels: pointsAnnuels,
        total: pointsAnnuels * inputs.nbAnneesActivite,
        regime: typeRegime
      },
      pension: {
        mensuelle: pensionEstimee / 12,
        annuelle: pensionEstimee,
        tauxRemplacement,
        commentaire: commentairePension
      },
      comparatif
    };
  }, [inputs]);

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(99, 102, 241);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SIMULATION RETRAITE 2026', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text('Validation trimestres • Âge départ • Pension estimée', pageWidth / 2, 30, { align: 'center' });
      pdf.text(`${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VOS DONNÉES', 20, 65);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      let y = 75;
      [
        `Salaire brut annuel : ${currency(inputs.salaireBrutAnnuel)}`,
        `Année naissance : ${inputs.anneeNaissance}`,
        `Statut : ${inputs.typeStatut === 'assimile' ? 'Assimilé salarié' : 'TNS'}`,
        `Années d'activité : ${inputs.nbAnneesActivite}`,
      ].forEach(h => { pdf.text(h, 25, y); y += 7; });

      y += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RÉSULTATS', 20, y);
      
      y += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Trimestres validés/an : ${results.trimestres.valides}`, 25, y);
      y += 7;
      pdf.text(`Âge départ taux plein : ${results.age.tauxPlein} ans`, 25, y);
      y += 7;
      pdf.text(`Pension mensuelle estimée : ${currency(results.pension.mensuelle)}`, 25, y);

      pdf.save(`retraite-${Date.now()}.pdf`);
    } finally {
      setExportingPDF(false);
    }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const data = [
        ['SIMULATION RETRAITE 2026', ''],
        ['', ''],
        ['Salaire brut annuel', inputs.salaireBrutAnnuel],
        ['Année naissance', inputs.anneeNaissance],
        ['Statut', inputs.typeStatut === 'assimile' ? 'Assimilé salarié' : 'TNS'],
        ['Années activité', inputs.nbAnneesActivite],
        ['', ''],
        ['TRIMESTRES', ''],
        ['Validés/an', results.trimestres.valides],
        ['Total carrière', results.trimestres.total],
        ['Requis taux plein', results.trimestres.requis],
        ['', ''],
        ['ÂGE DÉPART', ''],
        ['Âge légal', results.age.legal],
        ['Départ taux plein', results.age.tauxPlein],
        ['', ''],
        ['PENSION', ''],
        ['Mensuelle', results.pension.mensuelle],
        ['Annuelle', results.pension.annuelle],
        ['Taux remplacement', results.pension.tauxRemplacement.toFixed(1) + '%'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Retraite');
      XLSX.writeFile(wb, `retraite-${Date.now()}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Archivo', sans-serif; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 font-medium">
          <ArrowLeft size={20} />Retour
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur Retraite</h1>
          <p className="text-xl text-slate-600">Validation trimestres • Âge départ • Pension estimée</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="p-6 bg-white shadow-xl sticky top-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="text-indigo-600" size={24} />Config
            </h3>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Salaire brut annuel (€)</Label>
                <Input type="number" value={inputs.salaireBrutAnnuel as any} onChange={(e) => setInputs({...inputs, salaireBrutAnnuel: Number(e.target.value) || 0})} className="h-12 text-lg font-bold" />
                <p className="text-xs text-slate-500 mt-1">
                  Seuil validation : {currency(results.trimestres.seuilTrimestre)}/trimestre
                </p>
              </div>
              <div>
                <Label className="mb-2 block">Année de naissance</Label>
                <Input type="number" value={inputs.anneeNaissance as any} onChange={(e) => setInputs({...inputs, anneeNaissance: Number(e.target.value) || 1990})} className="h-12" />
              </div>
              <div>
                <Label className="mb-2 block">Statut</Label>
                <select value={inputs.typeStatut} onChange={(e) => setInputs({...inputs, typeStatut: e.target.value as any})} className="w-full h-12 px-3 rounded-md border font-semibold">
                  <option value="assimile">Assimilé salarié (SASU)</option>
                  <option value="tns">TNS (EURL/Micro)</option>
                </select>
              </div>
              <div>
                <Label className="mb-2 block">Années d'activité prévues</Label>
                <Input type="number" value={inputs.nbAnneesActivite as any} onChange={(e) => setInputs({...inputs, nbAnneesActivite: Number(e.target.value) || 0})} className="h-12" />
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
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6 bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
                <p className="text-indigo-100 text-sm mb-2">Trimestres/an</p>
                <p className="text-6xl font-black">{results.trimestres.valides}</p>
                <p className="text-indigo-100 mt-2">sur 4 maximum</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                <p className="text-purple-100 text-sm mb-2">Départ taux plein</p>
                <p className="text-6xl font-black">{results.age.tauxPlein}</p>
                <p className="text-purple-100 mt-2">ans</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-cyan-600 to-blue-600 text-white">
                <p className="text-cyan-100 text-sm mb-2">Pension/mois</p>
                <p className="text-3xl font-black">{currency(results.pension.mensuelle)}</p>
                <p className="text-cyan-100 mt-2">{results.pension.tauxRemplacement.toFixed(0)}% remplacement</p>
              </Card>
            </div>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">Analyse trimestres</h3>
                  <p className="text-blue-800 text-sm">{results.trimestres.commentaire}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="text-indigo-600" size={24} />
                Validation des trimestres
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold">Seuil par trimestre (SMIC 2026)</p>
                    <p className="text-2xl font-black text-indigo-600">{currency(results.trimestres.seuilTrimestre)}</p>
                  </div>
                  <p className="text-xs text-slate-600">25% du SMIC annuel ({currency(SMIC_ANNUEL_2026)})</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-indigo-900">Trimestres validés cette année</p>
                    <p className="text-3xl font-black text-indigo-600">{results.trimestres.valides}/4</p>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-indigo-600 h-3 rounded-full transition-all" 
                      style={{ width: `${(results.trimestres.valides / 4) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">Total carrière projetée</p>
                    <p className="text-2xl font-black text-slate-900">{results.trimestres.total}/{results.trimestres.requis}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-purple-50 border-purple-200">
              <div className="flex items-start gap-3">
                <Info className="text-purple-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-purple-900 mb-2">Âge de départ</h3>
                  <p className="text-purple-800 text-sm">{results.age.commentaire}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="text-indigo-600" size={24} />
                Estimation pension
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <p className="text-sm text-cyan-700 mb-2">Pension mensuelle brute</p>
                  <p className="text-4xl font-black text-cyan-900">{currency(results.pension.mensuelle)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 mb-2">Pension annuelle brute</p>
                  <p className="text-4xl font-black text-blue-900">{currency(results.pension.annuelle)}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-amber-800">{results.pension.commentaire}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Régime : {results.points.regime} • Points annuels : {results.points.annuels.toFixed(2)}
              </p>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={24} />
                Comparatif Assimilé salarié vs TNS
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-2">Critère</th>
                      <th className="text-right py-3 px-2">Assimilé</th>
                      <th className="text-right py-3 px-2">TNS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-slate-50">
                      <td className="py-3 px-2 font-semibold">Cotisations retraite/an</td>
                      <td className="text-right">{currency(results.comparatif.assimile.cotisations)}</td>
                      <td className="text-right">{currency(results.comparatif.tns.cotisations)}</td>
                    </tr>
                    <tr className="border-b hover:bg-slate-50">
                      <td className="py-3 px-2 font-semibold">Points acquis/an</td>
                      <td className="text-right">{results.comparatif.assimile.pointsAnnuels.toFixed(2)}</td>
                      <td className="text-right">{results.comparatif.tns.pointsAnnuels.toFixed(2)}</td>
                    </tr>
                    <tr className="border-b hover:bg-slate-50 bg-indigo-50">
                      <td className="py-3 px-2 font-bold">Pension annuelle estimée</td>
                      <td className="text-right font-bold text-indigo-600">{currency(results.comparatif.assimile.pension)}</td>
                      <td className="text-right font-bold text-purple-600">{currency(results.comparatif.tns.pension)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-600 mt-4">
                💡 Les TNS cotisent moins mais peuvent avoir une meilleure retraite grâce au système de points RCI plus avantageux
              </p>
            </Card>

            <Card className="p-6 bg-slate-100">
              <div className="flex items-start gap-3">
                <Info className="text-slate-500 flex-shrink-0" size={20} />
                <div className="text-xs text-slate-600">
                  <p className="font-bold mb-2">Méthodologie 2026 :</p>
                  <ul className="space-y-1">
                    <li>• <strong>Trimestres :</strong> 1 trimestre validé par tranche de {currency(results.trimestres.seuilTrimestre)} de revenus (max 4/an)</li>
                    <li>• <strong>Âge légal :</strong> 64 ans pour génération 1968 et après</li>
                    <li>• <strong>Durée cotisation :</strong> 172 trimestres (43 ans) pour taux plein</li>
                    <li>• <strong>AGIRC-ARRCO :</strong> Valeur point 1,4159€ • Prix achat 18,7726€</li>
                    <li>• <strong>SSI/RCI :</strong> Points base + complémentaire selon revenus</li>
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