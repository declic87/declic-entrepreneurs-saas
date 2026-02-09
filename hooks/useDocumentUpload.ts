"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function useDocumentUpload(userId: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function uploadDocument(
    file: File,
    documentType: "piece_identite" | "justificatif_domicile" | "attestation_depot_capital"
  ) {
    setUploading(true);
    setProgress(0);

    try {
      // 1. Vérifier le type de fichier (PDF uniquement)
      if (file.type !== "application/pdf") {
        throw new Error("Seuls les fichiers PDF sont acceptés");
      }

      // 2. Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Le fichier ne doit pas dépasser 10MB");
      }

      // 3. Upload vers Supabase Storage
      const fileName = `${userId}/${documentType}_${Date.now()}.pdf`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("company-documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(50);

      // 4. Enregistrer dans la base de données
      const { data: docData, error: docError } = await supabase
        .from("company_documents")
        .insert({
          user_id: userId,
          document_type: documentType,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          source: "upload",
          status: "pending",
        })
        .select()
        .single();

      if (docError) throw docError;

      setProgress(100);
      setUploading(false);

      return { success: true, document: docData };
    } catch (error: any) {
      setUploading(false);
      return { success: false, error: error.message };
    }
  }

  async function deleteDocument(documentId: string, filePath: string) {
    try {
      // 1. Supprimer de Storage
      const { error: storageError } = await supabase.storage
        .from("company-documents")
        .remove([filePath]);

      if (storageError) throw storageError;

      // 2. Supprimer de la BDD
      const { error: dbError } = await supabase
        .from("company_documents")
        .delete()
        .eq("id", documentId);

      if (dbError) throw dbError;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async function getDocumentUrl(filePath: string) {
    const { data } = await supabase.storage
      .from("company-documents")
      .createSignedUrl(filePath, 3600); // 1 heure

    return data?.signedUrl;
  }

  return {
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    uploading,
    progress,
  };
}