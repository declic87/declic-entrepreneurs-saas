"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Clock, AlertCircle, Trash2, Filter, User, Calendar as CalendarIcon } from "lucide-react";

interface Task { 
  id: string; title: string; description: string; priority: string; 
  status: string; assignedToId: string | null; clientId: string | null; 
  dueDate: string; completedAt: string; createdAt: string; 
  assignedName?: string; clientName?: string; 
}

interface UserOption { id: string; name: string; }

const PRIORITY_STYLES: Record<string, string> = { 
  URGENT: "bg-red-500 text-white", 
  HIGH: "bg-orange-500 text-white", 
  MEDIUM: "bg-gray-900 text-white", 
  LOW: "bg-gray-200 text-gray-600" 
};

const STATUS_STYLES: Record<string, string> = { 
  TODO: "border-blue-200 text-blue-700 bg-blue-50", 
  IN_PROGRESS: "border-amber-200 text-amber-700 bg-amber-50", 
  DONE: "border-emerald-200 text-emerald-700 bg-emerald-50", 
  CANCELLED: "border-gray-200 text-gray-400 bg-gray-50" 
};

export default function TachesPage() {
  const supabase = createBrowserClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState("MEDIUM");
  const [formAssigned, setFormAssigned] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data: userData } = await supabase.from("users").select("id, name").in("role", ["ADMIN", "HOS", "CLOSER", "SETTER", "EXPERT"]).order("name");
    const { data: taskData } = await supabase.from("tasks").select("*").order("createdAt", { ascending: false });
    
    if (userData) setUsers(userData);
    if (taskData) {
      const enriched = taskData.map((t: any) => ({
        ...t,
        assignedName: userData?.find((u: any) => u.id === t.assignedToId)?.name || "Non assigné"
      })) as Task[];
      setTasks(enriched);
    }
    setLoading(false);
  }

  async function addTask() {
    if (!formTitle.trim()) { setMessage("Le titre est requis"); return; }
    setSaving(true);
    const newTask = {
      title: formTitle.trim(),
      description: formDesc.trim(),
      priority: formPriority,
      status: "TODO",
      assignedToId: formAssigned || null,
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("tasks").insert(newTask).select().single();
    
    if (!error && data) {
      const assigned = users.find((u) => u.id === formAssigned);
      setTasks([{ ...data, assignedName: assigned?.name || "Non assigné" }, ...tasks]);
      resetForm();
      setMessage("Tâche créée avec succès");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  const resetForm = () => {
    setFormTitle(""); setFormDesc(""); setFormPriority("MEDIUM");
    setFormAssigned(""); setFormDueDate(""); setShowForm(false);
  };

  async function updateTaskStatus(taskId: string, newStatus: string) {
    const updates: any = { status: newStatus };
    if (newStatus === "DONE") updates.completedAt = new Date().toISOString();
    
    await supabase.from("tasks").update(updates).eq("id", taskId);
    setTasks(tasks.map((t) => t.id === taskId ? { ...t, ...updates } : t));
  }

  async function deleteTask(taskId: string) {
    if(!confirm("Supprimer cette tâche ?")) return;
    await supabase.from("tasks").delete().eq("id", taskId);
    setTasks(tasks.filter((t) => t.id !== taskId));
  }

  const filtered = tasks.filter((t) => (filterStatus === "ALL" || t.status === filterStatus) && (filterPriority === "ALL" || t.priority === filterPriority));

  const stats = {
    todo: tasks.filter(t => t.status === "TODO").length,
    urgent: tasks.filter(t => t.priority === "URGENT" && t.status !== "DONE").length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE").length
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-gray-300 tracking-widest uppercase">Chargement des tâches...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Backlog</h1>
          <p className="text-gray-500 font-medium">{tasks.length} missions enregistrées</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-6 font-black uppercase italic tracking-tighter transition-transform active:scale-95"
        >
          {showForm ? "Fermer" : <><Plus className="mr-2" size={20}/> Nouvelle Tâche</>}
        </Button>
      </div>

      {/* Stats Mini Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center">
           <div><p className="text-[10px] font-black uppercase text-blue-400">À faire</p><p className="text-2xl font-black text-blue-700 italic">{stats.todo}</p></div>
           <Clock className="text-blue-200" size={32} />
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex justify-between items-center">
           <div><p className="text-[10px] font-black uppercase text-red-400">Urgent</p><p className="text-2xl font-black text-red-700 italic">{stats.urgent}</p></div>
           <AlertCircle className="text-red-200" size={32} />
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex justify-between items-center">
           <div><p className="text-[10px] font-black uppercase text-orange-400">En retard</p><p className="text-2xl font-black text-orange-700 italic">{stats.overdue}</p></div>
           <CalendarIcon className="text-orange-200" size={32} />
        </div>
      </div>

      {/* Formulaire Rapide */}
      {showForm && (
        <Card className="border-2 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input 
                  type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} 
                  placeholder="TITRE DE LA MISSION" 
                  className="w-full text-xl font-black uppercase italic tracking-tighter border-b-2 border-gray-100 focus:border-gray-900 outline-none pb-2" 
                />
                <textarea 
                  value={formDesc} onChange={(e) => setFormDesc(e.target.value)} 
                  placeholder="Détails et instructions..." 
                  className="w-full p-4 bg-gray-50 rounded-xl text-sm min-h-[100px] outline-none focus:ring-2 ring-gray-200"
                />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <select value={formPriority} onChange={(e) => setFormPriority(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold uppercase">
                    <option value="LOW">Priorité: Basse</option>
                    <option value="MEDIUM">Priorité: Moyenne</option>
                    <option value="HIGH">Priorité: Haute</option>
                    <option value="URGENT">Priorité: URGENT</option>
                  </select>
                  <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold uppercase" />
                </div>
                <select value={formAssigned} onChange={(e) => setFormAssigned(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold uppercase">
                  <option value="">Assigner à...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <Button onClick={addTask} disabled={saving} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase italic py-6 rounded-xl">
                  {saving ? "Création..." : "Lancer la mission"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres & Liste */}
      <div className="space-y-4">
        <div className="flex gap-2 items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
          <Filter size={14} /> <span>Filtrer par :</span>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent border-none outline-none text-gray-900 cursor-pointer">
            <option value="ALL">Tous les statuts</option>
            <option value="TODO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="DONE">Terminé</option>
          </select>
        </div>

        <div className="grid gap-3">
          {filtered.map((t) => (
            <div key={t.id} className="group bg-white border border-gray-100 hover:border-gray-900 rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${PRIORITY_STYLES[t.priority]}`}>
                    {t.priority}
                  </span>
                  <h3 className={`font-black italic uppercase tracking-tighter ${t.status === "DONE" ? "text-gray-300 line-through" : "text-gray-900"}`}>
                    {t.title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-400">
                  <span className="flex items-center gap-1"><User size={12}/> {t.assignedName}</span>
                  {t.dueDate && <span className="flex items-center gap-1"><CalendarIcon size={12}/> {new Date(t.dueDate).toLocaleDateString()}</span>}
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] ${STATUS_STYLES[t.status]}`}>{t.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {t.status !== "DONE" && (
                  <button onClick={() => updateTaskStatus(t.id, "DONE")} className="p-2 hover:bg-emerald-50 text-emerald-500 rounded-lg transition-colors">
                    <CheckCircle2 size={20} />
                  </button>
                )}
                <button onClick={() => deleteTask(t.id)} className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-20 font-black text-gray-200 uppercase tracking-widest">Aucune mission trouvée</div>}
        </div>
      </div>
    </div>
  );
}