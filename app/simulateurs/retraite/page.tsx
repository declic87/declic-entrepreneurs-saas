"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Landmark,
  ArrowLeft,
  Info,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

/* ------------------------------ Helpers ------------------------------ */

const euro = (n: number) =>
  isFinite(n) ? n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €" : "—";
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/* ------------------------------ Hypothèses pédagogiques (2026) ------------------------------ */
/* NB : Hypothèses simplifiées pour pédagogie, non contractuelles. */
const PASS_2026 = 46_368;     // plafond annuel sécu approx (pédago)
const AGE_LEGAL = 64;
const TRIMESTRES_REQUIS = 172; // cible taux plein
const TAUX_PLEIN = 0.50;       // 50% sur base sécu (pension de base)

/* Décote/surcote (pédagogiques) : 1,25%/trimestre manquant/excédentaire (limités à ±20) */
function coefDecoteSurcote(trimestresAquis: number) {
  const manquants = Math.max(0, TRIMESTRES_REQUIS - trimestresAquis);
  const excedent = Math.max(0, trimestresAquis - TRIMESTRES_REQUIS);
  const decote = Math.min(20, manquants) * 0.0125;
  const surcote = Math.min(20, excedent) * 0.0125;
  return clamp(1 - decote + surcote, 0.75, 1.25);
}

/* ------------------------------ Page ------------------------------ */

export default function SimulateurRetraitePage() {
  /* Entrées utilisateur */
  const [age, setAge] = useState<number>(40);
  const [ageDepart, setAgeDepart] = useState<number>(64);
  const [statut, setStatut] = useState<"micro" | "sasu" | "eurl">("micro");
  const [revenusAnnuels, setRevenusAnnuels] = useState<number>(50_000);
  const [anneesCotisees, setAnneesCotisees] = useState<number>(15);

  /* Spécifique SASU : part des revenus versée en SALAIRE (le reste est dividendes → n’ouvre pas de droits) */
  const [mixSalaireSASU, setMixSalaireSASU] = useState<number>(70); // en %

  /* Calculs de bases trimestres & coefficients */
  const anneesRestantes = Math.max(0, ageDepart - age);
  const trimestresActuels = Math.max(0, anneesCotisees) * 4;
  const trimestresProjetes = trimestresActuels + Math.max(0, anneesRestantes) * 4;
  const coefTrimestres = clamp(trimestresProjetes / TRIMESTRES_REQUIS, 0, 1);
  const coefTaux = coefDecoteSurcote(trimestresProjetes);

  const result = useMemo(() => {
    /* ------------- 1) MICRO-ENTREPRISE ------------- */
    // Base "cotisable" pédagogique : CA x 66% (abattement 34% prestations)
    const baseCotisableMicro = Math.max(0, revenusAnnuels) * 0.66;
    const baseRefMicro = Math.min(baseCotisableMicro, PASS_2026);

    // Pension de base ~ 50% * baseRef * (trimestres/172) * (1 ± décote/surcote)
    const pensionBaseMicro = TAUX_PLEIN * baseRefMicro * coefTrimestres * coefTaux;

    // Complémentaire micro – très limitée (approx pédagogique)
    const pensionComplMicro = baseRefMicro * 0.06 * (anneesCotisees / 42);
    const pensionMicro = clamp(pensionBaseMicro + pensionComplMicro, 0, revenusAnnuels * 0.75);

    // Cotisations retraite (pédagogique) : ~21,2% du CA * 45% part retraite
    const cotRetraiteMicro = Math.max(0, revenusAnnuels) * 0.212 * 0.45;

    /* ------------- 2) SASU (assimilé salarié) ------------- */
    // Seule la part SALAIRE ouvre des droits. On reconstitue un BRUT à partir d’un net “salaire”.
    const netSalaireSASU = Math.max(0, revenusAnnuels) * (clamp(mixSalaireSASU, 0, 100) / 100);
    const brutSASU = netSalaireSASU / 0.78; // ~22% charges salariales
    const baseRefSASU = Math.min(brutSASU, PASS_2026);

    const pensionBaseSASU = TAUX_PLEIN * baseRefSASU * coefTrimestres * coefTaux;

    // Agirc-Arrco pédagogique : ~7% du BRUT, proratisé années/42
    const pensionComplSASU = brutSASU * 0.07 * ( (anneesCotisees + anneesRestantes) / 42 );
    const pensionSASU = clamp(pensionBaseSASU + pensionComplSASU, 0, revenusAnnuels * 0.85);

    // Cotisations retraite (part employeur + salariales sur la “brique retraite”) ≈ 28% BRUT pédagogique
    const cotRetraiteSASU = brutSASU * 0.28;

    /* ------------- 3) EURL / TNS ------------- */
    // Base = rémunération nette TNS
    const baseRefTNS = Math.min(Math.max(0, revenusAnnuels), PASS_2026);
    const pensionBaseTNS = TAUX_PLEIN * baseRefTNS * coefTrimestres * coefTaux;

    // Complémentaire TNS (approx pédagogique)
    const pensionComplTNS = revenusAnnuels * 0.05 * ((anneesCotisees + anneesRestantes) / 42);
    const pensionTNS = clamp(pensionBaseTNS + pensionComplTNS, 0, revenusAnnuels * 0.75);

    // Cotisations retraite TNS : ~22% (pédagogique) de la rémunération
    const cotRetraiteTNS = Math.max(0, revenusAnnuels) * 0.22;

    /* Comparatif trié par pension */
    const rows = [
      {
        key: "micro",
        label: "Micro‑entreprise",
        pensionAnn: pensionMicro,
        pensionMonth: pensionMicro / 12,
        cotisationsAnn: cotRetraiteMicro,
        txRempl: (pensionMicro / Math.max(1, revenusAnnuels * 0.66)) * 100, // vs base cotisable micro
        tips: "Micro simple mais droits limités. Pensez au passage en société si vos revenus montent.",
      },
      {
        key: "sasu",
        label: "SASU (assimilé salarié)",
        pensionAnn: pensionSASU,
        pensionMonth: pensionSASU / 12,
        cotisationsAnn: cotRetraiteSASU,
        txRempl: (pensionSASU / Math.max(1, revenusAnnuels)) * 100, // vs net annuel déclaré
        tips: "Augmenter la part en SALAIRE ↑ droits retraite (les dividendes n’ouvrent pas de droits).",
      },
      {
        key: "eurl",
        label: "EURL / TNS",
        pensionAnn: pensionTNS,
        pensionMonth: pensionTNS / 12,
        cotisationsAnn: cotRetraiteTNS,
        txRempl: (pensionTNS / Math.max(1, revenusAnnuels)) * 100,
        tips: "Bon compromis coût/droits. Optimisable avec un pilotage fin de la rémunération.",
      },
    ].sort((a, b) => b.pensionAnn - a.pensionAnn);

    /* Ligne “active” en fonction du statut sélectionné */
    const active =
      statut === "micro" ? rows.find((r) => r.key === "micro") :
      statut === "sasu" ? rows.find((r) => r.key === "sasu") :
      rows.find((r) => r.key === "eurl");

    return { rows, active };
  }, [revenusAnnuels, anneesCotisees, anneesRestantes, mixSalaireSASU, coefTrimestres, coefTaux, statut]);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* HEADER */}
      <header className="pt-28 md:pt-32 pb-10 bg-[radial-gradient(1200px_500px_at_20%_-10%,#1f3a5f_0%,transparent_60%),linear-gradient(180deg,#18314f_0%,#0f2742_100%)] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-white/90">
            <Link href="/simulateurs" className="inline-flex items-center hover:text-white">
              <ArrowLeft size={18} className="mr-2" />
              Retour aux simulateurs
            </Link>
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
            Simulateur Retraite – Entrepreneur
          </h1>
          <p className="text-slate-200 mt-2 max-w-2xl">
            Comparez l’impact du <b>statut</b> (Micro, SASU, EURL/TNS) sur votre <b>pension estimée</b>, avec
            paramétrage <b>âge de départ</b> et <b>trimestres</b>.
          </p>
        </div>
      </header>

      {/* CONTENU */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* FORMULAIRE */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Choix du statut */}
            <div className="lg:col-span-4">
              <label className="block text-sm font-semibold text-[#123055] mb-3">
                Votre statut (actuel ou projeté)
              </label>
              <div className="grid sm:grid-cols-3 gap-3">
                {(["micro","sasu","eurl"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatut(s)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      statut === s ? "border-amber-500 bg-amber-50/60" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-bold text-[#123055]">
                      {s === "micro" ? "Micro‑entreprise" : s === "sasu" ? "SASU (assimilé salarié)" : "EURL / TNS"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s === "micro" ? "Indépendant simplifié"
                        : s === "sasu" ? "Salaire → ouvre des droits"
                        : "Travailleur non salarié"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Données personnelles */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Âge actuel</label>
              <input
                type="number"
                min={16}
                value={age}
                onChange={(e) => setAge(Number(e.target.value || 0))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Âge de départ visé</label>
              <input
                type="number"
                min={age}
                value={ageDepart}
                onChange={(e) => setAgeDepart(Number(e.target.value || 0))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Décote/surcote pédagogique appliquée selon trimestres.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {statut === "micro" ? "CA annuel estimé (€)" : "Rémunération nette annuelle (€)"}
              </label>
              <input
                type="number"
                min={0}
                value={revenusAnnuels}
                onChange={(e) => setRevenusAnnuels(Number(e.target.value || 0))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Années déjà cotisées</label>
              <input
                type="number"
                min={0}
                value={anneesCotisees}
                onChange={(e) => setAnneesCotisees(Number(e.target.value || 0))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">1 an = 4 trimestres (pédagogique)</p>
            </div>

            {/* Contrôle SASU : mix salaire */}
            {statut === "sasu" && (
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SASU : part versée en salaire (%) – le reste en dividendes (≠ droits retraite)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={mixSalaireSASU}
                  onChange={(e) => setMixSalaireSASU(Number(e.target.value || 0))}
                  className="w-full"
                />
                <p className="text-sm text-slate-600 mt-1">
                  Actuellement : <b>{mixSalaireSASU}%</b> du revenu en <b>salaire</b>.
                </p>
              </div>
            )}
          </div>

          {/* Alerte hypothèses */}
          <div className="mt-6 rounded-xl bg-amber-50 text-amber-900 p-4 text-sm flex gap-2">
            <Info size={16} className="text-amber-500 mt-0.5" />
            <p>
              <b>Hypothèses pédagogiques.</b> Le calcul officiel dépend de nombreux paramètres (carrières, points
              complémentaires, plafonds, régimes, périodes validées…). Utilisez ce simulateur pour comparer les ordres
              de grandeur, puis faites valider par un expert.
            </p>
          </div>
        </section>

        {/* RÉSULTATS */}
        <section className="mt-8">
          {/* Bandeau récap “statut sélectionné” */}
          <div className="bg-[#123055] text-white rounded-2xl p-8 text-center">
            <p className="text-white/80 uppercase tracking-widest text-sm font-bold mb-1">
              Pension mensuelle estimée — {result.active?.label}
            </p>
            <h2 className="text-5xl font-extrabold">
              {euro(result.active?.pensionMonth ?? 0)}
              <span className="text-2xl font-normal text-white/70"> / mois</span>
            </h2>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-white/85 text-sm">
              <span className="bg-white/10 px-3 py-1 rounded-full">
                Taux de remplacement :{" "}
                <b>{Math.round(result.active ? result.active.txRempl : 0)}%</b>
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full">
                Cotisations retraite (est.) : <b>{euro(result.active?.cotisationsAnn ?? 0)}</b> / an
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full">
                Trimestres à {ageDepart} ans : <b>{trimestresActuels + anneesRestantes * 4}</b> / {TRIMESTRES_REQUIS}
              </span>
            </div>
          </div>

          {/* Cartes comparatives */}
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {result.rows.map((r, i) => (
              <div
                key={r.label}
                className={`rounded-2xl border p-6 bg-white shadow-sm ${
                  i === 0 ? "border-emerald-400 ring-2 ring-emerald-200/60" : "border-slate-200"
                }`}
              >
                {i === 0 && (
                  <div className="mb-2 text-[10px] inline-block bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                    OPTIMAL
                  </div>
                )}
                <p className="text-xs uppercase text-slate-500 font-semibold">{r.label}</p>
                <p className="text-3xl font-extrabold text-[#123055] mt-1">{euro(r.pensionAnn)}</p>
                <p className="text-xs text-slate-500">soit {euro(r.pensionMonth)} / mois</p>

                <div className="mt-4 space-y-2 border-t pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 uppercase">Cotisations (est.)</span>
                    <span className="font-semibold">{euro(r.cotisationsAnn)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 uppercase">Taux de remplacement</span>
                    <span className="font-semibold">{Math.round(r.txRempl)}%</span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-600">{r.tips}</p>
              </div>
            ))}
          </div>

          {/* Conseils actionnables */}
          <div className="mt-8 grid lg:grid-cols-3 gap-4">
            <div className="rounded-2xl p-4 border bg-white">
              <div className="text-amber-600 mb-1">
                <AlertTriangle size={18} />
              </div>
              <p className="text-sm font-semibold text-[#123055]">Valider vos trimestres manquants</p>
              <p className="text-sm text-slate-600">
                Anticipez les trimestres restantes avant {AGE_LEGAL} ans. La décote peut réduire significativement la
                pension si vous partez trop tôt.
              </p>
            </div>
            <div className="rounded-2xl p-4 border bg-white">
              <div className="text-emerald-600 mb-1">
                <TrendingUp size={18} />
              </div>
              <p className="text-sm font-semibold text-[#123055]">SASU : privilégier le salaire</p>
              <p className="text-sm text-slate-600">
                Les <b>dividendes</b> n’ouvrent <b>aucun droit retraite</b>. Ajustez le <b>mix salaire</b> pour booster
                vos points.
              </p>
            </div>
            <div className="rounded-2xl p-4 border bg-white">
              <div className="text-amber-600 mb-1">
                <Info size={18} />
              </div>
              <p className="text-sm font-semibold text-[#123055]">TNS : optimiser la base</p>
              <p className="text-sm text-slate-600">
                En EURL/TNS, la <b>rémunération</b> pilote vos droits. Arbitrer entre <b>cotisations</b> et{" "}
                <b>droits futurs</b> est un vrai levier.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <p className="text-xs text-slate-500 mb-3">
              Simulation pédagogique (non contractuelle). Pour un bilan complet (carrière, points, rachats, options),
              prenez un rendez‑vous gratuit.
            </p>
            <a
              href="https://calendly.com/declic-entrepreneurs/diagnostic"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl px-6 py-5">
                Obtenir un diagnostic retraite (gratuit – 45 min)
              </Button>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}