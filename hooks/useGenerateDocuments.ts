// hooks/useGenerateDocuments.ts
import { useState } from 'react';

export function useGenerateDocuments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDocuments = async (companyId: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Génération de tous les documents...');

      const response = await fetch('/api/generate-documents', {
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
      console.log('Documents générés:', data);

      return data;
    } catch (err: any) {
      console.error('Error generating documents:', err);
      setError(err.message || 'Erreur lors de la génération des documents');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateDocuments, loading, error };
}