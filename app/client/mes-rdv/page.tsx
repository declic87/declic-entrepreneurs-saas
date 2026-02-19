'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Calendar, Video, FileText, Download, Play } from 'lucide-react';

interface RDVRecording {
  id: string;
  rdv_id: string;
  video_url: string;
  pdf_report_url: string;
  summary: string;
  action_items: string[];
  duration: number;
  recorded_at: string;
  rdv: {
    scheduled_at: string;
    expert: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function ClientMesRDVPage() {
  const [recordings, setRecordings] = useState<RDVRecording[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadRecordings();
  }, []);

  async function loadRecordings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('rdv_recordings')
      .select(`
        *,
        rdv:rdv_id (
          scheduled_at,
          expert:expert_id (
            first_name,
            last_name
          )
        )
      `)
      .eq('client_id', user.id)
      .order('recorded_at', { ascending: false });

    if (data) {
      setRecordings(data as any);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Mes Rendez-vous</h1>
          <p className="text-gray-600 mt-2">Accédez à vos enregistrements et comptes-rendus</p>
        </div>

        {/* Liste des enregistrements */}
        {recordings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 font-medium">Aucun rendez-vous enregistré pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {recordings.map((recording) => (
              <div key={recording.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-6">
                  {/* Thumbnail vidéo */}
                  <div className="relative w-64 h-36 bg-gray-900 rounded-lg flex-shrink-0 overflow-hidden group cursor-pointer">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="text-white opacity-80 group-hover:opacity-100 transition-opacity" size={48} />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {Math.floor(recording.duration / 60)}:{String(recording.duration % 60).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          RDV Expert - {new Date(recording.rdv.scheduled_at).toLocaleDateString('fr-FR')}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          Avec {recording.rdv.expert.first_name} {recording.rdv.expert.last_name}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                        Enregistré
                      </span>
                    </div>

                    {/* Résumé */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-blue-900 mb-2">📝 Résumé</h4>
                      <p className="text-blue-800 text-sm">{recording.summary}</p>
                    </div>

                    {/* Actions à faire */}
                    {recording.action_items && recording.action_items.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                        <h4 className="font-bold text-orange-900 mb-2">✅ Actions à effectuer</h4>
                        <ul className="space-y-1">
                          {recording.action_items.map((item, i) => (
                            <li key={i} className="text-orange-800 text-sm flex items-start gap-2">
                              <span className="font-bold">{i + 1}.</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Boutons */}
                    <div className="flex gap-3">
                      <a
                        href={recording.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <Video size={18} />
                        Voir la vidéo
                      </a>
                      {recording.pdf_report_url && (
                        <a
                          href={recording.pdf_report_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <FileText size={18} />
                          Compte-rendu PDF
                        </a>
                      )}
                      <button className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
                        <Download size={18} />
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}