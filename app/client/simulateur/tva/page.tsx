"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator, AlertCircle, TrendingUp, TrendingDown, Users, Building2, Info,
  Receipt } from "lucide-react";
import Link from "next/link";

export default function SimuTVAPage() {
  // Inputs
  const [caBase, setCaBase] = useState(80000);
  const [activite, setActivite] = useState("SERVICES");
  const [achatsHT, setAchatsHT] = useState(8000);
  const [investHT, setInvestHT] = useState(3000);
  const [tauxTVA, setTauxTVA] = useState(20);
  const [isB2B, setIsB2B] = useState(true);
  const [repercussion, setRepercussion] = useState(0); // % d'augmentation du prix TTC en B2C
  const [computed, setComputed] = useState(false);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

  const seuils: Record<string, { franchise: number; majore: number }> = {
    SERVICES: { franchise: 37500, majore: 41250 },
    VENTES: { franchise: 85000, majore: 93500 },
    LIBERAL: { franchise: 37500, majore: 41250 },
  };

  const s = seuils[activite] || seuils.SERVICES;
  const taux = tauxTVA / 100;

  const resultats = useMemo(() => {
    const totalAchatsHT = achatsHT + investHT;
    const tvaRecup = totalAchatsHT * taux;
    const achatsTTC = totalAchatsHT * (1 + taux);

    // 1. SCÉNARIO FRANCHISE
    const tresoFranchise = caBase - achatsTTC;

    // 2. SCÉNARIO RÉEL
    let nouveauCaTTC, nouveauCaHT, tvaCollectee;

    if (isB2B) {
      // En B2B, on garde le même HT, le client paie la TVA en plus (neutre pour lui)
      nouveauCaHT = caBase;
      tvaCollectee = caBase * taux;
      nouveauCaTTC = caBase + tvaCollectee;
    } else {
      // En B2C, le prix final payé par le client augmente de "repercussion"%
      nouveauCaTTC = caBase * (1 + repercussion / 100);
      nouveauCaHT = nouveauCaTTC / (1 + taux);
      tvaCollectee = nouveauCaTTC - nouveauCaHT;
    }

    const tvaNetteAPayer = Math.max(0, tvaCollectee - tvaRecup);
    const tresoReel = nouveauCaHT - totalAchatsHT;
    const gainNet = tresoReel - tresoFranchise;

    return {
      tresoFranchise,
      tresoReel,
      gainNet,
      tvaRecup,
      tvaCollectee,
      tvaNetteAPayer,
      nouveauCaHT,
      nouveauCaTTC,
      achatsTTC,
      totalAchatsHT
    };
  }, [caBase, achatsHT, investHT, taux, isB2B, repercussion]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={24} /></Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Simulateur TVA Stratégique</h1>
          <p className="text-gray-500">Franchise vs Réel : mesurez l'impact sur votre poche</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Paramètres */}
        <Card className="lg:col-span-1 border-gray-200 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <h2 className="font-bold flex items-center gap-2"><Calculator size={18}/> Configuration</h2>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-500">Chiffre d'Affaires Actuel</label>
              <input type="number" value={caBase} onChange={(e) => setCaBase(Number(e.target.value))} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-500">Cible Clientèle</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => {setIsB2B(true); setRepercussion(0)}} className={`flex items-center justify-center gap-2 p-2 rounded-md border text-sm transition-all ${isB2B ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-600"}`}>
                  <Building2 size={16}/> B2B (Pros)
                </button>
                <button onClick={() => setIsB2B(false)} className={`flex items-center justify-center gap-2 p-2 rounded-md border text-sm transition-all ${!isB2B ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-600"}`}>
                  <Users size={16}/> B2C (Partic.)
                </button>
              </div>
            </div>

            {!isB2B && (
              <div className="p-3 bg-blue-50 rounded-lg space-y-3">
                <label className="text-xs font-bold text-blue-800 uppercase italic">Hausse du prix client : +{repercussion}%</label>
                <input type="range" min="0" max={tauxTVA} step="1" value={repercussion} onChange={(e) => setRepercussion(Number(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <p className="text-[10px] text-blue-600 leading-tight">Glissez pour simuler une augmentation de vos tarifs TTC afin de compenser la TVA.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Frais HT</label>
                <input type="number" value={achatsHT} onChange={(e) => setAchatsHT(Number(e.target.value))} className="w-full p-2 border rounded-md outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Invest. HT</label>
                <input type="number" value={investHT} onChange={(e) => setInvestHT(Number(e.target.value))} className="w-full p-2 border rounded-md outline-none" />
              </div>
            </div>

            <Button className="w-full bg-black text-white hover:bg-gray-800" onClick={() => setComputed(true)}>Calculer l'impact</Button>
          </CardContent>
        </Card>

        {/* Résultats */}
        <div className="lg:col-span-2 space-y-6">
          {computed ? (
            <>
              {/* Alerte Seuils */}
              <div className={`p-4 rounded-xl border-l-4 flex gap-4 ${caBase <= s.franchise ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-red-50 border-red-500 text-red-800"}`}>
                <AlertCircle />
                <div>
                  <p className="font-bold text-sm">Situation par rapport aux seuils ({activite})</p>
                  <p className="text-xs">Seuil franchise : {fmt(s.franchise)}€ | Votre CA : {fmt(caBase)}€</p>
                </div>
              </div>

              {/* Comparaison Cartes */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-bold text-blue-600 flex justify-between items-center">Franchise <span>(Art. 293B)</span></h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-500"><span>Prix Client (TTC)</span><span>{fmt(caBase)} €</span></div>
                      <div className="flex justify-between text-gray-500"><span>Récupération TVA</span><span>0 €</span></div>
                      <div className="flex justify-between font-bold pt-2 border-t text-lg text-gray-900"><span>Revenu Net</span><span>{fmt(resultats.tresoFranchise)} €</span></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-orange-200 border-2">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-bold text-orange-600 flex justify-between items-center">Régime Réel <span>(TVA {tauxTVA}%)</span></h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-500"><span>Nouveau Prix Client</span><span className={repercussion > 0 ? "text-blue-600 font-bold" : ""}>{fmt(resultats.nouveauCaTTC)} €</span></div>
                      <div className="flex justify-between text-emerald-600 font-medium"><span>TVA récupérée</span><span>+ {fmt(resultats.tvaRecup)} €</span></div>
                      <div className="flex justify-between font-bold pt-2 border-t text-lg text-orange-600"><span>Revenu Net</span><span>{fmt(resultats.tresoReel)} €</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analyse Impact Finale */}
              <Card className={`text-white border-none shadow-lg ${resultats.gainNet >= 0 ? "bg-emerald-600" : "bg-red-600"}`}>
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 rounded-2xl shadow-inner">
                      {resultats.gainNet >= 0 ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                    </div>
                    <div>
                      <h4 className="text-white/80 uppercase text-xs font-bold tracking-widest">Différentiel Annuel</h4>
                      <p className="text-4xl font-black">{resultats.gainNet > 0 ? "+" : ""}{fmt(resultats.gainNet)} €</p>
                    </div>
                  </div>
                  <div className="bg-black/10 p-4 rounded-lg text-sm max-w-sm border border-white/10">
                    <Info size={16} className="mb-2" />
                    {isB2B 
                      ? "En B2B, le passage au réel est presque toujours gagnant car vous déduisez la TVA de vos achats sans impacter vos clients."
                      : repercussion >= tauxTVA 
                        ? "Vous avez totalement répercuté la TVA. Vos clients paient 20% plus cher, mais votre marge est protégée."
                        : "Attention : En absorbant une partie de la TVA, votre revenu net baisse malgré la récupération sur vos achats."}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-12 text-gray-400">
              <Receipt size={48} className="mb-4 opacity-20" />
              <p>Configurez vos données à gauche pour lancer la simulation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}