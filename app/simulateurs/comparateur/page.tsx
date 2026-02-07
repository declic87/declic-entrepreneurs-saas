"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Calculator,
  Menu,
  X,
  Star,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------ NAV ------------------------------ */

const NAV_LINKS = [
  { label: "Simulateurs", href: "/simulateurs" },
  { label: "Formations", href: "/formations" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "RDV Stratégique", href: "/#rdv" },
  { label: "FAQ", href: "/#faq" },
];

/* ------------------------------ HELPERS ------------------------------ */

function euro(n: number) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}
function monthly(n: number) {
  return n / 12;
}

/* ------------------------------ PAGE ------------------------------ */

export default function ComparateurPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Entrées utilisateur (toutes modifiables) */
  const [ca, setCa] = useState<number>(60_000);
  const [frais, setFrais] = useState<number>(5_000);

  // Micro
  const [microRegime, setMicroRegime] = useState<"BNC_34" | "BIC_50">("BNC_34");
  const [tauxMoyenIR, setTauxMoyenIR] = useState<number>(10); // % moyen d’IR pour pédagogie

  // EURL (IS)
  const [dividendesEURLPct, setDividendesEURLPct] = useState<number>(0); // % bénéfice net d'IS distribué

  // SASU
  const [mixSASUSalaire, setMixSASUSalaire] = useState<number>(70); // % de l’enveloppe (CA-frais) alloué au salaire, reste en dividendes

  // Hypothèses (simplifiées, affichées)
  const hypo = {
    // Micro
    micro_cotiz_bnc: 0.211, // 21,1% du CA
    micro_cotiz_bic: 0.212, // approx. proche
    micro_abatt_bnc: 0.34,
    micro_abatt_bic: 0.5,

    // EURL IS (TNS) — simplifié
    // On considère une base = CA - frais ; charges sociales ~35% du “net pro” (approx)
    eurl_cotiz_ratio: 0.35,
    is_taux_reduit_seuil: 42500, // seuil 15% (à ajuster si besoin)
    is_taux_reduit: 0.15,
    is_taux_normal: 0.25,
    pfu: 0.30, // PFU 30% (12.8 IR + 17.2 PS)

    // SASU — simplifié pédagogique
    // coût employeur = brut * 1.42 ; net salarié ≈ brut * 0.78 (charges salariales ~22%)
    sasu_charge_patr: 0.42,
    sasu_charge_salar: 0.22,
  };

  /* ------------------------------ CALCULS ------------------------------ */
  const result = useMemo(() => {
    const safeCA = Math.max(0, ca);
    const safeFrais = Math.max(0, frais);

    /* MICRO */
    const cotizMicroRate =
      microRegime === "BNC_34" ? hypo.micro_cotiz_bnc : hypo.micro_cotiz_bic;
    const abatt =
      microRegime === "BNC_34" ? hypo.micro_abatt_bnc : hypo.micro_abatt_bic;

    const cotizMicro = safeCA * cotizMicroRate;
    const baseIRMicro = safeCA - cotizMicro; // base “pedago”
    const irMicro = baseIRMicro * (Math.max(0, Math.min(100, tauxMoyenIR)) / 100);
    const netMicro = baseIRMicro - irMicro;

    /* EURL (IS) — simplifié */
    const baseEURL = Math.max(0, safeCA - safeFrais);
    const cotizEURL = baseEURL * hypo.eurl_cotiz_ratio;
    const benefAvantIS = Math.max(0, baseEURL - cotizEURL);
    // IS : 15% jusqu’au seuil, puis 25%
    const isPartReduite = Math.min(benefAvantIS, hypo.is_taux_reduit_seuil);
    const isPartNormale = Math.max(0, benefAvantIS - hypo.is_taux_reduit_seuil);
    const isTotal =
      isPartReduite * hypo.is_taux_reduit + isPartNormale * hypo.is_taux_normal;

    const benefApresIS = Math.max(0, benefAvantIS - isTotal);
    const dividendesDistribues = Math.max(
      0,
      (benefApresIS * Math.max(0, Math.min(100, dividendesEURLPct))) / 100
    );
    const pfuEURL = dividendesDistribues * hypo.pfu;
    const netEURL = benefApresIS - pfuEURL; // supposé intégralement pour l'entrepreneur (pédago)

    /* SASU — mix salaire / dividendes */
    const enveloppe = Math.max(0, safeCA - safeFrais);

    // Part Salaire
    const partSalaire = (enveloppe * Math.max(0, Math.min(100, mixSASUSalaire))) / 100;
    // coût employeur = brut * (1 + charges patronales)
    // net salarié = brut * (1 - charges salariales)
    // On veut coller au “budget” partSalaire = coût employeur
    const sasuBrut = partSalaire / (1 + hypo.sasu_charge_patr);
    const sasuNet = sasuBrut * (1 - hypo.sasu_charge_salar);
    const sasuCotizPat = sasuBrut * hypo.sasu_charge_patr;
    const sasuCotizSal = sasuBrut * hypo.sasu_charge_salar;
    const chargesSalaireTot = sasuCotizPat + sasuCotizSal;

    // Part Dividendes
    const partDiv = Math.max(0, enveloppe - partSalaire);
    // on assimile la partDiv à bénéfice distribuable => PFU
    const pfuSASU = partDiv * hypo.pfu;
    const netDivSASU = partDiv - pfuSASU;

    const netSASU = sasuNet + netDivSASU;

    return {
      MICRO: {
        net: netMicro,
        charges: cotizMicro,
        impots: irMicro,
        details: microRegime === "BNC_34"
          ? "Abatt. 34%, cotisations ~21,1% du CA, IR moyen appliqué"
          : "Abatt. 50%, cotisations ~21,2% du CA, IR moyen appliqué",
      },
      EURL: {
        net: netEURL,
        charges: cotizEURL,
        impots: isTotal + pfuEURL,
        details:
          "Cotisations ~35% de la base (CA - frais), IS (15%/25%), PFU 30% sur dividendes distribués",
        extras: {
          benefAvantIS,
          isTotal,
          benefApresIS,
          dividendesDistribues,
          pfuEURL,
        },
      },
      SASU: {
        net: netSASU,
        charges: chargesSalaireTot,
        impots: pfuSASU,
        details:
          "Salaire (patronales ~42%, salariales ~22%) + PFU 30% sur dividendes",
        extras: {
          sasuBrut,
          sasuNet,
          sasuCotizPat,
          sasuCotizSal,
          partDiv,
          pfuSASU,
          netDivSASU,
        },
      },
      base: { safeCA, safeFrais, enveloppe },
    };
  }, [ca, frais, microRegime, tauxMoyenIR, dividendesEURLPct, mixSASUSalaire]);

  const lignes = [
    {
      label: "Micro‑Entreprise",
      k: "MICRO" as const,
      note: "Simple, frais non déductibles",
    },
    {
      label: "EURL (IS)",
      k: "EURL" as const,
      note: "Bon compromis charges/protection",
    },
    {
      label: "SASU (mix salaire/dividendes)",
      k: "SASU" as const,
      note: "Protection élevée, coût salarial important",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR PREMIUM */}
      <nav className="fixed top-0 z-50 w-full bg-[#0d1f33]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="md" showText variant="light" />
          </Link>

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

          <button
            className="md:hidden p-2 text-slate-200"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

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
            Comparateur Fiscal & Social
          </h1>
          <p className="text-slate-200 mt-2 max-w-2xl">
            Comparez <b>Micro</b>, <b>EURL (IS)</b> et <b>SASU</b> avec un
            résumé clair : net dans votre poche, charges, impôts, et options
            (dividendes, mix salaire/dividendes).
          </p>
        </div>
      </header>

      {/* CONTENU */}
      <main className="py-10 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#123055]">
                <Calculator size={20} className="text-[#F59E0B]" />
                Vos données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ca">Chiffre d’affaires (€/an)</Label>
                <Input
                  id="ca"
                  type="number"
                  min={0}
                  value={Number.isFinite(ca) ? ca : ""}
                  onChange={(e) => setCa(Number(e.target.value || 0))}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frais">Frais déductibles (€/an)</Label>
                <Input
                  id="frais"
                  type="number"
                  min={0}
                  value={Number.isFinite(frais) ? frais : ""}
                  onChange={(e) => setFrais(Number(e.target.value || 0))}
                  className="border-slate-300"
                />
                <p className="text-[11px] text-slate-500">
                  Exemples : loyer, matériel, amort., abonnements, déplacements…
                </p>
              </div>

              <div className="space-y-2">
                <Label>Régime micro</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={microRegime === "BNC_34" ? "default" : "outline"}
                    className={
                      microRegime === "BNC_34"
                        ? "bg-[#F59E0B] hover:bg-[#D97706]"
                        : ""
                    }
                    onClick={() => setMicroRegime("BNC_34")}
                  >
                    BNC (abatt. 34%)
                  </Button>
                  <Button
                    variant={microRegime === "BIC_50" ? "default" : "outline"}
                    className={
                      microRegime === "BIC_50"
                        ? "bg-[#F59E0B] hover:bg-[#D97706]"
                        : ""
                    }
                    onClick={() => setMicroRegime("BIC_50")}
                  >
                    BIC (abatt. 50%)
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ir">Taux moyen d’IR (%)</Label>
                <Input
                  id="ir"
                  type="number"
                  min={0}
                  max={45}
                  value={tauxMoyenIR}
                  onChange={(e) =>
                    setTauxMoyenIR(Math.max(0, Math.min(45, Number(e.target.value || 0))))
                  }
                />
                <p className="text-[11px] text-slate-500">
                  Pédagogique : applique un taux moyen global (ex. 10%).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diveurl">% dividendes EURL (après IS)</Label>
                <Input
                  id="diveurl"
                  type="number"
                  min={0}
                  max={100}
                  value={dividendesEURLPct}
                  onChange={(e) =>
                    setDividendesEURLPct(
                      Math.max(0, Math.min(100, Number(e.target.value || 0)))
                    )
                  }
                />
                <p className="text-[11px] text-slate-500">
                  Portion du bénéfice net d’IS distribuée et taxée au PFU (30%).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mixsasu">
                  SASU : % enveloppe allouée au <b>salaire</b>
                </Label>
                <Input
                  id="mixsasu"
                  type="number"
                  min={0}
                  max={100}
                  value={mixSASUSalaire}
                  onChange={(e) =>
                    setMixSASUSalaire(
                      Math.max(0, Math.min(100, Number(e.target.value || 0)))
                    )
                  }
                />
                <p className="text-[11px] text-slate-500">
                  Le reste part en dividendes (PFU 30%).
                </p>
              </div>

              <div className="rounded-lg bg-amber-50 text-amber-900 text-[12px] p-3 flex gap-2">
                <Star size={14} className="text-amber-500 mt-0.5" />
                <p>
                  Hypothèses pédagogiques. Pour un chiffrage exact (barème IR, options IS/IR, plafonds micro),{" "}
                  <Link
                    href="https://calendly.com/declic-entrepreneurs/diagnostic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    réservez un diagnostic
                  </Link>
                  .
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tableau comparatif compact */}
            <div className="grid gap-4">
              {lignes.map((row, idx) => {
                const R = (result as any)[row.k] as {
                  net: number;
                  charges: number;
                  impots: number;
                  details: string;
                  extras?: any;
                };
                const annuel = Math.max(0, R.net);
                const mensuel = monthly(annuel);

                return (
                  <div
                    key={row.k}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#123055]">
                            {row.label}
                          </h3>
                          {idx === 0 && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                              OPTIMAL
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{row.note}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-[#123055]">
                          {euro(annuel)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Net dans votre poche / an ({euro(mensuel)}/mois)
                        </p>
                      </div>
                    </div>

                    {/* Détail charges/impôts */}
                    <div className="mt-4 grid md:grid-cols-3 gap-3">
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Charges sociales</p>
                        <p className="font-semibold">{euro(R.charges)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Impôts (IR/IS/PFU)</p>
                        <p className="font-semibold">{euro(R.impots)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Comment on calcule</p>
                        <p className="text-xs text-slate-600">{R.details}</p>
                      </div>
                    </div>

                    {/* Pour SASU et EURL : extra pédagogie */}
                    {row.k === "SASU" && (
                      <div className="mt-3 text-xs text-slate-500">
                        <p>
                          Salaire net estimé : <b>{euro(result.SASU.extras.sasuNet)}</b> —
                          Charges patronales : {euro(result.SASU.extras.sasuCotizPat)} — salariales :{" "}
                          {euro(result.SASU.extras.sasuCotizSal)} — Dividendes nets :{" "}
                          {euro(result.SASU.extras.netDivSASU)}.
                        </p>
                      </div>
                    )}
                    {row.k === "EURL" && (
                      <div className="mt-3 text-xs text-slate-500">
                        <p>
                          Bénéf. avant IS : <b>{euro(result.EURL.extras.benefAvantIS)}</b> — IS total :{" "}
                          {euro(result.EURL.extras.isTotal)} — Bénéf. après IS :{" "}
                          {euro(result.EURL.extras.benefApresIS)} — Dividendes :{" "}
                          {euro(result.EURL.extras.dividendesDistribues)} — PFU :{" "}
                          {euro(result.EURL.extras.pfuEURL)}.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bandeau “analyse rapide” */}
            <Card className="bg-[#123055] text-white border-[#102a4a]">
              <CardContent className="pt-6">
                <div className="flex gap-3 items-start">
                  <CheckCircle2 className="text-emerald-400 mt-0.5" size={18} />
                  <div>
                    <p className="font-semibold mb-1">
                      Lecture rapide (pédagogique)
                    </p>
                    <p className="text-white/85 text-sm">
                      La comparaison varie surtout selon vos <b>frais réels</b>, votre
                      <b> taux moyen d’IR</b> et, en SASU, votre <b>mix salaire/dividendes</b>.
                      Pour un plan d’action adapté (dividendes, options IS/IR, PEA, holding),
                      réservez un diagnostic gratuit.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="pt-2 text-center">
              <Link
                href="https://calendly.com/declic-entrepreneurs/diagnostic"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-6 rounded-xl">
                  Obtenir une simulation détaillée gratuite
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}