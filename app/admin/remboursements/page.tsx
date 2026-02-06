"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2, Euro } from "lucide-react";

interface Refund {
  id: string;
  clientId: string;
  reason: string;
  amount: number;
  percentage: number;
  status: string;
  processed_at: string;
  created_at: string;
  client?: {
    name: string;
    email: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DEMANDE: { label: "Demande", color: "bg-blue-100 text-blue-700", icon: Clock },
  EN_COURS: { label: "En cours", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  APPROUVE: { label: "Approuvé", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  REFUSE: { label: "Refusé", color: "bg-red-100 text-red-700", icon: XCircle },
  TRAITE: { label: "Traité", color: "bg-purple-100 text-purple-700", icon: CheckCircle },
};

export default function RemboursementsPage() {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  async function fetchRefunds() {
    // Note: On adapte la jointure selon ta table 'leads' qui contient les infos clients
    const { data, error } = await supabase
      .from("refunds")
      .select(`
        *,
        client:clientId (
          name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur fetch:", error);
    } else {
      setRefunds(data || []);
    }
    setLoading(false);
  }

  async function updateStatus(refundId: string, newStatus: string) {
    setActionLoading(refundId);
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from("refunds")
      .update({ status: newStatus, processed_at: now })
      .eq("id", refundId);

    if (!error) {
      setRefunds((prev) =>
        prev.map((r) =>
          r.id === refundId ? { ...r, status: newStatus, processed_at: now } : r
        )
      );
    }
    setActionLoading(null);
  }

  const filtered = filterStatus === "ALL" ? refunds : refunds.filter((r) => r.status === filterStatus);

  const stats = {
    total: refunds.length,
    demandes: refunds.filter((r) => r.status === "DEMANDE").length,
    approuves: refunds.filter((r) => r.status === "APPROUVE").length,
    montantTotal: refunds
      .filter((r) => r.status === "APPROUVE" || r.status === "TRAITE")
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-orange-500" size={40} />
        <p className="text-gray-500 animate-pulse">Chargement des remboursements...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Remboursements</h1>
          <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest">{stats.total} dossiers enregistrés</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <p className="text-xs text-gray-400 uppercase font-bold">Total Approuvé</p>
           <p className="text-2xl font-black text-emerald-600">{stats.montantTotal.toLocaleString("fr-FR")} €</p>
        </div>
      </div>

      {/* Filtres Rapides */}
      <div className="flex gap-2 p-1 bg-gray-200/50 w-fit rounded-xl">
        {["ALL", "DEMANDE", "EN_COURS", "APPROUVE", "REFUSE", "TRAITE"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              filterStatus === status 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {status === "ALL" ? "TOUS" : status}
          </button>
        ))}
      </div>

      {/* Liste des demandes */}
      <div className="grid gap-4">
        {filtered.map((r) => {
          const config = STATUS_CONFIG[r.status] || { label: r.status, color: "bg-gray-100 text-gray-600", icon: Clock };
          const Icon = config.icon;

          return (
            <Card key={r.id} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center">
                  <div className={`w-2 self-stretch ${config.color.split(' ')[0]}`} />
                  
                  <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    {/* Client */}
                    <div>
                      <p className="font-bold text-gray-900">{r.client?.name || "Client Inconnu"}</p>
                      <p className="text-xs text-gray-400">{r.client?.email || "Pas d'email"}</p>
                    </div>

                    {/* Détails */}
                    <div className="md:col-span-1">
                      <p className="text-xs text-gray-400 uppercase font-bold mb-1">Raison</p>
                      <p className="text-sm text-gray-600 italic truncate">"{r.reason || "Non spécifiée"}"</p>
                    </div>

                    {/* Montant */}
                    <div>
                      <p className="text-2xl font-black text-gray-900">{r.amount} €</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{r.percentage}% du montant total</p>
                    </div>

                    {/* Statut et Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${config.color}`}>
                        <Icon size={12} />
                        {config.label}
                      </span>
                      
                      <div className="flex gap-2">
                        {r.status === "DEMANDE" && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => updateStatus(r.id, "APPROUVE")}
                            disabled={!!actionLoading}
                          >
                            Approuver
                          </Button>
                        )}
                        {r.status === "APPROUVE" && (
                          <Button 
                            size="sm" 
                            className="h-8 text-xs bg-purple-600 hover:bg-purple-700"
                            onClick={() => updateStatus(r.id, "TRAITE")}
                            disabled={!!actionLoading}
                          >
                            Marquer comme payé
                          </Button>
                        )}
                        {(r.status === "DEMANDE" || r.status === "EN_COURS") && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-xs text-red-500 hover:bg-red-50"
                            onClick={() => updateStatus(r.id, "REFUSE")}
                            disabled={!!actionLoading}
                          >
                            Refuser
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium">Aucun dossier trouvé dans cette catégorie.</p>
          </div>
        )}
      </div>
    </div>
  );
}