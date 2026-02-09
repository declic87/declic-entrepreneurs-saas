"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Calendar,
  FileText,
  Upload,
  FileSignature,
  Send,
  Loader2,
} from "lucide-react";

interface CompanyData {
  id: string;
  step: string;
  company_type: string | null;
  company_name: string | null;
}

interface Document {
  id: string;
  document_type: string;
  status: string;
}

const STEPS = [
  {
    id: "rdv_expert",
    label: "RDV avec votre expert",
    description: "Choisir votre statut juridique",
    icon: Calendar,
  },
  {
    id: "info_collection",
    label: "Informations société",
    description: "Remplir vos informations",
    icon: FileText,
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
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

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
      
      // Auto-refresh toutes les 3 secondes
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
    // Charger les données de création
    let { data: company } = await supabase
      .from("company_creation_data")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Si pas de données, créer l'entrée
    if (!company) {
      const { data: newCompany } = await supabase
        .from("company_creation_data")
        .insert({ user_id: userId, step: "rdv_expert" })
        .select()
        .single();
      company = newCompany;
    }

    setCompanyData(company);

    // Charger les documents
    const { data: docs } = await supabase
      .from("company_documents")
      .select("*")
      .eq("user_id", userId);

    setDocuments(docs || []);
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

  function canProceedToNextStep(): boolean {
    if (!companyData) return false;

    switch (companyData.step) {
      case "rdv_expert":
        // Vérifier qu'un expert a validé le statut
        return !!companyData.company_type;

      case "info_collection":
        // Vérifier que toutes les infos sont remplies
        return !!(
          companyData.company_name &&
          companyData.company_type
        );

      case "documents_upload":
        // Vérifier que les 3 documents sont uploadés
        const requiredDocs = [
          "piece_identite",
          "justificatif_domicile",
          "attestation_depot_capital",
        ];
        return requiredDocs.every((type) =>
          documents.some((d) => d.document_type === type)
        );

      default:
        return false;
    }
  }

  function getNextStepAction() {
    if (!companyData) return null;

    switch (companyData.step) {
      case "rdv_expert":
  return {
    label: "Prendre RDV avec un expert",
    href: "https://calendly.com/contact-jj-conseil/rdv-analyste",
    disabled: false,
  };

      case "info_collection":
        return {
          label: "Remplir les informations",
          href: "/client/creation-societe/infos",
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
          label: "Génération en cours...",
          href: "#",
          disabled: true,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#123055]">
          🏢 Création de votre société
        </h1>
        <p className="text-slate-600 mt-1">
          Suivez les étapes pour créer votre entreprise en toute simplicité
        </p>
      </div>

      {/* Statut choisi */}
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

      {/* Timeline des étapes */}
      <div className="space-y-4">
        {STEPS.map((step, index) => {
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
                  {/* Icon */}
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

                  {/* Content */}
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

                  {/* Status */}
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

      {/* Action suivante */}
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

      {/* Documents générés (visible après génération) */}
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