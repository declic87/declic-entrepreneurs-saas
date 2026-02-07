"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Landmark,
  AlertCircle,
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

const PFU_2026 = 0.314; // 31,4%
const PRELEV_SOCIAUX = 0.172; // 17,2%
const CSG_DEDUCTIBLE = 0.068; // 6,8% déductible de la base IR
const ABATTEMENT_DIVIDENDES = 0.40; // 40%

function euro(n: number) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}
function monthly(n: number) {
  return n / 12;
}

/* ------------------------------ PAGE ------------------------------ */

export default function SimulateurDividendes() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [montantBrut, setMontantBrut] = useState<number>(10_000);
  const [tmi, setTmi] = useState<number>(30); // Taux marginal d'imposition

  const calculs = useMemo(() => {
    const brut = Math.max(0, montantBrut);
    const tmiRate = Math.max(0, Math.min(45, tmi)) / 100;

    // 1) PFU (Flat Tax) 2026
    // Net = Brut × (1 - 31,4%)
    const netPFU = brut * (1 - PFU_2026);

    // 2) Option Barème IR
    // - Prélèvements sociaux : 17,2% du brut
    // - Base IR : (60% du brut) - (CSG déductible 6,8% du brut) = brut * (0.60 - 0.068)
    // - IR : Base IR × TMI
    // - Net = Brut - Prélèv. sociaux - IR
    const prelevSociaux = brut * PRELEV_SOCIAUX;
    const baseIR = brut * (0.60 - CSG_DEDUCTIBLE); // 60% après abattement 40% - CSG déductible 6,8%
    const ir = Math.max(0, baseIR) * tmiRate;
    const netBareme = brut - prelevSociaux - ir;

    return {
      pfu: {
        net: netPFU,
        tauxAffiche: 31.4,
        mensualise: monthly(netPFU),
      },
      bareme: {
        net: netBareme,
        mensualise: monthly(netBareme),
        prelevSociaux,
        baseIR,
        ir,
      },
      isPFUBetter: netPFU > netBareme,
    };
  }, [montantBrut, tmi]);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR PREMIUM */}
      <nav className="fixed top-0 z-50 w-full bg-[#0d1f33]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
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
            <Link href="/login">
              <Button
                variant="outline"
                className="text-white border-white/20 hover:bg-white/10 px-4"
              >
                Connexion
              </Button>
            </Link>
            <Link href="/app">
              <Button className="bg-white text-[#123055] hover:bg-slate-100 px-4">
                Mon Espace
              </Button>
            </Link>
            <Link
              href="https://calendly.com/declic-entrepreneurs/diagnostic"
              target="_blank"
              rel="noopener noreferrer"
            >
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
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="w-full text-white border-white/20 hover:bg-white/10"
                  >
                    Connexion
                  </Button>
                </Link>
                <Link href="/app">
                  <Button className="w-full bg-white text-[#123055] hover:bg-slate-100">
                    Mon Espace
                  </Button>
                </Link>
                <Link
                  href="https://calendly.com/declic-entrepreneurs/diagnostic"
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
      <header className="pt-28 md:pt-32 pb-10 bg-[radial-gradient(1200px_500px_at_20%_-10%,#1f3a5f_0%,transparent_60%),linear-gradient(180deg,#18314f_0%,#0f2742_100%)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/simulateurs"
            className="inline-flex items-center text-white/80 hover:text-white"
          >
            <ArrowLeft size={18} className="mr-2" />
            Retour aux simulateurs
          </Link>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
            Arbitrage Dividendes 2026
          </h1>
          <p className="text-slate-200 mt-2 max-w-2xl">
            Comparez la <b>Flat Tax (31,4%)</b> au <b>barème de l’IR</b> (abattement 40% +
            CSG déductible 6,8%) selon votre <b>TMI</b>.
          </p>
        </div>
      </header>

      {/* CONTENU */}
      <main className="max-w-7xl mx-auto py-12 px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Saisie */}
          <Card className="shadow-sm border-slate-200 h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#123055]">
                <Landmark size={20} className="text-[#F59E0B]" />
                Vos paramètres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="montant" className="font-medium text-slate-700">
                  Dividendes bruts à distribuer (€)
                </Label>
                <Input
                  id="montant"
                  type="number"
                  min={0}
                  value={Number.isFinite(montantBrut) ? montantBrut : ""}
                  onChange={(e) => setMontantBrut(Number(e.target.value || 0))}
                  className="text-lg font-semibold border-slate-300"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <Label className="font-medium text-slate-700">
                    Votre tranche (TMI)
                  </Label>
                  <span className="text-2xl font-extrabold text-[#F59E0B]">
                    {tmi}%
                  </span>
                </div>
                <Slider
                  value={[tmi]}
                  min={0}
                  max={45}
                  step={1}
                  onValueChange={(val) => setTmi(val[0])}
                  className="py-2"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                  <span>0%</span>
                  <span>11%</span>
                  <span>30%</span>
                  <span>41%</span>
                  <span>45%</span>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 text-amber-900 p-3 text-[12px] flex gap-2">
                <Star size={14} className="text-amber-500 mt-0.5" />
                <p>
                  Pédagogique. Pour une étude complète (quotient familial, abattements spécifiques,
                  revenus annexes), réservez un diagnostic.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          <div className="space-y-4">
            {/* PFU */}
            <div
              className={`p-6 rounded-2xl border-2 transition-all shadow-sm ${
                calculs.isPFUBetter
                  ? "border-[#F59E0B] bg-white ring-4 ring-[#F59E0B]/10"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-[#123055]">
                    Flat Tax (PFU)
                  </h3>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                    Loi 2026
                  </span>
                </div>
                {calculs.isPFUBetter && (
                  <span className="bg-[#F59E0B] text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase">
                    Optimal
                  </span>
                )}
              </div>
              <p className="text-4xl font-extrabold text-[#123055]">
                {euro(calculs.pfu.net)}
              </p>
              <p className="text-xs text-slate-500">
                soit {euro(calculs.pfu.mensualise)} / mois
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Net = Brut × (1 − {Math.round(PFU_2026 * 1000) / 10}%)
              </p>
            </div>

            {/* Barème */}
            <div
              className={`p-6 rounded-2xl border-2 transition-all shadow-sm ${
                !calculs.isPFUBetter
                  ? "border-[#F59E0B] bg-white ring-4 ring-[#F59E0B]/10"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg text-[#123055]">
                  Barème de l’IR
                </h3>
                {!calculs.isPFUBetter && (
                  <span className="bg-[#F59E0B] text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase">
                    Optimal
                  </span>
                )}
              </div>
              <p className="text-4xl font-extrabold text-[#123055]">
                {euro(calculs.bareme.net)}
              </p>
              <p className="text-xs text-slate-500">
                soit {euro(calculs.bareme.mensualise)} / mois
              </p>

              {/* Détail pédagogique */}
              <div className="mt-3 grid sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-slate-500">Prélèv. sociaux (17,2%)</p>
                  <p className="font-semibold">
                    {euro(calculs.bareme.prelevSociaux)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-slate-500">
                    Base IR (60% − CSG 6,8%)
                  </p>
                  <p className="font-semibold">{euro(calculs.bareme.baseIR)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-slate-500">IR ({tmi}%)</p>
                  <p className="font-semibold">{euro(calculs.bareme.ir)}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2">
                Net = Brut − prélèvements (17,2%) − IR sur [(60% − 6,8%) × Brut]
              </p>
            </div>

            {/* Bandeau conseil */}
            <div className="bg-[#123055] p-5 rounded-xl text-white">
              <div className="flex gap-3 items-start">
                <AlertCircle className="text-[#F59E0B] shrink-0" size={20} />
                <div>
                  <p className="text-sm font-semibold mb-1 underline decoration-[#F59E0B] underline-offset-4">
                    Conseil Déclic :
                  </p>
                  <p className="text-[12px] text-white/85 leading-relaxed">
                    {tmi <= 11
                      ? "Avec une TMI à 11% ou moins, l’option barème reste souvent gagnante malgré la hausse du PFU."
                      : "Aux tranches élevées, la Flat Tax devient plus intéressante, mais l’écart dépend de votre profil (revenus, quotient familial, etc.)."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA final */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-400 mb-4 italic">
            Simulation pédagogique basée sur hypothèses 2026. Document non contractuel.
          </p>
          <Link
            href="https://calendly.com/declic-entrepreneurs/diagnostic"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold rounded-xl px-6 py-5 shadow-md">
              Réserver un audit fiscal gratuit
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}