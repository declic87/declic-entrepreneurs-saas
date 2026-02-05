"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Flame, ThermometerSun, Snowflake, ArrowRight, 
  Target, XCircle, LayoutGrid, List, Mail, Phone, 
  ChevronRight, MoreHorizontal
} from "lucide-react";

interface Lead { 
  id: string; firstName: string; lastName: string; email: string; 
  phone: string; activite: string; ca: number; status: string; 
  temperature: string; showUp: boolean | null; rdvDate: string; createdAt: string; 
}

const PIPELINE_STEPS = [
  "NOUVEAU", "CONTACTE", "QUALIFIE", "RDV_PLANIFIE", 
  "RDV_EFFECTUE", "PROPOSITION", "NEGOCIE", "CLOSE", "PERDU"
];

const STATUS_COLORS: Record<string, string> = { 
  NOUVEAU: "bg-blue-100 text-blue-700 border-blue-200", 
  CONTACTE: "bg-cyan-100 text-cyan-700 border-cyan-200", 
  QUALIFIE: "bg-indigo-100 text-indigo-700 border-indigo-200", 
  RDV_PLANIFIE: "bg-amber-100 text-amber-700 border-amber-200", 
  RDV_EFFECTUE: "bg-orange-100 text-orange-700 border-orange-200", 
  PROPOSITION: "bg-purple-100 text-purple-700 border-purple-200", 
  NEGOCIE: "bg-pink-100 text-pink-700 border-pink-200", 
  CLOSE: "bg-emerald-100 text-emerald-700 border-emerald-200", 
  PERDU: "bg-red-100 text-red-700 border-red-200" 
};

export default function PipelinePage() {
  const supabase = createBrowserClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "table">("kanban");

  useEffect(() => {
    async function fetchLeads() {
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
    fetchLeads();
  }, [supabase]);

  async function moveStatus(id: string, newStatus: string) {
    const { error } = await supabase.from("leads").update({ 
      status: newStatus, 
      updatedAt: new Date().toISOString() 
    }).eq("id", id);
    
    if (!error) {
      setLeads(leads.map((l) => l.id === id ? { ...l, status: newStatus } : l));
    }
  }

  const pipelineCounts = PIPELINE_STEPS.map((s) => ({
    status: s,
    count: leads.filter((l) => l.status === s).length,
    totalCa: leads.filter((l) => l.status === s).reduce((acc, curr) => acc + (curr.ca || 0), 0)
  }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calcul du flux...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase italic">Pipeline Global</h1>
          <p className="text-gray-500 font-medium">{leads.length} leads actifs dans l'entonnoir</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setView("kanban")} 
            className={`p-2 rounded-lg transition-all ${view === "kanban" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setView("table")} 
            className={`p-2 rounded-lg transition-all ${view === "table" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Overview Bar */}
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
        {pipelineCounts.map((p) => (
          <div key={p.status} className="bg-white p-2 rounded-lg border border-gray-100 text-center">
             <p className="text-[9px] font-black text-gray-400 uppercase truncate mb-1">{p.status.replace("_", " ")}</p>
             <p className="text-sm font-black text-gray-900">{p.count}</p>
          </div>
        ))}
      </div>

      {view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
          {PIPELINE_STEPS.map((step) => {
            const stepLeads = leads.filter((l) => l.status === step);
            const stepCa = stepLeads.reduce((acc, curr) => acc + (curr.ca || 0), 0);
            
            return (
              <div key={step} className="min-w-[280px] w-[280px] flex-shrink-0">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${STATUS_COLORS[step]}`}>
                    {step.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">{stepCa.toLocaleString()} €</span>
                </div>
                
                <div className="bg-gray-50/50 rounded-2xl p-2 space-y-3 border-2 border-dashed border-gray-100 min-h-[500px]">
                  {stepLeads.map((l) => (
                    <Card key={l.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1">
                            {l.temperature === "HOT" && <Flame size={12} className="text-red-500 fill-red-500" />}
                            <p className="font-black text-gray-900 text-xs uppercase italic">{l.firstName} {l.lastName}</p>
                          </div>
                          <button className="text-gray-300 hover:text-gray-600"><MoreHorizontal size={14}/></button>
                        </div>
                        
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">{l.activite}</p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-emerald-600 italic">{(l.ca || 0).toLocaleString()} €</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {step !== "CLOSE" && (
                              <button 
                                onClick={() => {
                                  const idx = PIPELINE_STEPS.indexOf(step);
                                  if (idx < PIPELINE_STEPS.length - 2) moveStatus(l.id, PIPELINE_STEPS[idx + 1]);
                                }} 
                                className="p-1 bg-white border border-gray-100 rounded shadow-sm text-orange-500"
                              >
                                <ChevronRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400">Lead</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400">Business</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400">CA Est.</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400">Statut</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-black text-xs text-gray-900 uppercase italic">{l.firstName} {l.lastName}</td>
                      <td className="p-4 text-xs font-bold text-gray-500 uppercase">{l.activite}</td>
                      <td className="p-4 text-xs font-black text-emerald-600 italic">{l.ca.toLocaleString()} €</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[9px] font-black rounded uppercase border ${STATUS_COLORS[l.status]}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                           <Button size="sm" variant="ghost" onClick={() => moveStatus(l.id, "CLOSE")} className="h-7 text-emerald-600 hover:bg-emerald-50 font-black text-[9px] uppercase"><Target size={12} className="mr-1"/> Close</Button>
                           <Button size="sm" variant="ghost" onClick={() => moveStatus(l.id, "PERDU")} className="h-7 text-red-400 hover:bg-red-50 font-black text-[9px] uppercase"><XCircle size={12} className="mr-1"/> Out</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </Card>
      )}
    </div>
  );
}