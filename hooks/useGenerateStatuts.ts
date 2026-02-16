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
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Non authentifié');
      }

      console.log('Session trouvée, appel direct avec fetch...');

      // Appel DIRECT avec fetch au lieu du SDK Supabase
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-statuts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          },
          body: JSON.stringify({ company_id: companyId })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', response.status, errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Document généré:', data);

      // Télécharger le document
      if (data?.url) {
        const link = document.createElement('a');
        link.href = data.url;
        link.download = data.fileName || 'statuts.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

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