"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Video, Play, Save, Plus, Trash2, Eye, EyeOff, Upload,
  Loader2, Users, FileText, GraduationCap, Calendar,
  Handshake, CheckCircle2, AlertCircle, ChevronDown, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TabType = 'admin' | 'client' | 'formations' | 'lives' | 'partenaire';

const TABS = [
  { id: 'admin' as TabType, label: 'Vidéos Staff', icon: Users },
  { id: 'client' as TabType, label: 'Vidéos Client', icon: FileText },
  { id: 'formations' as TabType, label: 'Formations & Tutos', icon: GraduationCap },
  { id: 'lives' as TabType, label: 'Ateliers & Coachings', icon: Calendar },
  { id: 'partenaire' as TabType, label: 'Contenu Partenaire', icon: Handshake },
];

export default function AdminVideosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('client');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Gestion des Vidéos
          </h1>
          <p className="text-slate-600 mt-2">
            Configurez tous les contenus vidéo de la plateforme
          </p>
        </div>
        <Video className="text-amber-500" size={40} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600 bg-amber-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'admin' && <VideosAdminSection />}
        {activeTab === 'client' && <VideosClientSection />}
        {activeTab === 'formations' && <FormationsSection />}
        {activeTab === 'lives' && <LivesSection />}
        {activeTab === 'partenaire' && <PartenaireSection />}
      </div>
    </div>
  );
}

// ==========================================
// SECTION 1 : VIDÉOS STAFF (Closers, HOS, Experts)
// ==========================================
function VideosAdminSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vidéos Onboarding Staff</CardTitle>
        <p className="text-sm text-slate-600">
          Vidéos de formation pour Closers, HOS et Experts
        </p>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="text-blue-600" />
          <AlertDescription>
            Section en cours de développement
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// ==========================================
// SECTION 2 : VIDÉOS CLIENT (Welcome + 9 pages)
// ==========================================
function VideosClientSection() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    try {
      const { data } = await supabase
        .from('onboarding_videos_client')
        .select('*')
        .order('page_slug');

      setVideos(data || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(video: any) {
    setSaving(video.id);

    try {
      const { error } = await supabase
        .from('onboarding_videos_client')
        .update({
          video_url: video.video_url,
          video_type: video.video_type,
          title: video.title,
          description: video.description,
          is_active: video.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', video.id);

      if (error) throw error;

      toast.success('Vidéo mise à jour !');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  }

  function updateVideo(id: string, field: string, value: any) {
    setVideos(prev => 
      prev.map(v => v.id === id ? { ...v, [field]: value } : v)
    );
  }

  const PAGE_LABELS: Record<string, string> = {
    welcome: '👋 Bienvenue Générale',
    dashboard: '📊 Dashboard',
    'creation-societe': '🏢 Création Société',
    'mon-dossier': '📁 Mon Dossier',
    paiements: '💳 Paiements',
    documents: '📄 Documents',
    simulateur: '🧮 Simulateur',
    messages: '💬 Messages',
    parametres: '⚙️ Paramètres',
    partenaire: '🤝 Partenaire',
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="text-blue-600" />
        <AlertDescription className="text-blue-800">
          Ces vidéos s'affichent automatiquement en haut de chaque page correspondante dans l'espace client.
        </AlertDescription>
      </Alert>

      {videos.map((video) => (
        <Card key={video.id} className="border-2">
          <CardHeader className="bg-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {PAGE_LABELS[video.page_slug] || video.page_slug}
              </CardTitle>
              <button
                onClick={() => updateVideo(video.id, 'is_active', !video.is_active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  video.is_active ? 'bg-amber-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    video.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de vidéo</Label>
                <Select
                  value={video.video_type}
                  onValueChange={(value) => updateVideo(video.id, 'video_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loom">Loom</SelectItem>
                    <SelectItem value="fathom">Fathom</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>URL de la vidéo</Label>
                <Input
                  type="url"
                  placeholder="https://www.loom.com/share/..."
                  value={video.video_url}
                  onChange={(e) => updateVideo(video.id, 'video_url', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Titre</Label>
              <Input
                value={video.title}
                onChange={(e) => updateVideo(video.id, 'title', e.target.value)}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={video.description || ''}
                onChange={(e) => updateVideo(video.id, 'description', e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              {video.video_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(video.video_url, '_blank')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Prévisualiser
                </Button>
              )}
              <Button
                onClick={() => handleSave(video)}
                disabled={saving === video.id || !video.video_url}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {saving === video.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Sauvegarder
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ==========================================
// SECTION 3 : FORMATIONS
// ==========================================
function FormationsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Formations & Tutos</CardTitle>
        <p className="text-sm text-slate-600">
          Gérer les vidéos de formation (Loom) avec accès par pack
        </p>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="text-blue-600" />
          <AlertDescription>
            Section en cours de développement
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// ==========================================
// SECTION 4 : LIVES (Ateliers & Coachings)
// ==========================================
function LivesSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ateliers & Coachings</CardTitle>
        <p className="text-sm text-slate-600">
          Gérer les lives hebdomadaires et les replays Fathom
        </p>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="text-blue-600" />
          <AlertDescription>
            Section en cours de développement
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// ==========================================
// SECTION 5 : PARTENAIRE AVEC CATÉGORIES + FATHOM + PDF
// ==========================================
function PartenaireSection() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    comptabilite: { label: 'Comptabilité', icon: '📊', color: 'blue' },
    placement_financier: { label: 'Placement Financier', icon: '💰', color: 'green' },
    investissement: { label: 'Investissement', icon: '🏢', color: 'purple' },
    placement_structure: { label: 'Placement Structuré', icon: '📈', color: 'orange' },
    banque: { label: 'Banque', icon: '🏦', color: 'indigo' },
    autres: { label: 'Autres', icon: '🤝', color: 'slate' },
  };

  useEffect(() => {
    loadCategories();
  }, [selectedCategory]);

  async function loadCategories() {
    try {
      let query = supabase
        .from('partner_content')
        .select('*')
        .order('order_index');

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data } = await query;
      setCategories(data || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(item: any) {
    setSaving(item.id);

    try {
      const { error } = await supabase
        .from('partner_content')
        .update({
          title: item.title,
          description: item.description,
          video_url: item.video_url,
          video_type: item.video_type,
          fathom_recording_url: item.fathom_recording_url,
          fathom_summary: item.fathom_summary,
          pdf_file_url: item.pdf_file_url,
          pdf_file_name: item.pdf_file_name,
          link_template: item.link_template,
          is_active: item.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      toast.success('Contenu mis à jour !');
      loadCategories();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  }

  async function handleUploadPDF(itemId: string, file: File) {
    setUploading(itemId);

    try {
      const fileName = `partner-${itemId}-${Date.now()}.pdf`;
      const filePath = `partner-pdfs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('content-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('partner_content')
        .update({
          pdf_file_url: urlData.publicUrl,
          pdf_file_name: file.name,
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      toast.success('PDF uploadé !');
      loadCategories();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(null);
    }
  }

  function updateContent(id: string, field: string, value: any) {
    setCategories(prev => 
      prev.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres par catégorie */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          📚 Toutes les catégories
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === key
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="text-green-600" />
        <AlertDescription className="text-green-800">
          Ces contenus s'affichent dans l'onglet Partenaire accessible à TOUS les clients.
          Chaque catégorie peut avoir : 1 vidéo Loom intro + 1 vidéo Fathom + 1 PDF explicatif
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400">
              <Handshake size={64} className="mx-auto mb-4 opacity-20" />
              <p>Aucun contenu dans cette catégorie</p>
            </CardContent>
          </Card>
        ) : (
          categories.map((item) => {
            const categoryInfo = CATEGORY_LABELS[item.category];
            
            return (
              <Card key={item.id} className="border-2">
                <CardHeader className="bg-slate-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">{categoryInfo?.icon || '📄'}</span>
                      {item.title}
                    </CardTitle>
                    <button
                      onClick={() => updateContent(item.id, 'is_active', !item.is_active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        item.is_active ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          item.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {item.category && (
                    <Badge className="bg-blue-100 text-blue-700 w-fit">
                      {categoryInfo?.label || item.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Vidéo Loom */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <Play size={18} />
                      🎥 Vidéo Loom d'introduction
                    </h4>
                    <Input
                      type="url"
                      placeholder="https://www.loom.com/share/..."
                      value={item.video_url || ''}
                      onChange={(e) => updateContent(item.id, 'video_url', e.target.value)}
                    />
                  </div>

                  {/* Vidéo Fathom */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <Video size={18} />
                      🎬 Vidéo Fathom avec le partenaire
                    </h4>
                    <div className="space-y-3">
                      <Input
                        type="url"
                        placeholder="https://fathom.video/share/..."
                        value={item.fathom_recording_url || ''}
                        onChange={(e) => updateContent(item.id, 'fathom_recording_url', e.target.value)}
                      />
                      <Textarea
                        placeholder="Résumé Fathom (optionnel)"
                        value={item.fathom_summary || ''}
                        onChange={(e) => updateContent(item.id, 'fathom_summary', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* PDF */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                      <FileText size={18} />
                      📄 PDF Explicatif
                    </h4>
                    {item.pdf_file_url ? (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-green-600" size={20} />
                            <div>
                              <p className="font-semibold text-green-900">
                                {item.pdf_file_name || 'Document.pdf'}
                              </p>
                              <a 
                                href={item.pdf_file_url} 
                                target="_blank" 
                                className="text-xs text-green-600 hover:underline"
                              >
                                Voir le PDF
                              </a>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateContent(item.id, 'pdf_file_url', null);
                              updateContent(item.id, 'pdf_file_name', null);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadPDF(item.id, file);
                          }}
                          disabled={uploading === item.id}
                          className="flex-1"
                        />
                        {uploading === item.id && (
                          <Loader2 className="animate-spin text-green-500" size={20} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lien affiliation */}
                  <div className="border-l-4 border-amber-500 pl-4">
                    <h4 className="font-bold text-amber-900 mb-3">
                      🔗 Lien d'affiliation ou Email
                    </h4>
                    <Input
                      placeholder="https://... ou email@partenaire.fr"
                      value={item.link_template || ''}
                      onChange={(e) => updateContent(item.id, 'link_template', e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={item.description || ''}
                      onChange={(e) => updateContent(item.id, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={() => handleSave(item)}
                      disabled={saving === item.id}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      {saving === item.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Sauvegarder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}