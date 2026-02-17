'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, Clock, Lock } from 'lucide-react';
import { useUserAccess } from '@/hooks/useUserAccess';
import { OnboardingVideo } from '@/components/OnboardingVideo';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MonDossierPage() {
  const { hasAccess, loading, pack } = useUserAccess();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasAccess.monDossier) {
      // Redirection si pas d'accès
      router.push('/client?error=access_denied');
    }
  }, [hasAccess, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Vérification des accès...</div>
      </div>
    );
  }

  if (!hasAccess.monDossier) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-12 text-center">
            <Lock className="mx-auto text-amber-500 mb-6" size={64} />
            <h2 className="text-3xl font-black text-gray-900 mb-4">Accès Réservé</h2>
            <p className="text-gray-600 mb-8">
              Le suivi de dossier est disponible avec les packs Starter, Pro ou Expert.
            </p>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-12" onClick={() => router.push('/formations')}>
              Voir les packs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* VIDÉO ONBOARDING */}
      <OnboardingVideo pageSlug="mon-dossier" />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#123055]">Mon Dossier</h1>
        <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-semibold text-sm">
          Pack {pack?.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne gauche : RDV */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-[#123055] mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Mes rendez-vous expert ({hasAccess.rdvExpertRestants} RDV restants)
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-green-800">RDV 1 - Diagnostic initial</span>
                    <CheckCircle2 className="text-green-600" size={20} />
                  </div>
                  <p className="text-sm text-green-700">Complété le 15 janvier 2026</p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-amber-800">RDV 2 - Choix du statut</span>
                    <Clock className="text-amber-600" size={20} />
                  </div>
                  <p className="text-sm text-amber-700">Prévu le 22 février 2026 à 14h00</p>
                  <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 text-white">
                    Rejoindre le RDV
                  </Button>
                </div>

                {hasAccess.rdvExpertTotal >= 3 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-600">RDV 3 - Validation finale</span>
                      <span className="text-xs text-slate-500">Non programmé</span>
                    </div>
                  </div>
                )}

                {hasAccess.rdvExpertTotal >= 4 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-600">RDV 4 - Suivi avancé</span>
                      <span className="text-xs text-slate-500">Non programmé</span>
                    </div>
                  </div>
                )}

                {hasAccess.rdvExpertTotal >= 5 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-600">RDV 5 - Optimisation finale</span>
                      <span className="text-xs text-slate-500">Non programmé</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tâches à faire */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-[#123055] mb-4">Mes tâches</h2>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg">
                  <input type="checkbox" className="mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Remplir le questionnaire de création</p>
                    <p className="text-sm text-slate-500 mt-1">Échéance : 20 février 2026</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg">
                  <input type="checkbox" className="mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Fournir justificatif de domicile</p>
                    <p className="text-sm text-slate-500 mt-1">Échéance : 25 février 2026</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Progression */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-[#123055] mb-4">Progression du dossier</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Avancement global</span>
                    <span className="font-bold text-[#123055]">45%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: '45%' }} />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-green-600" size={18} />
                    <span className="text-sm text-slate-700">Diagnostic réalisé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-amber-500" size={18} />
                    <span className="text-sm text-slate-700">Choix statut en cours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300" />
                    <span className="text-sm text-slate-400">Création société</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}