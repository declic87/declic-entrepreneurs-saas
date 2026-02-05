"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, PieChart, Home } from "lucide-react";

export default function ChargesPage() {
  const [statut, setStatut] = useState<string>("micro");
  const [ca, setCa] = useState<number>(60000);
  const [remuneration, setRemuneration] = useState<number>(36000);
  const [showResults, setShowResults] = useState(false);

  // Initialisation des variables de calcul
  let cotisations = 0;
  let tauxEffectif = 0;
  let netAvantIR = 0;
  let baseCalculLabel = "";
  let details: { label: string; montant: number; taux: string }[] = [];

  // LOGIQUE DE CALCUL CORRIGÉE
  if (statut === "micro") {
    // Micro-BNC (Prestation de services) : 21.1% + 0.1% ou 0.2% formation (arrondi ici à 22% total)
    baseCalculLabel = "Chiffre d'affaires";
    cotisations = ca * 0.22;
    tauxEffectif = 22;
    netAvantIR = ca - cotisations;
    details = [
      { label: "Maladie-maternité", montant: ca * 0.064, taux: "6.4%" },
      { label: "Retraite de base", montant: ca * 0.088, taux: "8.8%" },
      { label: "Retraite complémentaire", montant: ca * 0.032, taux: "3.2%" },
      { label: "Invalidité-décès", montant: ca * 0.011, taux: "1.1%" },
      { label: "Allocations familiales", montant: ca * 0.00, taux: "0%" },
      { label: "CSG/CRDS", montant: ca * 0.023, taux: "2.3%" },
      { label: "Formation pro", montant: ca * 0.002, taux: "0.2%" },
    ];
  } else if (statut === "sasu") {
    // En SASU, pour une rémunération NETTE souhaitée, les charges sont d'environ 75-80% du Net
    // Ici, on part du Brut (remuneration) : Charges patronales (~45%) + Salariales (~22%)
    baseCalculLabel = "Rémunération Brute";
    const chargesPatronales = remuneration * 0.45;
    const chargesSalariales = remuneration * 0.22;
    cotisations = chargesPatronales + chargesSalariales;
    netAvantIR = remuneration - chargesSalariales;
    tauxEffectif = Math.round((cotisations / netAvantIR) * 100);
    details = [
      { label: "Charges patronales", montant: chargesPatronales, taux: "45%" },
      { label: "Charges salariales", montant: chargesSalariales, taux: "22%" },
      { label: "Retraite (Total)", montant: remuneration * 0.25, taux: "~25%" },
      { label: "Santé & Prévoyance", montant: remuneration * 0.15, taux: "~15%" },
      { label: "CSG/CRDS", montant: remuneration * 0.097, taux: "9.7%" },
    ];
  } else if (statut === "eurl") {
    // TNS : Environ 45% de charges sur le revenu net
    baseCalculLabel = "Rémunération Net de Direction";
    cotisations = remuneration * 0.45;
    tauxEffectif = 45;
    netAvantIR = remuneration; // En TNS, on calcule les charges "en plus" du revenu
    details = [
      { label: "Maladie-maternité", montant: remuneration * 0.065, taux: "6.5%" },
      { label: "Retraite de base", montant: remuneration * 0.1775, taux: "17.75%" },
      { label: "Retraite complémentaire", montant: remuneration * 0.07, taux: "7%" },
      { label: "Invalidité-décès", montant: remuneration * 0.013, taux: "1.3%" },
      { label: "Allocations familiales", montant: remuneration * 0.031, taux: "3.1%" },
      { label: "CSG/CRDS", montant: remuneration * 0.097, taux: "9.7%" },
    ];
  }

  function formatMoney(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-primary py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="md" variant="light" />
          <div className="flex items-center gap-4">
            <Link href="/simulateurs" className="text-white/80 hover:text-white flex items-center gap-2">
              <ArrowLeft size={18} />
              Simulateurs
            </Link>
            <Link href="/" className="text-white/80 hover:text-white flex items-center gap-2">
              <Home size={18} />
              Accueil
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-purple-500 text-white flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4">Calculateur de charges</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Estimez vos charges sociales selon votre statut juridique
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-xl font-bold text-primary mb-6">Vos informations</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Statut juridique</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "micro", label: "Micro-entreprise", desc: "BNC 22%" },
                  { id: "sasu", label: "SASU", desc: "Assimilé salarié" },
                  { id: "eurl", label: "EURL/SARL", desc: "TNS ~45%" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setStatut(option.id);
                      setShowResults(false);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      statut === option.id ? "border-purple-500 bg-purple-50/50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-bold text-primary">{option.label}</p>
                    <p className="text-sm text-slate-500">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {statut === "micro" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Chiffre d'affaires annuel</label>
                  <input
                    type="number"
                    value={ca}
                    onChange={(e) => setCa(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {statut === "sasu" ? "Rémunération brute annuelle" : "Rémunération nette annuelle"}
                  </label>
                  <input
                    type="number"
                    value={remuneration}
                    onChange={(e) => setRemuneration(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-2 italic">
                    {statut === "sasu" ? "Salaire avant charges salariales" : "Revenu net avant cotisations TNS"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <Button onClick={() => setShowResults(true)} size="lg" className="w-full md:w-auto">
              <PieChart size={20} className="mr-2" />
              Calculer mes charges
            </Button>
          </div>
        </div>

        {showResults && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500 mb-2">{baseCalculLabel}</p>
                <p className="text-3xl font-bold text-primary">{formatMoney(statut === "micro" ? ca : remuneration)}</p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-center text-white">
                <p className="text-white/80 mb-2">Total charges</p>
                <p className="text-3xl font-bold">{formatMoney(cotisations)}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500 mb-2">Pression fiscale</p>
                <p className="text-3xl font-bold text-primary">{tauxEffectif}%</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-primary mb-6">Détail des cotisations</h2>
              <div className="space-y-3">
                {details.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <div>
                      <span className="font-medium text-primary">{detail.label}</span>
                      <span className="text-slate-400 ml-2 text-sm">({detail.taux})</span>
                    </div>
                    <span className="font-bold text-slate-700">{formatMoney(detail.montant)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                  <span className="font-bold text-primary text-lg">Net de poche (avant IR)</span>
                  <span className="text-2xl font-bold text-green-600">{formatMoney(netAvantIR)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary to-slate-800 rounded-2xl p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Besoin d'optimiser ces chiffres ?</h3>
              <p className="text-white/80 mb-6">Un expert peut vous aider à réduire ce montant légalement.</p>
              <a href="https://calendly.com/contact-jj-conseil/rdv-analyste" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-white text-primary hover:bg-slate-100 border-none">
                  Réserver mon diagnostic gratuit
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}