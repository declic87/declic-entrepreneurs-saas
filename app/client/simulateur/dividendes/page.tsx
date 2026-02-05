"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, ArrowLeft, Calculator, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";

// ============================================================
// PARAMÈTRES FISCAUX 2026 (LFSS 2025-1403)
// ============================================================
const TX_IR_FORFAITAIRE = 0.128;
const TX_PS = 0.186; // CSG 10,6% + CRDS 0,5% + Solidarité 7,5%
const TX_CSG_DEDUCTIBLE = 0.068;
const TX_ABATTEMENT_40 = 0.40;
const TX_SSI = 0.45;

const TRANCHES_IR = [
  { min: 0, max: 11294, taux: 0 },
  { min: 11295, max: 28797, taux: 0.11 },
  { min: 28798, max: 82341, taux: 0.30 },
  { min: 82342, max: 177106, taux: 0.41 },
  { min: 177107, max: Infinity, taux: 0.45 },
];

/**
 * Calcule l'IR et identifie la TMI
 */
function calcFiscalite(revenu: number, parts: number) {
  const qf = Math.floor(revenu / parts);
  let impotTotal = 0;
  let tmi = 0;
  const details = [];

  for (const t of TRANCHES_IR) {
    if (qf > t.min) {
      tmi = t.taux; // La dernière tranche atteinte devient la TMI
      const baseTranche = Math.min(qf, t.max) - t.min;
      const montantTranche = Math.round(baseTranche * t.taux);
      impotTotal += montantTranche;
      
      if (montantTranche > 0 || t.taux === 0) {
        details.push({
          tranche: `${t.min.toLocaleString("fr-FR")} - ${t.max === Infinity ? "..." : t.max.toLocaleString("fr-FR")} €`,
          base: baseTranche,
          montant: montantTranche,
          taux: t.taux,
        });
      }
    }
  }

  return { 
    total: Math.round(impotTotal * parts), 
    tmi: tmi * 100, 
    details 
  };
}

export default function SimuDividendesPage() {
  const [structure, setStructure] = useState("SASU");
  const [benefice, setBenefice] = useState(50000);
  const [parts, setParts] = useState(1);
  const [capital, setCapital] = useState(1000);
  const [cca, setCca] = useState(0);
  const [autresRevenus, setAutresRevenus] = useState(30000);
  const [computed, setComputed] = useState(false);

  const fmt = (n: number) => n.toLocaleString("fr-FR");

  // --- CALCULS SASU ---
  const pfuPS = Math.round(benefice * TX_PS);
  const pfuIR = Math.round(benefice * TX_IR_FORFAITAIRE);
  const pfuTotal = pfuPS + pfuIR;
  const pfuNet = benefice - pfuTotal;

  const abattement40 = Math.round(benefice * TX_ABATTEMENT_40);
  const csgDeductible = Math.round(benefice * TX_CSG_DEDUCTIBLE);
  const baremePS = Math.round(benefice * TX_PS);
  const baremeBaseIR = Math.max(0, autresRevenus + benefice - abattement40 - csgDeductible);
  
  const resFiscTotal = calcFiscalite(baremeBaseIR, parts);
  const resFiscSansDiv = calcFiscalite(autresRevenus, parts);
  
  const baremeIRSupp = Math.max(0, resFiscTotal.total - resFiscSansDiv.total);
  const baremeNet = benefice - baremePS - baremeIRSupp;

  // --- CALCULS EURL ---
  const seuil10 = Math.round((capital + cca) * 0.10);
  const eurlPartPFU = Math.min(benefice, seuil10);
  const eurlPartSSI = Math.max(0, benefice - seuil10);
  const eurlTotalPrelev = Math.round(eurlPartPFU * (TX_IR_FORFAITAIRE + TX_PS)) + Math.round(eurlPartSSI * TX_SSI);
  const eurlNetTotal = benefice - eurlTotalPrelev;

  const sasuMeilleurOption = pfuNet >= baremeNet ? "PFU" : "Barème";
  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 bg-white min-h-screen">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Simulateur Dividendes 2026</h1>
          <p className="text-gray-500">Optimisation fiscale : PFU 31,4% vs Barème Progressif</p>
        </div>
      </div>

      {/* ALERT LFSS */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex gap-3 italic text-sm text-amber-800">
          <AlertTriangle className="flex-shrink-0" size={18} />
          <p>Mise à jour LFSS 2026 : Prélèvements sociaux portés à 18,6% (CSG +1,4pt). PFU global à 31,4%.</p>
        </CardContent>
      </Card>

      {/* FORMULAIRE */}
      <Card className="shadow-sm">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Banknote size={18}/> Revenus</h3>
            <div>
              <label className="text-xs text-gray-500">Dividendes bruts (€)</label>
              <input type="number" value={benefice} onChange={e => setBenefice(Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Autres revenus nets imposables (€)</label>
              <input type="number" value={autresRevenus} onChange={e => setAutresRevenus(Number(e.target.value))} className={inputClass} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Info size={18}/> Situation</h3>
            <div>
              <label className="text-xs text-gray-500">Structure</label>
              <select value={structure} onChange={e => setStructure(e.target.value)} className={inputClass}>
                <option value="SASU">SASU (Président)</option>
                <option value="EURL">EURL (Gérant Majoritaire)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Parts fiscales</label>
              <input type="number" step="0.5" value={parts} onChange={e => setParts(Number(e.target.value))} className={inputClass} />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl flex flex-col justify-center items-center border border-dashed border-gray-300">
            <p className="text-xs text-gray-500 uppercase font-bold">Votre TMI estimée</p>
            <p className="text-4xl font-black text-amber-600">{resFiscTotal.tmi}%</p>
            <p className="text-[10px] text-gray-400 mt-2 text-center">Basée sur revenus + dividendes (si barème)</p>
          </div>

          <Button onClick={() => setComputed(true)} className="md:col-span-3 bg-amber-500 hover:bg-amber-600 text-white font-bold py-6">
            <Calculator className="mr-2" /> Calculer l'optimisation
          </Button>
        </CardContent>
      </Card>

      {computed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OPTION PFU */}
          <Card className={pfuNet >= baremeNet ? "ring-2 ring-emerald-500" : "opacity-80"}>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">Option PFU (Flat Tax)</h3>
                {pfuNet >= baremeNet && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> Recommandé</span>}
              </div>
              <div className="text-3xl font-bold text-emerald-700">{fmt(pfuNet)} € <span className="text-sm text-gray-400 font-normal">net</span></div>
              <div className="text-sm space-y-1 text-gray-600">
                <div className="flex justify-between"><span>Impôt (12,8%)</span><span>-{fmt(pfuIR)} €</span></div>
                <div className="flex justify-between"><span>Social (18,6%)</span><span>-{fmt(pfuPS)} €</span></div>
              </div>
            </CardContent>
          </Card>

          {/* OPTION BARÈME */}
          <Card className={baremeNet > pfuNet ? "ring-2 ring-emerald-500" : "opacity-80"}>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">Option Barème Progressif</h3>
                {baremeNet > pfuNet && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> Recommandé</span>}
              </div>
              <div className="text-3xl font-bold text-emerald-700">{fmt(baremeNet)} € <span className="text-sm text-gray-400 font-normal">net</span></div>
              <div className="text-sm space-y-1 text-gray-600">
                <div className="flex justify-between"><span>IR supplémentaire (via barème)</span><span>-{fmt(baremeIRSupp)} €</span></div>
                <div className="flex justify-between"><span>Social (18,6%)</span><span>-{fmt(baremePS)} €</span></div>
                <p className="text-[10px] text-blue-600 mt-2">Inclus : Abattement 40% + CSG déductible 6,8%</p>
              </div>
            </CardContent>
          </Card>

          {/* SYNTHÈSE ET CONSEIL */}
          <Card className="lg:col-span-2 bg-gray-900 text-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold">Analyse de l'expert</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Avec une **TMI de {resFiscTotal.tmi}%**, l'option **{sasuMeilleurOption}** est la plus efficace. 
                    {resFiscTotal.tmi >= 30 
                      ? " À ce niveau de revenus, le PFU est presque systématiquement gagnant." 
                      : " Le barème est compétitif grâce à l'abattement de 40%."}
                  </p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl text-center min-w-[200px]">
                  <p className="text-xs uppercase text-gray-400">Gain potentiel</p>
                  <p className="text-2xl font-black text-amber-400">{fmt(Math.abs(pfuNet - baremeNet))} € / an</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}