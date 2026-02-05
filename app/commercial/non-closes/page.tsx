"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, Flame, ThermometerSun, Snowflake, 
  Mail, Phone, ArrowRight, Target, XCircle,
  Briefcase, TrendingUp
} from "lucide-react";

interface Lead { 
  id: string; firstName: string; lastName: string; email: string; 
  phone: string; activite: string; ca: number; status: string; 
  temperature: string; rdvDate: string; 
}

const STATUS_COLORS: Record<string, string> = { 
  RDV_EFFECTUE: "bg-orange-100 text-orange-700 border-orange-200", 
  PROPOSITION: "bg-purple-100 text-purple-700 border-purple-200", 
  NEGOCIE: "bg-pink-100 text-pink-700 border-pink-200" 
};

export default function NonClosesPage() {
  const supabase = createBrowserClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setLoading(false); return; }
        const { data: profile } = await supabase.from("users").select("id, role").eq("authId", session.user.id).single();
        if (!profile) { setLoading(false); return; }

        let query = supabase.from("leads").select("*").in("status", ["RDV_EFFECTUE", "PROPOSITION", "NEGOCIE"]);
        if (profile.role === "CLOSER") query = query.eq("closerId", profile.id);
        else if (profile.role === "SETTER") query = query.eq("setterId", profile.id);

        const { data } = await query.order("rdvDate", { ascending: false });
        if (data) setLeads(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const now = new Date();
  const stats = {
    rdv: leads.filter(l => l.status === "RDV_EFFECTUE").length,
    prop: leads.filter(l => l.status === "PROPOSITION").length,
    nego: leads.filter(l => l.status === "NEGOCIE").length,
    totalCa: leads.reduce((acc, curr) => acc + (curr.ca || 0), 0)
  };

  async function avancerStatus(id: string, newStatus: string) {
    const { error } = await supabase.from("leads").update({ 
      status: newStatus, 
      updatedAt: new Date().toISOString() 
    }).eq("id", id);
    
    if (!error) {
      if (["CLOSE", "PERDU"].includes(newStatus)) {
        setLeads(leads.filter(l => l.id !== id));
      } else {
        setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
      }
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      <p className="text-xs font-black text-gray-400 uppercase">Chargement du pipe...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase italic italic">Pipeline Actif</h1>
          <p className="text-gray-500 font-medium">{leads.length} opportunités chaudes en cours</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pipeline Total" val={stats.totalCa.toLocaleString() + " €"} color="text-slate-900" />
        <StatCard label="RDV Faits" val={stats.rdv} color="text-orange-600" />
        <StatCard label="Propositions" val={stats.prop} color="text-purple-600" />
        <StatCard label="Négociations" val={stats.nego} color="text-pink-600" />
      </div>

      {/* List */}
      <div className="space-y-3">
        {leads.map((l) => {
          const daysSince = l.rdvDate ? Math.floor((now.getTime() - new Date(l.rdvDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
          return (
            <Card key={l.id} className="border-none shadow-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{l.firstName} {l.lastName}</p>
                      {l.temperature === "HOT" && <Flame size={14} className="text-red-500 fill-red-500" />}
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${STATUS_COLORS[l.status]}`}>
                        {l.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase">
                      <span className="flex items-center gap-1"><Briefcase size={12}/> {l.activite}</span>
                      <span className="flex items-center gap-1 text-emerald-600"><TrendingUp size={12}/> {l.ca.toLocaleString()} €</span>
                      {daysSince > 7 && <span className="flex items-center gap-1 text-red-500"><Clock size={12}/> BLOQUÉPUIS {daysSince}j</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 mr-4">
                       {l.email && <a href={`mailto:${l.email}`} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-orange-500 transition-colors"><Mail size={16} /></a>}
                       {l.phone && <a href={`tel:${l.phone}`} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"><Phone size={16} /></a>}
                    </div>

                    <div className="flex gap-2">
                      {l.status === "RDV_EFFECTUE" && (
                        <Button variant="outline" size="sm" onClick={() => avancerStatus(l.id, "PROPOSITION")} className="font-black text-[10px] uppercase border-2 border-purple-200 text-purple-600 hover:bg-purple-50">
                          Envoyer Prop <ArrowRight size={14} className="ml-1" />
                        </Button>
                      )}
                      {l.status === "PROPOSITION" && (
                        <Button variant="outline" size="sm" onClick={() => avancerStatus(l.id, "NEGOCIE")} className="font-black text-[10px] uppercase border-2 border-pink-200 text-pink-600 hover:bg-pink-50">
                          Négocier <ArrowRight size={14} className="ml-1" />
                        </Button>
                      )}
                      <Button onClick={() => avancerStatus(l.id, "CLOSE")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase">
                        <Target size={14} className="mr-1" /> Closer
                      </Button>
                      <Button variant="ghost" onClick={() => avancerStatus(l.id, "PERDU")} className="text-gray-300 hover:text-red-600 font-bold text-[10px] uppercase">
                        <XCircle size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, val, color }: { label: string, val: any, color: string }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 text-center">
        <p className={`text-xl font-black italic ${color}`}>{val}</p>
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{label}</p>
      </CardContent>
    </Card>
  );
}