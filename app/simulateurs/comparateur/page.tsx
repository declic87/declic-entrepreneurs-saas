"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ArrowLeft, Info, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function ComparateurPage() {
  const [ca, setCa] = useState<number>(60000);
  const [frais, setFrais] = useState<number>(5000);

  const simulations = useMemo(() => {
    // 1. Calcul Micro-Entreprise (Prestation de services BNC)
    const abattementMicro = ca * 0.34;
    const cotisationsMicro = ca * 0.211; // Taux standard 2025 auto-entrepreneur
    const netFiscalMicro = ca - cotisationsMicro;
    // Estimation simplifiée IR (Impôt sur le Revenu)
    const irMicro = netFiscalMicro * 0.10; 
    const resteMicro = netFiscalMicro - irMicro;

    // 2. Calcul EURL (IS - Travailleur Non Salarié)
    const cotisationsEURL = (ca - frais) * 0.35; // Moyenne TNS sur le net
    const netAvantIREURL = ca - frais - cotisationsEURL;
    const irEURL = netAvantIREURL * 0.15;
    const resteEURL = netAvantIREURL - irEURL;

    // 3. Calcul SASU (Assimilé Salarié - 100% Salaire)
    // Note: Très chargé en cotisations (env. 75% du net)
    const superBrutSASU = ca - frais;
    const netAppresChargesSASU = superBrutSASU / 1.75;
    const irSASU = netAppresChargesSASU * 0.15;
    const resteSASU = netAppresChargesSASU - irSASU;

    return [
      { name: "Micro-Entreprise", net: resteMicro, color: "bg-blue-500", detail: "Simple, mais frais non déductibles" },
      { name: "EURL (IS)", net: resteEURL, color: "bg-[#E67E22]", detail: "Le meilleur compromis charges/protection" },
      { name: "SASU (Salaire)", net: resteSASU, color: "bg-slate-700", detail: "Protection maximale, coût élevé" },
    ];
  }, [ca, frais]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="flex items-center text-gray-600 hover:text-[#E67E22] mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Retour à l'accueil
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-4">Comparateur Fiscal & Social</h1>
          <p className="text-gray-600">Estimez votre reste à vivre selon votre structure juridique</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Formulaire de saisie */}
          <Card className="md:col-span-1 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator size={20} className="text-[#E67E22]" /> Vos données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ca">Chiffre d'Affaires (€)</Label>
                <Input 
                  id="ca" 
                  type="number" 
                  value={ca} 
                  onChange={(e) => setCa(Number(e.target.value))}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frais">Frais professionnels (€/an)</Label>
                <Input 
                  id="frais" 
                  type="number" 
                  value={frais} 
                  onChange={(e) => setFrais(Number(e.target.value))}
                />
                <p className="text-[10px] text-gray-400 italic">Loyer, matériel, abonnements...</p>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          <div className="md:col-span-2 space-y-4">
            {simulations.sort((a, b) => b.net - a.net).map((sim, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#2C3E50]">{sim.name}</h3>
                    {index === 0 && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">OPTIMAL</span>}
                  </div>
                  <p className="text-sm text-gray-500">{sim.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#2C3E50]">{Math.round(sim.net).toLocaleString()} €</p>
                  <p className="text-xs text-gray-400">Net dans votre poche / an</p>
                </div>
              </div>
            ))}

            <Card className="bg-[#2C3E50] text-white">
              <CardContent className="pt-6">
                <div className="flex gap-4 items-start">
                  <TrendingUp className="text-[#E67E22] shrink-0" size={24} />
                  <div>
                    <p className="font-semibold mb-1">Analyse de l'expert</p>
                    <p className="text-sm text-gray-300">
                      {ca > 77700 && "Vous dépassez les plafonds de la micro-entreprise. Le passage en société (EURL/SASU) est recommandé pour déduire vos frais réels."}
                      {ca <= 77700 && "La micro-entreprise semble avantageuse, mais attention à vos frais réels s'ils dépassent 34% de votre CA."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12 text-center">
            <Link href="https://calendly.com/declic-entrepreneurs/diagnostic">
                <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white px-8">
                    Obtenir une simulation détaillée gratuite
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}