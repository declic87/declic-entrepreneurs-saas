"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Users, Mail, Phone, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  offre: string;
  status: string;
  progression: number;
  commentaire: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
}

const OFFRE_COLORS: Record<string, string> = {
  PLATEFORME: "bg-gray-100 text-gray-600",
  STARTER: "bg-blue-100 text-blue-600",
  PRO: "bg-orange-100 text-orange-600",
  EXPERT: "bg-purple-100 text-purple-600",
  DAF: "bg-indigo-100 text-indigo-600"
};

const STATUS_COLORS: Record<string, string> = {
  ONBOARDING: "bg-blue-100 text-blue-700",
  EN_COURS: "bg-emerald-100 text-emerald-700",
  TERMINE: "bg-gray-100 text-gray-700",
  SUSPENDU: "bg-red-100 text-red-700"
};

export default function ExpertClientsPage() {
  const supabase = createBrowserClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setLoading(false); return; }

        // 1. Récupérer l'ID de l'expert
        const { data: expert } = await supabase
          .from("experts")
          .select("id")
          .eq("user_id", session.user.id)
          .single();

        if (expert) {
          // 2. Récupérer les clients avec les infos du lead
          const { data, error } = await supabase
            .from("clients")
            .select(`
              *,
              leads (
                first_name,
                last_name,
                email,
                phone
              )
            `)
            .eq("expert_id", expert.id)
            .order("created_at", { ascending: false });

          if (data) {
            const formatted = data.map((c: any) => ({
              ...c,
              lead_name: `${c.leads?.first_name || ""} ${c.leads?.last_name || ""}`.trim() || "Client sans nom",
              lead_email: c.leads?.email || "",
              lead_phone: c.leads?.phone || ""
            }));
            setClients(formatted);
          }
        }
      } catch (e) {
        console.error("Erreur clients:", e);
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const filtered = clients.filter((c) => {
    const matchSearch = search === "" || 
      (c.lead_name + c.lead_email).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: clients.length,
    onboarding: clients.filter(c => c.status === "ONBOARDING").length,
    enCours: clients.filter(c => c.status === "EN_COURS").length,
    termines: clients.filter(c => c.status === "TERMINE").length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Clients</h1>
          <p className="text-gray-500 mt-1">Gestion du portefeuille et suivi d'avancement</p>
        </div>
      </div>

      {/* Cartes de Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Users size={20}/></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-gray-500">Clients</p></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><ArrowUpRight size={20}/></div>
            <div><p className="text-2xl font-bold text-blue-600">{stats.onboarding}</p><p className="text-xs text-gray-500">Onboarding</p></div>
          </CardContent>
        </Card>
        {/* ... etc pour les autres stats */}
      </div>

      {/* Barre de recherche et Filtres */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Nom, email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="EN_COURS">En cours</option>
          <option value="TERMINE">Terminé</option>
        </select>
      </div>

      {/* Grille de Clients */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <Card key={c.id} className="group hover:shadow-md transition-all border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{c.lead_name}</h3>
                  <span className={"mt-1 inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase " + (OFFRE_COLORS[c.offre] || "bg-gray-100")}>
                    {c.offre}
                  </span>
                </div>
                <span className={"px-2 py-1 text-[10px] font-bold rounded-lg " + (STATUS_COLORS[c.status] || "bg-gray-100")}>
                  {c.status}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={14} className="text-gray-400" />
                  <span className="truncate">{c.lead_email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={14} className="text-gray-400" />
                  <span>{c.lead_phone || "Non renseigné"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-gray-400">Progression</span>
                  <span className="text-orange-600">{c.progression}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-500" 
                    style={{ width: `${c.progression}%` }}
                  />
                </div>
              </div>

              <Link 
                href={`/expert/clients/${c.id}`}
                className="mt-6 w-full py-2 flex justify-center items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
              >
                Ouvrir le dossier
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400">Aucun client ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
}