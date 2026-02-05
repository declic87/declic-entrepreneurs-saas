"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Flame, User, ArrowRight } from "lucide-react";
import Link from "next/link";

const STAGES = [
  { id: "NOUVEAU", label: "Nouveau", color: "bg-blue-500" },
  { id: "QUALIFIE", label: "Qualifié", color: "bg-purple-500" },
  { id: "RDV_PLANIFIE", label: "RDV Planifié", color: "bg-amber-500" },
  { id: "CLOSE", label: "Clos (Gagné)", color: "bg-emerald-500" },
  { id: "PERDU", label: "Perdu", color: "bg-red-500" }
];

export default function PipelinePage() {
  const supabase = createBrowserClient();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    const { data } = await supabase.from("leads").select("*").order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  }

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">Chargement du pipeline...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Mon Pipeline</h1>
        <Badge variant="outline" className="bg-white">{leads.length} Prospects au total</Badge>
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-6">
        {STAGES.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="font-bold text-xs uppercase tracking-widest text-slate-500">{stage.label}</h2>
              <div className={`h-1.5 w-10 rounded-full ${stage.color}`} />
            </div>

            <div className="space-y-4">
              {leads.filter(l => l.status === stage.id).map((lead) => (
                <Link href={`/admin/pipeline/${lead.id}`} key={lead.id} className="block group">
                  <Card className="border-none shadow-sm group-hover:shadow-md group-hover:translate-y-[-2px] transition-all">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-slate-800 truncate pr-2">{lead.name}</span>
                        {lead.temperature === 'HOT' && <Flame size={16} className="text-orange-500 fill-orange-500" />}
                      </div>
                      
                      <p className="text-xs text-slate-500 mb-4 truncate">{lead.email}</p>

                      <div className="flex items-center justify-between">
                         {lead.next_reminder ? (
                           <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md ${
                             new Date(lead.next_reminder) < new Date() 
                             ? 'bg-red-100 text-red-600 animate-pulse' 
                             : 'bg-blue-50 text-blue-600'
                           }`}>
                             <Calendar size={12} />
                             {new Date(lead.next_reminder).toLocaleDateString('fr-FR')}
                           </div>
                         ) : <div />}
                         <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {leads.filter(l => l.status === stage.id).length === 0 && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl h-24 flex items-center justify-center text-slate-300 text-xs italic">
                  Aucun prospect
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}