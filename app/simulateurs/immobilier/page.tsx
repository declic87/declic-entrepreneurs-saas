"use client";

import React, { useMemo, useState } from "react";

/** ----------------------------------------------
 *  Bouton local (léger)
 *  ---------------------------------------------- */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  size?: "md" | "lg";
}
const Button = ({ children, className = "", size = "md", ...props }: ButtonProps) => {
  const sizeClasses = size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm";
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-95 ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/** ----------------------------------------------
 *  Helpers
 *  ---------------------------------------------- */
const euro = (n: number) =>
  isFinite(n) ? n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €" : "—";

function annuiteMensuelle(montant: number, tauxAnnuelPct: number, dureeAns: number) {
  const r = Math.max(0, tauxAnnuelPct) / 100 / 12;
  const n = Math.max(1, dureeAns) * 12;
  if (r === 0) return montant / n;
  return (montant * r) / (1 - Math.pow(1 + r, -n));
}

/** ----------------------------------------------
 *  Page
 *  ---------------------------------------------- */
export default function ImmobilierSimulatorPage() {
  /** Inputs principaux */
  const [valeurBien, setValeurBien] = useState<number>(200_000);
  const [loyerMensuel, setLoyerMensuel] = useState<number>(1_000);
  const [chargesAnnuelles, setChargesAnnuelles] = useState<number>(2_000);
  const [taxeFonciere, setTaxeFonciere] = useState<number>(800);
  const [tmi, setTmi] = useState<number>(30); // taux marginal IR
  const [travaux, setTravaux] = useState<number>(0);
  const [mobilier, setMobilier] = useState<number>(5_000);

  /** Crédit */
  const [apportPct, setApportPct] = useState<number>(10);
  const [tauxCredit, setTauxCredit] = useState<number>(4.0);
  const [duree, setDuree] = useState<number>(20);

  /** Hypothèses pédagogiques (simplifiées) */
  const PRELEV_SOC = 0.172; // 17,2%
  const MICRO_FONCIER_ABATT = 0.30; // abattement micro foncier (si loyers fonciers <= 15k)
  const MICRO_SEUIL = 15000;
  // Amortissements LMNP/SCI IS (très simplifiés) :
  const PART_IMMEUBLE_AMORT = 0.85; // 85% du prix ≈ immeuble (hors terrain)
  const DUREE_IMMEUBLE = 25; // ans
  const DUREE_MOBILIER = 10; // ans
  const DUREE_TRAVAUX = 10; // ans
  // IS :
  const IS_SEUIL_15 = 42500;
  const IS_TAUX_REDUIT = 0.15;
  const IS_TAUX_NORMAL = 0.25;

  const calc = useMemo(() => {
    /** Bases communes */
    const loyerAnnuel = Math.max(0, loyerMensuel) * 12;
    const chargesBase = Math.max(0, chargesAnnuelles) + Math.max(0, taxeFonciere);
    const rendementBrut = valeurBien > 0 ? (loyerAnnuel / valeurBien) * 100 : 0;

    /** Crédit */
    const apport = (Math.max(0, Math.min(100, apportPct)) / 100) * Math.max(0, valeurBien);
    const montantEmprunte = Math.max(0, valeurBien - apport);
    const mensualite = annuiteMensuelle(montantEmprunte, Math.max(0, tauxCredit), Math.max(1, duree));
    const annuite = mensualite * 12;
    // Approx intérêts année 1 (pédagogique)
    const interetsAnnuelApprox = (montantEmprunte * Math.max(0, tauxCredit)) / 100;

    /** Amortissements (LMNP/SCI IS – simplifiés) */
    const amortImmeuble = (Math.max(0, valeurBien) * PART_IMMEUBLE_AMORT) / DUREE_IMMEUBLE;
    const amortMobilier = Math.max(0, mobilier) / DUREE_MOBILIER;
    const amortTravaux = Math.max(0, travaux) / DUREE_TRAVAUX;
    const amortTotal = amortImmeuble + amortMobilier + amortTravaux;

    /** 1) NU – MICRO FONCIER */
    const microPossible = loyerAnnuel <= MICRO_SEUIL;
    const baseMicro = loyerAnnuel * (1 - MICRO_FONCIER_ABATT);
    const irMicro = baseMicro * (Math.max(0, tmi) / 100);
    const psMicro = baseMicro * PRELEV_SOC;
    // Net après impôts/PS (on soustrait charges réelles pour montrer le cash)
    const netNueMicro = loyerAnnuel - chargesBase - irMicro - psMicro;

    /** 2) NU – RÉEL */
    // Au réel : intérêts déductibles
    const baseReelFoncier = Math.max(0, loyerAnnuel - chargesBase - interetsAnnuelApprox);
    const irReel = baseReelFoncier * (Math.max(0, tmi) / 100);
    const psReel = baseReelFoncier * PRELEV_SOC;
    const impotsReelFoncier = irReel + psReel;
    const netNueReel = loyerAnnuel - chargesBase - interetsAnnuelApprox - impotsReelFoncier;

    /** 3) LMNP – RÉEL (BIC) */
    // Résultat BIC = loyers - charges - intérêts - amortissements
    const resultatLMNP = Math.max(0, loyerAnnuel - chargesBase - interetsAnnuelApprox - amortTotal);
    const impotLMNP = resultatLMNP * (Math.max(0, tmi) / 100 + PRELEV_SOC); // simplifié
    const netLMNP = loyerAnnuel - chargesBase - interetsAnnuelApprox - impotLMNP;

    /** 4) SCI IS */
    const benefAvantIS = loyerAnnuel - chargesBase - interetsAnnuelApprox - amortTotal;
    const is =
      benefAvantIS <= 0
        ? 0
        : Math.min(benefAvantIS, IS_SEUIL_15) * IS_TAUX_REDUIT +
          Math.max(0, benefAvantIS - IS_SEUIL_15) * IS_TAUX_NORMAL;
    const tresoSCIIS = loyerAnnuel - chargesBase - interetsAnnuelApprox - is;

    /** Cash-flow mensuel (après mensualité de crédit) */
    const cfMicro = (netNueMicro - annuite) / 12;
    const cfNueReel = (netNueReel - annuite) / 12;
    const cfLMNP = (netLMNP - annuite) / 12;
    const cfSCIIS = (tresoSCIIS - annuite) / 12;

    const results = [
      {
        name: "Nu (Micro)",
        enabled: microPossible,
        netAnnuel: netNueMicro,
        impots: irMicro + psMicro,
        cashflow: cfMicro,
      },
      {
        name: "Nu (Réel)",
        enabled: true,
        netAnnuel: netNueReel,
        impots: impotsReelFoncier,
        cashflow: cfNueReel,
      },
      {
        name: "LMNP (Réel)",
        enabled: true,
        netAnnuel: netLMNP,
        impots: impotLMNP,
        cashflow: cfLMNP,
      },
      {
        name: "SCI IS",
        enabled: true,
        netAnnuel: tresoSCIIS,
        impots: is,
        cashflow: cfSCIIS,
      },
    ]
      .filter((r) => r.enabled)
      .sort((a, b) => b.netAnnuel - a.netAnnuel);

    return {
      loyerAnnuel,
      chargesBase,
      rendementBrut,
      amortImmeuble,
      amortMobilier,
      amortTravaux,
      amortTotal,
      mensualite,
      annuite,
      interetsAnnuelApprox,
      microPossible,
      results,
    };
  }, [
    valeurBien,
    loyerMensuel,
    chargesAnnuelles,
    taxeFonciere,
    tmi,
    travaux,
    mobilier,
    apportPct,
    tauxCredit,
    duree,
  ]);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="pt-10 pb-6 bg-[radial-gradient(1200px_500px_at_20%_-10%,#1f3a5f_0%,transparent_60%),linear-gradient(180deg,#18314f_0%,#0f2742_100%)] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Optimiseur Fiscal Immobilier</h1>
          <p className="text-slate-200 mt-2 max-w-2xl">
            Comparez <b>Nu (Micro/Réel)</b>, <b>LMNP</b> et <b>SCI IS</b>, avec mensualité de crédit, amortissements
            et <b>cash-flow net</b>.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* KPIs */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl p-4 border border-slate-200 bg-white">
            <p className="text-xs text-slate-500 uppercase font-semibold">Loyers / an</p>
            <p className="text-2xl font-extrabold text-[#123055]">{euro(calc.loyerAnnuel)}</p>
          </div>
          <div className="rounded-2xl p-4 border border-slate-200 bg-white">
            <p className="text-xs text-slate-500 uppercase font-semibold">Rendement brut</p>
            <p className="text-2xl font-extrabold text-[#123055]">
              {isFinite(calc.rendementBrut) ? calc.rendementBrut.toFixed(2) + " %" : "—"}
            </p>
          </div>
          <div className="rounded-2xl p-4 border border-slate-200 bg-white">
            <p className="text-xs text-slate-500 uppercase font-semibold">Mensualité crédit</p>
            <p className="text-2xl font-extrabold text-[#123055]">{euro(calc.mensualite)}</p>
          </div>
        </div>

        {/* Inputs */}
        <section className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl p-6 border border-slate-200 bg-white space-y-4">
            <p className="text-sm font-semibold text-[#123055]">Bien & loyers</p>
            <div>
              <label className="text-xs font-medium text-slate-600">Valeur du bien (€)</label>
              <input
                type="number"
                min={0}
                value={valeurBien}
                onChange={(e) => setValeurBien(Number(e.target.value || 0))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Loyer mensuel HC (€)</label>
              <input
                type="number"
                min={0}
                value={loyerMensuel}
                onChange={(e) => setLoyerMensuel(Number(e.target.value || 0))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Charges annuelles (€)</label>
                <input
                  type="number"
                  min={0}
                  value={chargesAnnuelles}
                  onChange={(e) => setChargesAnnuelles(Number(e.target.value || 0))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Taxe foncière (€)</label>
                <input
                  type="number"
                  min={0}
                  value={taxeFonciere}
                  onChange={(e) => setTaxeFonciere(Number(e.target.value || 0))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">TMI (%)</label>
              <select
                value={tmi}
                onChange={(e) => setTmi(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-amber-300 bg-white"
              >
                <option value={0}>0%</option>
                <option value={11}>11%</option>
                <option value={30}>30%</option>
                <option value={41}>41%</option>
                <option value={45}>45%</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl p-6 border border-slate-200 bg-white space-y-4">
            <p className="text-sm font-semibold text-[#123055]">Crédit</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Apport (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={apportPct}
                  onChange={(e) => setApportPct(Number(e.target.value || 0))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Taux (%)</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={tauxCredit}
                  onChange={(e) => setTauxCredit(Number(e.target.value || 0))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Durée (ans)</label>
                <input
                  type="number"
                  min={1}
                  value={duree}
                  onChange={(e) => setDuree(Number(e.target.value || 0))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs text-slate-600">
                Mensualité estimée : <b>{euro(calc.mensualite)}</b> — Intérêts annuels (approx) :{" "}
                <b>{euro(calc.interetsAnnuelApprox)}</b>
              </p>
            </div>
          </div>

          <div className="rounded-2xl p-6 border border-slate-200 bg-white space-y-4">
            <p className="text-sm font-semibold text-[#123055]">Amortissements (LMNP / SCI IS)</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Mobilier (€)</label>
                <input
                  type="number"
                  min={0}
                  value={mobilier}
                  onChange={(e) => setMobilier(Number(e.target.value || 0))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Travaux (€)</label>
                <input
                  type="number"
                  min={0}
                  value={travaux}
                  onChange={(e) => setTravaux(Number(e.target.value || 0))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm">
                <p className="text-emerald-800">
                  Amort total annuel ~ <b>{euro(calc.amortTotal)}</b>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Hypothèses : immeuble 85% sur 25 ans, mobilier 10 ans, travaux 10 ans (pédagogique).
            </p>
          </div>
        </section>

        {/* Comparatif régimes */}
        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {calc.results.map((r, idx) => (
            <div
              key={r.name}
              className={`relative bg-white p-6 rounded-3xl border-2 transition-all shadow-sm ${
                idx === 0 ? "border-emerald-500 ring-2 ring-emerald-200/50" : "border-slate-200"
              }`}
            >
              {idx === 0 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow">
                  MEILLEUR CHOIX
                </div>
              )}
              <h3 className="font-semibold text-slate-500 text-xs mb-1 uppercase tracking-widest">{r.name}</h3>
              <div className="mb-3">
                <p className="text-3xl font-extrabold text-[#123055]">{euro(Math.max(0, r.netAnnuel))}</p>
                <p className="text-xs text-slate-500">Net après impôts / an</p>
              </div>
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500 uppercase">Impôts & PS</span>
                  <span className="text-red-600 font-bold">-{euro(Math.max(0, r.impots))}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500 uppercase">Net / mois</span>
                  <span className="text-slate-900 font-bold">{euro(Math.max(0, r.netAnnuel) / 12)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500 uppercase">Cash-flow (après crédit)</span>
                  <span className={`font-bold ${r.cashflow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {euro(r.cashflow)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Bloc pédagogie amortissement */}
        <section className="mt-8 rounded-3xl bg-[#123055] text-white p-6 md:p-8">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
              <p className="text-sm text-white/80">Amortissement immeuble (25 ans)</p>
              <p className="text-2xl font-extrabold">{euro(calc.amortImmeuble)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
              <p className="text-sm text-white/80">Amortissement mobilier (10 ans)</p>
              <p className="text-2xl font-extrabold">{euro(calc.amortMobilier)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
              <p className="text-sm text-white/80">Amortissement travaux (10 ans)</p>
              <p className="text-2xl font-extrabold">{euro(calc.amortTravaux)}</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mt-4">
            En <b>LMNP/SCI IS</b>, les amortissements réduisent fortement la base imposable (souvent jusqu’à zéro
            pendant plusieurs années), d’où le meilleur <b>net</b> et <b>cash‑flow</b> dans beaucoup de cas.
          </p>
        </section>

        {/* CTA final */}
        <section className="mt-8 text-center">
          <p className="text-xs text-slate-500 mb-3">
            Simulation pédagogique (non contractuelle). Les règles varient selon la situation (déficit foncier,
            micro‑BIC, meublé pro/non pro, option IS/IR, TVA…).
          </p>
          <a
            href="https://calendly.com/declic-entrepreneurs/diagnostic"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl" size="lg">
              Obtenir une étude personnalisée (gratuite)
            </Button>
          </a>
        </section>
      </main>
    </div>
  );
}