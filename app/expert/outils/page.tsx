"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, Download, Video, Play, Loader2, CheckCircle2, 
  AlertCircle, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = [
  { value: 'all', label: '📚 Tous', color: 'slate' },
  { value: 'fiscal', label: '💰 Fiscal', color: 'blue' },
  { value: 'juridique', label: '⚖️ Juridique', color: 'purple' },
  { value: 'social', label: '👥 Social', color: 'green' },
  { value: 'immobilier', label: '🏠 Immobilier', color: 'orange' },
  { value: 'autre', label: '📁 Autre', color: 'slate' },
];

const FILE_TYPES = {
  pdf: { label: 'PDF', icon: '📄', color: 'red' },
  xlsx: { label: 'Excel', icon: '📊', color: 'green' },
  docx: { label: 'Word', icon: '📝', color: 'blue' },
  pptx: { label: 'PowerPoint', icon: '📽️', color: 'orange' },
  html: { label: 'HTML', icon: '🌐', color: 'purple' },
};

export default function ExpertOutilsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [filteredCategory, setFilteredCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [expertId, setExpertId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<string | null>(null);

  useEffect(() => {
    loadExpertId();
    loadTools();
  }, [filteredCategory]);

  async function loadExpertId() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();

      if (userData) {
        const { data: expertData } = await supabase
          .from('experts')
          .select('id')
          .eq('userId', userData.id)
          .single();

        if (expertData) {
          setExpertId(expertData.id);
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  }

  async function loadTools() {
    try {
      let query = supabase
        .from('expert_tools')
        .select('*')
        .eq('is_active', true)
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

  async function handleDownload(tool: any, clientId?: string) {
    try {
      // Log le téléchargement
      if (expertId) {
        await supabase
          .from('expert_tool_downloads')
          .insert({
            tool_id: tool.id,
            expert_id: expertId,
            client_id: clientId || null,
          });
      }

      // Si HTML, ouvrir dans le viewer
      if (tool.file_type === 'html') {
        window.open(`/expert/outils/viewer/${tool.id}`, '_blank');
        toast.success('Document ouvert !');
        return;
      }

      // Sinon, télécharger normalement
      const link = document.createElement('a');
      link.href = tool.file_url;
      link.download = tool.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Téléchargement lancé !');
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  }

  function getLoomEmbedUrl(url: string): string {
    if (!url) return '';
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://www.loom.com/embed/${match[1]}`;
    }
    return url;
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
            Boîte à Outils
          </h1>
          <p className="text-slate-600 mt-2">
            Documents et templates pour vos rendez-vous clients
          </p>
        </div>
        <FileText className="text-amber-500" size={40} />
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap">
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

      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="text-amber-600" />
        <AlertDescription className="text-amber-800">
          💡 Astuce : Téléchargez ces documents avant vos appels et enregistrez-les dans la fiche client pour un accès rapide.
        </AlertDescription>
      </Alert>

      {/* Liste des outils */}
      <div className="grid md:grid-cols-2 gap-6">
        {tools.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="p-12 text-center text-slate-400">
              <FileText size={64} className="mx-auto mb-4 opacity-20" />
              <p>Aucun outil dans cette catégorie</p>
            </CardContent>
          </Card>
        ) : (
          tools.map((tool) => {
            const category = CATEGORIES.find(c => c.value === tool.category);
            const fileType = FILE_TYPES[tool.file_type as keyof typeof FILE_TYPES];
            
            return (
              <Card key={tool.id} className="border-2 hover:border-blue-300 transition-all">
                <CardHeader className="bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-4xl">{fileType?.icon || '📄'}</span>
                      <div>
                        <CardTitle className="text-xl">{tool.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {category && (
                            <Badge className="bg-blue-100 text-blue-700">
                              {category.label}
                            </Badge>
                          )}
                          <Badge variant="outline" className={`border-${fileType?.color}-200 text-${fileType?.color}-700`}>
                            {fileType?.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {tool.description && (
                    <p className="text-slate-600 text-sm">
                      {tool.description}
                    </p>
                  )}

                  {/* Vidéo explicative */}
                  {tool.video_url && (
                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVideoModal(tool.id)}
                        className="text-purple-700 hover:bg-purple-50"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Voir la vidéo explicative
                      </Button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleDownload(tool)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {tool.file_type === 'html' ? 'Ouvrir' : 'Télécharger'}
                    </Button>
                    {tool.file_type === 'html' ? (
                      <Button
                        variant="outline"
                        onClick={() => window.open(`/expert/outils/viewer/${tool.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => window.open(tool.file_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Info fichier */}
                  <div className="text-xs text-slate-500 text-center">
                    {tool.file_name} • {(tool.file_size / 1024).toFixed(0)} Ko
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal vidéo */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVideoModal(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">Vidéo explicative</h3>
              <button
                onClick={() => setShowVideoModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {(() => {
                const tool = tools.find(t => t.id === showVideoModal);
                if (!tool?.video_url) return null;
                
                return (
                  <iframe
                    src={getLoomEmbedUrl(tool.video_url)}
                    frameBorder="0"
                    allowFullScreen
                    className="w-full h-full"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}