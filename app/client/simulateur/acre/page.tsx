"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, ArrowLeft, Calculator, AlertCircle, 
  Info, CheckCircle2, TrendingUp 
} from "lucide-react";
import Link from "next/link";

export default function SimuACREPage() {
  const [ca, setCa] = useState(60000);
  const [activite, setActivite] = useState("BNC");
  const [remuneration, setRemuneration] = useState(30000);
  const [computed, setComputed] = useState(false);

  const fmt = (n: number) => n.toLocaleString("fr-FR");

  // Constantes Fiscales 2026
  const PASS = 48060;
  const SEUIL_DEGRESSIF = PASS * 0.75;
  const PLAFOND_ACRE = PASS;

  const results = useMemo(() => {
    // Taux normaux 2026 (Post-réforme cotisations)
    const tauxNormaux: Record<string, number> = { 
      BNC: 0.256, 
      BIC_SERVICES: 0.212, 
      BIC_VENTES: 0.123 
    };

    // ACRE 2026 = Réduction de 50% sur les taux de base
    const tauxACRE: Record<string, number> = { 
      BNC: 0.128, 
      BIC_SERVICES: 0.106, 
      BIC_VENTES: 0.0615 
    };

    const tn = tauxNormaux[activite] || 0.256;
    const ta = tauxACRE[activite] || 0.128;

    // --- Calculs Micro ---
    const microNormal = Math.round(ca * tn);
    const microACRE = Math.round(ca * ta);
    const microEconomie = microNormal - microACRE;

    // --- Calculs Société (SASU / EURL) ---
    // Note : On simule l'exonération sur la part patronale/TNS
    const sasuBrut = Math.round(remuneration / 0.75);
    const sasuChargesNormal = Math.round(sasuBrut * 0.45);
    const sasuChargesACRE = Math.round(sasuBrut * 0.225); // Exonération 50%
    const sasuEconomie = sasuChargesNormal - sasuChargesACRE;

    const tnsNormal = Math.round(remuneration * 0.45);
    const tnsACRE = Math.round(remuneration * 0.225);
    const tnsEconomie = tnsNormal - tnsACRE;

    // Projection 4 ans
    const annees = [
      { label: "Année 1 (ACRE)", micro: microACRE, sasu: sasuChargesACRE, tns: tnsACRE, isACRE: true },
      { label: "Année 2", micro: microNormal, sasu: sasuChargesNormal, tns: tnsNormal, isACRE: false },
      { label: "Année 3", micro: microNormal, sasu: sasuChargesNormal, tns: tnsNormal, isACRE: false },
      { label: "Année 4", micro: microNormal, sasu: sasuChargesNormal, tns: tnsNormal, isACRE: false },
    ];

    return {
      microNormal, microACRE, microEconomie,
      sasuChargesNormal, sasuChargesACRE, sasuEconomie,
      tnsNormal, tnsACRE, tnsEconomie,
      annees,
      totalMicro: annees.reduce((a, y) => a + y.micro, 0),
      totalSasu: annees.reduce((a, y) => a + y.sasu, 0),
      totalTns: annees.reduce((a, y) => a + y.tns, 0),
      tauxReduit: (ta * 100).toFixed(1),
      tauxPlein: (tn * 100).toFixed(1)
    };
  }, [ca, activite, remuneration]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/client/simulateur" className="p-2 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all shadow-sm bg-white">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Simulateur ACRE 2026</h1>
          <p className="text-gray-500 flex items-center gap-2">
            Réforme LFSS 2026 : Exonération partielle de début d'activité
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <Card className="border-none shadow-lg overflow-hidden">
        <div className="h-1 bg-emerald-500 w-full" />
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                Chiffre d'Affaires prévisionnel (€)
              </label>
              <input 
                type="number" 
                value={ca} 
                onChange={(e) => setCa(Number(e.target.value))} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Type d'activité</label>
              <select 
                value={activite} 
                onChange={(e) => setActivite(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-md focus:ring-2 ring-emerald-500/20 outline-none transition-all"
              >
                <option value="BNC">BNC (Prestations Libérales)</option>
                <option value="BIC_SERVICES">BIC Services (Artisanat/Com.)</option>
                <option value="BIC_VENTES">BIC Ventes (Marchandises)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Rémunération annuelle (€)</label>
              <input 
                type="number" 
                value={remuneration} 
                onChange={(e) => setRemuneration(Number(e.target.value))} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold focus:ring-2 ring-emerald-500/20 outline-none transition-all" 
              />
            </div>
          </div>
          
          <Button 
            className="w-full mt-8 bg-gray-900 hover:bg-emerald-600 text-white h-14 rounded-xl text-lg font-bold shadow-lg transition-all" 
            onClick={() => setComputed(true)}
          >
            <Calculator className="mr-2" size={20} /> Simuler l'impact fiscal
          </Button>
        </CardContent>
      </Card>

      {computed && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          
          {/* Cartes de résultats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-none shadow-md bg-blue-50">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Micro-Entreprise</p>
                <h3 className="text-3xl font-black text-blue-900">{fmt(results.microEconomie)} €</h3>
                <p className="text-sm text-blue-700/70 mt-1">D'économie la 1ère année</p>
                <div className="mt-4 pt-4 border-t border-blue-200/50 space-y-1">
                  <p className="text-xs text-blue-800">Taux : <span className="font-bold">{results.tauxReduit}%</span> au lieu de {results.tauxPlein}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-orange-50">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">SASU (Assimilé Salarié)</p>
                <h3 className="text-3xl font-black text-orange-900">{fmt(results.sasuEconomie)} €</h3>
                <p className="text-sm text-orange-700/70 mt-1">Gain sur charges patronales</p>
                <div className="mt-4 pt-4 border-t border-orange-200/50 space-y-1 text-xs text-orange-800">
                  <p>Exonération de 50% sur les cotisations de base.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-purple-50">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">EURL (TNS)</p>
                <h3 className="text-3xl font-black text-purple-900">{fmt(results.tnsEconomie)} €</h3>
                <p className="text-sm text-purple-700/70 mt-1">Réduction de cotisations</p>
                <div className="mt-4 pt-4 border-t border-purple-200/50 space-y-1 text-xs text-purple-800">
                  <p>Forfait ACRE appliqué sur 12 mois.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projection Table */}
          <Card className="border-none shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-6 text-gray-900">
                <TrendingUp size={20} className="text-emerald-500" />
                <h2 className="text-xl font-black">Projection comparative sur 4 ans</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b-2 border-gray-100">
                      <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-widest">Période</th>
                      <th className="pb-4 font-bold text-blue-600 text-xs uppercase tracking-widest text-right">Cotisations Micro</th>
                      <th className="pb-4 font-bold text-orange-600 text-xs uppercase tracking-widest text-right">Charges SASU</th>
                      <th className="pb-4 font-bold text-purple-600 text-xs uppercase tracking-widest text-right">Charges EURL</th>
                      <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-widest text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.annees.map((a, i) => (
                      <tr key={i} className={`group hover:bg-gray-50 transition-colors ${a.isACRE ? "bg-emerald-50/40" : ""}`}>
                        <td className="py-4 font-bold text-gray-700">{a.label}</td>
                        <td className="py-4 text-right font-medium">{fmt(a.micro)} €</td>
                        <td className="py-4 text-right font-medium">{fmt(a.sasu)} €</td>
                        <td className="py-4 text-right font-medium">{fmt(a.tns)} €</td>
                        <td className="py-4 text-center">
                          {a.isACRE ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                              <Shield size={10} /> ACRE Activée
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Plein Tarif</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-900 text-white rounded-xl">
                      <td className="py-5 px-4 rounded-l-xl font-black">TOTAL CUMULÉ</td>
                      <td className="py-5 text-right font-black text-blue-400">{fmt(results.totalMicro)} €</td>
                      <td className="py-5 text-right font-black text-orange-400">{fmt(results.totalSasu)} €</td>
                      <td className="py-5 text-right font-black text-purple-400">{fmt(results.totalTns)} €</td>
                      <td className="py-5 rounded-r-xl"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Alerte Réforme */}
          <Card className="border-l-8 border-red-500 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="font-black text-red-600 uppercase tracking-tighter text-lg">Réforme de l'ACRE : Ce qui change en 2026</h3>
                  <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                    L'ACRE n'est plus accordée à tous les créateurs de manière automatique. Vous devez désormais 
                    justifier de votre situation (Demandeur d'emploi, RSA, Jeune -26 ans) et effectuer une 
                    <strong> demande explicite à l'URSSAF</strong> sous 45 jours après la création. 
                    L'exonération totale a disparu au profit d'une <strong>réduction forfaitaire de 50%</strong>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sources Légales */}
          <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info size={14} /> Documentation légale & Sources
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-[10px] text-gray-500 uppercase tracking-tight">
               <p>• CSS art. L131-6-4 & R131-3 (Base Légale ACRE)</p>
               <p>• PASS 2026 : 48 060 € (Fixé par arrêté du 22/12/2025)</p>
               <p>• Décret 2025-943 (Révision des taux Micro-BNC)</p>
               <p>• BOFiP BOI-BIC-CHG-40-50-40-20 (Déductibilité)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}