"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Clock, Plus, Trash2, AlertCircle, X, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils"; // Assurez-vous d'avoir cet utilitaire standard de Shadcn

// --- Types ---
interface Task { 
  id: string; title: string; description: string; status: string; 
  priority: string; dueDate: string; assignedToId: string | null; 
}

const PRIORITY_CONFIG: Record<string, { label: string; class: string }> = {
  URGENT: { label: "Urgent", class: "bg-red-100 text-red-700 border-red-200" },
  HIGH: { label: "Haute", class: "bg-orange-100 text-orange-700 border-orange-200" },
  MEDIUM: { label: "Moyenne", class: "bg-amber-100 text-amber-700 border-amber-200" },
  LOW: { label: "Basse", class: "bg-slate-100 text-slate-600 border-slate-200" }
};

export default function TachesPage() {
  const supabase = createBrowserClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [profileId, setProfileId] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ title: "", desc: "", priority: "MEDIUM", dueDate: "" });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile } = await supabase.from("users").select("id").eq("authId", session.user.id).single();
        if (!profile) return;
        setProfileId(profile.id);

        const { data } = await supabase.from("tasks")
          .select("*")
          .eq("assignedToId", profile.id)
          .order("dueDate", { ascending: true, nullsFirst: false });
        
        if (data) setTasks(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [supabase]);

  // --- Logic ---
  const now = new Date();
  
  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === "TODO").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE").length
  }), [tasks]);

  const filteredTasks = tasks.filter(t => filterStatus === "ALL" || t.status === filterStatus);

  async function toggleStatus(id: string, current: string) {
    const statusMap: Record<string, string> = { "TODO": "IN_PROGRESS", "IN_PROGRESS": "DONE", "DONE": "TODO" };
    const next = statusMap[current];
    
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: next } : t));
    await supabase.from("tasks").update({ status: next, updatedAt: new Date().toISOString() }).eq("id", id);
  }

  async function deleteTask(id: string) {
    if (!confirm("Supprimer cette tâche ?")) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  }

  async function addTask() {
    if (!formData.title.trim()) return;
    const { data, error } = await supabase.from("tasks").insert({
      title: formData.title.trim(),
      description: formData.desc,
      priority: formData.priority,
      dueDate: formData.dueDate || null,
      status: "TODO",
      assignedToId: profileId,
    }).select().single();

    if (data) {
      setTasks(prev => [data, ...prev]);
      setShowForm(false);
      setFormData({ title: "", desc: "", priority: "MEDIUM", dueDate: "" });
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mes Tâches</h1>
          <p className="text-gray-500 text-sm">Gérez vos priorités et votre emploi du temps expert.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-orange-600 hover:bg-orange-700 shadow-sm transition-all">
          {showForm ? <X size={18} className="mr-2"/> : <Plus size={18} className="mr-2"/>}
          {showForm ? "Fermer" : "Nouvelle tâche"}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMiniCard label="Total" value={stats.total} />
        <StatMiniCard label="À faire" value={stats.todo} color="text-blue-600" />
        <StatMiniCard label="En cours" value={stats.inProgress} color="text-amber-600" />
        <StatMiniCard label="En retard" value={stats.overdue} color={stats.overdue > 0 ? "text-red-600" : ""} highlight={stats.overdue > 0} />
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card className="border-orange-200 bg-orange-50/30 shadow-inner animate-in slide-in-from-top-4 duration-300">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Titre de la tâche</label>
                <input 
                  autoFocus
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Ex: Réviser dossier client Dupont"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Priorité</label>
                <select 
                  value={formData.priority} 
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Échéance</label>
                <input 
                  type="date" 
                  value={formData.dueDate} 
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Description (optionnel)</label>
                <input 
                  type="text" 
                  value={formData.desc} 
                  onChange={e => setFormData({...formData, desc: e.target.value})}
                  placeholder="Précisions..."
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button onClick={addTask} disabled={!formData.title} className="bg-gray-900">Enregistrer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["ALL", "TODO", "IN_PROGRESS", "DONE"].map((s) => (
          <button 
            key={s} 
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap border",
              filterStatus === s ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            )}
          >
            {s === "ALL" ? "Toutes" : s === "TODO" ? "À faire" : s === "IN_PROGRESS" ? "En cours" : "Terminées"}
          </button>
        ))}
      </div>

      {/* Liste des tâches */}
      <div className="space-y-3">
        {filteredTasks.map((t) => {
          const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE";
          const priority = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.LOW;
          
          return (
            <Card key={t.id} className={cn(
              "group transition-all hover:shadow-md border-l-4",
              t.status === "DONE" ? "border-l-emerald-500 opacity-75" : isOverdue ? "border-l-red-500" : "border-l-transparent",
              isOverdue && t.status !== "DONE" ? "bg-red-50/30" : "bg-white"
            )}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => toggleStatus(t.id, t.status)}
                    className={cn(
                      "transition-colors rounded-full p-1",
                      t.status === "DONE" ? "text-emerald-500" : t.status === "IN_PROGRESS" ? "text-amber-500" : "text-gray-300 hover:text-gray-500"
                    )}
                  >
                    {t.status === "DONE" ? <CheckCircle size={24} /> : t.status === "IN_PROGRESS" ? <Clock size={24} /> : <Circle size={24} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("font-semibold text-sm truncate", t.status === "DONE" && "text-gray-400 line-through")}>
                      {t.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded uppercase border", priority.class)}>
                        {priority.label}
                      </span>
                      {t.dueDate && (
                        <span className={cn("flex items-center gap-1 text-[11px]", isOverdue && t.status !== "DONE" ? "text-red-600 font-bold" : "text-gray-400")}>
                          <CalendarIcon size={12} />
                          {new Date(t.dueDate).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {t.description && <span className="text-[11px] text-gray-400 italic truncate max-w-[200px]">• {t.description}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => deleteTask(t.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Tout est à jour !</p>
            <p className="text-gray-400 text-xs mt-1">Aucune tâche ne correspond à ce filtre.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatMiniCard({ label, value, color = "text-gray-900", highlight = false }: any) {
  return (
    <Card className={cn("border-none shadow-sm", highlight && "ring-1 ring-red-200 bg-red-50")}>
      <CardContent className="p-4 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-black", color)}>{value}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </CardContent>
    </Card>
  );
}