'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Calendar, ExternalLink, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CoachingLive {
  id: string;
  title: string;
  description: string;
  session_date: string;
  time_slot: string;
  meet_link: string;
}

interface CoachingArchive {
  id: string;
  title: string;
  description: string;
  session_date: string;
  fathom_id: string;
}

export default function ClientCoachingsPage() {
  const [tab, setTab] = useState<'lives' | 'archives'>('lives');
  const [lives, setLives] = useState<CoachingLive[]>([]);
  const [archives, setArchives] = useState<CoachingArchive[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadCoachings();
  }, []);

  async function loadCoachings() {
    try {
      const { data: livesData } = await supabase
        .from('coaching_sessions')
        .select('*')
        .order('session_date', { ascending: true });

      const { data: archivesData } = await supabase
        .from('coaching_archives')
        .select('*')
        .order('session_date', { ascending: false });

      setLives(livesData || []);
      setArchives(archivesData || []);
    } catch (error) {
      console.error('Erreur chargement coachings:', error);
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
          🎥 Coachings
        </h1>
        <p className="text-lg text-gray-600">
          Sessions live et replays pour approfondir vos connaissances
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
          📅 Lives à venir ({lives.length})
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

      {/* Lives à venir */}
      {tab === 'lives' && (
        <div className="space-y-4">
          {lives.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">
                  Aucun coaching live prévu pour le moment
                </p>
              </CardContent>
            </Card>
          ) : (
            lives.map(live => (
              <Card key={live.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Date & Heure */}
                      <div className="flex items-center gap-2 text-sm text-orange-600 font-semibold mb-2">
                        <Calendar size={16} />
                        <span>
                          {new Date(live.session_date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        {live.time_slot && (
                          <>
                            <Clock size={16} />
                            <span>{live.time_slot}</span>
                          </>
                        )}
                      </div>

                      {/* Titre */}
                      <h3 className="text-2xl font-bold text-[#123055] mb-3">
                        {live.title}
                      </h3>

                      {/* Description */}
                      {live.description && (
                        <p className="text-gray-600 mb-4">
                          {live.description}
                        </p>
                      )}

                      {/* Lien Meet */}
                      {live.meet_link && (
                        <Button
                          asChild
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                        >
                          <a
                            href={live.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={18} className="mr-2" />
                            Rejoindre le live
                          </a>
                        </Button>
                      )}
                    </div>

                    <div className="ml-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">
                        <Video size={32} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
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
                      {new Date(archive.session_date).toLocaleDateString('fr-FR')}
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