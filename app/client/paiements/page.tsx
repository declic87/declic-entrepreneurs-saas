'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingVideo } from '@/components/OnboardingVideo';
import { CreditCard, Download, CheckCircle2 } from 'lucide-react';

export default function PaiementsPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      {/* VIDÉO ONBOARDING */}
      <OnboardingVideo pageSlug="paiements" />

      <h1 className="text-3xl font-bold text-[#123055]">Mes Paiements</h1>

      {/* Pack actuel */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#123055] mb-2">Pack Expert</h2>
              <p className="text-slate-600">Abonnement actif jusqu'au 08 mars 2026</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-[#123055]">6 600€</div>
              <p className="text-sm text-slate-600">Paiement unique</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-[#123055] mb-6">Historique des paiements</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Pack Expert</p>
                  <p className="text-sm text-slate-500">08 février 2026</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#123055]">6 600€</p>
                <Button variant="ghost" size="sm" className="mt-1">
                  <Download size={16} className="mr-1" />
                  Facture
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Formation Agent Immobilier</p>
                  <p className="text-sm text-slate-500">15 janvier 2026</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#123055]">897€</p>
                <Button variant="ghost" size="sm" className="mt-1">
                  <Download size={16} className="mr-1" />
                  Facture
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade */}
      <Card className="border-2 border-dashed border-amber-300">
        <CardContent className="p-6 text-center">
          <CreditCard className="mx-auto text-amber-500 mb-4" size={48} />
          <h3 className="text-xl font-bold text-[#123055] mb-2">Besoin d'un accompagnement supplémentaire ?</h3>
          <p className="text-slate-600 mb-4">Ajoutez des RDV experts ou des formations complémentaires</p>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white">
            Voir les options
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}