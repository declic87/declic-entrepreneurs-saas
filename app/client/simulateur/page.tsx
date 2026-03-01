"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { OnboardingVideo } from "@/components/OnboardingVideo";
import { 
  Calculator, Car, Coins, Wallet, 
  BarChart3, Receipt, Shield, Clock,
  Target, Home, TrendingUp, Users,
  Building2, ArrowUpRight 
} from "lucide-react";

const SIMULATEURS = [
  { 
    href: "/client/simulateur/fiscal", 
    icon: Calculator, 
    title: "Comparaison Fiscale", 
    desc: "Micro vs SASU IS vs SASU IR vs EURL IS. Analyse complète avec IR, IS, cotisations et net disponible.", 
    color: "bg-orange-100 text-orange-600",
    hover: "hover:border-orange-500"
  },
  { 
    href: "/client/simulateur/ik", 
    icon: Car, 
    title: "Indemnités Kilométriques", 
    desc: "Calcul précis des IK selon le barème fiscal officiel 2025 (CGI art. 83-3). CV, distance, formule détaillée.", 
    color: "bg-blue-100 text-blue-600",
    hover: "hover:border-blue-500"
  },
  { 
    href: "/client/simulateur/dividendes", 
    icon: Coins, 
    title: "Dividendes", 
    desc: "PFU 31.4% vs barème progressif. Comparaison SASU (flat tax) vs EURL (SSI sur >10% capital social).", 
    color: "bg-emerald-100 text-emerald-600",
    hover: "hover:border-emerald-500"
  },
  { 
    href: "/client/simulateur/remuneration", 
    icon: Wallet, 
    title: "Rémunération Dirigeant", 
    desc: "Mix salaire/trésorerie. Coût total employeur, net après IR, cotisations, charges patronales.", 
    color: "bg-purple-100 text-purple-600",
    hover: "hover:border-purple-500"
  },
  { 
    href: "/client/simulateur/charges", 
    icon: BarChart3, 
    title: "Charges Sociales", 
    desc: "Comparatif Micro URSSAF vs Assimilé salarié SASU vs TNS EURL. Taux réels, protection, retraite.", 
    color: "bg-cyan-100 text-cyan-600",
    hover: "hover:border-cyan-500"
  },
  { 
    href: "/client/simulateur/tva", 
    icon: Receipt, 
    title: "TVA", 
    desc: "Franchise en base vs régime réel. Seuils 2026, TVA collectée, déductible, impact trésorerie.", 
    color: "bg-amber-100 text-amber-600",
    hover: "hover:border-amber-500"
  },
  { 
    href: "/client/simulateur/acre", 
    icon: Shield, 
    title: "ACRE", 
    desc: "Simulation de l'exonération ACRE première année. Impact sur cotisations Micro et Société.", 
    color: "bg-indigo-100 text-indigo-600",
    hover: "hover:border-indigo-500"
  },
  { 
    href: "/client/simulateur/retraite", 
    icon: Clock, 
    title: "Retraite", 
    desc: "Validation trimestres, âge départ, pension estimée. Multi-périodes avec changements de statut.", 
    color: "bg-pink-100 text-pink-600",
    hover: "hover:border-pink-500"
  },
  { 
    href: "/client/simulateur/rentabilite", 
    icon: Target, 
    title: "Rentabilité", 
    desc: "Point mort mensuel, CA objectif, scénarios par niveau. Analyse marge de contribution.", 
    color: "bg-rose-100 text-rose-600",
    hover: "hover:border-rose-500"
  },
  { 
    href: "/client/simulateur/immobilier", 
    icon: Home, 
    title: "Immobilier", 
    desc: "Location meublée, SCI IS/IR, LMNP/LMP. Comparatif régimes, amortissements, fiscalité locative.", 
    color: "bg-teal-100 text-teal-600",
    hover: "hover:border-teal-500"
  },
  { 
    href: "/client/simulateur/previsionnel", 
    icon: TrendingUp, 
    title: "Prévisionnel", 
    desc: "Business plan 3 ans. CA, charges, trésorerie mensuelle, BFR, seuil de rentabilité, croissance.", 
    color: "bg-violet-100 text-violet-600",
    hover: "hover:border-violet-500"
  },
  { 
    href: "/client/simulateur/transmission", 
    icon: Users, 
    title: "Transmission", 
    desc: "Donation, succession, pacte Dutreil. Calcul droits, abattements, démembrement, stratégies optimisation.", 
    color: "bg-fuchsia-100 text-fuchsia-600",
    hover: "hover:border-fuchsia-500"
  },
  { 
    href: "/client/simulateur/holding", 
    icon: Building2, 
    title: "Holding", 
    desc: "Intégration fiscale, régime mère-fille, quote-part frais. Comparatif avec/sans holding, économies IS.", 
    color: "bg-sky-100 text-sky-600",
    hover: "hover:border-sky-500"
  },
];

export default function SimulateurHubPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* VIDÉO ONBOARDING */}
      <OnboardingVideo pageSlug="simulateur" role="CLIENT" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Simulateurs</h1>
          <p className="text-gray-500 mt-1 text-lg">13 outils de haute précision pour votre pilotage fiscal</p>
        </div>
        <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-bold border border-orange-100">
          Mise à jour Loi de Finances 2026
        </div>
      </div>

      {/* Grid des simulateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {SIMULATEURS.map((sim) => (
          <Link key={sim.href} href={sim.href} className="group">
            <Card className={`h-full border-gray-200 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 bg-white ${sim.hover} border-t-4`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${sim.color}`}>
                    <sim.icon size={26} strokeWidth={2.5} />
                  </div>
                  <ArrowUpRight size={18} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                </div>
                
                <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-gray-800 tracking-tight">
                  {sim.title}
                </h3>
                
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                  {sim.desc}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Footer Légal & Sources */}
      <Card className="bg-slate-50 border-slate-200 border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-200 rounded-lg text-slate-600">
              <Shield size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-1 italic">Note de conformité</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed uppercase tracking-wider">
                Sources : CGI art. 83-3, 158-3, 200 A, 13 A, 787 B ; CSS art. L131-6, L136-3 ; BOFiP BOI-BIC-CHG-40-20, BOI-RSA-BASE-30-50-30 ; BOSS Assiettes-10 ; Barème IR 2026 sur revenus 2025.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}