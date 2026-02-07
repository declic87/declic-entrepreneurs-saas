"use client";

import React, { useMemo, useState } from "react";
import {
  Calculator,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  Euro,
  ArrowRight,
} from "lucide-react";

/* ------------------------------ Helpers ------------------------------ */
const euro = (val: number) =>
  isFinite(val)
    ? val.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
    : "—";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/* ------------------------------ Page ------------------------------ */
export default function PrevisionnelPage() {
  /* ÉTATS ENTRÉES */
  const [chiffreAffairesInitial, setChiffreAffairesInitial] = useState<number>(50_000);
  const [croissanceAnnuelle, setCroissanceAnnuelle] = useState<number>(15); // %
  const [chargesVariables, setChargesVariables] = useState<number>(20); // % du CA
  const [chargesFixesMensuelles, setChargesFixesMensuelles] = useState<number>(1_000);
  const [salaireMensuelInitial, setSalaireMensuelInitial] = useState<number>(2_000);
  const [tauxChargesSociales, setTauxChargesSociales] = useState<number>(45); // % du salaire
  const [augmentationSalaire, setAugmentationSalaire] = useState<number>(5); // % / an
  const [investissementInitial, setInvestissementInitial] = useState<number>(10_000);
  const [apportPersonnel, setApportPersonnel] = useState<number>(15_000);
  const [inflationFixes, setInflationFixes] = useState<number>(2); // % / an (charges fixes)
  const [showResults, setShowResults] = useState<boolean>(false);

  /* MOTEUR CALCULS */
  const calc = useMemo(() => {
    const growth = (v: number) => v * (1 + croissanceAnnuelle / 100);
    const inflate = (v: number) => v * (1 + inflationFixes / 100);
    const amort = investissementInitial / 3; // amort. linéaire (pédago)

    // Année 1
    const ca1 = Math.max(0, chiffreAffairesInitial);
    const chVar1 = ca1 * (chargesVariables / 100);
    const chFixes1 = chargesFixesMensuelles * 12;
    const sal1 = salaireMensuelInitial * 12;
    const chSoc1 = sal1 * (tauxChargesSociales / 100);
    const ebitda1 = ca1 - chVar1 - chFixes1 - sal1 - chSoc1; // avant amort/IS
    const resAvantIS1 = ebitda1 - amort;
    const is1 =
      resAvantIS1 > 0
        ? resAvantIS1 <= 42_500
          ? resAvantIS1 * 0.15
          : 42_500 * 0.15 + (resAvantIS1 - 42_500) * 0.25
        : 0;
    const resNet1 = resAvantIS1 - is1;
    const caf1 = resNet1 + amort; // CAF ~ RN + amort

    // Année 2
    const ca2 = growth(ca1);
    const chVar2 = ca2 * (chargesVariables / 100);
    const chFixes2 = inflate(chFixes1);
    const sal2 = sal1 * (1 + augmentationSalaire / 100);
    const chSoc2 = sal2 * (tauxChargesSociales / 100);
    const ebitda2 = ca2 - chVar2 - chFixes2 - sal2 - chSoc2;
    const resAvantIS2 = ebitda2 - amort;
    const is2 =
      resAvantIS2 > 0
        ? resAvantIS2 <= 42_500
          ? resAvantIS2 * 0.15
          : 42_500 * 0.15 + (resAvantIS2 - 42_500) * 0.25
        : 0;
    const resNet2 = resAvantIS2 - is2;
    const caf2 = resNet2 + amort;

    // Année 3
    const ca3 = growth(ca2);
    const chVar3 = ca3 * (chargesVariables / 100);
    const chFixes3 = inflate(chFixes2);
    const sal3 = sal2 * (1 + augmentationSalaire / 100);
    const chSoc3 = sal3 * (tauxChargesSociales / 100);
    const ebitda3 = ca3 - chVar3 - chFixes3 - sal3 - chSoc3;
    const resAvantIS3 = ebitda3 - amort;
    const is3 =
      resAvantIS3 > 0
        ? resAvantIS3 <= 42_500
          ? resAvantIS3 * 0.15
          : 42_500 * 0.15 + (resAvantIS3 - 42_500) * 0.25
        : 0;
    const resNet3 = resAvantIS3 - is3;
    const caf3 = resNet3 + amort;

    // Trésorerie (simple) : départ t0 = apport - investissement
    const t0 = apportPersonnel - investissementInitial;
    const t1 = t0 + caf1;
    const t2 = t1 + caf2;
    const t3 = t2 + caf3;

    // Seuil de rentabilité (A1) ≈ (Fixes + Salaires + Charges sociales) / Taux de marge
    const tauxMarge1 = (ca1 - chVar1) / (ca1 || 1);
    const seuilRenta1 = (chFixes1 + sal1 + chSoc1) / (tauxMarge1 || 1);

    // Marges & ratios (A1) – pédagogiques
    const margeBrute1 = ca1 - chVar1;
    const margeExploit1 = ebitda1; // avant amort/IS
    const margeExploitRate1 = (margeExploit1 / (ca1 || 1)) * 100;

    const rentable = resNet1 > 0;

    return {
      an: [
        {
          ca: ca1,
          chVar: chVar1,
          chFixes: chFixes1,
          sal: sal1,
          chSoc: chSoc1,
          amort,
          ebitda: ebitda1,
          resAvantIS: resAvantIS1,
          is: is1,
          resNet: resNet1,
          caf: caf1,
        },
        {
          ca: ca2,
          chVar: chVar2,
          chFixes: chFixes2,
          sal: sal2,
          chSoc: chSoc2,
          amort,
          ebitda: ebitda2,
          resAvantIS: resAvantIS2,
          is: is2,
          resNet: resNet2,
          caf: caf2,
        },
        {
          ca: ca3,
          chVar: chVar3,
          chFixes: chFixes3,
          sal: sal3,
          chSoc: chSoc3,
          amort,
          ebitda: ebitda3,
          resAvantIS: resAvantIS3,
          is: is3,
          resNet: resNet3,
          caf: caf3,
        },
      ],
      t: { t0, t1, t2, t3 },
      seuilRenta1,
      margeBrute1,
      margeExploit1,
      margeExploitRate1,
      rentable,
    };
  }, [
    chiffreAffairesInitial,
    croissanceAnnuelle,
    chargesVariables,
    chargesFixesMensuelles,
    salaireMensuelInitial,
    tauxChargesSociales,
    augmentationSalaire,
    investissementInitial,
    apportPersonnel,
    inflationFixes,
  ]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 bg-slate-50 min-h-screen text-slate-900">
      {/* EN-TÊTE */}
      <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-8 border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Euro className="text-indigo-600" size={32} />
            Prévisionnel 3 ans — Business Plan
          </h1>
          <span className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold">
            Version 2.0
          </span>
        </div>

        {/* BLOCS D’ENTRÉE */}
        <div className="grid md:grid-cols-2 gap-10">
          {/* Revenus & croissance */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-600 uppercase tracking-wider">
              <TrendingUp size={18} /> Revenus & Croissance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">CA Année 1 (€)</label>
                <input
                  type="number"
                  min={0}
                  value={chiffreAffairesInitial}
                  onChange={(e) => setChiffreAffairesInitial(Number(e.target.value || 0))}
                  className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Croissance / an (%)</label>
                <input
                  type="number"
                  value={croissanceAnnuelle}
                  onChange={(e) => setCroissanceAnnuelle(Number(e.target.value || 0))}
                  className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                />
              </div>
            </div>
          </section>

          {/* Coûts */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-rose-600 uppercase tracking-wider">
              <AlertTriangle size={18} /> Structure de coûts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Charges fixes mensuelles (€)</label>
                <input
                  type="number"
                  min={0}
                  value={chargesFixesMensuelles}
                  onChange={(e) => setChargesFixesMensuelles(Number(e.target.value || 0))}
                  className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Charges variables (% du CA)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={chargesVariables}
                  onChange={(e) => setChargesVariables(clamp(Number(e.target.value || 0), 0, 100))}
                  className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Salaire mensuel dirigeant (€)</label>
                <input
                  type="number"
                  min={0}
                  value={salaireMensuelInitial}
                  onChange={(e) => setSalaireMensuelInitial(Number(e.target.value || 0))}
                  className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Charges sociales (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={tauxChargesSociales}
                  onChange={(e) => setTauxChargesSociales(clamp(Number(e.target.value || 0), 0, 100))}
                  className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Augmentation salaire / an (%)</label>
                <input
                  type="number"
                  value={augmentationSalaire}
                  onChange={(e) => setAugmentationSalaire(Number(e.target.value || 0))}
                  className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-bold"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Invest / Apport + CTA calcul */}
        <div className="mt-10 grid md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Investissement initial (€)</label>
            <input
              type="number"
              min={0}
              value={investissementInitial}
              onChange={(e) => setInvestissementInitial(Number(e.target.value || 0))}
              className="w-full bg-slate-100/50 p-4 rounded-xl focus:ring-2 focus:ring-slate-400 font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Apport personnel (€)</label>
            <input
              type="number"
              min={0}
              value={apportPersonnel}
              onChange={(e) => setApportPersonnel(Number(e.target.value || 0))}
              className="w-full bg-slate-100/50 p-4 rounded-xl focus:ring-2 focus:ring-slate-400 font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Inflation charges fixes / an (%)</label>
            <input
              type="number"
              min={0}
              value={inflationFixes}
              onChange={(e) => setInflationFixes(Number(e.target.value || 0))}
              className="w-full bg-slate-100/50 p-4 rounded-xl focus:ring-2 focus:ring-slate-400 font-bold"
            />
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              onClick={() => setShowResults(true)}
              className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 hover:shadow-lg transition-all flex items-center justify-center gap-3"
            >
              Calculer le prévisionnel <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* RÉSULTATS */}
      {showResults && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
          {/* KPI cartes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Seuil de rentabilité (A1)</p>
              <p className="text-2xl font-black text-slate-900">{euro(calc.seuilRenta1)}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Trésorerie finale (A3)</p>
              <p
                className={`text-2xl font-black ${
                  calc.t.t3 > 0 ? "text-green-600" : "text-rose-600"
                }`}
              >
                {euro(calc.t.t3)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Marge brute (A1)</p>
              <p className="text-2xl font-black text-slate-900">{euro(calc.margeBrute1)}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Marge d’exploitation (A1)</p>
              <p className="text-2xl font-black text-slate-900">
                {euro(calc.margeExploit1)} <span className="text-xs text-slate-500">({calc.margeExploitRate1.toFixed(1)}%)</span>
              </p>
            </div>

            <div
              className={`p-6 rounded-3xl border flex items-center gap-4 md:col-span-2 ${
                calc.rentable ? "bg-green-50 border-green-200" : "bg-rose-50 border-rose-200"
              }`}
            >
              {calc.rentable ? (
                <CheckCircle2 className="text-green-600" size={40} />
              ) : (
                <AlertTriangle className="text-rose-600" size={40} />
              )}
              <div>
                <p className="font-black text-lg">{calc.rentable ? "PROJET VIABLE" : "ATTENTION"}</p>
                <p className="text-sm opacity-80">
                  {calc.rentable
                    ? "L’activité génère un résultat net positif dès l’année 1."
                    : "Résultat net négatif en année 1 — ajustez coûts/CA/cycle de vente."}
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 text-indigo-900 p-6 rounded-3xl border border-indigo-200 md:col-span-2">
              <div className="flex gap-3">
                <Info className="flex-shrink-0" />
                <p className="text-sm leading-relaxed">
                  Le prévisionnel utilise une <b>inflation</b> sur charges fixes ({inflationFixes}%) et l’<b>IS
                  progressif</b> (15% jusqu’à 42 500€ puis 25%). L’investissement est <b>amorti sur 3 ans</b> (linéaire).
                  Vous pouvez faire varier <b>croissance</b> / <b>coûts</b> / <b>salaire</b> pour tester vos scénarios.
                </p>
              </div>
            </div>
          </div>

          {/* Tableau synthétique */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm overflow-x-auto">
            <h3 className="text-xl font-black mb-6">Compte de résultat synthétique</h3>
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-tighter">
                  <th className="text-left pb-4">Indicateurs</th>
                  <th className="text-right pb-4 px-4">Année 1</th>
                  <th className="text-right pb-4 px-4">Année 2</th>
                  <th className="text-right pb-4">Année 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 font-bold text-slate-700">Chiffre d’affaires</td>
                  <td className="text-right py-4 font-bold text-indigo-600 px-4">{euro(calc.an[0].ca)}</td>
                  <td className="text-right py-4 font-bold text-indigo-600 px-4">{euro(calc.an[1].ca)}</td>
                  <td className="text-right py-4 font-bold text-indigo-600">{euro(calc.an[2].ca)}</td>
                </tr>
                <tr>
                  <td className="py-4 text-slate-500">Charges variables</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[0].chVar)}</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[1].chVar)}</td>
                  <td className="text-right py-4 text-rose-500">-{euro(calc.an[2].chVar)}</td>
                </tr>
                <tr>
                  <td className="py-4 text-slate-500">Charges fixes</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[0].chFixes)}</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[1].chFixes)}</td>
                  <td className="text-right py-4 text-rose-500">-{euro(calc.an[2].chFixes)}</td>
                </tr>
                <tr>
                  <td className="py-4 text-slate-500">Salaire dirigeant</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[0].sal)}</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[1].sal)}</td>
                  <td className="text-right py-4 text-rose-500">-{euro(calc.an[2].sal)}</td>
                </tr>
                <tr>
                  <td className="py-4 text-slate-500">Charges sociales</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[0].chSoc)}</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[1].chSoc)}</td>
                  <td className="text-right py-4 text-rose-500">-{euro(calc.an[2].chSoc)}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-4 font-semibold text-slate-700">EBITDA</td>
                  <td className="text-right py-4 font-semibold px-4">{euro(calc.an[0].ebitda)}</td>
                  <td className="text-right py-4 font-semibold px-4">{euro(calc.an[1].ebitda)}</td>
                  <td className="text-right py-4 font-semibold">{euro(calc.an[2].ebitda)}</td>
                </tr>
                <tr>
                  <td className="py-4 text-slate-500">Amortissements</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[0].amort)}</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[1].amort)}</td>
                  <td className="text-right py-4 text-rose-500">-{euro(calc.an[2].amort)}</td>
                </tr>
                <tr>
                  <td className="py-4 text-slate-500">IS</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[0].is)}</td>
                  <td className="text-right py-4 text-rose-500 px-4">-{euro(calc.an[1].is)}</td>
                  <td className="text-right py-4 text-rose-500">-{euro(calc.an[2].is)}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-4 font-black text-slate-900 uppercase">Résultat net</td>
                  <td className={`text-right py-4 font-black px-4 ${calc.an[0].resNet > 0 ? "text-green-600" : "text-rose-600"}`}>
                    {euro(calc.an[0].resNet)}
                  </td>
                  <td className={`text-right py-4 font-black px-4 ${calc.an[1].resNet > 0 ? "text-green-600" : "text-rose-600"}`}>
                    {euro(calc.an[1].resNet)}
                  </td>
                  <td className={`text-right py-4 font-black ${calc.an[2].resNet > 0 ? "text-green-600" : "text-rose-600"}`}>
                    {euro(calc.an[2].resNet)}
                  </td>
                </tr>
                <tr>
                  <td className="py-4 text-slate-500">CAF (RN + amort.)</td>
                  <td className="text-right py-4 px-4">{euro(calc.an[0].caf)}</td>
                  <td className="text-right py-4 px-4">{euro(calc.an[1].caf)}</td>
                  <td className="text-right py-4">{euro(calc.an[2].caf)}</td>
                </tr>
                <tr>
                  <td className="py-4 text-slate-500">Trésorerie (T0→T3)</td>
                  <td className="text-right py-4 px-4">{euro(calc.t.t1)}</td>
                  <td className="text-right py-4 px-4">{euro(calc.t.t2)}</td>
                  <td className="text-right py-4">{euro(calc.t.t3)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Note info */}
          <div className="bg-indigo-900 text-indigo-100 p-6 rounded-3xl flex gap-4">
            <Info className="flex-shrink-0" />
            <p className="text-sm leading-relaxed">
              Ce simulateur applique une inflation de <b>{inflationFixes}%</b> sur les charges fixes, une
              croissance annuelle de <b>{croissanceAnnuelle}%</b>, et calcule l’<b>IS</b> au taux réduit
              (15% jusqu’à 42 500€) puis normal (25%). L’investissement est <b>amorti sur 3 ans</b> (linéaire).
              Les approches sont <b>pédagogiques</b> — pour un BP bancaire complet, faites valider les hypothèses
              (délais d’encaissement, BFR, TVA, etc.).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}