'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Play, Search, Loader2 } from 'lucide-react';

interface Tuto {
  id: string;
  title: string;
  category: string;
  description: string;
  loom_id: string;
  difficulty: string;
  created_at: string;
}

export default function CloserTutosPage() {
  const [tutos, setTutos] = useState<Tuto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadTutos();
  }, []);

  async function loadTutos() {
    try {
      const { data, error } = await supabase
        .from('tutos_pratiques')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTutos(data || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTutos = searchQuery
    ? tutos.filter(t => 
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tutos;

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
          📚 Tutos Pratiques
        </h1>
        <p className="text-lg text-gray-600">
          Tutoriels vidéo step-by-step
        </p>
        <p className="text-sm text-amber-600 font-semibold mt-2">
          👁️ Accès consultant - Lecture seule
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Rechercher un tuto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2 text-center">
            {filteredTutos.length} résultat{filteredTutos.length > 1 ? 's' : ''} trouvé{filteredTutos.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Liste des tutos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutos.map(tuto => (
          <Card key={tuto.id} className="hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              {tuto.category && (
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full mb-3">
                  {tuto.category}
                </span>
              )}

              {tuto.difficulty && (
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 ml-2 ${
                  tuto.difficulty === 'Débutant' ? 'bg-green-100 text-green-700' :
                  tuto.difficulty === 'Intermédiaire' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {tuto.difficulty}
                </span>
              )}

              <h3 className="text-xl font-bold text-[#123055] mb-3">
                {tuto.title}
              </h3>

              {tuto.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {tuto.description}
                </p>
              )}

              {tuto.loom_id && (
                <a
                  href={`https://www.loom.com/share/${tuto.loom_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
                >
                  <Play size={18} />
                  Regarder
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTutos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery 
                ? `Aucun tuto trouvé pour "${searchQuery}"`
                : "Aucun tuto disponible"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}