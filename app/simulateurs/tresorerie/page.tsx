"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Wallet, Home, Calculator, Info, 
  AlertTriangle, TrendingUp, TrendingDown, PiggyBank 
} from "lucide-react";

export default function SimulateurTresoreriePage() {
  const [tresorerieInitiale, setTresorerieInitiale] = useState<number>(50000);
  const [caAnnuel, setCaAnnuel] = useState<number>(120000);
  const [chargesFixes, setChargesFixes] = useState<number>(2000);
  const [salaireNet, setSalaireNet] = useState<number>(3000);
  const [chargesSociales, setChargesSociales] = useState<number>(2500);
  const [impotsSociete, setImpotsSociete] = useState<number>(8000);
  const [tva, setTva] = useState<number>(20);
  const [delaiEncaissement, setDelaiEncaissement] = useState<number>(30);
  const [showResults, setShowResults] = useState<boolean>(false);

  // --- Calculs mensuels ---
  const caMensuel = caAnnuel / 12;
  const tvaMensuelle = caMensuel * (tva / 100);
  const encaissementMensuelHT = caMensuel;

  // Décaissements mensuels (hors taxes spécifiques)
  const decaissementsMensuelsFixes = chargesFixes + salaireNet + chargesSociales + (impotsSociete / 12);
  
  // TVA à reverser (simplifiée)
  const tvaDeductibleMensuelle = chargesFixes * 0.15; // Estimation 15% des charges avec TVA
  const tvaAReverserMensuelle = Math.max(0, tvaMensuelle - tvaDeductibleMensuelle);

  // Flux de trésorerie moyen théorique
  const fluxMensuelMoyen = encaissementMensuelHT - decaissementsMensuelsFixes - tvaAReverserMensuelle;

  // --- Projection sur 12 mois ---
  const projectionMensuelle = [];
  let tresorerieActuelle = tresorerieInitiale;
  
  for (let mois = 1; mois <= 12; mois++) {
    // Simulation d'un décalage d'encaissement au mois 1 (souvent critique au lancement)
    const encaissementReel = mois === 1 ? encaissementMensuelHT * 0.5 : encaissementMensuelHT;
    
    // Charges trimestrielles (TVA payée tous les 3 mois, IS tous les trimestres)
    const chargesTrimTVA = (mois % 3 === 0) ? tvaAReverserMensuelle * 3 : 0;
    const chargesIS = (mois % 3 === 0) ? impotsSociete / 4 : 0;
    
    const totalDecaissementsMois = chargesFixes + salaireNet + chargesSociales + chargesTrimTVA + chargesIS;
    const fluxMois = encaissementReel - totalDecaissementsMois;
    
    tresorerieActuelle += fluxMois;
    
    projectionMensuelle.push({
      mois,
      encaissements: encaissementReel,
      decaissements: totalDecaissementsMois,
      flux: fluxMois,
      tresorerie: tresorerieActuelle,
    });
  }

  // --- Indicateurs ---
  const tresorerieFinale = projectionMensuelle[11]?.tresorerie || 0;
  const tresorerieMin = Math.min(...projectionMensuelle.map(p => p.tresorerie));
  const tresorerieMax = Math.max(...projectionMensuelle.map(p => p.tresorerie));
  const moisCritique = projectionMensuelle.find(p => p.tresorerie < 0);
  
  // BFR estimé (Besoin en Fonds de Roulement lié au délai client)
  const bfr = (caMensuel * (delaiEncaissement / 30)) - (chargesFixes * 0.5);
  
  // Trésorerie de sécurité (3 mois de charges d'exploitation)
  const tresorerieSecurite = (chargesFixes + salaireNet + chargesSociales) * 3;
  const tresorerieExcedentaire = Math.max(0, tresorerieInitiale - tresorerieSecurite);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  const getNomMois = (num: number) => {
    const mois = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    return mois[num - 1];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-primary py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-white">
          <Logo size="md" variant="light" />
          <div className="flex items-center gap-4">
            <Link href="/simulateurs" className="text-white/80 hover:text-white flex items-center gap-2">
              <ArrowLeft size={18} /> Simulateurs
            </Link>
            <Link href="/" className="text-white/80 hover:text-white flex items-center gap-2">
              <Home size={18} /> Accueil
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <Wallet size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
            Simulateur Gestion de Trésorerie
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Anticipez vos flux de trésorerie et gérez votre Besoin en Fonds de Roulement (BFR).
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Trésorerie actuelle (€)</label>
              <input
                type="number"
                value={tresorerieInitiale}
                onChange={(e) => setTresorerieInitiale(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">CA annuel prévisionnel HT</label>
              <input
                type="number"
                value={caAnnuel}
                onChange={(e) => setCaAnnuel(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Délai d'encaissement</label>
              <select
                value={delaiEncaissement}
                onChange={(e) => setDelaiEncaissement(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value={0}>Comptant</option>
                <option value={30}>30 jours</option>
                <option value={60}>60 jours</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Charges fixes/mois</label>
              <input type="number" value={chargesFixes} onChange={(e) => setChargesFixes(Number(e.target.value))} className="p-2 border rounded-lg" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Salaire Net</label>
              <input type="number" value={salaireNet} onChange={(e) => setSalaireNet(Number(e.target.value))} className="p-2 border rounded-lg" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Charges sociales</label>
              <input type="number" value={chargesSociales} onChange={(e) => setChargesSociales(Number(e.target.value))} className="p-2 border rounded-lg" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1">IS Annuel</label>
              <input type="number" value={impotsSociete} onChange={(e) => setImpotsSociete(Number(e.target.value))} className="p-2 border rounded-lg" />
            </div>
          </div>

          <Button onClick={() => setShowResults(true)} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700">
            <Calculator className="mr-2" size={20} /> Projeter ma trésorerie
          </Button>
        </div>

        {/* Résultats */}
        {showResults && (
          <div className="space-y-6">
            {/* Indicateurs clés */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                <p className="text-slate-500 text-sm">Trésorerie Finale</p>
                <p className={`text-2xl font-bold ${tresorerieFinale < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatMoney(tresorerieFinale)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                <p className="text-slate-500 text-sm">Point bas (Année)</p>
                <p className="text-2xl font-bold text-orange-500">{formatMoney(tresorerieMin)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                <p className="text-slate-500 text-sm">BFR Estimé</p>
                <p className="text-2xl font-bold text-blue-600">{formatMoney(bfr)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                <p className="text-slate-500 text-sm">Flux Mensuel Moyen</p>
                <p className="text-2xl font-bold text-slate-700">{formatMoney(fluxMensuelMoyen)}</p>
              </div>
            </div>

            {/* Alertes */}
            {moisCritique && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 items-center">
                <AlertTriangle className="text-red-500" />
                <p className="text-red-700 text-sm">
                  Attention : Rupture de trésorerie prévue en <strong>{getNomMois(moisCritique.mois)}</strong>.
                </p>
              </div>
            )}

            {/* Tableau */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4">Mois</th>
                            <th className="p-4 text-right">Encaissements</th>
                            <th className="p-4 text-right">Décaissements</th>
                            <th className="p-4 text-right">Trésorerie</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projectionMensuelle.map((m) => (
                            <tr key={m.mois} className="border-b hover:bg-slate-50">
                                <td className="p-4 font-medium">{getNomMois(m.mois)}</td>
                                <td className="p-4 text-right text-emerald-600">+{formatMoney(m.encaissements)}</td>
                                <td className="p-4 text-right text-red-500">-{formatMoney(m.decaissements)}</td>
                                <td className={`p-4 text-right font-bold ${m.tresorerie < 0 ? 'text-red-600' : ''}`}>{formatMoney(m.tresorerie)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}