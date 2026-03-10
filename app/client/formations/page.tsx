'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Play, Clock, Lock, Download, ChevronDown, ChevronRight,
  CheckCircle2, Video, Loader2, PlayCircle
} from 'lucide-react';

interface FormationVideo {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  loom_id: string;
  is_new: boolean;
  module_number: number;
  module_title: string;
  order_in_module: number;
}

interface Module {
  number: number;
  title: string;
  videos: FormationVideo[];
  totalDuration: string;
  isOpen: boolean;
}

export default function ClientFormationsPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadFormations();
    loadViewedVideos();
  }, []);

  async function loadFormations() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/client/formations', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      const data = await response.json();
      
      if (data.success && data.formations.length > 0) {
        setCategory(data.category);
        
        // Grouper par modules
        const groupedModules = groupByModules(data.formations);
        setModules(groupedModules);
      }
    } catch (error) {
      console.error('Erreur chargement formations:', error);
    } finally {
      setLoading(false);
    }
  }

  function groupByModules(videos: FormationVideo[]): Module[] {
    const moduleMap = new Map<number, Module>();

    videos.forEach(video => {
      const moduleNumber = video.module_number || 999;
      const moduleTitle = video.module_title || 'Autres vidéos';

      if (!moduleMap.has(moduleNumber)) {
        moduleMap.set(moduleNumber, {
          number: moduleNumber,
          title: moduleTitle,
          videos: [],
          totalDuration: '',
          isOpen: moduleNumber === 1 // Premier module ouvert par défaut
        });
      }

      moduleMap.get(moduleNumber)!.videos.push(video);
    });

    // Trier les vidéos dans chaque module
    moduleMap.forEach(module => {
      module.videos.sort((a, b) => 
        (a.order_in_module || 0) - (b.order_in_module || 0)
      );
      
      // Calculer la durée totale du module
      module.totalDuration = calculateTotalDuration(module.videos);
    });

    return Array.from(moduleMap.values()).sort((a, b) => a.number - b.number);
  }

  function calculateTotalDuration(videos: FormationVideo[]): string {
    let totalMinutes = 0;
    videos.forEach(video => {
      const match = video.duration?.match(/(\d+)/);
      if (match) totalMinutes += parseInt(match[1]);
    });
    
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}h${mins > 0 ? mins + 'min' : ''}`;
    }
    return `${totalMinutes} min`;
  }

  function loadViewedVideos() {
    const saved = localStorage.getItem('viewed_videos');
    if (saved) {
      setViewedVideos(new Set(JSON.parse(saved)));
    }
  }

  function markAsViewed(videoId: string) {
    const updated = new Set(viewedVideos);
    updated.add(videoId);
    setViewedVideos(updated);
    localStorage.setItem('viewed_videos', JSON.stringify(Array.from(updated)));
  }

  function toggleModule(moduleNumber: number) {
    setModules(prev => prev.map(m => 
      m.number === moduleNumber ? { ...m, isOpen: !m.isOpen } : m
    ));
  }

  const categoryLabels: Record<string, { title: string; subtitle: string; emoji: string }> = {
    'Créateur': {
      title: 'Formation Créateur',
      subtitle: 'De 0 à 30k€ : Choix du statut, fiscalité, création pas-à-pas',
      emoji: '🚀'
    },
    'Agent Immo': {
      title: 'Formation Agent Immobilier',
      subtitle: 'Optimisation mandataires : IK maximisées, frais réels, cas pratiques',
      emoji: '🏠'
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  if (!category || modules.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-12 text-center">
            <Lock className="mx-auto text-amber-500 mb-6" size={64} />
            <h2 className="text-3xl font-black text-gray-900 mb-4">Aucune Formation Accessible</h2>
            <p className="text-gray-600 mb-8">
              Vous n'avez actuellement accès à aucune formation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryInfo = categoryLabels[category] || {
    title: 'Formations',
    subtitle: '',
    emoji: '🎓'
  };

  const totalVideos = modules.reduce((acc, m) => acc + m.videos.length, 0);
  const viewedCount = modules.reduce((acc, m) => 
    acc + m.videos.filter(v => viewedVideos.has(v.id)).length, 0
  );
  const progressPercent = totalVideos > 0 ? Math.round((viewedCount / totalVideos) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-5xl">{categoryInfo.emoji}</span>
          <div>
            <h1 className="text-3xl font-black">{categoryInfo.title}</h1>
            <p className="text-amber-100 mt-1">{categoryInfo.subtitle}</p>
          </div>
        </div>
        
        {/* Progression */}
        <div className="mt-6 bg-white/20 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="font-semibold">{viewedCount}/{totalVideos} vidéos visionnées</span>
          <span className="font-bold">{progressPercent}%</span>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {modules.map((module) => {
          const moduleViewedCount = module.videos.filter(v => viewedVideos.has(v.id)).length;
          const moduleProgress = module.videos.length > 0 
            ? Math.round((moduleViewedCount / module.videos.length) * 100) 
            : 0;

          return (
            <Card key={module.number} className="overflow-hidden border-2 hover:border-amber-300 transition-all">
              
              {/* En-tête du module */}
              <div 
                onClick={() => toggleModule(module.number)}
                className="flex items-center justify-between p-5 cursor-pointer bg-gradient-to-r from-slate-50 to-white hover:from-amber-50 hover:to-orange-50 transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-lg">
                    {module.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                      {module.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <PlayCircle size={14} />
                        {module.videos.length} vidéo{module.videos.length > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {module.totalDuration}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={14} className={moduleViewedCount === module.videos.length ? 'text-green-500' : ''} />
                        {moduleViewedCount}/{module.videos.length}
                      </span>
                    </div>
                  </div>
                </div>
                
                {module.isOpen ? (
                  <ChevronDown className="text-gray-400" size={24} />
                ) : (
                  <ChevronRight className="text-gray-400" size={24} />
                )}
              </div>

              {/* Barre de progression du module */}
              {moduleProgress > 0 && (
                <div className="h-1 bg-gray-100">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${moduleProgress}%` }}
                  />
                </div>
              )}

              {/* Liste des vidéos */}
              {module.isOpen && (
                <div className="divide-y divide-gray-100">
                  {module.videos.map((video, index) => {
                    const isViewed = viewedVideos.has(video.id);
                    const isExpanded = expandedVideo === video.id;

                    return (
                      <div key={video.id}>
                        {isExpanded ? (
                          /* Vue déployée avec lecteur */
                          <div className="bg-gray-50">
                            <div className="flex items-center justify-between p-4 border-b">
                              <div className="flex items-center gap-3">
                                {isViewed && <CheckCircle2 className="text-green-500" size={20} />}
                                <span className="font-bold text-gray-900">{video.title}</span>
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
                                  onLoad={() => markAsViewed(video.id)}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                  <Video size={48} className="mb-2 opacity-20" />
                                  <p>Vidéo en cours d'ajout...</p>
                                </div>
                              )}
                            </div>

                            {video.description && (
                              <div className="p-6">
                                <p className="text-gray-700 leading-relaxed">{video.description}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Vue compacte */
                          <div 
                            onClick={() => setExpandedVideo(video.id)}
                            className="flex items-center gap-4 p-4 cursor-pointer hover:bg-amber-50 transition-all group"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold group-hover:bg-amber-500 group-hover:text-white transition-all">
                                {index + 1}
                              </div>
                              
                              {isViewed ? (
                                <CheckCircle2 className="text-green-500" size={20} />
                              ) : (
                                <Play className="text-amber-500" size={20} />
                              )}
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                                    {video.title}
                                  </h4>
                                  {video.is_new && (
                                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Clock size={12} />
                                  {video.duration}
                                </p>
                              </div>
                            </div>
                            
                            <Play className="text-gray-300 group-hover:text-amber-500 transition-all" size={20} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Message de félicitations si toutes les vidéos sont vues */}
      {viewedCount === totalVideos && totalVideos > 0 && (
        <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Félicitations !</h3>
            <p className="text-gray-600">
              Vous avez terminé toutes les vidéos de cette formation !
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}