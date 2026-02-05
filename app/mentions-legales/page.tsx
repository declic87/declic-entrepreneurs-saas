"use client";

import React from "react";
import Link from "next/link";
import { Zap, ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-[#1e3a5f] py-4 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#E67E22] rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={24} />
            </div>
            <span className="text-white font-bold text-xl">Déclic-Entrepreneur</span>
          </Link>
          <Link href="/mentions-legales" className="text-white/80 hover:text-white flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Mentions Légales
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="flex items-center gap-3 mb-6 text-[#E67E22]">
            <ShieldCheck size={32} />
            <h1 className="text-4xl font-bold text-[#1e3a5f]">Politique de Confidentialité</h1>
        </div>
        
        <div className="prose prose-slate max-w-none text-slate-600 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4">Introduction</h2>
            <p>
              Dans le cadre de son activité, la société EVERYBOD'IR est amenée à collecter et à traiter des informations dont certaines sont qualifiées de "données personnelles". Nous attachons une grande importance au respect de la vie privée.
            </p>
          </section>

          <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">Données collectées</h2>
            <p>Sur le site <strong>Déclic-Entrepreneur</strong>, il y a 2 types de données susceptibles d’être recueillies :</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Données transmises directement :</strong> Celles que vous nous transmettez par formulaire de contact ou lors de votre inscription (Nom, Prénom, Email).</li>
              <li><strong>Données collectées automatiquement :</strong> Via des cookies (Google Analytics, etc.) pour mesurer l'audience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4">Utilisation des données</h2>
            <p>
              Les données que vous nous transmettez directement sont utilisées dans le but de vous re-contacter et/ou dans le cadre de votre abonnement à nos services. Les données "statistiques" sont utilisées de façon anonyme pour améliorer l'expérience utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4">Base légale</h2>
            <p>
              Les données personnelles ne sont collectées qu’après consentement obligatoire de l’utilisateur. Ce consentement est recueilli via le formulaire d'inscription ou le bandeau cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4">Vos droits</h2>
            <p>
              Vous avez un droit de consultation, demande de modification ou d’effacement sur l’ensemble de vos données personnelles. Vous pouvez également retirer votre consentement au traitement de vos données.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}