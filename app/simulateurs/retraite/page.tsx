"use client";

import React, { useState } from "react";
import Link from "next/link";
// Assurez-vous que ces composants existent dans votre projet
import { Logo } from "@/components/ui/logo"; 
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Landmark, 
  Home, 
  Calculator, 
  Info, 
  AlertTriangle, 
  TrendingUp 
} from "lucide-react";

export default function SimulateurRetraitePage() {
  // Correction des types et noms de variables
  const [age, setAge] = useState<number>(40);
  const [statut, setStatut] = useState<string>("micro");
  const [revenusAnnuels, setRevenusAnnuels] = useState<number>(50000);
  const [anneesCotisees, setAnneesCotisees] = useState<number>(15);
  const [showResults, setShowResults] = useState(false);

  // Constantes retraite 2026
  const PASS2026 = 46368;
  const AGE_LEGAL = 64;
  const TRIMESTRES_REQUIS = 172;

  // Calculs de base
  const anneesRestantes = Math.max(0, AGE_LEGAL - age);
  const anneesTotales = anneesCotisees + anneesRestantes;
  const trimestresActuels = anneesCotisees * 4;
  const trimestresProjetes = Math.min(trimestresActuels + (anneesRestantes * 4), TRIMESTRES_REQUIS);
  const coefficientTrimestres = trimestresProjetes / TRIMESTRES_REQUIS;
  const tauxPlein = trimestresProjetes >= TRIMESTRES_REQUIS;

  // ============================================
  // LOGIQUE DE CALCUL PAR STATUT
  // ============================================

  // 1. MICRO-ENTREPRISE (BNC par défaut 34% abattement)
  const baseCotisationMicro = revenusAnnuels * 0.66; 
  const cotisationsRetraiteMicro = revenusAnnuels * 0.212 * 0.45; // Estimation part retraite
  const revenuReferenceMicro = Math.min(baseCotisationMicro, PASS2026);
  const pensionBaseMicro = (revenuReferenceMicro * 0.50) * coefficientTrimestres;
  const pensionComplMicro = pensionBaseMicro * 0.15; // La complémentaire micro est très faible
  const pensionTotaleMicro = pensionBaseMicro + pensionComplMicro;

  // 2. SASU (Assimilé salarié)
  const salaireBrutSASU = revenusAnnuels / 0.78; 
  const cotisationsRetraiteSASU = salaireBrutSASU * 0.28;
  const revenuReferenceSASU = Math.min(salaireBrutSASU, PASS2026);
  const pensionBaseSASU = (revenuReferenceSASU * 0.50) * coefficientTrimestres;
  // Calcul simplifié Agirc-Arrco
  const pensionComplSASU = (salaireBrutSASU * 0.07 * anneesTotales); 
  const pensionTotaleSASU = Math.min(pensionBaseSASU + pensionComplSASU, revenusAnnuels * 0.80);

  // 3. EURL/TNS
  const remunerationTNS = revenusAnnuels;
  const cotisationsRetraiteTNS = remunerationTNS * 0.22;
  const revenuReferenceTNS = Math.min(remunerationTNS, PASS2026);
  const pensionBaseTNS = (revenuReferenceTNS * 0.50) * coefficientTrimestres;
  const pensionComplTNS = (remunerationTNS * 0.05 * anneesTotales);
  const pensionTotaleTNS = Math.min(pensionBaseTNS + pensionComplTNS, remunerationTNS * 0.70);

  // Sélection des données
  let pensionEstimee = 0;
  if (statut === "micro") pensionEstimee = pensionTotaleMicro;
  else if (statut === "sasu") pensionEstimee = pensionTotaleSASU;
  else pensionEstimee = pensionTotaleTNS;

  const pensionMensuelle = pensionEstimee / 12;

  // Préparation du comparatif
  const comparaison = [
    { statut: "Micro-entreprise", pension: pensionTotaleMicro, cotisations: cotisationsRetraiteMicro, taux: (pensionTotaleMicro / (revenusAnnuels * 0.66)) * 100 },
    { statut: "SASU (salarié)", pension: pensionTotaleSASU, cotisations: cotisationsRetraiteSASU, taux: (pensionTotaleSASU / revenusAnnuels) * 100 },
    { statut: "EURL (TNS)", pension: pensionTotaleTNS, cotisations: cotisationsRetraiteTNS, taux: (pensionTotaleTNS / revenusAnnuels) * 100 },
  ].sort((a, b) => b.pension - a.pension);

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ... Votre Navigation ... */}

      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* En-tête du simulateur */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4">
            <Landmark size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Simulateur Retraite Entrepreneur</h1>
          <p className="text-slate-600">Comparez l'impact de votre statut juridique sur votre future pension.</p>
        </div>

        {/* Formulaire de saisie */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Choix du Statut */}
            <div className="col-span-full">
              <label className="block text-sm font-semibold text-slate-700 mb-4">Votre statut actuel ou projeté</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['micro', 'sasu', 'eurl'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatut(s)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      statut === s ? "border-indigo-600 bg-indigo-50" : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-bold capitalize text-slate-900">{s === 'eurl' ? 'EURL / SARL' : s}</p>
                    <p className="text-xs text-slate-500">{s === 'micro' ? 'Indépendant simplifié' : s === 'sasu' ? 'Assimilé salarié' : 'Travailleur non-salarié'}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Numériques */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Âge actuel</label>
              <input 
                type="number" 
                value={age} 
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {statut === "micro" ? "CA annuel estimé" : "Rémunération nette annuelle"}
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={revenusAnnuels} 
                  onChange={(e) => setRevenusAnnuels(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="absolute right-3 top-3 text-slate-400">€</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Années cotisées</label>
              <input 
                type="number" 
                value={anneesCotisees} 
                onChange={(e) => setAnneesCotisees(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <Button 
            onClick={() => setShowResults(true)} 
            className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 py-6 text-lg rounded-xl"
          >
            <Calculator className="mr-2" /> Calculer ma retraite
          </Button>
        </div>

        {/* Affichage des Résultats */}
        {showResults && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-indigo-900 rounded-3xl p-10 text-white text-center shadow-xl mb-8">
                <p className="text-indigo-200 uppercase tracking-widest text-sm font-bold mb-2">Pension Mensuelle Estimée</p>
                <h2 className="text-6xl font-black mb-4">{formatMoney(pensionMensuelle)}<span className="text-2xl font-normal opacity-60">/mois</span></h2>
                <div className="flex justify-center gap-4 text-indigo-200">
                  <span className="bg-white/10 px-4 py-1 rounded-full text-sm">Taux de remplacement : {Math.round(comparaison.find(c => (statut === 'eurl' ? 'EURL (TNS)' : statut === 'sasu' ? 'SASU (salarié)' : 'Micro-entreprise') === c.statut)?.taux || 0)}%</span>
                </div>
             </div>

             {/* Le reste de votre comparatif (Tableau et Graphique) suit ici... */}
             {/* ... */}
          </div>
        )}
      </div>
    </div>
  );
}