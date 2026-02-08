"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Video, Clock, Download, Calendar, Users, Sparkles, 
  ExternalLink, Phone, CheckCircle2, Star, BookOpen, 
  ArrowRight, Search, GraduationCap, ShoppingCart
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

  if (!mounted || isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8 space-y-4">
        <div className="h-10 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      
      {/* Menu Navigation */}
      <nav className="flex gap-2 border-b overflow-x-auto pb-px scrollbar-hide">
        {[
          { id: "videos", label: "Formations", icon: <Video size={16} /> },
          { id: "formations-premium", label: "Formations Premium", icon: <GraduationCap size={16} /> },
          { id: "coaching", label: "Coachings Live", icon: <Users size={16} /> },
          { id: "ateliers", label: "Ateliers", icon: <Calendar size={16} /> },
          { id: "rdv-inclus", label: "Mon RDV", icon: <Phone size={16} /> },
          { id: "rdv-payants", label: "Expert +", icon: <Sparkles size={16} /> }
        ].map((tab) => (
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

      {/* VIDÉOS */}
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

      {/* FORMATIONS PREMIUM */}
      {activeTab === "formations-premium" && (
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Formations Premium</h2>
            <p className="text-gray-600 leading-relaxed">
              Formations complètes pour optimiser votre fiscalité et créer votre société dans les meilleures conditions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Formation Créateur */}
            <Card className="border-2 border-slate-200 hover:border-amber-500 transition-all shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <GraduationCap className="text-white" size={32} />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Formation Créateur</h3>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                  Choix du statut (SASU/EURL), fiscalité appliquée, <strong>méthode VASE</strong>, création de société pas-à-pas. 
                  Le programme pour arrêter de perdre de l'argent à cause d'un mauvais setup.
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

                <div className="text-4xl font-black text-gray-900 mb-6">
                  497€
                  <span className="text-sm font-normal text-gray-400 ml-2">accès à vie</span>
                </div>

                <Button className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-base" asChild>
                  <a href="https://buy.stripe.com/aFafZg2Dt3sy06x5j19fW03" target="_blank" rel="noopener noreferrer">
                    <ShoppingCart size={20} className="mr-2" />
                    Acheter maintenant
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Formation Agent Immo */}
            <Card className="border-2 border-amber-300 hover:border-amber-500 transition-all shadow-xl ring-2 ring-amber-400/20">
              <CardContent className="p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                    Populaire
                  </span>
                </div>

                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <BookOpen className="text-white" size={32} />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Formation Agent Immobilier</h3>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                  Optimisation <strong>spécifique mandataires</strong> : indemnités kilométriques (IK) maximisées, 
                  frais réels, cas pratiques par paliers de CA, holdings & SCI pour réinvestir sereinement.
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

                <div className="text-4xl font-black text-gray-900 mb-6">
                  897€
                  <span className="text-sm font-normal text-gray-400 ml-2">accès à vie</span>
                </div>

                <Button className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-base shadow-lg" asChild>
                  <a href="https://buy.stripe.com/4gM3cu5PFd382eF5j19fW02" target="_blank" rel="noopener noreferrer">
                    <ShoppingCart size={20} className="mr-2" />
                    Acheter maintenant
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-amber-50 rounded-2xl p-8 border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="text-white" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Garantie satisfait ou remboursé 30 jours</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Si vous n'êtes pas satisfait de la formation, nous vous remboursons intégralement sous 30 jours, sans condition.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COACHING (avec Fathom) */}
      {activeTab === "coaching" && (
        <div className="max-w-3xl mx-auto space-y-6">
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

                {nextCoaching.fathom_id && (
                  <div className="mt-6">
                    <p className="text-xs text-slate-400 mb-3 uppercase font-bold">Replay disponible après la session</p>
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
        </div>
      )}

      {/* ATELIERS (inchangé) */}
      {activeTab === "ateliers" && (
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
      )}

      {/* RDV (inchangé) */}
      {(activeTab === "rdv-inclus" || activeTab === "rdv-payants") && (
        <div className="max-w-4xl mx-auto space-y-6">
          {activeTab === "rdv-inclus" ? (
            <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-emerald-50 overflow-hidden">
               <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-200">
                    <Phone size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Votre Session Stratégique</h2>
                  <p className="text-gray-600 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
                    Un point privé de 30 minutes avec un expert pour valider votre structure et optimiser votre fiscalité.
                  </p>
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-emerald-200/50" asChild>
                    <a href="https://calendly.com/contact-jj-conseil/rdv-analyste" target="_blank">Réserver maintenant</a>
                  </Button>
                  <p className="mt-6 text-xs text-gray-400 font-medium uppercase tracking-widest italic">Inclus dans votre accompagnement</p>
               </CardContent>
            </Card>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}