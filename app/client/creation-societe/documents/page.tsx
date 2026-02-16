"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Upload, FileText, CheckCircle2, XCircle, Loader2, AlertCircle, FileSignature, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

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
  source: string; // 'upload' | 'generated' | 'signed'
  signed_at?: string;
}

interface SignatureRequest {
  id: string;
  status: string;
  signature_url: string;
  created_at: string;
  completed_at?: string;
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingDocs, setGeneratingDocs] = useState(false);
  const [signatureRequest, setSignatureRequest] = useState<SignatureRequest | null>(null);

  useEffect(() => {
    loadUserAndDocuments();
  }, []);

  useEffect(() => {
    if (documents.length > 0 && userId) {
      checkAndUpdateWorkflow();
    }
  }, [documents, userId]);

  async function loadUserAndDocuments() {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError("Vous devez être connecté");
        return;
      }

      setUserEmail(user.email || null);

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

      // Récupérer l'ID de la société
      const { data: companyData } = await supabase
        .from('company_creation_data')
        .select('id, step')
        .eq('user_id', userData.id)
        .single();

      if (companyData) {
        setCompanyId(companyData.id);
      }

      // Récupérer TOUS les documents (uploadés + générés + signés)
      const { data: docs, error: docsError } = await supabase
        .from("company_documents")
        .select("*")
        .eq("user_id", userData.id)
        .order("uploaded_at", { ascending: false });

      if (docsError) {
        console.error("Erreur chargement documents:", docsError);
      }

      setDocuments(docs || []);

      // Récupérer la demande de signature si elle existe
      if (companyData?.id) {
        const { data: sigReq } = await supabase
          .from('signature_requests')
          .select('*')
          .eq('company_id', companyData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (sigReq) {
          setSignatureRequest(sigReq);
        }
      }

    } catch (err) {
      console.error("Erreur:", err);
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function checkAndUpdateWorkflow() {
    if (!userId) return;

    const uploadedDocs = documents.filter(d => d.source === 'upload').reduce((acc, doc) => {
      acc[doc.document_type] = doc;
      return acc;
    }, {} as Record<string, CompanyDocument>);

    const allApproved = REQUIRED_DOCUMENTS.every(docType => {
      const doc = uploadedDocs[docType.type];
      return doc && doc.status === 'approved';
    });

    if (allApproved) {
      console.log("✅ Tous les documents validés");
    }
  }

  async function handleFileUpload(documentType: string, file: File) {
    if (!userId) {
      toast.error("Erreur : utilisateur non identifié");
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

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erreur d'upload: ${uploadError.message}`);
      }

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
        await supabase.storage.from('company-documents').remove([filePath]);
        throw new Error("Erreur lors de l'enregistrement en base");
      }

      await loadUserAndDocuments();
      toast.success(`Document "${file.name}" uploadé avec succès !`);
    } catch (err: any) {
      console.error("❌ Erreur upload:", err);
      setError(err.message || "Erreur lors de l'upload");
      toast.error(err.message);
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
      toast.success("Document supprimé");
    } catch (err: any) {
      console.error("Erreur suppression:", err);
      toast.error(err.message);
    }
  }

  // 🔥 FONCTION PRINCIPALE : GÉNÉRER + ENVOYER EN SIGNATURE
  async function handleGenerateAndSign() {
    if (!companyId || !userEmail) {
      toast.error("Informations manquantes");
      return;
    }

    setGeneratingDocs(true);

    try {
      console.log("🚀 Génération et envoi en signature...");

      const response = await fetch('/api/generate-and-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          user_email: userEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur de génération');
      }

      toast.success(`${data.documents_count} documents générés et envoyés en signature !`);

      // Ouvrir la page de signature dans un nouvel onglet
      if (data.signature_url) {
        window.open(data.signature_url, '_blank');
      }

      // Recharger les documents
      setTimeout(() => {
        loadUserAndDocuments();
      }, 2000);

    } catch (error: any) {
      console.error("❌ Erreur:", error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setGeneratingDocs(false);
    }
  }

  // Télécharger un document généré
  async function handleDownloadDocument(doc: CompanyDocument) {
    try {
      const { data, error } = await supabase.storage
        .from('company-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Document téléchargé : ${doc.file_name}`);
    } catch (error: any) {
      console.error("Erreur téléchargement:", error);
      toast.error("Erreur lors du téléchargement");
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

  const uploadedDocs = documents.filter(d => d.source === 'upload').reduce((acc, doc) => {
    acc[doc.document_type] = doc;
    return acc;
  }, {} as Record<string, CompanyDocument>);

  const generatedDocs = documents.filter(d => d.source === 'generated' || d.source === 'signed');
  const signedDocs = documents.filter(d => d.source === 'signed');

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
      {/* SECTION 1 : UPLOAD DES DOCUMENTS REQUIS */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
            <FileText className="text-amber-500" size={28} />
            Étape 1 : Upload de vos documents
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

      {/* LISTE DES DOCUMENTS À UPLOADER */}
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
                    <input
                      id={`file-input-${docType.type}`}
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
                      onClick={() => {
                        document.getElementById(`file-input-${docType.type}`)?.click();
                      }}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SECTION 2 : GÉNÉRATION + SIGNATURE */}
      {allRequiredApproved && (
        <>
          <Alert className="border-green-300 bg-green-50">
            <CheckCircle2 className="text-green-600" size={18} />
            <AlertDescription className="text-green-800">
              ✅ Tous vos documents sont validés ! Vous pouvez maintenant générer et signer vos documents légaux.
            </AlertDescription>
          </Alert>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                <FileSignature className="text-blue-500" size={28} />
                Étape 2 : Génération et signature électronique
              </CardTitle>
              <p className="text-slate-600 mt-2">
                Générez automatiquement TOUS vos documents légaux et signez-les électroniquement en quelques clics.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedDocs.length === 0 ? (
                <div className="bg-white rounded-lg p-6 border-2 border-dashed border-blue-200">
                  <h3 className="font-bold text-lg mb-3">📄 Documents qui seront générés :</h3>
                  <ul className="space-y-2 text-sm text-slate-700 mb-6">
                    <li>✅ Statuts de votre société</li>
                    <li>✅ PV de décision unique / AG constitutive</li>
                    <li>✅ Attestation de domiciliation</li>
                    <li>✅ Attestation de non-condamnation</li>
                    <li>✅ Déclaration des bénéficiaires effectifs</li>
                    <li>✅ Formulaire M0 pré-rempli</li>
                    <li>✅ État des actes accomplis</li>
                  </ul>

                  <Button
                    onClick={handleGenerateAndSign}
                    disabled={generatingDocs}
                    className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    {generatingDocs ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Génération et envoi en cours...
                      </>
                    ) : (
                      <>
                        <FileSignature className="mr-3 h-6 w-6" />
                        Générer tous les documents et envoyer en signature
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-blue-300 bg-blue-50">
                    <FileText className="text-blue-600" size={18} />
                    <AlertDescription className="text-blue-800">
                      {signedDocs.length > 0 ? (
                        <span>✅ Documents signés ! Vous pouvez les télécharger ci-dessous.</span>
                      ) : signatureRequest?.status === 'pending' ? (
                        <span>📧 Demande de signature envoyée ! Consultez votre email pour signer vos documents.</span>
                      ) : (
                        <span>📄 Documents générés. En attente de signature.</span>
                      )}
                    </AlertDescription>
                  </Alert>

                  {signatureRequest?.status === 'pending' && (
                    <Button
                      onClick={() => window.open(signatureRequest.signature_url, '_blank')}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <FileSignature className="mr-2 h-5 w-5" />
                      Ouvrir la page de signature
                    </Button>
                  )}

                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h3 className="font-bold text-lg mb-4">📥 Vos documents</h3>
                    <div className="space-y-3">
                      {generatedDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {doc.source === 'signed' ? (
                              <CheckCircle2 className="text-green-500" size={20} />
                            ) : (
                              <FileText className="text-blue-500" size={20} />
                            )}
                            <div>
                              <p className="font-medium text-sm">{doc.file_name}</p>
                              {doc.signed_at && (
                                <p className="text-xs text-green-600">Signé le {new Date(doc.signed_at).toLocaleDateString('fr-FR')}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(doc)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Download className="mr-1 h-4 w-4" />
                            Télécharger
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}