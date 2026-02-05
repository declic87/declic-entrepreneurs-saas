"use client";

import React from "react";
import Link from "next/link";
import { Zap, ArrowLeft, Shield } from "lucide-react";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-primary py-4 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={24} />
            </div>
            <span className="text-white font-bold text-xl">Déclic-Entrepreneur</span>
          </Link>
          <Link href="/" className="text-white/80 hover:text-white flex items-center gap-2">
            <ArrowLeft size={18} />
            Retour à l'accueil
          </Link>
        </div>
      </nav>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="flex items-center gap-4 mb-8">
            <Shield className="text-accent" size={40} />
            <h1 className="text-4xl font-bold text-primary">Mentions Légales</h1>
        </div>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-500 mb-12">En vigueur au 1er Janvier 2026</p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-4">1. Éditeur du Site</h2>
            <div className="bg-slate-50 rounded-xl p-6 text-slate-600 border-l-4 border-accent">
              <p><strong>Dénomination sociale :</strong> Everybody'IR</p>
              <p><strong>Nom commercial :</strong> Déclic-Entrepreneur</p>
              <p><strong>Forme juridique :</strong> [SAS / SARL / Auto-entrepreneur]</p>
              <p><strong>Capital social :</strong> [Montant] €</p>
              <p><strong>SIRET :</strong> [Numéro SIRET]</p>
              <p><strong>Siège social :</strong> [Adresse complète]</p>
              <p><strong>Directeur de la publication :</strong> [Ton Nom]</p>
              <p><strong>Contact :</strong> contact@declic-entrepreneur.fr</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-4">2. Hébergeur</h2>
            <p className="text-slate-600">
              Le Site est hébergé par la société <strong>Vercel Inc.</strong>, située :
              <br />
              440 N Barranca Ave #4133
              <br />
              Covina, CA 91723, États-Unis
              <br />
              Site web : <a href="https://vercel.com" className="text-accent hover:underline">https://vercel.com</a>
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-4">3. Propriété Intellectuelle</h2>
            <p className="text-slate-600 mb-4">
              L'ensemble du contenu du présent site (textes, logos, simulateurs, graphismes, icônes, images) 
              est la propriété exclusive de <strong>Everybody'IR</strong>, à l'exception des marques, logos 
              ou contenus appartenant à d'autres sociétés partenaires.
            </p>
            <p className="text-slate-600">
              Toute reproduction, distribution, modification ou publication de ces différents éléments 
              est strictement interdite sans l'accord exprès par écrit de l'éditeur.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-4">4. Limitation de responsabilité</h2>
            <p className="text-slate-600">
              Les informations contenues sur ce site, notamment celles issues des <strong>simulateurs</strong>, 
              sont fournies à titre indicatif et ne sauraient constituer un conseil juridique, fiscal ou comptable. 
              <strong>Déclic-Entrepreneur</strong> ne saurait être tenu responsable des erreurs, d'une absence de 
              disponibilité des informations ou de l'utilisation faite par l'utilisateur des résultats de simulation.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-4">5. Médiation</h2>
            <p className="text-slate-600">
              Conformément aux articles L.616-1 et R.616-1 du code de la consommation, nous proposons un dispositif 
              de médiation de la consommation. [Optionnel : Nom de l'entité de médiation choisie].
            </p>
          </section>
        </div>
      </div>

      {/* Footer (Réutilisé) */}
      <footer className="bg-slate-900 text-white py-8 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={18} />
            </div>
            <span className="text-white font-bold">Déclic-Entrepreneur</span>
          </div>
          <div className="flex gap-6 text-slate-400 text-sm">
            <Link href="/mentions-legales" className="text-white">Mentions légales</Link>
            <Link href="/cgv" className="hover:text-white">CGV</Link>
            <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}