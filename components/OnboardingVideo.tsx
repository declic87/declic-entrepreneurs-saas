"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Video, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface OnboardingVideoProps {
  pageSlug: string; // 'dashboard', 'creation-societe', etc.
}

interface VideoData {
  video_url: string;
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
        .from('onboarding_videos')
        .select('video_url, title, description')
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

  if (loading || !videoData) return null;

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