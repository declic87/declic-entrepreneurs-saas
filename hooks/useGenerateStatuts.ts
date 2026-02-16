// hooks/useGenerateStatuts.ts
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function useGenerateStatuts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStatuts = async (companyId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Utilise le client Supabase global avec les clés publiques
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-statuts', {
        body: { company_id: companyId }
      });

      if (functionError) throw functionError;

      // Download the document
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return data;
    } catch (err: any) {
      console.error('Error generating statuts:', err);
      setError(err.message || 'Erreur lors de la génération des statuts');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateStatuts, loading, error };
}