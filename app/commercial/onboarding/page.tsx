"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, CheckCircle, Mail, Phone, Rocket, ArrowRight } from "lucide-react";

interface Client { 
  id: string; offre: string; status: string; 
  progression: number; etape: number; user?: any; 
}

const STEPS = [
  { label: "Bienvenue", pct: 20 },
  { label: "Compta", pct: 40 },
  { label: "Expert", pct: 60 },
  { label: "1er RDV", pct: 80 },
  { label: "Prêt", pct: 100 },
];

export default function OnboardingPage() {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setLoading(false); return; }
        
        // On récupère les clients dont le status est ONBOARDING
        const { data } = await supabase
          .from("clients")
          .select("*, user:userId(name, email, phone)")
          .eq("status", "ONBOARDING")
          .order("createdAt", { ascending: false });
          
          if (data) setClients(data as Client[]);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const stats = {
    total: clients.length,
    debut: clients.filter((c) => (c.progression || 0) < 50).length,
    avances: clients.filter((c) => (c.progression || 0) >= 50).length
  };

  async function setProgression(id: string, pct: number) {
    const updates: any = { 
      progression: pct, 
      updatedAt: new Date().toISOString() 
    };
    
    // Si on arrive à 100%, le client passe en production ("EN_COURS")
    if (pct >= 100) updates.status = "EN_COURS";

    const { error } = await supabase.from("clients").update(updates).eq("id", id);
    
    if (!error) {
      if (pct >= 100) {
        setClients(clients.filter((c) => c.id !== id));
      } else {
        setClients(clients.map((c) => c.id === id ? { ...c, progression: pct } : c));
      }
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initialisation du parcours client...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase italic">Onboarding</h1>
          <p className="text-gray-500 font-medium">Accompagnement des nouveaux comptes</p>
        </div>
        <Rocket className="text-orange-500 mb-2" size={32} />
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatItem label="En cours" val={stats.total} color="text-slate-900" />
        <StatItem label="Démarrage" val={stats.debut} color="text-amber-600" />
        <StatItem label="Phase Finale" val={stats.avances} color="text-emerald-600" />
      </div>

      <div className="grid gap-4">
        {clients.map((c) => {
          const u = c.user ? (Array.isArray(c.user) ? (c.user as any)[0] : c.user) : null;
          const progress = c.progression || 0;

          return (
            <Card key={c.id} className="border-none shadow-sm overflow-hidden group">
              <CardContent className="p-0">
                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-black text-gray-900 uppercase text-sm tracking-tight">
                      {u?.name || "Client Anonyme"}
                    </h3>
                    <div className="flex flex-wrap gap-3 items-center text-[11px] font-bold text-gray-400">
                      <span className="px-2 py-0.5 rounded bg-orange-500 text-white text-[9px] font-black uppercase tracking-tighter">
                        {c.offre}
                      </span>
                      {u?.email && <a href={`mailto:${u.email}`} className="flex items-center gap-1 hover:text-orange-500 transition-colors"><Mail size={12}/> {u.email}</a>}
                      {u?.phone && <a href={`tel:${u.phone}`} className="flex items-center gap-1 hover:text-blue-500 transition-colors"><Phone size={12}/> {u.phone}</a>}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black italic text-orange-500">{progress}</span>
                    <span className="text-[10px] font-black text-gray-300 uppercase">%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-50">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Steps / Buttons */}
                <div className="p-3 bg-gray-50/50 flex flex-wrap gap-2">
                  {STEPS.map((step) => {
                    const isDone = progress >= step.pct;
                    return (
                      <Button 
                        key={step.pct} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setProgression(c.id, step.pct)}
                        className={`
                          h-8 text-[10px] font-black uppercase tracking-tight transition-all
                          ${isDone 
                            ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600" 
                            : "bg-white border-gray-200 text-gray-400 hover:border-orange-500 hover:text-orange-500"
                          }
                        `}
                      >
                        {isDone && <CheckCircle size={12} className="mr-1" />}
                        {step.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {clients.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">Aucun onboarding en attente</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ label, val, color }: { label: string, val: any, color: string }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 text-center">
        <p className={`text-2xl font-black italic ${color}`}>{val}</p>
        <p className="text-[9px] uppercase font-bold text-gray-400 tracking-[0.2em]">{label}</p>
      </CardContent>
    </Card>
  );
}