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

interface TutoPratique {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  loom_id: string;
  pdf_url?: string;
  is_new?: boolean;
}

interface Session {
  id: string;
  title: string;
  description: string;
  session_date: string;
  time_slot: string;
  meet_link?: string;
  fathom_id?: string;
}

interface Atelier extends Session {
  places_prises: number;
  max_places: number;
  lien_inscription?: string;
  atelier_date: string;
}

export default function MemberDashboard({ 
  videos = [], 
  tutosPratiques = [],
  coachings = [], 
  coachingsArchives = [],
  ateliers = [],
  ateliersArchives = [],
  isLoading = false 
}: any) {
  const [activeTab, setActiveTab] = useState("tutos-pratiques");
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [coachingSubTab, setCoachingSubTab] = useState<"live" | "archives">("live");
  const [atelierSubTab, setAtelierSubTab] = useState<"live" | "archives">("live");

  // Hook de gestion des accès
  const { pack, hasAccess, loading: accessLoading, daysRemaining } = useUserAccess();

  useEffect(() => {
    setMounted(true);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filteredTutos = useMemo(() => {
    return tutosPratiques.filter((t: TutoPratique) => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tutosPratiques, searchQuery]);

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
    { 
      id: "tutos-pratiques", 
      label: "Tutos Pratiques", 
      icon: <BookOpen size={16} />, 
      access: hasAccess.tutosPratiques 
    },
    { 
      id: "formation-createur", 
      label: "Formation Créateur", 
      icon: <GraduationCap size={16} />, 
      access: hasAccess.formationCreateur 
    },
    { 
      id: "formation-agent-immo", 
      label: "Formation Agent Immo", 
      icon: <GraduationCap size={16} />, 
      access: hasAccess.formationAgentImmo 
    },
    { 
      id: "formations-accompagnement", 
      label: "Formations", 
      icon: <Video size={16} />, 
      access: hasAccess.formationsAccompagnement 
    },
    { 
      id: "coaching", 
      label: "Coachings Live", 
      icon: <Users size={16} />, 
      access: hasAccess.coachings 
    },
    { 
      id: "ateliers", 
      label: "Ateliers", 
      icon: <Calendar size={16} />, 
      access: hasAccess.ateliers 
    },
    { 
      id: "rdv-inclus", 
      label: "Mon RDV", 
      icon: <Phone size={16} />, 
      access: hasAccess.rdvGratuit 
    },
    { 
      id: "rdv-payants", 
      label: "Expert +", 
      icon: <Sparkles size={16} />, 
      access: true 
    }
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
              {daysRemaining !== null && daysRemaining > 0 && (
                <p className="text-xs text-slate-600 mt-1">
                  {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
                </p>
              )}
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

      {/* TUTOS PRATIQUES */}
      {activeTab === "tutos-pratiques" && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Tutos Pratiques</h2>
            <p className="text-gray-600 leading-relaxed">
              Vidéos courtes et actionables avec supports PDF téléchargeables.
            </p>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un tuto..." 
              className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 ring-amber-500/20 border-gray-200 outline-none transition-all"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            {filteredTutos.map((tuto: TutoPratique) => (
              <Card key={tuto.id} className={`overflow-hidden transition-all duration-300 ${expandedVideo === tuto.id ? "ring-2 ring-amber-500 shadow-lg" : "hover:border-amber-200 shadow-sm"}`}>
                <CardContent className="p-0">
                  {expandedVideo === tuto.id ? (
                    <div className="animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">{tuto.category}</span>
                          <h3 className="font-bold text-gray-900">{tuto.title}</h3>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setExpandedVideo(null)}>Fermer</Button>
                      </div>
                      
                      <div className="aspect-video w-full bg-black">
                        {tuto.loom_id ? (
                          <iframe 
                            src={`https://www.loom.com/embed/${tuto.loom_id}`}
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
                        <p className="text-gray-600 mb-6 leading-relaxed">{tuto.description}</p>
                        {tuto.pdf_url && (
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                              <Download size={14} /> Support PDF
                            </h4>
                            <a 
                              href={tuto.pdf_url} 
                              target="_blank" 
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white border-gray-200 hover:border-amber-500 hover:text-amber-600 shadow-sm text-sm transition-all"
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              Télécharger le PDF
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setExpandedVideo(tuto.id)} className="p-4 cursor-pointer flex items-center gap-4 group">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        tuto.loom_id ? "bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white" : "bg-gray-100 text-gray-400"
                      }`}>
                        <BookOpen size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">{tuto.category}</span>
                          {tuto.is_new && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-black">New</span>}
                        </div>
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-amber-600 transition-colors">{tuto.title}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <Clock size={12} /> {tuto.duration} {tuto.pdf_url && '• PDF inclus'}
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

      {/* FORMATION CRÉATEUR */}
      {activeTab === "formation-createur" && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Formation Créateur</h2>
            <p className="text-gray-600 leading-relaxed">
              Choix du statut (SASU/EURL), fiscalité appliquée, méthode VASE, création de société pas-à-pas.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-8">
            <CheckCircle2 className="mx-auto text-green-600 mb-3" size={32} />
            <p className="font-bold text-green-800 text-lg">Formation débloquée ✓</p>
            <p className="text-sm text-green-700 mt-2">Accès complet à tous les modules</p>
          </div>

          <div className="grid gap-4">
            {videos.filter((v: VideoData) => v.category === "Créateur").map((video: VideoData) => (
              <Card key={video.id} className="hover:border-amber-200 transition-all">
                <CardContent className="p-4">
                  <h4 className="font-bold text-[#123055] mb-2">{video.title}</h4>
                  <p className="text-sm text-slate-600 mb-3">{video.description}</p>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white" size="sm">
                    <Video size={16} className="mr-2" />
                    Voir le module
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* FORMATION AGENT IMMO */}
      {activeTab === "formation-agent-immo" && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Formation Agent Immobilier</h2>
            <p className="text-gray-600 leading-relaxed">
              Optimisation spécifique mandataires : IK maximisées, frais réels, cas pratiques.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-8">
            <CheckCircle2 className="mx-auto text-green-600 mb-3" size={32} />
            <p className="font-bold text-green-800 text-lg">Formation débloquée ✓</p>
            <p className="text-sm text-green-700 mt-2">Accès complet à tous les modules</p>
          </div>

          <div className="grid gap-4">
            {videos.filter((v: VideoData) => v.category === "Agent Immo").map((video: VideoData) => (
              <Card key={video.id} className="hover:border-amber-200 transition-all">
                <CardContent className="p-4">
                  <h4 className="font-bold text-[#123055] mb-2">{video.title}</h4>
                  <p className="text-sm text-slate-600 mb-3">{video.description}</p>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white" size="sm">
                    <Video size={16} className="mr-2" />
                    Voir le module
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* FORMATIONS ACCOMPAGNEMENT */}
      {activeTab === "formations-accompagnement" && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Vos Formations</h2>
            <p className="text-gray-600 leading-relaxed">
              Contenu spécifique pour votre parcours d'accompagnement.
            </p>
          </div>

          <div className="grid gap-4">
            {videos.filter((v: VideoData) => v.category === "Accompagnement").map((video: VideoData) => (
              <Card key={video.id} className="hover:border-amber-200 transition-all">
                <CardContent className="p-4">
                  <h4 className="font-bold text-[#123055] mb-2">{video.title}</h4>
                  <p className="text-sm text-slate-600 mb-3">{video.description}</p>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white" size="sm">
                    <Video size={16} className="mr-2" />
                    Voir le module
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* COACHING */}
      {activeTab === "coaching" && (
        <>
          {hasAccess.coachings ? (
            <div className="space-y-6">
              {/* Sous-navigation */}
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setCoachingSubTab("live")}
                  className={`px-4 py-2 border-b-2 transition-all ${
                    coachingSubTab === "live" 
                      ? "border-amber-500 text-amber-600 font-semibold" 
                      : "border-transparent text-slate-600"
                  }`}
                >
                  Live à venir
                </button>
                <button
                  onClick={() => setCoachingSubTab("archives")}
                  className={`px-4 py-2 border-b-2 transition-all ${
                    coachingSubTab === "archives" 
                      ? "border-amber-500 text-amber-600 font-semibold" 
                      : "border-transparent text-slate-600"
                  }`}
                >
                  Archives (Replays)
                </button>
              </div>

              {coachingSubTab === "live" && nextCoaching && (
                <Card className="border-none bg-slate-900 text-white overflow-hidden shadow-2xl">
                  <CardContent className="p-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase mb-6 animate-pulse">
                      Direct à venir
                    </div>
                    <h3 className="text-3xl font-black mb-4">{nextCoaching.title}</h3>
                    <p className="text-slate-400 mb-8">{nextCoaching.description}</p>
                    
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

                    {nextCoaching.meet_link && (
                      <Button size="lg" className="w-full bg-amber-500 hover:bg-amber-600 text-white text-md font-bold h-14" asChild>
                        <a href={nextCoaching.meet_link} target="_blank" rel="noopener noreferrer">
                          Rejoindre la session <ExternalLink size={18} className="ml-2" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {coachingSubTab === "archives" && (
                <div className="grid gap-4">
                  {coachingsArchives.map((archive: any) => (
                    <Card key={archive.id}>
                      <CardContent className="p-6">
                        <h4 className="font-bold text-[#123055] mb-2">{archive.title}</h4>
                        <p className="text-sm text-slate-600 mb-4">{formatDate(archive.session_date)}</p>
                        {archive.fathom_id && (
                          <Button className="bg-amber-500 hover:bg-amber-600 text-white" size="sm">
                            <Video size={16} className="mr-2" />
                            Voir le replay
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
          {/* Sous-navigation */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setAtelierSubTab("live")}
              className={`px-4 py-2 border-b-2 transition-all ${
                atelierSubTab === "live" 
                  ? "border-amber-500 text-amber-600 font-semibold" 
                  : "border-transparent text-slate-600"
              }`}
            >
              Prochains ateliers
            </button>
            <button
              onClick={() => setAtelierSubTab("archives")}
              className={`px-4 py-2 border-b-2 transition-all ${
                atelierSubTab === "archives" 
                  ? "border-amber-500 text-amber-600 font-semibold" 
                  : "border-transparent text-slate-600"
              }`}
            >
              Archives (Replays)
            </button>
          </div>

          {atelierSubTab === "live" && (
            <div className="grid md:grid-cols-2 gap-6">
              {ateliers.map((atelier: Atelier) => {
                const complet = atelier.places_prises >= atelier.max_places;
                return (
                  <Card key={atelier.id} className="hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Calendar className="text-emerald-500" size={24} />
                        {complet ? (
                          <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">Complet</span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                            {atelier.max_places - atelier.places_prises} places
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{atelier.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{formatDate(atelier.atelier_date)} • {atelier.time_slot}</p>
                      {!complet && (
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                          <a href={atelier.lien_inscription}>M'inscrire</a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {atelierSubTab === "archives" && (
            <div className="grid gap-4">
              {ateliersArchives.map((archive: any) => (
                <Card key={archive.id}>
                  <CardContent className="p-6">
                    <h4 className="font-bold text-[#123055] mb-2">{archive.title}</h4>
                    <p className="text-sm text-slate-600 mb-4">{formatDate(archive.atelier_date)}</p>
                    {archive.fathom_id && (
                      <Button className="bg-amber-500 hover:bg-amber-600 text-white" size="sm">
                        <Video size={16} className="mr-2" />
                        Voir le replay
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RDV INCLUS */}
      {activeTab === "rdv-inclus" && (
        <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-emerald-50">
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Phone size={32} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Votre Session Stratégique</h2>
            <p className="text-gray-600 text-lg max-w-lg mx-auto mb-6">
              Un point privé de 30 minutes avec un expert pour valider votre structure et optimiser votre fiscalité.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 inline-block">
              <p className="text-sm text-amber-800">
                <strong>{hasAccess.rdvExpert}</strong> RDV expert(s) restant(s)
              </p>
            </div>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 h-14 rounded-2xl text-lg font-bold" asChild>
              <a href="https://calendly.com/contact-jj-conseil/rdv-analyste" target="_blank">Réserver maintenant</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* RDV PAYANTS */}
      {activeTab === "rdv-payants" && (
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-2 border-transparent hover:border-amber-500 transition-all">
            <CardContent className="p-8">
              <Star className="text-amber-500 mb-4" fill="currentColor" size={28} />
              <h3 className="text-2xl font-bold mb-2">Expertise Fiscale Immobilière</h3>
              <p className="text-gray-500 mb-6 text-sm">Analyse complète de votre patrimoine.</p>
              <div className="text-3xl font-black text-gray-900 mb-8">149€</div>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" asChild>
                <a href="https://calendly.com/contact-jj-conseil/expertise-immo" target="_blank">Réserver</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-transparent hover:border-blue-500 transition-all">
            <CardContent className="p-8">
              <BookOpen className="text-blue-500 mb-4" size={28} />
              <h3 className="text-2xl font-bold mb-2">Audit Holding & SCI</h3>
              <p className="text-gray-500 mb-6 text-sm">Optimisation de la transmission.</p>
              <div className="text-3xl font-black text-gray-900 mb-8">290€</div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                <a href="https://calendly.com/contact-jj-conseil/audit-holding" target="_blank">Commander</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}