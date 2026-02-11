"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Upload, FileText, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CompanyDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  status: string;
  rejection_reason?: string;
}

const REQUIRED_DOCUMENTS = [
  { 
    type: "piece_identite", 
    label: "Pièce d'identité", 
    description: "CNI, Passeport ou Titre de séjour" 
  },
  { 
    type: "justificatif_domicile", 
    label: "Justificatif de domicile", 
    description: "Moins de 3 mois (facture, quittance...)" 
  },
  { 
    type: "attestation_depot_capital", 
    label: "Attestation dépôt capital", 
    description: "Attestation de la banque" 
  },
];

export default function DocumentUploadPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndDocuments();
  }, []);

  async function loadUserAndDocuments() {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError("Vous devez être connecté");
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (userError || !userData) {
        setError("Utilisateur introuvable");
        return;
      }

      setUserId(userData.id);

      const { data: docs, error: docsError } = await supabase
        .from("company_documents")
        .select("*")
        .eq("user_id", userData.id)
        .eq("source", "upload")
        .order("uploaded_at", { ascending: false });

      if (docsError) {
        console.error("Erreur chargement documents:", docsError);
        setError("Erreur lors du chargement des documents");
        return;
      }

      setDocuments(docs || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(documentType: string, file: File) {
    if (!userId) {
      alert("Erreur : utilisateur non identifié");
      return;
    }

    setUploading(documentType);
    setError(null);

    try {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("Le fichier ne doit pas dépasser 10MB");
      }

      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error("Format non autorisé. Utilisez PDF, JPG ou PNG");
      }

      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${documentType}_${timestamp}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      console.log("📤 Upload vers company-documents:", filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("❌ Erreur upload:", uploadError);
        throw new Error(`Erreur d'upload: ${uploadError.message}`);
      }

      console.log("✅ Fichier uploadé:", uploadData);

      const { data: dbData, error: dbError } = await supabase
        .from("company_documents")
        .insert({
          user_id: userId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending',
          source: 'upload',
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error("❌ Erreur DB:", dbError);
        await supabase.storage.from('company-documents').remove([filePath]);
        throw new Error("Erreur lors de l'enregistrement en base");
      }

      console.log("✅ Document enregistré en DB:", dbData);

      await loadUserAndDocuments();

      alert(`✅ Document "${file.name}" uploadé avec succès !`);
    } catch (err: any) {
      console.error("❌ Erreur upload:", err);
      setError(err.message || "Erreur lors de l'upload");
      alert(`❌ ${err.message}`);
    } finally {
      setUploading(null);
    }
  }

  async function handleDeleteDocument(doc: CompanyDocument) {
    if (!confirm(`Supprimer ${doc.file_name} ?`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('company-documents')
        .remove([doc.file_path]);

      if (storageError) {
        console.error("Erreur suppression storage:", storageError);
      }

      const { error: dbError } = await supabase
        .from("company_documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) {
        throw new Error("Erreur lors de la suppression");
      }

      await loadUserAndDocuments();
      alert("✅ Document supprimé");
    } catch (err: any) {
      console.error("Erreur suppression:", err);
      alert(`❌ ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <span className="ml-3 text-lg">Chargement...</span>
      </div>
    );
  }

  const uploadedDocs = documents.reduce((acc, doc) => {
    acc[doc.document_type] = doc;
    return acc;
  }, {} as Record<string, CompanyDocument>);

  const requiredDocsCount = REQUIRED_DOCUMENTS.length;
  const uploadedRequiredCount = REQUIRED_DOCUMENTS.filter(
    d => uploadedDocs[d.type]
  ).length;
  const approvedRequiredCount = REQUIRED_DOCUMENTS.filter(
    d => uploadedDocs[d.type]?.status === 'approved'
  ).length;

  const allRequiredUploaded = uploadedRequiredCount === requiredDocsCount;
  const allRequiredApproved = approvedRequiredCount === requiredDocsCount;

  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
            <FileText className="text-amber-500" size={28} />
            Upload de vos documents
          </CardTitle>
          <p className="text-slate-600 mt-2">
            Uploadez les 3 documents nécessaires pour valider votre dossier
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  Documents requis : {uploadedRequiredCount}/{requiredDocsCount} uploadés
                </p>
                <p className="text-sm text-slate-600">
                  Documents validés : {approvedRequiredCount}/{requiredDocsCount}
                </p>
              </div>
              {allRequiredApproved ? (
                <CheckCircle2 className="text-green-500" size={32} />
              ) : allRequiredUploaded ? (
                <AlertCircle className="text-amber-500" size={32} />
              ) : (
                <Upload className="text-slate-400" size={32} />
              )}
            </div>
            <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(uploadedRequiredCount / requiredDocsCount) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle size={18} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {REQUIRED_DOCUMENTS.map((docType) => {
          const doc = uploadedDocs[docType.type];
          const isUploading = uploading === docType.type;

          return (
            <Card key={docType.type} className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-slate-900">{docType.label}</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{docType.description}</p>

                    {doc ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-slate-400" />
                          <span className="text-sm text-slate-700">{doc.file_name}</span>
                        </div>
                        
                        {doc.status === 'approved' ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 size={16} />
                            <span className="text-sm font-medium">Document validé</span>
                          </div>
                        ) : doc.status === 'rejected' ? (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle size={16} />
                            <span className="text-sm">{doc.rejection_reason || "Document rejeté"}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle size={16} />
                            <span className="text-sm">En attente de validation</span>
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDocument(doc)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={doc.status === 'approved'}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Aucun document uploadé</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <label className="block">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        disabled={isUploading || (doc?.status === 'approved')}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(docType.type, file);
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        disabled={isUploading || (doc?.status === 'approved')}
                        className={`
                          ${doc?.status === 'approved'
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-amber-500 hover:bg-amber-600'
                          } text-white
                        `}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Upload...
                          </>
                        ) : doc?.status === 'approved' ? (
                          <>
                            <CheckCircle2 className="mr-2" size={16} />
                            Validé
                          </>
                        ) : doc ? (
                          <>
                            <Upload className="mr-2" size={16} />
                            Remplacer
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2" size={16} />
                            Uploader
                          </>
                        )}
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allRequiredUploaded && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertCircle className="text-amber-600" size={18} />
          <AlertDescription className="text-amber-800">
            {allRequiredApproved
              ? "✅ Tous vos documents sont validés ! Vous pouvez passer à l'étape suivante."
              : "📋 Vos documents sont en cours de validation par notre équipe. Vous serez notifié dès que la validation sera terminée."
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}