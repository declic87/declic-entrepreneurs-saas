'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, FileText, CheckCircle2 } from 'lucide-react';

export default function CreationSocietePage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-[#123055] mb-8">Création de Société</h1>

      {/* Statut du dossier */}
      <Card className="mb-8 border-l-4 border-l-amber-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#123055] mb-2">Statut du dossier</h2>
              <p className="text-slate-600">Votre dossier est en cours de traitement</p>
            </div>
            <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-semibold">
              En cours
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Choix du statut */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-[#123055] mb-4 flex items-center gap-2">
            <Building2 size={20} />
            Choix du statut juridique
          </h3>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              { 
                name: 'SASU', 
                desc: 'Société par Actions Simplifiée Unipersonnelle',
                popular: true 
              },
              { 
                name: 'EURL', 
                desc: 'Entreprise Unipersonnelle à Responsabilité Limitée',
                popular: true 
              },
              { 
                name: 'SAS', 
                desc: 'Société par Actions Simplifiée' 
              },
              { 
                name: 'EI', 
                desc: 'Entreprise Individuelle' 
              },
              { 
                name: 'SELARL', 
                desc: 'Société d\'Exercice Libéral à Responsabilité Limitée' 
              },
              { 
                name: 'SELARLU', 
                desc: 'SELARL Unipersonnelle' 
              },
              { 
                name: 'SELAS', 
                desc: 'Société d\'Exercice Libéral par Actions Simplifiée' 
              },
              { 
                name: 'SELASU', 
                desc: 'SELAS Unipersonnelle' 
              },
            ].map((statut) => (
              <button 
                key={statut.name}
                className={`p-6 border-2 rounded-xl hover:border-amber-500 transition-all text-left relative ${
                  statut.popular ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
                }`}
              >
                {statut.popular && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    Populaire
                  </span>
                )}
                <h4 className="font-bold text-[#123055] mb-2">{statut.name}</h4>
                <p className="text-sm text-slate-600">{statut.desc}</p>
              </button>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            💡 Ce choix sera validé lors de votre prochain RDV expert
          </div>
        </CardContent>
      </Card>

      {/* Documents à générer */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-[#123055] mb-4 flex items-center gap-2">
            <FileText size={20} />
            Documents générés automatiquement
          </h3>

          <div className="space-y-3">
            {[
              'Projet de statuts',
              'Attestation de domiciliation',
              'Formulaire M0',
              'Déclaration des bénéficiaires effectifs',
              'Attestation de parution',
              'Certificat de dépôt de capital'
            ].map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-slate-400" size={20} />
                  <span className="text-slate-700">{doc}</span>
                </div>
                <span className="text-xs text-slate-500">Sera généré après validation</span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <h4 className="font-bold text-[#123055] mb-2">✨ Génération automatique</h4>
            <p className="text-sm text-slate-700 mb-3">
              Une fois votre statut validé avec votre expert, tous ces documents seront générés automatiquement 
              et disponibles dans l'onglet "Documents".
            </p>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white text-sm">
              Prendre RDV avec un expert
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}