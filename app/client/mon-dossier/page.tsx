'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, Clock, Lock, FileText, Loader2 } from 'lucide-react';
import { OnboardingVideo } from '@/components/OnboardingVideo';

export default function MonDossierPage() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [rdvData, setRdvData] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) {
        setLoading(false);
        return;
      }

      // Charger les accès client
      const { data: accessData } = await supabase
        .from('client_access')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      if (accessData && accessData.is_active) {
        setHasAccess(true);
        setRdvData({
          total: accessData.rdv_total || 0,
          consumed: accessData.rdv_consumed || 0,
          remaining: accessData.rdv_remaining || 0,
          pack: accessData.pack_type,
        });
      }

    } catch (error) {
      console.error('Erreur chargement accès:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-12 text-center">
            <Lock className="mx-auto text-amber-500 mb-6" size={64} />
            <h2 className="text-3xl font-black text-gray-900 mb-4">Accès Réservé</h2>
            <p className="text-gray-600 mb-8">
              Le suivi de dossier est disponible avec les packs payants.
            </p>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-12"
              onClick={() => window.location.href = '/formations'}
            >
              Voir les packs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* ⭐ VIDÉO ONBOARDING */}
      <OnboardingVideo pageSlug="mon-dossier" role="CLIENT" />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#123055]">📁 Mon Dossier</h1>
        <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-semibold text-sm">
          Pack {rdvData?.pack?.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne gauche : RDV */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-[#123055] mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Mes rendez-vous expert ({rdvData?.remaining || 0} RDV restants)
              </h2>

              <div className="space-y-4">
                {/* RDV Exemple - À remplacer par vraies données */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-green-800">RDV 1 - Diagnostic initial</span>
                    <CheckCircle2 className="text-green-600" size={20} />
                  </div>
                  <p className="text-sm text-green-700">Complété</p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-amber-800">RDV 2 - Choix du statut</span>
                    <Clock className="text-amber-600" size={20} />
                  </div>
                  <p className="text-sm text-amber-700">À programmer</p>
                  <Button 
                    size="sm" 
                    className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => window.open('https://calendly.com/contact-jj-conseil/rdv-analyste', '_blank')}
                  >
                    Prendre RDV
                  </Button>
                </div>

                {rdvData?.total >= 3 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-600">RDV 3 - Validation finale</span>
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
              <h2 className="text-xl font-bold text-[#123055] mb-4 flex items-center gap-2">
                <FileText size={20} />
                Mes tâches
              </h2>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg">
                  <input type="checkbox" className="mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Remplir le questionnaire de création</p>
                    <p className="text-sm text-slate-500 mt-1">Documents requis</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg">
                  <input type="checkbox" className="mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Fournir justificatif de domicile</p>
                    <p className="text-sm text-slate-500 mt-1">Document à joindre</p>
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
                    <span className="font-bold text-[#123055]">25%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: '25%' }} />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-green-600" size={18} />
                    <span className="text-sm text-slate-700">Inscription réalisée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-amber-500" size={18} />
                    <span className="text-sm text-slate-700">Premier RDV à venir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300" />
                    <span className="text-sm text-slate-400">Création société</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300" />
                    <span className="text-sm text-slate-400">Validation finale</span>
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