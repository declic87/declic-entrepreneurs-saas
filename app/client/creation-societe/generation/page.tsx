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

const DOCUMENTS_TO_GENERATE = [
  {
    type: "statuts",
    label: "Statuts de la société",
    description: "Document juridique définissant les règles de fonctionnement"
  },
  {
    type: "m0",
    label: "Formulaire M0",
    description: "Déclaration de création d'entreprise"
  },
  {
    type: "actes",
    label: "Procès-verbal de constitution",
    description: "Acte actant la création de la société"
  },
];

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

      // Charger les documents générés
      const { data: docs, error: docsError } = await supabase
        .from("company_documents")
        .select("*")
        .eq("user_id", userData.id)
        .eq("source", "generated")
        .order("generated_at", { ascending: false });

      if (docsError) {
        console.error("Erreur chargement documents:", docsError);
      }

      setGeneratedDocs(docs || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateDocuments() {
    if (!userId) {
      alert("Erreur : utilisateur non identifié");
      return;
    }

    if (!confirm("Générer tous les documents ? Cette action peut prendre quelques instants.")) {
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      console.log("🚀 Lancement de la génération automatique...");

      // Simuler la génération de documents (à remplacer par votre API de génération)
      for (const docType of DOCUMENTS_TO_GENERATE) {
        // Vérifier si le document existe déjà
        const existingDoc = generatedDocs.find(d => d.document_type === docType.type);
        
        if (!existingDoc) {
          console.log(`📄 Génération de ${docType.label}...`);

          // TODO: Remplacer par votre vraie logique de génération
          // Ici on crée juste une entrée en base de données
          const { data: newDoc, error: insertError } = await supabase
            .from("company_documents")
            .insert({
              user_id: userId,
              document_type: docType.type,
              file_name: `${docType.type}_${Date.now()}.pdf`,
              file_path: `${userId}/generated/${docType.type}_${Date.now()}.pdf`,
              source: "generated",
              status: "pending",
              generated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (insertError) {
            console.error(`Erreur génération ${docType.type}:`, insertError);
            throw new Error(`Échec de génération: ${docType.label}`);
          }

          console.log(`✅ ${docType.label} généré`);

          // Petite pause pour simuler le traitement
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Recharger les documents
      await loadUserAndDocuments();

      // Mettre à jour le workflow vers l'étape suivante
      const { error: workflowError } = await supabase
        .from("company_creation_data")
        .update({
          step: "signature",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("step", "documents_generation");

      if (workflowError) {
        console.error("Erreur mise à jour workflow:", workflowError);
      } else {
        console.log("✅ Workflow mis à jour vers 'signature'");
      }

      alert("✅ Tous les documents ont été générés avec succès !");
      
      // Rediriger vers la page principale du workflow
      window.location.href = "/client/creation-societe";

    } catch (err: any) {
      console.error("❌ Erreur génération:", err);
      setError(err.message || "Erreur lors de la génération");
      alert(`❌ ${err.message}`);
    } finally {
      setGenerating(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <span className="ml-3 text-lg">Chargement...</span>
      </div>
    );
  }

  const docsMap = generatedDocs.reduce((acc, doc) => {
    acc[doc.document_type] = doc;
    return acc;
  }, {} as Record<string, GeneratedDocument>);

  const allGenerated = DOCUMENTS_TO_GENERATE.every(d => docsMap[d.type]);
  const generatedCount = DOCUMENTS_TO_GENERATE.filter(d => docsMap[d.type]).length;

  return (
    <div className="space-y-6">
      {/* Header */}
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
                  Documents générés : {generatedCount}/{DOCUMENTS_TO_GENERATE.length}
                </p>
                <p className="text-sm text-slate-600">
                  {allGenerated ? "Tous les documents sont prêts !" : "Cliquez sur le bouton pour générer vos documents"}
                </p>
              </div>
              {allGenerated ? (
                <CheckCircle2 className="text-green-500" size={32} />
              ) : (
                <AlertCircle className="text-blue-500" size={32} />
              )}
            </div>
            <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(generatedCount / DOCUMENTS_TO_GENERATE.length) * 100}%` }}
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
        {DOCUMENTS_TO_GENERATE.map((docType) => {
          const doc = docsMap[docType.type];

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
                    ) : (
                      <p className="text-sm text-slate-500 italic">En attente de génération</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {doc ? (
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="text-green-600" size={24} />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <FileText className="text-slate-400" size={24} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bouton de génération */}
      {!allGenerated && (
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
      )}

      {/* Message final */}
      {allGenerated && (
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