"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowLeft, Calculator, Award, Info, TrendingUp, PieChart } from "lucide-react";
import Link from "next/link";

const TRANCHES_IR = [
  { min: 0, max: 11601, taux: 0 },
  { min: 11602, max: 29579, taux: 0.11 },
  { min: 29580, max: 84577, taux: 0.30 },
  { min: 84578, max: 181917, taux: 0.41 },
  { min: 181918, max: Infinity, taux: 0.45 },
];

function calcIR(revenu: number, parts: number) {
  const qf = Math.floor(revenu / parts);
  let impot = 0;
  for (const t of TRANCHES_IR) {
    if (qf <= t.min) break;
    impot += Math.round((Math.min(qf, t.max) - t.min) * t.taux);
  }
  return Math.round(impot * parts);
}

function calcIS(resultat: number) {
  if (resultat <= 0) return 0;
  return Math.round(
    Math.min(resultat, 42500) * 0.15 + 
    Math.max(0, resultat - 42500) * 0.25
  );
}

export default function SimuRemunerationPage() {
  const [structure, setStructure] = useState("SASU");
  const [ca, setCa] = useState(80000);
  const [frais, setFrais] = useState(12000);
  const [parts, setParts] = useState(1);
  const [computed, setComputed] = useState(false);

  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const currency = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const disponible = useMemo(() => ca - frais, [ca, frais]);

  const scenarios = [
    { label: "100% Salaire", pctSal: 1.0 },
    { label: "80% / 20%", pctSal: 0.8 },
    { label: "60% / 40%", pctSal: 0.6 },
    { label: "40% / 60%", pctSal: 0.4 },
    { label: "20% / 80%", pctSal: 0.2 },
    { label: "100% Trésorerie", pctSal: 0 },
  ];

  const results = useMemo(() => {
    return scenarios.map((s) => {
      const budgetSalaire = Math.round(disponible * s.pctSal);
      const budgetTreso = disponible - budgetSalaire;

      let brut = 0, charges = 0, net = 0;

      if (structure === "SASU") {
        brut = s.pctSal > 0 ? Math.round(budgetSalaire / 1.45) : 0;
        charges = Math.round(brut * 0.45);
        net = Math.round(brut * 0.75); 
      } else {
        brut = s.pctSal > 0 ? Math.round(budgetSalaire / 1.45) : 0;
        charges = Math.round(brut * 0.45);
        net = brut; 
      }

      const ir = calcIR(net, parts);
      const is = calcIS(budgetTreso);
      const tresoSociete = budgetTreso - is;
      const netPerso = net - ir;
      const totalDispo = netPerso + tresoSociete;
      
      const totalPrelevements = charges + ir + is;

      return { ...s, brut, charges, net, ir, is, tresoSociete, netPerso, totalDispo, totalPrelevements };
    });
  }, [structure, ca, frais, parts, disponible]);

  const maxTotal = Math.max(...results.map((r) => r.totalDispo));

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link href="/client/simulateur" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mix Rémunération 2026</h1>
          <p className="text-gray-500 mt-1 font-medium italic underline decoration-orange-300">Arbitrage Salaire vs Trésorerie</p>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm border-t-4 border-t-orange-500">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Forme Juridique</label>
              <select 
                value={structure} 
                onChange={(e) => { setStructure(e.target.value); setComputed(false); }} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none font-medium"
              >
                <option value="SASU">SASU (IS)</option>
                <option value="EURL">EURL (IS)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Chiffre d'Affaires HT</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={ca} 
                  onChange={(e) => { setCa(Number(e.target.value)); setComputed(false); }} 
                  className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                />
                <span className="absolute right-3 top-2 text-gray-400 text-xs">€</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Frais & Charges Pro</label>
              <input 
                type="number" 
                value={frais} 
                onChange={(e) => { setFrais(Number(e.target.value)); setComputed(false); }} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Nombre de parts IR</label>
              <select 
                value={parts} 
                onChange={(e) => { setParts(Number(e.target.value)); setComputed(false); }} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value={1}>1 part</option>
                <option value={1.5}>1.5 part</option>
                <option value={2}>2 parts</option>
                <option value={3}>3 parts</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-gray-100">
            <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600 font-medium">Bénéfice distribuable : <strong className="text-slate-900">{currency(disponible)}</strong></span>
            </div>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2 px-10 py-6 text-lg font-bold shadow-lg shadow-orange-200 transition-all active:scale-95" 
              onClick={() => setComputed(true)}
            >
              <Calculator size={20} /> Lancer la simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      {computed && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-gray-200 shadow-md overflow-hidden">
            <div className="bg-slate-900 p-4 flex justify-between items-center">
              <h2 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <PieChart size={18} className="text-orange-400" /> Analyse des Scénarios
              </h2>
              <span className="text-[10px] text-slate-400 font-mono italic underline">Estimations fiscales 2026</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase">
                    <th className="p-4 text-left">Mix (Salaire/Tréso)</th>
                    <th className="p-4 text-right">Salaire Net</th>
                    <th className="p-4 text-right">Impôts (IR+IS)</th>
                    <th className="p-4 text-right text-blue-600">En Société</th>
                    <th className="p-4 text-right text-slate-900">Total Disponible</th>
                    <th className="p-4 w-48 text-center">Répartition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r, i) => (
                    <tr key={i} className={`hover:bg-orange-50/30 transition-colors ${r.totalDispo === maxTotal ? "bg-emerald-50" : ""}`}>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            {r.label}
                            {r.totalDispo === maxTotal && <Award size={14} className="text-emerald-600" />}
                          </span>
                          <span className="text-[10px] text-gray-400">Charges : {fmt(r.charges)}€</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">{fmt(r.netPerso)}</td>
                      <td className="p-4 text-right text-red-500 font-medium">{fmt(r.ir + r.is)}</td>
                      <td className="p-4 text-right text-blue-600 font-bold">{fmt(r.tresoSociete)}</td>
                      <td className={`p-4 text-right font-black ${r.totalDispo === maxTotal ? "text-emerald-700 text-lg" : "text-slate-900"}`}>
                        {currency(r.totalDispo)}
                      </td>
                      <td className="p-4">
                         <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden flex shadow-inner">
                            <div style={{ width: `${(r.netPerso / disponible) * 100}%` }} className="bg-emerald-500" />
                            <div style={{ width: `${(r.tresoSociete / disponible) * 100}%` }} className="bg-blue-500" />
                            <div style={{ width: `${((r.ir + r.is + r.charges) / (disponible + r.charges)) * 100}%` }} className="bg-red-400" />
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <Info size={20} className="text-orange-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-orange-700 uppercase tracking-tight">Légende de la barre :</p>
              <div className="flex flex-wrap gap-4 text-[10px]">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded" /> <span>Net Poche</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded" /> <span>Tréso Société</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-400 rounded" /> <span>Prélèvements</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}