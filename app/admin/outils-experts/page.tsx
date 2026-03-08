"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, Upload, Trash2, Download, Video, Eye, 
  Loader2, CheckCircle2, AlertCircle, Save, Plus
} from "lucide-react";
import { toast } from "sonner";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = [
  { value: 'fiscal', label: '💰 Fiscal', color: 'blue' },
  { value: 'juridique', label: '⚖️ Juridique', color: 'purple' },
  { value: 'social', label: '👥 Social', color: 'green' },
  { value: 'immobilier', label: '🏠 Immobilier', color: 'orange' },
  { value: 'autre', label: '📁 Autre', color: 'slate' },
];

const FILE_TYPES = [
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'xlsx', label: 'Excel', icon: '📊' },
  { value: 'docx', label: 'Word', icon: '📝' },
  { value: 'pptx', label: 'PowerPoint', icon: '📽️' },
  { value: 'html', label: 'HTML', icon: '🌐' },
];

export default function AdminOutilsExpertsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [filteredCategory, setFilteredCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'fiscal',
    file_type: 'pdf',
    video_url: '',
  });

  useEffect(() => {
    loadTools();
  }, [filteredCategory]);

  async function loadTools() {
    try {
      let query = supabase
        .from('expert_tools')
        .select('*')
        .order('order_index');

      if (filteredCategory !== 'all') {
        query = query.eq('category', filteredCategory);
      }

      const { data } = await query;
      setTools(data || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File, toolId?: string) {
    const uploadId = toolId || 'new';
    setUploading(uploadId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `tools/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('expert-tools')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('expert-tools')
        .getPublicUrl(filePath);

      if (toolId) {
        const { error: updateError } = await supabase
          .from('expert_tools')
          .update({
            file_url: urlData.publicUrl,
            file_name: file.name,
            file_size: file.size,
          })
          .eq('id', toolId);

        if (updateError) throw updateError;
        
        toast.success('Fichier uploadé !');
        loadTools();
      } else {
        return {
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
        };
      }
    } catch (err: any) {
      toast.error('Erreur upload: ' + err.message);
      return null;
    } finally {
      setUploading(null);
    }
  }

  async function handleCreateTool(fileData: any) {
    if (!fileData) {
      toast.error('Veuillez uploader un fichier');
      return;
    }

    try {
      const { error } = await supabase
        .from('expert_tools')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          file_type: formData.file_type,
          file_url: fileData.file_url,
          file_name: fileData.file_name,
          file_size: fileData.file_size,
          video_url: formData.video_url || null,
          is_active: true,
          order_index: tools.length + 1,
        });

      if (error) throw error;

      toast.success('Outil créé !');
      setShowAddForm(false);
      setFormData({
        title: '',
        description: '',
        category: 'fiscal',
        file_type: 'pdf',
        video_url: '',
      });
      loadTools();
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  }

  async function handleSave(tool: any) {
    setSaving(tool.id);

    try {
      const { error } = await supabase
        .from('expert_tools')
        .update({
          title: tool.title,
          description: tool.description,
          category: tool.category,
          video_url: tool.video_url,
          is_active: tool.is_active,
        })
        .eq('id', tool.id);

      if (error) throw error;

      toast.success('Outil mis à jour !');
      loadTools();
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(toolId: string) {
    if (!confirm('Supprimer cet outil ?')) return;

    try {
      const { error } = await supabase
        .from('expert_tools')
        .delete()
        .eq('id', toolId);

      if (error) throw error;

      toast.success('Outil supprimé !');
      loadTools();
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  }

  function updateTool(id: string, field: string, value: any) {
    setTools(prev => 
      prev.map(t => t.id === id ? { ...t, [field]: value } : t)
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
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Outils & Templates Experts
          </h1>
          <p className="text-slate-600 mt-2">
            Bibliothèque de documents pour les rendez-vous clients
          </p>
        </div>
        <FileText className="text-amber-500" size={40} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilteredCategory('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filteredCategory === 'all'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          📚 Tous les outils
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilteredCategory(cat.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filteredCategory === cat.value
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="text-blue-600" />
        <AlertDescription className="text-blue-800">
          Ces outils sont accessibles par tous les experts dans leur espace.
          Ils peuvent les télécharger et les enregistrer dans les fiches clients.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          {showAddForm ? 'Annuler' : 'Ajouter un outil'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle>Nouvel outil / template</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Titre</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Guide Création SASU"
                />
              </div>
              <div>
                <Label>Catégorie</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="À quoi sert ce document..."
                rows={3}
              />
            </div>

            <div>
              <Label>Type de fichier</Label>
              <div className="flex gap-2">
                {FILE_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, file_type: type.value })}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.file_type === type.value
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Vidéo explicative (optionnel)</Label>
              <Input
                type="url"
                placeholder="https://www.loom.com/share/..."
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              />
            </div>

            <div>
              <Label>Fichier</Label>
              <Input
                type="file"
                accept=".pdf,.xlsx,.docx,.pptx,.html"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const fileData = await handleFileUpload(file);
                    if (fileData) {
                      handleCreateTool(fileData);
                    }
                  }
                }}
                disabled={uploading === 'new'}
              />
              {uploading === 'new' && (
                <div className="flex items-center gap-2 mt-2 text-blue-600">
                  <Loader2 className="animate-spin" size={16} />
                  Upload en cours...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {tools.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400">
              <FileText size={64} className="mx-auto mb-4 opacity-20" />
              <p>Aucun outil dans cette catégorie</p>
            </CardContent>
          </Card>
        ) : (
          tools.map((tool) => {
            const category = CATEGORIES.find(c => c.value === tool.category);
            const fileType = FILE_TYPES.find(f => f.value === tool.file_type);
            
            return (
              <Card key={tool.id} className="border-2">
                <CardHeader className="bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-3xl">{fileType?.icon || '📄'}</span>
                      <Input
                        value={tool.title}
                        onChange={(e) => updateTool(tool.id, 'title', e.target.value)}
                        className="font-bold text-lg max-w-md"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(tool.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                      <button
                        onClick={() => updateTool(tool.id, 'is_active', !tool.is_active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          tool.is_active ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            tool.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {category && (
                      <Badge className="bg-blue-100 text-blue-700">
                        {category.label}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {fileType?.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={tool.description || ''}
                      onChange={(e) => updateTool(tool.id, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Vidéo explicative</Label>
                    <Input
                      type="url"
                      placeholder="https://www.loom.com/share/..."
                      value={tool.video_url || ''}
                      onChange={(e) => updateTool(tool.id, 'video_url', e.target.value)}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Fichier actuel</p>
                        <p className="text-xs text-slate-500">{tool.file_name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(tool.file_url, '_blank')}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.pdf,.xlsx,.docx,.pptx,.html';
                            input.onchange = (e: any) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, tool.id);
                            };
                            input.click();
                          }}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Remplacer
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={() => handleSave(tool)}
                      disabled={saving === tool.id}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      {saving === tool.id ? (
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