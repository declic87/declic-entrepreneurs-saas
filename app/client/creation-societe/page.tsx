'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, ExternalLink, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Solution {
  id: string;
  name: string;
  slug: string;
  description: string;
  badge: string;
  badge_color: string;
  icon: string;
  price: string;
  loom_video_url: string;
  cta_text: string;
  cta_link: string;
  is_external: boolean;
  card_color: string;
  order_index: number;
  features: { feature_text: string }[];
}

export default function CreationSocietePage() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadSolutions();
  }, []);

  async function loadSolutions() {
    try {
      const { data: sols } = await supabase
        .from('creation_solutions')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (sols) {
        const enriched = await Promise.all(
          sols.map(async (sol) => {
            const { data: features } = await supabase
              .from('creation_solution_features')
              .select('feature_text')
              .eq('solution_id', sol.id)
              .order('order_index');

            return { ...sol, features: features || [] };
          })
        );
        setSolutions(enriched);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  function getLoomEmbedUrl(url: string): string {
    if (!url) return '';
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://www.loom.com/embed/${match[1]}`;
    }
    return url;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4">
            🏢 Créer votre société
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choisissez la solution qui correspond le mieux à vos besoins et votre niveau d'autonomie
          </p>
        </div>

        {/* Grille des solutions */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {solutions.map((solution) => (
            <Card
              key={solution.id}
              className={`border-2 ${solution.card_color} hover:shadow-xl transition-all relative overflow-hidden`}
            >
              {/* Badge */}
              {solution.badge && (
                <div className="absolute top-4 right-4">
                  <Badge className={`${solution.badge_color} text-white`}>
                    {solution.badge}
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="text-5xl mb-4">{solution.icon}</div>
                <CardTitle className="text-2xl">{solution.name}</CardTitle>
                <p className="text-sm text-slate-600 mt-2">
                  {solution.description}
                </p>
                <p className="text-lg font-bold text-slate-900 mt-3">
                  {solution.price}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <ul className="space-y-2">
                  {solution.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                      <span className="text-slate-700">{feature.feature_text}</span>
                    </li>
                  ))}
                </ul>

                {/* Bouton vidéo */}
                {solution.loom_video_url && (
                  <Button
                    variant="outline"
                    onClick={() => setShowVideoModal(solution.id)}
                    className="w-full"
                  >
                    <Play className="mr-2" size={16} />
                    Voir la vidéo explicative
                  </Button>
                )}

                {/* CTA principal */}
                {solution.slug === 'declic' ? (
                  <Link href="/client/creation-societe/declic">
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                      {solution.cta_text}
                      <ArrowRight className="ml-2" size={16} />
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/client/creation-societe/${solution.slug}`}>
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                      {solution.cta_text}
                      <ArrowRight className="ml-2" size={16} />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info supplémentaire */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6 text-center">
          <p className="text-slate-700">
            <strong>💡 Besoin d'aide pour choisir ?</strong> Contactez votre expert Déclic qui vous guidera vers la meilleure solution.
          </p>
        </div>
      </div>

      {/* Modal vidéo */}
      {showVideoModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVideoModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg">
                {solutions.find(s => s.id === showVideoModal)?.name}
              </h3>
              <button
                onClick={() => setShowVideoModal(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {(() => {
                const solution = solutions.find(s => s.id === showVideoModal);
                if (!solution?.loom_video_url) return null;

                return (
                  <iframe
                    src={getLoomEmbedUrl(solution.loom_video_url)}
                    frameBorder="0"
                    allowFullScreen
                    className="w-full h-full"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}