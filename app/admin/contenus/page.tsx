"use client";
import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Video, Plus, Trash2, Save, X, FileText,
  FileSpreadsheet, File, ChevronDown, ChevronUp, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// --- TYPES ---
interface Template {
  id?: string;
  video_id?: string;
  name: string;
  file_type: string;
  file_url: string;
}

interface VideoRow {
  id: string;
  title: string;
  loom_id: string;
  category: string;
  duration: string;
  is_new: boolean;
  description: string;
  sort_order: number;
  active: boolean;
  templates: Template[];
}

const CATEGORIES = ["Fiscalite", "Optimisation", "TVA", "Creation", "Protection", "Comptabilite", "Juridique", "Gestion"];

export default function AdminContenusPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState("");

  // States nouvel ajout
  const [newTitle, setNewTitle] = useState("");
  const [newLoomId, setNewLoomId] = useState("");
  const [newCategory, setNewCategory] = useState("Fiscalite");
  const [newDuration, setNewDuration] = useState("10 min");
  const [newDesc, setNewDesc] = useState("");
  const [newIsNew, setNewIsNew] = useState(true);

  useEffect(() => { loadVideos(); }, []);

  // RECTIFICATION : Une seule requête pour TOUT récupérer (Vidéos + Templates)
  async function loadVideos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select(`
        *,
        templates (*)
      `)
      .order("sort_order", { ascending: true });

    if (error) {
      setMsg("Erreur : " + error.message);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  }

  async function addVideo() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const maxOrder = videos.length > 0 ? Math.max(...videos.map((v) => v.sort_order)) : 0;
    const { error } = await supabase.from("videos").insert({
      title: newTitle, loom_id: newLoomId, category: newCategory,
      duration: newDuration, description: newDesc, is_new: newIsNew,
      sort_order: maxOrder + 1, active: true,
    });
    if (error) { setMsg("Erreur : " + error.message); }
    else {
      setMsg("Vidéo ajoutée");
      setNewTitle(""); setNewLoomId(""); setNewDesc(""); setShowAdd(false);
      await loadVideos();
    }
    setSaving(false);
  }

  async function updateVideo(video: VideoRow) {
    setSaving(true);
    const { error } = await supabase.from("videos").update({
      title: video.title, loom_id: video.loom_id, category: video.category,
      duration: video.duration, description: video.description,
      is_new: video.is_new, active: video.active, sort_order: video.sort_order,
      updated_at: new Date().toISOString(),
    }).eq("id", video.id);
    if (error) setMsg("Erreur : " + error.message);
    else setMsg("Vidéo mise à jour");
    setSaving(false);
  }

  async function deleteVideo(id: string) {
    if (!confirm("Supprimer cette vidéo et ses templates ?")) return;
    await supabase.from("templates").delete().eq("video_id", id);
    await supabase.from("videos").delete().eq("id", id);
    setMsg("Vidéo supprimée");
    setVideos(prev => prev.filter(v => v.id !== id));
  }

  async function addTemplate(videoId: string) {
    const name = prompt("Nom du template (ex: Checklist SASU)");
    if (!name) return;
    const fileType = prompt("Type : PDF, DOCX ou XLSX", "PDF");
    const fileUrl = prompt("URL du fichier", "");
    if (!fileUrl) return;
    
    const { error } = await supabase.from("templates").insert({ 
        video_id: videoId, 
        name, 
        file_type: fileType?.toUpperCase() || "PDF", 
        file_url: fileUrl 
    });
    
    if (!error) {
        setMsg("Template ajouté");
        await loadVideos();
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Supprimer ce template ?")) return;
    await supabase.from("templates").delete().eq("id", id);
    await loadVideos();
  }

  function updateLocalVideo(id: string, field: string, value: any) {
    setVideos((prev) => prev.map((v) => v.id === id ? { ...v, [field]: value } : v));
  }

  function fileIcon(type: string) {
    if (type === "PDF") return <File size={14} className="text-red-500" />;
    if (type === "DOCX") return <FileText size={14} className="text-blue-500" />;
    if (type === "XLSX") return <FileSpreadsheet size={14} className="text-emerald-500" />;
    return <File size={14} />;
  }

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none";

  if (loading) return <div className="p-20 text-center">Chargement...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold">Gestion des Contenus</h1>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-amber-500 hover:bg-amber-600">
          <Plus size={16} className="mr-2" /> Ajouter une vidéo
        </Button>
      </div>

      {msg && <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg flex justify-between">{msg} <X className="cursor-pointer" onClick={() => setMsg("")} /></div>}

      {/* FORMULAIRE AJOUT */}
      {showAdd && (
        <Card className="border-2 border-amber-200 p-6 grid grid-cols-2 gap-4">
            <input placeholder="Titre" className={inputClass} value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <input placeholder="ID Loom" className={inputClass} value={newLoomId} onChange={e => setNewLoomId(e.target.value)} />
            <select className={inputClass} value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button onClick={addVideo} disabled={saving}>Sauvegarder</Button>
        </Card>
      )}

      {/* LISTE DES VIDEOS */}
      <div className="space-y-4">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedId(expandedId === video.id ? null : video.id)}
            >
              <div className="flex items-center gap-4">
                <Video className="text-amber-500" />
                <div>
                  <h3 className="font-bold">{video.title}</h3>
                  <p className="text-xs text-gray-500">{video.category} • {video.templates?.length || 0} templates</p>
                </div>
              </div>
              {expandedId === video.id ? <ChevronUp /> : <ChevronDown />}
            </div>

            {expandedId === video.id && (
              <CardContent className="bg-gray-50 p-6 border-t space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <input className={inputClass} value={video.title} onChange={e => updateLocalVideo(video.id, "title", e.target.value)} />
                   <input className={inputClass} value={video.loom_id} onChange={e => updateLocalVideo(video.id, "loom_id", e.target.value)} />
                </div>
                
                {/* TEMPLATES SECTION */}
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <span className="font-semibold text-sm">Templates</span>
                     <Button size="sm" variant="outline" onClick={() => addTemplate(video.id)}>+ Ajouter</Button>
                   </div>
                   {video.templates?.map(t => (
                     <div key={t.id} className="flex items-center justify-between bg-white p-2 border rounded shadow-sm">
                        <div className="flex items-center gap-2">{fileIcon(t.file_type)} {t.name}</div>
                        <Trash2 size={14} className="text-red-400 cursor-pointer" onClick={() => deleteTemplate(t.id!)} />
                     </div>
                   ))}
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => updateVideo(video)} size="sm" className="bg-emerald-500 hover:bg-emerald-600"><Save size={16} className="mr-2"/> Enregistrer</Button>
                  <Button onClick={() => deleteVideo(video.id)} size="sm" variant="destructive"><Trash2 size={16} className="mr-2"/> Supprimer</Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}