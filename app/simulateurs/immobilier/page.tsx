'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, Info, CheckCircle2, Euro, Home, PieChart } from 'lucide-react';

/**
 * COMPOSANT BOUTON RÉUTILISABLE
 */
const Button = ({ children, className = "", size = "md", ...props }) => {
  const sizeClasses = size === 'lg' ? 'px-8 py-4 text-lg' : 'px-4 py-2 text-sm';
  return (
    <button 
      className={`font-bold rounded-xl transition-all active:scale-95 ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * SIMULATEUR FISCAL IMMOBILIER COMPLET
 */
export default function TaxSimulator() {
  // --- ÉTATS (Variables modifiables) ---
  const [valeurBien, setValeurBien] = useState(200000);
  const [loyerMensuel, setLoyerMensuel] = useState(1000);
  const [chargesAnnuelles, setChargesAnnuelles] = useState(2000);
  const [taxeFonciere, setTaxeFonciere] = useState(800);
  const [tmi, setTmi] = useState(30);
  const [travaux, setTravaux] = useState(0);
  const [mobilier, setMobilier] = useState(5000);

  // --- LOGIQUE DE CALCUL ---
  const calculs = useMemo(() => {
    const loyerAnnuel = loyerMensuel * 12;
    const chargesDeductiblesBase = chargesAnnuelles + taxeFonciere;
    const microFoncierPossible = loyerAnnuel <= 15000;
    const rendementBrut = (loyerAnnuel / valeurBien) * 100;

    // Amortissements (Base LMNP / SCI IS)
    // On amortit environ 85% du bien sur 25 ans (hors terrain)
    const amortissementImmeuble = (valeurBien * 0.85) / 25;
    const amortissementMobilier = mobilier / 10;
    const amortissementTravaux = travaux / 10;
    const totalAmortissement = amortissementImmeuble + amortissementMobilier + amortissementTravaux;

    // 1. Nu - Micro Foncier
    const baseMicroFoncier = loyerAnnuel * 0.7;
    const irMicroFoncier = baseMicroFoncier * (tmi / 100);
    const pssMicroFoncier = baseMicroFoncier * 0.172;
    const netNueMicro = loyerAnnuel - chargesDeductiblesBase - irMicroFoncier - pssMicroFoncier;

    // 2. Nu - Réel
    const baseReelFoncier = Math.max(0, loyerAnnuel - chargesDeductiblesBase);
    const impotsReelFoncier = baseReelFoncier * (tmi / 100 + 0.172);
    const netNueReel = loyerAnnuel - chargesDeductiblesBase - impotsReelFoncier;

    // 3. LMNP - Réel (Le plus fréquent en optimisation)
    const baseReelLMNP = Math.max(0, loyerAnnuel - chargesDeductiblesBase - totalAmortissement);
    const impotsLMNPReel = baseReelLMNP * (tmi / 100 + 0.172);
    const netLMNPReel = loyerAnnuel - chargesDeductiblesBase - impotsLMNPReel;

    // 4. SCI IS
    const resultatSCIIS = loyerAnnuel - chargesDeductiblesBase - totalAmortissement;
    const isSCIIS = resultatSCIIS <= 42500 
      ? Math.max(0, resultatSCIIS) * 0.15 
      : (42500 * 0.15) + (resultatSCIIS - 42500) * 0.25;
    const tresorerieSCIIS = loyerAnnuel - chargesDeductiblesBase - isSCIIS;

    return {
      loyerAnnuel,
      chargesDeductiblesBase,
      rendementBrut,
      totalAmortissement,
      microFoncierPossible,
      results: [
        { name: "Nu (Micro)", net: microFoncierPossible ? netNueMicro : -1, impots: irMicroFoncier + pssMicroFoncier, color: "blue" },
        { name: "Nu (Réel)", net: netNueReel, impots: impotsReelFoncier, color: "slate" },
        { name: "LMNP (Réel)", net: netLMNPReel, impots: impotsLMNPReel, color: "green" },
        { name: "SCI IS", net: tresorerieSCIIS, impots: isSCIIS, color: "purple" }
      ].sort((a, b) => b.net - a.net)
    };
  }, [valeurBien, loyerMensuel, chargesAnnuelles, taxeFonciere, tmi, travaux, mobilier]);

  const formatEuro = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Optimiseur Fiscal Immo</h1>
            <p className="text-slate-500 text-sm">Comparez les régimes et maximisez votre cash-flow</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold">Rendement Brut</p>
              <p className="text-2xl font-black text-blue-600">{calculs.rendementBrut.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* INPUTS / CONTROLS (Simplifié pour l'exemple) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="text-xs font-bold text-slate-400 uppercase">Valeur du bien</label>
                <input type="number" value={valeurBien} onChange={(e) => setValeurBien(Number(e.target.value))} className="w-full text-lg font-bold outline-none" />
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="text-xs font-bold text-slate-400 uppercase">Loyer Mensuel HC</label>
                <input type="number" value={loyerMensuel} onChange={(e) => setLoyerMensuel(Number(e.target.value))} className="w-full text-lg font-bold outline-none text-green-600" />
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="text-xs font-bold text-slate-400 uppercase">Votre TMI (%)</label>
                <select value={tmi} onChange={(e) => setTmi(Number(e.target.value))} className="w-full text-lg font-bold outline-none bg-transparent">
                    <option value={0}>0%</option>
                    <option value={11}>11%</option>
                    <option value={30}>30%</option>
                    <option value={41}>41%</option>
                    <option value={45}>45%</option>
                </select>
            </div>
        </div>

        {/* CARDS COMPARATIVES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {calculs.results.map((res, idx) => (
            <div key={res.name} className={`relative bg-white p-6 rounded-3xl border-2 transition-all shadow-xl ${idx === 0 ? 'border-green-500 scale-105 z-10' : 'border-slate-100 hover:border-slate-300'}`}>
              {idx === 0 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <CheckCircle2 size={12} /> MEILLEUR CHOIX
                </div>
              )}
              <h3 className="font-bold text-slate-400 text-sm mb-1 uppercase tracking-widest">{res.name}</h3>
              <div className="mb-4">
                <p className="text-3xl font-black">{res.net < 0 ? "N/A" : formatEuro(res.net)}</p>
                <p className="text-xs text-slate-400">Net après impôts / an</p>
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400 uppercase">Impôts</span>
                    <span className="text-red-500 font-bold">-{formatEuro(res.impots)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400 uppercase">Net / mois</span>
                    <span className="text-slate-900 font-bold">{res.net < 0 ? "-" : formatEuro(res.net / 12)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ANALYSE DE L'AMORTISSEMENT */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                    <PieChart size={48} className="text-green-400" />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">Puissance de l'amortissement comptable</h2>
                    <p className="text-slate-400 text-sm max-w-xl">
                        Vous gommez <span className="text-white font-bold">{formatEuro(calculs.totalAmortissement)}</span> de revenus imposables chaque année grâce à la dépréciation fictive du bien et des meubles.
                    </p>
                </div>
                <Button className="bg-green-500 text-slate-900 hover:bg-green-400 whitespace-nowrap">
                  Optimiser mon dossier
                </Button>
            </div>
            {/* Déco background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>

      </div>
    </div>
  );
}