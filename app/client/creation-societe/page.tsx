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

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button className="p-6 border-2 border-slate-200 rounded-xl hover:border-amber-500 transition-all text-left">
              <h4 className="font-bold text-[#123055] mb-2">SASU</h4>
              <p className="text-sm text-slate-600">Société par Actions Simplifiée Unipersonnelle</p>
            </button>

            <button className="p-6 border-2 border-slate-200 rounded-xl hover:border-amber-500 transition-all text-left">
              <h4 className="font-bold text-[#123055] mb-2">EURL</h4>
              <p className="text-sm text-slate-600">Entreprise Unipersonnelle à Responsabilité Limitée</p>
            </button>
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
              'Déclaration des bénéficiaires effectifs'
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
        </CardContent>
      </Card>
    </div>
  );
}