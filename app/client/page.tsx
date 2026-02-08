"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Video, Clock, Download, Calendar, Users, Sparkles, 
  ExternalLink, Phone, CheckCircle2, Star, BookOpen, 
  ArrowRight, Search, GraduationCap, ShoppingCart, Lock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserAccess } from '@/hooks/useUserAccess';

// --- Interfaces ---
interface Template {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
}

interface VideoData {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  loom_id?: string;
  fathom_id?: string;
  is_new?: boolean;
  templates?: Template[];
}

interface Session {
  id: string;
  title: string;
  description: string;
  session_date: string;
  time_slot: string;
  meet_link?: string;
  fathom_id?: string;
  max_inscrits?: number;
}

interface Atelier extends Session {
  places_prises: number;
  max_places: number;
  lien_inscription?: string;
  atelier_date: string;
}

export default function MemberDashboard({ 
  videos = [], 
  coachings = [], 
  ateliers = [],
  isLoading = false 
}: any) {
  const [activeTab, setActiveTab] = useState("videos");
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Hook de gestion des accès
  const { pack, hasAccess, loading: accessLoading, daysRemaining } = useUserAccess();

  useEffect(() => {
    setMounted(true);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filteredVideos = useMemo(() => {
    return videos.filter((v: VideoData) => 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [videos, searchQuery]);

  const { nextCoaching, futureCoachings } = useMemo(() => {
    const sorted = coachings
      .filter((c: Session) => c.session_date >= today)
      .sort((a: Session, b: Session) => a.session_date.localeCompare(b.session_date));
    return {
      nextCoaching: sorted[0],
      futureCoachings: sorted.slice(1)
    };
  }, [coachings, today]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  if (!mounted || isLoading || accessLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8 space-y-4">
        <div className="h-10 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Filtrer les onglets selon les accès
  const availableTabs = [
    { id: "videos", label: "Formations", icon: <Video size={16} />, access: hasAccess.tutosPratiques },
    { id: "tutos-pratiques", label: "Tutos Pratiques", icon: <BookOpen size={16} />, access: hasAccess.tutosPratiquesLoom },
    { id: "formations-premium", label: "Formations Premium", icon: <GraduationCap size={16} />, access: hasAccess.formationsPremium },
    { id: "coaching", label: "Coachings Live", icon: <Users size={16} />, access: hasAccess.coachings },
    { id: "ateliers", label: "Ateliers", icon: <Calendar size={16} />, access: hasAccess.ateliers },
    { id: "rdv-inclus", label: "Mon RDV", icon: <Phone size={16} />, access: hasAccess.rdvGratuit },
    { id: "rdv-payants", label: "Expert +", icon: <Sparkles size={16} />, access: hasAccess.expertPayant }
  ].filter(tab => tab.access);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      
      {/* Bandeau Pack actuel */}
      {pack && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-bold uppercase">Votre pack actuel</p>
              <p className="text-lg font-black text-gray-900">{pack.replace(/_/g, ' ')}</p>
            </div>
            {hasAccess.rdvExpert > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-600">RDV Expert restants</p>
                <p className="text-2xl font-black text-amber-600">{hasAccess.rdvExpert}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menu Navigation */}
      <nav className="flex gap-2 border-b overflow-x-auto pb-px scrollbar-hide">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
              activeTab === tab.id 
              ? "border-amber-500 text-amber-600 bg-amber-50/50" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {/* VIDÉOS (Tutos pratiques) */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un module ou une catégorie..." 
              className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 ring-amber-500/20 border-gray-200 outline-none transition-all"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            {filteredVideos.map((video: VideoData) => (
              <Card key={video.id} className={`overflow-hidden transition-all duration-300 ${expandedVideo === video.id ? "ring-2 ring-amber-500 shadow-lg" : "hover:border-amber-200 shadow-sm"}`}>
                <CardContent className="p-0">
                  {expandedVideo === video.id ? (
                    <div className="animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">{video.category}</span>
                          <h3 className="font-bold text-gray-900">{video.title}</h3>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setExpandedVideo(null)}>Fermer</Button>
                      </div>
                      
                      <div className="aspect-video w-full bg-black">
                        {video.fathom_id ? (
                          <iframe 
                            src={`https://share.descript.com/embed/${video.fathom_id}`}
                            frameBorder="0" 
                            allowFullScreen 
                            className="w-full h-full"
                          />
                        ) : video.loom_id ? (
                          <iframe 
                            src={`https://www.loom.com/embed/${video.loom_id}`}
                            frameBorder="0" 
                            allowFullScreen 
                            className="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                            <Video size={48} className="mb-2 opacity-20" />
                            <p>Contenu en cours de téléchargement...</p>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <p className="text-gray-600 mb-6 leading-relaxed">{video.description}</p>
                        {video.templates && video.templates.length > 0 && (
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                              <Download size={14} /> Ressources à télécharger
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {video.templates.map((t) => (
                                <a 
                                  key={t.id} 
                                  href={t.file_url || "#"} 
                                  target="_blank" 
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                                    t.file_url ? "bg-white border-gray-200 hover:border-amber-500 hover:text-amber-600 shadow-sm" : "opacity-50 cursor-not-allowed bg-gray-100"
                                  }`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  {t.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setExpandedVideo(video.id)} className="p-4 cursor-pointer flex items-center gap-4 group">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        (video.loom_id || video.fathom_id) ? "bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white" : "bg-gray-100 text-gray-400"
                      }`}>
                        <Video size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">{video.category}</span>
                          {video.is_new && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-black">New</span>}
                        </div>
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-amber-600 transition-colors">{video.title}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <Clock size={12} /> {video.duration} • Cliquez pour regarder
                        </p>
                      </div>
                      <ArrowRight size={18} className="text-gray-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TUTOS PRATIQUES - NOUVEAU */}
      {activeTab === "tutos-pratiques" && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Tutos Pratiques</h2>
            <p className="text-gray-600 leading-relaxed">
              Guides pratiques courts avec support PDF téléchargeable pour appliquer immédiatement.
            </p>
          </div>

          <div className="grid gap-4">
            {/* TODO: Mapper les vrais tutos depuis la DB */}
            {[
              {
                id: '1',
                title: 'Comment déclarer ses IK en 5 minutes',
                category: 'Fiscalité',
                duration: '8 min',
                loom_id: 'exemple123',
                pdf_url: '/tutos/ik-guide.pdf',
                is_new: true
              },
              {
                id: '2',
                title: 'Optimiser son salaire vs dividendes',
                category: 'Optimisation',
                duration: '12 min',
                loom_id: 'exemple456',
                pdf_url: '/tutos/salaire-dividendes.pdf',
                is_new: false
              }
            ].map((tuto) => (
              <Card key={tuto.id} className="overflow-hidden hover:border-amber-200 shadow-sm transition-all">
                <CardContent className="p-0">
                  <div className="p-4 flex items-center gap-4 group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-500 group-hover:text-white">
                      <BookOpen size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{tuto.category}</span>
                        {tuto.is_new && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-black">New</span>}
                      </div>
                      <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{tuto.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                        <Clock size={12} /> {tuto.duration} • Avec PDF téléchargeable
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {tuto.pdf_url && (
                        <a 
                          href={tuto.pdf_url} 
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Download size={18} className="text-gray-600" />
                        </a>
                      )}
                      <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
            <p className="text-gray-500 text-sm">Plus de tutos à venir...</p>
          </div>
        </div>
      )}

      {/* FORMATIONS PREMIUM - AFFICHAGE CONDITIONNEL PAR PACK */}
      {activeTab === "formations-premium" && (
        <>
          {hasAccess.formationsPremium ? (
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-black text-gray-900 mb-4">
                  {hasAccess.showFormationCreateur && hasAccess.showFormationAgentImmo 
                    ? "Formations Premium" 
                    : "Votre Formation Premium"}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {hasAccess.showFormationCreateur && hasAccess.showFormationAgentImmo 
                    ? "Accédez à toutes vos formations pour optimiser votre fiscalité."
                    : "Accédez à votre formation débloquée et profitez de tous les contenus."}
                </p>
              </div>

              <div className={`grid ${hasAccess.showFormationCreateur && hasAccess.showFormationAgentImmo ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-2xl mx-auto'} gap-8`}>
                
                {/* Formation Créateur - Afficher si showFormationCreateur */}
                {hasAccess.showFormationCreateur && (
                  <Card className="border-2 border-slate-200 hover:border-amber-500 transition-all shadow-lg">
                    <CardContent className="p-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                        <GraduationCap className="text-white" size={32} />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-3 text-gray-900">Formation Créateur</h3>
                      <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                        Choix du statut (SASU/EURL), fiscalité appliquée, <strong>méthode VASE</strong>, création de société pas-à-pas.
                      </p>

                      <ul className="space-y-3 mb-8">
                        {[
                          "Comparatif SASU/EURL : le bon curseur selon vos objectifs",
                          "Salaire vs dividendes : augmenter le net, réduire le superflu",
                          "Méthode VASE (Exclusif) : véhicule, abondement, salaire, épargne",
                          "Pack documents + simulateurs pour décider en 30 minutes"
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <CheckCircle2 className="mx-auto text-green-600 mb-2" size={24} />
                        <p className="font-bold text-green-800">Formation débloquée</p>
                        <Button className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white">
                          Accéder à la formation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Formation Agent Immo - Afficher si showFormationAgentImmo */}
                {hasAccess.showFormationAgentImmo && (
                  <Card className="border-2 border-amber-300 hover:border-amber-500 transition-all shadow-xl ring-2 ring-amber-400/20">
                    <CardContent className="p-8 relative overflow-hidden">
                      {hasAccess.showFormationCreateur && hasAccess.showFormationAgentImmo && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                            Populaire
                          </span>
                        </div>
                      )}

                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                        <BookOpen className="text-white" size={32} />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-3 text-gray-900">Formation Agent Immobilier</h3>
                      <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                        Optimisation <strong>spécifique mandataires</strong> : IK maximisées, frais réels, cas pratiques.
                      </p>

                      <ul className="space-y-3 mb-8">
                        {[
                          "IK & frais réels : 6 000€ à 15 000€ possibles selon usage",
                          "Cas pratiques IAD, SAFTI, KW, etc. : décisions rapides",
                          "Holding/SCI : structurer vos gains sans vous piéger",
                          "Simulateur Agent Immo + tableur IK inclus"
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <CheckCircle2 className="mx-auto text-green-600 mb-2" size={24} />
                        <p className="font-bold text-green-800">Formation débloquée</p>
                        <Button className="mt-3 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                          Accéder à la formation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Message si aucune formation visible (ne devrait jamais arriver) */}
              {!hasAccess.showFormationCreateur && !hasAccess.showFormationAgentImmo && (
                <div className="text-center py-10 text-gray-400">
                  <p>Aucune formation disponible</p>
                </div>
              )}
            </div>
          ) : (
            // CTA Upgrade si pas d'accès
            <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-12 text-center">
                <Lock className="mx-auto text-amber-500 mb-6" size={64} />
                <h2 className="text-3xl font-black text-gray-900 mb-4">Formations Premium</h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Accédez aux formations complètes pour optimiser votre fiscalité et créer votre société dans les meilleures conditions.
                </p>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-12 text-lg" asChild>
                  <a href="/formations">Découvrir les formations</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* COACHING */}
      {activeTab === "coaching" && (
        <>
          {hasAccess.coachings ? (
            <div className="space-y-6">
              {/* Sous-navigation : Live / Archives */}
              <div className="flex gap-2 border-b">
                <button className="px-4 py-2 border-b-2 border-amber-500 text-amber-600 font-semibold text-sm">
                  Live à venir
                </button>
                {hasAccess.coachingsArchives && (
                  <button className="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm">
                    Archives
                  </button>
                )}
              </div>

              <div className="max-w-3xl mx-auto">
                {nextCoaching ? (
                  <Card className="border-none bg-slate-900 text-white overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Users size={120} /></div>
                    <CardContent className="p-8 relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase mb-6 animate-pulse">
                        Direct à venir
                      </div>
                      <h3 className="text-3xl font-black mb-4 leading-tight">{nextCoaching.title}</h3>
                      <p className="text-slate-400 mb-8 text-lg">{nextCoaching.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Date</p>
                          <p className="font-semibold">{formatDate(nextCoaching.session_date)}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Heure</p>
                          <p className="font-semibold">{nextCoaching.time_slot}</p>
                        </div>
                      </div>

                      {nextCoaching.meet_link ? (
                        <Button size="lg" className="w-full bg-amber-500 hover:bg-amber-600 text-white text-md font-bold h-14" asChild>
                          <a href={nextCoaching.meet_link} target="_blank" rel="noopener noreferrer">
                            Rejoindre la session <ExternalLink size={18} className="ml-2" />
                          </a>
                        </Button>
                      ) : (
                        <div className="text-center p-4 border border-dashed border-white/20 rounded-xl text-slate-500 italic">
                          Le lien d'accès sera activé 15 minutes avant le début.
                        </div>
                      )}

                      {/* Info durée d'accès */}
                      {hasAccess.packDuration && (
                        <div className="mt-6 text-center text-xs text-slate-400">
                          Accès coachings : {hasAccess.packDuration} mois
                          {daysRemaining && ` • ${daysRemaining} jours restants`}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Aucun coaching programmé pour le moment.</p>
                  </div>
                )}

                {/* Archives Coachings (replays Fathom) */}
                {hasAccess.coachingsArchives && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Video size={20} />
                      Replays disponibles
                    </h3>
                    <div className="grid gap-4">
                      {/* TODO: Mapper les vrais replays depuis la DB */}
                      {[
                        {
                          id: '1',
                          title: 'Optimisation fiscale Q4 2025',
                          date: '2025-12-15',
                          fathom_id: 'replay123',
                          duration: '1h 15min'
                        }
                      ].map((replay) => (
                        <Card key={replay.id} className="hover:border-amber-200 transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                <Video size={24} />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{replay.title}</h4>
                                <p className="text-sm text-gray-500">{formatDate(replay.date)} • {replay.duration}</p>
                              </div>
                              <Button variant="outline" size="sm">
                                Voir le replay
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-12 text-center">
                <Lock className="mx-auto text-amber-500 mb-6" size={64} />
                <h2 className="text-3xl font-black text-gray-900 mb-4">Coachings Live</h2>
                <p className="text-gray-600 mb-8">
                  Accédez aux coachings live avec les packs Formation ou Accompagnement.
                </p>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-12" asChild>
                  <a href="/formations">Voir les offres</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ATELIERS */}
      {activeTab === "ateliers" && (
        <div className="space-y-6">
          {/* Sous-navigation : Prochains / Archives */}
          <div className="flex gap-2 border-b">
            <button className="px-4 py-2 border-b-2 border-emerald-500 text-emerald-600 font-semibold text-sm">
              Prochains ateliers
            </button>
            {hasAccess.ateliersArchives && (
              <button className="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm">
                Archives
              </button>
            )}
          </div>

          {/* Prochains ateliers */}
          <div className="grid md:grid-cols-2 gap-6">
            {ateliers.length > 0 ? ateliers.map((atelier: Atelier) => {
              const complet = atelier.places_prises >= atelier.max_places;
              return (
                <Card key={atelier.id} className="group hover:shadow-xl transition-all border-none shadow-sm bg-white ring-1 ring-gray-100">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <Calendar size={24} />
                      </div>
                      {complet ? (
                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase">Complet</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                          {atelier.max_places - atelier.places_prises} places dispos
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{atelier.title}</h3>
                    <div className="space-y-2 mb-6 text-sm text-gray-500">
                      <p className="flex items-center gap-2"><Clock size={14} className="text-amber-500" /> {formatDate(atelier.atelier_date)} à {atelier.time_slot}</p>
                      <p className="line-clamp-2">{atelier.description}</p>
                    </div>
                    
                    {!complet && (
                      <Button className="w-full bg-gray-900 hover:bg-emerald-600 text-white rounded-xl h-12" asChild>
                        <a href={atelier.lien_inscription || "#"}>M'inscrire gratuitement</a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="col-span-full text-center py-10 text-gray-400 italic font-light">
                Les prochains ateliers seront annoncés prochainement.
              </div>
            )}
          </div>

          {/* Archives Ateliers (replays Fathom) */}
          {hasAccess.ateliersArchives && ateliers.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Video size={20} />
                Replays disponibles
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {/* TODO: Mapper les vrais replays depuis la DB */}
                {[
                  {
                    id: '1',
                    title: 'Atelier IK & Frais réels',
                    date: '2025-11-20',
                    fathom_id: 'atelier123',
                    duration: '45min'
                  }
                ].map((replay) => (
                  <Card key={replay.id} className="hover:border-emerald-200 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Video size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{replay.title}</h4>
                          <p className="text-sm text-gray-500">{formatDate(replay.date)} • {replay.duration}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Voir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RDV INCLUS */}
      {activeTab === "rdv-inclus" && (
        <>
          {hasAccess.rdvGratuit ? (
            <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-emerald-50 overflow-hidden">
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-200">
                  <Phone size={32} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">Votre Session Stratégique</h2>
                <p className="text-gray-600 text-lg max-w-lg mx-auto mb-6 leading-relaxed">
                  Un point privé de 30 minutes avec un expert pour valider votre structure et optimiser votre fiscalité.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 inline-block">
                  <p className="text-sm text-amber-800">
                    <strong>{hasAccess.rdvExpert}</strong> RDV expert(s) restant(s)
                  </p>
                </div>
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-emerald-200/50" asChild>
                  <a href="https://calendly.com/contact-jj-conseil/rdv-analyste" target="_blank">Réserver maintenant</a>
                </Button>
                <p className="mt-6 text-xs text-gray-400 font-medium uppercase tracking-widest italic">Inclus dans votre accompagnement</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-12 text-center">
                <Lock className="mx-auto text-amber-500 mb-6" size={64} />
                <h2 className="text-3xl font-black text-gray-900 mb-4">RDV Expert</h2>
                <p className="text-gray-600 mb-8">
                  Les RDV experts sont disponibles avec les packs Starter, Pro ou Expert.
                </p>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-12" asChild>
                  <a href="/formations">Voir les packs</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* RDV PAYANTS - Accessible à TOUS */}
      {activeTab === "rdv-payants" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-transparent hover:border-amber-500 transition-all bg-white shadow-lg">
              <CardContent className="p-8">
                <Star className="text-amber-500 mb-4" fill="currentColor" size={28} />
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Expertise Fiscale Immobilière</h3>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">Analyse complète de votre patrimoine, montage LMNP/LMP ou passage en société.</p>
                <div className="text-3xl font-black text-gray-900 mb-8">149€ <span className="text-sm font-normal text-gray-400">/ session</span></div>
                <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl" asChild>
                  <a href="https://calendly.com/contact-jj-conseil/expertise-immo" target="_blank">Réserver un créneau</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-transparent hover:border-blue-500 transition-all bg-white shadow-lg">
              <CardContent className="p-8">
                <BookOpen className="text-blue-500 mb-4" size={28} />
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Audit Holding & SCI</h3>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">Optimisation de la transmission et de l'imposition des dividendes.</p>
                <div className="text-3xl font-black text-gray-900 mb-8">290€ <span className="text-sm font-normal text-gray-400">/ audit</span></div>
                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl" asChild>
                  <a href="https://calendly.com/contact-jj-conseil/audit-holding" target="_blank">Commander l'audit</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}