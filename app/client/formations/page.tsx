'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Play, Clock, Lock, Download, ArrowRight, Search, Loader2, Video } from 'lucide-react';
import { OnboardingVideo } from '@/components/OnboardingVideo';

interface Template {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
}

interface FormationVideo {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  loom_id: string;
  is_new: boolean;
  created_at: string;
  templates?: Template[];
}

export default function ClientFormationsPage() {
  console.log('🎬 COMPOSANT ClientFormationsPage MONTÉ');

  const [videos, setVideos] = useState<FormationVideo[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [packType, setPackType] = useState<string | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    console.log('🔥 useEffect DÉCLENCHÉ - Appel loadFormations()');
    loadFormations();
  }, []);

  async function loadFormations() {
    console.log('🚀 === DÉBUT loadFormations() ===');
    
    try {
      console.log('👤 Récupération session Supabase...');
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('👤 Session:', session ? '✅ OUI' : '❌ NON');
      
      if (!session) {
        console.log('❌ Pas de session - Arrêt');
        setLoading(false);
        return;
      }

      console.log('🔑 Token présent:', session.access_token.substring(0, 30) + '...');

      console.log('🌐 === APPEL API /api/client/formations ===');

      // Appeler l'API
      const response = await fetch('/api/client/formations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      console.log('📡 Response Status:', response.status);
      console.log('📡 Response OK:', response.ok);
      
      const data = await response.json();
      
      console.log('📦 === DATA REÇUE ===');
      console.log('📦 data.success:', data.success);
      console.log('📦 data.category:', data.category);
      console.log('📦 data.pack_type:', data.pack_type);
      console.log('📦 data.formations (nombre):', data.formations?.length || 0);
      console.log('📦 data.formations (détail):', data.formations);
      
      if (data.success) {
        console.log('✅ Mise à jour du state avec', data.formations.length, 'vidéos');
        setVideos(data.formations);
        setCategory(data.category);
        setPackType(data.pack_type);
      } else {
        console.log('❌ data.success = false');
      }
    } catch (error) {
      console.error('❌ === ERREUR loadFormations() ===', error);
    } finally {
      console.log('🏁 loadFormations() terminé - setLoading(false)');
      setLoading(false);
    }
  }

  console.log('🎨 RENDER - videos.length:', videos.length, '| category:', category, '| loading:', loading);

  const filteredVideos = videos.filter((video) => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log('🔍 filteredVideos.length:', filteredVideos.length);

  const categoryLabels: Record<string, { title: string; subtitle: string; color: string }> = {
    'Créateur': {
      title: '🎓 Formation Créateur',
      subtitle: 'Choix du statut, fiscalité appliquée, méthode VASE, création pas-à-pas',
      color: 'blue'
    },
    'Agent Immo': {
      title: '🏠 Formation Agent Immobilier',
      subtitle: 'Optimisation mandataires : IK maximisées, frais réels, cas pratiques',
      color: 'green'
    },
    'Accompagnement': {
      title: '💼 Formation Accompagnement',
      subtitle: 'Formations exclusives pour votre pack d\'accompagnement personnalisé',
      color: 'purple'
    }
  };

  if (loading) {
    console.log('⏳ AFFICHAGE: Loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  // Aucune formation accessible
  if (!category || videos.length === 0) {
    console.log('🔒 AFFICHAGE: Aucune formation accessible');
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-12 text-center">
            <Lock className="mx-auto text-amber-500 mb-6" size={64} />
            <h2 className="text-3xl font-black text-gray-900 mb-4">Aucune Formation Accessible</h2>
            <p className="text-gray-600 mb-8">
              Vous n'avez actuellement accès à aucune formation.
            </p>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-12"
              onClick={() => window.location.href = '/formations'}
            >
              Découvrir nos formations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryInfo = categoryLabels[category] || {
    title: 'Formations',
    subtitle: '',
    color: 'blue'
  };

  console.log('✅ AFFICHAGE: Page formations avec', filteredVideos.length, 'vidéos');

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      
      {/* VIDÉO ONBOARDING - DÉSACTIVÉ TEMPORAIREMENT */}
      {/* <OnboardingVideo pageSlug="formations" role="CLIENT" /> */}

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-4">{categoryInfo.title}</h2>
        <p className="text-gray-600 leading-relaxed">{categoryInfo.subtitle}</p>
      </div>

      {/* Badge accès débloqué */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <BookOpen className="text-white" size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-green-800 text-lg">Formation débloquée ✓</p>
            <p className="text-sm text-green-700">Accès complet à tous les modules</p>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Rechercher un module..." 
          className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 ring-amber-500/20 border-gray-200 outline-none transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Liste des vidéos (style Tutos Pratiques) */}
      <div className="grid gap-4">
        {filteredVideos.map((video) => (
          <Card 
            key={video.id} 
            className={`overflow-hidden transition-all duration-300 ${
              expandedVideo === video.id 
                ? "ring-2 ring-amber-500 shadow-lg" 
                : "hover:border-amber-200 shadow-sm"
            }`}
          >
            <CardContent className="p-0">
              {expandedVideo === video.id ? (
                /* Vue déployée */
                <div className="animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                        {video.category}
                      </span>
                      <h3 className="font-bold text-gray-900">{video.title}</h3>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setExpandedVideo(null)}
                    >
                      Fermer
                    </Button>
                  </div>
                  
                  <div className="aspect-video w-full bg-black">
                    {video.loom_id ? (
                      <iframe 
                        src={`https://www.loom.com/embed/${video.loom_id}`}
                        frameBorder="0" 
                        allowFullScreen 
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                        <Video size={48} className="mb-2 opacity-20" />
                        <p>Contenu en cours de téléchargement...</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <p className="text-gray-600 mb-6 leading-relaxed">{video.description}</p>
                    
                    {video.templates && video.templates.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                          <Download size={14} /> Documents & Templates
                        </h4>
                        <div className="space-y-2">
                          {video.templates.map((template) => (
                            <a 
                              key={template.id}
                              href={template.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white border-gray-200 hover:border-amber-500 hover:text-amber-600 shadow-sm text-sm transition-all"
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              {template.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Vue compacte */
                <div 
                  onClick={() => setExpandedVideo(video.id)} 
                  className="p-4 cursor-pointer flex items-center gap-4 group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    video.loom_id 
                      ? "bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white" 
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    <Play size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">
                        {video.category}
                      </span>
                      {video.is_new && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-black">
                          New
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      <Clock size={12} /> {video.duration}
                      {video.templates && video.templates.length > 0 && (
                        <> • {video.templates.length} document{video.templates.length > 1 ? 's' : ''} inclus</>
                      )}
                    </p>
                  </div>
                  <ArrowRight 
                    size={18} 
                    className="text-gray-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVideos.length === 0 && searchQuery && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              Aucune formation ne correspond à "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}