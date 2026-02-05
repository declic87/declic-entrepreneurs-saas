"use client";
import React, { useEffect, useState, useMemo } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Calendar, 
  Target, 
  XCircle, 
  Flame, 
  ThermometerSun, 
  Snowflake, 
  TrendingUp, 
  AlertCircle,
  Phone,
  Mail,
  Zap
} from "lucide-react";
import Link from "next/link";

// Types & Config
interface Lead { 
  id: string; 
  firstName: string; 
  lastName: string; 
  email: string; 
  phone: string; 
  activite: string; 
  ca: number; 
  status: string; 
  temperature: string; 
  showUp: boolean | null; 
  closerId: string; 
  setterId: string; 
  rdvDate: string; 
  createdAt: string; 
}

const STATUS_COLORS: Record<string, string> = { 
  NOUVEAU: "bg-blue-100 text-blue-700", 
  CONTACTE: "bg-cyan-100 text-cyan-700", 
  QUALIFIE: "bg-indigo-100 text-indigo-700", 
  RDV_PLANIFIE: "bg-amber-100 text-amber-700", 
  RDV_EFFECTUE: "bg-orange-100 text-orange-700", 
  PROPOSITION: "bg-purple-100 text-purple-700", 
  NEGOCIE: "bg-pink-100 text-pink-700", 
  CLOSE: "bg-emerald-100 text-emerald-700", 
  PERDU: "bg-red-100 text-red-700" 
};

const PIPELINE_STEPS = ["NOUVEAU", "CONTACTE", "QUALIFIE", "RDV_PLANIFIE", "RDV_EFFECTUE", "PROPOSITION", "NEGOCIE", "CLOSE", "PERDU"];

export default function CommercialDashboard() {
  const supabase = createClientComponentClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setLoading(false); return; }

        const { data: profile } = await supabase
          .from("users")
          .select("id, role")
          .eq("authId", session.user.id)
          .single();

        if (!profile) { setLoading(false); return; }
        setRole(profile.role);

        let query = supabase.from("leads").select("*");
        if (profile.role === "CLOSER") { query = query.eq("closerId", profile.id); }
        else if (profile.role === "SETTER") { query = query.eq("setterId", profile.id); }

        const { data } = await query.order("createdAt", { ascending: false });
        if (data) setLeads(data);
      } catch (e) { 
        console.error("Erreur Fetch:", e); 
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  // Calculs mémoïsés pour la performance
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const total = leads.length;
    const closes = leads.filter(l => l.status === "CLOSE").length;
    
    return {
      total,
      rdvPlanifies: leads.filter(l => l.status === "RDV_PLANIFIE").length,
      closes,
      noShows: leads.filter(l => l.showUp === false).length,
      taux: total > 0 ? Math.round((closes / total) * 100) : 0,
      rdvToday: leads.filter(l => l.rdvDate && new Date(l.rdvDate).toDateString() === today).length,
      hots: leads.filter(l => l.temperature === "HOT" && !["CLOSE", "PERDU"].includes(l.status)).length,
      urgents: leads.filter(l => (l.temperature === "HOT" && !["CLOSE", "PERDU"].includes(l.status)) || l.showUp === false)
    };
  }, [leads]);

  const pipelineCounts = PIPELINE_STEPS.map(s => ({
    status: s,
    count: leads.filter(l => l.status === s).length
  }));
  const maxCount = Math.max(...pipelineCounts.map(p => p.count), 1);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-opacity-20 border-t-blue-600"></div>
        <p className="text-gray-400 font-medium animate-pulse">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Statistique */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Vue d'ensemble</h1>
          <p className="text-gray-500 font-medium italic">Analyse de performance • {role}</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold border border-emerald-100 shadow-sm">
          <Zap size={16} fill="currentColor" /> Synchronisé avec Supabase
        </div>
      </div>

      {/* Cartes de Score (Grid 5 colonnes optimisée) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Leads Actifs", value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "RDV Planifiés", value: stats.rdvPlanifies, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Signatures", value: stats.closes, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Taux de Close", value: stats.taux + "%", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "No-Shows", value: stats.noShows, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm group hover:scale-[1.02] transition-transform">
            <CardContent className="p-5">
              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-4`}>
                <s.icon size={22} />
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tighter">{s.value}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section Pipeline Visuel */}
      <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden">
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-bold text-slate-400 uppercase text-xs tracking-[0.2em]">Entonnoir de Conversion</h2>
            <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-400 italic">Volume par étape</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {pipelineCounts.map((p) => (
              <div key={p.status} className="flex-1 flex flex-col items-center gap-3 group relative">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-700 ease-out group-hover:brightness-150 ${STATUS_COLORS[p.status]?.split(' ')[0] || "bg-slate-700"}`}
                  style={{ height: `${(p.count / maxCount) * 100}%`, minHeight: '6px' }}
                >
                  {p.count > 0 && <div className="text-[11px] font-black text-center pt-2">{p.count}</div>}
                </div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter truncate w-full text-center">
                  {p.status.replace("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Liste des leads récents */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-gray-900 text-lg uppercase tracking-tight">Flux de Leads</h2>
              <Link href="/commercial/leads" className="text-xs font-bold text-blue-600 hover:underline">VOIR TOUT →</Link>
            </div>
            <div className="space-y-3">
              {leads.slice(0, 6).map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${l.temperature === 'HOT' ? 'bg-red-500 animate-pulse' : 'bg-blue-300'}`} />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{l.firstName} {l.lastName}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{l.activite}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-lg ${STATUS_COLORS[l.status] || "bg-gray-100"}`}>
                      {l.status}
                    </span>
                  </div>
                </div>
              ))}
              {leads.length === 0 && <div className="text-center py-10 text-gray-400 italic">Aucune donnée disponible</div>}
            </div>
          </CardContent>
        </Card>

        {/* Alertes & Actions Prioritaires */}
        <Card className="border-none shadow-sm bg-red-50/30 border border-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-red-900 text-lg uppercase tracking-tight flex items-center gap-2">
                <AlertCircle size={20} /> Actions Critiques
              </h2>
              <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-1 rounded-md">{stats.urgents.length}</span>
            </div>
            <div className="space-y-3">
              {stats.urgents.slice(0, 6).map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-red-100 shadow-sm group">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{l.firstName} {l.lastName}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="text-red-500 italic">{l.showUp === false ? "⚠️ NO-SHOW" : "🔥 OPPORTUNITÉ HOT"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {l.phone && (
                      <a href={`tel:${l.phone}`} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Phone size={14} />
                      </a>
                    )}
                    {l.email && (
                      <a href={`mailto:${l.email}`} className="p-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">
                        <Mail size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {stats.urgents.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-emerald-600 font-bold text-sm italic">Tout est sous contrôle ! ✨</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}