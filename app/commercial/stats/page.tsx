"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, TrendingUp, Target, Users, 
  Calendar, ArrowUpRight, Loader2, Zap 
} from "lucide-react";

interface Lead { 
  id: string; 
  status: string; 
  temperature: string; 
  ca: number; 
  showUp: boolean | null; 
  createdAt: string; 
}

const PIPELINE_STEPS = ["NOUVEAU", "CONTACTE", "QUALIFIE", "RDV_PLANIFIE", "RDV_EFFECTUE", "PROPOSITION", "NEGOCIE", "CLOSE", "PERDU"];

const STATUS_COLORS: Record<string, string> = { 
  NOUVEAU: "bg-blue-500", 
  CONTACTE: "bg-cyan-500", 
  QUALIFIE: "bg-indigo-500", 
  RDV_PLANIFIE: "bg-amber-500", 
  RDV_EFFECTUE: "bg-orange-500", 
  PROPOSITION: "bg-purple-500", 
  NEGOCIE: "bg-pink-500", 
  CLOSE: "bg-emerald-500", 
  PERDU: "bg-red-500" 
};

export default function CommercialStatsPage() {
  const supabase = createBrowserClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("ALL");

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setLoading(false); return; }

        const { data: profile } = await supabase.from("users").select("id, role").eq("authId", session.user.id).single();
        if (!profile) { setLoading(false); return; }

        let query = supabase.from("leads").select("*");
        if (profile.role === "CLOSER") query = query.eq("closerId", profile.id);
        else if (profile.role === "SETTER") query = query.eq("setterId", profile.id);

        const { data } = await query.order("createdAt", { ascending: false });
        if (data) setLeads(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const now = new Date();
  const filtered = leads.filter((l) => {
    if (period === "ALL") return true;
    if (!l.createdAt) return false;
    const diff = (now.getTime() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (period === "7") return diff <= 7;
    if (period === "30") return diff <= 30;
    if (period === "90") return diff <= 90;
    return true;
  });

  const total = filtered.length;
  const closes = filtered.filter((l) => l.status === "CLOSE").length;
  const perdus = filtered.filter((l) => l.status === "PERDU").length;
  const showUps = filtered.filter((l) => l.showUp === true).length;
  const noShows = filtered.filter((l) => l.showUp === false).length;
  const rdvTotal = showUps + noShows;

  const tauxConversion = total > 0 ? Math.round((closes / total) * 100) : 0;
  const tauxShowUp = rdvTotal > 0 ? Math.round((showUps / rdvTotal) * 100) : 0;
  const caClose = filtered.filter((l) => l.status === "CLOSE").reduce((a, l) => a + (l.ca || 0), 0);
  const caMoyen = closes > 0 ? Math.round(caClose / closes) : 0;

  const pipelineCounts = PIPELINE_STEPS.map((s) => ({ 
    status: s, 
    count: filtered.filter((l) => l.status === s).length 
  }));

  const maxPipeline = Math.max(...pipelineCounts.map((p) => p.count), 1);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-orange-500" size={40} />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Analyse des datas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase italic">Performances</h1>
          <p className="text-gray-500 font-medium">Data-driven insights pour Déclic Entrepreneurs</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: "ALL", label: "Global" }, 
            { key: "7", label: "7J" }, 
            { key: "30", label: "30J" }, 
            { key: "90", label: "90J" }
          ].map((p) => (
            <button 
              key={p.key} 
              onClick={() => setPeriod(p.key)} 
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                period === p.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none bg-emerald-600 text-white shadow-lg shadow-emerald-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <TrendingUp size={24} className="opacity-50" />
              <span className="text-[10px] font-black uppercase bg-emerald-500 px-2 py-1 rounded">ROI Direct</span>
            </div>
            <p className="text-3xl font-black mt-4">{caClose.toLocaleString("fr-FR")} €</p>
            <p className="text-xs font-bold opacity-80 uppercase tracking-wider">CA Encaissé</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-blue-600 text-white shadow-lg shadow-blue-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <Target size={24} className="opacity-50" />
              <span className="text-[10px] font-black uppercase bg-blue-500 px-2 py-1 rounded">Efficacité</span>
            </div>
            <p className="text-3xl font-black mt-4">{tauxConversion}%</p>
            <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Taux de Closing</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-orange-500 text-white shadow-lg shadow-orange-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <Calendar size={24} className="opacity-50" />
              <span className="text-[10px] font-black uppercase bg-orange-400 px-2 py-1 rounded">Présence</span>
            </div>
            <p className="text-3xl font-black mt-4">{tauxShowUp}%</p>
            <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Taux de Show-up</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-gray-900 text-white shadow-lg shadow-gray-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <Zap size={24} className="opacity-50 text-orange-400" />
              <span className="text-[10px] font-black uppercase bg-gray-800 px-2 py-1 rounded text-orange-400">Panier</span>
            </div>
            <p className="text-3xl font-black mt-4">{caMoyen.toLocaleString("fr-FR")} €</p>
            <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Ticket Moyen</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline Visualizer */}
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
            <CardTitle className="text-xs font-black uppercase italic flex items-center gap-2 text-gray-500">
              <BarChart3 size={16} /> Santé du Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {pipelineCounts.map((p) => (
                <div key={p.status} className="group">
                  <div className="flex justify-between items-center mb-1.5 px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">
                      {p.status.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-900">{p.count}</span>
                      <span className="text-[10px] font-bold text-gray-300 w-8 text-right">
                        {total > 0 ? Math.round((p.count / total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${STATUS_COLORS[p.status] || "bg-gray-500"}`}
                      style={{ width: `${(p.count / maxPipeline) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Volume & Temp Grid */}
        <div className="space-y-6">
           {/* Volume Quick View */}
           <Card className="border-none shadow-sm">
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-2xl font-black text-gray-900">{total}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Leads Totaux</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-2xl font-black text-emerald-600">{closes}</p>
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Ventes</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-2xl font-black text-red-600">{perdus}</p>
                <p className="text-[9px] font-black text-red-400 uppercase tracking-tighter">Perdus</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-2xl font-black text-amber-600">{rdvTotal}</p>
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-tighter">RDV Totaux</p>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Breakdown */}
          <Card className="border-none shadow-sm">
             <CardHeader className="px-6 py-4 border-b border-gray-50">
                <CardTitle className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Potentiel de Chauffe</CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                {[
                  { label: "HOT", key: "HOT", color: "bg-red-500", text: "text-red-600" },
                  { label: "WARM", key: "WARM", color: "bg-amber-500", text: "text-amber-600" },
                  { label: "COLD", key: "COLD", color: "bg-blue-400", text: "text-blue-600" },
                ].map((t) => {
                  const count = filtered.filter(l => l.temperature === t.key).length;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={t.label} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className={`text-[10px] font-black uppercase ${t.text}`}>{t.label}</span>
                        <span className="text-sm font-black">{count}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full">
                        <div className={`h-full rounded-full ${t.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}