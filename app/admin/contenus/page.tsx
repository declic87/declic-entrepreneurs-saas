"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadPDFTuto } from "@/components/admin/UploadPDFTuto";
import { 
  Video, Plus, Trash2, Save, X, FileText, Calendar, 
  Users, Link as LinkIcon, Upload, CheckCircle2, Send,
  Hash, List, ArrowUpDown, Table, Presentation, Code, Download
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
// ONGLET 1 : FORMATIONS (AVEC MODULES + FICHIERS)
// ============================================
function FormationsTab({ supabase }: any) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [videos, setVideos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "Créateur",
    description: "",
    duration: "",
    loom_id: "",
    is_new: false,
    module_number: 1,
    module_title: "",
    order_in_module: 1,
    pdf_url: "",
    pdf_title: "",
    xlsx_url: "",
    xlsx_title: "",
    pptx_url: "",
    pptx_title: "",
    html_url: "",
    html_title: ""
  });

  useEffect(() => {
    fetchVideos();
  }, [categoryFilter]);

  async function fetchVideos() {
    let query = supabase
      .from("onboarding_videos_client")
      .select("*")
      .eq("section", "formations")
      .order("category", { ascending: true })
      .order("module_number", { ascending: true })
      .order("order_in_module", { ascending: true });
    
    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }
    
    const { data } = await query;
    setVideos(data || []);
  }

  async function saveVideo() {
    const videoData = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      duration: formData.duration,
      loom_id: formData.loom_id,
      is_new: formData.is_new,
      module_number: formData.module_number,
      module_title: formData.module_title,
      order_in_module: formData.order_in_module,
      section: 'formations',
      page_slug: 'formations',
      video_type: 'loom',
      video_url: formData.loom_id ? `https://www.loom.com/share/${formData.loom_id}` : null,
      is_active: true,
      pdf_url: formData.pdf_url || null,
      pdf_title: formData.pdf_title || null,
      xlsx_url: formData.xlsx_url || null,
      xlsx_title: formData.xlsx_title || null,
      pptx_url: formData.pptx_url || null,
      pptx_title: formData.pptx_title || null,
      html_url: formData.html_url || null,
      html_title: formData.html_title || null
    };

    if (editingId) {
      await supabase.from("onboarding_videos_client").update(videoData).eq("id", editingId);
    } else {
      await supabase.from("onboarding_videos_client").insert([videoData]);
    }
    resetForm();
    fetchVideos();
  }

  function resetForm() {
    setFormData({ 
      title: "", 
      category: "Créateur", 
      description: "", 
      duration: "", 
      loom_id: "", 
      is_new: false,
      module_number: 1,
      module_title: "",
      order_in_module: 1,
      pdf_url: "",
      pdf_title: "",
      xlsx_url: "",
      xlsx_title: "",
      pptx_url: "",
      pptx_title: "",
      html_url: "",
      html_title: ""
    });
    setEditingId(null);
  }

  async function deleteVideo(id: string) {
    await supabase.from("onboarding_videos_client").delete().eq("id", id);
    fetchVideos();
  }

  const categories = [
    { value: "all", label: "📚 Toutes les formations", color: "slate" },
    { value: "Créateur", label: "🚀 Formation Créateur (497€)", color: "blue" },
    { value: "Agent Immo", label: "🏠 Formation Agent Immo (897€)", color: "green" },
    { value: "Accompagnement", label: "💼 Formations Accompagnement", color: "purple" }
  ];

  const modulesPredefinis = {
    "Créateur": [
      { number: 1, title: "Introduction" },
      { number: 2, title: "Choix du statut" },
      { number: 3, title: "Fiscalité" },
      { number: 4, title: "Social" },
      { number: 5, title: "TVA" },
      { number: 6, title: "Patrimoine" },
      { number: 7, title: "Zones fiscales" },
      { number: 8, title: "Création pas-à-pas" },
      { number: 9, title: "Après la création" },
      { number: 10, title: "Bonus" }
    ],
    "Agent Immo": [
      { number: 1, title: "Introduction" },
      { number: 2, title: "Spécificités Agent Immo" },
      { number: 3, title: "Optimisation IK" },
      { number: 4, title: "Frais réels" },
      { number: 5, title: "Commissions" },
      { number: 6, title: "Cas pratiques" },
      { number: 7, title: "Bonus" }
    ],
    "Accompagnement": [
      { number: 1, title: "Introduction" },
      { number: 2, title: "Stratégies avancées" },
      { number: 3, title: "Cas pratiques" }
    ]
  };

  const videosByModule = videos.reduce((acc: any, video) => {
    const key = `${video.category}-${video.module_number || 999}-${video.module_title || 'Sans module'}`;
    if (!acc[key]) {
      acc[key] = {
        category: video.category,
        module_number: video.module_number || 999,
        module_title: video.module_title || 'Sans module',
        videos: []
      };
    }
    acc[key].videos.push(video);
    return acc;
  }, {});

  const modulesList = Object.values(videosByModule).sort((a: any, b: any) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.module_number - b.module_number;
  });

  return (
    <div className="space-y-6">
      
      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              categoryFilter === cat.value
                ? "bg-amber-500 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Formulaire */}
      <Card className="border-2 border-amber-200">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-[#123055] mb-4">
            {editingId ? "✏️ Modifier la vidéo" : "➕ Ajouter une vidéo"}
          </h3>
          
          {/* Catégorie */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              📂 Catégorie
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-3 border rounded-lg"
            >
              <option value="Créateur">🚀 Formation Créateur (497€)</option>
              <option value="Agent Immo">🏠 Formation Agent Immo (897€)</option>
              <option value="Accompagnement">💼 Formations Accompagnement</option>
            </select>
          </div>

          {/* MODULE */}
          <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="col-span-3">
              <label className="block text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                <Hash size={16} />
                ORGANISATION PAR MODULE
              </label>
            </div>
            
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Module prédéfini
              </label>
              <select
                onChange={e => {
                  const selected = JSON.parse(e.target.value || '{}');
                  if (selected.number) {
                    setFormData({ 
                      ...formData, 
                      module_number: selected.number,
                      module_title: selected.title
                    });
                  }
                }}
                className="w-full p-2 border rounded-lg text-sm"
              >
                <option value="">-- Choisir un module --</option>
                {(modulesPredefinis[formData.category as keyof typeof modulesPredefinis] || []).map(mod => (
                  <option key={mod.number} value={JSON.stringify(mod)}>
                    Module {mod.number} : {mod.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Numéro
              </label>
              <Input 
                type="number"
                min="1"
                value={formData.module_number} 
                onChange={e => setFormData({ ...formData, module_number: parseInt(e.target.value) || 1 })} 
                className="text-center font-bold"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Titre du module
              </label>
              <Input 
                placeholder="ex: Introduction" 
                value={formData.module_title} 
                onChange={e => setFormData({ ...formData, module_title: e.target.value })} 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Ordre
              </label>
              <Input 
                type="number"
                min="1"
                value={formData.order_in_module} 
                onChange={e => setFormData({ ...formData, order_in_module: parseInt(e.target.value) || 1 })} 
                className="text-center"
              />
            </div>
          </div>

          {/* Titre et durée */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input 
              placeholder="Titre de la vidéo" 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
            />
            <Input 
              placeholder="Durée (ex: 15 minutes)" 
              value={formData.duration} 
              onChange={e => setFormData({ ...formData, duration: e.target.value })} 
            />
          </div>

          {/* Loom ID */}
          <div className="mb-4">
            <Input 
              placeholder="Loom ID (ex: abc123def456)" 
              value={formData.loom_id} 
              onChange={e => setFormData({ ...formData, loom_id: e.target.value })} 
            />
            <p className="text-xs text-slate-500 mt-1">
              💡 Loom ID depuis l'URL : https://www.loom.com/share/<strong>abc123</strong>
            </p>
          </div>

          {/* Description */}
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border rounded-lg mb-4"
            rows={3}
          />

          {/* FICHIERS TÉLÉCHARGEABLES */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <Download size={16} />
              FICHIERS TÉLÉCHARGEABLES
            </h4>

            {/* PDF */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <FileText size={12} />
                  PDF - Titre
                </label>
                <Input 
                  placeholder="Ex: Guide fiscal complet" 
                  value={formData.pdf_title} 
                  onChange={e => setFormData({ ...formData, pdf_title: e.target.value })} 
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  PDF - URL
                </label>
                <Input 
                  placeholder="https://..." 
                  value={formData.pdf_url} 
                  onChange={e => setFormData({ ...formData, pdf_url: e.target.value })} 
                  className="text-sm"
                />
              </div>
            </div>

            {/* XLSX */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Table size={12} />
                  XLSX - Titre
                </label>
                <Input 
                  placeholder="Ex: Calculateur IS vs IR" 
                  value={formData.xlsx_title} 
                  onChange={e => setFormData({ ...formData, xlsx_title: e.target.value })} 
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  XLSX - URL
                </label>
                <Input 
                  placeholder="https://..." 
                  value={formData.xlsx_url} 
                  onChange={e => setFormData({ ...formData, xlsx_url: e.target.value })} 
                  className="text-sm"
                />
              </div>
            </div>

            {/* PPTX */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Presentation size={12} />
                  PPTX - Titre
                </label>
                <Input 
                  placeholder="Ex: Présentation statuts juridiques" 
                  value={formData.pptx_title} 
                  onChange={e => setFormData({ ...formData, pptx_title: e.target.value })} 
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  PPTX - URL
                </label>
                <Input 
                  placeholder="https://..." 
                  value={formData.pptx_url} 
                  onChange={e => setFormData({ ...formData, pptx_url: e.target.value })} 
                  className="text-sm"
                />
              </div>
            </div>

            {/* HTML */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Code size={12} />
                  HTML - Titre
                </label>
                <Input 
                  placeholder="Ex: Simulateur interactif" 
                  value={formData.html_title} 
                  onChange={e => setFormData({ ...formData, html_title: e.target.value })} 
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  HTML - URL
                </label>
                <Input 
                  placeholder="https://..." 
                  value={formData.html_url} 
                  onChange={e => setFormData({ ...formData, html_url: e.target.value })} 
                  className="text-sm"
                />
              </div>
            </div>

            <p className="text-xs text-blue-700 mt-3 bg-blue-100 p-2 rounded">
              💡 Upload tes fichiers dans Supabase Storage ou utilise un CDN, puis colle l'URL ici
            </p>
          </div>

          {/* Marquer comme nouveau */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={formData.is_new}
              onChange={e => setFormData({ ...formData, is_new: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium">⭐ Marquer comme "Nouveau"</label>
          </div>

          {/* Boutons */}
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

      {/* Aperçu par modules */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
          <ArrowUpDown size={20} />
          Structure ({videos.length} vidéo{videos.length > 1 ? 's' : ''})
        </h3>

        {modulesList.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400">
              <Video size={64} className="mx-auto mb-4 opacity-20" />
              <p>Aucune vidéo</p>
            </CardContent>
          </Card>
        ) : (
          modulesList.map((module: any, idx) => (
            <Card key={idx} className="border-2">
              <CardContent className="p-0">
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                      module.category === "Créateur" ? "bg-blue-500" :
                      module.category === "Agent Immo" ? "bg-green-500" :
                      "bg-purple-500"
                    }`}>
                      {module.module_number}
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        module.category === "Créateur" ? "bg-blue-100 text-blue-700" :
                        module.category === "Agent Immo" ? "bg-green-100 text-green-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {module.category}
                      </span>
                      <h4 className="font-bold text-lg text-slate-900 uppercase">
                        {module.module_title}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {module.videos.length} vidéo{module.videos.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y">
                  {module.videos.map((video: any) => (
                    <div key={video.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                            {video.order_in_module}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-semibold text-slate-900">{video.title}</h5>
                              {video.is_new && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{video.duration}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => { 
                              setFormData(video); 
                              setEditingId(video.id); 
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            Modifier
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              if (confirm(`Supprimer "${video.title}" ?`)) {
                                deleteVideo(video.id);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>

                      {/* Affichage des fichiers */}
                      {(video.pdf_url || video.xlsx_url || video.pptx_url || video.html_url) && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {video.pdf_url && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded flex items-center gap-1">
                              <FileText size={12} />
                              {video.pdf_title || 'PDF'}
                            </span>
                          )}
                          {video.xlsx_url && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                              <Table size={12} />
                              {video.xlsx_title || 'XLSX'}
                            </span>
                          )}
                          {video.pptx_url && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded flex items-center gap-1">
                              <Presentation size={12} />
                              {video.pptx_title || 'PPTX'}
                            </span>
                          )}
                          {video.html_url && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                              <Code size={12} />
                              {video.html_title || 'HTML'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// ONGLET 2 : TUTOS PRATIQUES
// ============================================
function TutosPratiquesTab({ supabase }: any) {
  const [tutos, setTutos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
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
    setShowUpload(false);
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
            
            <div className="col-span-2">
              {showUpload ? (
                <UploadPDFTuto
                  onSuccess={(url) => {
                    setFormData({ ...formData, pdf_url: url });
                    setShowUpload(false);
                  }}
                  onCancel={() => setShowUpload(false)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="URL PDF" 
                    value={formData.pdf_url} 
                    onChange={e => setFormData({ ...formData, pdf_url: e.target.value })} 
                  />
                  <Button 
                    type="button"
                    onClick={() => setShowUpload(true)}
                    variant="outline"
                  >
                    <Upload size={16} className="mr-2" />
                    Upload
                  </Button>
                </div>
              )}
            </div>

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
// ONGLET 3 : COACHINGS
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
// ONGLET 4 : ATELIERS
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