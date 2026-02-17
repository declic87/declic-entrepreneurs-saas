"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Video, Play, Save, Plus, Trash2, Eye, EyeOff, 
  Loader2, Users, FileText, GraduationCap, Calendar,
  Handshake, CheckCircle2, AlertCircle, ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
              {/* Toggle sans Switch component */}
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
// SECTION 5 : PARTENAIRE
// ==========================================
function PartenaireSection() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    try {
      const { data } = await supabase
        .from('partner_content')
        .select('*')
        .order('order_index');

      setContent(data || []);
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
          link_template: item.link_template,
          is_active: item.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (error) throw error;

      toast.success('Contenu mis à jour !');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  }

  function updateContent(id: string, field: string, value: any) {
    setContent(prev => 
      prev.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  }

  const CONTENT_LABELS: Record<string, string> = {
    video_intro: '🎥 Vidéo Introduction (Loom)',
    video_demo: '🎬 Vidéo Démo Produit (Fathom)',
    affiliate_link: '🔗 Template Lien Affiliation',
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
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="text-green-600" />
        <AlertDescription className="text-green-800">
          Ce contenu s'affiche dans l'onglet Partenaire accessible à TOUS les clients.
        </AlertDescription>
      </Alert>

      {content.map((item) => (
        <Card key={item.id} className="border-2">
          <CardHeader className="bg-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {CONTENT_LABELS[item.content_type] || item.content_type}
              </CardTitle>
              {/* Toggle sans Switch component */}
              <button
                onClick={() => updateContent(item.id, 'is_active', !item.is_active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  item.is_active ? 'bg-amber-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    item.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {item.content_type !== 'affiliate_link' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type de vidéo</Label>
                    <Select
                      value={item.video_type || 'loom'}
                      onValueChange={(value) => updateContent(item.id, 'video_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loom">Loom</SelectItem>
                        <SelectItem value="fathom">Fathom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>URL de la vidéo</Label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={item.video_url || ''}
                      onChange={(e) => updateContent(item.id, 'video_url', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Titre</Label>
                  <Input
                    value={item.title}
                    onChange={(e) => updateContent(item.id, 'title', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={item.description || ''}
                    onChange={(e) => updateContent(item.id, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}

            {item.content_type === 'affiliate_link' && (
              <div>
                <Label>Template du lien (utilisez {'{USER_CODE}'})</Label>
                <Input
                  placeholder="https://declic-entrepreneurs.fr/ref/{USER_CODE}"
                  value={item.link_template || ''}
                  onChange={(e) => updateContent(item.id, 'link_template', e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {'{USER_CODE}'} sera remplacé automatiquement par le code unique de chaque client
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              {item.video_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(item.video_url, '_blank')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Prévisualiser
                </Button>
              )}
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
      ))}
    </div>
  );
}