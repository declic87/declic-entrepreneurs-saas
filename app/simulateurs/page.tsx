"use client";

import React, { useState } from "react"; // Ajout de useState
import Link from "next/link";
import { Search, X } from "lucide-react"; // Nouveaux icônes
// ... tes autres imports

export default function SimulateursPage() {
  const [search, setSearch] = useState("");

  const filteredSims = simulateurs.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const populaires = filteredSims.filter(s => s.popular);
  const autres = filteredSims.filter(s => !s.popular);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ... Navigation ... */}

      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
            Nos Simulateurs Gratuits
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Optimisez votre situation fiscale avec nos outils mis à jour pour 2026.
          </p>
        </div>

        {/* Barre de recherche interactive */}
        <div className="max-w-md mx-auto mb-12 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Chercher un simulateur (ex: SASU, Immobilier...)"
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Affichage conditionnel si aucun résultat */}
        {filteredSims.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400">Aucun simulateur ne correspond à votre recherche.</p>
          </div>
        ) : (
          <>
            {/* Section Populaires (uniquement si recherche vide ou s'il y en a) */}
            {populaires.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  Les plus utilisés
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {populaires.map((sim) => (
                    <SimulateurCard key={sim.id} sim={sim} />
                  ))}
                </div>
              </section>
            )}

            {/* Autres simulateurs */}
            {autres.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                  {search ? "Résultats" : "Autres simulateurs"}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {autres.map((sim) => (
                    <SimulateurCard key={sim.id} sim={sim} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ... CTA ... */}
      </div>
    </div>
  );
}

// Composant Carte pour éviter la répétition
function SimulateurCard({ sim }: { sim: any }) {
  return (
    <Link href={sim.href}>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all h-full group flex flex-col">
        <div className={`w-14 h-14 rounded-xl ${sim.color} text-white flex items-center justify-center mb-4 shadow-inner`}>
          <sim.icon size={28} />
        </div>
        <h3 className="text-lg font-bold text-primary mb-2 group-hover:text-accent transition-colors">
          {sim.title}
        </h3>
        <p className="text-slate-500 text-sm mb-6 flex-grow">
          {sim.description}
        </p>
        <div className="flex items-center text-accent font-bold text-sm border-t border-slate-50 pt-4">
          Lancer le calcul
          <ArrowRight size={16} className="ml-1 group-hover:translate-x-2 transition-transform" />
        </div>
      </div>
    </Link>
  );
}