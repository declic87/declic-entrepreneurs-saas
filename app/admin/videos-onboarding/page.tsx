'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Video, Play } from 'lucide-react';
import LoomEmbed from '@/components/LoomEmbed';

interface OnboardingVideo {
  id: string;
  role: string;
  loom_url: string;
  title: string;
  description: string;
  created_at: string;
}

export default function OnboardingVideosPage() {
  const [role, setRole] = useState('expert');
  const [videos, setVideos] = useState<OnboardingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<OnboardingVideo | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadVideos();
  }, [role]);

  async function loadVideos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('onboarding_videos')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (data) {
      setVideos(data);
      if (data.length > 0 && !selectedVideo) {
        setSelectedVideo(data[0]);
      }
    }
    setLoading(false);
  }

  const roles = [
    { value: 'admin', label: 'Admin', emoji: '👑' },
    { value: 'hos', label: 'Head of Sales', emoji: '📊' },
    { value: 'closer', label: 'Closer', emoji: '💼' },
    { value: 'setter', label: 'Setter', emoji: '📞' },
    { value: 'expert', label: 'Expert', emoji: '🎓' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Vidéos d'Onboarding</h1>
          <p className="text-gray-600 mt-2">Formation par rôle</p>
        </div>

        {/* Sélection rôle */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {roles.map((r) => {
            const count = videos.filter(v => v.role === r.value).length;
            return (
              <button
                key={r.value}
                onClick={() => {
                  setRole(r.value);
                  setSelectedVideo(null);
                }}
                className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                  role === r.value
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {r.emoji} {r.label}
                {count > 0 && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    role === r.value ? 'bg-blue-500' : 'bg-gray-200'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Video className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 font-medium">
              Aucune vidéo d'onboarding pour ce rôle
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Liste vidéos */}
            <div className="lg:col-span-1 space-y-3">
              {videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedVideo?.id === video.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedVideo?.id === video.id ? 'bg-blue-500' : 'bg-gray-200'
                    }`}>
                      <Play className={selectedVideo?.id === video.id ? 'text-white' : 'text-gray-600'} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate ${
                        selectedVideo?.id === video.id ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {video.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Lecteur vidéo */}
            <div className="lg:col-span-2">
              {selectedVideo ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedVideo.title}</h2>
                    <p className="text-gray-600 mt-2">{selectedVideo.description}</p>
                  </div>
                  <LoomEmbed url={selectedVideo.loom_url} title={selectedVideo.title} />
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Video className="mx-auto text-gray-300 mb-4" size={64} />
                  <p className="text-gray-500">Sélectionnez une vidéo</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}