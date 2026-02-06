"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  XCircle, 
  Mail, 
  Phone, 
  RefreshCw, 
  CalendarX, 
  Clock,
  History
} from "lucide-react";

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
  rdvDate: string; 
  createdAt: string; 
}

export default function NoShowsPage() {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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

        let query = supabase.from("leads").select("*").eq("showUp", false);
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
  const todayCount = leads.filter((l) => l.rdvDate && new Date(l.rdvDate).toDateString() === now.toDateString()).length;

  async function handleReplanifier(id: string) {
    const { error } = await supabase
      .from("leads")
      .update({ status: "RDV_PLANIFIE", showUp: null, updatedAt: new Date().toISOString() })
      .eq("id", id);
    
    if (!error) setLeads(leads.filter((l) => l.id !== id));
  }

  async function handleMarquerPerdu(id: string) {
    const { error } = await supabase
      .from("leads")
      .update({ status: "PERDU", updatedAt: new Date().toISOString() })
      .eq("id", id);
    
    if (!error) setLeads(leads.filter((l) => l.id !== id));
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-red-500"></div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Analyse des absences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase italic">No-Show Recovery</h1>
          <p className="text-gray-500 font-medium">Récupérez vos opportunités manquées</p>
        </div>
        <div className="bg-red-100 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 font-black text-sm">
          <CalendarX size={18} />
          {leads.length} DOSSIERS
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-slate-900 text-white leading-tight">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-black italic">{leads.length}</p>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total à traiter</p>
              </div>
              <History size={32} className="text-slate-700" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-black italic">{todayCount}</p>
                <p className="text-[10px] uppercase font-bold text-red-200">Aujourd'hui</p>
              </div>
              <Clock size={32} className="text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-gray-900">
              <div>
                <p className="text-4xl font-black italic">
                  {leads.reduce((acc, curr) => acc + (curr.ca || 0), 0).toLocaleString()} €
                </p>
                <p className="text-[10px] uppercase font-bold text-gray-400">CA en attente</p>
              </div>
              <XCircle size={32} className="text-gray-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {leads.map((l) => {
          const diffMs = now.getTime() - new Date(l.rdvDate).getTime();
          const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const isUrgent = daysSince <= 1;

          return (
            <Card key={l.id} className={`group transition-all border-none shadow-sm ${isUrgent ? 'ring-1 ring-red-500 bg-red-50/30' : 'bg-white hover:bg-gray-50'}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-4 items-center">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-black text-lg ${isUrgent ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {l.firstName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-gray-900 uppercase text-sm tracking-tight">{l.firstName} {l.lastName}</h3>
                        {isUrgent && <span className="animate-pulse bg-red-600 text-[9px] text-white px-2 py-0.5 rounded-full font-black">ACTION IMMÉDIATE</span>}
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase">{l.activite} • <span className="text-emerald-600">{l.ca.toLocaleString()} €</span></p>
                      <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1 mt-1">
                        <Clock size={10} /> RDV manqué le {new Date(l.rdvDate).toLocaleDateString("fr-FR")} ({daysSince === 0 ? "Aujourd'hui" : `il y a ${daysSince}j`})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-2 rounded-xl md:shadow-none shadow-sm">
                    <a href={`tel:${l.phone}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-black">
                      <Phone size={14} /> APPELER
                    </a>
                    <Button 
                      onClick={() => handleReplanifier(l.id)}
                      className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white font-black text-xs gap-2"
                    >
                      <RefreshCw size={14} /> REPLANIFIER
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => handleMarquerPerdu(l.id)}
                      className="flex-1 md:flex-none text-gray-300 hover:text-red-600 hover:bg-red-50 font-bold text-xs"
                    >
                      ABANDONNER
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {leads.length === 0 && (
          <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-3xl py-20 text-center">
            <p className="text-emerald-600 font-black uppercase tracking-widest text-xl">Tout est propre !</p>
            <p className="text-emerald-500/60 font-bold">Zéro no-show en attente de traitement.</p>
          </div>
        )}
      </div>
    </div>
  );
}