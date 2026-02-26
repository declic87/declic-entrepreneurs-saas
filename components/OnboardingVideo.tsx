"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Video, Play, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface OnboardingVideoProps {
  pageSlug: string;
  role?: 'CLIENT' | 'ADMIN' | 'HOS' | 'CLOSER' | 'SETTER' | 'EXPERT';
}

interface VideoData {
  id: string;
  page_slug: string;
  video_url: string;
  video_type: string;
  title: string;
  description: string;
  is_active: boolean;
}

export function OnboardingVideo({ pageSlug, role = 'CLIENT' }: OnboardingVideoProps) {
  const [video, setVideo] = useState<VideoData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideo();
    checkIfWatched();
  }, [pageSlug, role]);

  async function loadVideo() {
    try {
      // ✅ Charger depuis la bonne table selon le rôle
      const tableName = role === 'CLIENT' ? 'onboarding_videos_client' : 'onboarding_videos';
      
      const { data } = await supabase
        .from(tableName)
        .select('*')
        .eq('page_slug', pageSlug)
        .eq('is_active', true)
        .single();

      setVideo(data || null);
    } catch (err) {
      console.error('Erreur chargement vidéo:', err);
    } finally {
      setLoading(false);
    }
  }

  function checkIfWatched() {
    const key = `onboarding_watched_${role}_${pageSlug}`;
    const watched = localStorage.getItem(key);
    setHasWatched(!!watched);
  }

  function markAsWatched() {
    const key = `onboarding_watched_${role}_${pageSlug}`;
    localStorage.setItem(key, 'true');
    setHasWatched(true);
    setShowModal(false);
  }

  // ✅ Extraire l'ID Loom de l'URL complète
  function extractLoomId(url: string): string {
    if (!url) return '';
    
    // Si c'est déjà un ID (pas d'URL), retourner tel quel
    if (!url.includes('http') && !url.includes('/')) {
      return url;
    }
    
    // Extraire l'ID depuis l'URL Loom
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    return match ? match[1] : url;
  }

  if (loading || !video) return null;

  const loomId = extractLoomId(video.video_url);

  return (
    <>
      <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 mb-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              {hasWatched ? (
                <CheckCircle2 className="text-green-600" size={20} />
              ) : (
                <Video className="text-purple-600" size={20} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                🎥 {video.title}
              </h3>
              <p className="text-sm text-slate-600">
                {video.description}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            variant="outline"
            className="ml-4 border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Play className="mr-2 h-4 w-4" />
            {hasWatched ? 'Revoir' : 'Voir la vidéo'}
          </Button>
        </div>
      </Alert>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{video.title}</h2>
                <p className="text-sm text-gray-600">{video.description}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
              {video.video_type === 'loom' && loomId && (
                <iframe
                  src={`https://www.loom.com/embed/${loomId}?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`}
                  frameBorder="0"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              )}
              {video.video_type === 'fathom' && video.video_url && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-slate-900">
                  <Button
                    onClick={() => window.open(video.video_url, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="mr-2" size={20} />
                    Ouvrir la vidéo Fathom
                  </Button>
                </div>
              )}
              {video.video_type === 'youtube' && loomId && (
                <iframe
                  src={`https://www.youtube.com/embed/${loomId}`}
                  frameBorder="0"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end items-center">
              <Button
                onClick={markAsWatched}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2" size={20} />
                Marquer comme vue
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}