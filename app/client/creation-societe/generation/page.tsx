"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { FileText, CheckCircle2, Loader2, AlertCircle, Download, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface GeneratedDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  generated_at: string;
  status: string;
}

export default function DocumentGenerationPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
        .eq("source", "generated")
        .order("generated_at", { ascending: false });

      if (docsError) {
        console.error("Erreur chargement documents:", docsError);
      }

      console.log("📄 Documents chargés:", docs?.length || 0);
      setGeneratedDocs(docs || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateDocuments() {
    console.log("🔵 DÉBUT handleGenerateDocuments");
    console.log("🔵 userId:", userId);
    
    if (!userId) {
      console.log("❌ PAS DE userId");
      alert("Erreur : utilisateur non identifié");
      return;
    }

    console.log("🔵 Avant confirm");
    if (!confirm("Générer tous les documents ? Cette action peut prendre quelques instants.")) {
      console.log("❌ Utilisateur a cliqué ANNULER");
      return;
    }
    console.log("✅ Utilisateur a cliqué OK");

    setGenerating(true);
    setError(null);

    try {
      console.log("🚀 Appel API de génération... userId:", userId);

      const response = await fetch('/api/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      console.log("📡 Réponse reçue:", response.status);

      const result = await response.json();
      console.log("📦 Résultat:", result);

      if (!response.ok) {
        throw new Error(result.error || 'Erreur de génération');
      }

      console.log("✅ Génération réussie:", result);

      await loadUserAndDocuments();

      alert(`✅ ${result.message}`);
      
      // Rediriger vers la page principale du workflow
      setTimeout(() => {
        window.location.href = "/client/creation-societe";
      }, 1500);

    } catch (err: any) {
      console.error("❌ Erreur génération:", err);
      setError(err.message || "Erreur lors de la génération");
      alert(`❌ ${err.message}`);
    } finally {
      setGenerating(false);
      console.log("🔵 FIN handleGenerateDocuments");
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

  function formatDocumentLabel(docType: string): string {
    const labels: Record<string, string> = {
      'statuts': 'Statuts de la société',
      'statuts_sci': 'Statuts SCI',
      'attestation_souscription': 'Attestation de souscription',
      'pv_constitution': 'Procès-verbal de constitution',
      'm0': 'Formulaire M0',
      'actes': 'Actes de constitution',
    };
    
    return labels[docType] || docType.replace(/_/g, ' ').toUpperCase();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <span className="ml-3 text-lg">Chargement...</span>
      </div>
    );
  }

  const hasDocuments = generatedDocs.length > 0;

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
            <Sparkles className="text-blue-500" size={28} />
            Génération automatique des documents
          </CardTitle>
          <p className="text-slate-600 mt-2">
            Vos documents juridiques seront générés automatiquement à partir de vos informations
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  Documents générés : {generatedDocs.length}
                </p>
                <p className="text-sm text-slate-600">
                  {hasDocuments ? "Tous les documents sont prêts !" : "Cliquez sur le bouton pour générer vos documents"}
                </p>
              </div>
              {hasDocuments ? (
                <CheckCircle2 className="text-green-500" size={32} />
              ) : (
                <AlertCircle className="text-blue-500" size={32} />
              )}
            </div>
            {hasDocuments && (
              <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle size={18} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liste des documents générés */}
      {hasDocuments && (
        <div className="grid gap-4">
          {generatedDocs.map((doc) => (
            <Card key={doc.id} className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-slate-900">
                        {formatDocumentLabel(doc.document_type)}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" />
                        <span className="text-sm text-slate-700">{doc.file_name}</span>
                      </div>

                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 size={16} />
                        <span className="text-sm font-medium">Document généré</span>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Download size={16} className="mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="text-green-600" size={24} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Aucun document */}
      {!hasDocuments && (
        <div className="grid gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <p className="text-center text-slate-500 italic">
                Aucun document généré pour le moment
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bouton de génération - TOUJOURS AFFICHÉ */}
      <Card className="border-blue-300 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">
                Prêt à générer vos documents ?
              </h3>
              <p className="text-sm text-slate-600">
                Cette opération prendra quelques instants. Vos documents seront générés automatiquement.
              </p>
            </div>
            <Button
              onClick={handleGenerateDocuments}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" size={20} />
                  Générer les documents
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message final */}
      {hasDocuments && (
        <Alert className="border-green-300 bg-green-50">
          <CheckCircle2 className="text-green-600" size={18} />
          <AlertDescription className="text-green-800">
            ✅ Tous vos documents sont générés ! Vous pouvez passer à l'étape suivante : la signature électronique.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}