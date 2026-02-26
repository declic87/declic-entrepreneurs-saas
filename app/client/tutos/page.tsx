'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Download, Video, Clock, Tag, Search } from 'lucide-react';
import { OnboardingVideo } from '@/components/OnboardingVideo';

interface Tuto {
  id: string;
  title: string;
  category: string;
  description: string;
  loom_id: string;
  pdf_url: string;
  duration: string;
  is_new: boolean;
  created_at: string;
}

export default function ClientTutosPage() {
  const [tutos, setTutos] = useState<Tuto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
      console.error('Erreur chargement tutos:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = ['all', ...new Set(tutos.map(t => t.category).filter(Boolean))];
  
  const filteredTutos = tutos.filter(tuto => {
    const matchesCategory = selectedCategory === 'all' || tuto.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      tuto.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tuto.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tuto.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* ⭐ ONBOARDING VIDEO */}
      <OnboardingVideo pageSlug="tutos" role="CLIENT" />

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#123055] mb-3">
          📚 Tutos Pratiques
        </h1>
        <p className="text-lg text-gray-600">
          Guides pas à pas pour optimiser votre fiscalité au quotidien
        </p>
      </div>

      {/* ⭐ BARRE DE RECHERCHE */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Rechercher un tuto par titre, catégorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base border-2 border-gray-200 focus:border-orange-500"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2 text-center">
            {filteredTutos.length} résultat{filteredTutos.length > 1 ? 's' : ''} trouvé{filteredTutos.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filtres catégories */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'Tous' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Liste des tutos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutos.map(tuto => (
          <Card key={tuto.id} className="hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              {tuto.is_new && (
                <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full mb-3">
                  ✨ NOUVEAU
                </span>
              )}

              {tuto.category && (
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="text-orange-500" size={16} />
                  <span className="text-sm font-semibold text-orange-600">
                    {tuto.category}
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold text-[#123055] mb-3">
                {tuto.title}
              </h3>

              {tuto.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {tuto.description}
                </p>
              )}

              {tuto.duration && (
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                  <Clock size={16} />
                  <span>{tuto.duration}</span>
                </div>
              )}

              <div className="space-y-2">
                {tuto.loom_id && (
                  <a
                    href={`https://www.loom.com/share/${tuto.loom_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all"
                  >
                    <Video size={18} />
                    Voir la vidéo
                  </a>
                )}

                {tuto.pdf_url && (
                  <a
                    href={tuto.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all"
                  >
                    <Download size={18} />
                    Télécharger le PDF
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTutos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery 
                ? `Aucun tuto trouvé pour "${searchQuery}"`
                : 'Aucun tuto disponible dans cette catégorie'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}