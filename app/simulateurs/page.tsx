"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  Car,
  Building2,
  Coins,
  Landmark,
  Wallet,
  ArrowRight,
  Star,
  Menu,
  X,
  Calculator,
  Search,
  CheckCircle2,
} from "lucide-react";

/** --- DATA identique à la vitrine --- */
const NAV_LINKS = [
  { label: "Simulateurs", href: "/simulateurs" },
  { label: "Formations", href: "/formations" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "RDV Stratégique", href: "/#rdv" },
  { label: "FAQ", href: "/#faq" },
];

const SIMULATEURS = [
  { title: "Comparateur de Statuts", subtitle: "Micro vs SASU vs EURL", icon: FileSpreadsheet, href: "/simulateurs/comparateur", color: "#3B82F6" },
  { title: "Simulateur d’Économies", subtitle: "Méthode VASE", icon: TrendingUp, href: "/simulateurs/economies", color: "#10B981" },
  { title: "Calculateur de Charges", subtitle: "Charges sociales et fiscales", icon: Receipt, href: "/simulateurs/charges", color: "#8B5CF6" },
  { title: "Indemnités Kilométriques", subtitle: "Barème IK 2024‑2026", icon: Car, href: "/simulateurs/ik", color: "#0EA5E9" },
  { title: "Investissement Immobilier", subtitle: "LMNP, SCI IR, SCI IS", icon: Building2, href: "/simulateurs/immobilier", color: "#F59E0B" },
  { title: "Simulateur Dividendes", subtitle: "PFU 30% vs Barème", icon: Coins, href: "/simulateurs/dividendes", color: "#F59E0B" },
  { title: "Simulateur Retraite", subtitle: "Pension selon statut", icon: Landmark, href: "/simulateurs/retraite", color: "#0EA5E9" },
  { title: "Gestion Trésorerie", subtitle: "Projection 12 mois", icon: Wallet, href: "/simulateurs/tresorerie", color: "#10B981" },
  { title: "Prévisionnel 3 ans", subtitle: "Business plan complet", icon: FileSpreadsheet, href: "/simulateurs/previsionnel", color: "#8B5CF6" },
];

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h1 className="text-3xl md:text-4xl font-extrabold text-[#2C3E50] tracking-tight">{title}</h1>
      {subtitle ? <p className="text-lg text-slate-600 mt-2 max-w-2xl mx-auto">{subtitle}</p> : null}
    </div>
  );
}

export default function SimulateursPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return SIMULATEURS;
    return SIMULATEURS.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.subtitle.toLowerCase().includes(query)
    );
  }, [q]);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR (identique au home) */}
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
                  <Button className="w-full bg-white text-[#123055] hover:bg-slate-100">Mon Espace</Button>
                </Link>
                <Link href="https://calendly.com/declic-entrepreneurs/diagnostic" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white">Diagnostic gratuit</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Header de page simulateurs */}
      <header className="pt-28 md:pt-32 pb-8 bg-[radial-gradient(1200px_500px_at_20%_-10%,#1f3a5f_0%,transparent_60%),linear-gradient(180deg,#18314f_0%,#0f2742_100%)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold">Nos simulateurs gratuits</h1>
          <p className="text-slate-200 mt-3 max-w-2xl mx-auto">
            Calculez vos économies potentielles en quelques clics.
          </p>

          {/* Barre de recherche simple (optionnelle) */}
          <div className="mt-6 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-xl pl-9 pr-3 py-2.5 bg-white/95 text-[#123055] placeholder-slate-400 border-0 focus:ring-2 focus:ring-amber-300"
                placeholder="Chercher un simulateur (ex: SASU, Immobilier...)"
                aria-label="Chercher un simulateur"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Grille Simulateurs (identique vitrine) */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <Link key={s.title} href={s.href}>
                <div className="group rounded-2xl bg-white border border-slate-200 hover:border-[#F59E0B]/60 shadow-sm hover:shadow-lg transition-all p-6 cursor-pointer">
                  <div
                    className="w-10 h-10 rounded-lg mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${s.color}1A` }}
                  >
                    <s.icon size={20} style={{ color: s.color }} />
                  </div>
                  <h3 className="font-semibold text-[#123055]">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/simulateurs">
              <Button className="bg-white text-[#123055] border border-slate-200 hover:bg-slate-100 rounded-xl">
                Voir tous les simulateurs
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA + footer brandés comme le home */}
      <section className="py-16 bg-[linear-gradient(180deg,#0f2742_0%,#0f2742_60%,#102b48_100%)] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-extrabold">Besoin d’un diagnostic rapide ?</h3>
          <p className="text-white/90 mt-3">
            45 minutes avec un expert pour obtenir un plan d’action personnalisé.
          </p>
          <Link
            href="https://calendly.com/declic-entrepreneurs/diagnostic"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="mt-6 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl">
              Réserver mon diagnostic gratuit (45 min)
            </Button>
          </Link>
        </div>

        <footer className="mt-14 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-4 gap-8 text-slate-200">
            <div>
              <Logo size="md" showText variant="light" />
              <p className="text-sm mt-3">Optimisation fiscale pour indépendants & entrepreneurs depuis 2014.</p>
              <p className="text-emerald-300 text-sm mt-2">+30M€ économisés pour nos clients</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Simulateurs</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/simulateurs/comparateur" className="hover:text-white">Comparateur statuts</Link></li>
                <li><Link href="/simulateurs/economies" className="hover:text-white">Simulateur économies</Link></li>
                <li><Link href="/simulateurs/ik" className="hover:text-white">Indemnités kilométriques</Link></li>
                <li><Link href="/simulateurs/immobilier" className="hover:text-white">Investissement immobilier</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Ressources</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/formations/essentielle" className="hover:text-white">Formation Essentielle</Link></li>
                <li><Link href="/formations/agent-immobilier" className="hover:text-white">Formation Agent Immo</Link></li>
                <li><Link href="/#faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Contact</p>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:contact@declic-entrepreneur.fr" className="hover:text-white">contact@declic-entrepreneur.fr</a></li>
                <li><a href="tel:+33123456789" className="hover:text-white">01 23 45 67 89</a></li>
              </ul>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pb-8">
            © {new Date().getFullYear()} Déclic‑Entrepreneur. Tous droits réservés. •
            <Link href="/mentions-legales" className="hover:text-white"> Mentions légales</Link> •
            <Link href="/cgv" className="hover:text-white"> CGV</Link> •
            <Link href="/confidentialite" className="hover:text-white"> Confidentialité</Link>
          </div>
        </footer>
      </section>
    </div>
  );
}