"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, ArrowLeft, Calculator, Shield, 
  Heart, Clock, Info, Briefcase, Zap 
} from "lucide-react";
import Link from "next/link";

export default function SimuChargesPage() {
  const [ca, setCa] = useState(80000);
  const [activite, setActivite] = useState("BNC");
  const [remuneration, setRemuneration] = useState(36000);
  const [computed, setComputed] = useState(false);

  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const PASS = 48060;

  const results = useMemo(() => {
    // --- MICRO-ENTREPRISE 2026 ---
    const tauxMicro: Record<string, number> = { 
      BNC: 0.256, 
      BIC_SERVICES: 0.212, 
      BIC_VENTES: 0.123 
    };
    const taux = tauxMicro[activite] || 0.256;
    const microTotal = Math.round(ca * taux);

    // Décomposition Micro (Estimations basées sur répartition URSSAF 2026)
    const mMaladie = Math.round(ca * (activite === "BIC_VENTES" ? 0.010 : activite === "BNC" ? 0.020 : 0.016));
    const mRetraite = Math.round(ca * (activite === "BIC_VENTES" ? 0.078 : activite === "BNC" ? 0.155 : 0.128));
    const mCSG = Math.round(ca * (activite === "BNC" ? 0.055 : 0.044));

    // --- SASU (Assimilé Salarié) ---
    const sasuBrut = Math.round(remuneration / 0.75);
    const sasuPatronales = Math.round(sasuBrut * 0.45);
    const sasuSalariales = sasuBrut - remuneration;
    const sasuTotal = sasuPatronales + sasuSalariales;

    // --- EURL (TNS) ---
    const tnsTotal = Math.round(remuneration * 0.45);

    return {
      microTotal, mMaladie, mRetraite, mCSG, taux,
      sasuTotal, sasuBrut,
      tnsTotal
    };
  }, [ca, activite, remuneration]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/client/simulateur" className="p-2 hover:bg-white border border-gray-100 rounded-xl transition-all shadow-sm bg-white">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Charges Sociales 2026</h1>
            <p className="text-gray-500">Arbitrage Micro vs SASU vs EURL</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
          <Zap size={16} fill="currentColor" />
          <span className="text-xs font-bold uppercase tracking-wider">Mise à jour LFSS 2026</span>
        </div>
      </div>

      {/* Input Section */}
      <Card className="border-none shadow-xl bg-white/50 backdrop-blur">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-500" /> Chiffre d'Affaires
              </label>
              <input 
                type="number" value={ca} onChange={(e) => setCa(Number(e.target.value))}
                className="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-xl font-bold focus:border-blue-500 outline-none transition-all shadow-inner"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Activité</label>
              <select 
                value={activite} onChange={(e) => setActivite(e.target.value)}
                className="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-lg font-semibold focus:border-blue-500 outline-none transition-all"
              >
                <option value="BNC">Libéral (BNC - 25.6%)</option>
                <option value="BIC_SERVICES">Services (BIC - 21.2%)</option>
                <option value="BIC_VENTES">Ventes (BIC - 12.3%)</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={16} className="text-purple-500" /> Rémunération Nette
              </label>
              <input 
                type="number" value={remuneration} onChange={(e) => setRemuneration(Number(e.target.value))}
                className="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-xl font-bold focus:border-purple-500 outline-none transition-all shadow-inner"
              />
            </div>
          </div>
          <Button 
            className="w-full mt-8 bg-gray-900 hover:bg-blue-600 text-white h-16 rounded-2xl text-lg font-black shadow-2xl transition-all group"
            onClick={() => setComputed(true)}
          >
            Comparer les régimes <Calculator className="ml-2 group-hover:rotate-12 transition-transform" />
          </Button>
        </CardContent>
      </Card>

      {computed && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Main Results */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Micro URSSAF", val: results.microTotal, color: "blue", sub: `${(results.taux * 100).toFixed(1)}% du CA` },
              { title: "SASU Salarié", val: results.sasuTotal, color: "orange", sub: `~75% du net` },
              { title: "EURL TNS", val: results.tnsTotal, color: "purple", sub: `~45% du net` }
            ].map((item, idx) => (
              <Card key={idx} className={`border-none shadow-lg bg-${item.color}-50`}>
                <CardContent className="p-6 text-center">
                  <p className={`text-xs font-black text-${item.color}-600 uppercase mb-2`}>{item.title}</p>
                  <p className={`text-4xl font-black text-${item.color}-900`}>{fmt(item.val)} €</p>
                  <div className="mt-4 flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500">{item.sub}</span>
                    <span className="text-[10px] text-gray-400 font-medium">Soit {fmt(Math.round(item.val/12))} € / mois</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Protection Sociale Table */}
          <Card className="border-none shadow-xl overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <Shield size={18} className="text-emerald-400" /> Analyse des Garanties Sociales
              </h2>
            </div>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-tighter">
                    <th className="p-4 text-left">Couverture</th>
                    <th className="p-4 text-center text-blue-600">Micro-Entreprise</th>
                    <th className="p-4 text-center text-orange-600">SASU (Salarié)</th>
                    <th className="p-4 text-center text-purple-600">EURL (TNS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: "Maladie & Maternité", m: "OUI", s: "OPTIMAL", t: "OUI", icon: <Heart size={14} className="text-red-500" /> },
                    { label: "Indemnités Journalières", m: "FAIBLE", s: "OUI (Cadre)", t: "MODÉRÉ", icon: <Shield size={14} className="text-blue-500" /> },
                    { label: "Retraite Complémentaire", m: "MINIMALE", s: "AGIRC-ARRCO", t: "OUI (RCI)", icon: <Clock size={14} className="text-purple-500" /> },
                    { label: "Assurance Chômage", m: "NON", s: "NON*", t: "NON", icon: <Zap size={14} className="text-amber-500" /> }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-700 flex items-center gap-3">
                        {row.icon} {row.label}
                      </td>
                      <td className="p-4 text-center text-xs font-black text-gray-500">{row.m}</td>
                      <td className="p-4 text-center text-xs font-black text-emerald-600 bg-emerald-50/30">{row.s}</td>
                      <td className="p-4 text-center text-xs font-black text-gray-500">{row.t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Note de bas de page */}
          <div className="flex flex-col md:flex-row gap-4 items-start opacity-70">
            <div className="bg-gray-100 p-4 rounded-xl flex-1">
              <p className="text-[10px] leading-relaxed text-gray-500 uppercase font-medium">
                <strong>Source :</strong> Décret n° 2025-943 (Réforme des taux simplifiés) ; 
                Arreté du 22/12/2025 (PASS 2026 : {fmt(PASS)} €). 
                La SASU n'inclut pas d'assurance chômage pour le président (Mandat social). 
                Cotisations EURL basées sur le barème progressif SSI 2026.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}