'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Video, Users, CheckCircle2, Loader2, ExternalLink, XCircle } from 'lucide-react';
import { OnboardingVideo } from '@/components/OnboardingVideo';
import { toast } from 'sonner';

interface Atelier {
  id: string;
  title: string;
  description: string;
  atelier_date: string;
  time_slot: string;
  meet_link: string | null;
  fathom_id: string | null;
  places_prises: number;
  max_places: number;
  is_inscrit?: boolean;
  inscrit_le?: string | null;
  est_complet?: boolean;
  peut_rejoindre?: boolean;
}

export default function ClientAteliersPage() {
  const [ateliersLive, setAteliersLive] = useState<Atelier[]>([]);
  const [ateliersArchives, setAteliersArchives] = useState<Atelier[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'archives'>('live');
  const [loading, setLoading] = useState(true);
  const [inscriptionLoading, setInscriptionLoading] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadAteliers();
  }, []);

  async function loadAteliers() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/client/ateliers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setAteliersLive(data.ateliers_live);
        setAteliersArchives(data.ateliers_archives);
      }
    } catch (error) {
      console.error('Erreur chargement ateliers:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleInscription(atelierId: string) {
    setInscriptionLoading(atelierId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Vous devez être connecté');
        return;
      }

      const response = await fetch('/api/client/ateliers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ atelier_id: atelierId })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Inscription confirmée !');
        loadAteliers(); // Recharger les ateliers
      } else {
        toast.error(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      toast.error('Erreur lors de l\'inscription');
    } finally {
      setInscriptionLoading(null);
    }
  }

  async function handleDesinscription(atelierId: string) {
    setInscriptionLoading(atelierId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Vous devez être connecté');
        return;
      }

      const response = await fetch(`/api/client/ateliers?atelier_id=${atelierId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Désinscription confirmée');
        loadAteliers();
      } else {
        toast.error(data.error || 'Erreur lors de la désinscription');
      }
    } catch (error) {
      console.error('Erreur désinscription:', error);
      toast.error('Erreur lors de la désinscription');
    } finally {
      setInscriptionLoading(null);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* VIDÉO ONBOARDING */}
      <OnboardingVideo pageSlug="ateliers" role="CLIENT" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">📅 Ateliers Thématiques</h1>
        <p className="text-gray-600 leading-relaxed">
          Sessions collectives d'1h30 sur des thématiques précises : création, optimisation, gestion.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-6 py-3 border-b-2 transition-all font-semibold ${
            activeTab === 'live'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Prochains ateliers
        </button>
        <button
          onClick={() => setActiveTab('archives')}
          className={`px-6 py-3 border-b-2 transition-all font-semibold ${
            activeTab === 'archives'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Archives (Replays)
        </button>
      </div>

      {/* PROCHAINS ATELIERS */}
      {activeTab === 'live' && (
        <div className="grid md:grid-cols-2 gap-6">
          {ateliersLive.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="p-12 text-center">
                <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">Aucun atelier prévu pour le moment</p>
              </CardContent>
            </Card>
          ) : (
            ateliersLive.map((atelier) => (
              <Card 
                key={atelier.id} 
                className={`hover:shadow-xl transition-all ${
                  atelier.is_inscrit ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <Calendar className="text-emerald-500" size={24} />
                    {atelier.est_complet ? (
                      <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
                        Complet
                      </span>
                    ) : atelier.is_inscrit ? (
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Inscrit
                      </span>
                    ) : (
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                        {atelier.max_places - atelier.places_prises} places
                      </span>
                    )}
                  </div>

                  {/* Titre */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{atelier.title}</h3>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4">{atelier.description}</p>

                  {/* Date & heure */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(atelier.atelier_date)}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <Users size={14} /> {atelier.time_slot} • {atelier.places_prises}/{atelier.max_places} inscrits
                    </p>
                  </div>

                  {/* Boutons */}
                  {atelier.is_inscrit ? (
                    <>
                      {atelier.peut_rejoindre && atelier.meet_link ? (
                        <Button 
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mb-2"
                          onClick={() => window.open(atelier.meet_link!, '_blank')}
                        >
                          <Video size={18} className="mr-2" />
                          Rejoindre le live
                        </Button>
                      ) : (
                        <Button 
                          className="w-full bg-gray-100 text-gray-600 cursor-default mb-2"
                          disabled
                        >
                          <CheckCircle2 size={18} className="mr-2" />
                          Vous êtes inscrit
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        className="w-full text-red-600 hover:bg-red-50"
                        onClick={() => handleDesinscription(atelier.id)}
                        disabled={inscriptionLoading === atelier.id}
                      >
                        {inscriptionLoading === atelier.id ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <>
                            <XCircle size={18} className="mr-2" />
                            Se désinscrire
                          </>
                        )}
                      </Button>
                    </>
                  ) : atelier.est_complet ? (
                    <Button 
                      className="w-full bg-gray-200 text-gray-500 cursor-not-allowed"
                      disabled
                    >
                      Complet
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleInscription(atelier.id)}
                      disabled={inscriptionLoading === atelier.id}
                    >
                      {inscriptionLoading === atelier.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>
                          <CheckCircle2 size={18} className="mr-2" />
                          S'inscrire
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ARCHIVES */}
      {activeTab === 'archives' && (
        <div className="grid gap-4">
          {ateliersArchives.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Video className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">Aucun replay disponible</p>
              </CardContent>
            </Card>
          ) : (
            ateliersArchives.map((atelier) => (
              <Card key={atelier.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-[#123055] mb-2">{atelier.title}</h4>
                      <p className="text-sm text-slate-600 mb-3">{atelier.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(atelier.atelier_date)} • {atelier.time_slot}
                      </p>
                    </div>
                    {atelier.fathom_id && (
                      <Button 
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => window.open(`https://app.fathom.video/share/${atelier.fathom_id}`, '_blank')}
                      >
                        <Video size={16} className="mr-2" />
                        Voir le replay
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}