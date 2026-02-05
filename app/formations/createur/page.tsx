"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Home,
  Zap,
  CheckCircle2,
  Play,
  FileText,
  Users,
  Clock,
  Award,
  BookOpen,
  Target,
  TrendingUp,
  Shield,
  Star,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

export default function FormationCreateurPage() {
  const modules = [
    {
      title: "Module 1 : Les fondamentaux stratégiques",
      duration: "2h30",
      description: "Choisir la bonne structure pour ne pas le regretter dans 2 ans.",
      lessons: [
        "Comprendre les différents statuts juridiques",
        "Micro-entreprise : avantages et limites réelles",
        "SASU vs EURL : le comparatif ultime de rentabilité",
        "Quiz : Quel statut correspond à votre ambition ?",
      ],
    },
    {
      title: "Module 2 : Fiscalité appliquée & Maîtrise de l'impôt",
      duration: "3h00",
      description: "Apprenez à calculer exactement ce qu'il vous restera dans la poche.",
      lessons: [
        "IR vs IS : comprendre les régimes fiscaux",
        "Le barème progressif de l'impôt sur le revenu",
        "L'impôt sur les sociétés : taux et calculs",
        "Exercices pratiques : Simulations réelles",
      ],
    },
    {
      title: "Module 3 : Optimisation des charges sociales",
      duration: "2h45",
      description: "Réduisez vos prélèvements URSSAF en toute légalité.",
      lessons: [
        "Les charges sociales selon votre statut",
        "Cotisations URSSAF : décryptage complet",
        "Stratégies pour réduire vos charges légalement",
        "Cas pratiques : Optimisation freelance",
      ],
    },
    {
      title: "Module 4 : La méthode VASE (Exclusif)",
      duration: "3h30",
      description: "Le système complet pour extraire de la trésorerie sans impôts.",
      lessons: [
        "V - Véhicule : Optimiser ses indemnités kilométriques",
        "A - Abondement : Utiliser l'épargne salariale",
        "S - Salaire : Trouver le curseur idéal rémunération/dividendes",
        "E - Épargne : PER et stratégies de retraite pour dirigeant",
      ],
    },
    {
      title: "Module 5 : Création de société de A à Z",
      duration: "2h00",
      description: "Évitez les erreurs administratives coûteuses lors du lancement.",
      lessons: [
        "Les étapes de création pas à pas",
        "Rédiger ses statuts (modèles fournis)",
        "Capital social : combien mettre réellement ?",
        "Le guichet unique : guide de survie",
      ],
    },
    {
      title: "Module 6 : Gestion & Pilotage au quotidien",
      duration: "2h15",
      description: "Gagnez du temps sur l'administratif pour vous concentrer sur votre CA.",
      lessons: [
        "Tenir sa comptabilité simplement",
        "Choisir son expert-comptable (et bien le gérer)",
        "Calendrier des déclarations obligatoires",
        "Anticiper sa trésorerie sur 12 mois",
      ],
    },
  ];

  const bonuses = [
    {
      title: "Pack de Documents",
      description: "Statuts type, PV d'AG, et tableaux de bord prêts à l'emploi.",
      icon: FileText,
    },
    {
      title: "Simulateur Excel Pro",
      description: "Calculez vos économies d'impôts en changeant juste 3 chiffres.",
      icon: TrendingUp,
    },
    {
      title: "Cercle des Créateurs",
      description: "Accès au groupe privé pour ne plus jamais être seul face à un doute.",
      icon: Users,
    },
    {
      title: "Mises à jour à vie",
      description: "La loi de finance change ? La formation est mise à jour gratuitement.",
      icon: Award,
    },
  ];

  const faqs = [
    {
      q: "Est-ce que cette formation est adaptée si je suis déjà en Micro-Entreprise ?",
      a: "Absolument. C'est même le meilleur moment. La formation vous aide à calculer précisément quand et comment passer en société pour ne pas perdre d'argent lors de la transition.",
    },
    {
      q: "Ai-je besoin de connaissances en comptabilité ?",
      a: "Aucune. Tout est vulgarisé. Si vous savez utiliser une calculatrice, vous avez tout ce qu'il faut pour suivre et appliquer la méthode.",
    },
    {
      q: "La formation est-elle éligible au CPF ?",
      a: "Pour maintenir un prix accessible et une liberté totale de contenu, cette formation n'est pas éligible au CPF. C'est un investissement immédiatement déductible de vos frais si vous avez déjà une structure.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900 py-4 px-4 sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={24} />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Déclic-Entrepreneur</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors text-sm font-medium flex items-center gap-2">
              <Home size={16} />
              Accueil
            </Link>
            <a href="https://buy.stripe.com/aFafZg2Dt3sy06x5j19fW03">
                <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 hidden sm:flex">
                    S'inscrire
                </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-24 px-4 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent opacity-50" />
        
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-8">
                <Star className="text-blue-400 fill-blue-400" size={14} />
                <span className="text-sm font-semibold text-blue-300 uppercase tracking-wider">Accès Immédiat • Édition 2026</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold mb-8 leading-tight">
                Ne laissez plus l'État choisir votre <span className="text-blue-500">niveau de vie.</span>
              </h1>
              <p className="text-xl text-slate-400 mb-10 leading-relaxed">
                Maîtrisez la fiscalité, optimisez vos charges et créez votre société avec la méthode pas-à-pas utilisée par +500 indépendants.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <a href="https://buy.stripe.com/aFafZg2Dt3sy06x5j19fW03" target="_blank" className="flex-1">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg h-16 w-full shadow-lg shadow-blue-600/20">
                    Rejoindre la formation — 497€
                  </Button>
                </a>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4">
                {["6 Modules HD", "Garantie 30j", "Accès à vie", "Supports PDF"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="text-blue-500" size={18} />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-tr from-slate-800 to-slate-800/50 rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="aspect-video bg-slate-900 rounded-xl mb-6 flex items-center justify-center border border-white/5 group cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors" />
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform relative z-10">
                        <Play className="text-white fill-white translate-x-0.5" size={24} />
                    </div>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Prix Unique</p>
                        <p className="text-4xl font-bold">497€ <span className="text-lg text-slate-500 font-normal line-through">997€</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Satisfaction</p>
                        <p className="text-2xl font-bold text-blue-400">99.2%</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed italic">
                    "En appliquant seulement le module 4, j'ai économisé 4 200€ d'impôts dès ma première année." — Marc A.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cibles */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-6">Conçu pour ceux qui veulent passer au niveau supérieur</h2>
            <p className="text-slate-600">Que vous soyez au stade de l'idée ou déjà en activité, nous avons une roadmap pour vous.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: "Micro-entrepreneurs", text: "Vous plafonnez ou payez trop ? Apprenez à basculer en société sans douleur.", color: "bg-blue-50 text-blue-600" },
              { icon: TrendingUp, title: "Futurs Créateurs", text: "Partez sur des bases saines. Évitez les erreurs qui coûtent des milliers d'euros.", color: "bg-emerald-50 text-emerald-600" },
              { icon: Shield, title: "Indépendants", text: "Prenez enfin le contrôle de vos chiffres au lieu de subir les appels de l'URSSAF.", color: "bg-purple-50 text-purple-600" }
            ].map((card, i) => (
              <div key={i} className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 hover:border-blue-200 transition-colors">
                <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center mb-6`}>
                  <card.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programme (Accordéon) */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Le programme détaillé</h2>
            <p className="text-slate-600">16 heures de formation concrète, sans blabla théorique.</p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {modules.map((module, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-white border border-slate-200 rounded-2xl px-6">
                <AccordionTrigger className="hover:no-underline py-6">
                  <div className="text-left">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-blue-600 font-bold text-sm uppercase tracking-widest">Module {index + 1}</span>
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Clock size={12} /> {module.duration}
                        </span>
                    </div>
                    <p className="font-bold text-lg text-slate-900">{module.title}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-slate-500 mb-4 text-sm">{module.description}</p>
                  <ul className="grid gap-3">
                    {module.lessons.map((lesson, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg text-sm font-medium">
                        <Play className="text-blue-600" size={14} />
                        {lesson}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Bonus */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Inclus pour accélérer vos résultats</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {bonuses.map((bonus, index) => (
              <div key={index} className="p-6 rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/30 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                  <bonus.icon size={24} />
                </div>
                <h3 className="font-bold mb-2">{bonus.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{bonus.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 justify-center mb-12">
                <HelpCircle className="text-blue-600" size={32} />
                <h2 className="text-3xl font-bold text-center">Questions fréquentes</h2>
            </div>
            <div className="space-y-8">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200">
                        <h3 className="font-bold text-lg mb-3 flex gap-3">
                            <span className="text-blue-600 text-xl font-black">?</span>
                            {faq.q}
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-sm ml-6">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Prêt à transformer votre gestion ?</h2>
          <p className="text-blue-100 text-xl mb-10 opacity-90">
            Accédez immédiatement à la formation et commencez à optimiser votre business aujourd'hui.
          </p>
          <a href="https://buy.stripe.com/aFafZg2Dt3sy06x5j19fW03" target="_blank">
            <Button size="lg" className="bg-white hover:bg-slate-100 text-blue-600 text-xl font-bold h-20 px-12 rounded-2xl shadow-2xl">
              Obtenir mon accès — 497€
            </Button>
          </a>
          <div className="flex items-center justify-center gap-6 mt-10">
            <div className="flex items-center gap-2 text-blue-100 text-sm">
                <Shield size={16} /> Paiement 100% Sécurisé
            </div>
            <div className="flex items-center gap-2 text-blue-100 text-sm">
                <CheckCircle2 size={16} /> Garantie Satisfait ou Remboursé
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
                <div className="max-w-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="text-blue-500 fill-blue-500" size={24} />
                        <span className="font-bold text-xl uppercase tracking-tighter">Déclic-Entrepreneur</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        La plateforme de référence pour les indépendants qui veulent allier performance entrepreneuriale et sérénité fiscale.
                    </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                    <div>
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-500">Légal</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
                            <li><Link href="/cgv" className="hover:text-white transition-colors">CGV</Link></li>
                            <li><Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-500">Formation</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="#programme" className="hover:text-white transition-colors">Le Programme</Link></li>
                            <li><Link href="#temoignages" className="hover:text-white transition-colors">Témoignages</Link></li>
                            <li><Link href="#faq" className="hover:text-white transition-colors">FAQ</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="pt-8 border-t border-white/5 text-center text-slate-500 text-xs">
                © {new Date().getFullYear()} Déclic-Entrepreneur. Tous droits réservés.
            </div>
        </div>
      </footer>
    </div>
  );
}