// components/DownloadStatutsButton.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useGenerateStatuts } from '@/hooks/useGenerateStatuts';
import { toast } from 'sonner';

interface DownloadStatutsButtonProps {
  companyId: string;
  companyName: string;
  disabled?: boolean;
}

export function DownloadStatutsButton({ companyId, companyName, disabled }: DownloadStatutsButtonProps) {
  const { generateStatuts, loading } = useGenerateStatuts();

  const handleDownload = async () => {
    try {
      await generateStatuts(companyId);
      toast.success('Statuts téléchargés avec succès !');
    } catch (error) {
      toast.error('Erreur lors du téléchargement des statuts');
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading || disabled}
      className="w-full"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Génération en cours...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Télécharger les statuts
        </>
      )}
    </Button>
  );
}