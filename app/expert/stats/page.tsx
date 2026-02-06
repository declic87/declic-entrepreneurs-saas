"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Calendar, CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";

// --- Types & Config ---
interface Client { id: string; offre: string; status: string; progression: number; }
interface Rdv { id: string; status: string; date: string; }
interface Task { id: string; status: string; dueDate: string; }

const STATUS_COLORS: Record<string, string> = { 
  ONBOARDING: "bg-blue-500", 
  EN_COURS: "bg-orange-500", 
  TERMINE: "bg-emerald-500", 
  SUSPENDU: "bg-slate-400" 
};

const OFFRE_COLORS: Record<string, string> = { 
  STARTER: "bg-blue-400", 
  PRO: "bg-indigo-500", 
  EXPERT: "bg-purple-600", 
  DAF: "bg-rose-500" 
};

export default function ExpertStatsPage() {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [data, setData] = useState({ clients: [] as Client[], rdvs: [] as Rdv[], tasks: [] as Task[] });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("ALL");

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile } = await supabase.from("users").select("id").eq("authId", session.user.id).single();
        if (!profile) return;

        const { data: expert } = await supabase.from("experts").select("id").eq("userId", profile.id).single();
        
        // Requêtes parallèles pour la performance
        const [clientsRes, rdvsRes, tasksRes] = await Promise.all([
          expert ? supabase.from("clients").select("id, offre, status, progression").eq("expertId", expert.id) : { data: [] },
          expert ? supabase.from("rdvs").select("id, status, date").eq("expertId", expert.id) : { data: [] },
          supabase.from("tasks").select("id, status, dueDate").eq("assignedToId", profile.id)
        ]);

        setData({
          clients: clientsRes.data || [],
          rdvs: rdvsRes.data || [],
          tasks: tasksRes.data || []
        });
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  // --- Logic ---
  const now = new Date();
  const filterByPeriod = (dateStr: string) => {
    if (period === "ALL" || !dateStr) return true;
    const diff = (now.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= parseInt(period);
  };

  const filteredRdvs = data.rdvs.filter(r => filterByPeriod(r.date));
  const filteredTasks = data.tasks.filter(t => filterByPeriod(t.dueDate));

  const stats = {
    progression: data.clients.length > 0 ? Math.round(data.clients.reduce((a, c) => a + (c.progression || 0), 0) / data.clients.length) : 0,
    rdvRate: filteredRdvs.length > 0 ? Math.round((filteredRdvs.filter(r => r.status === "EFFECTUE").length / filteredRdvs.length) * 100) : 0,
    taskRate: filteredTasks.length > 0 ? Math.round((filteredTasks.filter(t => t.status === "DONE").length / filteredTasks.length) * 100) : 0,
    overdue: data.tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE").length
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500"></div>
      <p className="text-gray-400 text-sm animate-pulse">Calcul des indicateurs...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Performance</h1>
          <p className="text-gray-500">Analyse de votre activité et suivi client</p>
        </div>
        <div className="inline-flex bg-gray-100 p-1 rounded-xl">
          {[
            { k: "ALL", l: "Global" },
            { k: "7", l: "7j" },
            { k: "30", l: "30j" },
            { k: "90", l: "3 mois" }
          ].map((p) => (
            <button
              key={p.k}
              onClick={() => setPeriod(p.k)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                period === p.k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Portefeuille" value={data.clients.length} sub="Clients actifs" icon={<Users className="text-blue-500" />} />
        <StatCard title="Progression" value={`${stats.progression}%`} sub="Moyenne globale" icon={<TrendingUp className="text-orange-500" />} />
        <StatCard title="Assiduité RDV" value={`${stats.rdvRate}%`} sub="Taux de complétion" icon={<Calendar className="text-purple-500" />} />
        <StatCard title="Productivité" value={`${stats.taskRate}%`} sub="Tâches terminées" icon={<CheckCircle className="text-emerald-500" />} />
      </div>

      {/* Alerts & Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`border-none shadow-sm ${stats.overdue > 0 ? 'bg-red-50 ring-1 ring-red-100' : 'bg-white'}`}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tâches critiques</p>
              <h3 className={`text-3xl font-bold ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>{stats.overdue}</h3>
              <p className="text-xs text-gray-400 mt-1">Échéances dépassées</p>
            </div>
            <div className={`p-3 rounded-xl ${stats.overdue > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={stats.overdue > 0 ? 'text-red-600' : 'text-gray-400'} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Volume RDV</p>
              <h3 className="text-3xl font-bold text-gray-900">{filteredRdvs.length}</h3>
              <p className="text-xs text-gray-400 mt-1">Sur la période sélectionnée</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Clock className="text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">RDV Annulés</p>
              <h3 className="text-3xl font-bold text-gray-900">{filteredRdvs.filter(r => r.status === "ANNULE").length}</h3>
              <p className="text-xs text-gray-400 mt-1 text-red-500">Taux de perte : {filteredRdvs.length > 0 ? Math.round((filteredRdvs.filter(r => r.status === "ANNULE").length / filteredRdvs.length) * 100) : 0}%</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <BarChart3 className="text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Horizontal Bar Charts */}
      <div className="grid md:grid-cols-2 gap-8">
        <ChartSection 
          title="Répartition par Statut" 
          data={["ONBOARDING", "EN_COURS", "TERMINE", "SUSPENDU"].map(s => ({
            label: s, 
            count: data.clients.filter(c => c.status === s).length,
            color: STATUS_COLORS[s]
          }))} 
        />
        <ChartSection 
          title="Distribution des Offres" 
          data={Array.from(new Set(data.clients.map(c => c.offre))).filter(Boolean).map(o => ({
            label: o, 
            count: data.clients.filter(c => c.offre === o).length,
            color: OFFRE_COLORS[o] || "bg-gray-400"
          }))} 
        />
      </div>
    </div>
  );
}

// --- Sous-composants pour la clarté ---

function StatCard({ title, value, sub, icon }: { title: string, value: string | number, sub: string, icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ChartSection({ title, data }: { title: string, data: any[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length > 0 ? data.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
              <span>{item.label.replace("_", " ")}</span>
              <span>{item.count}</span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        )) : <p className="text-center py-10 text-gray-400 text-sm italic">Aucune donnée disponible</p>}
      </CardContent>
    </Card>
  );
}