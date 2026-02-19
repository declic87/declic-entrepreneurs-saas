'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Video, Play, Clock, CheckCircle } from 'lucide-react';

interface OnboardingVideo {
  id: string;
  pole: string;
  title: string;
  loom_id: string;
  description: string;
  duration: string;
  order_index: number;
  active: boolean;
}

export default function ExpertOnboardingPage() {
  const [videos, setVideos] = useState<OnboardingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<OnboardingVideo | null>(null);
  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadVideos();
    loadWatchedVideos();
  }, []);

  async function loadVideos() {
    const { data, error } = await supabase
      .from('onboarding_videos')
      .select('*')
      .eq('pole', 'EXPERT')
      .eq('active', true)
      .order('order_index', { ascending: true });

    if (data) {
      setVideos(data);
      if (data.length > 0 && !selectedVideo) {
        setSelectedVideo(data[0]);
      }
    }
    setLoading(false);
  }

  function loadWatchedVideos() {
    const watched = localStorage.getItem('expert_watched_videos');
    if (watched) {
      setWatchedVideos(JSON.parse(watched));
    }
  }

  function markAsWatched(videoId: string) {
    const newWatched = [...watchedVideos, videoId];
    setWatchedVideos(newWatched);
    localStorage.setItem('expert_watched_videos', JSON.stringify(newWatched));
  }

  const progress = videos.length > 0 
    ? Math.round((watchedVideos.filter(id => videos.find(v => v.id === id)).length / videos.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Video className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune vidéo disponible</h2>
            <p className="text-gray-600">
              Les vidéos d'onboarding seront bientôt disponibles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Formation Expert</h1>
          <p className="text-gray-600 mt-2">Vidéos d'onboarding et de formation</p>
        </div>

        {/* Progression */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Votre progression</span>
            <span className="text-2xl font-bold text-orange-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {watchedVideos.filter(id => videos.find(v => v.id === id)).length} / {videos.length} vidéos visionnées
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Liste vidéos */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Vidéos ({videos.length})</h2>
            {videos.map((video, index) => {
              const isWatched = watchedVideos.includes(video.id);
              const isSelected = selectedVideo?.id === video.id;

              return (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isWatched 
                        ? 'bg-green-500' 
                        : isSelected 
                        ? 'bg-orange-500' 
                        : 'bg-gray-200'
                    }`}>
                      {isWatched ? (
                        <CheckCircle className="text-white" size={20} />
                      ) : (
                        <Play className={isSelected ? 'text-white' : 'text-gray-600'} size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                        {video.duration && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={12} />
                            {video.duration}
                          </span>
                        )}
                      </div>
                      <h3 className={`font-bold truncate ${
                        isSelected ? 'text-orange-700' : 'text-gray-900'
                      }`}>
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Lecteur vidéo */}
          <div className="lg:col-span-2">
            {selectedVideo ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedVideo.title}</h2>
                    {!watchedVideos.includes(selectedVideo.id) && (
                      <button
                        onClick={() => markAsWatched(selectedVideo.id)}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✓ Marquer comme vue
                      </button>
                    )}
                  </div>
                  {selectedVideo.description && (
                    <p className="text-gray-600">{selectedVideo.description}</p>
                  )}
                </div>
                
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.loom.com/embed/${selectedVideo.loom_id}`}
                    frameBorder="0"
                    allowFullScreen
                    className="w-full h-full"
                    title={selectedVideo.title}
                  />
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => {
                      const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
                      if (currentIndex > 0) {
                        setSelectedVideo(videos[currentIndex - 1]);
                      }
                    }}
                    disabled={videos.findIndex(v => v.id === selectedVideo.id) === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Vidéo précédente
                  </button>
                  <button
                    onClick={() => {
                      const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
                      if (currentIndex < videos.length - 1) {
                        setSelectedVideo(videos[currentIndex + 1]);
                      }
                    }}
                    disabled={videos.findIndex(v => v.id === selectedVideo.id) === videos.length - 1}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Vidéo suivante →
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Video className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500">Sélectionnez une vidéo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}