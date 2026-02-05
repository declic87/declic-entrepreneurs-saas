"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Mail, Phone, ExternalLink, Users, Calendar, Award, TrendingUp } from "lucide-react";

interface Expert { 
  id: string; 
  userId: string; 
  specialite: string; 
  bio: string; 
  calendlyUrl: string; 
  note: number; 
  satisfaction: number; 
  createdAt: string; 
  user?: { name: string; email: string; phone: string }; 
  clientCount: number; 
  rdvCount: number; 
}

export default function ExpertsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"ALL" | "MONTH">("MONTH");

  useEffect(() => {
    fetchExperts();
  }, [period]);

  async function fetchExperts() {
    setLoading(true);
    // 1. Récupérer les experts avec les infos profil de la table users
    const { data: exps } = await supabase
      .from("experts")
      .select("*, user:userId(name, email, phone)");

    if (!exps) { setLoading(false); return; }

    // 2. Préparation des requêtes de stats selon la période
    let clientsQuery = supabase.from("clients").select("id, expertId, createdAt");
    let rdvsQuery = supabase.from("rdvs").select("id, expertId, createdAt");

    if (period === "MONTH") {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      clientsQuery = clientsQuery.gte("createdAt", firstDay);
      rdvsQuery = rdvsQuery.gte("createdAt", firstDay);
    }

    const { data: clients } = await clientsQuery;
    const { data: rdvs } = await rdvsQuery;

    const enriched: Expert[] = exps.map((e: any) => {
      // Gestion du format de retour user (objet ou array selon la config supabase)
      const usr = Array.isArray(e.user) ? e.user[0] : e.user;
      return {
        ...e,
        user: usr || { name: "Inconnu", email: "", phone: "" },
        clientCount: (clients || []).filter((c: any) => c.expertId === e.id).length,
        rdvCount: (rdvs || []).filter((r: any) => r.expertId === e.id).length,
      };
    });

    setExperts(enriched);
    setLoading(false);
  }

  // Calculs des moyennes
  const avgNote = experts.length > 0 ? (experts.reduce((a, e) => a + (e.note || 0), 0) / experts.length).toFixed(1) : "0";
  const avgSat = experts.length > 0 ? Math.round(experts.reduce((a, e) => a + (e.satisfaction || 0), 0) / experts.length) : 0;
  const totalClients = experts.reduce((a, e) => a + e.clientCount, 0);
  const totalRdv = experts.reduce((a, e) => a + e.rdvCount, 0);

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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Experts</h1>
          <p className="text-gray-500 mt-1">Gestion des spécialistes et performances</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg self-start">
          <button 
            onClick={() => setPeriod("MONTH")} 
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${period === "MONTH" ? "bg-white shadow-sm text-orange-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Ce mois
          </button>
          <button 
            onClick={() => setPeriod("ALL")} 
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${period === "ALL" ? "bg-white shadow-sm text-orange-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Total
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-none shadow-sm bg-slate-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-slate-900">{experts.length}</p><p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Experts</p></CardContent></Card>
        <Card className="border-none shadow-sm bg-amber-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{avgNote}</p><p className="text-[10px] uppercase tracking-wider font-semibold text-amber-500">Note Avg</p></CardContent></Card>
        <Card className="border-none shadow-sm bg-emerald-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{avgSat}%</p><p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500">Satisfaction</p></CardContent></Card>
        <Card className="border-none shadow-sm bg-blue-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{totalClients}</p><p className="text-[10px] uppercase tracking-wider font-semibold text-blue-500">Clients</p></CardContent></Card>
        <Card className="border-none shadow-sm bg-purple-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{totalRdv}</p><p className="text-[10px] uppercase tracking-wider font-semibold text-purple-500">RDVs</p></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {experts.map((exp) => (
          <Card key={exp.id} className="hover:shadow-lg transition-all border-slate-100 group">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                    {exp.user?.name ? exp.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
                  </div>
                  {exp.satisfaction > 90 && (
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-orange-100 text-orange-500">
                      <Award size={16} />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900 text-lg group-hover:text-orange-600 transition-colors">{exp.user?.name || "Expert"}</p>
                      <p className="text-xs font-bold text-orange-500 uppercase tracking-wide">{exp.specialite || "Spécialiste"}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold text-amber-700">{exp.note || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 truncate"><Mail size={14} className="text-slate-400" /> {exp.user?.email}</div>
                    <div className="flex items-center gap-2 text-sm text-slate-600"><Phone size={14} className="text-slate-400" /> {exp.user?.phone || "N/A"}</div>
                    {exp.calendlyUrl && (
                      <a href={exp.calendlyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-orange-600 font-medium hover:underline">
                        <ExternalLink size={14} /> Calendly
                      </a>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 mt-4 line-clamp-2 italic">"{exp.bio || "Aucune description disponible."}"</p>

                  <div className="flex items-center gap-6 mt-5 pt-4 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Clients</span>
                      <div className="flex items-center gap-1 font-bold text-slate-700"><Users size={14} className="text-blue-500" /> {exp.clientCount}</div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">RDVs</span>
                      <div className="flex items-center gap-1 font-bold text-slate-700"><Calendar size={14} className="text-purple-500" /> {exp.rdvCount}</div>
                    </div>
                    <div className="flex flex-col ml-auto">
                      <span className="text-[10px] font-bold text-slate-400 uppercase text-right">Satisfaction</span>
                      <div className="flex items-center gap-1 font-bold text-emerald-600"><TrendingUp size={14} /> {exp.satisfaction}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {experts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Users size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Aucun expert enregistré pour le moment</p>
        </div>
      )}
    </div>
  );
}