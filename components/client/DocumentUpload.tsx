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

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  validated: boolean;
  rejection_reason?: string;
}

// Types de documents requis
const REQUIRED_DOCUMENTS = [
  { type: "piece_identite", label: "Pièce d'identité", description: "CNI, Passeport ou Titre de séjour" },
  { type: "justificatif_domicile", label: "Justificatif de domicile", description: "Moins de 3 mois (facture, quittance...)" },
  { type: "kbis", label: "Extrait Kbis", description: "Si société existante (optionnel)", optional: true },
  { type: "statuts", label: "Projet de statuts", description: "Statuts signés ou projet", optional: true },
];

export default function DocumentUpload() {
  const [userId, setUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndDocuments();
  }, []);

  async function loadUserAndDocuments() {
    try {
      setLoading(true);
      
      // 1️⃣ Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError("Vous devez être connecté");
        return;
      }

      // 2️⃣ Récupérer l'ID user depuis la table users
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

      // 3️⃣ Charger les documents existants
      const { data: docs, error: docsError } = await supabase
        .from("client_documents")
        .select("*")
        .eq("user_id", userData.id)
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
      // 1️⃣ Valider le fichier
      const maxSize = 10 * 1024 * 1024; // 10MB
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

      // 2️⃣ Générer un nom de fichier unique
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${documentType}_${timestamp}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      console.log("📤 Upload vers:", filePath);

      // 3️⃣ Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("❌ Erreur upload:", uploadError);
        throw new Error(`Erreur d'upload: ${uploadError.message}`);
      }

      console.log("✅ Fichier uploadé:", uploadData);

      // 4️⃣ Enregistrer dans la base de données
      const { data: dbData, error: dbError } = await supabase
        .from("client_documents")
        .insert({
          user_id: userId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          validated: false
        })
        .select()
        .single();

      if (dbError) {
        console.error("❌ Erreur DB:", dbError);
        // Nettoyer le fichier uploadé si l'insertion DB échoue
        await supabase.storage.from('client-documents').remove([filePath]);
        throw new Error("Erreur lors de l'enregistrement en base");
      }

      console.log("✅ Document enregistré en DB:", dbData);

      // 5️⃣ Recharger les documents
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

  async function handleDeleteDocument(doc: Document) {
    if (!confirm(`Supprimer ${doc.file_name} ?`)) return;

    try {
      // 1️⃣ Supprimer du storage
      const { error: storageError } = await supabase.storage
        .from('client-documents')
        .remove([doc.file_path]);

      if (storageError) {
        console.error("Erreur suppression storage:", storageError);
      }

      // 2️⃣ Supprimer de la DB
      const { error: dbError } = await supabase
        .from("client_documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) {
        throw new Error("Erreur lors de la suppression");
      }

      // 3️⃣ Recharger
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
        <Loader2 className="animate-spin text-orange-500" size={40} />
        <span className="ml-3 text-lg">Chargement...</span>
      </div>
    );
  }

  const uploadedDocs = documents.reduce((acc, doc) => {
    acc[doc.document_type] = doc;
    return acc;
  }, {} as Record<string, Document>);

  const requiredDocsCount = REQUIRED_DOCUMENTS.filter(d => !d.optional).length;
  const uploadedRequiredCount = REQUIRED_DOCUMENTS.filter(
    d => !d.optional && uploadedDocs[d.type]
  ).length;
  const validatedRequiredCount = REQUIRED_DOCUMENTS.filter(
    d => !d.optional && uploadedDocs[d.type]?.validated
  ).length;

  const allRequiredUploaded = uploadedRequiredCount === requiredDocsCount;
  const allRequiredValidated = validatedRequiredCount === requiredDocsCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
            <FileText className="text-orange-500" size={28} />
            Étape 4 : Documents justificatifs
          </CardTitle>
          <p className="text-slate-600 mt-2">
            Uploadez les documents nécessaires pour valider votre dossier
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  Documents requis : {uploadedRequiredCount}/{requiredDocsCount} uploadés
                </p>
                <p className="text-sm text-slate-600">
                  Documents validés : {validatedRequiredCount}/{requiredDocsCount}
                </p>
              </div>
              {allRequiredValidated ? (
                <CheckCircle2 className="text-green-500" size={32} />
              ) : allRequiredUploaded ? (
                <AlertCircle className="text-orange-500" size={32} />
              ) : (
                <Upload className="text-slate-400" size={32} />
              )}
            </div>
            <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(uploadedRequiredCount / requiredDocsCount) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erreur globale */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle size={18} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liste des documents */}
      <div className="grid gap-4">
        {REQUIRED_DOCUMENTS.map((docType) => {
          const doc = uploadedDocs[docType.type];
          const isUploading = uploading === docType.type;

          return (
            <Card key={docType.type} className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Info document */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-slate-900">{docType.label}</h3>
                      {docType.optional && (
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                          Optionnel
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{docType.description}</p>

                    {/* État du document */}
                    {doc ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-slate-400" />
                          <span className="text-sm text-slate-700">{doc.file_name}</span>
                        </div>
                        
                        {doc.validated ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 size={16} />
                            <span className="text-sm font-medium">Document validé</span>
                          </div>
                        ) : doc.rejection_reason ? (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle size={16} />
                            <span className="text-sm">{doc.rejection_reason}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-orange-600">
                            <AlertCircle size={16} />
                            <span className="text-sm">En attente de validation</span>
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDocument(doc)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Supprimer
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Aucun document uploadé</p>
                    )}
                  </div>

                  {/* Bouton upload */}
                  <div className="flex-shrink-0">
                    <label className="block">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        disabled={isUploading || (doc?.validated ?? false)}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(docType.type, file);
                          }
                          e.target.value = ''; // Reset input
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        disabled={isUploading || (doc?.validated ?? false)}
                        className={`
                          ${doc?.validated 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-orange-500 hover:bg-orange-600'
                          } text-white
                        `}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Upload...
                          </>
                        ) : doc?.validated ? (
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

      {/* Message final */}
      {allRequiredUploaded && (
        <Alert className="border-orange-300 bg-orange-50">
          <AlertCircle className="text-orange-600" size={18} />
          <AlertDescription className="text-orange-800">
            {allRequiredValidated 
              ? "✅ Tous vos documents sont validés ! Vous pouvez passer à l'étape suivante."
              : "📋 Vos documents sont en cours de validation par notre équipe. Vous serez notifié dès que la validation sera terminée."
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}