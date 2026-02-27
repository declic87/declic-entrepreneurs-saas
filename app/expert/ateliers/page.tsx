'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, Play, Loader2 } from 'lucide-react';

interface AtelierArchive {
  id: string;
  title: string;
  description: string;
  atelier_date: string;
  fathom_id: string;
}

export default function CloserAteliersPage() {
  const [archives, setArchives] = useState<AtelierArchive[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadArchives();
  }, []);

  async function loadArchives() {
    try {
      const { data, error } = await supabase
        .from('atelier_archives')
        .select('*')
        .order('atelier_date', { ascending: false });

      if (error) throw error;
      setArchives(data || []);
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

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#123055] mb-3">
          🎓 Ateliers
        </h1>
        <p className="text-lg text-gray-600">
          Replays des ateliers pratiques en petit groupe
        </p>
        <p className="text-sm text-amber-600 font-semibold mt-2">
          👁️ Accès consultant - Lecture seule
        </p>
      </div>

      {/* Replays */}
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
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar size={14} />
                  <span>
                    {new Date(archive.atelier_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#123055] mb-3">
                  {archive.title}
                </h3>

                {archive.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {archive.description}
                  </p>
                )}

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
    </div>
  );
}