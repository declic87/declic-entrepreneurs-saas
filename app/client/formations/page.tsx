'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Play, Clock, Lock } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  loom_id: string;
  is_new: boolean;
  created_at: string;
}

export default function ClientFormationsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [userPack, setUserPack] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      // ⭐ FIX : Récupérer le pack depuis client_access, PAS depuis users
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userData) {
          // ⭐ Charger le pack_type depuis client_access
          const { data: accessData } = await supabase
            .from('client_access')
            .select('pack_type')
            .eq('user_id', userData.id)
            .single();

          if (accessData) {
            setUserPack(accessData.pack_type);
            console.log('✅ Pack utilisateur:', accessData.pack_type);
          }
        }
      }

      // Charger toutes les vidéos de formation
      const { data, error } = await supabase
        .from('onboarding_videos_client')
        .select('*')
        .eq('section', 'formations')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  function hasAccess(video: Video): boolean {
    if (!video.category) return true;
    
    // Formation Créateur accessible si pack = "createur"
    if (video.category === 'Créateur') {
      return userPack === 'createur';
    }
    
    // Formation Agent Immo accessible si pack = "agent_immo"
    if (video.category === 'Agent Immo') {
      return userPack === 'agent_immo';
    }
    
    // ⭐ FIX : Formation Accompagnement accessible pour starter/pro/expert
    if (video.category === 'Accompagnement') {
      const accompagnementPacks = ['starter', 'pro', 'expert'];
      const hasAccess = accompagnementPacks.includes(userPack || '');
      console.log(`🔍 Vérification accès Accompagnement pour pack "${userPack}":`, hasAccess);
      return hasAccess;
    }
    
    return false;
  }

  const categories = ['all', ...new Set(videos.map(v => v.category).filter(Boolean))];
  
  const filteredVideos = selectedCategory === 'all' 
    ? videos 
    : videos.filter(v => v.category === selectedCategory);

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
          📹 Mes Formations
        </h1>
        <p className="text-lg text-gray-600">
          Modules vidéo pour maîtriser l'optimisation fiscale
        </p>
        {userPack && (
          <p className="text-sm text-orange-600 font-semibold mt-2">
            Votre pack : {userPack}
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
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'Tous' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Liste des vidéos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => {
          const access = hasAccess(video);
          
          return (
            <Card key={video.id} className={`hover:shadow-xl transition-shadow ${!access ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                {/* Badge Nouveau */}
                {video.is_new && (
                  <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full mb-3">
                    ✨ NOUVEAU
                  </span>
                )}

                {/* Catégorie */}
                {video.category && (
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 ${
                    video.category === 'Créateur' ? 'bg-blue-100 text-blue-700' :
                    video.category === 'Agent Immo' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {video.category}
                  </span>
                )}

                {/* Titre */}
                <h3 className="text-xl font-bold text-[#123055] mb-3">
                  {video.title}
                </h3>

                {/* Description */}
                {video.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {video.description}
                  </p>
                )}

                {/* Durée */}
                {video.duration && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                    <Clock size={16} />
                    <span>{video.duration}</span>
                  </div>
                )}

                {/* Action */}
                {access ? (
                  video.loom_id && (
                    <a
                      href={`https://www.loom.com/share/${video.loom_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all"
                    >
                      <Play size={18} />
                      Regarder
                    </a>
                  )
                ) : (
                  <div className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-200 text-gray-500 rounded-lg font-semibold cursor-not-allowed">
                    <Lock size={18} />
                    Accès restreint
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredVideos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              Aucune formation disponible dans cette catégorie
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}