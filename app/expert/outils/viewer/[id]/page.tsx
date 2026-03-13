'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function ToolViewerPage() {
  const params = useParams();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadTool();
  }, [params.id]);

  async function loadTool() {
    try {
      // Récupérer l'outil
      const { data: tool } = await supabase
        .from('expert_tools')
        .select('*')
        .eq('id', params.id)
        .single();

      if (!tool) {
        setError('Document non trouvé');
        return;
      }

      // Charger le contenu HTML
      const response = await fetch(tool.file_url);
      const html = await response.text();
      setHtmlContent(html);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-2">Erreur</p>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Document HTML"
      />
    </div>
  );
}