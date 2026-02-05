"use client";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

interface Rdv {
  id: string;
  type: string;
  status: string;
  date: string;
  duration: number;
  meeting_url?: string;
  notes?: string;
  client_id?: string;
  expert_id: string;
  // Pour l'affichage simple du nom sans jointures complexes pour l'instant
  client_name?: string; 
}

const STATUS_COLORS: Record<string, string> = {
  PLANIFIE: "bg-blue-100 text-blue-700",
  CONFIRME: "bg-cyan-100 text-cyan-700",
  EFFECTUE: "bg-emerald-100 text-emerald-700",
  ANNULE: "bg-red-100 text-red-700",
};

export default function AgendaPage() {
  const supabase = createClientComponentClient();
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [expertId, setExpertId] = useState("");

  // Formulaire
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("Audit fiscal");
  const [formDate, setFormDate] = useState("");
  const [formDuration, setFormDuration] = useState("30");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setLoading(false); return; }

        // 1. Récupérer le profil
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (!profile) { setLoading(false); return; }

        // 2. Récupérer l'ID Expert
        const { data: expert } = await supabase
          .from("experts")
          .select("id")
          .eq("user_id", profile.id)
          .single();

        if (expert) {
          setExpertId(expert.id);
          
          // 3. Récupérer les RDVs (Jointure simplifiée)
          const { data, error } = await supabase
            .from("rdvs")
            .select(`
              *,
              clients (
                id,
                leads (first_name, last_name)
              )
            `)
            .eq("expert_id", expert.id)
            .order("date", { ascending: false });

          if (data) {
            // On reformate un peu pour extraire le nom du client facilement
            const formattedRdvs = data.map((r: any) => ({
              ...r,
              client_name: r.clients?.leads 
                ? `${r.clients.leads.first_name} ${r.clients.leads.last_name}`
                : "Client inconnu"
            }));
            setRdvs(formattedRdvs);
          }
        }
      } catch (e) {
        console.error("Erreur Agenda:", e);
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const now = new Date();
  const today = now.toDateString();

  const rdvToday = rdvs.filter((r) => r.date && new Date(r.date).toDateString() === today).length;
  const upcoming = rdvs.filter((r) => r.date && new Date(r.date) > now && r.status !== "ANNULE").length;
  const effectues = rdvs.filter((r) => r.status === "EFFECTUE").length;

  const filtered = rdvs.filter((r) => filterStatus === "ALL" || r.status === filterStatus);

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("rdvs")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
    
    if (!error) {
      setRdvs(rdvs.map((r) => r.id === id ? { ...r, status: newStatus } : r));
    }
  }

  async function addRdv() {
    if (!formDate || !expertId) return;

    const { data, error } = await supabase
      .from("rdvs")
      .insert({
        type: formType,
        date: formDate,
        duration: parseInt(formDuration),
        notes: formNotes,
        expert_id: expertId,
        status: "PLANIFIE",
      })
      .select()
      .single();

    if (data) {
      setRdvs([data, ...rdvs]);
      setShowForm(false);
      setFormDate("");
      setFormNotes("");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500 mt-1">{rdvs.length} rendez-vous au total</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-orange-500 hover:bg-orange-600">
          <Plus size={16} className="mr-2" /> Nouveau RDV
        </Button>
      </div>

      {/* Stats Rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-900">{rdvs.length}</p><p className="text-xs text-gray-500">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{rdvToday}</p><p className="text-xs text-gray-500">Aujourd'hui</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{upcoming}</p><p className="text-xs text-gray-500">À venir</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{effectues}</p><p className="text-xs text-gray-500">Effectués</p></CardContent></Card>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardContent className="p-6">
            <h2 className="font-bold text-gray-900 mb-4">Planifier un rendez-vous</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Type de consultation</p>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option>Audit fiscal</option>
                  <option>Suivi dossier</option>
                  <option>Création société</option>
                  <option>Point comptable</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Date et heure</p>
                <input type="datetime-local" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Durée estimée</p>
                <select value={formDuration} onChange={(e) => setFormDuration(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Notes internes</p>
                <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Précisions sur le RDV..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={addRdv} className="bg-orange-500 hover:bg-orange-600">Créer le RDV</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "PLANIFIE", "CONFIRME", "EFFECTUE", "ANNULE"].map((s) => (
          <button 
            key={s} 
            onClick={() => setFilterStatus(s)} 
            className={"px-4 py-2 text-sm rounded-full transition-colors " + (filterStatus === s ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}
          >
            {s === "ALL" ? "Tous les RDV" : s}
          </button>
        ))}
      </div>

      {/* Liste des RDVs */}
      <div className="space-y-3">
        {filtered.map((r) => {
          const isPast = r.date && new Date(r.date) < now && r.status === "PLANIFIE";
          return (
            <Card key={r.id} className={isPast ? "border-amber-200 bg-amber-50" : "hover:border-gray-300 transition-colors"}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded-lg border border-gray-100 hidden md:block text-center min-w-[60px]">
                      <p className="text-xs font-bold text-orange-500 uppercase">{new Date(r.date).toLocaleDateString("fr-FR", { weekday: 'short' })}</p>
                      <p className="text-lg font-bold">{new Date(r.date).getDate()}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">{r.type}</p>
                        <span className="text-gray-300">|</span>
                        <p className="text-sm font-medium text-gray-700">{r.client_name}</p>
                        <span className={"px-2 py-0.5 text-[10px] font-bold rounded uppercase " + (STATUS_COLORS[r.status] || "bg-gray-100")}>{r.status}</span>
                        {isPast && <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded uppercase"><Clock size={10} /> En retard</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(r.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} • {r.duration} min
                      </p>
                      {r.notes && <p className="text-xs text-gray-400 mt-1 italic">"{r.notes}"</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {r.meeting_url && (
                      <a href={r.meeting_url} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Lien réunion">
                        <ExternalLink size={18} />
                      </a>
                    )}
                    
                    {r.status === "PLANIFIE" && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => updateStatus(r.id, "CONFIRME")}>
                          Confirmer
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-red-500 border-red-200 hover:bg-red-50" onClick={() => updateStatus(r.id, "ANNULE")}>
                          Annuler
                        </Button>
                      </>
                    )}
                    
                    {r.status === "CONFIRME" && (
                      <Button variant="outline" size="sm" className="h-8 bg-emerald-500 text-white hover:bg-emerald-600 border-none" onClick={() => updateStatus(r.id, "EFFECTUE")}>
                        Marquer comme fait
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Calendar className="mx-auto text-gray-300 mb-2" size={40} />
            <p className="text-gray-500">Aucun rendez-vous trouvé pour ce filtre.</p>
          </div>
        )}
      </div>
    </div>
  );
}