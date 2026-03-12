"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  Calculator,
  PiggyBank,
  Receipt,
  Car,
  Coins,
  Landmark,
  Wallet,
  FileSpreadsheet,
  TrendingUp,
  Shield,
  Star,
  Menu,
  X,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/* ------------------------------ DATA BLOCKS ------------------------------ */

const NAV_LINKS = [
  { label: "Simulateurs", href: "/simulateurs" },
  { label: "Formations", href: "/formations" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "RDV Stratégique", href: "#rdv" },
  { label: "FAQ", href: "#faq" },
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

const BENEFITS = [
  { title: "Déduire vos frais", desc: "IK, bureau, repas, matériel… Tout devient déductible.", color: "bg-emerald-50 text-emerald-700", icon: PiggyBank },
  { title: "Protéger votre patrimoine", desc: "Responsabilité limitée. Vos biens personnels sont protégés.", color: "bg-blue-50 text-blue-700", icon: Shield },
  { title: "Accéder aux financements", desc: "Bilans, crédibilité bancaire, accès aux prêts pro.", color: "bg-violet-50 text-violet-700", icon: TrendingUp },
  { title: "Gagner en crédibilité", desc: "Grands comptes, image pro, contrats plus sérieux.", color: "bg-amber-50 text-amber-700", icon: Star },
];

const FORMATIONS = [
  { name: "Formation Essentielle", price: "497€", bullets: ["Choisir le bon statut juridique","Optimiser sa fiscalité dès le départ","Les erreurs à éviter","Accès à vie aux mises à jour"], cta: "/formations/essentielle" },
  { name: "Formation Agent Immobilier", price: "897€", bullets: ["Optimisation spécifique immobilier","Régime fiscal optimal","Frais réels vs micro","Stratégies avancées"], highlighted: true, cta: "/formations/agent-immobilier" },
];

const RDV = [
  { name: "Appel Expert", duration: "45 minutes", price: "250€", bullets: ["Analyse de votre situation","Recommandations personnalisées","Plan d’action concret","Réponses à toutes vos questions"], cta: "https://calendly.com/d/cvdb-dxd-3np/diagnostic" },
  { name: "Appel avec Jérôme", duration: "60 minutes", price: "800€", premium: true, bullets: ["Expertise de 10+ ans","Stratégies avancées","Cas complexes et holdings","Suivi post‑appel inclus"], cta: "https://calendly.com/d/cvdb-dxd-3np/diagnostic" },
];

const OFFRES = [
  {
    name: "Starter",
    price: "3 600€",
    bullets: ["Audit fiscal complet","Création de société","3 RDV de suivi","Support messagerie 6 mois","Accès partenaire"],
    payLink: "https://buy.stripe.com/00weVcdi72ou8D34eX9fW06",
    cta: "/signup?plan=starter",
  },
  {
    name: "Pro",
    tag: "POPULAIRE",
    price: "4 600€",
    bullets: ["Tout Starter inclus","Optimisation VASE complète","4 RDV de suivi","Support prioritaire 12 mois","Accès partenaire"],
    payLink: "https://buy.stripe.com/00w9AS7XNgfk5qR6n59fW05",
    cta: "/signup?plan=pro",
    featured: true,
  },
  {
    name: "Expert",
    price: "6 600€",
    bullets: ["Tout Pro inclus","Accompagnement premium","5 RDV de suivi","1er Audit annuel inclus","Support prioritaire 18 mois"],
    payLink: "https://buy.stripe.com/fZueVcb9Z4wCf1r9zh9fW04",
    cta: "/signup?plan=expert",
    dark: true,
  },
];

/* ------------------------------ SMALL UI ------------------------------ */

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      {eyebrow ? <p className="text-sm font-medium text-slate-500 mb-2">{eyebrow}</p> : null}
      <h2 className="text-3xl md:text-4xl font-extrabold text-[#2C3E50] tracking-tight">{title}</h2>
      {subtitle ? <p className="text-lg text-slate-600 mt-2 max-w-2xl mx-auto">{subtitle}</p> : null}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl font-extrabold text-[#F59E0B]">{value}</p>
      <p className="text-slate-600 mt-2">{label}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="text-emerald-500 mt-1" size={18} />
      <span className="text-slate-600">{children}</span>
    </li>
  );
}

/* ------------------------------ PAGE ------------------------------ */

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">
{/* NAVBAR PREMIUM */}
<nav className="fixed top-0 z-50 w-full bg-[#0d1f33]/90 backdrop-blur-lg border-b border-white/10">
  <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
    {/* Logo */}
    <Link href="/" className="flex items-center gap-3">
      <Logo size="md" showText variant="light" />
    </Link>

    {/* Desktop Navigation */}
    <div className="hidden md:flex items-center gap-8">
      {NAV_LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="text-slate-200 hover:text-white transition-colors">
          {l.label}
        </Link>
      ))}

      {/* Connexion — BLANC plein pour contraste */}
      <Link href="/login" aria-label="Se connecter">
        <Button className="px-4 bg-white text-[#123055] hover:bg-slate-100 border-0 shadow-sm">
          Connexion
        </Button>
      </Link>

      {/* Mon Espace */}
      <Link href="/app" aria-label="Accéder à mon espace">
        <Button className="px-4 bg-white text-[#123055] hover:bg-slate-100 border-0 shadow-sm">
          Mon Espace
        </Button>
      </Link>

      {/* Diagnostic — ORANGE plein */}
      <a
        href="https://calendly.com/d/cvdb-dxd-3np/diagnostic"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Prendre un diagnostic gratuit"
      >
        <Button className="px-4 bg-[#F59E0B] text-white hover:bg-[#D97706] shadow-lg shadow-amber-500/20">
          Diagnostic gratuit
        </Button>
      </a>
    </div>

    {/* Mobile toggle */}
    <button
      className="md:hidden p-2 text-white/90 hover:text-white"
      aria-label="Ouvrir le menu"
      onClick={() => setMobileMenuOpen((v) => !v)}
    >
      {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
    </button>
  </div>

  {/* Mobile Menu */}
  {mobileMenuOpen && (
    <div className="md:hidden bg-[#0d1f33]/95 backdrop-blur-lg border-t border-white/10">
      <div className="px-4 py-4 space-y-3">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block text-slate-200 hover:text-white py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            {l.label}
          </Link>
        ))}

        <div className="flex flex-col gap-3 mt-4">
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full bg-white text-[#123055] hover:bg-slate-100 border-0 shadow-sm">Connexion</Button>
          </Link>

          <Link href="/app" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full bg-white text-[#123055] hover:bg-slate-100 border-0 shadow-sm">Mon Espace</Button>
          </Link>

          <a
            href="https://calendly.com/d/cvdb-dxd-3np/diagnostic"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Button className="w-full bg-[#F59E0B] text-white hover:bg-[#D97706] shadow">Diagnostic gratuit</Button>
          </a>
        </div>
      </div>
    </div>
  )}
</nav>

{/* HERO PREMIUM */}
<header className="pt-28 md:pt-32 pb-16 md:pb-20 bg-[radial-gradient(1200px_500px_at_20%_-10%,#1f3a5f_0%,transparent_60%),linear-gradient(180deg,#18314f_0%,#0f2742_100%)] text-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Title */}
    <h1 className="text-center font-extrabold leading-tight tracking-tight text-4xl md:text-6xl">
      Indépendants, libérez votre potentiel fiscal
      <span className="block text-[#F59E0B]">Optimisez, déduisez, gagnez plus</span>
    </h1>

    {/* Subtitle */}
    <p className="text-center text-lg md:text-xl text-slate-200 mt-6 max-w-3xl mx-auto">
      Passez de micro‑entrepreneur à chef d’entreprise. Nos experts vous accompagnent de A à Z pour
      maximiser vos revenus nets.
    </p>

    {/* CTA buttons */}
    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
      <a
        href="https://calendly.com/d/cvdb-dxd-3np/diagnostic"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-6 py-6 rounded-xl text-[15px] shadow-lg shadow-amber-500/20">
          <Calendar className="mr-2" size={18} />
          Diagnostic gratuit (45 min)
        </Button>
      </a>

      <Link href="/simulateurs/economies">
        <Button
          variant="outline"
          className="bg-white text-[#123055] hover:bg-white/90 border-0 px-6 py-6 rounded-xl text-[15px]"
        >
          <Calculator className="mr-2" size={18} />
          Simuler mes économies
        </Button>
      </Link>
    </div>

    {/* Stats */}
    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <Stat value="2014" label="Depuis" />
      <Stat value="2000+" label="Clients accompagnés" />
      <Stat value="30,7M€" label="Économisés au total" />
      <Stat value="4.9/5" label="Satisfaction client" />
    </div>
  </div>
</header>
      {/* BANDEAU ÉCONOMIES */}
      <section className="py-12 bg-[linear-gradient(90deg,#F59E0B_0%,#22C55E_100%)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="flex items-center gap-2 text-white/90">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <Star size={14} />
            </span>
            Depuis 2014, nos clients ont économisé
          </p>

          <div className="mt-2 text-4xl md:text-6xl font-extrabold tracking-tight">
            30   750  000 €
          </div>

          <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center">
            <span className="inline-flex items-center gap-2 bg-white/20 text-white rounded-full px-3 py-1 w-fit">
              <span className="h-2 w-2 rounded-full bg-white"></span>
              dont <b>3 650 000 €</b> rien qu’en 2025
            </span>

            <span className="text-white/95">
              soit en moyenne <b>15 000 €</b> par client par an
            </span>
          </div>
        </div>
      </section>


{/* FORMATIONS PREMIUM */}
<section className="py-16 bg-slate-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionTitle
      title="Nos formations"
      subtitle="Apprenez à optimiser votre fiscalité par vous‑même"
    />

    <div className="mt-10 grid gap-6 md:grid-cols-2">
      {/* ==== Formation Créateur (ex-Essentielle) ==== */}
      <div className="rounded-2xl border p-6 bg-white shadow-sm border-slate-200">
        <div>
          <h3 className="text-xl font-semibold text-[#123055]">Formation Créateur</h3>
          <p className="text-3xl font-extrabold mt-2">497€</p>
        </div>

        <ul className="mt-4 space-y-2">
          <Bullet>Choisir le bon statut juridique</Bullet>
          <Bullet>Optimiser sa fiscalité dès le départ</Bullet>
          <Bullet>Les erreurs à éviter</Bullet>
          <Bullet>Accès à vie aux mises à jour</Bullet>
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          {/* 👉 En savoir plus → route DÉTAIL qui doit exister */}
          <Link href="/formations/createur">
            <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl">
              En savoir plus
            </Button>
          </Link>

          {/* 👉 Acheter (Stripe Payment Link) */}
          <a
            href="https://buy.stripe.com/aFafZg2Dt3sy06x5j19fW03"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="rounded-xl border-slate-300">
              Acheter — 497€
            </Button>
          </a>
        </div>
      </div>

      {/* ==== Formation Agent Immobilier ==== */}
      <div className="rounded-2xl border p-6 bg-white shadow-sm border-amber-300 shadow-amber-200/40">
        <div>
          <h3 className="text-xl font-semibold text-[#123055]">Formation Agent Immobilier</h3>
          <p className="text-3xl font-extrabold mt-2">897€</p>
        </div>

        <ul className="mt-4 space-y-2">
          <Bullet>Optimisation spécifique immobilier</Bullet>
          <Bullet>Régime fiscal optimal</Bullet>
          <Bullet>Frais réels vs micro</Bullet>
          <Bullet>Stratégies avancées</Bullet>
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          {/* 👉 En savoir plus → route DÉTAIL qui doit exister */}
          <Link href="/formations/agent-immobilier">
            <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl">
              En savoir plus
            </Button>
          </Link>

          {/* 👉 Acheter (Stripe Payment Link) */}
          <a
            href="https://buy.stripe.com/4gM3cu5PFd382eF5j19fW02"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="rounded-xl border-slate-300">
              Acheter — 897€
            </Button>
          </a>
        </div>
      </div>
    </div>
  </div>
</section>
{/* RDV STRATÉGIQUES */}
<section
  id="rdv"
  className="py-16 bg-[linear-gradient(180deg,#0f2742_0%,#0f2742_60%,#102b48_100%)] text-white"
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionTitle
      title="RDV Stratégiques"
      subtitle="Un échange personnalisé avec un expert pour débloquer votre situation"
      center
    />

    <div className="mt-10 grid gap-6 md:grid-cols-2">
      {[
        {
          name: "Appel Expert",
          duration: "45 minutes",
          price: "250€",
          bullets: [
            "Analyse de votre situation",
            "Recommandations personnalisées",
            "Plan d’action concret",
            "Réponses à toutes vos questions",
          ],
          premium: false,
          cta: "/rdv-expert-payant",
        },
        {
          name: "Appel avec Jérôme",
          duration: "60 minutes",
          price: "800€",
          bullets: [
            "Expertise de 10+ ans",
            "Stratégies avancées",
            "Cas complexes et holdings",
            "Suivi post‑appel inclus",
          ],
          premium: true,
          cta: "/rdv-jerome",
        },
      ].map((r) => (
        <div
          key={r.name}
          className={`rounded-2xl p-6 border ${
            r.premium ? "bg-white/5 border-white/10 ring-1 ring-amber-400/40" : "bg-white/5 border-white/10"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-extrabold">{r.name}</p>
              <p className="text-white/80">{r.duration}</p>
            </div>

            {r.premium && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200">
                PREMIUM
              </span>
            )}
          </div>

          <p className="text-3xl font-extrabold mt-3">{r.price}</p>

          <ul className="mt-4 space-y-2">
            {r.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <CheckCircle2 className="text-emerald-400 mt-1" size={18} />
                <span className="text-white/90">{b}</span>
              </li>
            ))}
          </ul>

          <a href={r.cta} target="_blank" rel="noopener noreferrer">
            <Button className="mt-6 bg-white text-[#123055] hover:bg-slate-100 rounded-xl">
              Réserver {r.name === "Appel Expert" ? "mon appel" : "avec Jérôme"}
              <ArrowRight className="ml-2" size={16} />
            </Button>
          </a>
        </div>
      ))}
    </div>
  </div>
</section>

{/* OFFRES D’ACCOMPAGNEMENT */}
<section id="tarifs" className="py-16 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionTitle
      title="Nos accompagnements"
      subtitle="Choisissez la formule adaptée à vos besoins"
    />

    {/* Abonnement Plateforme */}
    <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex items-center justify-between">
      <div className="text-[#123055]">
        <p className="font-semibold">Abonnement Plateforme</p>
        <p className="text-sm text-[#123055]/80">
          Accès à tous les simulateurs, formations et ressources
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-xl font-extrabold">
          97€ <span className="text-sm font-semibold">/mois</span>
        </p>
        {/* 👉 si tu as un Payment Link “Plateforme”, mets-le ici */}
        <a href="https://buy.stripe.com/eVqeVc2Dtgfk2eFdPx9fW07" target="_blank" rel="noopener noreferrer">
  <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl">S'abonner</Button>
</a>
      </div>
    </div>

    {/* Cartes d'offres */}
    <div className="mt-8 grid gap-6 md:grid-cols-3">
      {OFFRES.map((o) => (
        <div
          key={o.name}
          className={`rounded-2xl p-6 border shadow-sm ${
            o.dark ? "bg-[#0f2742] text-white border-[#0f2742]" : "bg-white text-[#123055] border-slate-200"
          } ${o.featured ? "ring-2 ring-amber-400" : ""}`}
        >
          <div className="flex items-start justify-between">
            <p className="text-xl font-semibold">{o.name}</p>
            {o.tag ? (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                {o.tag}
              </span>
            ) : null}
          </div>

          <p className={`text-3xl font-extrabold mt-2 ${o.dark ? "text-white" : "text-[#123055]"}`}>
            {o.price}
          </p>

          <ul className="mt-4 space-y-2">
            {o.bullets.map((b) => (
              <Bullet key={b}>{b}</Bullet>
            ))}
          </ul>

          {/* 👉 ACHAT DIRECT STRIPE : Payment Link */}
          {o.payLink ? (
            <a href={o.payLink} target="_blank" rel="noopener noreferrer">
              <Button
                className={`mt-6 rounded-xl ${
                  o.dark ? "bg-white text-[#123055] hover:bg-slate-100" : "bg-[#F59E0B] hover:bg-[#D97706] text-white"
                }`}
              >
                Choisir {o.name}
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </a>
          ) : (
            // fallback vers l’ancien CTA interne si pas de payLink défini
            <Link href={o.cta}>
              <Button
                className={`mt-6 rounded-xl ${
                  o.dark ? "bg-white text-[#123055] hover:bg-slate-100" : "bg-[#F59E0B] hover:bg-[#D97706] text-white"
                }`}
              >
                Choisir {o.name}
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </Link>
          )}
        </div>
      ))}
    </div>

    <p className="text-center text-slate-500 mt-4">
      Paiement en plusieurs fois disponible • Contactez‑nous pour en savoir plus
    </p>
  </div>
</section>

      {/* AVIS CLIENTS */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title="Ce que disent nos clients" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { name: "Sophie M.", role: "Consultante Marketing", quote: "Grâce à l’accompagnement, j’économise plus de 12 000€ par an. Le passage en SASU a tout changé !" },
              { name: "Thomas R.", role: "Développeur Freelance", quote: "Je ne comprenais rien à la fiscalité. L’équipe m’a tout expliqué clairement et simplement." },
              { name: "Marie L.", role: "Agent Immobilier", quote: "La formation agent immobilier m’a permis de récupérer 8 000€ d’impôts. Incroyable !" },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="text-[#F59E0B] fill-[#F59E0B]" size={16} />
                  ))}
                </div>
                <p className="text-slate-700">“{t.quote}”</p>
                <p className="mt-3 font-semibold text-[#123055]">{t.name}</p>
                <p className="text-slate-500 text-sm">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* FAQ */}
<section id="faq" className="py-16 bg-white">
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionTitle title="Questions fréquentes" />
    <div className="mt-8 divide-y rounded-2xl border border-slate-200 bg-white">
      {[
        {
          q: "Combien puis‑je économiser en passant de micro à SASU ?",
          a: (
            <>
              Ça dépend de votre <b>bénéfice</b> et de vos <b>frais réels</b>. À CA et charges équivalents,
              la SASU permet de <b>déduire les frais</b> (véhicule, bureau, repas…), d’optimiser
              <b> salaire/dividendes</b> et donc d’augmenter le net. En pratique, nos clients voient souvent
              entre <b>5 000€ et 20 000€ d’économies/an</b> dès que le bénéfice dépasse ~30–40 k€.
            </>
          ),
        },
        {
          q: "Est‑ce que le passage en société est compliqué ?",
          a: (
            <>
              Non si vous êtes accompagnés. On s’occupe du <b>choix du statut</b>, de la rédaction des
              <b>statuts</b>, de l’immatriculation, de la <b>banque</b> et de la mise en place comptable.
              Vous repartez avec une société <b>opérationnelle</b> et un plan d’action clair.
            </>
          ),
        },
        {
          q: "Quel est le meilleur moment pour quitter la micro‑entreprise ?",
          a: (
            <>
              Quand votre <b>bénéfice</b> devient significatif (≈ <b>30–40 k€</b>), que vous avez des
              <b> frais réels</b> ou que vous approchez des <b>plafonds de CA</b>. Un diagnostic permet de
              trancher en 20 minutes.
            </>
          ),
        },
        {
          q: "Quelle est la différence entre SASU et EURL ?",
          a: (
            <>
              <b>SASU</b> : président assimilé salarié, grande flexibilité sur les <b>dividendes</b>, entrée
              d’associés facile. <b>EURL</b> : gérant TNS (charges plus basses si rémunération faible),
              possibilité d’<b>IR</b>. Le bon choix dépend de votre <b>rémunération cible</b> et de vos projets
              (investissement, embauches).
            </>
          ),
        },
        {
          q: "Combien coûte un expert‑comptable ?",
          a: (
            <>
              Pour une TPE, comptez <b>80–250€ / mois</b> selon le volume (factures, paie) et les options
              (conseil, bilan). Dans nos offres, on vous oriente vers le partenaire <b>adapté</b> à votre
              activité.
            </>
          ),
        },
      ].map((item) => (
        <details key={item.q} className="group open:bg-slate-50 px-6 py-4 transition-colors">
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <span className="font-medium text-[#123055] text-lg">{item.q}</span>
            <span className="transition-transform duration-300 text-slate-500 group-open:rotate-180">⌄</span>
          </summary>
          <p className="mt-3 text-slate-600 leading-relaxed">{item.a}</p>
        </details>
      ))}
    </div>
  </div>
</section>

{/* CTA FINAL + FOOTER */}
<section className="py-16 bg-[linear-gradient(180deg,#0f2742_0%,#0f2742_60%,#102b48_100%)] text-white">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h3 className="text-3xl md:text-4xl font-extrabold">Prêt à optimiser votre fiscalité ?</h3>
    <p className="text-white/90 mt-3">
      Réservez un diagnostic gratuit de 45 minutes avec un expert. Sans engagement, 100% personnalisé.
    </p>
    <a
      href="https://calendly.com/d/cvdb-dxd-3np/diagnostic"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button className="mt-6 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl">
        Réserver mon diagnostic gratuit (45 min)
      </Button>
    </a>
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
          <li><Link href="/formations/createur" className="hover:text-white">Formation Créateur</Link></li>
          <li><Link href="/formations/agent-immobilier" className="hover:text-white">Formation Agent Immo</Link></li>
          <li><Link href="#faq" className="hover:text-white">FAQ</Link></li>
        </ul>
      </div>

      <div>
        <p className="font-semibold text-white mb-3">Contact</p>
        <ul className="space-y-2 text-sm">
          <li><a href="mailto:contact@declic-entrepreneur.fr" className="hover:text-white">contact@declic-entrepreneurs.fr</a></li>
        </ul>
      </div>
    </div>

    <div className="text-center text-xs text-slate-400 pb-8">
    © {new Date().getFullYear()} Déclic‑Entrepreneurs. Tous droits réservés. •{" "}
    <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>{" "}•{" "}
    <Link href="/cgv" className="hover:text-white">CGV</Link>{" "}•{" "}
    <Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link>
    </div>
  </footer>
</section>
    </div>
  );
}