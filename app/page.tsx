"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  PiggyBank,
  Receipt,
  Car,
  Building,
  Coins,
  Landmark,
  Wallet,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Play,
  Users,
  TrendingUp,
  Shield,
  Star,
  Menu,
  X,
  Calendar,
} from "lucide-react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const simulateurs = [
    {
      title: "Comparateur Fiscal",
      description: "Micro vs SASU vs EURL",
      icon: Calculator,
      href: "/simulateurs/comparateur",
    },
    {
      title: "Indemnités Kilométriques",
      description: "Calcul IK 2025",
      icon: Car,
      href: "/simulateurs/ik",
    },
    {
      title: "Dividendes",
      description: "PFU 30% vs Barème IR",
      icon: Coins,
      href: "/simulateurs/dividendes",
    },
    {
      title: "Rémunération",
      description: "Salaire dirigeant optimal",
      icon: Wallet,
      href: "/simulateurs/remuneration",
    },
    {
      title: "Charges Sociales",
      description: "Comparatif régimes",
      icon: PiggyBank,
      href: "/simulateurs/charges",
    },
    {
      title: "TVA",
      description: "Franchise ou régime réel",
      icon: Receipt,
      href: "/simulateurs/tva",
    },
    {
      title: "ACRE",
      description: "Exonération début activité",
      icon: Shield,
      href: "/simulateurs/acre",
    },
    {
      title: "Retraite",
      description: "Trimestres validés",
      icon: Landmark,
      href: "/simulateurs/retraite",
    },
  ];

  const features = [
    {
      icon: Calculator,
      title: "Simulateurs gratuits",
      description: "9 outils fiscaux pour optimiser votre situation",
    },
    {
      icon: Users,
      title: "Experts dédiés",
      description: "Accompagnement personnalisé par des fiscalistes",
    },
    {
      icon: FileSpreadsheet,
      title: "Création société",
      description: "Tous vos documents légaux automatisés",
    },
    {
      icon: TrendingUp,
      title: "Optimisation continue",
      description: "Stratégies adaptées à votre croissance",
    },
  ];

  const testimonials = [
    {
      name: "Sophie Martin",
      role: "Consultante indépendante",
      content:
        "J'ai économisé plus de 8 000€ d'impôts dès la première année grâce à DÉCLIC. L'accompagnement est top !",
      rating: 5,
    },
    {
      name: "Thomas Dupont",
      role: "E-commerce",
      content:
        "Les simulateurs m'ont permis de comprendre exactement quelle structure choisir. Gain de temps énorme.",
      rating: 5,
    },
    {
      name: "Marie Dubois",
      role: "Agent immobilier",
      content:
        "Formation ultra complète, j'ai enfin compris la fiscalité. Mon expert répond à toutes mes questions.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  <span className="text-[#E67E22]">DÉCLIC</span>
                  <span className="text-[#2C3E50]">-Entrepreneurs</span>
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/simulateurs"
                className="text-gray-600 hover:text-[#E67E22] transition-colors"
              >
                Simulateurs
              </Link>
              <Link
                href="/formations"
                className="text-gray-600 hover:text-[#E67E22] transition-colors"
              >
                Formations
              </Link>
              <Link
                href="/tarifs"
                className="text-gray-600 hover:text-[#E67E22] transition-colors"
              >
                Tarifs
              </Link>
              <Link href="/login">
                <Button variant="outline">Connexion</Button>
              </Link>
              <Link href="https://calendly.com/declic-entrepreneurs/diagnostic">
                <Button className="bg-[#E67E22] hover:bg-[#D35400] text-white">
                  Diagnostic gratuit
                </Button>
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? (
                <X className="text-gray-600" size={24} />
              ) : (
                <Menu className="text-gray-600" size={24} />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <Link
                href="/simulateurs"
                className="block text-gray-600 hover:text-[#E67E22] py-2"
              >
                Simulateurs
              </Link>
              <Link
                href="/formations"
                className="block text-gray-600 hover:text-[#E67E22] py-2"
              >
                Formations
              </Link>
              <Link
                href="/tarifs"
                className="block text-gray-600 hover:text-[#E67E22] py-2"
              >
                Tarifs
              </Link>
              <Link href="/login" className="block py-2">
                <Button variant="outline" className="w-full">
                  Connexion
                </Button>
              </Link>
              <Link
                href="https://calendly.com/declic-entrepreneurs/diagnostic"
                className="block py-2"
              >
                <Button className="w-full bg-[#E67E22] hover:bg-[#D35400] text-white">
                  Diagnostic gratuit
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#2C3E50] to-[#34495E]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Payez moins d'impôts.{" "}
              <span className="text-[#E67E22]">Légalement.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Optimisation fiscale pour micro-entrepreneurs, auto-entrepreneurs,
              TPE et PME. Gardez plus de ce que vous gagnez.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="https://calendly.com/declic-entrepreneurs/diagnostic">
                <Button
                  size="lg"
                  className="bg-[#E67E22] hover:bg-[#D35400] text-white text-lg px-8 py-6"
                >
                  <Calculator className="mr-2" size={20} />
                  Diagnostic gratuit
                </Button>
              </Link>
              <Link href="/simulateurs">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 bg-white hover:bg-gray-100"
                >
                  <Play className="mr-2" size={20} />
                  Essayer les simulateurs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-[#E67E22]">8 500€</p>
              <p className="text-gray-600 mt-2">Économie moyenne par an</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-[#E67E22]">2 400+</p>
              <p className="text-gray-600 mt-2">Entrepreneurs accompagnés</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-[#E67E22]">98%</p>
              <p className="text-gray-600 mt-2">Taux de satisfaction</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-[#E67E22]">24h</p>
              <p className="text-gray-600 mt-2">Délai de réponse moyen</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              Pourquoi choisir DÉCLIC ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète pour optimiser votre fiscalité
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[#E67E22]/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="text-[#E67E22]" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              Simulateurs gratuits
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Testez nos outils d'optimisation fiscale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {simulateurs.map((sim, idx) => (
              <Link key={idx} href={sim.href}>
                <div className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border border-gray-200 hover:border-[#E67E22]">
                  <div className="w-12 h-12 bg-[#E67E22]/10 rounded-lg flex items-center justify-center mb-4">
                    <sim.icon className="text-[#E67E22]" size={24} />
                  </div>
                  <h3 className="font-semibold text-[#2C3E50] mb-2">
                    {sim.title}
                  </h3>
                  <p className="text-sm text-gray-600">{sim.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/simulateurs">
              <Button
                size="lg"
                className="bg-[#E67E22] hover:bg-[#D35400] text-white"
              >
                Voir tous les simulateurs
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              Ils nous font confiance
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="text-[#E67E22] fill-current"
                      size={16}
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">{testimonial.content}</p>
                <div>
                  <p className="font-semibold text-[#2C3E50]">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-[#E67E22] to-[#D35400]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à optimiser votre fiscalité ?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Diagnostic gratuit de 30 minutes avec un expert fiscal
          </p>
          <Link href="https://calendly.com/declic-entrepreneurs/diagnostic">
            <Button
              size="lg"
              className="bg-white text-[#E67E22] hover:bg-gray-100 text-lg px-8 py-6"
            >
              <Calendar className="mr-2" size={20} />
              Réserver mon diagnostic gratuit
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-[#2C3E50] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">
                <span className="text-[#E67E22]">DÉCLIC</span>-Entrepreneurs
              </h3>
              <p className="text-gray-400 text-sm">
                Optimisation fiscale pour entrepreneurs
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Simulateurs</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/simulateurs/comparateur" className="hover:text-[#E67E22]">
                    Comparateur fiscal
                  </Link>
                </li>
                <li>
                  <Link href="/simulateurs/ik" className="hover:text-[#E67E22]">
                    Indemnités kilométriques
                  </Link>
                </li>
                <li>
                  <Link href="/simulateurs/dividendes" className="hover:text-[#E67E22]">
                    Dividendes
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/formations" className="hover:text-[#E67E22]">
                    Formations
                  </Link>
                </li>
                <li>
                  <Link href="/tarifs" className="hover:text-[#E67E22]">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#E67E22]">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/cgv" className="hover:text-[#E67E22]">
                    CGV
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="hover:text-[#E67E22]">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/mentions-legales" className="hover:text-[#E67E22]">
                    Mentions légales
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 DÉCLIC-Entrepreneurs. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}