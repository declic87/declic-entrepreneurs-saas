"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingUp,
  PieChart,
  Home,
  Menu,
  X,
  Star,
} from "lucide-react";

/* ------------------------------ NAV ------------------------------ */

const NAV_LINKS = [
  { label: "Simulateurs", href: "/simulateurs" },
  { label: "Formations", href: "/formations" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "RDV Stratégique", href: "/#rdv" },
  { label: "FAQ", href: "/#faq" },
];

function euro(n: number) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}
function monthly(n: number) {
  return n / 12;
}

/* ------------------------------ PAGE ------------------------------ */

export default function ChargesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [statut, setStatut] = useState<"micro" | "sasu" | "eurl">("micro");
  const [ca, setCa] = useState<number>(60000);
  const [remuneration, setRemuneration] = useState<number>(36000);
  const [showResults, setShowResults] = useState(false);

  // Hypothèses pédagogiques (visibles dans l’UI)
  const hypo = {
    micro_total_rate: 0.22, // ~22% BNC (21.1 + FP ~0.2)
    micro_breakdown: {
      maladie: 0.064,
      retraiteBase: 0.088,
      retraiteCompl: 0.032,
      invalidite: 0.011,
      af: 0.0,
      csg: 0.023,
      fp: 0.002,
    },
    sasu: {
      patronales: 0.45, // charges patronales sur BRUT
      salariales: 0.22, // charges salariales sur BRUT
      // net = brut * (1 - salariales), coût employeur = brut * (1 + patronales)
    },
    eurl_tns: 0.45, // env. 45% TNS sur la rémunération nette
  };

  const calc = useMemo(() => {
    let cotisations = 0;
    let tauxEffectif = 0;
    let netAvantIR = 0;
    let baseCalculLabel = "";
    let baseValue = 0;
    let details: { label: string; montant: number; taux: string }[] = [];

    if (statut === "micro") {
      baseCalculLabel = "Chiffre d'affaires";
      baseValue = Math.max(0, ca);

      const c = baseValue * hypo.micro_total_rate;
      cotisations = c;
      netAvantIR = baseValue - c;
      tauxEffectif = Math.round((cotisations / Math.max(1, netAvantIR)) * 100);

      const b = hypo.micro_breakdown;
      details = [
        { label: "Maladie‑maternité", montant: baseValue * b.maladie, taux: "6,4%" },
        { label: "Retraite de base", montant: baseValue * b.retraiteBase, taux: "8,8%" },
        { label: "Retraite complémentaire", montant: baseValue * b.retraiteCompl, taux: "3,2%" },
        { label: "Invalidité‑décès", montant: baseValue * b.invalidite, taux: "1,1%" },
        { label: "Allocations familiales", montant: baseValue * b.af, taux: "0%" },
        { label: "CSG/CRDS", montant: baseValue * b.csg, taux: "2,3%" },
        { label: "Formation pro", montant: baseValue * b.fp, taux: "0,2%" },
      ];
    } else if (statut === "sasu") {
      baseCalculLabel = "Rémunération BRUTE";
      baseValue = Math.max(0, remuneration);

      const chargesPatronales = baseValue * hypo.sasu.patronales;
      const chargesSalariales = baseValue * hypo.sasu.salariales;
      cotisations = chargesPatronales + chargesSalariales;

      netAvantIR = baseValue - chargesSalariales;
      tauxEffectif = Math.round((cotisations / Math.max(1, netAvantIR)) * 100);

      details = [
        { label: "Charges patronales", montant: chargesPatronales, taux: "45%" },
        { label: "Charges salariales", montant: chargesSalariales, taux: "22%" },
        { label: "Retraite (Total ~)", montant: baseValue * 0.25, taux: "~25%" },
        { label: "Santé & Prévoyance (~)", montant: baseValue * 0.15, taux: "~15%" },
        { label: "CSG/CRDS (~)", montant: baseValue * 0.097, taux: "9,7%" },
      ];
    } else if (statut === "eurl") {
      baseCalculLabel = "Rémunération NET (TNS)";
      baseValue = Math.max(0, remuneration);

      cotisations = baseValue * hypo.eurl_tns;
      netAvantIR = baseValue; // en TNS, on considère net + charges à ajouter
      tauxEffectif = Math.round((cotisations / Math.max(1, netAvantIR)) * 100);

      details = [
        { label: "Maladie‑maternité (~)", montant: baseValue * 0.065, taux: "6,5%" },
        { label: "Retraite de base (~)", montant: baseValue * 0.1775, taux: "17,75%" },
        { label: "Retraite compl. (~)", montant: baseValue * 0.07, taux: "7%" },
        { label: "Invalidité‑décès (~)", montant: baseValue * 0.013, taux: "1,3%" },
        { label: "Allocations fam. (~)", montant: baseValue * 0.031, taux: "3,1%" },
        { label: "CSG/CRDS (~)", montant: baseValue * 0.097, taux: "9,7%" },
      ];
    }

    return { cotisations, tauxEffectif, netAvantIR, baseCalculLabel, baseValue, details };
  }, [statut, ca, remuneration]);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR PREMIUM */}
      <nav className="fixed top-0 z-50 w-full bg-[#0d1f33]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          /
            <Logo size="md" showText variant="light" />
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-slate-200 hover:text-white transition-colors ${
                  l.href === "/simulateurs" ? "text-white font-semibold" : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
            /login
              <Button
                variant="outline"
                className="text-white border-white/20 hover:bg-white/10 px-4"
              >
                Connexion
              </Button>
            </Link>
            /app
              <Button className="bg-white text-[#123055] hover:bg-slate-100 px-4">
                Mon Espace
              </Button>
            </Link>
            https://calendly.com/declic-entrepreneurs/diagnostic
              <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-4 shadow-lg shadow-amber-500/20">
                Diagnostic gratuit
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-slate-200"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0d1f33]/95 backdrop-blur-lg border-t border-white/10">
            <div className="px-4 py-4 space-y-3">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`block text-slate-200 hover:text-white py-2 ${
                    l.href === "/simulateurs" ? "text-white font-semibold" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 mt-4">
                /login
                  <Button
                    variant="outline"
                    className="w-full text-white border-white/20 hover:bg-white/10"
                  >
                    Connexion
                  </Button>
                </Link>
                /app
                  <Button className="w-full bg-white text-[#123055] hover:bg-slate-100">
                    Mon Espace
                  </Button>
                </Link>
                https://calendly.com/declic-entrepreneurs/diagnostic
                  <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white">
                    Diagnostic gratuit
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HEADER */}
      <header className="pt-28 md:pt-32 pb-8 bg-[radial-gradient(1200px_500px_at_20%_-10%,#1f3a5f_0%,transparent_60%),linear-gradient(180deg,#18314f_0%,#0f2742_100%)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          /simulateurs
            <ArrowLeft size={18} className="mr-2" />
            Retour aux simulateurs
          </Link>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
            Calculateur de charges
          </h1>
          <p className="text-slate-200 mt-2 max-w-2xl">
            Estimez vos charges sociales selon votre statut (Micro, SASU, EURL).
          </p>
        </div>
      </header>

      {/* CONTENU */}
      <main className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-xl font-bold text-[#123055] mb-6">Vos informations</h2>

          {/* Statut */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Statut juridique</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "micro", label: "Micro‑entreprise", desc: "BNC ~22%" },
                  { id: "sasu", label: "SASU", desc: "Assimilé salarié" },
                  { id: "eurl", label: "EURL/SARL", desc: "TNS ~45%" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setStatut(option.id as "micro" | "sasu" | "eurl");
                      setShowResults(false);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      statut === option.id
                        ? "border-amber-500 bg-amber-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-bold text-[#123055]">{option.label}</p>
                    <p className="text-sm text-slate-500">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="grid md:grid-cols-2 gap-6">
              {statut === "micro" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Chiffre d'affaires annuel
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={Number.isFinite(ca) ? ca : ""}
                    onChange={(e) => setCa(Number(e.target.value || 0))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {statut === "sasu" ? "Rémunération BRUTE annuelle" : "Rémunération NETTE annuelle"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={Number.isFinite(remuneration) ? remuneration : ""}
                    onChange={(e) => setRemuneration(Number(e.target.value || 0))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-2 italic">
                    {statut === "sasu"
                      ? "Salaire avant charges salariales (net = brut × ~0,78)"
                      : "Revenu net TNS ; charges à ajouter (~45%)"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CTA calcul */}
          <div className="mt-8">
            <Button onClick={() => setShowResults(true)} size="lg" className="w-full md:w-auto bg-[#F59E0B] hover:bg-[#D97706]">
              <PieChart size={20} className="mr-2" />
              Calculer mes charges
            </Button>
          </div>

          {/* Hypothèses */}
          <div className="mt-6 rounded-xl bg-amber-50 text-amber-900 p-4 text-sm flex gap-2">
            <Star size={16} className="text-amber-500 mt-0.5" />
            <p>
              Hypothèses pédagogiques. Les taux varient selon la situation (ACRE, conventions, tranches, etc.).
              Pour un chiffrage exact, réservez un diagnostic.
            </p>
          </div>
        </div>

        {/* Résultats */}
        {showResults && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500 mb-2">{calc.baseCalculLabel}</p>
                <p className="text-3xl font-extrabold text-[#123055]">
                  {euro(calc.baseValue)}
                </p>
                <p className="text-xs text-slate-400">
                  {statut === "micro" ? "Base = CA" : statut === "sasu" ? "Base = brut" : "Base = net TNS"}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-center text-white">
                <p className="text-white/80 mb-2">Total charges</p>
                <p className="text-3xl font-extrabold">{euro(calc.cotisations)}</p>
                <p className="text-xs text-white/80">{euro(monthly(calc.cotisations))} / mois</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500 mb-2">Pression sociale</p>
                <p className="text-3xl font-extrabold text-[#123055]">{calc.tauxEffectif}%</p>
                <p className="text-xs text-slate-400">vs Net de poche</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-[#123055] mb-6">Détail des cotisations</h2>
              <div className="space-y-3">
                {calc.details.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <div>
                      <span className="font-medium text-[#123055]">{d.label}</span>
                      <span className="text-slate-400 ml-2 text-sm">({d.taux})</span>
                    </div>
                    <span className="font-bold text-slate-700">{euro(d.montant)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-emerald-50 rounded-xl">
                  <span className="font-bold text-[#123055] text-lg">
                    Net de poche (avant IR)
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-700">
                    {euro(calc.netAvantIR)} <span className="text-base text-emerald-600">({euro(monthly(calc.netAvantIR))} / mois)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-[linear-gradient(180deg,#0f2742_0%,#102b48_100%)] rounded-2xl p-8 text-center text-white">
              <h3 className="text-2xl font-extrabold mb-3">Besoin d’optimiser ces chiffres ?</h3>
              <p className="text-white/85 mb-6">
                Un expert peut vous aider à réduire légalement vos charges selon votre situation.
              </p>
              https://calendly.com/declic-entrepreneurs/diagnostic
                <Button size="lg" className="bg-[#F59E0B] text-white hover:bg-[#D97706] border-none rounded-xl">
                  Réserver mon diagnostic gratuit (45 min)
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}