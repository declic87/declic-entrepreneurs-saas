"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Video, Plus, Trash2, Save, X, FileText, Calendar, 
  Users, Link as LinkIcon, Upload, CheckCircle2
} from "lucide-react";

type Tab = "formations" | "tutos" | "coachings" | "ateliers";

export default function AdminContenus() {
  const [activeTab, setActiveTab] = useState<Tab>("formations");
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#123055] mb-8">📋 Gestion des Contenus</h1>

      {/* Navigation par onglets */}
      <div className="flex gap-2 border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab("formations")}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === "formations"
              ? "border-amber-500 text-amber-600 bg-amber-50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          📹 Formations
        </button>
        <button
          onClick={() => setActiveTab("tutos")}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === "tutos"
              ? "border-amber-500 text-amber-600 bg-amber-50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          📚 Tutos Pratiques
        </button>
        <button
          onClick={() => setActiveTab("coachings")}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === "coachings"
              ? "border-amber-500 text-amber-600 bg-amber-50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          🎥 Coachings
        </button>
        <button
          onClick={() => setActiveTab("ateliers")}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === "ateliers"
              ? "border-amber-500 text-amber-600 bg-amber-50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          🎓 Ateliers
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === "formations" && <FormationsTab supabase={supabase} />}
      {activeTab === "tutos" && <TutosPratiquesTab supabase={supabase} />}
      {activeTab === "coachings" && <CoachingsTab supabase={supabase} />}
      {activeTab === "ateliers" && <AteliersTab supabase={supabase} />}
    </div>
  );
}

// ============================================
// ONGLET 1 : FORMATIONS (Code existant conservé)
// ============================================
function FormationsTab({ supabase }: any) {
  const [videos, setVideos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    duration: "",
    loom_id: "",
    is_new: false
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    setVideos(data || []);
  }

  async function saveVideo() {
    if (editingId) {
      await supabase.from("videos").update(formData).eq("id", editingId);
    } else {
      await supabase.from("videos").insert([formData]);
    }
    resetForm();
    fetchVideos();
  }

  function resetForm() {
    setFormData({ title: "", category: "", description: "", duration: "", loom_id: "", is_new: false });
    setEditingId(null);
  }

  async function deleteVideo(id: string) {
    await supabase.from("videos").delete().eq("id", id);
    fetchVideos();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-[#123055] mb-4">
            {editingId ? "Modifier la vidéo" : "Ajouter une vidéo"}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input placeholder="Titre" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <Input placeholder="Catégorie" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
            <Input placeholder="Durée (ex: 15 min)" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
            <Input placeholder="Loom ID" value={formData.loom_id} onChange={e => setFormData({ ...formData, loom_id: e.target.value })} />
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border rounded-lg mb-4"
            rows={3}
          />
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={formData.is_new}
              onChange={e => setFormData({ ...formData, is_new: e.target.checked })}
            />
            <label className="text-sm">Marquer comme "Nouveau"</label>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveVideo} className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
              <Save size={18} className="mr-2" />
              {editingId ? "Mettre à jour" : "Ajouter"}
            </Button>
            {editingId && (
              <Button onClick={resetForm} variant="outline">
                <X size={18} className="mr-2" />
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {videos.map(video => (
          <Card key={video.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-[#123055]">{video.title}</h4>
                <p className="text-sm text-slate-600">{video.category} • {video.duration}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setFormData(video); setEditingId(video.id); }}>
                  Modifier
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteVideo(video.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// ONGLET 2 : TUTOS PRATIQUES (Loom + PDF)
// ============================================
function TutosPratiquesTab({ supabase }: any) {
  const [tutos, setTutos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    loom_id: "",
    pdf_url: "",
    duration: "",
    is_new: false
  });

  useEffect(() => {
    fetchTutos();
  }, []);

  async function fetchTutos() {
    const { data } = await supabase.from("tutos_pratiques").select("*").order("created_at", { ascending: false });
    setTutos(data || []);
  }

  async function saveTuto() {
    if (editingId) {
      await supabase.from("tutos_pratiques").update(formData).eq("id", editingId);
    } else {
      await supabase.from("tutos_pratiques").insert([formData]);
    }
    resetForm();
    fetchTutos();
  }

  function resetForm() {
    setFormData({ title: "", category: "", description: "", loom_id: "", pdf_url: "", duration: "", is_new: false });
    setEditingId(null);
  }

  async function deleteTuto(id: string) {
    await supabase.from("tutos_pratiques").delete().eq("id", id);
    fetchTutos();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-[#123055] mb-4 flex items-center gap-2">
            <FileText size={20} />
            {editingId ? "Modifier le tuto" : "Ajouter un tuto pratique"}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input placeholder="Titre" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <Input placeholder="Catégorie" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
            <Input placeholder="Loom ID" value={formData.loom_id} onChange={e => setFormData({ ...formData, loom_id: e.target.value })} />
            <Input placeholder="URL PDF" value={formData.pdf_url} onChange={e => setFormData({ ...formData, pdf_url: e.target.value })} />
            <Input placeholder="Durée (ex: 10 min)" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border rounded-lg mb-4"
            rows={3}
          />
          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" checked={formData.is_new} onChange={e => setFormData({ ...formData, is_new: e.target.checked })} />
            <label className="text-sm">Marquer comme "Nouveau"</label>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveTuto} className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
              <Save size={18} className="mr-2" />
              {editingId ? "Mettre à jour" : "Ajouter"}
            </Button>
            {editingId && (
              <Button onClick={resetForm} variant="outline">
                <X size={18} className="mr-2" />
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {tutos.map(tuto => (
          <Card key={tuto.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-[#123055]">{tuto.title}</h4>
                <p className="text-sm text-slate-600">
                  {tuto.category} • {tuto.duration}
                  {tuto.pdf_url && " • PDF attaché"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setFormData(tuto); setEditingId(tuto.id); }}>
                  Modifier
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteTuto(tuto.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// ONGLET 3 : COACHINGS (Lives + Archives)
// ============================================
function CoachingsTab({ supabase }: any) {
  const [subTab, setSubTab] = useState<"lives" | "archives">("lives");
  const [lives, setLives] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    session_date: "",
    time_slot: "",
    meet_link: "",
    fathom_id: ""
  });

  useEffect(() => {
    fetchCoachings();
  }, []);

  async function fetchCoachings() {
    const { data: livesData } = await supabase.from("coaching_sessions").select("*").order("session_date", { ascending: true });
    const { data: archivesData } = await supabase.from("coaching_archives").select("*").order("session_date", { ascending: false });
    setLives(livesData || []);
    setArchives(archivesData || []);
  }

  async function saveCoaching() {
    const table = subTab === "lives" ? "coaching_sessions" : "coaching_archives";
    if (editingId) {
      await supabase.from(table).update(formData).eq("id", editingId);
    } else {
      await supabase.from(table).insert([formData]);
    }
    resetForm();
    fetchCoachings();
  }

  function resetForm() {
    setFormData({ title: "", description: "", session_date: "", time_slot: "", meet_link: "", fathom_id: "" });
    setEditingId(null);
  }

  async function deleteCoaching(id: string) {
    const table = subTab === "lives" ? "coaching_sessions" : "coaching_archives";
    await supabase.from(table).delete().eq("id", id);
    fetchCoachings();
  }

  const currentData = subTab === "lives" ? lives : archives;

  return (
    <div className="space-y-6">
      {/* Sous-navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setSubTab("lives")}
          className={`px-4 py-2 border-b-2 ${subTab === "lives" ? "border-amber-500 text-amber-600" : "border-transparent"}`}
        >
          Lives à venir
        </button>
        <button
          onClick={() => setSubTab("archives")}
          className={`px-4 py-2 border-b-2 ${subTab === "archives" ? "border-amber-500 text-amber-600" : "border-transparent"}`}
        >
          Archives (Replays)
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-[#123055] mb-4">
            {editingId ? "Modifier" : "Ajouter"} {subTab === "lives" ? "un live" : "un replay"}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input placeholder="Titre" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <Input type="date" placeholder="Date" value={formData.session_date} onChange={e => setFormData({ ...formData, session_date: e.target.value })} />
            {subTab === "lives" && (
              <>
                <Input placeholder="Horaire (ex: 14h00)" value={formData.time_slot} onChange={e => setFormData({ ...formData, time_slot: e.target.value })} />
                <Input placeholder="Lien Google Meet" value={formData.meet_link} onChange={e => setFormData({ ...formData, meet_link: e.target.value })} />
              </>
            )}
            {subTab === "archives" && (
              <Input placeholder="Fathom ID" value={formData.fathom_id} onChange={e => setFormData({ ...formData, fathom_id: e.target.value })} />
            )}
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border rounded-lg mb-4"
            rows={3}
          />
          <div className="flex gap-2">
            <Button onClick={saveCoaching} className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
              <Save size={18} className="mr-2" />
              {editingId ? "Mettre à jour" : "Ajouter"}
            </Button>
            {editingId && (
              <Button onClick={resetForm} variant="outline">
                <X size={18} className="mr-2" />
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {currentData.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-[#123055]">{item.title}</h4>
                <p className="text-sm text-slate-600">
                  {new Date(item.session_date).toLocaleDateString('fr-FR')}
                  {item.time_slot && ` • ${item.time_slot}`}
                  {item.meet_link && " • Google Meet"}
                  {item.fathom_id && " • Replay Fathom"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setFormData(item); setEditingId(item.id); }}>
                  Modifier
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteCoaching(item.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// ONGLET 4 : ATELIERS (Lives + Archives)
// ============================================
function AteliersTab({ supabase }: any) {
  const [subTab, setSubTab] = useState<"lives" | "archives">("lives");
  const [lives, setLives] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    atelier_date: "",
    time_slot: "",
    max_places: 0,
    places_prises: 0,
    lien_inscription: "",
    fathom_id: ""
  });

  useEffect(() => {
    fetchAteliers();
  }, []);

  async function fetchAteliers() {
    const { data: livesData } = await supabase.from("ateliers").select("*").order("atelier_date", { ascending: true });
    const { data: archivesData } = await supabase.from("atelier_archives").select("*").order("atelier_date", { ascending: false });
    setLives(livesData || []);
    setArchives(archivesData || []);
  }

  async function saveAtelier() {
    const table = subTab === "lives" ? "ateliers" : "atelier_archives";
    if (editingId) {
      await supabase.from(table).update(formData).eq("id", editingId);
    } else {
      await supabase.from(table).insert([formData]);
    }
    resetForm();
    fetchAteliers();
  }

  function resetForm() {
    setFormData({ title: "", description: "", atelier_date: "", time_slot: "", max_places: 0, places_prises: 0, lien_inscription: "", fathom_id: "" });
    setEditingId(null);
  }

  async function deleteAtelier(id: string) {
    const table = subTab === "lives" ? "ateliers" : "atelier_archives";
    await supabase.from(table).delete().eq("id", id);
    fetchAteliers();
  }

  const currentData = subTab === "lives" ? lives : archives;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setSubTab("lives")}
          className={`px-4 py-2 border-b-2 ${subTab === "lives" ? "border-amber-500 text-amber-600" : "border-transparent"}`}
        >
          Prochains ateliers
        </button>
        <button
          onClick={() => setSubTab("archives")}
          className={`px-4 py-2 border-b-2 ${subTab === "archives" ? "border-amber-500 text-amber-600" : "border-transparent"}`}
        >
          Archives (Replays)
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-[#123055] mb-4">
            {editingId ? "Modifier" : "Ajouter"} {subTab === "lives" ? "un atelier" : "un replay"}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input placeholder="Titre" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <Input type="date" placeholder="Date" value={formData.atelier_date} onChange={e => setFormData({ ...formData, atelier_date: e.target.value })} />
            {subTab === "lives" && (
              <>
                <Input placeholder="Horaire" value={formData.time_slot} onChange={e => setFormData({ ...formData, time_slot: e.target.value })} />
                <Input type="number" placeholder="Places max" value={formData.max_places} onChange={e => setFormData({ ...formData, max_places: parseInt(e.target.value) })} />
                <Input placeholder="Lien inscription" value={formData.lien_inscription} onChange={e => setFormData({ ...formData, lien_inscription: e.target.value })} />
              </>
            )}
            {subTab === "archives" && (
              <Input placeholder="Fathom ID" value={formData.fathom_id} onChange={e => setFormData({ ...formData, fathom_id: e.target.value })} />
            )}
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border rounded-lg mb-4"
            rows={3}
          />
          <div className="flex gap-2">
            <Button onClick={saveAtelier} className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
              <Save size={18} className="mr-2" />
              {editingId ? "Mettre à jour" : "Ajouter"}
            </Button>
            {editingId && (
              <Button onClick={resetForm} variant="outline">
                <X size={18} className="mr-2" />
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {currentData.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-[#123055]">{item.title}</h4>
                <p className="text-sm text-slate-600">
                  {new Date(item.atelier_date).toLocaleDateString('fr-FR')}
                  {item.time_slot && ` • ${item.time_slot}`}
                  {item.max_places > 0 && ` • ${item.places_prises || 0}/${item.max_places} places`}
                  {item.fathom_id && " • Replay Fathom"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setFormData(item); setEditingId(item.id); }}>
                  Modifier
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteAtelier(item.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}