"use client";
import React, { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Phone, Mail, Award, TrendingUp, BarChart3 } from "lucide-react";

interface Member { 
  id: string; 
  name: string; 
  email: string; 
  phone: string; 
  role: string; 
  leadsCount: number; 
  closesCount: number; 
  perdusCount: number; 
  showUps: number; 
  noShows: number; 
}

const ROLE_COLORS: Record<string, string> = { 
  CLOSER: "bg-emerald-100 text-emerald-700 border-emerald-200", 
  SETTER: "bg-blue-100 text-blue-700 border-blue-200", 
  HOS: "bg-purple-100 text-purple-700 border-purple-200" 
};

export default function EquipePage() {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("ALL");

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setLoading(false); return; }

        const { data: users } = await supabase
          .from("users")
          .select("*")
          .in("role", ["HOS", "CLOSER", "SETTER"]);

        if (!users) { setLoading(false); return; }

        const { data: allLeads } = await supabase
          .from("leads")
          .select("closerId, setterId, status, showUp");

        const leadsArr = allLeads || [];

        const enriched: Member[] = users.map((u) => {
          const asCloser = leadsArr.filter((l) => l.closerId === u.id);
          const asSetter = leadsArr.filter((l) => l.setterId === u.id);
          
          return {
            id: u.id,
            name: u.name || "Anonyme",
            email: u.email || "",
            phone: u.phone || "",
            role: u.role,
            leadsCount: u.role === "CLOSER" ? asCloser.length : asSetter.length,
            closesCount: asCloser.filter((l) => l.status === "CLOSE").length,
            perdusCount: asCloser.filter((l) => l.status === "PERDU").length,
            showUps: asSetter.filter((l) => l.showUp === true).length,
            noShows: asSetter.filter((l) => l.showUp === false).length,
          };
        });

        setMembers(enriched);
      } catch (e) {
        console.error("Erreur Equipe:", e);
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  // Calcul des stats globales de l'équipe
  const globalStats = useMemo(() => {
    const totalCloses = members.reduce((acc, m) => acc + m.closesCount, 0);
    const totalLeads = members.reduce((acc, m) => acc + m.leadsCount, 0);
    return {
      totalCloses,
      avgConv: totalLeads > 0 ? Math.round((totalCloses / totalLeads) * 100) : 0,
      activeMembers: members.length
    };
  }, [members]);

  const filtered = members.filter((m) => filterRole === "ALL" || m.role === filterRole);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-600"></div>
        <p className="text-gray-500 font-medium">Chargement de l'équipe...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mon Équipe</h1>
          <p className="text-gray-500 font-medium">Gestion des performances et collaborateurs</p>
        </div>
        
        <div className="flex bg-white border rounded-xl p-1 shadow-sm">
          {["ALL", "CLOSER", "SETTER", "HOS"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filterRole === r 
                  ? "bg-gray-900 text-white shadow-md" 
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {r === "ALL" ? "TOUS" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Dashboard Équipe */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-orange-600 text-white border-none shadow-lg shadow-orange-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg"><Award size={24} /></div>
            <div>
              <p className="text-orange-100 text-xs font-bold uppercase">Total Closes Team</p>
              <p className="text-2xl font-black">{globalStats.totalCloses}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={24} /></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase">Conversion Moyenne</p>
              <p className="text-2xl font-black text-gray-900">{globalStats.avgConv}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Users size={24} /></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase">Membres Actifs</p>
              <p className="text-2xl font-black text-gray-900">{globalStats.activeMembers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((m) => {
          const tauxCloser = m.leadsCount > 0 ? Math.round((m.closesCount / m.leadsCount) * 100) : 0;
          const totalRDV = m.showUps + m.noShows;
          const tauxSetter = totalRDV > 0 ? Math.round((m.showUps / totalRDV) * 100) : 0;

          return (
            <Card key={m.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
              <div className={`h-1 w-full ${m.role === 'CLOSER' ? 'bg-emerald-500' : m.role === 'SETTER' ? 'bg-blue-500' : 'bg-purple-500'}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-inner">
                      {m.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-none mb-1">{m.name}</p>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${ROLE_COLORS[m.role]}`}>
                        {m.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-400 border-b border-gray-50 pb-4">
                    <a href={`mailto:${m.email}`} className="flex items-center gap-1 hover:text-gray-900 transition-colors"><Mail size={14} /> Email</a>
                    <a href={`tel:${m.phone}`} className="flex items-center gap-1 hover:text-gray-900 transition-colors"><Phone size={14} /> Tel</a>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Volume</p>
                      <p className="text-lg font-black text-gray-900">{m.leadsCount} <span className="text-[10px] font-normal text-gray-400">leads</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {m.role === "CLOSER" ? "Ventes" : "Show-ups"}
                      </p>
                      <p className={`text-lg font-black ${m.role === "CLOSER" ? "text-emerald-600" : "text-blue-600"}`}>
                        {m.role === "CLOSER" ? m.closesCount : m.showUps}
                      </p>
                    </div>
                  </div>

                  {/* Barre de progression de performance */}
                  <div className="pt-2">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Performance</p>
                      <p className="text-xs font-black text-gray-900">{m.role === "CLOSER" ? tauxCloser : tauxSetter}%</p>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${m.role === 'CLOSER' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${m.role === 'CLOSER' ? tauxCloser : tauxSetter}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filtered.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-bold italic">Aucun membre trouvé pour cette catégorie</p>
        </div>
      )}
    </div>
  );
}