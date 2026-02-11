"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { FileText, CheckCircle2, XCircle, Eye, Download, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DocumentWithUser {
  id: string;
  user_id: string;
  client_email: string;
  client_name: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  status: string;
  rejection_reason?: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  piece_identite: "Pièce d'identité",
  justificatif_domicile: "Justificatif de domicile",
  attestation_depot_capital: "Attestation dépôt capital",
};

export default function AdminDocumentValidation() {
  const [documents, setDocuments] = useState<DocumentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatorId, setValidatorId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    loadValidatorId();
    loadDocuments();

    const channel = supabase
      .channel('admin-documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_documents',
        },
        () => {
          console.log("🔄 Document mis à jour, rechargement...");
          loadDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  async function loadValidatorId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (data) {
      setValidatorId(data.id);
    }
  }

  async function loadDocuments() {
    try {
      setLoading(true);

      let query = supabase
        .from("company_documents")
        .select("*")
        .eq("source", "upload")
        .order("uploaded_at", { ascending: false });

      if (filter === "pending") {
        query = query.eq("status", "pending");
      } else if (filter === "approved") {
        query = query.eq("status", "approved");
      } else if (filter === "rejected") {
        query = query.eq("status", "rejected");
      }

      const { data: docs, error } = await query;

      if (error) {
        console.error("Erreur chargement documents:", error);
        return;
      }

      const userIds = [...new Set((docs || []).map(d => d.user_id))];
      const { data: users } = await supabase
        .from("users")
        .select("id, email, first_name, last_name")
        .in("id", userIds);

      const formatted = (docs || []).map((doc: any) => {
        const user = users?.find(u => u.id === doc.user_id);
        return {
          id: doc.id,
          user_id: doc.user_id,
          client_email: user?.email || "N/A",
          client_name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "N/A",
          document_type: doc.document_type,
          file_name: doc.file_name,
          file_path: doc.file_path,
          uploaded_at: doc.uploaded_at,
          status: doc.status,
          rejection_reason: doc.rejection_reason,
        };
      });

      console.log("📄 Documents chargés:", formatted.length);
      setDocuments(formatted);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(documentId: string) {
    if (!validatorId) {
      alert("Erreur : validateur non identifié");
      return;
    }

    if (!confirm("Valider ce document ?")) return;

    try {
      const { error } = await supabase
        .from("company_documents")
        .update({
          status: "approved",
          reviewed_by: validatorId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", documentId);

      if (error) throw error;

      alert("✅ Document validé !");
      loadDocuments();
    } catch (err: any) {
      console.error("Erreur validation:", err);
      alert(`❌ ${err.message}`);
    }
  }

  async function handleReject(documentId: string) {
    if (!validatorId) {
      alert("Erreur : validateur non identifié");
      return;
    }

    if (!rejectionReason.trim()) {
      alert("Veuillez indiquer une raison de rejet");
      return;
    }

    try {
      const { error } = await supabase
        .from("company_documents")
        .update({
          status: "rejected",
          reviewed_by: validatorId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", documentId);

      if (error) throw error;

      alert("✅ Document rejeté");
      setRejectingId(null);
      setRejectionReason("");
      loadDocuments();
    } catch (err: any) {
      console.error("Erreur rejet:", err);
      alert(`❌ ${err.message}`);
    }
  }

  async function handleApproveAll(userId: string, clientName: string) {
    if (!validatorId) return;

    if (!confirm(`Valider TOUS les documents de ${clientName} ?`)) return;

    try {
      const { error } = await supabase
        .from("company_documents")
        .update({
          status: "approved",
          reviewed_by: validatorId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("user_id", userId)
        .eq("source", "upload")
        .eq("status", "pending");

      if (error) throw error;

      alert(`✅ Documents validés pour ${clientName}`);
      loadDocuments();
    } catch (err: any) {
      console.error("Erreur:", err);
      alert(`❌ ${err.message}`);
    }
  }

  async function downloadDocument(filePath: string, fileName: string) {
    try {
      const { data, error } = await supabase.storage
        .from('company-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Erreur téléchargement:", err);
      alert(`❌ ${err.message}`);
    }
  }

  async function previewDocument(filePath: string) {
    try {
      const { data } = await supabase.storage
        .from('company-documents')
        .createSignedUrl(filePath, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      console.error("Erreur aperçu:", err);
      alert(`❌ ${err.message}`);
    }
  }

  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.user_id]) {
      acc[doc.user_id] = {
        client_name: doc.client_name,
        client_email: doc.client_email,
        documents: [],
      };
    }
    acc[doc.user_id].documents.push(doc);
    return acc;
  }, {} as Record<string, { client_name: string; client_email: string; documents: DocumentWithUser[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <span className="ml-3 text-lg">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#123055]">Validation Documents</h1>
          <p className="text-slate-600 mt-1">
            {documents.length} document{documents.length > 1 ? 's' : ''} à traiter
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className={filter === "pending" ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            En attente
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
            className={filter === "approved" ? "bg-green-500 hover:bg-green-600" : ""}
          >
            Validés
          </Button>
          <Button
            variant={filter === "rejected" ? "default" : "outline"}
            onClick={() => setFilter("rejected")}
            className={filter === "rejected" ? "bg-red-500 hover:bg-red-600" : ""}
          >
            Refusés
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Tous
          </Button>
        </div>
      </div>

      {Object.entries(groupedDocs).map(([userId, client]) => (
        <Card key={userId} className="border-slate-200">
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{client.client_name}</CardTitle>
                <p className="text-sm text-slate-600">{client.client_email}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {client.documents.length} document{client.documents.length > 1 ? 's' : ''}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleApproveAll(userId, client.client_name)}
                className="bg-green-500 hover:bg-green-600 text-white"
                disabled={client.documents.every(d => d.status === 'approved')}
              >
                <CheckCircle2 size={16} className="mr-2" />
                Tout valider
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {client.documents.map((doc) => (
              <div key={doc.id}>
                <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg">
                  <FileText className="text-slate-400" size={24} />
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">
                      {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                    </h4>
                    <p className="text-sm text-slate-600">{doc.file_name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Uploadé le {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.status === 'approved' ? (
                      <div className="flex items-center gap-2 text-green-600 px-3 py-1 bg-green-50 rounded-full">
                        <CheckCircle2 size={16} />
                        <span className="text-sm font-medium">Validé</span>
                      </div>
                    ) : doc.status === 'rejected' ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-red-600 px-3 py-1 bg-red-50 rounded-full">
                          <XCircle size={16} />
                          <span className="text-sm font-medium">Refusé</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 px-3 py-1 bg-amber-50 rounded-full">
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">En attente</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => previewDocument(doc.file_path)}
                      title="Prévisualiser"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                      title="Télécharger"
                    >
                      <Download size={16} />
                    </Button>

                    {doc.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(doc.id)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          title="Valider"
                        >
                          <CheckCircle2 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setRejectingId(doc.id)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                          title="Rejeter"
                        >
                          <XCircle size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {doc.status === 'rejected' && doc.rejection_reason && (
                  <div className="mt-2 ml-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    <strong>Motif :</strong> {doc.rejection_reason}
                  </div>
                )}

                {rejectingId === doc.id && (
                  <div className="mt-3 p-4 bg-red-50 border border-red-300 rounded-lg">
                    <h4 className="font-bold text-red-900 mb-2">Motif de rejet</h4>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Indiquez la raison du rejet..."
                      className="mb-3"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReject(doc.id)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        Confirmer le rejet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectionReason("");
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {documents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <FileText className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-lg">Aucun document à afficher</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}