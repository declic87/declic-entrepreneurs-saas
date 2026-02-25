"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { OnboardingVideo } from "@/components/OnboardingVideo";
import { 
  Handshake, Play, Video, Copy, CheckCircle2, ExternalLink, Loader2, 
  FileDown, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CategoryType = 'all' | 'comptabilite' | 'placement_financier' | 'investissement' | 'placement_structure' | 'autres';

const CATEGORIES = [
  { id: 'all' as CategoryType, label: '📚 Tous', color: 'slate' },
  { id: 'comptabilite' as CategoryType, label: '📊 Comptabilité', color: 'blue' },
  { id: 'placement_financier' as CategoryType, label: '💰 Placement Financier', color: 'green' },
  { id: 'investissement' as CategoryType, label: '🏢 Investissement', color: 'purple' },
  { id: 'placement_structure' as CategoryType, label: '📈 Placement Structuré', color: 'orange' },
  { id: 'autres' as CategoryType, label: '🤝 Autres', color: 'indigo' },
];

interface AffiliateInfo {
  link_template: string;
  user_code: string;
  full_link: string;
}

export default function PartenairePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [content, setContent] = useState<any[]>([]);
  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadContent();
  }, [activeCategory]);

  async function loadContent() {
    try {
      // Charger les contenus par catégorie
      let query = supabase
        .from('partner_content')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      const { data } = await query;
      setContent(data || []);

      // Charger le lien d'affiliation (pour toutes les catégories)
      const { data: affiliateData } = await supabase
        .from('partner_content')
        .select('link_template')
        .eq('content_type', 'affiliate_link')
        .eq('is_active', true)
        .single();

      // Générer le code utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email')
          .eq('auth_id', session.user.id)
          .single();

        if (userData && affiliateData?.link_template) {
          const userCode = `DECLIC${userData.id.substring(0, 8).toUpperCase()}`;
          const fullLink = affiliateData.link_template.replace('{USER_CODE}', userCode);

          setAffiliateInfo({
            link_template: affiliateData.link_template,
            user_code: userCode,
            full_link: fullLink,
          });
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
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

  function getFathomEmbedUrl(url: string): string {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    const match = url.match(/fathom\.video\/share\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://fathom.video/embed/${match[1]}`;
    }
    return url;
  }

  async function copyAffiliateLink() {
    if (!affiliateInfo?.full_link) return;

    try {
      await navigator.clipboard.writeText(affiliateInfo.full_link);
      setCopied(true);
      toast.success('Lien copié dans le presse-papier !');
      
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('Erreur lors de la copie');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Vidéo onboarding */}
      <OnboardingVideo pageSlug="partenaire" role="CLIENT" />

      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Handshake className="text-amber-500" size={40} />
          <h1 className="text-4xl font-black text-slate-900">
            Nos Partenaires
          </h1>
        </div>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Découvrez notre réseau de partenaires experts pour vous accompagner
        </p>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex gap-2 flex-wrap justify-center">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Lien d'affiliation (affiché en haut si disponible) */}
      {affiliateInfo && (
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Handshake className="text-amber-600" size={24} />
              Votre Lien d'Affiliation
            </CardTitle>
            <p className="text-sm text-slate-600">
              Partagez ce lien unique pour gagner des commissions sur chaque vente
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Votre code partenaire
              </label>
              <div className="bg-white px-4 py-3 rounded-lg border-2 border-amber-300 text-center">
                <p className="text-2xl font-black text-amber-600 tracking-wider">
                  {affiliateInfo.user_code}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Votre lien personnalisé
              </label>
              <div className="flex gap-2">
                <Input
                  value={affiliateInfo.full_link}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyAffiliateLink}
                  className={`min-w-[120px] ${
                    copied
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-amber-500 hover:bg-amber-600'
                  } text-white`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Alert className="border-amber-300 bg-amber-50">
              <AlertDescription className="text-amber-800">
                <p className="font-semibold mb-2">💡 Comment utiliser votre lien ?</p>
                <ul className="list-disc ml-4 space-y-1 text-sm">
                  <li>Partagez ce lien sur vos réseaux sociaux</li>
                  <li>Envoyez-le par email à vos contacts</li>
                  <li>Intégrez-le dans vos articles de blog</li>
                  <li>Gagnez une commission sur chaque vente générée</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Liste des partenaires */}
      {content.length === 0 ? (
        <Card className="border-2 border-slate-200">
          <CardContent className="p-12 text-center">
            <Handshake className="mx-auto text-slate-300 mb-4" size={64} />
            <p className="text-slate-600">
              Aucun partenaire dans cette catégorie pour le moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {content.map((item) => {
            const category = CATEGORIES.find(c => c.id === item.category);
            
            return (
              <Card key={item.id} className="border-2 border-slate-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                    {category && (
                      <Badge className="bg-blue-100 text-blue-700">
                        {category.label}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-slate-600 mt-2">{item.description}</p>
                  )}
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Vidéo Loom Intro */}
                  {item.video_url && (
                    <div>
                      <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                        <Play size={18} />
                        🎥 Présentation
                      </h3>
                      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                        <iframe
                          src={getLoomEmbedUrl(item.video_url)}
                          frameBorder="0"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Vidéo Fathom */}
                  {item.fathom_recording_url && (
                    <div>
                      <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <Video size={18} />
                        🎬 Échange avec le partenaire
                      </h3>
                      
                      {/* Carte avec bouton d'accès */}
                      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white mb-3">
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center space-y-4">
                            <Video className="text-blue-600" size={48} />
                            <div>
                              <h4 className="text-xl font-bold text-blue-900 mb-2">
                                Vidéo de présentation
                              </h4>
                              <p className="text-sm text-slate-600 mb-4">
                                Découvrez notre échange avec le partenaire
                              </p>
                            </div>
                            <Button
                              asChild
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              size="lg"
                            >
                              <a 
                                href={item.fathom_recording_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Play size={18} className="mr-2" />
                                Voir la vidéo Fathom
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {item.fathom_summary && (
                        <Alert className="border-blue-200 bg-blue-50">
                          <AlertDescription className="text-blue-800">
                            <p className="font-semibold mb-1">📝 Résumé de l'échange</p>
                            <p className="text-sm">{item.fathom_summary}</p>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* PDF + Lien */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* PDF Explicatif */}
                    {item.pdf_file_url && (
                      <Card className="border-2 border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <FileDown className="text-green-600" size={24} />
                            <div>
                              <p className="font-semibold text-green-900">
                                📄 Documentation
                              </p>
                              <p className="text-xs text-green-700">
                                {item.pdf_file_name || 'Document explicatif'}
                              </p>
                            </div>
                          </div>
                          <Button
                            asChild
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            <a 
                              href={item.pdf_file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              download
                            >
                              <Download size={16} className="mr-2" />
                              Télécharger le PDF
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Lien contact partenaire */}
                    {item.link_template && (
                      <Card className="border-2 border-amber-200 bg-amber-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <ExternalLink className="text-amber-600" size={24} />
                            <div>
                              <p className="font-semibold text-amber-900">
                                🔗 Contact Partenaire
                              </p>
                              <p className="text-xs text-amber-700">
                                {item.link_template.includes('@') ? 'Email' : 'Site web'}
                              </p>
                            </div>
                          </div>
                          <Button
                            asChild
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            {item.link_template.includes('@') ? (
                              <a href={`mailto:${item.link_template}`}>
                                <ExternalLink size={16} className="mr-2" />
                                Envoyer un email
                              </a>
                            ) : (
                              <a 
                                href={item.link_template} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <ExternalLink size={16} className="mr-2" />
                                Accéder au site
                              </a>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}