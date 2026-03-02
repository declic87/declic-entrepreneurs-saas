'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, Clock, Lock, FileText, Loader2, Video, Download, CreditCard } from 'lucide-react';
import { OnboardingVideo } from '@/components/OnboardingVideo';
import { toast } from 'sonner';

interface ClientAccess {
  pack_type: string;
  rdv_total: number;
  rdv_consumed: number;
  rdv_remaining: number;
  is_active: boolean;
}

interface RDV {
  id: string;
  event_name: string;
  scheduled_at: string;
  status: string;
  meeting_url: string | null;
}

export default function MonDossierPage() {
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<ClientAccess | null>(null);
  const [rdvs, setRdvs] = useState<RDV[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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

      setUserId(userData.id);

      // Charger les accès client
      const { data: accessData } = await supabase
        .from('client_access')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      if (accessData && accessData.is_active) {
        // Vérifier que c'est un pack avec accompagnement
        if (['starter', 'pro', 'expert'].includes(accessData.pack_type)) {
          setAccess(accessData);
          
          // Charger les RDV Calendly
          const { data: rdvData } = await supabase
            .from('calendly_events')
            .select('*')
            .eq('user_id', userData.id)
            .order('scheduled_at', { ascending: true });
          
          setRdvs(rdvData || []);
        }
      }

    } catch (error) {
      console.error('Erreur chargement:', error);
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

  // ❌ ACCÈS REFUSÉ
  if (!access) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-12 text-center">
            <Lock className="mx-auto text-amber-500 mb-6" size={64} />
            <h2 className="text-3xl font-black text-gray-900 mb-4">Accès Réservé</h2>
            <p className="text-gray-600 mb-8">
              Le suivi de dossier est disponible uniquement avec les packs <strong>Starter</strong>, <strong>Pro</strong> ou <strong>Expert</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Les packs Plateforme (97€), Formation Créateur (497€) et Formation Agent Immo (897€) n'incluent pas l'accompagnement personnalisé.
            </p>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-12"
              onClick={() => window.location.href = '/formations'}
            >
              Découvrir les packs avec accompagnement
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ ACCÈS AUTORISÉ
  const rdvLabels = [
    'RDV 1 - Diagnostic initial',
    'RDV 2 - Choix du statut',
    'RDV 3 - Validation stratégie',
    'RDV 4 - Suivi avancé',
    'RDV 5 - Optimisation finale',
  ];

  const progressPercentage = Math.round((access.rdv_consumed / access.rdv_total) * 100);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* ⭐ ONBOARDING VIDEO */}
      <OnboardingVideo pageSlug="mon-dossier" role="CLIENT" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#123055]">📁 Mon Dossier</h1>
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-semibold text-sm">
            Pack {access.pack_type.toUpperCase()}
          </div>
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold text-sm">
            {access.rdv_remaining} RDV restants
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne gauche : RDV + Tâches */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ========== MES RDV EXPERT ========== */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-[#123055] mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Mes rendez-vous expert ({access.rdv_consumed}/{access.rdv_total})
              </h2>

              <div className="space-y-3">
                {Array.from({ length: access.rdv_total }).map((_, index) => {
                  const rdv = rdvs[index];
                  const isCompleted = rdv && rdv.status === 'active';
                  const isScheduled = rdv && !isCompleted;
                  
                  return (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        isCompleted 
                          ? 'bg-green-50 border-green-200' 
                          : isScheduled
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${
                          isCompleted ? 'text-green-800' : isScheduled ? 'text-amber-800' : 'text-slate-600'
                        }`}>
                          {rdvLabels[index]}
                        </span>
                        {isCompleted && <CheckCircle2 className="text-green-600" size={20} />}
                        {isScheduled && <Clock className="text-amber-600" size={20} />}
                      </div>

                      {isCompleted && rdv && (
                        <p className="text-sm text-green-700">
                          ✅ Complété le {new Date(rdv.scheduled_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}

                      {isScheduled && rdv && (
                        <>
                          <p className="text-sm text-amber-700 mb-3">
                            📅 Prévu le {new Date(rdv.scheduled_at).toLocaleDateString('fr-FR')} à {new Date(rdv.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {rdv.meeting_url && (
                            <Button 
                              size="sm" 
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                              onClick={() => window.open(rdv.meeting_url!, '_blank')}
                            >
                              Rejoindre le RDV
                            </Button>
                          )}
                        </>
                      )}

                      {!isCompleted && !isScheduled && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="mt-2"
                          onClick={() => window.open('https://calendly.com/d/cvdb-dxd-3np/diagnostic', '_blank')}
                        >
                          📅 Prendre RDV
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* RDV SUPPLÉMENTAIRES PAYANTS */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <CreditCard size={18} />
                  RDV supplémentaires (payants)
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <p className="font-bold text-blue-900">RDV Expert</p>
                      <p className="text-2xl font-black text-blue-600 my-2">250€</p>
                      <Button 
                        size="sm" 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => window.open('https://buy.stripe.com/test_rdv_expert_250', '_blank')}
                      >
                        Réserver
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <p className="font-bold text-purple-900">RDV Jérôme (Fondateur)</p>
                      <p className="text-2xl font-black text-purple-600 my-2">800€</p>
                      <Button 
                        size="sm" 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() => window.open('https://buy.stripe.com/test_rdv_jerome_800', '_blank')}
                      >
                        Réserver
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ========== MES TÂCHES ========== */}
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
                    <p className="font-semibold text-slate-800">Remplir le questionnaire de diagnostic</p>
                    <p className="text-sm text-slate-500 mt-1">Nécessaire pour le premier RDV</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg">
                  <input type="checkbox" className="mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Fournir justificatif de domicile</p>
                    <p className="text-sm text-slate-500 mt-1">Document requis pour la création</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-lg">
                  <input type="checkbox" className="mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Carte d'identité valide</p>
                    <p className="text-sm text-slate-500 mt-1">Recto-verso en couleur</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ========== DOCUMENTS & TEMPLATES ========== */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-[#123055] mb-4 flex items-center gap-2">
                <Download size={20} />
                Documents & Templates
              </h2>

              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast.info('Template en cours de préparation')}
                >
                  📄 Template statuts SASU
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast.info('Template en cours de préparation')}
                >
                  📄 Template déclaration d'insaisissabilité
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast.info('Vidéo en cours de préparation')}
                >
                  🎥 Vidéo Fathom - Compte-rendu RDV Analyste
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast.info('Transcript en cours de préparation')}
                >
                  📝 Transcript RDV Expert
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Progression */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-[#123055] mb-4">Progression du dossier</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Avancement global</span>
                    <span className="font-bold text-[#123055]">{progressPercentage}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500" 
                      style={{ width: `${progressPercentage}%` }} 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-green-600 flex-shrink-0" size={18} />
                    <span className="text-sm text-slate-700">Inscription validée</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {access.rdv_consumed >= 1 ? (
                      <CheckCircle2 className="text-green-600 flex-shrink-0" size={18} />
                    ) : (
                      <Clock className="text-amber-500 flex-shrink-0" size={18} />
                    )}
                    <span className="text-sm text-slate-700">Diagnostic réalisé</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {access.rdv_consumed >= 2 ? (
                      <CheckCircle2 className="text-green-600 flex-shrink-0" size={18} />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 flex-shrink-0" />
                    )}
                    <span className="text-sm text-slate-400">Choix du statut</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {access.rdv_consumed >= 3 ? (
                      <CheckCircle2 className="text-green-600 flex-shrink-0" size={18} />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 flex-shrink-0" />
                    )}
                    <span className="text-sm text-slate-400">Création société</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {access.rdv_consumed >= access.rdv_total ? (
                      <CheckCircle2 className="text-green-600 flex-shrink-0" size={18} />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 flex-shrink-0" />
                    )}
                    <span className="text-sm text-slate-400">Validation finale</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pack Info */}
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-amber-900 mb-2">Votre Pack</h3>
              <p className="text-2xl font-black text-amber-600 mb-1">
                {access.pack_type.toUpperCase()}
              </p>
              <p className="text-sm text-amber-700">
                {access.rdv_total} rendez-vous expert inclus
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}