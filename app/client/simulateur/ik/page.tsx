"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, ArrowLeft, Calculator, Info } from "lucide-react";
import Link from "next/link";

/**
 * Barème kilométrique officiel 2025
 */
const BAREME: Record<number, { seuil1: number; coef1: number; seuil2: number; coef2: number; ajout2: number; coef3: number }> = {
  3: { seuil1: 5000, coef1: 0.529, seuil2: 20000, coef2: 0.316, ajout2: 1065, coef3: 0.370 },
  4: { seuil1: 5000, coef1: 0.606, seuil2: 20000, coef2: 0.340, ajout2: 1330, coef3: 0.407 },
  5: { seuil1: 5000, coef1: 0.636, seuil2: 20000, coef2: 0.357, ajout2: 1395, coef3: 0.427 },
  6: { seuil1: 5000, coef1: 0.665, seuil2: 20000, coef2: 0.374, ajout2: 1457, coef3: 0.447 },
  7: { seuil1: 5000, coef1: 0.697, seuil2: 20000, coef2: 0.394, ajout2: 1515, coef3: 0.462 },
};

export default function SimuIKPage() {
  // États
  const [cv, setCv] = useState(7);
  const [km, setKm] = useState(15000);
  const [joursTravail, setJoursTravail] = useState(220);
  const [distanceAR, setDistanceAR] = useState(35);
  const [useManual, setUseManual] = useState(false);
  const [computed, setComputed] = useState(false);

  // Utilitaires de formatage
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const currency = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  // Calcul des données (mémorisé)
  const data = useMemo(() => {
    const effectiveKm = useManual ? km : distanceAR * joursTravail;
    const cvKey = Math.min(Math.max(cv, 3), 7) as 3 | 4 | 5 | 6 | 7;
    const b = BAREME[cvKey];

    let montant = 0;
    let formule = "";
    let tranche = "";

    if (effectiveKm <= b.seuil1) {
      montant = effectiveKm * b.coef1;
      formule = `${fmt(effectiveKm)} × ${b.coef1}`;
      tranche = `0 à ${fmt(b.seuil1)} km`;
    } else if (effectiveKm <= b.seuil2) {
      montant = effectiveKm * b.coef2 + b.ajout2;
      formule = `(${fmt(effectiveKm)} × ${b.coef2}) + ${b.ajout2}`;
      tranche = `${fmt(b.seuil1)} à ${fmt(b.seuil2)} km`;
    } else {
      montant = effectiveKm * b.coef3;
      formule = `${fmt(effectiveKm)} × ${b.coef3}`;
      tranche = `Plus de ${fmt(b.seuil2)} km`;
    }

    return { effectiveKm, montant: Math.round(montant), formule, tranche, b, cvKey };
  }, [cv, km, joursTravail, distanceAR, useManual]);

  const mensuel = Math.round(data.montant / 12);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link href="/client/simulateur" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Indemnités Kilométriques</h1>
          <p className="text-gray-500 mt-1 font-medium">Barème fiscal officiel 2025 (CGI art. 83-3)</p>
        </div>
      </div>

      {/* Configuration */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Car size={18} className="text-orange-500" /> Paramètres du véhicule
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Puissance fiscale</label>
              <select 
                value={cv} 
                onChange={(e) => { setCv(Number(e.target.value)); setComputed(false); }} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value={3}>3 CV et moins</option>
                <option value={4}>4 CV</option>
                <option value={5}>5 CV</option>
                <option value={6}>6 CV</option>
                <option value={7}>7 CV et plus</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Mode de calcul</label>
              <select 
                value={useManual ? "manual" : "auto"} 
                onChange={(e) => { setUseManual(e.target.value === "manual"); setComputed(false); }} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="auto">Distance A/R × jours</option>
                <option value="manual">Km annuels directs</option>
              </select>
            </div>

            {useManual ? (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Kilomètres annuels</label>
                <input 
                  type="number" 
                  value={km} 
                  onChange={(e) => { setKm(Number(e.target.value)); setComputed(false); }} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Distance A/R par jour (km)</label>
                  <input 
                    type="number" 
                    value={distanceAR} 
                    onChange={(e) => { setDistanceAR(Number(e.target.value)); setComputed(false); }} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Jours travaillés / an</label>
                  <input 
                    type="number" 
                    value={joursTravail} 
                    onChange={(e) => { setJoursTravail(Number(e.target.value)); setComputed(false); }} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                  />
                </div>
              </>
            )}
          </div>

          <Button 
            className="mt-6 w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white gap-2 transition-transform active:scale-95" 
            onClick={() => setComputed(true)}
          >
            <Calculator size={16} /> Calculer les IK
          </Button>
        </CardContent>
      </Card>

      {/* Résultats */}
      {computed && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-5 text-center">
                <p className="text-xs font-bold text-orange-600 uppercase mb-1">IK Annuelles</p>
                <p className="text-3xl font-black text-orange-700">{currency(data.montant)}</p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-5 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Par mois (12m)</p>
                <p className="text-2xl font-bold text-gray-900">{currency(mensuel)}</p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-5 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Distance totale</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(data.effectiveKm)} km</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-bold text-gray-900 mb-4">Détail du calcul fiscal</h2>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg flex justify-between">
                  <span className="text-gray-500">Tranche appliquée :</span>
                  <span className="font-semibold">{data.tranche}</span>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                  <p className="text-xs text-orange-600 font-bold uppercase mb-1">Formule de calcul</p>
                  <p className="font-mono text-lg font-bold text-orange-800">{data.formule} = {currency(data.montant)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table de barème dynamique */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gray-50 p-4 border-b">
                <h2 className="font-bold text-gray-900 text-sm italic">Grille complète pour un véhicule de {data.cvKey} CV</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white border-b text-gray-500 font-medium">
                      <th className="p-4 text-left">Distance (d)</th>
                      <th className="p-4 text-left">Formule</th>
                      <th className="p-4 text-right">Simulation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className={data.effectiveKm <= data.b.seuil1 ? "bg-orange-50/50 font-bold" : ""}>
                      <td className="p-4">0 à {fmt(data.b.seuil1)} km</td>
                      <td className="p-4">d × {data.b.coef1}</td>
                      <td className="p-4 text-right text-gray-600">{currency(data.b.seuil1 * data.b.coef1)} (pour 5k km)</td>
                    </tr>
                    <tr className={data.effectiveKm > data.b.seuil1 && data.effectiveKm <= data.b.seuil2 ? "bg-orange-50/50 font-bold" : ""}>
                      <td className="p-4">{fmt(data.b.seuil1)} à {fmt(data.b.seuil2)} km</td>
                      <td className="p-4">(d × {data.b.coef2}) + {data.b.ajout2}</td>
                      <td className="p-4 text-right text-gray-600">{currency(15000 * data.b.coef2 + data.b.ajout2)} (pour 15k km)</td>
                    </tr>
                    <tr className={data.effectiveKm > data.b.seuil2 ? "bg-orange-50/50 font-bold" : ""}>
                      <td className="p-4">Plus de {fmt(data.b.seuil2)} km</td>
                      <td className="p-4">d × {data.b.coef3}</td>
                      <td className="p-4 text-right text-gray-600">{currency(25000 * data.b.coef3)} (pour 25k km)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mentions Légales */}
          <div className="flex gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 items-start">
            <Info size={16} className="text-gray-400 mt-0.5" />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              <strong>Note fiscale :</strong> Ce simulateur utilise le barème des frais kilométriques publié par l'administration fiscale (BOFiP). 
              Le montant calculé couvre les frais de carburant, d'assurance, d'entretien et la dépréciation du véhicule. 
              Les frais de stationnement et de péage peuvent être ajoutés séparément sur justificatifs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}