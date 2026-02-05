"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, ArrowLeft, Info, Euro } from "lucide-react";
import Link from "next/link";

export default function SimulateurIK() {
  const [distance, setDistance] = useState<number>(10000);
  const [puissance, setPuissance] = useState<string>("5");

  const calculIK = useMemo(() => {
    const d = distance;
    const p = parseInt(puissance);
    let montant = 0;

    // Barème simplifié (Simulation fiscale 2026)
    if (p <= 3) {
      if (d <= 5000) montant = d * 0.529;
      else if (d <= 20000) montant = (d * 0.316) + 1065;
      else montant = d * 0.370;
    } else if (p === 4) {
      if (d <= 5000) montant = d * 0.606;
      else if (d <= 20000) montant = (d * 0.340) + 1330;
      else montant = d * 0.407;
    } else if (p === 5) {
      if (d <= 5000) montant = d * 0.636;
      else if (d <= 20000) montant = (d * 0.357) + 1395;
      else montant = d * 0.427;
    } else if (p === 6) {
      if (d <= 5000) montant = d * 0.665;
      else if (d <= 20000) montant = (d * 0.374) + 1457;
      else montant = d * 0.447;
    } else { // 7 CV et +
      if (d <= 5000) montant = d * 0.697;
      else if (d <= 20000) montant = (d * 0.394) + 1515;
      else montant = d * 0.470;
    }

    return montant;
  }, [distance, puissance]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="flex items-center text-gray-600 hover:text-[#E67E22] mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Retour
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-4">Calculateur d'Indemnités Kilométriques</h1>
          <p className="text-gray-600">Transformez vos déplacements pros en charges déductibles</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car size={20} className="text-[#E67E22]" /> Votre véhicule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Puissance fiscale</Label>
                <Select value={puissance} onValueChange={setPuissance}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 CV ou moins</SelectItem>
                    <SelectItem value="4">4 CV</SelectItem>
                    <SelectItem value="5">5 CV</SelectItem>
                    <SelectItem value="6">6 CV</SelectItem>
                    <SelectItem value="7">7 CV et plus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance">Distance annuelle (km)</Label>
                <Input 
                  id="distance" 
                  type="number" 
                  value={distance} 
                  onChange={(e) => setDistance(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col justify-center space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-[#E67E22] text-center">
              <p className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">Montant déductible</p>
              <p className="text-5xl font-black text-[#2C3E50] mb-2">
                {Math.round(calculIK).toLocaleString()} €
              </p>
              <p className="text-sm text-green-600 font-medium">Économie d'IS estimée : {Math.round(calculIK * 0.15)} €</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
              <Info className="text-blue-500 shrink-0" size={20} />
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Astuce :</strong> Si vous utilisez un véhicule électrique, le montant des indemnités est majoré de <strong>20%</strong>. C'est le moment de passer à l'électrique !
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}