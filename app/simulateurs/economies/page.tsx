"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingUp,
  Car,
  Home,
  Utensils,
  Smartphone,
  Info,
  Calculator,
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

function euro(n: number) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}

/* ------------------------------ PAGE ------------------------------ */

export default function EconomiesPage() {
  // Navbar mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // --- LOGIQUE DE CALCUL (VASE) ---

  // 1) Indemnités Kilométriques (barème simplifié 2024/2025)
  const calculerIK = () => {
    const nKm = Math.max(0, km);
    const nCv = Math.max(3, Math.min(7, cv)); // borne 3–7
    let coef = 0;
    let fixe = 0;

    if (nCv <= 3) {
      if (nKm <= 5000) coef = 0.529;
      else if (nKm <= 20000) { coef = 0.316; fixe = 1065; }
      else coef = 0.370;
    } else if (nCv === 4) {
      if (nKm <= 5000) coef = 0.606;
      else if (nKm <= 20000) { coef = 0.340; fixe = 1330; }
      else coef = 0.407;
    } else if (nCv === 5) {
      if (nKm <= 5000) coef = 0.636;
      else if (nKm <= 20000) { coef = 0.357; fixe = 1395; }
      else coef = 0.427;
    } else if (nCv === 6) {
      if (nKm <= 5000) coef = 0.665;
      else if (nKm <= 20000) { coef = 0.374; fixe = 1457; }
      else coef = 0.447;
    } else { // 7CV+
      if (nKm <= 5000) coef = 0.697;
      else if (nKm <= 20000) { coef = 0.394; fixe = 1515; }
      else coef = 0.470;
    }
    return nKm * coef + fixe;
  };
  const ik = calculerIK();

  // 2) Frais domicile (loyer + charges / mois → /an), proratisé sur % bureau
  const fraisDomicile = Math.max(0, loyer) * 12 * (Math.max(0, Math.min(100, pourcentageBureau)) / 100);

  // 3) Frais repas — seule la part > 5.35€ est déductible, plafonnée à 20.20€
  const partDeductibleRepas = Math.max(0, Math.min(Math.max(0, repasPrix), 20.20) - 5.35);
  const jours = Math.max(0, joursTravailles);
  const fraisRepasAnnuel = partDeductibleRepas * jours;

  // 4) Téléphone & autres (téléphone à 50% usage mixte, autres = mensuels)
  const fraisTelephone = Math.max(0, telephone) * 12 * 0.5;
  const autresFraisAnnuel = Math.max(0, autresFrais) * 12;

  // Total VASE
  const totalVASE = ik + fraisDomicile + fraisRepasAnnuel + fraisTelephone + autresFraisAnnuel;

  // Économie estimée : charges sociales (~22%) + IR (~11%) → 33% du total déductible (pédagogique)
  const economie = totalVASE * 0.33;

  // Scroll vers la zone résultats
  const handleCalculate = () => {
    setShowResults(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

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
              <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 px-4">
                Connexion
              </Button>
            </Link>
            <Link href="/app">
              <Button className="bg-white text-[#123055] hover:bg-slate-100 px-4">Mon Espace</Button>
            </Link>
            <Link href="https://calendly.com/declic-entrepreneurs/diagnostic" target="_blank" rel="noopener noreferrer">
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
                  <Button variant="outline" className="w-full text-white border-white/20 hover:bg-white/10">
                    Connexion
                  </Button>
                </Link>
                <Link href="/app">
                  <Button className="w-full bg-white text-[#123055] hover:bg-slate-100">
                    Mon Espace
                  </Button>
                </Link>
                <Link href="https://calendly.com/declic-entrepreneurs/diagnostic" target="_blank" rel="noopener noreferrer">
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
            Optimisez vos revenus (Méthode VASE)
          </h1>
          <p className="text-slate-200 mt-2 max-w-2xl">
            Découvrez combien vous pouvez récupérer légalement en déduisant vos frais réels (Véhicule, Abode, Sustenance, Extras).
          </p>
        </div>
      </header>

      {/* CONTENU */}
      <main className="max-w-5xl mx-auto py-12 px-4">
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <div className="grid gap-10">
            {/* V — Véhicule */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Car size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Véhicule (IK)</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Kilométrage annuel pro</label>
                  <input
                    type="number"
                    min={0}
                    value={km}
                    onChange={(e) => setKm(Number(e.target.value || 0))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Puissance fiscale (CV)</label>
                  <select
                    value={cv}
                    onChange={(e) => setCv(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n}>
                        {n} CV
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* A — Abode (domicile) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <Home size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Domicile (Bureau)</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Loyer + Charges mensuels</label>
                  <input
                    type="number"
                    min={0}
                    value={loyer}
                    onChange={(e) => setLoyer(Number(e.target.value || 0))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">
                    Surface dédiée (%) : {pourcentageBureau}%
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    value={pourcentageBureau}
                    onChange={(e) => setPourcentageBureau(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* S — Sustenance (repas) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Utensils size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Repas professionnels</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Prix moyen d'un déjeuner</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={repasPrix}
                      onChange={(e) => setRepasPrix(Number(e.target.value || 0))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="absolute right-4 top-3 text-slate-400">€</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Jours travaillés / an</label>
                  <input
                    type="number"
                    min={0}
                    value={joursTravailles}
                    onChange={(e) => setJoursTravailles(Number(e.target.value || 0))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 italic">
                <Info size={12} /> La loi permet de déduire la part excédant 5,35€ par repas (plafonné à 20,20€).
              </p>
            </div>

            {/* E — Extras */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Smartphone size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Extras (Téléphone, Web, Divers)</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Abonnements mensuels</label>
                  <input
                    type="number"
                    min={0}
                    value={telephone}
                    onChange={(e) => setTelephone(Number(e.target.value || 0))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Autres (logiciels, fournitures…)</label>
                  <input
                    type="number"
                    min={0}
                    value={autresFrais}
                    onChange={(e) => setAutresFrais(Number(e.target.value || 0))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
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
          <section ref={resultsRef} className="animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8">
            <div className="bg-[#0F2742] rounded-3xl p-8 text-white shadow-2xl">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <TrendingUp className="text-emerald-400" />
                Analyse de votre optimisation
              </h2>

              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-5">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-white/70">Indemnités Auto</span>
                    <span className="font-mono font-bold text-blue-300">{euro(ik)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-white/70">Frais de Structure (Bureau)</span>
                    <span className="font-mono font-bold text-orange-300">{euro(fraisDomicile)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-white/70">Frais de Bouche</span>
                    <span className="font-mono font-bold text-emerald-300">{euro(fraisRepasAnnuel)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-white/70">Outils & Extras</span>
                    <span className="font-mono font-bold text-purple-300">
                      {euro(fraisTelephone + autresFraisAnnuel)}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col justify-center items-center text-center">
                  <p className="text-white/60 uppercase tracking-widest text-xs font-bold mb-2">
                    Gain net estimé / an
                  </p>
                  <div className="text-6xl font-black text-emerald-400 mb-3 tracking-tighter">
                    {euro(economie)}
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed italic">
                    Estimation pédagogique basée sur 33% (charges sociales ~22% + IR moyen ~11%).
                  </p>
                </div>
              </div>

              <div className="mt-12 p-8 bg-emerald-500 rounded-2xl text-[#0F2742] flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-black mb-2">Prêt à optimiser ?</h3>
                  <p className="font-medium opacity-80">
                    Un expert valide votre éligibilité en 15 minutes.
                  </p>
                </div>
                <Link
                  href="https://calendly.com/declic-entrepreneurs/diagnostic"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    className="bg-[#0F2742] text-white hover:bg-[#102b48] px-8 py-6 rounded-xl text-md font-bold transition-transform hover:scale-105"
                  >
                    Prendre RDV gratuit
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER PREMIUM */}
      <footer className="mt-10 border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-4 gap-8 text-slate-600">
          <div>
            <Logo size="md" showText variant="dark" />
            <p className="text-sm mt-3">
              Optimisation fiscale pour indépendants & entrepreneurs depuis 2014.
            </p>
            <p className="text-emerald-600 text-sm mt-2">+30M€ économisés pour nos clients</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800 mb-3">Simulateurs</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/simulateurs/comparateur" className="hover:text-slate-900">Comparateur statuts</Link></li>
              <li><Link href="/simulateurs/economies" className="hover:text-slate-900">Simulateur économies</Link></li>
              <li><Link href="/simulateurs/ik" className="hover:text-slate-900">Indemnités kilométriques</Link></li>
              <li><Link href="/simulateurs/immobilier" className="hover:text-slate-900">Investissement immobilier</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-800 mb-3">Ressources</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/formations/essentielle" className="hover:text-slate-900">Formation Essentielle</Link></li>
              <li><Link href="/formations/agent-immobilier" className="hover:text-slate-900">Formation Agent Immo</Link></li>
              <li><Link href="/#faq" className="hover:text-slate-900">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-800 mb-3">Contact</p>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:contact@declic-entrepreneur.fr" className="hover:text-slate-900">contact@declic-entrepreneur.fr</a></li>
              <li><a href="tel:+33123456789" className="hover:text-slate-900">01 23 45 67 89</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-slate-500 pb-8">
          © {new Date().getFullYear()} Déclic‑Entrepreneur. Tous droits réservés. •{" "}
          <Link href="/mentions-legales" className="hover:text-slate-800">Mentions légales</Link> •{" "}
          <Link href="/cgv" className="hover:text-slate-800">CGV</Link> •{" "}
          <Link href="/confidentialite" className="hover:text-slate-800">Confidentialité</Link>
        </div>
      </footer>
    </div>
  );
}
