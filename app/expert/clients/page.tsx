"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, CheckCircle2, Clock, FileText } from "lucide-react";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_data?: {
    company_type: string | null;
    company_name: string | null;
    step: string;
  };
}

export default function ExpertClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [expertId, setExpertId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchExpert();
  }, []);

  useEffect(() => {
    if (expertId) {
      loadClients();
    }
  }, [expertId]);

  async function fetchExpert() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();
      
      if (userData) setExpertId(userData.id);
    }
  }

  async function loadClients() {
    // Récupérer les clients assignés à cet expert
    const { data: assignments } = await supabase
      .from("expert_clients")
      .select("client_id")
      .eq("expert_id", expertId)
      .eq("status", "active");

    if (!assignments || assignments.length === 0) {
      setLoading(false);
      return;
    }

    const clientIds = assignments.map((a) => a.client_id);

    // Récupérer les infos des clients
    const { data: clientsData } = await supabase
      .from("users")
      .select("*")
      .in("id", clientIds);

    if (clientsData) {
      // Récupérer les données de création société pour chaque client
      const clientsWithData = await Promise.all(
        clientsData.map(async (client) => {
          const { data: companyData } = await supabase
            .from("company_creation_data")
            .select("*")
            .eq("user_id", client.id)
            .single();

          return {
            ...client,
            company_data: companyData,
          };
        })
      );

      setClients(clientsWithData);
    }

    setLoading(false);
  }

  function getStepLabel(step: string) {
    const labels: Record<string, string> = {
      rdv_expert: "RDV en attente",
      info_collection: "Collecte d'infos",
      documents_upload: "Upload documents",
      documents_generation: "Génération en cours",
      signature: "Signature en attente",
      completed: "Terminé",
    };
    return labels[step] || step;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#123055]">
            👥 Mes Clients
          </h1>
          <p className="text-slate-600 mt-1">
            Gestion du portefeuille et suivi d'avancement
          </p>
        </div>

        <div className="flex gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="text-blue-600" size={24} />
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {clients.length}
                  </p>
                  <p className="text-xs text-blue-600">Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-600" size={24} />
                <div>
                <p className="text-2xl font-bold text-green-900">
  {
    clients.filter((c) => c.company_data?.company_type !== null)
      .length
  }
</p>
<p className="text-xs text-green-600">Onboarding</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Liste des clients */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users size={64} className="mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-semibold text-slate-600 mb-2">
              Aucun client ne correspond à votre recherche.
            </p>
            <p className="text-sm text-slate-500">
              Les clients vous seront assignés par l'administrateur.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                    {client.first_name?.charAt(0)}
                    {client.last_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {client.first_name} {client.last_name}
                    </h3>
                    <p className="text-xs text-slate-500">{client.email}</p>
                  </div>
                </div>

                {client.company_data ? (
                  <>
                    {client.company_data.company_type && (
                      <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-xs font-semibold text-green-900">
                          Statut : {client.company_data.company_type}
                        </p>
                      </div>
                    )}

                    <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs font-semibold text-blue-900">
                        <Clock size={12} className="inline mr-1" />
                        {getStepLabel(client.company_data.step)}
                      </p>
                    </div>

                    <div className="space-y-2">
  {!client.company_data.company_type ? (
    <Button
      className="w-full bg-amber-500 hover:bg-amber-600"
      onClick={() =>
        router.push(`/expert/clients/${client.id}/valider-statut`)
      }
    >
      <FileText size={16} className="mr-2" />
      Valider le statut
    </Button>
  ) : (
    <Button
      className="w-full bg-blue-500 hover:bg-blue-600"
      onClick={() =>
        router.push(`/expert/clients/${client.id}/valider-statut`)
      }
    >
      <FileText size={16} className="mr-2" />
      Modifier le statut
    </Button>
  )}

  <Button
    variant="outline"
    className="w-full"
    onClick={() => {
      // Se connecter en tant que client (impersonation)
      window.open(`/client?impersonate=${client.id}`, '_blank');
    }}
  >
    👤 Accès client
  </Button>
</div>        </>
                ) : (
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    onClick={() =>
                      router.push(`/expert/clients/${client.id}/valider-statut`)
                    }
                  >
                    <FileText size={16} className="mr-2" />
                    Démarrer l'onboarding
                  </Button>
                )}

<Button
  variant="outline"
  className="w-full"
  onClick={() => router.push(`/expert/clients/${client.id}/valider-statut`)}
>
  Modifier le statut
</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}