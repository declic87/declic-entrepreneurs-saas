"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Landmark, ReceiptEuro, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SimulateurDividendes() {
  const [montantBrut, setMontantBrut] = useState<number>(10000);
  const [tmi, setTmi] = useState<number>(30);

  const calculs = useMemo(() => {
    // 1. Flat Tax (Mise à jour Budget 2026 : 31,4%)
    const flatTaxRate = 0.314;
    const netFlatTax = montantBrut * (1 - flatTaxRate);

    // 2. Barème de l'IR (Option globale)
    // Prélèvements sociaux (17.2%) + IR après abattement de 40%
    const prélèvementsSociaux = montantBrut * 0.172;
    const baseImposableIR = (montantBrut * 0.60) - (montantBrut * 0.068);
    const impôtRevenu = baseImposableIR * (tmi / 100);
    const netBarème = montantBrut - prélèvementsSociaux - impôtRevenu;

    return {
      flatTax: { net: netFlatTax, rate: 31.4 },
      bareme: { net: netBarème },
      isFlatTaxBetter: netFlatTax > netBarème
    };
  }, [montantBrut, tmi]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="flex items-center text-gray-600 hover:text-[#E67E22] mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Retour
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-4">Arbitrage Dividendes 2026</h1>
          <p className="text-gray-600">Comparez l'impact du nouveau taux de Flat Tax (31,4%) face au barème classique.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Section Saisie */}
          <Card className="shadow-md h-fit border-t-4 border-t-[#E67E22]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#2C3E50]">
                <ReceiptEuro size={20} /> Vos paramètres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="montant" className="font-semibold text-gray-700">Dividendes Bruts à distribuer (€)</Label>
                <Input 
                  id="montant" 
                  type="number" 
                  value={montantBrut} 
                  onChange={(e) => setMontantBrut(Number(e.target.value))}
                  className="text-xl font-bold border-gray-300 focus:ring-[#E67E22]"
                />
              </div>
              
              <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <Label className="font-semibold text-gray-700">Votre Tranche (TMI)</Label>
                  <span className="text-2xl font-black text-[#E67E22]">{tmi}%</span>
                </div>
                <Slider 
                  defaultValue={[30]} 
                  max={45} 
                  step={1} 
                  onValueChange={(val) => setTmi(val[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
                  <span>NON IMP.</span>
                  <span>11%</span>
                  <span>30%</span>
                  <span>41%</span>
                  <span>45%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Résultats */}
          <div className="space-y-4">
            {/* Option Flat Tax */}
            <div className={`p-6 rounded-2xl border-2 transition-all shadow-sm ${calculs.isFlatTaxBetter ? 'border-[#E67E22] bg-white ring-4 ring-[#E67E22]/5' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-[#2C3E50]">Flat Tax (PFU)</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Loi 2026</span>
                </div>
                {calculs.isFlatTaxBetter && <span className="bg-[#E67E22] text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase">Optimal</span>}
              </div>
              <p className="text-4xl font-black text-[#2C3E50] mb-1">{Math.round(calculs.flatTax.net).toLocaleString()} €</p>
              <p className="text-xs text-gray-500 font-medium italic">Taux de 31,4% appliqué sur le brut</p>
            </div>

            {/* Option Barème */}
            <div className={`p-6 rounded-2xl border-2 transition-all shadow-sm ${!calculs.isFlatTaxBetter ? 'border-[#E67E22] bg-white ring-4 ring-[#E67E22]/5' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-[#2C3E50]">Barème de l'IR</h3>
                {!calculs.isFlatTaxBetter && <span className="bg-[#E67E22] text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase">Optimal</span>}
              </div>
              <p className="text-4xl font-black text-[#2C3E50] mb-1">{Math.round(calculs.bareme.net).toLocaleString()} €</p>
              <p className="text-xs text-gray-500 font-medium italic">Après abattement de 40% et CSG déductible</p>
            </div>

            <div className="bg-[#2C3E50] p-5 rounded-xl text-white">
              <div className="flex gap-3 items-start">
                <AlertCircle className="text-[#E67E22] shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold mb-1 underline decoration-[#E67E22] underline-offset-4">Conseil Déclic :</p>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {tmi <= 11 
                      ? "Avec une TMI à 11%, l'option barème est quasiment toujours gagnante malgré la hausse du PFU." 
                      : "La Flat Tax reste avantageuse pour les tranches hautes, mais l'écart se réduit. Une étude personnalisée est recommandée."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
            <p className="text-xs text-gray-400 mb-6 italic">Simulations basées sur les prévisions fiscales 2026. Document non contractuel.</p>
            <Button size="lg" className="bg-[#E67E22] hover:bg-[#D35400] text-white font-bold rounded-full transition-transform hover:scale-105 shadow-lg">
                Réserver un audit fiscal gratuit
            </Button>
        </div>
      </div>
    </div>
  );
}