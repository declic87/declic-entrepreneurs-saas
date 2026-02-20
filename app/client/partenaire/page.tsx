"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { OnboardingVideo } from "@/components/OnboardingVideo";
import { Handshake, Play, Video, Copy, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PartnerVideo {
  id: string;
  content_type: string;
  title: string;
  description: string;
  video_url: string;
  video_type: string;
  order_index: number;
}

interface AffiliateInfo {
  link_template: string;
  user_code: string;
  full_link: string;
}

export default function PartenairePage() {
  const [videos, setVideos] = useState<PartnerVideo[]>([]);
  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPartnerContent();
  }, []);

  async function loadPartnerContent() {
    try {
      // 1. Charger les vidéos
      const { data: videosData } = await supabase
        .from('partner_content')
        .select('*')
        .in('content_type', ['video_intro', 'video_demo'])
        .eq('is_active', true)
        .order('order_index');

      if (videosData) {
        setVideos(videosData);
      }

      // 2. Charger le template de lien d'affiliation
      const { data: affiliateData } = await supabase
        .from('partner_content')
        .select('link_template')
        .eq('content_type', 'affiliate_link')
        .eq('is_active', true)
        .single();

      // 3. Récupérer l'ID utilisateur pour générer le lien personnalisé
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email')
          .eq('auth_id', session.user.id)
          .single();

        if (userData && affiliateData?.link_template) {
          // Générer un code unique basé sur l'ID utilisateur
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
      console.error('Erreur chargement contenu partenaire:', err);
    } finally {
      setLoading(false);
    }
  }

  function getLoomEmbedUrl(url: string): string {
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://www.loom.com/embed/${match[1]}`;
    }
    return url;
  }

  function getFathomEmbedUrl(url: string): string {
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

  const videoIntro = videos.find(v => v.content_type === 'video_intro');
  const videoDemo = videos.find(v => v.content_type === 'video_demo');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* VIDÉO ONBOARDING */}
      <OnboardingVideo pageSlug="partenaire" role="CLIENT" />

      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Handshake className="text-amber-500" size={40} />
          <h1 className="text-4xl font-black text-slate-900">
            Programme Partenaire
          </h1>
        </div>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Découvrez notre programme et gagnez des revenus en recommandant Déclic Entrepreneurs
        </p>
      </div>

      {/* Vidéo d'introduction */}
      {videoIntro && videoIntro.video_url && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Play className="text-purple-600" size={24} />
              {videoIntro.title}
            </CardTitle>
            {videoIntro.description && (
              <p className="text-sm text-slate-600">{videoIntro.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              {videoIntro.video_type === 'loom' ? (
                <iframe
                  src={getLoomEmbedUrl(videoIntro.video_url)}
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <video
                  src={videoIntro.video_url}
                  controls
                  className="w-full h-full"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vidéo de démonstration */}
      {videoDemo && videoDemo.video_url && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Video className="text-blue-600" size={24} />
              {videoDemo.title}
            </CardTitle>
            {videoDemo.description && (
              <p className="text-sm text-slate-600">{videoDemo.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              {videoDemo.video_type === 'fathom' ? (
                <iframe
                  src={getFathomEmbedUrl(videoDemo.video_url)}
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : videoDemo.video_type === 'loom' ? (
                <iframe
                  src={getLoomEmbedUrl(videoDemo.video_url)}
                  frameBorder="0"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <video
                  src={videoDemo.video_url}
                  controls
                  className="w-full h-full"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lien d'affiliation */}
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
            {/* Code partenaire */}
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

            {/* Lien complet */}
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

            {/* Instructions */}
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

      {/* Absence de contenu */}
      {!videoIntro && !videoDemo && !affiliateInfo && (
        <Card className="border-2 border-slate-200">
          <CardContent className="p-12 text-center">
            <Handshake className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Programme Partenaire
            </h3>
            <p className="text-slate-600">
              Le contenu du programme partenaire sera bientôt disponible.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}