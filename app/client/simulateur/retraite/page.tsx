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

type StatutType = 'micro_bnc' | 'micro_bic' | 'micro_mixte' | 'president_sas' | 'gerant_tns' | 'ei_reel_tns' | 'salarie';

interface StatutConfig {
  nom: string;
  tauxCotisations: number;
  regime: string;
  description: string;
}

const STATUTS: Record<StatutType, StatutConfig> = {
  micro_bnc: {
    nom: 'Micro-entreprise BNC',
    tauxCotisations: 0.22,
    regime: 'SSI (Sécurité Sociale Indépendants)',
    description: 'Prestations de services / Professions libérales'
  },
  micro_bic: {
    nom: 'Micro-entreprise BIC',
    tauxCotisations: 0.128,
    regime: 'SSI (Sécurité Sociale Indépendants)',
    description: 'Vente de marchandises / Fourniture logement'
  },
  micro_mixte: {
    nom: 'Micro-entreprise Mixte',
    tauxCotisations: 0.175,
    regime: 'SSI (Sécurité Sociale Indépendants)',
    description: 'Activité mixte BIC + BNC'
  },
  president_sas: {
    nom: 'Président SAS/SASU',
    tauxCotisations: 0.80,
    regime: 'Régime général (Assimilé salarié)',
    description: 'Cotisations patronales + salariales'
  },
  gerant_tns: {
    nom: 'Gérant TNS (EURL/SARL)',
    tauxCotisations: 0.45,
    regime: 'SSI (Travailleur Non Salarié)',
    description: 'Gérant majoritaire SARL ou associé unique EURL'
  },
  ei_reel_tns: {
    nom: 'EI au réel (TNS)',
    tauxCotisations: 0.45,
    regime: 'SSI (Travailleur Non Salarié)',
    description: 'Entreprise Individuelle au régime réel'
  },
  salarie: {
    nom: 'Salarié',
    tauxCotisations: 0.22,
    regime: 'Régime général',
    description: 'Salarié classique (non dirigeant)'
  }
};

export default function SimulateurRetraite() {
  const [inputs, setInputs] = useState({
    revenuAnnuel: 30000,
    anneeNaissance: 1990,
    statut: 'president_sas' as StatutType,
    nbAnneesActivite: 35,
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currency = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' EUR';

  const results = useMemo(() => {
    const statutConfig = STATUTS[inputs.statut];
    
    // VALIDATION TRIMESTRES
    const seuilTrimestre = SMIC_ANNUEL_2026 * 0.25;
    const trimestresValides = Math.min(4, Math.floor(inputs.revenuAnnuel / seuilTrimestre));
    
    let commentaireTrimestres = '';
    if (trimestresValides === 4) {
      commentaireTrimestres = 'Vous validez les 4 trimestres maximum. Parfait pour votre retraite !';
    } else if (trimestresValides >= 2) {
      commentaireTrimestres = `Vous validez ${trimestresValides} trimestres sur 4. Pour valider les 4, il faut gagner ${currency(SMIC_ANNUEL_2026)} minimum/an.`;
    } else {
      commentaireTrimestres = `Seulement ${trimestresValides} trimestre(s) valide(s). Insuffisant pour une bonne retraite.`;
    }

    // AGE DE DEPART
    const AGE_LEGAL_2026 = 64;
    const TRIMESTRES_REQUIS_2026 = 172;
    const trimestresTotal = trimestresValides * inputs.nbAnneesActivite;
    const anneesManquantes = Math.max(0, Math.ceil((TRIMESTRES_REQUIS_2026 - trimestresTotal) / 4));
    const ageDepartEffectif = inputs.anneeNaissance + AGE_LEGAL_2026;
    const ageDepartTauxPlein = ageDepartEffectif + anneesManquantes;

    let commentaireAge = '';
    if (trimestresTotal >= TRIMESTRES_REQUIS_2026) {
      commentaireAge = `Avec ${inputs.nbAnneesActivite} ans de carriere, vous aurez ${trimestresTotal} trimestres. Retraite a taux plein a ${AGE_LEGAL_2026} ans !`;
    } else {
      commentaireAge = `Il vous manque ${TRIMESTRES_REQUIS_2026 - trimestresTotal} trimestres (${anneesManquantes} ans) pour le taux plein.`;
    }

    // POINTS RETRAITE selon statut
    let pointsAnnuels = 0;
    let pensionEstimee = 0;
    const cotisationsAnnuelles = inputs.revenuAnnuel * statutConfig.tauxCotisations;

    if (inputs.statut === 'president_sas' || inputs.statut === 'salarie') {
      // Régime général AGIRC-ARRCO
      const tauxAcquisition = 0.2743;
      const prixAchat = 18.7726;
      pointsAnnuels = (inputs.revenuAnnuel * tauxAcquisition) / prixAchat;
      const pointsTotal = pointsAnnuels * inputs.nbAnneesActivite;
      const valeurPoint2026 = 1.4159;
      pensionEstimee = pointsTotal * valeurPoint2026 * 12;
    } else {
      // TNS / SSI
      const cotisBase = inputs.revenuAnnuel * 0.176;
      const pointsBase = cotisBase * 0.55;
      const cotisCompl = inputs.revenuAnnuel * 0.07;
      const pointsCompl = cotisCompl * 1;
      pointsAnnuels = pointsBase + pointsCompl;
      const pointsTotal = pointsAnnuels * inputs.nbAnneesActivite;
      const valeurPointBase = 0.6155;
      const valeurPointRCI = 1.2588;
      pensionEstimee = ((pointsBase * inputs.nbAnneesActivite * valeurPointBase) + (pointsCompl * inputs.nbAnneesActivite * valeurPointRCI)) * 12;
    }

    const tauxRemplacement = (pensionEstimee / inputs.revenuAnnuel) * 100;

    let commentairePension = '';
    if (tauxRemplacement >= 70) {
      commentairePension = `Excellent taux de remplacement (${tauxRemplacement.toFixed(0)}%). Votre retraite sera confortable.`;
    } else if (tauxRemplacement >= 50) {
      commentairePension = `Taux de remplacement correct (${tauxRemplacement.toFixed(0)}%). Pensez a completer avec epargne privee.`;
    } else {
      commentairePension = `Taux de remplacement faible (${tauxRemplacement.toFixed(0)}%). Prevoyez imperativement une epargne retraite complementaire.`;
    }

    return {
      statutConfig,
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
      cotisations: {
        annuelles: cotisationsAnnuelles,
        mensuelles: cotisationsAnnuelles / 12,
        tauxPourcent: statutConfig.tauxCotisations * 100
      },
      points: {
        annuels: pointsAnnuels,
        total: pointsAnnuels * inputs.nbAnneesActivite,
        regime: statutConfig.regime
      },
      pension: {
        mensuelle: pensionEstimee / 12,
        annuelle: pensionEstimee,
        tauxRemplacement,
        commentaire: commentairePension
      }
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
      pdf.text('Validation trimestres - Age depart - Pension estimee', pageWidth / 2, 30, { align: 'center' });
      pdf.text(new Date().toLocaleDateString('fr-FR'), pageWidth / 2, 40, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VOS DONNEES', 20, 65);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      let y = 75;
      const donnees = [
        `Revenu annuel : ${currency(inputs.revenuAnnuel)}`,
        `Annee naissance : ${inputs.anneeNaissance}`,
        `Statut : ${results.statutConfig.nom}`,
        `Annees activite : ${inputs.nbAnneesActivite}`,
      ];
      donnees.forEach(d => { pdf.text(d, 25, y); y += 7; });

      y += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESULTATS', 20, y);
      
      y += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Trimestres valides/an : ${results.trimestres.valides}`, 25, y);
      y += 7;
      pdf.text(`Age depart taux plein : ${results.age.tauxPlein} ans`, 25, y);
      y += 7;
      pdf.text(`Pension mensuelle estimee : ${currency(results.pension.mensuelle)}`, 25, y);
      y += 7;
      pdf.text(`Cotisations annuelles : ${currency(results.cotisations.annuelles)}`, 25, y);

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
        ['Revenu annuel', inputs.revenuAnnuel],
        ['Annee naissance', inputs.anneeNaissance],
        ['Statut', results.statutConfig.nom],
        ['Annees activite', inputs.nbAnneesActivite],
        ['', ''],
        ['TRIMESTRES', ''],
        ['Valides/an', results.trimestres.valides],
        ['Total carriere', results.trimestres.total],
        ['Requis taux plein', results.trimestres.requis],
        ['', ''],
        ['AGE DEPART', ''],
        ['Age legal', results.age.legal],
        ['Depart taux plein', results.age.tauxPlein],
        ['', ''],
        ['COTISATIONS', ''],
        ['Taux', results.cotisations.tauxPourcent + '%'],
        ['Annuelles', results.cotisations.annuelles],
        ['Mensuelles', results.cotisations.mensuelles],
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
          <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur Retraite Complet</h1>
          <p className="text-xl text-slate-600">Tous statuts • Validation trimestres • Pension estimée</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="p-6 bg-white shadow-xl sticky top-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="text-indigo-600" size={24} />Config
            </h3>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Statut professionnel</Label>
                <select 
                  value={inputs.statut} 
                  onChange={(e) => setInputs({...inputs, statut: e.target.value as StatutType})} 
                  className="w-full h-12 px-3 rounded-md border font-semibold"
                >
                  <option value="micro_bnc">Micro BNC (22%)</option>
                  <option value="micro_bic">Micro BIC (12.8%)</option>
                  <option value="micro_mixte">Micro Mixte (17.5%)</option>
                  <option value="president_sas">Président SAS/SASU (80%)</option>
                  <option value="gerant_tns">Gérant TNS EURL/SARL (45%)</option>
                  <option value="ei_reel_tns">EI Réel TNS (45%)</option>
                  <option value="salarie">Salarié (22%)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">{results.statutConfig.description}</p>
              </div>

              <div>
                <Label className="mb-2 block">Revenu annuel brut (€)</Label>
                <Input type="number" value={inputs.revenuAnnuel as any} onChange={(e) => setInputs({...inputs, revenuAnnuel: Number(e.target.value) || 0})} className="h-12 text-lg font-bold" />
                <p className="text-xs text-slate-500 mt-1">
                  Seuil validation : {currency(results.trimestres.seuilTrimestre)}/trimestre
                </p>
              </div>

              <Card className="p-4 bg-indigo-50 border-indigo-200">
                <p className="text-xs text-indigo-700 mb-1">Cotisations retraite</p>
                <p className="text-2xl font-black text-indigo-900">{results.cotisations.tauxPourcent.toFixed(1)}%</p>
                <p className="text-sm font-bold text-indigo-700 mt-2">{currency(results.cotisations.mensuelles)}/mois</p>
              </Card>

              <div>
                <Label className="mb-2 block">Année de naissance</Label>
                <Input type="number" value={inputs.anneeNaissance as any} onChange={(e) => setInputs({...inputs, anneeNaissance: Number(e.target.value) || 1990})} className="h-12" />
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
                  <h3 className="font-bold text-blue-900 mb-2">Votre statut : {results.statutConfig.nom}</h3>
                  <p className="text-blue-800 text-sm mb-2">{results.statutConfig.description}</p>
                  <p className="text-blue-800 text-sm">Régime : {results.statutConfig.regime}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-3">
                <Info className="text-amber-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-amber-900 mb-2">Analyse trimestres</h3>
                  <p className="text-amber-800 text-sm">{results.trimestres.commentaire}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="text-indigo-600" size={24} />
                Validation des trimestres
              </h3>
              <div className="space-y-4">
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

            <Card className="p-6 bg-slate-100">
              <div className="flex items-start gap-3">
                <Info className="text-slate-500 flex-shrink-0" size={20} />
                <div className="text-xs text-slate-600">
                  <p className="font-bold mb-2">Taux cotisations retraite par statut 2026 :</p>
                  <ul className="space-y-1">
                    <li>- Micro BNC : 22% (SSI)</li>
                    <li>- Micro BIC : 12.8% (SSI)</li>
                    <li>- Micro Mixte : 17.5% (SSI)</li>
                    <li>- President SAS : 80% du brut (Regime general)</li>
                    <li>- Gerant TNS : 45% (SSI)</li>
                    <li>- EI Reel TNS : 45% (SSI)</li>
                    <li>- Salarie : 22% environ (Regime general)</li>
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