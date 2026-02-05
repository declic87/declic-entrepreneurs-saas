"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, ArrowLeft, Calculator, Info, Calendar, MapPin } from "lucide-react";
import Link from "next/link";

// Types
type BaremeEntry = {
  seuil1: number;
  coef1: number;
  seuil2: number;
  coef2: number;
  ajout2: number;
  coef3: number;
};

const BAREME: Record<number, BaremeEntry> = {
  3: { seuil1: 5000, coef1: 0.529, seuil2: 20000, coef2: 0.316, ajout2: 1065, coef3: 0.370 },
  4: { seuil1: 5000, coef1: 0.606, seuil2: 20000, coef2: 0.340, ajout2: 1330, coef3: 0.407 },
  5: { seuil1: 5000, coef1: 0.636, seuil2: 20000, coef2: 0.357, ajout2: 1395, coef3: 0.427 },
  6: { seuil1: 5000, coef1: 0.665, seuil2: 20000, coef2: 0.374, ajout2: 1457, coef3: 0.447 },
  7: { seuil1: 5000, coef1: 0.697, seuil2: 20000, coef2: 0.394, ajout2: 1515, coef3: 0.462 },
};

export default function SimuIKPage() {
  const [cv, setCv] = useState(7);
  const [km, setKm] = useState(15000);
  const [joursTravail, setJoursTravail] = useState(218);
  const [distanceAR, setDistanceAR] = useState(35);
  const [useManual, setUseManual] = useState(false);
  const [computed, setComputed] = useState(false);

  // Formattage
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const currency = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  // Calculs
  const { effectiveKm, montant, formule, tranche, b, cvKey } = useMemo(() => {
    const distance = useManual ? km : distanceAR * joursTravail;
    const key = Math.min(Math.max(cv, 3), 7) as keyof typeof BAREME;
    const bareme = BAREME[key];
    
    let res = 0;
    let form = "";
    let t = "";

    if (distance <= bareme.seuil1) {
      res = distance * bareme.coef1;
      form = `${fmt(distance)} km × ${bareme.coef1}`;
      t = `0 à ${fmt(bareme.seuil1)} km`;
    } else if (distance <= bareme.seuil2) {
      res = (distance * bareme.coef2) + bareme.ajout2;
      form = `(${fmt(distance)} km × ${bareme.coef2}) + ${bareme.ajout2}`;
      t = `${fmt(bareme.seuil1)} à ${fmt(bareme.seuil2)} km`;
    } else {
      res = distance * bareme.coef3;
      form = `${fmt(distance)} km × ${bareme.coef3}`;
      t = `Plus de ${fmt(bareme.seuil2)} km`;
    }

    return { 
      effectiveKm: distance, 
      montant: Math.round(res), 
      formule: form, 
      tranche: t, 
      b: bareme, 
      cvKey: key 
    };
  }, [cv, km, joursTravail, distanceAR, useManual]);

  const mensuel = Math.round(montant / 12);

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/client/simulateur" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Indemnités Kilométriques</h1>
          <p className="text-slate-500 font-medium">Barème fiscal officiel 2025 (CGI art. 83-3)</p>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Car className="w-5 h-5 text-orange-500" />
            Paramètres du véhicule et trajets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Puissance Fiscale */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Puissance fiscale</label>
              <select 
                value={cv} 
                onChange={(e) => { setCv(Number(e.target.value)); setComputed(false); }}
                className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value={3}>3 CV et moins</option>
                <option value={4}>4 CV</option>
                <option value={5}>5 CV</option>
                <option value={6}>6 CV</option>
                <option value={7}>7 CV et plus</option>
              </select>
            </div>

            {/* Mode de calcul */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Mode de calcul</label>
              <select 
                value={useManual ? "manual" : "auto"} 
                onChange={(e) => { setUseManual(e.target.value === "manual"); setComputed(false); }}
                className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="auto">Distance A/R journalière</option>
                <option value="manual">Saisie Kilométrage annuel</option>
              </select>
            </div>

            {/* Inputs dynamiques */}
            {useManual ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Kilomètres annuels</label>
                <input 
                  type="number" 
                  value={km} 
                  onChange={(e) => { setKm(Number(e.target.value)); setComputed(false); }}
                  className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin size={14} /> Aller-Retour (km)
                  </label>
                  <input 
                    type="number" 
                    value={distanceAR} 
                    onChange={(e) => { setDistanceAR(Number(e.target.value)); setComputed(false); }}
                    className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar size={14} /> Jours travaillés / an
                  </label>
                  <input 
                    type="number" 
                    value={joursTravail} 
                    onChange={(e) => { setJoursTravail(Number(e.target.value)); setComputed(false); }}
                    className="w-full h-10 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-1 flex flex-col justify-end">
                   <div className="h-10 flex items-center px-4 bg-slate-50 border border-dashed border-slate-300 rounded-md text-sm font-medium text-slate-600 italic">
                      Total : {fmt(effectiveKm)} km / an
                   </div>
                </div>
              </>
            )}
          </div>

          <Button 
            className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white gap-2 transition-all active:scale-95" 
            onClick={() => setComputed(true)}
          >
            <Calculator size={18} /> Calculer mes indemnités
          </Button>
        </CardContent>
      </Card>

      {computed && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-600 text-white border-none shadow-lg">
              <CardContent className="p-6 text-center">
                <p className="text-blue-100 text-sm font-medium mb-1">Indemnités annuelles</p>
                <p className="text-4xl font-bold">{currency(montant)}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <p className="text-slate-500 text-sm font-medium mb-1">Moyenne mensuelle</p>
                <p className="text-3xl font-bold text-slate-900">{currency(mensuel)}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <p className="text-slate-500 text-sm font-medium mb-1">Distance retenue</p>
                <p className="text-3xl font-bold text-slate-900">{fmt(effectiveKm)} km</p>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Détail du calcul</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600 text-sm font-medium">Tranche applicable</span>
                  <span className="font-bold text-slate-900">{tranche}</span>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Formule appliquée</p>
                  <p className="text-lg font-mono text-blue-800 font-bold">{formule}</p>
                  <p className="mt-2 text-2xl text-blue-900 font-black">{currency(montant)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex justify-between items-center">
                  <span>Barème {cvKey} CV</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">Valeurs 2025</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: `Jusqu'à ${fmt(b.seuil1)} km`, formula: `d × ${b.coef1}` },
                    { label: `De ${fmt(b.seuil1)} à ${fmt(b.seuil2)} km`, formula: `(d × ${b.coef2}) + ${b.ajout2}` },
                    { label: `Plus de ${fmt(b.seuil2)} km`, formula: `d × ${b.coef3}` }
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center text-sm py-2 border-b last:border-0 border-slate-100">
                      <span className="text-slate-600 font-medium">{row.label}</span>
                      <code className="bg-slate-50 px-2 py-1 rounded text-orange-700 font-bold">{row.formula}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Legal Notice */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4 flex gap-3 items-start">
              <Info className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong>Source :</strong> Code Général des Impôts, art. 83-3 ; BOFiP BOI-BAREME-000001. 
                Le barème kilométrique couvre la dépréciation du véhicule, les frais d'assurance, d'entretien, de pneumatiques et de carburant. 
                Les frais de péage, de garage (stationnement) et les intérêts d'emprunt pour l'achat du véhicule sont déductibles en sus sur justificatifs.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}