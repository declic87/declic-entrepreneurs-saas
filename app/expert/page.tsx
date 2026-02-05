"use client";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

// Interfaces alignées avec la base de données
interface Client {
  id: string;
  offre: string;
  status: string;
  progression: number;
  first_name?: string;
  last_name?: string;
}

interface Rdv {
  id: string;
  type: string;
  status: string;
  date: string;
  duration: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string; // Corrigé
}

export default function ExpertDashboard() {
  const supabase = createClientComponentClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoading(false);
          return;
        }

        // 1. Profil de l'utilisateur (on utilise 'id' qui match l'authId)
        const { data: profile } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", session.user.id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        // 2. Récupération de l'expert lié (user_id avec underscore)
        const { data: expert } = await supabase
          .from("experts")
          .select("id")
          .eq("user_id", profile.id)
          .single();

        // Si pas expert et pas admin, on arrête
        if (!expert && profile.role !== "ADMIN") {
          setLoading(false);
          return;
        }

        const expertId = expert?.id;

        if (expertId) {
          // 3. Clients (on utilise expert_id)
          const { data: cl } = await supabase
            .from("clients")
            .select("*")
            .eq("expert_id", expertId);
          if (cl) setClients(cl);

          // 4. RDVs
          const { data: rv } = await supabase
            .from("rdvs")
            .select("*")
            .eq("expert_id", expertId)
            .order("date", { ascending: true });
          if (rv) setRdvs(rv);
        }

        // 5. Tâches (assigned_to_id et due_date avec underscores)
        const { data: tk } = await supabase
          .from("tasks")
          .select("*")
          .eq("assigned_to_id", profile.id)
          .order("due_date", { ascending: true });
        if (tk) setTasks(tk);

      } catch (e) {
        console.error("Erreur Fetch Dashboard:", e);
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const now = new Date();
  const today = now.toDateString();

  // Stats calculées
  const totalClients = clients.length;
  const enCours = clients.filter((c) => c.status === "EN_COURS").length;
  const rdvToday = rdvs.filter((r) => r.date && new Date(r.date).toDateString() === today).length;
  const tasksTodo = tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS").length;
  const tasksOverdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== "DONE").length;

  const nextRdvs = rdvs.filter((r) => r.date && new Date(r.date) >= now && r.status !== "ANNULE").slice(0, 5);
  const todoTasks = tasks.filter((t) => t.status !== "DONE").slice(0, 6);

  const PRIORITY_COLORS: Record<string, string> = {
    URGENT: "bg-red-100 text-red-700",
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-gray-100 text-gray-600",
  };

  const STATUS_COLORS: Record<string, string> = {
    PLANIFIE: "bg-blue-100 text-blue-700",
    CONFIRME: "bg-cyan-100 text-cyan-700",
    EFFECTUE: "bg-emerald-100 text-emerald-700",
    ANNULE: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Expert</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* Cartes de Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-900">{totalClients}</p><p className="text-xs text-gray-500">Clients total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{enCours}</p><p className="text-xs text-gray-500">En cours</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{rdvToday}</p><p className="text-xs text-gray-500">RDV aujourd'hui</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{tasksTodo}</p><p className="text-xs text-gray-500">Tâches en cours</p></CardContent></Card>
        <Card className={tasksOverdue > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="p-4 text-center">
            <p className={"text-2xl font-bold " + (tasksOverdue > 0 ? "text-red-600" : "text-gray-600")}>{tasksOverdue}</p>
            <p className="text-xs text-gray-500">En retard</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Prochains RDV */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><Calendar size={18} />Prochains RDV</h2>
              <Link href="/expert/agenda" className="text-sm text-orange-500 hover:text-orange-700">Voir tout</Link>
            </div>
            <div className="space-y-2">
              {nextRdvs.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{r.type}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(r.date).toLocaleDateString("fr-FR")} à {new Date(r.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={"px-2 py-0.5 text-xs font-medium rounded " + (STATUS_COLORS[r.status] || "bg-gray-100")}>{r.status}</span>
                </div>
              ))}
              {nextRdvs.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aucun RDV à venir</p>}
            </div>
          </CardContent>
        </Card>

        {/* Tâches */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><CheckCircle size={18} />Tâches à faire</h2>
              <Link href="/expert/taches" className="text-sm text-orange-500 hover:text-orange-700">Voir tout</Link>
            </div>
            <div className="space-y-2">
              {todoTasks.map((t) => {
                const overdue = t.due_date && new Date(t.due_date) < now && t.status !== "DONE";
                return (
                  <div key={t.id} className={"flex items-center justify-between p-3 rounded-lg " + (overdue ? "bg-red-50 border border-red-100" : "bg-gray-50")}>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{t.title}</p>
                      {t.due_date && <p className={"text-xs " + (overdue ? "text-red-500" : "text-gray-500")}>{new Date(t.due_date).toLocaleDateString("fr-FR")}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={"px-2 py-0.5 text-[10px] font-medium rounded " + (PRIORITY_COLORS[t.priority] || "bg-gray-100")}>{t.priority}</span>
                      {t.status === "IN_PROGRESS" && <Clock size={14} className="text-amber-500" />}
                    </div>
                  </div>
                );
              })}
              {todoTasks.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aucune tâche en cours</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mes Clients */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Users size={18} />Mes clients récents</h2>
            <Link href="/expert/clients" className="text-sm text-orange-500 hover:text-orange-700">Voir tout</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {clients.slice(0, 6).map((c) => (
              <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900 text-sm">
                  {c.first_name ? `${c.first_name} ${c.last_name}` : "Client"}
                </p>
                <p className="text-xs text-gray-500">{c.offre}</p>
                <div className="mt-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{ width: (c.progression || 0) + "%" }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{c.progression || 0}%</p>
                </div>
              </div>
            ))}
            {clients.length === 0 && <p className="text-gray-400 text-sm text-center py-4 col-span-3">Aucun client assigné</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}