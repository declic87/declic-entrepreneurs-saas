"use client";

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Euro,
  ArrowRight
} from 'lucide-react';

const BusinessPlanSimulateur = () => {
  // --- ÉTATS DES ENTRÉES ---
  const [chiffreAffairesInitial, setChiffreAffairesInitial] = useState(50000);
  const [croissanceAnnuelle, setCroissanceAnnuelle] = useState(15);
  const [chargesVariables, setChargesVariables] = useState(20);
  const [chargesFixesMensuelles, setChargesFixesMensuelles] = useState(1000);
  const [salaireMensuelInitial, setSalaireMensuelInitial] = useState(2000);
  const [tauxChargesSociales, setTauxChargesSociales] = useState(45);
  const [augmentationSalaire, setAugmentationSalaire] = useState(5);
  const [investissementInitial, setInvestissementInitial] = useState(10000);
  const [apportPersonnel, setApportPersonnel] = useState(15000);
  const [showResults, setShowResults] = useState(false);

  // --- LOGIQUE DE CALCUL (MOTEUR) ---
  const calculs = useMemo(() => {
    const formatMoney = (val: number) => new Intl.NumberFormat('fr-FR', {
        style: 'currency', 
        currency: 'EUR', 
        maximumFractionDigits: 0 
    }).format(val);

    // Année 1
    const caA1 = chiffreAffairesInitial;
    const chVarA1 = caA1 * (chargesVariables / 100);
    const chFixesA1 = chargesFixesMensuelles * 12;
    const salA1 = salaireMensuelInitial * 12;
    const chSocA1 = salA1 * (tauxChargesSociales / 100);
    const amort = investissementInitial / 3; 
    
    const resAvantISA1 = caA1 - chVarA1 - chFixesA1 - salA1 - chSocA1 - amort;
    const isA1 = resAvantISA1 > 0 ? resAvantISA1 * 0.15 : 0;
    const resNetA1 = resAvantISA1 - isA1;
    const cafA1 = resNetA1 + amort;

    // Année 2
    const caA2 = caA1 * (1 + croissanceAnnuelle / 100);
    const chVarA2 = caA2 * (chargesVariables / 100);
    const chFixesA2 = chFixesA1 * 1.02;
    const salA2 = salA1 * (1 + augmentationSalaire / 100);
    const chSocA2 = salA2 * (tauxChargesSociales / 100);
    const resAvantISA2 = caA2 - chVarA2 - chFixesA2 - salA2 - chSocA2 - amort;
    const isA2 = resAvantISA2 > 0 ? (resAvantISA2 <= 42500 ? resAvantISA2 * 0.15 : (42500 * 0.15) + (resAvantISA2 - 42500) * 0.25) : 0;
    const resNetA2 = resAvantISA2 - isA2;
    const cafA2 = resNetA2 + amort;

    // Année 3
    const caA3 = caA2 * (1 + croissanceAnnuelle / 100);
    const chVarA3 = caA3 * (chargesVariables / 100);
    const chFixesA3 = chFixesA2 * 1.02;
    const salA3 = salA2 * (1 + augmentationSalaire / 100);
    const chSocA3 = salA3 * (tauxChargesSociales / 100);
    const resAvantISA3 = caA3 - chVarA3 - chFixesA3 - salA3 - chSocA3 - amort;
    const isA3 = resAvantISA3 > 0 ? (resAvantISA3 <= 42500 ? resAvantISA3 * 0.15 : (42500 * 0.15) + (resAvantISA3 - 42500) * 0.25) : 0;
    const resNetA3 = resAvantISA3 - isA3;
    const cafA3 = resNetA3 + amort;

    // Trésorerie
    const t0 = apportPersonnel - investissementInitial;
    const t1 = t0 + cafA1;
    const t2 = t1 + cafA2;
    const t3 = t2 + cafA3;

    // Seuil de rentabilité (A1)
    const tauxMarge = (caA1 - chVarA1) / caA1;
    const sr = (chFixesA1 + salA1 + chSocA1) / (tauxMarge || 1);

    return {
      caA1, caA2, caA3,
      chVarA1, chVarA2, chVarA3,
      chFixesA1, chFixesA2, chFixesA3,
      salA1, salA2, salA3,
      chSocA1, chSocA2, chSocA3,
      resNetA1, resNetA2, resNetA3,
      t0, t1, t2, t3,
      sr,
      rentable: resNetA1 > 0,
      formatMoney
    };
  }, [chiffreAffairesInitial, croissanceAnnuelle, chargesVariables, chargesFixesMensuelles, salaireMensuelInitial, tauxChargesSociales, augmentationSalaire, investissementInitial, apportPersonnel]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-8 border border-slate-100">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Euro className="text-indigo-600" size={32} /> Simulation BP
          </h1>
          <span className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold">Version 2.0</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Bloc 1: Chiffres */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-600 uppercase tracking-wider">
               <TrendingUp size={18} /> Revenus & Croissance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">CA Année 1 (€)</label>
                <input type="number" value={chiffreAffairesInitial} onChange={(e) => setChiffreAffairesInitial(Number(e.target.value))} className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Croissance /an (%)</label>
                <input type="number" value={croissanceAnnuelle} onChange={(e) => setCroissanceAnnuelle(Number(e.target.value))} className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold" />
              </div>
            </div>
          </section>

          {/* Bloc 2: Charges */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-rose-600 uppercase tracking-wider">
               <AlertTriangle size={18} /> Structure de Coûts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Charges Fixes Mensuelles (€)</label>
                <input type="number" value={chargesFixesMensuelles} onChange={(e) => setChargesFixesMensuelles(Number(e.target.value))} className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Charges Variables (%)</label>
                <input type="number" value={chargesVariables} onChange={(e) => setChargesVariables(Number(e.target.value))} className="w-full bg-slate-50 border-0 p-4 rounded-2xl focus:ring-2 focus:ring-rose-500 transition-all font-bold" />
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Investissement Initial (€)</label>
                <input type="number" value={investissementInitial} onChange={(e) => setInvestissementInitial(Number(e.target.value))} className="w-full bg-slate-100/50 p-4 rounded-xl focus:ring-2 focus:ring-slate-400 font-bold" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Apport Personnel (€)</label>
                <input type="number" value={apportPersonnel} onChange={(e) => setApportPersonnel(Number(e.target.value))} className="w-full bg-slate-100/50 p-4 rounded-xl focus:ring-2 focus:ring-slate-400 font-bold" />
            </div>
            <div className="flex items-end">
                <button 
                  onClick={() => setShowResults(true)} 
                  className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 hover:shadow-lg transition-all flex items-center justify-center gap-3"
                >
                  Calculer le Prévisionnel <ArrowRight size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* RÉSULTATS DYNAMIQUES */}
      {showResults && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
          
          {/* Cartes de KPi */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-1">Seuil de Rentabilité</p>
                <p className="text-2xl font-black text-slate-900">{calculs.formatMoney(calculs.sr)}</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs font-bold uppercase mb-1">Trésorerie Finale (A3)</p>
                <p className={`text-2xl font-black ${calculs.t3 > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                    {calculs.formatMoney(calculs.t3)}
                </p>
             </div>
             <div className={`p-6 rounded-3xl border flex items-center gap-4 col-span-1 md:col-span-2 ${calculs.rentable ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
                {calculs.rentable ? <CheckCircle2 className="text-green-600" size={40} /> : <AlertTriangle className="text-rose-600" size={40} />}
                <div>
                    <p className="font-black text-lg">{calculs.rentable ? "PROJET VIABLE" : "ATTENTION"}</p>
                    <p className="text-sm opacity-80">{calculs.rentable ? "L'activité génère des bénéfices dès la première année." : "Le résultat net est négatif en année 1. Révisez vos coûts."}</p>
                </div>
             </div>
          </div>

          {/* Tableau de Résultat */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm overflow-x-auto">
            <h3 className="text-xl font-black mb-6">Compte de Résultat Synthétique</h3>
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
                    <tr className="group">
                        <td className="py-4 font-bold text-slate-700">Chiffre d'Affaires</td>
                        <td className="text-right py-4 font-bold text-indigo-600 px-4">{calculs.formatMoney(calculs.caA1)}</td>
                        <td className="text-right py-4 font-bold text-indigo-600 px-4">{calculs.formatMoney(calculs.caA2)}</td>
                        <td className="text-right py-4 font-bold text-indigo-600">{calculs.formatMoney(calculs.caA3)}</td>
                    </tr>
                    <tr>
                        <td className="py-4 text-slate-500">Total Charges (Fixes + Var)</td>
                        <td className="text-right py-4 text-rose-500 px-4">-{calculs.formatMoney(calculs.chVarA1 + calculs.chFixesA1)}</td>
                        <td className="text-right py-4 text-rose-500 px-4">-{calculs.formatMoney(calculs.chVarA2 + calculs.chFixesA2)}</td>
                        <td className="text-right py-4 text-rose-500">-{calculs.formatMoney(calculs.chVarA3 + calculs.chFixesA3)}</td>
                    </tr>
                    <tr>
                        <td className="py-4 text-slate-500">Salaire & Charges Dirigeant</td>
                        <td className="text-right py-4 text-rose-500 px-4">-{calculs.formatMoney(calculs.salA1 + calculs.chSocA1)}</td>
                        <td className="text-right py-4 text-rose-500 px-4">-{calculs.formatMoney(calculs.salA2 + calculs.chSocA2)}</td>
                        <td className="text-right py-4 text-rose-500">-{calculs.formatMoney(calculs.salA3 + calculs.chSocA3)}</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                        <td className="py-4 font-black text-slate-900 uppercase">Résultat Net</td>
                        <td className={`text-right py-4 font-black px-4 ${calculs.resNetA1 > 0 ? 'text-green-600' : 'text-rose-600'}`}>{calculs.formatMoney(calculs.resNetA1)}</td>
                        <td className={`text-right py-4 font-black px-4 ${calculs.resNetA2 > 0 ? 'text-green-600' : 'text-rose-600'}`}>{calculs.formatMoney(calculs.resNetA2)}</td>
                        <td className={`text-right py-4 font-black ${calculs.resNetA3 > 0 ? 'text-green-600' : 'text-rose-600'}`}>{calculs.formatMoney(calculs.resNetA3)}</td>
                    </tr>
                </tbody>
            </table>
          </div>

          {/* Note Info */}
          <div className="bg-indigo-900 text-indigo-100 p-6 rounded-3xl flex gap-4">
             <Info className="flex-shrink-0" />
             <p className="text-sm leading-relaxed">
                Ce simulateur inclut une inflation de 2% sur les charges fixes chaque année et un calcul d'impôt sur les sociétés (IS) à taux réduit (15% jusqu'à 42 500€ de bénéfice). L'investissement est amorti sur 3 ans linéairement.
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessPlanSimulateur;