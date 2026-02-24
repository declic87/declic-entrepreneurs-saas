'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createBrowserClient } from '@supabase/ssr';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface UploadPDFProps {
  onSuccess: (url: string) => void;
  onCancel: () => void;
}

export function UploadPDFTuto({ onSuccess, onCancel }: UploadPDFProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleUpload() {
    if (!file) {
      toast.error('Sélectionnez un fichier PDF');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload du fichier
      const fileExt = 'pdf';
      const fileName = `tutos/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('content-files')
        .getPublicUrl(fileName);

      toast.success('PDF uploadé avec succès !');
      onSuccess(publicUrl);
      
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast.error(error.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
        {!file ? (
          <label className="cursor-pointer block">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Upload className="mx-auto text-slate-400 mb-3" size={48} />
            <p className="text-sm text-slate-600 mb-1">
              Cliquez pour sélectionner un PDF
            </p>
            <p className="text-xs text-slate-500">
              Taille max : 50 MB
            </p>
          </label>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <FileText className="text-orange-500" size={32} />
            <div className="text-left">
              <p className="font-medium text-slate-900">{file.name}</p>
              <p className="text-sm text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex-1 bg-orange-500 hover:bg-orange-600"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={18} />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="mr-2" size={18} />
              Uploader le PDF
            </>
          )}
        </Button>

        <Button
          onClick={onCancel}
          variant="outline"
          disabled={uploading}
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}
