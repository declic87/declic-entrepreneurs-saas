"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, Building, Search } from "lucide-react";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CompanyData {
  id: string;
  company_type: string | null;
  step: string;
}

type StatutType = 
  | "EI" | "LMNP" | "SCI" | "SAS" | "SASU" | "SARL" | "EURL"
  | "SASU_IS" | "SASU_IR" | "SELARLU" | "SELARL" | "SELAS" | "SELASU";

const STATUTS = [
  {
    type: "EI" as StatutType,
    name: "EI - Entreprise Individuelle",
    description: "Simplicité maximale, patrimoine confondu",
    avantages: ["Aucun capital requis", "Création gratuite et rapide", "Comptabilité simplifiée"],
  },
  {
    type: "LMNP" as StatutType,
    name: "LMNP - Loueur Meublé Non Professionnel",
    description: "Location meublée, revenus complémentaires",
    avantages: ["Amortissement du bien", "Déficit imputable", "Régime micro-BIC possible"],
  },
  {
    type: "SCI" as StatutType,
    name: "SCI - Société Civile Immobilière",
    description: "Gestion immobilière à plusieurs",
    avantages: ["Transmission facilitée", "Gestion collective", "Option IS possible"],
  },
  {
    type: "SAS" as StatutType,
    name: "SAS - Société par Actions Simplifiée",
    description: "Flexibilité et croissance, plusieurs associés",
    avantages: ["Grande liberté statutaire", "Pas de plafond d'associés", "Président assimilé salarié"],
  },
  {
    type: "SASU" as StatutType,
    name: "SASU - SAS Unipersonnelle",
    description: "SAS avec un seul associé",
    avantages: ["Président assimilé salarié", "Pas de cotisations si pas de rémunération", "Dividendes flat tax 30%"],
  },
  {
    type: "SARL" as StatutType,
    name: "SARL - Société À Responsabilité Limitée",
    description: "Statut classique, cadre sécurisé",
    avantages: ["Cadre légal bien défini", "Gérant majoritaire TNS", "Protection sociale complète"],
  },
  {
    type: "EURL" as StatutType,
    name: "EURL - SARL Unipersonnelle",
    description: "SARL avec un seul associé",
    avantages: ["Gérant majoritaire TNS", "Cotisations sociales faibles", "Simplicité de gestion"],
  },
  {
    type: "SASU_IS" as StatutType,
    name: "SASU IS - SASU à l'Impôt sur les Sociétés",
    description: "SASU avec imposition sur les bénéfices",
    avantages: ["IS à 15% jusqu'à 42 500€", "Optimisation fiscale possible", "Charges déductibles"],
  },
  {
    type: "SASU_IR" as StatutType,
    name: "SASU IR - SASU à l'Impôt sur le Revenu",
    description: "SASU avec imposition sur le dirigeant (5 ans max)",
    avantages: ["Déficit imputable sur revenus", "Option pendant 5 ans", "Pas d'IS la première année"],
  },
  {
    type: "SELARLU" as StatutType,
    name: "SELARLU - SELARL Unipersonnelle",
    description: "Professions libérales réglementées, associé unique",
    avantages: ["Réservé aux professions libérales", "Protection du patrimoine", "Gérant TNS"],
  },
  {
    type: "SELARL" as StatutType,
    name: "SELARL - Société d'Exercice Libéral À Responsabilité Limitée",
    description: "SELARL avec plusieurs associés",
    avantages: ["Professions libérales réglementées", "Cadre juridique SARL", "Plusieurs associés possibles"],
  },
  {
    type: "SELAS" as StatutType,
    name: "SELAS - Société d'Exercice Libéral par Actions Simplifiée",
    description: "Professions libérales, cadre SAS",
    avantages: ["Grande flexibilité", "Président assimilé salarié", "Professions libérales"],
  },
  {
    type: "SELASU" as StatutType,
    name: "SELASU - SELAS Unipersonnelle",
    description: "SELAS avec un seul associé",
    avantages: ["Président assimilé salarié", "Professions libérales", "Associé unique"],
  },
];

export default function ValiderStatutPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [selectedStatut, setSelectedStatut] = useState<StatutType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    const { data: clientData } = await supabase
      .from("users")
      .select("*")
      .eq("id", clientId)
      .single();

    setClient(clientData);

    let { data: company } = await supabase
      .from("company_creation_data")
      .select("*")
      .eq("user_id", clientId)
      .single();

    setCompanyData(company);

    if (company?.company_type) {
      setSelectedStatut(company.company_type as StatutType);
    }

    setLoading(false);
  }

  async function handleValidate() {
    if (!selectedStatut) {
      alert("Veuillez sélectionner un statut juridique");
      return;
    }
  
    setSaving(true);
  
    try {
      console.log("🔄 Appel RPC update_company_status:", selectedStatut, "pour client:", clientId);
  
      // Appeler la fonction SQL
      const { data, error } = await supabase.rpc('update_company_status', {
        p_user_id: clientId,
        p_company_type: selectedStatut,
        p_step: 'info_collection'
      });
  
      if (error) {
        console.error("❌ Erreur RPC:", error);
        throw error;
      }
  
      console.log("✅ Statut validé via RPC:", data);
  
      alert(`✅ Statut ${selectedStatut} validé pour ${client?.first_name} ${client?.last_name}`);
      router.push(`/expert/clients`);
    } catch (err: any) {
      console.error("❌ Erreur validation:", err);
      alert(`Erreur: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  const filteredStatuts = STATUTS.filter((statut) =>
    statut.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    statut.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#123055] flex items-center gap-2">
          <Building size={32} />
          Valider le statut juridique
        </h1>
        <p className="text-slate-600 mt-1">
          Client : {client?.first_name} {client?.last_name}
        </p>
      </div>

      {companyData?.company_type && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-600" size={24} />
              <div>
                <p className="font-bold text-green-900">
                  Statut déjà validé : {companyData.company_type}
                </p>
                <p className="text-sm text-green-700">
                  Vous pouvez modifier le statut ci-dessous
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher un statut juridique..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 ring-amber-500/20 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
        {filteredStatuts.map((statut) => (
          <Card
            key={statut.type}
            className={`cursor-pointer transition-all border-2 ${
              selectedStatut === statut.type
                ? "border-amber-500 bg-amber-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
            onClick={() => setSelectedStatut(statut.type)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedStatut === statut.type
                      ? "border-amber-500 bg-amber-500"
                      : "border-slate-300"
                  }`}
                >
                  {selectedStatut === statut.type && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-slate-900 mb-1">
                    {statut.name}
                  </h3>
                  <p className="text-xs text-slate-600 mb-2">
                    {statut.description}
                  </p>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    {statut.avantages.slice(0, 3).map((avantage, idx) => (
                      <li key={idx}>✅ {avantage}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStatuts.length === 0 && (
        <p className="text-center text-slate-500 py-8">
          Aucun statut trouvé pour "{searchTerm}"
        </p>
      )}

      <div className="flex gap-4 sticky bottom-0 bg-white pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          onClick={handleValidate}
          disabled={!selectedStatut || saving}
          className="flex-1 bg-amber-500 hover:bg-amber-600"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Validation en cours...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2" size={16} />
              Valider le statut {selectedStatut}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}