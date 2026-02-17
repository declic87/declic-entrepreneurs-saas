"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Video, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface OnboardingVideoProps {
  pageSlug: string; // 'dashboard', 'creation-societe', 'mon-dossier', etc.
}

interface VideoData {
  video_url: string;
  video_type: string; // 'loom', 'fathom', 'youtube'
  title: string;
  description?: string;
}

export function OnboardingVideo({ pageSlug }: OnboardingVideoProps) {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideo();
  }, [pageSlug]);

  async function loadVideo() {
    try {
      const { data, error } = await supabase
        .from('onboarding_videos_client')
        .select('video_url, video_type, title, description')
        .eq('page_slug', pageSlug)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        setVideoData(data);
      }
    } catch (err) {
      console.error('Erreur chargement vidéo:', err);
    } finally {
      setLoading(false);
    }
  }

  // Extraire l'ID Loom de l'URL
  function getLoomEmbedUrl(url: string): string {
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://www.loom.com/embed/${match[1]}`;
    }
    return url;
  }

  // Extraire l'ID Fathom de l'URL
  function getFathomEmbedUrl(url: string): string {
    if (url.includes('/embed/')) return url;
    
    const match = url.match(/fathom\.video\/share\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://fathom.video/embed/${match[1]}`;
    }
    return url;
  }

  // Extraire l'ID YouTube de l'URL
  function getYouTubeEmbedUrl(url: string): string {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  }

  if (loading || !videoData || !videoData.video_url) return null;

  return (
    <div className="mb-6">
      {/* Bannière vidéo */}
      <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <Video className="h-5 w-5 text-purple-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">
                🎥 {videoData.title}
              </h3>
              {videoData.description && (
                <p className="text-sm text-slate-600">
                  {videoData.description}
                </p>
              )}
            </div>
            <Button
              onClick={() => window.open(videoData.video_url, '_blank')}
              variant="outline"
              className="ml-4 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Play className="mr-2 h-4 w-4" />
              Regarder la vidéo
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}