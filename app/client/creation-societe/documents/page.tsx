"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react";

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: string;
  uploaded_at: string;
}

const DOCUMENT_TYPES = [
  {
    type: "piece_identite",
    label: "Pièce d'identité",
    description: "CNI (recto-verso) ou Passeport",
    required: true,
  },
  {
    type: "justificatif_domicile",
    label: "Justificatif de domicile",
    description: "Moins de 3 mois ou avenant au bail",
    required: true,
  },
  {
    type: "attestation_depot_capital",
    label: "Attestation de dépôt de capital",
    description: "Fournie par votre banque",
    required: true,
  },
];

export default function DocumentsUploadPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { uploadDocument, deleteDocument, getDocumentUrl, uploading, progress } =
    useDocumentUpload(userId || "");

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadDocuments();
    }
  }, [userId]);

  async function fetchUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();
      if (userData) setUserId(userData.id);
    }
    setLoading(false);
  }

  async function loadDocuments() {
    const { data } = await supabase
      .from("company_documents")
      .select("*")
      .eq("user_id", userId)
      .eq("source", "upload")
      .order("uploaded_at", { ascending: false });

    setDocuments(data || []);
  }

  async function handleFileUpload(
    file: File,
    type: "piece_identite" | "justificatif_domicile" | "attestation_depot_capital"
  ) {
    const result = await uploadDocument(file, type);
    if (result.success) {
      await loadDocuments();
    } else {
      alert(`Erreur: ${result.error}`);
    }
  }

  async function handleDelete(docId: string, filePath: string) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      const result = await deleteDocument(docId, filePath);
      if (result.success) {
        await loadDocuments();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    }
  }

  async function handleView(filePath: string) {
    const url = await getDocumentUrl(filePath);
    if (url) {
      window.open(url, "_blank");
    }
  }

  function getDocumentByType(type: string) {
    return documents.find((d) => d.document_type === type);
  }

  const allDocumentsUploaded = DOCUMENT_TYPES.every((dt) =>
    getDocumentByType(dt.type)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#123055]">
          📄 Documents requis
        </h1>
        <p className="text-slate-600 mt-1">
          Uploadez vos documents au format PDF uniquement (max 10MB)
        </p>
      </div>

      {/* Progress */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-900">
              Progression
            </span>
            <span className="text-sm font-semibold text-blue-600">
              {documents.length} / {DOCUMENT_TYPES.length}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${(documents.length / DOCUMENT_TYPES.length) * 100}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <div className="space-y-4">
        {DOCUMENT_TYPES.map((docType) => {
          const existingDoc = getDocumentByType(docType.type);

          return (
            <Card key={docType.type} className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      existingDoc
                        ? "bg-green-100"
                        : "bg-slate-100"
                    }`}
                  >
                    {existingDoc ? (
                      <CheckCircle2 className="text-green-600" size={24} />
                    ) : (
                      <FileText className="text-slate-400" size={24} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900">
                        {docType.label}
                      </h3>
                      {docType.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-semibold">
                          Requis
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">
                      {docType.description}
                    </p>

                    {existingDoc ? (
                      /* Document uploadé */
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                          <p className="text-sm font-medium text-green-900">
                            {existingDoc.file_name}
                          </p>
                          <p className="text-xs text-green-600">
                            Uploadé le{" "}
                            {new Date(
                              existingDoc.uploaded_at
                            ).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(existingDoc.file_path)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDelete(existingDoc.id, existingDoc.file_path)
                          }
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      /* Upload button */
                      <div>
                        <input
                          type="file"
                          accept="application/pdf"
                          id={`upload-${docType.type}`}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                file,
                                docType.type as any
                              );
                            }
                          }}
                          disabled={uploading}
                        />
                        <label htmlFor={`upload-${docType.type}`}>
                          <Button
                            className="bg-amber-500 hover:bg-amber-600"
                            disabled={uploading}
                            asChild
                          >
                            <span>
                              {uploading ? (
                                <>
                                  <Loader2
                                    className="animate-spin mr-2"
                                    size={16}
                                  />
                                  Upload en cours... {progress}%
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2" size={16} />
                                  Uploader (PDF uniquement)
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next step */}
      {allDocumentsUploaded && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-600" size={32} />
              <div className="flex-1">
                <h3 className="font-bold text-green-900 text-lg">
                  Tous les documents sont uploadés !
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Notre équipe va vérifier vos documents et générer
                  automatiquement vos statuts et formulaire M0.
                </p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                Passer à l'étape suivante
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}