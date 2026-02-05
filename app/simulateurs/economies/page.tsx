"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Euro, TrendingUp, Car, Home, 
  Utensils, Smartphone, Info, Calculator 
} from "lucide-react";

export default function EconomiesPage() {
  // États du formulaire
  const [ca, setCa] = useState<number>(60000);
  const [km, setKm] = useState<number>(15000);
  const [cv, setCv] = useState<number>(5); // Puissance fiscale
  const [loyer, setLoyer] = useState<number>(1000);
  const [pourcentageBureau, setPourcentageBureau] = useState<number>(15);
  const [repasPrix, setRepasPrix] = useState<number>(15);
  const [joursTravailles, setJoursTravailles] = useState<number>(210);
  const [telephone, setTelephone] = useState<number>(40);
  const [autresFrais, setAutresFrais] = useState<number>(150);
  
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // --- LOGIQUE DE CALCUL RECTIFIÉE ---

  // 1. Indemnités Kilométriques (Barème 2024/2025 simplifié)
  const calculerIK = () => {
    let coef = 0;
    let fixe = 0;

    if (cv <= 3) {
      if (km <= 5000) coef = 0.529;
      else if (km <= 20000) { coef = 0.316; fixe = 1065; }
      else coef = 0.370;
    } else if (cv === 4) {
      if (km <= 5000) coef = 0.606;
      else if (km <= 20000) { coef = 0.340; fixe = 1330; }
      else coef = 0.407;
    } else if (cv === 5) {
      if (km <= 5000) coef = 0.636;
      else if (km <= 20000) { coef = 0.357; fixe = 1395; }
      else coef = 0.427;
    } else if (cv === 6) {
      if (km <= 5000) coef = 0.665;
      else if (km <= 20000) { coef = 0.374; fixe = 1457; }
      else coef = 0.447;
    } else { // 7CV et +
      if (km <= 5000) coef = 0.697;
      else if (km <= 20000) { coef = 0.394; fixe = 1515; }
      else coef = 0.470;
    }
    return (km * coef) + fixe;
  };

  const ik = calculerIK();

  // 2. Frais domicile (Loyer + Charges type EDF/Assurance)
  const fraisDomicile = (loyer * 12) * (pourcentageBureau / 100);

  // 3. Frais repas (Seule la part > 5.35€ est déductible, max 20.20€)
  const partDeductibleRepas = Math.max(0, Math.min(repasPrix, 20.20) - 5.35);
  const fraisRepasAnnuel = partDeductibleRepas * joursTravailles;

  // 4. Téléphone & Autres
  const fraisTelephone = telephone * 12 * 0.5; // Usage mixte 50%
  const autresFraisAnnuel = autresFrais * 12;

  // Totaux
  const totalVASE = ik + fraisDomicile + fraisRepasAnnuel + fraisTelephone + autresFraisAnnuel;
  
  // Économie : Charges sociales (estim. 22%) + Impôt sur le revenu (estim. 11% de tranche moyenne)
  const economie = totalVASE * 0.33; 

  const handleCalculate = () => {
    setShowResults(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-[#0F172A] py-4 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="md" variant="light" />
          <div className="flex items-center gap-6">
            <Link href="/simulateurs" className="text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium">
              <ArrowLeft size={16} /> Simulateurs
            </Link>
            <Link href="/" className="text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium">
              <Home size={16} /> Accueil
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 mb-6">
            <Calculator size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Optimisez vos revenus
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Découvrez combien vous pourriez récupérer légalement en déduisant vos frais réels avec la méthode <span className="font-bold text-slate-700">VASE</span>.
          </p>
        </header>

        <main className="grid gap-8">
          {/* Section Inputs */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="grid gap-10">
              
              {/* V - VÉHICULE */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Car size={20}/></div>
                  <h2 className="text-xl font-bold text-slate-800">Véhicule (IK)</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Kilométrage annuel pro</label>
                    <input type="number" value={km} onChange={(e) => setKm(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Puissance fiscale (CV)</label>
                    <select value={cv} onChange={(e) => setCv(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                      {[3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n} CV</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* A - ABODE (DOMICILE) */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Home size={20}/></div>
                  <h2 className="text-xl font-bold text-slate-800">Domicile (Bureau)</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Loyer + Charges mensuels</label>
                    <input type="number" value={loyer} onChange={(e) => setLoyer(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Surface dédiée (%) : {pourcentageBureau}%</label>
                    <input type="range" min="5" max="30" value={pourcentageBureau} onChange={(e) => setPourcentageBureau(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                  </div>
                </div>
              </div>

              {/* S - SUSTENANCE (REPAS) */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Utensils size={20}/></div>
                  <h2 className="text-xl font-bold text-slate-800">Repas Professionnels</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Prix moyen d'un déjeuner</label>
                    <div className="relative">
                       <input type="number" value={repasPrix} onChange={(e) => setRepasPrix(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                       <span className="absolute right-4 top-3 text-slate-400">€</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Jours travaillés / an</label>
                    <input type="number" value={joursTravailles} onChange={(e) => setJoursTravailles(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 italic">
                  <Info size={12}/> La loi permet de déduire la part excédant 5.35€ par repas.
                </p>
              </div>

              {/* E - EXTRAS */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Smartphone size={20}/></div>
                  <h2 className="text-xl font-bold text-slate-800">Extras (Tel, Web, Divers)</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Abonnements mensuels</label>
                    <input type="number" value={telephone} onChange={(e) => setTelephone(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Autres (Logiciels, fournitures...)</label>
                    <input type="number" value={autresFrais} onChange={(e) => setAutresFrais(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCalculate} 
                className="w-full py-7 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all rounded-2xl"
              >
                Calculer mon gain potentiel
              </Button>
            </div>
          </section>

          {/* SECTION RÉSULTATS */}
          {showResults && (
            <section ref={resultsRef} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-[#0F172A] rounded-3xl p-8 text-white shadow-2xl">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <TrendingUp className="text-emerald-400" />
                  Analyse de votre optimisation
                </h2>
                
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-5">
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-white/60">Indemnités Auto</span>
                      <span className="font-mono font-bold text-blue-400">{formatMoney(ik)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-white/60">Frais de Structure (Bureau)</span>
                      <span className="font-mono font-bold text-orange-400">{formatMoney(fraisDomicile)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-white/60">Frais de Bouche</span>
                      <span className="font-mono font-bold text-emerald-400">{formatMoney(fraisRepasAnnuel)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-white/60">Outils & Extras</span>
                      <span className="font-mono font-bold text-purple-400">{formatMoney(fraisTelephone + autresFraisAnnuel)}</span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col justify-center items-center text-center">
                    <p className="text-white/50 uppercase tracking-widest text-xs font-bold mb-2">Gain net estimé / an</p>
                    <div className="text-6xl font-black text-emerald-400 mb-4 tracking-tighter">
                      {formatMoney(economie)}
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed italic">
                      Basé sur une économie combinée de charges sociales et d'impôts sur le revenu de 33%.
                    </p>
                  </div>
                </div>

                <div className="mt-12 p-8 bg-emerald-500 rounded-2xl text-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-black mb-2">Prêt à optimiser ?</h3>
                    <p className="font-medium opacity-80">Nos experts valident votre éligibilité en 15 minutes.</p>
                  </div>
                  <a href="https://calendly.com/contact-jj-conseil/rdv-analyste" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-6 rounded-xl text-md font-bold transition-transform hover:scale-105">
                      Prendre RDV gratuit
                    </Button>
                  </a>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
      
      <footer className="py-12 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} JJ Conseil - Simulateur VASE conforme barèmes fiscaux en vigueur.</p>
      </footer>
    </div>
  );
}