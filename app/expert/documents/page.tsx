"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Search, Eye, Download, Filter } from "lucide-react";

interface Doc {
  id: string;
  name: string;
  category: string;
  url: string;
  created_at: string;
  client_name: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  AVIS_IMPOSITION: "bg-blue-100 text-blue-700",
  KBIS: "bg-purple-100 text-purple-700",
  STATUTS: "bg-emerald-100 text-emerald-700",
  CONTRAT: "bg-orange-100 text-orange-700",
  FACTURE: "bg-amber-100 text-amber-700",
  RAPPORT: "bg-indigo-100 text-indigo-700",
  AUTRE: "bg-gray-100 text-gray-600"
};

export default function ExpertDocumentsPage() {
  const supabase = createBrowserClient();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // 1. Trouver l'expert
        const { data: expert } = await supabase
          .from("experts")
          .select("id")
          .eq("user_id", session.user.id)
          .single();

        if (expert) {
          // 2. Récupérer les docs via les clients de l'expert
          const { data, error } = await supabase
            .from("documents")
            .select(`
              *,
              clients!inner (
                expert_id,
                leads (first_name, last_name)
              )
            `)
            .eq("clients.expert_id", expert.id)
            .order("created_at", { ascending: false });

          if (data) {
            const formatted = data.map((d: any) => ({
              ...d,
              client_name: `${d.clients?.leads?.first_name || ""} ${d.clients?.leads?.last_name || ""}`.trim()
            }));
            setDocs(formatted);
          }
        }
      } catch (e) {
        console.error("Erreur chargement documents:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  const categories = Array.from(new Set(docs.map((d) => d.category)));

  const filtered = docs.filter((d) => {
    const matchSearch = search === "" || 
      d.name?.toLowerCase().includes(search.toLowerCase()) || 
      d.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "ALL" || d.category === filterCat;
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">Archive centrale de vos dossiers clients</p>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: docs.length, color: "text-gray-900" },
          { label: "Impôts", value: docs.filter(d => d.category === "AVIS_IMPOSITION").length, color: "text-blue-600" },
          { label: "Statuts", value: docs.filter(d => d.category === "STATUTS").length, color: "text-emerald-600" },
          { label: "Contrats", value: docs.filter(d => d.category === "CONTRAT").length, color: "text-orange-600" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher un document ou un client..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white px-3 border border-gray-200 rounded-xl">
            <Filter size={14} className="text-gray-400" />
            <select 
              value={filterCat} 
              onChange={(e) => setFilterCat(e.target.value)} 
              className="py-2 bg-transparent text-sm outline-none"
            >
              <option value="ALL">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des documents */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Document</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <FileText size={18} />
                      </div>
                      <span className="font-medium text-sm text-gray-900">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.client_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${CATEGORY_COLORS[doc.category] || "bg-gray-100"}`}>
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                        title="Visualiser"
                      >
                        <Eye size={16} />
                      </a>
                      <a 
                        href={doc.url} 
                        download 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Télécharger"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400">Aucun document trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}