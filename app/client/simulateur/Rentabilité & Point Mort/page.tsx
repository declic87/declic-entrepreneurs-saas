"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  Calendar, 
  Wallet, 
  PieChart,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function RentabilitePage() {
  // Inputs
  const [caPrev, setCaPrev] = useState(60000); // CA annuel prévu
  const [chargesFixes, setChargesFixes] = useState(12000); // Loyer, abonnements, assurance
  const [tauxMarge, setTauxMarge] = useState(70); // % de marge sur les ventes (ex: 100% pour du service pur)
  const [salaireCible, setSalaireCible] = useState(2500); // Net mensuel souhaité

  const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

  const stats = useMemo(() => {
    // 1. Calcul de la Marge sur Coûts Variables (MCV)
    // On considère que les charges variables sont (100 - tauxMarge)% du CA
    const margeManœuvre = tauxMarge / 100;
    
    // 2. Seuil de Rentabilité (SR) : Pour couvrir les charges fixes
    const seuilRentabilite = chargesFixes / margeManœuvre;
    
    // 3. Seuil de Rémunération : Pour couvrir charges fixes + salaire cible (annuel)
    const besoinAnnuelTotal = chargesFixes + (salaireCible * 12 * 1.5); // 1.5 pour estimer grossièrement les cotisations
    const seuilRemuneration = besoinAnnuelTotal / margeManœuvre;

    // 4. Point Mort (en jours)
    const pointMortJours = (seuilRentabilite / caPrev) * 365;
    const datePointMort = new Date(2026, 0, 1);
    datePointMort.setDate(datePointMort.getDate() + pointMortJours);

    // 5. Progression
    const progression = Math.min(100, (caPrev / seuilRentabilite) * 100);

    return {
      seuilRentabilite,
      seuilRemuneration,
      pointMortJours,
      datePointMort,
      progression,
      besoinAnnuelTotal,
      estRentable: caPrev >= seuilRentabilite
    };
  }, [caPrev, chargesFixes, tauxMarge, salaireCible]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/client/simulateur" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Objectif Rentabilité</h1>
          <p className="text-gray-500 font-medium">Calculez votre point mort et vos objectifs de CA</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Colonne de Saisie */}
        <Card className="lg:col-span-1 shadow-xl border-t-4 border-t-indigo-600">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><PieChart className="text-indigo-600" size={20}/> Vos Hypothèses</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Chiffre d'Affaires Prévisionnel (€)</label>
                <input type="number" value={caPrev} onChange={(e) => setCaPrev(Number(e.target.value))} className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Charges Fixes Annuelles (€)</label>
                <p className="text-[10px] text-gray-400 uppercase italic">Loyer, outils, assurance, banque...</p>
                <input type="number" value={chargesFixes} onChange={(e) => setChargesFixes(Number(e.target.value))} className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Taux de Marge Brute (%)</label>
                <p className="text-[10px] text-gray-400 uppercase italic">Service = 100% | Revente = ~30 à 50%</p>
                <input type="range" min="10" max="100" step="5" value={tauxMarge} onChange={(e) => setTauxMarge(Number(e.target.value))} className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                <div className="text-right font-bold text-indigo-600">{tauxMarge}%</div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-semibold text-gray-700">Salaire Net Mensuel Cible (€)</label>
                <input type="number" value={salaireCible} onChange={(e) => setSalaireCible(Number(e.target.value))} className="w-full p-3 bg-indigo-50 border-indigo-100 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-700 font-bold" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colonne de Résultats */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dashboard Rentabilité */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-none shadow-md bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-gray-500 mb-2">
                  <Target size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">Seuil de Rentabilité</span>
                </div>
                <div className="text-3xl font-black text-gray-900">{fmt(stats.seuilRentabilite)} €</div>
                <p className="text-xs text-gray-400 mt-1">CA minimum pour couvrir vos frais</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-indigo-900 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-indigo-300 mb-2">
                  <Calendar size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">Point Mort</span>
                </div>
                <div className="text-3xl font-black">{stats.datePointMort.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</div>
                <p className="text-xs text-indigo-300 mt-1">Jour où vous commencez à faire du profit</p>
              </CardContent>
            </Card>
          </div>

          

[Image of break-even point analysis chart]


          {/* Progress Bar Jauge */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-bold text-lg">Progression vers la rentabilité</h3>
                  <p className="text-sm text-gray-500">Basé sur votre CA prévisionnel de {fmt(caPrev)} €</p>
                </div>
                <div className="text-2xl font-black text-indigo-600">{fmt(stats.progression)}%</div>
              </div>
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${stats.estRentable ? 'bg-emerald-500' : 'bg-orange-500'}`}
                  style={{ width: `${stats.progression}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase">
                <span>0 €</span>
                <span>Seuil : {fmt(stats.seuilRentabilite)} €</span>
              </div>
            </CardContent>
          </Card>

          {/* Objectif Revenu */}
          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                    <Wallet size={18}/> Pour vous verser {fmt(salaireCible)} € / mois :
                  </h3>
                  <p className="text-sm text-indigo-700/70">En incluant vos charges fixes et ~45% de cotisations sociales.</p>
                </div>
                <div className="text-center px-6 py-3 bg-white rounded-2xl shadow-sm border border-indigo-100">
                  <p className="text-xs text-gray-400 uppercase font-bold">CA Annuel Cible</p>
                  <p className="text-2xl font-black text-indigo-600">{fmt(stats.seuilRemuneration)} €</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verdict */}
          <div className={`p-6 rounded-2xl flex items-center gap-4 ${stats.estRentable ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-orange-50 border border-orange-200 text-orange-800'}`}>
            {stats.estRentable ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
            <div>
              <p className="font-bold text-lg">{stats.estRentable ? "Projet Viable !" : "Attention : Déficit prévu"}</p>
              <p className="text-sm opacity-90">
                {stats.estRentable 
                  ? `Votre projet génère un bénéfice annuel de ${fmt((caPrev - stats.seuilRentabilite) * (tauxMarge/100))} € après charges fixes.`
                  : `Il vous manque ${fmt(stats.seuilRentabilite - caPrev)} € de CA pour atteindre l'équilibre financier.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}