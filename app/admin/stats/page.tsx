"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart3, TrendingUp, Users, Euro, Target, 
  Calendar, CheckCircle, Award, Clock, ChevronDown
} from "lucide-react";

type TimeRange = "all" | "today" | "7d" | "30d" | "90d";

export default function StatsPage() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>("all");
  const [stats, setStats] = useState({
    leads: { total: 0, nouveau: 0, contacte: 0, qualifie: 0, rdvPlanifie: 0, rdvEffectue: 0, proposition: 0, negocie: 0, close: 0, perdu: 0, tauxConversion: 0 },
    clients: { total: 0, onboarding: 0, enCours: 0, termine: 0, suspendu: 0, parOffre: {} as Record<string, number> },
    payments: { totalEncaisse: 0, totalPending: 0, nbPaid: 0, nbPending: 0, nbFailed: 0, moyennePanier: 0 },
    rdvs: { total: 0, effectues: 0, noShows: 0, tauxShowUp: 0, parType: {} as Record<string, number> },
    tasks: { total: 0, todo: 0, inProgress: 0, done: 0, tauxCompletion: 0 },
    team: { closers: 0, setters: 0, experts: 0 }
  });

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      
      // Calcul de la date de début
      let startDate: string | null = null;
      const now = new Date();
      if (range === "today") startDate = new Date(now.setHours(0,0,0,0)).toISOString();
      else if (range === "7d") startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
      else if (range === "30d") startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
      else if (range === "90d") startDate = new Date(now.setDate(now.getDate() - 90)).toISOString();

      // Préparation des requêtes avec filtre optionnel
      const query = (table: string) => {
        let q = supabase.from(table).select("*");
        if (startDate && table !== "users") q = q.gte("created_at", startDate);
        return q;
      };

      const [leadsRes, clientsRes, paymentsRes, rdvsRes, tasksRes, usersRes] = await Promise.all([
        query("leads"),
        query("clients"),
        query("payments"),
        query("rdvs"),
        query("tasks"),
        supabase.from("users").select("role"),
      ]);

      const leads = leadsRes.data || [];
      const clients = clientsRes.data || [];
      const payments = paymentsRes.data || [];
      const rdvs = rdvsRes.data || [];
      const tasks = tasksRes.data || [];
      const users = usersRes.data || [];

      const paidPayments = payments.filter((p) => p.status === "PAID");
      const effectues = rdvs.filter((r) => r.status === "EFFECTUE").length;
      const noShows = rdvs.filter((r) => r.status === "NO_SHOW").length;
      const doneTasks = tasks.filter((t) => t.status === "DONE").length;

      const parOffre: Record<string, number> = {};
      clients.forEach((c) => { parOffre[c.offre] = (parOffre[c.offre] || 0) + 1; });

      setStats({
        leads: { 
          total: leads.length, 
          nouveau: leads.filter((l) => l.status === "NOUVEAU").length, 
          contacte: leads.filter((l) => l.status === "CONTACTE").length, 
          qualifie: leads.filter((l) => l.status === "QUALIFIE").length, 
          rdvPlanifie: leads.filter((l) => l.status === "RDV_PLANIFIE").length, 
          rdvEffectue: leads.filter((l) => l.status === "RDV_EFFECTUE").length, 
          proposition: leads.filter((l) => l.status === "PROPOSITION").length, 
          negocie: leads.filter((l) => l.status === "NEGOCIE").length, 
          close: leads.filter((l) => l.status === "CLOSE").length, 
          perdu: leads.filter((l) => l.status === "PERDU").length, 
          tauxConversion: leads.length > 0 ? Math.round((leads.filter((l) => l.status === "CLOSE").length / leads.length) * 100) : 0 
        },
        clients: { total: clients.length, onboarding: clients.filter((c) => c.status === "ONBOARDING").length, enCours: clients.filter((c) => c.status === "EN_COURS").length, termine: clients.filter((c) => c.status === "TERMINE").length, suspendu: clients.filter((c) => c.status === "SUSPENDU").length, parOffre },
        payments: { 
          totalEncaisse: paidPayments.reduce((a, p) => a + (p.amount || 0), 0), 
          totalPending: payments.filter((p) => p.status === "PENDING").reduce((a, p) => a + (p.amount || 0), 0), 
          nbPaid: paidPayments.length, 
          nbPending: payments.filter((p) => p.status === "PENDING").length, 
          nbFailed: payments.filter((p) => p.status === "FAILED").length, 
          moyennePanier: paidPayments.length > 0 ? Math.round(paidPayments.reduce((a, p) => a + (p.amount || 0), 0) / paidPayments.length) : 0 
        },
        rdvs: { total: rdvs.length, effectues, noShows, tauxShowUp: (effectues + noShows) > 0 ? Math.round((effectues / (effectues + noShows)) * 100) : 0, parType: {} },
        tasks: { total: tasks.length, todo: tasks.filter((t) => t.status === "TODO").length, inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length, done: doneTasks, tauxCompletion: tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0 },
        team: { closers: users.filter((u) => u.role === "CLOSER").length, setters: users.filter((u) => u.role === "SETTER").length, experts: users.filter((u) => u.role === "EXPERT").length }
      });
      setLoading(false);
    }
    fetchAll();
  }, [supabase, range]);

  const MetricCard = ({ title, value, sub, color }: { title: string, value: string | number, sub: string, color: string }) => (
    <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
      <div className={`h-1 w-full ${color}`} />
      <CardContent className="p-5">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{title}</p>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-black text-gray-900 italic tracking-tighter">{value}</p>
          <div className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Analytics</h1>
          <p className="text-gray-500 font-medium">Performance du studio</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          {(["all", "today", "7d", "30d", "90d"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                range === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r === "all" ? "Total" : r === "today" ? "Aujourd'hui" : r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center animate-pulse font-black text-gray-300 tracking-widest">MISE À JOUR DES KPI...</div>
      ) : (
        <>
          {/* 1. PIPELINE COMMERCIAL */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="text-gray-900" size={20} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Pipeline Commercial</h2>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard title="Leads Entrants" value={stats.leads.total} sub="Volume" color="bg-gray-200" />
              <MetricCard title="Ventes Closes" value={stats.leads.close} sub="Gagnés" color="bg-emerald-500" />
              <MetricCard title="Deals Perdus" value={stats.leads.perdu} sub="Échecs" color="bg-red-400" />
              <MetricCard title="Efficacité" value={`${stats.leads.tauxConversion}%`} sub="Taux Conv." color="bg-amber-400" />
              <MetricCard title="RDV Pipeline" value={stats.leads.rdvPlanifie + stats.leads.rdvEffectue} sub="En cours" color="bg-blue-500" />
            </div>

            <div className="bg-gray-100 p-2 rounded-2xl">
              <div className="flex h-12 rounded-xl overflow-hidden shadow-inner border border-white">
                {[
                  { val: stats.leads.nouveau, color: "bg-blue-500", label: "Nouveau" },
                  { val: stats.leads.contacte, color: "bg-purple-500", label: "Contacté" },
                  { val: stats.leads.qualifie, color: "bg-cyan-500", label: "Qualifié" },
                  { val: stats.leads.rdvPlanifie, color: "bg-amber-500", label: "RDV" },
                  { val: stats.leads.close, color: "bg-emerald-500", label: "Close" },
                  { val: stats.leads.perdu, color: "bg-red-500", label: "Perdu" },
                ].map((s, i) => s.val > 0 && (
                  <div 
                    key={i} 
                    className={`${s.color} h-full flex items-center justify-center transition-all hover:brightness-110 relative group`}
                    style={{ width: `${(s.val / Math.max(stats.leads.total, 1)) * 100}%` }}
                  >
                    <span className="text-white text-[10px] font-black">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 2. FINANCES */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Euro className="text-gray-900" size={20} />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Performance Financière</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 bg-emerald-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-emerald-800">
                 <div className="relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Chiffre d'affaires encaissé</p>
                   <h3 className="text-5xl font-black italic tracking-tighter my-2">
                     {stats.payments.totalEncaisse.toLocaleString("fr-FR")} €
                   </h3>
                   <div className="flex gap-4 mt-4 text-[10px] font-bold">
                     <span className="bg-emerald-900/50 border border-emerald-800 px-3 py-1 rounded-full">{stats.payments.nbPaid} Paiements</span>
                     <span className="bg-emerald-900/50 border border-emerald-800 px-3 py-1 rounded-full">Ø {stats.payments.moyennePanier}€ / client</span>
                   </div>
                 </div>
                 <Euro className="absolute -right-8 -bottom-8 opacity-10 text-emerald-400" size={160} />
              </div>
              <MetricCard title="Encours (Attente)" value={`${stats.payments.totalPending.toLocaleString()}€`} sub={`${stats.payments.nbPending} factures`} color="bg-amber-400" />
              <MetricCard title="Taux de Complétion" value={`${stats.tasks.tauxCompletion}%`} sub="Tâches faites" color="bg-purple-500" />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 3. SHOW-UP RATE */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-gray-900" size={20} />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Qualité RDV</h2>
              </div>
              <Card className="border-none shadow-sm rounded-3xl bg-white">
                <CardContent className="p-8 flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-5xl font-black italic tracking-tighter text-gray-900">{stats.rdvs.tauxShowUp}%</p>
                    <p className="text-[10px] font-black uppercase text-gray-400 mt-2">Taux Show-up</p>
                  </div>
                  <div className="h-12 w-px bg-gray-100" />
                  <div className="text-center">
                    <p className="text-5xl font-black italic tracking-tighter text-red-500">{stats.rdvs.noShows}</p>
                    <p className="text-[10px] font-black uppercase text-gray-400 mt-2">No-Shows</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 4. TEAM ROLES */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="text-gray-900" size={20} />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Effectifs</h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Closers", count: stats.team.closers, bg: "bg-purple-50", text: "text-purple-700" },
                  { label: "Setters", count: stats.team.setters, bg: "bg-cyan-50", text: "text-cyan-700" },
                  { label: "Experts", count: stats.team.experts, bg: "bg-emerald-50", text: "text-emerald-700" },
                ].map((t) => (
                  <div key={t.label} className={`${t.bg} p-6 rounded-3xl text-center border border-white/50 shadow-sm`}>
                    <p className={`text-2xl font-black ${t.text}`}>{t.count}</p>
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">{t.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}