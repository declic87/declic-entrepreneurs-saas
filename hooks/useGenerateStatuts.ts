// hooks/useGenerateStatuts.ts
import { useState } from 'react';

export function useGenerateStatuts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStatuts = async (companyId: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Appel API Route Next.js...');

      // Appeler notre API Route au lieu de l'Edge Function directement
      const response = await fetch('/api/generate-statuts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company_id: companyId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération');
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