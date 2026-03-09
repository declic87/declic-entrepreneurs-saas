"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Trash2, Edit, Save, X, FileText, Upload, 
  Video, AlertCircle, CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = [
  { value: 'prospection', label: '🎯 Prospection' },
  { value: 'closing', label: '💼 Closing' },
  { value: 'scripts', label: '📝 Scripts' },
  { value: 'objections', label: '🛡️ Objections' },
  { value: 'autre', label: '📁 Autre' },
];

const FILE_TYPES = {
  pdf: { label: 'PDF', icon: '📄' },
  xlsx: { label: 'Excel', icon: '📊' },
  docx: { label: 'Word', icon: '📝' },
  pptx: { label: 'PowerPoint', icon: '📽️' },
  html: { label: 'HTML', icon: '🌐' },
};

interface Tool {
  id: string;
  title: string;
  description: string;
  category: string;
  file_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  video_url: string;
  is_active: boolean;
  order_index: number;
}

export default function AdminOutilsClosersPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  async function loadTools() {
    try {
      const { data, error } = await supabase
        .from('closer_tools')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setTools(data || []);
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `closer-tools/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const fileType = file.name.split('.').pop()?.toLowerCase() || 'pdf';

      if (editingTool) {
        setEditingTool({
          ...editingTool,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: fileType,
        });
      }

      toast.success('Fichier uploadé !');
    } catch (err: any) {
      toast.error('Erreur upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!editingTool) return;

    try {
      if (editingTool.id.startsWith('new-')) {
        const { error } = await supabase
          .from('closer_tools')
          .insert({
            title: editingTool.title,
            description: editingTool.description,
            category: editingTool.category,
            file_type: editingTool.file_type,
            file_url: editingTool.file_url,
            file_name: editingTool.file_name,
            file_size: editingTool.file_size,
            video_url: editingTool.video_url,
            is_active: editingTool.is_active,
            order_index: editingTool.order_index,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('closer_tools')
          .update({
            title: editingTool.title,
            description: editingTool.description,
            category: editingTool.category,
            file_type: editingTool.file_type,
            file_url: editingTool.file_url,
            file_name: editingTool.file_name,
            file_size: editingTool.file_size,
            video_url: editingTool.video_url,
            is_active: editingTool.is_active,
            order_index: editingTool.order_index,
          })
          .eq('id', editingTool.id);

        if (error) throw error;
      }

      toast.success('Outil sauvegardé !');
      setEditingTool(null);
      loadTools();
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet outil ?')) return;

    try {
      const { error } = await supabase
        .from('closer_tools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Outil supprimé !');
      loadTools();
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  }

  function createNewTool(): Tool {
    return {
      id: `new-${Date.now()}`,
      title: '',
      description: '',
      category: 'prospection',
      file_type: 'pdf',
      file_url: '',
      file_name: '',
      file_size: 0,
      video_url: '',
      is_active: true,
      order_index: tools.length,
    };
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            🎯 Outils Closers
          </h1>
          <p className="text-slate-600 mt-2">
            Gérer les outils pour les commerciaux
          </p>
        </div>
        <Button
          onClick={() => setEditingTool(createNewTool())}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un outil
        </Button>
      </div>

      {/* Modal d'édition */}
      {editingTool && (
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center justify-between">
              <span>
                {editingTool.id.startsWith('new-') ? '➕ Nouvel outil' : '✏️ Modifier outil'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingTool(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Titre</label>
              <Input
                value={editingTool.title}
                onChange={(e) => setEditingTool({ ...editingTool, title: e.target.value })}
                placeholder="Ex: Script de prospection LinkedIn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={editingTool.description}
                onChange={(e) => setEditingTool({ ...editingTool, description: e.target.value })}
                placeholder="Description de l'outil..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Catégorie</label>
                <select
                  value={editingTool.category}
                  onChange={(e) => setEditingTool({ ...editingTool, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ordre</label>
                <Input
                  type="number"
                  value={editingTool.order_index}
                  onChange={(e) => setEditingTool({ ...editingTool, order_index: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fichier</label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.xlsx,.docx,.pptx,.html"
                  disabled={uploading}
                />
                {editingTool.file_url && (
                  <CheckCircle2 className="text-green-600" />
                )}
              </div>
              {editingTool.file_name && (
                <p className="text-xs text-slate-600 mt-1">
                  📎 {editingTool.file_name} ({(editingTool.file_size / 1024).toFixed(0)} Ko)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Vidéo explicative (Loom URL)</label>
              <Input
                value={editingTool.video_url}
                onChange={(e) => setEditingTool({ ...editingTool, video_url: e.target.value })}
                placeholder="https://www.loom.com/share/..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingTool.is_active}
                onChange={(e) => setEditingTool({ ...editingTool, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium">Outil actif</label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={!editingTool.title || !editingTool.file_url}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </Button>
              <Button
                onClick={() => setEditingTool(null)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des outils */}
      <div className="grid md:grid-cols-2 gap-4">
        {tools.map((tool) => {
          const category = CATEGORIES.find(c => c.value === tool.category);
          const fileType = FILE_TYPES[tool.file_type as keyof typeof FILE_TYPES];

          return (
            <Card key={tool.id} className={`${tool.is_active ? '' : 'opacity-50'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {category?.label}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {fileType?.icon} {fileType?.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTool(tool)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tool.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{tool.description}</p>
                {tool.video_url && (
                  <div className="mt-2 flex items-center gap-2 text-purple-600 text-xs">
                    <Video className="h-3 w-3" />
                    Vidéo disponible
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}