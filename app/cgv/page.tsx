'use client';

import React from "react";
import Link from "next/link";
import { Zap, ArrowLeft, ShieldCheck, scale } from "lucide-react";

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-black">
      {/* Navigation Brutaliste */}
      <nav className="border-b-4 border-black py-6 px-6 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-2xl font-black italic uppercase tracking-tighter">
              Declic<span className="text-orange-500">-Studio</span>
            </span>
          </Link>
          <Link href="/" className="font-black uppercase text-xs flex items-center gap-2 hover:text-orange-500 transition-colors">
            <ArrowLeft size={16} strokeWidth={3} />
            Retour
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-20 px-6">
        {/* Header de la page */}
        <header className="mb-16 border-l-8 border-orange-500 pl-8">
          <h1 className="text-5xl md:text-6xl font-black uppercase italic leading-none mb-4">
            Conditions<br />Générales
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
            Dernière mise à jour : Janvier 2026 — Everybody'IR
          </p>
        </header>

        <div className="space-y-16">
          {/* Section avec Style Studio */}
          <section>
            <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
              <span className="bg-black text-white px-2 py-1 italic">01</span> Objet
            </h2>
            <div className="text-lg leading-relaxed text-gray-700 space-y-4 font-medium">
              <p>
                Les présentes Conditions Générales de Vente régissent les relations contractuelles entre la société 
                <strong className="text-black underline decoration-orange-500 decoration-4"> Everybody'IR</strong>, 
                exploitant la marque <strong>Déclic-Entrepreneur</strong> et toute personne physique ou morale souhaitant bénéficier des services du Studio.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
              <span className="bg-black text-white px-2 py-1 italic">02</span> Services & Offres
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: "Formations", price: "Dès 497€" },
                { name: "Abonnement", price: "97€/mois" },
                { name: "Accompagnement", price: "Dès 3 600€" },
                { name: "RDV Stratégique", price: "Dès 250€" }
              ].map((item, i) => (
                <div key={i} className="border-2 border-black p-4 flex justify-between items-center hover:bg-orange-50 transition-colors">
                  <span className="font-black uppercase italic text-sm">{item.name}</span>
                  <span className="font-bold text-orange-500">{item.price}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
              <span className="bg-black text-white px-2 py-1 italic">06</span> Rétractation & Garantie
            </h2>
            <div className="bg-gray-100 p-8 border-l-8 border-black">
              <p className="font-bold mb-4 uppercase italic text-orange-600">Garantie Studio :</p>
              <p className="text-lg font-bold italic mb-4">
                "Satisfait ou Remboursé sous 30 jours."
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Conformément à l'article L221-18, vous disposez de 14 jours. Le Studio étend ce délai à 30 jours pour nos formations, car nous croyons en la qualité brute de nos contenus.
              </p>
            </div>
          </section>

          {/* Continuer avec les autres articles en suivant ce pattern... */}
          <section className="opacity-50 hover:opacity-100 transition-opacity">
            <h2 className="text-xl font-black uppercase mb-4 italic italic">Responsabilité</h2>
            <p className="text-sm leading-relaxed italic">
              Les conseils fournis sont pédagogiques. Le Studio ne remplace pas un expert-comptable ou un avocat fiscaliste. Vous êtes le seul maître de vos décisions.
            </p>
          </section>
        </div>
      </div>

      {/* Footer Minimaliste */}
      <footer className="border-t-4 border-black py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <p className="font-black uppercase tracking-tighter text-2xl mb-2">Declic-Studio</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Crafting High-End Entrepreneurs</p>
          </div>
          <div className="flex gap-8 font-black uppercase text-[10px] tracking-widest">
            <Link href="/mentions-legales" className="hover:text-orange-500 transition-colors">Mentions</Link>
            <Link href="/cgv" className="text-orange-500 underline decoration-2">CGV</Link>
            <Link href="/confidentialite" className="hover:text-orange-500 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}