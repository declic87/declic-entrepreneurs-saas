'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, ExternalLink, Play, Clock, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AtelierLive {
  id: string;
  title: string;
  description: string;
  atelier_date: string;
  time_slot: string;
  max_places: number;
  places_prises: number;
  lien_inscription: string;
}

interface AtelierArchive {
  id: string;
  title: string;
  description: string;
  atelier_date: string;
  fathom_id: string;
}

export default function ClientAteliersPage() {
  const [tab, setTab] = useState<'lives' | 'archives'>('lives');
  const [lives, setLives] = useState<AtelierLive[]>([]);
  const [archives, setArchives] = useState<AtelierArchive[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadAteliers();
  }, []);

  async function loadAteliers() {
    try {
      const { data: livesData } = await supabase
        .from('ateliers')
        .select('*')
        .order('atelier_date', { ascending: true });

      const { data: archivesData } = await supabase
        .from('atelier_archives')
        .select('*')
        .order('atelier_date', { ascending: false });

      setLives(livesData || []);
      setArchives(archivesData || []);
    } catch (error) {
      console.error('Erreur chargement ateliers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#123055] mb-3">
          🎓 Ateliers
        </h1>
        <p className="text-lg text-gray-600">
          Ateliers pratiques en petit groupe pour progresser ensemble
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('lives')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            tab === 'lives'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 Prochains ateliers ({lives.length})
        </button>
        <button
          onClick={() => setTab('archives')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            tab === 'archives'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🎬 Replays ({archives.length})
        </button>
      </div>

      {/* Prochains ateliers */}
      {tab === 'lives' && (
        <div className="space-y-4">
          {lives.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">
                  Aucun atelier prévu pour le moment
                </p>
              </CardContent>
            </Card>
          ) : (
            lives.map(atelier => {
              const placesRestantes = atelier.max_places - (atelier.places_prises || 0);
              const isComplet = placesRestantes <= 0;

              return (
                <Card key={atelier.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Date & Heure */}
                        <div className="flex items-center gap-4 text-sm text-orange-600 font-semibold mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>
                              {new Date(atelier.atelier_date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          {atelier.time_slot && (
                            <div className="flex items-center gap-2">
                              <Clock size={16} />
                              <span>{atelier.time_slot}</span>
                            </div>
                          )}
                        </div>

                        {/* Titre */}
                        <h3 className="text-2xl font-bold text-[#123055] mb-3">
                          {atelier.title}
                        </h3>

                        {/* Description */}
                        {atelier.description && (
                          <p className="text-gray-600 mb-4">
                            {atelier.description}
                          </p>
                        )}

                        {/* Places */}
                        {atelier.max_places > 0 && (
                          <div className="flex items-center gap-2 text-sm mb-4">
                            <UserCheck size={16} className={isComplet ? 'text-red-500' : 'text-green-600'} />
                            <span className={isComplet ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                              {isComplet 
                                ? 'Complet' 
                                : `${placesRestantes} place${placesRestantes > 1 ? 's' : ''} restante${placesRestantes > 1 ? 's' : ''} / ${atelier.max_places}`
                              }
                            </span>
                          </div>
                        )}

                        {/* Inscription */}
                        {atelier.lien_inscription && (
                          <Button
                            asChild
                            disabled={isComplet}
                            className={isComplet 
                              ? 'bg-gray-300 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                            }
                          >
                            <a
                              href={!isComplet ? atelier.lien_inscription : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink size={18} className="mr-2" />
                              {isComplet ? 'Places épuisées' : 'S\'inscrire'}
                            </a>
                          </Button>
                        )}
                      </div>

                      <div className="ml-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white">
                          <Users size={32} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Archives / Replays */}
      {tab === 'archives' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archives.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Play size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">
                  Aucun replay disponible pour le moment
                </p>
              </CardContent>
            </Card>
          ) : (
            archives.map(archive => (
              <Card key={archive.id} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar size={14} />
                    <span>
                      {new Date(archive.atelier_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  {/* Titre */}
                  <h3 className="text-lg font-bold text-[#123055] mb-3">
                    {archive.title}
                  </h3>

                  {/* Description */}
                  {archive.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {archive.description}
                    </p>
                  )}

                  {/* Action */}
                  {archive.fathom_id && (
                    <a
                      href={`https://fathom.video/share/${archive.fathom_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
                    >
                      <Play size={18} />
                      Voir le replay
                    </a>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}