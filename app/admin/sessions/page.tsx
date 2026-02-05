"use client";
import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Headphones, Calendar, Plus, Trash2, Save, X, ChevronDown, ChevronUp,
  ArrowLeft, Copy, PlayCircle, Video, Link as LinkIcon
} from "lucide-react";
import Link from "next/link";

interface CoachingRow {
  id: string;
  title: string;
  description: string;
  session_date: string;
  time_slot: string;
  meet_link: string;
  replay_link: string;
  max_inscrits: number;
  active: boolean;
}

interface AtelierRow {
  id: string;
  title: string;
  description: string;
  atelier_date: string;
  time_slot: string;
  max_places: number;
  places_prises: number;
  lien_inscription: string;
  replay_link: string;
  active: boolean;
}

export default function AdminSessionsPage() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"coaching" | "ateliers">("coaching");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [coachings, setCoachings] = useState<CoachingRow[]>([]);
  const [ateliers, setAteliers] = useState<AtelierRow[]>([]);

  // Form states Coaching
  const [showAddCoaching, setShowAddCoaching] = useState(false);
  const [nc, setNc] = useState({ title: "", desc: "", date: "", time: "12h30 - 13h30", meet: "", max: 25 });

  // Form states Ateliers
  const [showAddAtelier, setShowAddAtelier] = useState(false);
  const [na, setNa] = useState({ title: "", desc: "", date: "", time: "14h00 - 16h00", max: 8, lien: "" });

  useEffect(() => { loadAll(); }, []);

  const showFeedback = (text: string, error = false) => {
    setMsg(text);
    setIsError(error);
    setTimeout(() => setMsg(""), 3000);
  };

  async function loadAll() {
    setLoading(true);
    const { data: c } = await supabase.from("coaching_sessions").select("*").order("session_date", { ascending: false });
    if (c) setCoachings(c);
    const { data: a } = await supabase.from("ateliers").select("*").order("atelier_date", { ascending: false });
    if (a) setAteliers(a);
    setLoading(false);
  }

  // --- ACTIONS COACHING ---
  async function addCoaching() {
    if (!nc.title || !nc.date) return;
    setSaving(true);
    const { error } = await supabase.from("coaching_sessions").insert({
      title: nc.title, description: nc.desc, session_date: nc.date,
      time_slot: nc.time, meet_link: nc.meet, max_inscrits: nc.max, active: true
    });
    if (!error) { showFeedback("Coaching ajouté !"); setShowAddCoaching(false); loadAll(); }
    setSaving(false);
  }

  async function updateCoaching(c: CoachingRow) {
    setSaving(true);
    const { error } = await supabase.from("coaching_sessions").update(c).eq("id", c.id);
    if (error) showFeedback(error.message, true);
    else showFeedback("Coaching mis à jour !");
    setSaving(false);
  }

  async function duplicateCoaching(c: CoachingRow) {
    setSaving(true);
    const { error } = await supabase.from("coaching_sessions").insert({
      ...c, id: undefined, title: `${c.title} (Copie)`, active: false, replay_link: null
    });
    if (!error) { showFeedback("Session dupliquée !"); loadAll(); }
    setSaving(false);
  }

  // --- ACTIONS ATELIERS ---
  async function addAtelier() {
    if (!na.title || !na.date) return;
    setSaving(true);
    const { error } = await supabase.from("ateliers").insert({
      title: na.title, description: na.desc, atelier_date: na.date,
      time_slot: na.time, max_places: na.max, places_prises: 0, lien_inscription: na.lien, active: true
    });
    if (!error) { showFeedback("Atelier ajouté !"); setShowAddAtelier(false); loadAll(); }
    setSaving(false);
  }

  async function updateAtelier(a: AtelierRow) {
    setSaving(true);
    const { error } = await supabase.from("ateliers").update(a).eq("id", a.id);
    if (error) showFeedback(error.message, true);
    else showFeedback("Atelier mis à jour !");
    setSaving(false);
  }

  async function deleteItem(table: string, id: string) {
    if (!confirm("Supprimer définitivement ?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) { showFeedback("Supprimé !"); loadAll(); }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none";

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-500">Chargement...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">ADMINISTRATION SESSIONS</h1>
          <p className="text-gray-500 italic">Lives, Ateliers & Replays Fathom</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setTab("coaching")} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === "coaching" ? "bg-white shadow text-amber-600" : "text-gray-500"}`}>Coachings</button>
          <button onClick={() => setTab("ateliers")} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === "ateliers" ? "bg-white shadow text-amber-600" : "text-gray-500"}`}>Ateliers</button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex justify-between ${isError ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          <span className="font-bold text-sm">{msg}</span>
          <X size={18} className="cursor-pointer" onClick={() => setMsg("")} />
        </div>
      )}

      {/* --- SECTION COACHING --- */}
      {tab === "coaching" && (
        <div className="space-y-4">
          <Button onClick={() => setShowAddCoaching(!showAddCoaching)} className="w-full py-8 border-dashed border-2 border-amber-200 bg-amber-50/30 text-amber-700 hover:bg-amber-50">
            <Plus className="mr-2" /> Programmer une nouvelle session de Coaching Live
          </Button>

          {showAddCoaching && (
            <Card className="border-amber-400 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="bg-amber-400 p-2 text-center text-white text-xs font-black uppercase">Nouveau Coaching</div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Titre (ex: Coaching Collectif #12)" className={inputClass} onChange={e => setNc({...nc, title: e.target.value})} />
                  <input type="date" className={inputClass} onChange={e => setNc({...nc, date: e.target.value})} />
                  <input placeholder="Lien Google Meet" className={inputClass} onChange={e => setNc({...nc, meet: e.target.value})} />
                  <input placeholder="Créneau (ex: 12h30 - 13h30)" className={inputClass} onChange={e => setNc({...nc, time: e.target.value})} />
                </div>
                <textarea placeholder="Description de la session..." className={inputClass + " h-20"} onChange={e => setNc({...nc, desc: e.target.value})} />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowAddCoaching(false)}>Annuler</Button>
                  <Button onClick={addCoaching} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white px-8">Créer la session</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {coachings.map(c => (
            <Card key={c.id} className={`transition-all ${!c.active ? "opacity-60 grayscale" : "shadow-md"}`}>
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${c.replay_link ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                    {c.replay_link ? <PlayCircle size={20} /> : <Video size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{c.title}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{new Date(c.session_date).toLocaleDateString('fr-FR')} • {c.time_slot}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {c.replay_link && <span className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded font-black">REPLAY</span>}
                  {expandedId === c.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expandedId === c.id && (
                <CardContent className="p-6 bg-gray-50 border-t space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Titre de la session</label>
                      <input value={c.title} onChange={e => setCoachings(prev => prev.map(item => item.id === c.id ? {...item, title: e.target.value} : item))} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Date</label>
                      <input type="date" value={c.session_date} onChange={e => setCoachings(prev => prev.map(item => item.id === c.id ? {...item, session_date: e.target.value} : item))} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-blue-500 uppercase">Lien Google Meet (Live)</label>
                      <input value={c.meet_link} onChange={e => setCoachings(prev => prev.map(item => item.id === c.id ? {...item, meet_link: e.target.value} : item))} className={inputClass + " border-blue-200 bg-blue-50/20"} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-purple-600 uppercase">Lien Replay Fathom</label>
                      <input value={c.replay_link || ""} placeholder="https://fathom.video/share/..." onChange={e => setCoachings(prev => prev.map(item => item.id === c.id ? {...item, replay_link: e.target.value} : item))} className={inputClass + " border-purple-200 bg-purple-50/20"} />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                       <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                         <input type="checkbox" checked={c.active} onChange={e => setCoachings(prev => prev.map(item => item.id === c.id ? {...item, active: e.target.checked} : item))} />
                         Session active et visible sur le SaaS
                       </label>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex gap-2">
                      <Button onClick={() => updateCoaching(c)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Save size={16} className="mr-2"/> Sauvegarder</Button>
                      <Button onClick={() => duplicateCoaching(c)} variant="outline" className="text-amber-600 border-amber-200"><Copy size={16} className="mr-2"/> Dupliquer</Button>
                    </div>
                    <Button onClick={() => deleteItem("coaching_sessions", c.id)} variant="ghost" className="text-red-400 hover:text-red-600"><Trash2 size={20}/></Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* --- SECTION ATELIERS --- */}
      {tab === "ateliers" && (
        <div className="space-y-4">
          <Button onClick={() => setShowAddAtelier(!showAddAtelier)} className="w-full py-8 border-dashed border-2 border-emerald-200 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-50">
            <Plus className="mr-2" /> Créer un nouvel Atelier Thématique
          </Button>

          {showAddAtelier && (
            <Card className="border-emerald-400 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="bg-emerald-400 p-2 text-center text-white text-xs font-black uppercase">Nouvel Atelier</div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Titre de l'atelier" className={inputClass} onChange={e => setNa({...na, title: e.target.value})} />
                  <input type="date" className={inputClass} onChange={e => setNa({...na, date: e.target.value})} />
                  <input placeholder="Lien d'inscription (ex: Tally, Typeform)" className={inputClass} onChange={e => setNa({...na, lien: e.target.value})} />
                  <input type="number" placeholder="Nombre de places max" className={inputClass} onChange={e => setNa({...na, max: Number(e.target.value)})} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setShowAddAtelier(false)}>Annuler</Button>
                  <Button onClick={addAtelier} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">Publier l'atelier</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {ateliers.map(a => (
            <Card key={a.id} className={`transition-all ${!a.active ? "opacity-60" : "shadow-md"}`}>
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{a.title}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase">{new Date(a.atelier_date).toLocaleDateString('fr-FR')} • {a.places_prises}/{a.max_places} places</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {a.places_prises >= a.max_places && <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-black">COMPLET</span>}
                  {expandedId === a.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expandedId === a.id && (
                <CardContent className="p-6 bg-gray-50 border-t space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Titre</label>
                      <input value={a.title} onChange={e => setAteliers(prev => prev.map(item => item.id === a.id ? {...item, title: e.target.value} : item))} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Places prises</label>
                      <input type="number" value={a.places_prises} onChange={e => setAteliers(prev => prev.map(item => item.id === a.id ? {...item, places_prises: Number(e.target.value)} : item))} className={inputClass} />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-emerald-600 uppercase">Lien d'inscription externe</label>
                      <input value={a.lien_inscription} onChange={e => setAteliers(prev => prev.map(item => item.id === a.id ? {...item, lien_inscription: e.target.value} : item))} className={inputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-purple-600 uppercase">Lien Replay Fathom</label>
                      <input value={a.replay_link || ""} onChange={e => setAteliers(prev => prev.map(item => item.id === a.id ? {...item, replay_link: e.target.value} : item))} className={inputClass + " border-purple-200"} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button onClick={() => updateAtelier(a)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Save size={16} className="mr-2"/> Mettre à jour l'atelier</Button>
                    <Button onClick={() => deleteItem("ateliers", a.id)} variant="ghost" className="text-red-400"><Trash2 size={20}/></Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}