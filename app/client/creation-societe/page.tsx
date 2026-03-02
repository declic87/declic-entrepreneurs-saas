"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OnboardingVideo } from "@/components/OnboardingVideo";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Calendar,
  FileText,
  Upload,
  FileSignature,
  Send,
  Loader2,
  Plus,
  Banknote,
  AlertCircle,
} from "lucide-react";

interface CompanyData {
  id: string;
  step: string;
  company_type: string | null;
  company_name: string | null;
  company_id: string | null;
}

interface Document {
  id: string;
  document_type: string;
  status: string;
  company_id: string | null;
}

interface UserCompany {
  id: string;
  company_name: string;
  legal_form: string;
  is_active: boolean;
  created_at: string;
}

const STEPS = [
  {
    id: "rdv_expert",
    label: "RDV avec votre expert",
    description: "Choisir votre statut juridique",
    icon: Calendar,
    onlyFirstCompany: true,
  },
  {
    id: "info_collection",
    label: "Informations société",
    description: "Remplir vos informations",
    icon: FileText,
  },
  {
    id: "capital_deposit",
    label: "Dépôt de capital",
    description: "Attestation bancaire",
    icon: Banknote,
  },
  {
    id: "documents_upload",
    label: "Upload documents",
    description: "CNI, justificatif, attestation",
    icon: Upload,
  },
  {
    id: "documents_generation",
    label: "Génération automatique",
    description: "Statuts, M0, actes",
    icon: FileSignature,
    auto: true,
  },
  {
    id: "signature",
    label: "Signature électronique",
    description: "Signer vos documents",
    icon: FileSignature,
  },
  {
    id: "completed",
    label: "Dépôt INPI",
    description: "Finalisation",
    icon: Send,
  },
];

export default function CreationSocietePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeCompany, setActiveCompany] = useState<UserCompany | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isFirstCompanyEver, setIsFirstCompanyEver] = useState(false);
  const [rdvCompleted, setRdvCompleted] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadData();
      
      const interval = setInterval(() => {
        loadData();
      }, 3000);
      
      return () => clearInterval(interval);
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

  async function loadData() {
    const { data: allCompanies } = await supabase
      .from("user_companies")
      .select("*")
      .order('created_at', { ascending: true });

    const { data: companies } = await supabase
      .from("user_companies")
      .select("*")
      .eq("is_active", true)
      .single();

    if (companies && allCompanies) {
      setActiveCompany(companies);

      const firstCompanyId = allCompanies[0]?.id;
      const isFirst = companies.id === firstCompanyId;
      setIsFirstCompanyEver(isFirst);

      // ⭐ Vérifier si le RDV de la PREMIÈRE société est terminé
      if (firstCompanyId) {
        const { data: firstCompanyWorkflow } = await supabase
          .from("company_creation_data")
          .select("step")
          .eq("company_id", firstCompanyId)
          .single();

        // RDV complété si l'étape actuelle n'est plus "rdv_expert"
        const rdvDone = firstCompanyWorkflow && firstCompanyWorkflow.step !== "rdv_expert";
        setRdvCompleted(rdvDone || false);
      }

      let { data: company } = await supabase
        .from("company_creation_data")
        .select("*")
        .eq("company_id", companies.id)
        .single();

      if (!company) {
        const { data: newCompany } = await supabase
          .from("company_creation_data")
          .insert({ 
            user_id: userId, 
            company_id: companies.id,
            step: isFirst ? "rdv_expert" : "info_collection"
          })
          .select()
          .single();
        company = newCompany;
      }

      setCompanyData(company);

      const { data: docs } = await supabase
        .from("company_documents")
        .select("*")
        .eq("company_id", companies.id);

      setDocuments(docs || []);
    }
  }

  async function createNewCompany() {
    // ⭐ Vérifier que le RDV est fait avant de créer une nouvelle société
    if (!rdvCompleted) {
      alert("⚠️ Vous devez d'abord terminer l'étape RDV Expert de votre première société avant de créer une nouvelle société.");
      return;
    }

    setCreating(true);
    try {
      const { data: existingCompanies, error: countError } = await supabase
        .from('user_companies')
        .select('id');

      if (countError) throw countError;

      const companyNumber = (existingCompanies?.length || 0) + 1;
      const timestamp = Date.now();
      const uniqueName = `Société ${companyNumber} - ${timestamp}`;

      const { data: newCompanyId, error } = await supabase.rpc('create_user_company', {
        p_company_name: uniqueName,
        p_legal_form: 'SASU'
      });

      if (error) throw error;

      if (newCompanyId) {
        await supabase
          .from('user_companies')
          .update({ is_active: false })
          .neq('id', newCompanyId);
        
        await supabase
          .from('user_companies')
          .update({ is_active: true })
          .eq('id', newCompanyId);

        router.refresh();
        
        alert(`✅ Nouvelle société créée : ${uniqueName}\n\nVous pouvez maintenant avancer sur plusieurs sociétés en parallèle !`);
      }
    } catch (error: any) {
      console.error('Erreur création société:', error);
      alert(`❌ Erreur : ${error.message || 'Impossible de créer la société'}`);
    } finally {
      setCreating(false);
    }
  }

  function getStepStatus(stepId: string): "completed" | "current" | "upcoming" {
    if (!companyData) return "upcoming";

    const stepOrder = STEPS.map((s) => s.id);
    const currentIndex = stepOrder.indexOf(companyData.step);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  }

  function getNextStepAction() {
    if (!companyData) return null;

    switch (companyData.step) {
      case "rdv_expert":
        return {
          label: "Prendre RDV avec un expert",
          href: "https://calendly.com/d/cvdb-dxd-3np/diagnostic",
          disabled: false,
        };

      case "info_collection":
        return {
          label: "Remplir les informations",
          href: "/client/creation-societe/infos",
          disabled: false,
        };

      case "capital_deposit":
        return {
          label: "Déposer le capital",
          href: "/client/creation-societe/depot-capital",
          disabled: false,
        };

      case "documents_upload":
        return {
          label: "Uploader les documents",
          href: "/client/creation-societe/documents",
          disabled: false,
        };

      case "documents_generation":
        return {
          label: "Générer les documents",
          href: "/client/creation-societe/generation",
          disabled: false,
        };

      case "signature":
        return {
          label: "Signer les documents",
          href: "/client/creation-societe/signature",
          disabled: false,
        };

      default:
        return null;
    }
  }

  const nextAction = getNextStepAction();

  const visibleSteps = STEPS.filter(step => {
    if (step.onlyFirstCompany) {
      return isFirstCompanyEver;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <OnboardingVideo pageSlug="creation-societe" />

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[#123055] mb-2">
            🏢 {activeCompany?.company_name || "Création de votre société"}
          </h1>
          <p className="text-slate-600">
            {activeCompany?.legal_form && (
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm font-semibold mr-2">
                {activeCompany.legal_form}
              </span>
            )}
            {!isFirstCompanyEver && (
              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-sm font-semibold mr-2">
                Société supplémentaire
              </span>
            )}
            {isFirstCompanyEver && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-sm font-semibold mr-2">
                Première société
              </span>
            )}
            Suivez les étapes pour créer votre entreprise
          </p>
        </div>

        <Button
          onClick={createNewCompany}
          disabled={creating || !rdvCompleted}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-6 h-12 shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          title={!rdvCompleted ? "Terminez l'étape RDV Expert de votre première société pour débloquer" : ""}
        >
          {creating ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              Création...
            </>
          ) : (
            <>
              <Plus size={20} className="mr-2" />
              Créer une nouvelle société
            </>
          )}
        </Button>
      </div>

      {/* Message si RDV pas fait */}
      {!rdvCompleted && !isFirstCompanyEver && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
              <div>
                <p className="font-bold text-amber-900 mb-1">
                  ⏳ En attente de validation
                </p>
                <p className="text-sm text-amber-700">
                  Le RDV Expert de votre première société doit être terminé avant de pouvoir créer d'autres sociétés.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info parallèle si RDV fait */}
      {rdvCompleted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
              <div>
                <p className="font-bold text-green-900 mb-1">
                  ✅ Mode multi-société activé !
                </p>
                <p className="text-sm text-green-700">
                  Vous pouvez maintenant créer et gérer plusieurs sociétés en parallèle.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {companyData?.company_type && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-600" size={24} />
              <div>
                <p className="font-bold text-green-900">
                  Statut juridique : {companyData.company_type}
                </p>
                <p className="text-sm text-green-700">
                  Validé par votre expert
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {visibleSteps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;

          return (
            <Card
              key={step.id}
              className={`transition-all ${
                status === "current"
                  ? "border-amber-500 border-2 bg-amber-50"
                  : status === "completed"
                  ? "border-green-200 bg-green-50"
                  : "border-slate-200"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      status === "completed"
                        ? "bg-green-500"
                        : status === "current"
                        ? "bg-amber-500"
                        : "bg-slate-200"
                    }`}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="text-white" size={24} />
                    ) : status === "current" ? (
                      <Icon className="text-white" size={24} />
                    ) : (
                      <Circle className="text-slate-400" size={24} />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-bold ${
                          status === "current"
                            ? "text-amber-900"
                            : status === "completed"
                            ? "text-green-900"
                            : "text-slate-600"
                        }`}
                      >
                        Étape {index + 1} : {step.label}
                      </h3>
                      {step.auto && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-semibold">
                          Automatique
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm ${
                        status === "current"
                          ? "text-amber-700"
                          : status === "completed"
                          ? "text-green-700"
                          : "text-slate-500"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>

                  <div>
                    {status === "completed" && (
                      <span className="text-sm font-semibold text-green-600">
                        ✓ Terminé
                      </span>
                    )}
                    {status === "current" && (
                      <span className="text-sm font-semibold text-amber-600">
                        En cours
                      </span>
                    )}
                    {status === "upcoming" && (
                      <span className="text-sm text-slate-400">
                        À venir
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {nextAction && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-amber-900 text-lg mb-1">
                  Prochaine étape
                </h3>
                <p className="text-sm text-amber-700">
                  Cliquez pour continuer votre dossier
                </p>
              </div>
              <Button
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => router.push(nextAction.href)}
                disabled={nextAction.disabled}
              >
                {nextAction.label}
                {!nextAction.disabled && (
                  <ArrowRight className="ml-2" size={16} />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {companyData?.step &&
        ["documents_generation", "signature", "completed"].includes(
          companyData.step
        ) && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-slate-900 mb-4">
                📄 Documents générés automatiquement
              </h3>
              <div className="space-y-2">
                {documents
                  .filter((d) => d.document_type.startsWith("projet_") || d.document_type.startsWith("statuts_") || d.document_type === "formulaire_m0" || d.document_type === "etat_actes_accomplis")
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="text-blue-600" size={20} />
                        <span className="text-sm font-medium text-blue-900">
                          {doc.document_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      {doc.status === "signed" && (
                        <CheckCircle2 className="text-green-600" size={20} />
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}