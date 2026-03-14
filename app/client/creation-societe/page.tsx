'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ShinePage() {
  const [solution, setSolution] = useState<any>(null);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: sol } = await supabase
      .from('creation_solutions')
      .select('*')
      .eq('slug', 'shine')
      .single();

    if (sol) {
      setSolution(sol);

      const { data: bnf } = await supabase
        .from('creation_solution_benefits')
        .select('*')
        .eq('solution_id', sol.id)
        .order('order_index');

      setBenefits(bnf || []);
    }
    setLoading(false);
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
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/client/creation-societe">
          <Button variant="outline">
            <ArrowLeft className="mr-2" size={16} />
            Retour aux options
          </Button>
        </Link>

        <div className="text-center">
          <div className="text-6xl mb-4">{solution?.icon}</div>
          <h1 className="text-4xl font-black text-slate-900 mb-4">
            {solution?.name}
          </h1>
          <p className="text-lg text-slate-600">
            {solution?.description}
          </p>
        </div>

        {/* Vidéo */}
        {solution?.loom_video_url && (
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getLoomEmbedUrl(solution.loom_video_url)}
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Avantages partenaire */}
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">
              🎁 Avantages exclusifs via notre lien
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit.id} className="flex items-start gap-3">
                  <CheckCircle className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                  <span className="text-lg text-blue-900">{benefit.benefit_text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="border-2 border-blue-500">
          <CardContent className="p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold text-slate-900">
              Prêt à créer votre société avec Shine ?
            </h3>
            <p className="text-slate-600">
              Cliquez ci-dessous pour profiter de nos avantages partenaires
            </p>
            <a href={solution?.cta_link} target="_blank" rel="noopener noreferrer">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6">
                {solution?.cta_text}
                <ExternalLink className="ml-2" size={20} />
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}