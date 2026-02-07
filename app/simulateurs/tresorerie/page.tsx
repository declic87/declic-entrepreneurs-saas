"use client";

import React, { useMemo, useState } from "react";
import {
  Wallet,
  Calculator,
  Info,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  PiggyBank,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------ Helpers ------------------------------ */
const euro = (n: number) =>
  isFinite(n) ? n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "—";

const monthName = (i: number) => {
  const m = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  return m[(i % 12 + 12) % 12];
};

/* Profils de saisonnalité (poids % du CA annuel par mois → somme = 100) */
const SEASON_PROFILES: Record<string, number[]> = {
  plat: Array(12).fill(100 / 12),
  ete:   [6, 6, 6, 7, 8, 10, 14, 14, 8, 7, 7, 7],              // pic Juillet/Août
  fin:   [6, 6, 6, 7, 7, 7, 8, 8, 10, 12, 13, 10],            // pic Q4
};

/* ------------------------------ Page ------------------------------ */
export default function SimulateurTresoreriePage() {
  /* Hypothèses d’entrée */
  const [tresorerieInitiale, setTresorerieInitiale] = useState<number>(50_000);
  const [caAnnuelHT, setCaAnnuelHT] = useState<number>(120_000);

  const [chargesFixesMensuelles, setChargesFixesMensuelles] = useState<number>(2_000);
  const [salaireNetMensuel, setSalaireNetMensuel] = useState<number>(3_000);
  const [chargesSocialesMensuelles, setChargesSocialesMensuelles] = useState<number>(2_500);

  /* Variables / TVA / IS */
  const [chargesVariablesPct, setChargesVariablesPct] = useState<number>(20); // % du CA
  const [tvaTaux, setTvaTaux] = useState<number>(20); // 0 / 10 / 20
  const [tvaPeriodicite, setTvaPeriodicite] = useState<"mensuelle" | "trimestrielle">("trimestrielle");
  const [tvaDeductibleFixesPct, setTvaDeductibleFixesPct] = useState<number>(15); // % de charges fixes avec TVA déductible

  /* Délais */
  const [dso, setDso] = useState<number>(30); // jours clients (0/30/60)
  const [dpo, setDpo] = useState<number>(30); // jours fournisseurs sur variables (0/30/60)

  /* Saison */
  const [profilSaisonnalite, setProfilSaisonnalite] = useState<"plat" | "ete" | "fin">("plat");

  const [showResults, setShowResults] = useState<boolean>(false);

  /* ------------------------------ MOTEUR ------------------------------ */
  const projection = useMemo(() => {
    /* Répartition du CA annuel par mois selon profil (sommes à 100) */
    const weights = SEASON_PROFILES[profilSaisonnalite] || SEASON_PROFILES.plat;
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const monthlyCAPlan = weights.map((w) => (caAnnuelHT * (w / totalWeight)));

    /* DSO/DPO convertis en nombre de mois (approx en pas de 30 jours) */
    const shiftEnc = Math.round(dso / 30); // 0, 1, 2
    const shiftDecVar = Math.round(dpo / 30);

    /* TVA base */
    const tvaRate = tvaTaux / 100;
    const tvaDedFixRate = tvaDeductibleFixesPct / 100;

    /* IS (acomptes trimestriels) → estimation simple à partir d’un résultat annuel “plan” */
    // Résultat plan (HT) = CA - var - fixes - salaires - charges sociales
    const varTotalPlan = caAnnuelHT * (chargesVariablesPct / 100);
    const fixesAnn = chargesFixesMensuelles * 12;
    const salAnn = salaireNetMensuel * 12;
    const socAnn = chargesSocialesMensuelles * 12;
    const resAvantISPlan = caAnnuelHT - varTotalPlan - fixesAnn - salAnn - socAnn;
    const estimIS =
      resAvantISPlan <= 0
        ? 0
        : resAvantISPlan <= 42_500
        ? resAvantISPlan * 0.15
        : 42_500 * 0.15 + (resAvantISPlan - 42_500) * 0.25;
    const acompteIS = estimIS / 4; // payé M3, M6, M9, M12

    /* Construction mois par mois */
    type Row = {
      mois: number;                // 1..12
      facturationHT: number;       // CA facturé HT du mois
      encaissements: number;       // CA encaissé TTC (selon DSO & TVA)
      decVar: number;              // décaissement charges variables (selon DPO)
      decFixes: number;            // charges fixes
      decSalaire: number;          // salaire net
      decSoc: number;              // charges sociales
      tvaCollectee: number;        // TVA collectée du mois (sur CA facturé)
      tvaDeductible: number;       // TVA déductible (vars + % sur fixes)
      tvaPaye: number;             // TVA payée (mensuelle/trimestrielle)
      isPaye: number;              // IS payé (acomptes trimestriels)
      flux: number;                // encaissements - décaissements
      tresorerie: number;          // cumul
    };

    const rows: Row[] = [];
    let cash = tresorerieInitiale;

    // buffers pour décaler encaissements et décaissements variables
    const encaissementsBuffer = new Array<number>(12 + shiftEnc).fill(0);
    const decVarBuffer = new Array<number>(12 + shiftDecVar).fill(0);

    // accumulateurs TVA pour paiement trimestriel
    let tvaCollecteTrim = 0;
    let tvaDeductTrim = 0;

    for (let m = 0; m < 12; m++) {
      const factHT = monthlyCAPlan[m];                       // facturation du mois (HT)
      const varHT = factHT * (chargesVariablesPct / 100);    // charges variables (HT)
      const fixes = chargesFixesMensuelles;                  // fixes (on prend HT)
      const sal = salaireNetMensuel;
      const soc = chargesSocialesMensuelles;

      // Décalages (approx au mois)
      encaissementsBuffer[m + shiftEnc] += factHT * (1 + tvaRate); // encaissements TTC
      decVarBuffer[m + shiftDecVar] += varHT;                       // décaissement variables (HT)

      // TVA du mois (sur facturation / charges)
      const tvaCollect = factHT * tvaRate; // collectée sur CA (si franchise, tvaRate=0)
      // TVA déductible : 100% sur variables + % paramétrable sur fixes
      const tvaDedVars = varHT * tvaRate;
      const tvaDedFix = fixes * tvaRate * tvaDedFixRate;
      const tvaDed = tvaDedVars + tvaDedFix;

      // Paiements TVA (mensuel ou trimestriel)
      let tvaPayee = 0;
      if (tvaPeriodicite === "mensuelle") {
        tvaPayee = Math.max(0, tvaCollect - tvaDed);
      } else {
        // trimestrielle : on paye en M3,M6,M9,M12 le solde du trimestre
        tvaCollecteTrim += tvaCollect;
        tvaDeductTrim += tvaDed;
        const isQuarterEnd = (m + 1) % 3 === 0;
        if (isQuarterEnd) {
          tvaPayee = Math.max(0, tvaCollecteTrim - tvaDeductTrim);
          tvaCollecteTrim = 0;
          tvaDeductTrim = 0;
        }
      }

      // Paiements IS (acomptes trimestriels)
      let isPay = 0;
      if ((m + 1) % 3 === 0 && estimIS > 0) {
        isPay = acompteIS;
      }

      // Encaissements & décaissements réels du mois
      const encaiss = encaissementsBuffer[m];
      const decVars = decVarBuffer[m];
      const decaissements =
        decVars + fixes + sal + soc + tvaPayee + isPay;

      const flux = encaiss - decaissements;
      cash += flux;

      rows.push({
        mois: m + 1,
        facturationHT: factHT,
        encaissements: encaiss,
        decVar: decVars,
        decFixes: fixes,
        decSalaire: sal,
        decSoc: soc,
        tvaCollectee: tvaCollect,
        tvaDeductible: tvaDed,
        tvaPaye: tvaPayee,
        isPaye: isPay,
        flux,
        tresorerie: cash,
      });
    }

    // KPIs
    const finalCash = rows[11]?.tresorerie ?? tresorerieInitiale;
    const minCash = Math.min(...rows.map((r) => r.tresorerie));
    const maxCash = Math.max(...rows.map((r) => r.tresorerie));
    const firstNeg = rows.find((r) => r.tresorerie < 0);

    // BFR (pédagogique) = DSO * CA mensuel - DPO * var mensuel  (approx)
    const avgCA = caAnnuelHT / 12;
    const avgVar = avgCA * (chargesVariablesPct / 100);
    const bfr = (avgCA * (dso / 30)) - (avgVar * (dpo / 30));

    // Flux moyen (indicatif)
    const meanFlux =
      rows.reduce((acc, r) => acc + r.flux, 0) / (rows.length || 1);

    return {
      rows,
      kpi: {
        finalCash,
        minCash,
        maxCash,
        firstNeg,
        bfr,
        meanFlux,
        estimIS,
        acompteIS,
      },
    };
  }, [
    tresorerieInitiale,
    caAnnuelHT,
    chargesFixesMensuelles,
    salaireNetMensuel,
    chargesSocialesMensuelles,
    chargesVariablesPct,
    tvaTaux,
    tvaPeriodicite,
    tvaDeductibleFixesPct,
    dso,
    dpo,
    profilSaisonnalite,
  ]);

  /* ------------------------------ UI ------------------------------ */
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* HEADER */}
      <header className="pt-24 pb-8 bg-[radial-gradient(1200px_500px_at_20%_-10%,#1f3a5f_0%,transparent_60%),linear-gradient(180deg,#18314f_0%,#0f2742_100%)] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 text-white mb-4 shadow-lg shadow-emerald-200">
            <Wallet size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Simulateur de Trésorerie (12 mois)
          </h1>
          <p className="text-slate-200 mt-2 max-w-2xl">
            Anticipez vos encaissements/décaissements, la TVA, l’IS, et le
            <b> BFR</b> pour piloter votre trésorerie.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* FORMULAIRE */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          {/* LIGNE 1 */}
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Trésorerie actuelle (€)</label>
              <input
                type="number"
                min={0}
                value={tresorerieInitiale}
                onChange={(e) => setTresorerieInitiale(Number(e.target.value || 0))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">CA annuel HT (€)</label>
              <input
                type="number"
                min={0}
                value={caAnnuelHT}
                onChange={(e) => setCaAnnuelHT(Number(e.target.value || 0))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Charges variables (% du CA)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={chargesVariablesPct}
                onChange={(e) => setChargesVariablesPct(Math.max(0, Math.min(100, Number(e.target.value || 0))))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Profil saisonnalité</label>
              <select
                value={profilSaisonnalite}
                onChange={(e) => setProfilSaisonnalite(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none bg-white"
              >
                <option value="plat">Plat</option>
                <option value="ete">Pic été</option>
                <option value="fin">Pic fin d’année</option>
              </select>
            </div>
          </div>

          {/* LIGNE 2 */}
          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Charges fixes / mois (€)</label>
              <input
                type="number"
                min={0}
                value={chargesFixesMensuelles}
                onChange={(e) => setChargesFixesMensuelles(Number(e.target.value || 0))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Salaire net / mois (€)</label>
              <input
                type="number"
                min={0}
                value={salaireNetMensuel}
                onChange={(e) => setSalaireNetMensuel(Number(e.target.value || 0))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Charges sociales / mois (€)</label>
              <input
                type="number"
                min={0}
                value={chargesSocialesMensuelles}
                onChange={(e) => setChargesSocialesMensuelles(Number(e.target.value || 0))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">TVA (%)</label>
              <select
                value={tvaTaux}
                onChange={(e) => setTvaTaux(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none bg-white"
              >
                <option value={0}>0%</option>
                <option value={10}>10%</option>
                <option value={20}>20%</option>
              </select>
            </div>
          </div>

          {/* LIGNE 3 */}
          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Périodicité TVA</label>
              <select
                value={tvaPeriodicite}
                onChange={(e) => setTvaPeriodicite(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none bg-white"
              >
                <option value="mensuelle">Mensuelle</option>
                <option value="trimestrielle">Trimestrielle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">TVA déductible sur fixes (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={tvaDeductibleFixesPct}
                onChange={(e) => setTvaDeductibleFixesPct(Math.max(0, Math.min(100, Number(e.target.value || 0))))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">DSO (jours clients)</label>
              <select
                value={dso}
                onChange={(e) => setDso(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none bg-white"
              >
                <option value={0}>0</option>
                <option value={30}>30</option>
                <option value={60}>60</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">DPO (jours fournisseurs)</label>
              <select
                value={dpo}
                onChange={(e) => setDpo(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-300 outline-none bg-white"
              >
                <option value={0}>0</option>
                <option value={30}>30</option>
                <option value={60}>60</option>
              </select>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6">
            <Button
              onClick={() => setShowResults(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              <Calculator className="mr-2" size={18} />
              Projeter ma trésorerie
            </Button>
          </div>

          {/* Note hyp */}
          <div className="mt-4 rounded-xl bg-emerald-50 text-emerald-900 p-4 text-sm flex gap-2">
            <Info size={16} className="text-emerald-600 mt-0.5" />
            <p>
              Simulation <b>pédagogique</b> : TVA collectée/déductible, acomptes d’IS au trimestre, DSO/DPO
              arrondis au mois. Ajustez vos hypothèses pour tester vos scénarios.
            </p>
          </div>
        </section>

        {/* RÉSULTATS */}
        {showResults && (
          <section className="mt-8 space-y-6">
            {/* KPI */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                <p className="text-slate-500 text-sm">Trésorerie finale</p>
                <p className={`text-2xl font-bold ${projection.kpi.finalCash < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {euro(projection.kpi.finalCash)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                <p className="text-slate-500 text-sm">Point bas (année)</p>
                <p className="text-2xl font-bold text-orange-600">{euro(projection.kpi.minCash)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                <p className="text-slate-500 text-sm">BFR estimé</p>
                <p className="text-2xl font-bold text-blue-600">{euro(projection.kpi.bfr)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
                <p className="text-slate-500 text-sm">Flux mensuel moyen</p>
                <p className="text-2xl font-bold text-slate-800">{euro(projection.kpi.meanFlux)}</p>
              </div>
            </div>

            {/* Alerte rupture */}
            {projection.kpi.firstNeg && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 items-center">
                <AlertTriangle className="text-red-500" />
                <p className="text-red-700 text-sm">
                  Attention : rupture de trésorerie prévue en <b>{monthName(projection.kpi.firstNeg.mois - 1)}</b>.
                  Envisagez un financement court terme (Dailly, découvert pro) ou négociez vos délais.
                </p>
              </div>
            )}

            {/* Tableau mensuel */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-4">Mois</th>
                      <th className="p-4 text-right">Encaissements</th>
                      <th className="p-4 text-right">Décaissements</th>
                      <th className="p-4 text-right">Flux</th>
                      <th className="p-4 text-right">Trésorerie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.rows.map((r) => {
                      const decaissements =
                        r.decVar + r.decFixes + r.decSalaire + r.decSoc + r.tvaPaye + r.isPaye;
                      return (
                        <tr key={r.mois} className="border-b hover:bg-slate-50">
                          <td className="p-4 font-medium">{monthName(r.mois - 1)}</td>
                          <td className="p-4 text-right text-emerald-600">+{euro(r.encaissements)}</td>
                          <td className="p-4 text-right text-red-600">-{euro(decaissements)}</td>
                          <td className={`p-4 text-right ${r.flux < 0 ? "text-red-600" : "text-slate-800"}`}>
                            {euro(r.flux)}
                          </td>
                          <td className={`p-4 text-right font-bold ${r.tresorerie < 0 ? "text-red-600" : ""}`}>
                            {euro(r.tresorerie)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Détails TVA / IS (optionnels) */}
              <div className="p-4 text-xs text-slate-500 border-t bg-slate-50">
                Paiements IS trimestriels estimés : <b>{euro(projection.kpi.acompteIS)}</b> à M3, M6, M9, M12.
                Paiement TVA : <b>{tvaPeriodicite === "mensuelle" ? "mensuel" : "trimestriel"}</b> selon options ci‑dessus.
              </div>
            </div>

            {/* Conseils rapides */}
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="rounded-2xl p-4 border bg-white">
                <div className="text-emerald-600 mb-1">
                  <PiggyBank size={18} />
                </div>
                <p className="text-sm font-semibold text-[#123055]">Trésorerie de sécurité</p>
                <p className="text-sm text-slate-600">
                  Conservez ~3 mois de charges d’exploitation en réserve pour absorber la saisonnalité.
                </p>
              </div>
              <div className="rounded-2xl p-4 border bg-white">
                <div className="text-blue-600 mb-1">
                  <TrendingUp size={18} />
                </div>
                <p className="text-sm font-semibold text-[#123055]">Optimiser le DSO</p>
                <p className="text-sm text-slate-600">
                  Facturation rapide, acomptes, escompte de règlement, prélèvement SEPA pour réduire le DSO.
                </p>
              </div>
              <div className="rounded-2xl p-4 border bg-white">
                <div className="text-rose-600 mb-1">
                  <TrendingDown size={18} />
                </div>
                <p className="text-sm font-semibold text-[#123055]">Négocier le DPO</p>
                <p className="text-sm text-slate-600">
                  Allongez les délais fournisseurs sur vos charges variables (sans pénalité) pour lisser vos flux.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2 text-center">
              <a
                href="https://calendly.com/declic-entrepreneurs/diagnostic"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl px-6 py-5">
                  Obtenir une stratégie cash (gratuite – 45 min)
                </Button>
              </a>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}