"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Home,
  Zap,
  CheckCircle2,
  Play,
  FileText,
  Users,
  Clock,
  Star,
  Building,
  Car,
  Calculator,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";

export default function FormationAgentImmobilierPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const modules = [
    {
      title: "Module 1 : Spécificités du métier",
      duration: "2h00",
      lessons: [
        "Le statut d'agent commercial immobilier",
        "La loi Hoguet et ses implications",
        "Mandataire vs agent immobilier salarié",
        "Les réseaux de mandataires décryptés",
      ],
    },
    {
      title: "Module 2 : Quel statut choisir ?",
      duration: "3h00",
      lessons: [
        "Micro-BNC : le piège fiscal pour les agents",
        "EIRL, EURL, SASU : comparatif complet",
        "Cas pratiques selon votre CA",
        "Simulateur personnalisé inclus",
      ],
    },
    {
      title: "Module 3 : Optimiser ses frais réels",
      duration: "3h30",
      lessons: [
        "Les indemnités kilométriques (IK) maximisées",
        "Frais de véhicule : IK vs frais réels",
        "Le bureau à domicile : calcul et justificatifs",
        "Repas, téléphone, internet : tout déduire",
      ],
    },
    {
      title: "Module 4 : Stratégies avancées",
      duration: "2h45",
      lessons: [
        "Holding et SCI : pour qui, pourquoi ?",
        "Investir ses commissions intelligemment",
        "Préparer sa retraite en tant qu'agent",
        "Optimisation du couple fiscal",
      ],
    },
    {
      title: "Module 5 : Gestion pratique",
      duration: "2h30",
      lessons: [
        "Tenir sa comptabilité simplement",
        "Les déclarations obligatoires",
        "Gérer sa TVA (ou pas)",
        "Choisir son expert-comptable spécialisé",
      ],
    },
    {
      title: "Module 6 : Cas pratiques complets",
      duration: "3h00",
      lessons: [
        "Agent débutant : 30 000€ de CA",
        "Agent confirmé : 80 000€ de CA",
        "Top performer : 150 000€+ de CA",
        "Transition micro → société pas à pas",
      ],
    },
  ];

  const bonuses = [
    { title: "Simulateur Agent Immo", description: "Calculez vos économies selon votre CA et vos frais", icon: Calculator },
    { title: "Tableau de suivi IK", description: "Excel prêt à l'emploi pour vos déplacements", icon: Car },
    { title: "Modèles de factures", description: "Templates conformes pour vos honoraires", icon: FileText },
    { title: "Groupe privé agents", description: "Communauté d'entraide entre mandataires", icon: Users },
  ];

  const testimonials = [
    {
      name: "Stéphanie B.",
      role: "Mandataire IAD",
      text: "J'ai récupéré 8 000€ d'impôts la première année après avoir appliqué les conseils de la formation !",
      stars: 5,
    },
    {
      name: "Marc T.",
      role: "Agent Safti",
      text: "Enfin une formation qui comprend notre métier. Les modules sur les IK sont une mine d'or.",
      stars: 5,
    },
    {
      name: "Céline D.",
      role: "Mandataire MegAgence",
      text: "Le passage en SASU m'a fait économiser 12 000€/an. Merci pour cette formation claire !",
      stars: 5,
    },
  ];

  const faqs = [
    {
      q: "Est-ce adapté si je débute mon activité ?",
      a: "Oui, car choisir le bon statut dès le premier jour vous évitera de payer des milliers d'euros d'impôts inutilement et de devoir changer de structure dans 12 mois.",
    },
    {
      q: "Je suis déjà en micro-entreprise, puis-je changer ?",
      a: "C'est tout l'objet du module 6. Nous vous expliquons comment piloter la transition vers une société sans stopper votre activité.",
    },
    {
      q: "La formation est-elle mise à jour avec les lois de finances ?",
      a: "Absolument. Chaque année, nous mettons à jour les modules pour refléter les nouveaux barèmes kilométriques et les seuils fiscaux.",
    },
  ];

  const networks = [
    "IAD France",
    "Safti",
    "MegAgence",
    "Capifrance",
    "OptimHome",
    "BSK Immobilier",
    "Proprietes-privees",
    "EffiCity",
    "Keller Williams",
    "Sextant",
    "Dr House Immo",
    "Et tous les autres...",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-slate-900 py-4 px-4 sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={24} />
            </div>
            <span className="text-white font-bold text-xl hidden sm:inline">Déclic-Entrepreneur</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/#formations" className="text-white/80 hover:text-white flex items-center gap-2 text-sm">
              <ArrowLeft size={18} />
              Formations
            </Link>
            <Link href="/" className="text-white/80 hover:text-white flex items-center gap-2 text-sm">
              <Home size={18} />
              Accueil
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
                <Building size={18} />
                <span className="text-sm font-medium">Spécial Agents & Mandataires</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">Formation Agent Immobilier</h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Optimisez votre fiscalité de mandataire, déduisez enfin vos frais réels et gardez jusqu'à 35% de commissions en plus.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Stratégies spécifiques au métier d'agent",
                  "Maximiser vos IK (jusqu'à 15 000€/an)",
                  "Cas pratiques par palier de CA",
                  "Simulateur de statut exclusif",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="text-yellow-300 shrink-0" size={22} />
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="https://buy.stripe.com/4gM3cu5PFd382eF5j19fW02" className="w-full sm:w-auto" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 border-0 w-full text-lg h-14 px-8 font-bold shadow-xl">
                    Accéder à la formation - 897€
                  </Button>
                </a>
              </div>
              <p className="text-white/70 text-sm mt-6 flex items-center gap-2">
                <Shield size={16} />
                Paiement sécurisé • Accès immédiat à vie
              </p>
            </div>

            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-white/70 text-sm uppercase tracking-wider">Investissement</p>
                    <p className="text-5xl font-black">897€</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-sm uppercase tracking-wider">Contenu</p>
                    <p className="text-3xl font-bold">+17h Vidéo</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {[
                    { icon: Play, text: "6 modules vidéo 4K" },
                    { icon: Calculator, text: "Simulateur de rentabilité" },
                    { icon: Car, text: "Tableau de suivi IK automatisé" },
                    { icon: Clock, text: "Mises à jour annuelles incluses" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl">
                      <item.icon className="text-yellow-300" size={24} />
                      <span className="font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Networks */}
      <section className="py-12 px-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <p className="text-center font-semibold text-slate-500 mb-8 uppercase tracking-widest text-sm">
            Compatible avec tous les réseaux
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {networks.map((network, i) => (
              <span
                key={i}
                className="bg-white px-5 py-2.5 rounded-xl text-sm font-medium text-slate-700 border border-slate-200 shadow-sm"
              >
                {network}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Pourquoi la micro-entreprise vous coûte cher ?
            </h2>
            <p className="text-slate-600 text-lg">Un mandataire immobilier n'est pas un prestataire de service classique.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
            <div className="bg-red-50 p-10 border-b md:border-b-0 md:border-r border-slate-200">
              <h3 className="text-2xl font-bold text-red-700 mb-6 flex items-center gap-2">En Micro-Entreprise</h3>
              <ul className="space-y-5">
                {[
                  "Leasing voiture non déductible",
                  "IK (Indemnités Kilométriques) perdues",
                  "Charges sociales sur le CA brut",
                  "Abattement de 34% souvent inférieur aux frais réels",
                  "TVA récupérable mais frais non déductibles",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-red-800">
                    <span className="text-red-500 font-bold text-xl leading-none">×</span>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-50 p-10">
              <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-2">En Société (après formation)</h3>
              <ul className="space-y-5">
                {[
                  "Déduction intégrale de vos frais de déplacement",
                  "Versement de 6 000€ à 15 000€ d'IK net d'impôt",
                  "Pilotage du revenu (salaire vs dividendes)",
                  "Création d'une holding pour réinvestir",
                  "Optimisation du bureau à domicile",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-emerald-800">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Potentiel d'économies */}
      <section className="py-24 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-16">Estimation de vos gains annuels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { ca: "50 000€", gain: "5 200€", label: "Agent Débutant" },
              { ca: "85 000€", gain: "11 400€", label: "Agent Confirmé", highlight: true },
              { ca: "130 000€", gain: "19 800€", label: "Top Performer" },
            ].map((item, i) => (
              <div
                key={i}
                className={`p-10 rounded-3xl border ${
                  item.highlight ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5"
                } transition-transform hover:scale-105`}
              >
                <p className="text-orange-400 font-bold uppercase tracking-widest text-sm mb-4">{item.label}</p>
                <p className="text-white/60 mb-2 text-sm">Chiffre d'Affaires</p>
                <p className="text-3xl font-bold mb-6">{item.ca}</p>
                <div className="h-px bg-white/10 mb-6" />
                <p className="text-white/60 mb-2 text-sm">Économie d'impôt estimée</p>
                <p className="text-5xl font-black text-white">{item.gain}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-white/40 text-sm italic max-w-2xl mx-auto">
            * Calculs basés sur une moyenne de 20 000 km/an, l'utilisation d'un bureau à domicile (15m²) et des frais de prospection standards.
          </p>
        </div>
      </section>

      {/* Programme détaillé */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Le Programme</h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto" />
          </div>
          <div className="space-y-6">
            {modules.map((module, index) => (
              <div
                key={index}
                className="group bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:border-orange-200 hover:bg-white transition-all duration-300 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    {module.title}
                  </h3>
                  <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100 italic">
                    {module.duration} de contenu
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {module.lessons.map((lesson, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-600 group-hover:text-slate-900 transition-colors">
                      <Play className="text-orange-500 shrink-0" size={16} />
                      <span className="text-sm font-medium">{lesson}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between text-left font-bold text-slate-900"
                >
                  {faq.q}
                  {openFaq === i ? <ChevronUp /> : <ChevronDown />}
                </button>
                {openFaq === i && <div className="px-6 pb-6 text-slate-600 leading-relaxed">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 bg-orange-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Zap className="text-white absolute -top-10 -left-10" size={300} />
          <Building className="text-white absolute -bottom-10 -right-10" size={300} />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Votre temps est précieux.<br />Votre argent aussi.
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Ne laissez plus 30% de vos commissions partir en fumée par manque d'optimisation. Rejoignez la formation aujourd'hui.
          </p>
          <div className="flex flex-col items-center gap-6">
            <a href="https://buy.stripe.com/4gM3cu5PFd382eF5j19fW02" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 border-0 h-16 px-12 text-xl font-bold shadow-2xl">
                Démarrer mon optimisation maintenant
              </Button>
            </a>
            <div className="flex items-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <Shield size={20} />
                <span className="text-sm font-medium">Garantie 30 jours</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="text-yellow-400 fill-yellow-400" size={20} />
                <span className="text-sm font-medium">Note : 4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Zap className="text-orange-500" size={24} />
            <span className="font-bold text-xl tracking-tight">Déclic-Entrepreneur</span>
          </div>
          <div className="flex gap-8 text-slate-400 text-sm font-medium">
            <Link href="/mentions-legales" className="hover:text-white transition-colors">
              Mentions légales
            </Link>
            <Link href="/cgv" className="hover:text-white transition-colors">
              CGV
            </Link>
            <Link href="/confidentialite" className="hover:text-white transition-colors">
              Confidentialité
            </Link>
          </div>
          <p className="text-slate-500 text-xs text-center md:text-right">
            © {new Date().getFullYear()} Déclic-Entrepreneur. Tous droits réservés.
            <br />
            L'immobilier est un métier, l'optimisation fiscale en est un autre.
          </p>
        </div>
      </footer>
    </div>
  );
}