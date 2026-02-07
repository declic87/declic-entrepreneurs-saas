"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car, ArrowLeft, Info, Menu, X } from "lucide-react";

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

/* ------------------------------ PAGE ------------------------------ */

export default function SimulateurIK() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [distance, setDistance] = useState<number>(10_000);
  const [puissance, setPuissance] = useState<string>("5"); // CV (3 à 7+)

  // Barème IK (simplifié, cohérent avec ta version)
  const montantIK = useMemo(() => {
    const d = Math.max(0, distance);
    const p = Math.max(3, Math.min(7, parseInt(puissance || "5", 10)));
    let montant = 0;

    if (p <= 3) {
      if (d <= 5000) montant = d * 0.529;
      else if (d <= 20000) montant = d * 0.316 + 1065;
      else montant = d * 0.370;
    } else if (p === 4) {
      if (d <= 5000) montant = d * 0.606;
      else if (d <= 20000) montant = d * 0.340 + 1330;
      else montant = d * 0.407;
    } else if (p === 5) {
      if (d <= 5000) montant = d * 0.636;
      else if (d <= 20000) montant = d * 0.357 + 1395;
      else montant = d * 0.427;
    } else if (p === 6) {
      if (d <= 5000) montant = d * 0.665;
      else if (d <= 20000) montant = d * 0.374 + 1457;
      else montant = d * 0.447;
    } else {
      // 7 CV et +
      if (d <= 5000) montant = d * 0.697;
      else if (d <= 20000) montant = d * 0.394 + 1515;
      else montant = d * 0.470;
    }

    return montant;
  }, [distance, puissance]);

  // Estimation simple d’économie IS (pédagogique)
  const economieIS = useMemo(() => {
    return Math.max(0, montantIK) * 0.15; // 15% (à affiner selon ton contexte)
  }, [montantIK]);

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

          {/* Mobile toggler */}
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
          <Link href="/simulateurs" className="inline-flex items-center text-white/90 hover:text-white">
            <ArrowLeft size={18} className="mr-2" />
            Retour aux simulateurs
          </Link>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
            Calculateur d’Indemnités Kilométriques
          </h1>
          <p className="text-slate-200 mt-2 max-w-2xl">
            Transformez vos déplacements pro en **charges déductibles** (barème
            simplifié par CV et distance).
          </p>
        </div>
      </header>

      {/* CONTENU */}
      <main className="max-w-6xl mx-auto py-12 px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Formulaire */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#123055]">
                <Car size={20} className="text-[#F59E0B]" />
                Votre véhicule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Puissance fiscale</Label>
                <Select value={puissance} onValueChange={setPuissance}>
                  <SelectTrigger className="w-full">
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
                  min={0}
                  value={Number.isFinite(distance) ? distance : ""}
                  onChange={(e) => setDistance(Number(e.target.value || 0))}
                />
              </div>

              <div className="rounded-xl bg-amber-50 text-amber-900 p-3 text-[12px] flex gap-2">
                <Info size={14} className="text-amber-600 mt-0.5" />
                <p>
                  Les barèmes évoluent chaque année selon l’administration. Ce simulateur
                  propose une estimation pédagogique basée sur un barème simplifié.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
                 </p>
              <p className="text-sm text-emerald-600 font-medium">
                Économie d’IS estimée : {euro(economieIS)}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                (Indication. L’économie réelle dépend de votre résultat et régime.)
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
              <Info className="text-blue-600 shrink-0" size={20} />
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Astuce :</strong> pour un véhicule électrique, l’indemnité
                peut être <strong>majorée de 20%</strong> (selon barèmes en vigueur).
              </p>
            </div>

            <div className="text-center">
              https://calendly.com/declic-entrepreneurs/diagnostic
                <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-6 py-5 rounded-xl">
                  Obtenir une validation gratuite (15 min)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER PREMIUM (léger) */}
      <footer className="mt-10 border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Déclic‑Entrepreneur — Estimation pédagogique.  
          <br className="hidden sm:block" />
          Pour un chiffrage exact (barèmes officiels & contexte), réservez un diagnostic.
        </div>
      </footer>
    </div>
  );
}