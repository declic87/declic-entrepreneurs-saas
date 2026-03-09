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
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText, Download, Save, Play, Clock, CheckCircle2,
  AlertCircle, Loader2, Plus, History, ArrowRight, Upload,
  ChevronDown, ChevronUp, Calendar, Users, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { generateRDVPDF, getPDFBlob } from "@/lib/pdf-generator";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Définition des RDV
const RDV_DEFINITIONS = {
  1: {
    num: 1,
    titre: 'Diagnostic 360° & profil entrepreneur',
    emoji: '🔍',
    duree: '60 min',
    sections: [
      {
        id: 'contact',
        titre: 'Rapport humain & mise en confiance',
        icon: '☕',
        description: 'Créer le lien avant le technique',
        checklist: [
          'Histoire entrepreneuriale racontée',
          'Objectifs de vie identifiés',
          'Peurs & blocages évoqués',
          'Confiance établie'
        ]
      },
      {
        id: 'situation',
        titre: 'Situation actuelle & douleurs',
        icon: '📊',
        description: 'Comprendre où le client en est vraiment',
        checklist: [
          'CA annuel actuel',
          'Statut juridique actuel',
          'Charges & impôts payés',
          'Problèmes identifiés'
        ]
      },
      {
        id: 'objectifs',
        titre: 'Objectifs & vision',
        icon: '🎯',
        description: 'Où veut-il aller ?',
        checklist: [
          'Objectif CA 12 mois',
          'Objectif revenu net mensuel',
          'Projets entrepreneuriaux',
          'Vision 3-5 ans'
        ]
      }
    ]
  },
  2: {
    num: 2,
    titre: 'Stratégie fiscale & optimisation',
    emoji: '💰',
    duree: '75 min',
    sections: [
      {
        id: 'diagnostic-fiscal',
        titre: 'Diagnostic fiscal complet',
        icon: '🔍',
        description: 'État des lieux précis',
        checklist: [
          'Déclarations fiscales à jour',
          'Régime fiscal identifié',
          'Impôts payés analysés',
          'Opportunités détectées'
        ]
      },
      {
        id: 'simulation',
        titre: 'Simulation comparative statuts',
        icon: '🧮',
        description: 'Chiffrer les gains possibles',
        hasSimulator: true,
        checklist: [
          'Simulation Micro faite',
          'Simulation EURL IS faite',
          'Simulation SASU IS faite',
          'Gain annuel chiffré'
        ]
      },
      {
        id: 'vase',
        titre: 'Méthode VASE - Frais réels',
        icon: '🚗',
        description: 'Véhicule · Administratif · Stratégie · Évolution',
        checklist: [
          '🚗 Km pro & IK calculées',
          '🏠 Bureau domicile + convention',
          '📱 Téléphone pro',
          '💻 Matériel informatique',
          '📦 Logiciels & abonnements',
          '🍽️ Repas clients',
          '🎓 Formations',
          '📊 Gain VASE total estimé'
        ]
      },
      {
        id: 'remuneration',
        titre: 'Stratégie de rémunération',
        icon: '💶',
        description: 'Mix salaire / dividendes / PER optimal',
        checklist: [
          'Besoin revenu net mensuel',
          'Salaire brut optimal calculé',
          'Dividendes possibles estimés',
          'PER évoqué + plafond calculé'
        ]
      }
    ]
  },
  3: {
    num: 3,
    titre: 'Protection sociale & patrimoine',
    emoji: '🛡️',
    duree: '75 min',
    sections: [
      {
        id: 'protection',
        titre: 'Protection sociale du dirigeant',
        icon: '🏥',
        description: 'Sécuriser contre les risques',
        checklist: [
          'Mutuelle santé pro',
          'Prévoyance IJ / invalidité / décès',
          'RC Pro à jour',
          'Capital décès estimé'
        ]
      },
      {
        id: 'retraite',
        titre: 'Stratégie retraite complète',
        icon: '🏦',
        description: 'PER + assurance-vie + LMNP',
        hasSimulator: true,
        checklist: [
          'PER existant analysé',
          'Plafond PER calculé',
          'Économie IS/IR simulée',
          'Assurance-vie vérifiée',
          'Stratégie PER + AV présentée'
        ]
      },
      {
        id: 'immobilier',
        titre: 'Immobilier & investissement locatif',
        icon: '🏠',
        description: 'Structure optimale pour le locatif',
        checklist: [
          'Biens existants identifiés',
          'Régime fiscal actuel',
          'LMNP vs SCI comparé',
          'Amortissement expliqué'
        ]
      }
    ]
  }
};

interface ClientData {
  firstName: string;
  lastName: string;
  company: string;
  pack: 'starter' | 'pro' | 'expert';
}

interface RDVState {
  [sectionId: string]: {
    notes: string;
    checklist: { [key: string]: boolean };
    completed: boolean;
    expanded: boolean;
  };
}

export default function ExpertRDVCompanionFullPage() {
  const [view, setView] = useState<'select-rdv' | 'rdv-form'>('select-rdv');
  
  // État client
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientData, setClientData] = useState<ClientData>({
    firstName: '',
    lastName: '',
    company: '',
    pack: 'starter',
  });

  // État RDV
  const [selectedRDV, setSelectedRDV] = useState<number>(1);
  const [rdvState, setRDVState] = useState<RDVState>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // État sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // État expert
  const [expertId, setExpertId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadExpertId();
    
    // Auto-sélection depuis sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoselect') === 'true') {
      const clientId = sessionStorage.getItem('rdv_client_id');
      const clientName = sessionStorage.getItem('rdv_client_name');
      
      if (clientId && clientName) {
        setSelectedClient({ id: clientId, name: clientName });
        setClientData(prev => ({
          ...prev,
          firstName: clientName.split(' ')[0] || '',
          lastName: clientName.split(' ').slice(1).join(' ') || ''
        }));
        
        loadClientHistory(clientId);
        
        sessionStorage.removeItem('rdv_client_id');
        sessionStorage.removeItem('rdv_client_name');
      }
    }
  }, []);

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

  async function loadClientHistory(clientId: string) {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/expert/rdv-sessions?clientId=${clientId}&expertId=${expertId}`);
      const data = await response.json();
      
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function startRDV(rdvNum: number) {
    setSelectedRDV(rdvNum);
    
    // Charger session existante
    const existingSession = sessions.find(s => s.rdv_number === rdvNum);
    
    if (existingSession) {
      setCurrentSessionId(existingSession.id);
      setClientData(existingSession.client_data);
      
      // Charger l'état RDV depuis rdv_data
      if (existingSession.rdv_data) {
        setRDVState(existingSession.rdv_data);
      }
      
      toast.info('Session précédente chargée !');
    } else {
      setCurrentSessionId(null);
      initializeRDVState(rdvNum);
    }
    
    setView('rdv-form');
  }

  function initializeRDVState(rdvNum: number) {
    const rdvDef = RDV_DEFINITIONS[rdvNum as keyof typeof RDV_DEFINITIONS];
    if (!rdvDef) return;

    const newState: RDVState = {};
    rdvDef.sections.forEach(section => {
      newState[section.id] = {
        notes: '',
        checklist: {},
        completed: false,
        expanded: false
      };
      
      section.checklist?.forEach((item, idx) => {
        newState[section.id].checklist[`${section.id}-${idx}`] = false;
      });
    });
    
    setRDVState(newState);
  }

  function toggleSection(sectionId: string) {
    setRDVState(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        expanded: !prev[sectionId]?.expanded
      }
    }));
  }

  function updateNotes(sectionId: string, notes: string) {
    setRDVState(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        notes
      }
    }));
  }

  function toggleChecklistItem(sectionId: string, itemKey: string) {
    setRDVState(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        checklist: {
          ...prev[sectionId]?.checklist,
          [itemKey]: !prev[sectionId]?.checklist?.[itemKey]
        }
      }
    }));
  }

  function markSectionComplete(sectionId: string) {
    setRDVState(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        completed: !prev[sectionId]?.completed
      }
    }));
  }

  async function saveSession(completed = false) {
    if (!expertId || !selectedClient) {
      toast.error('Données manquantes');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/expert/rdv-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          expertId,
          clientId: selectedClient.id,
          rdvNumber: selectedRDV,
          packType: clientData.pack,
          clientData,
          rdvData: rdvState,
          completed,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSessionId(data.session.id);
        toast.success(completed ? 'RDV terminé !' : 'Session sauvegardée !');
        loadClientHistory(selectedClient.id);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function generatePDF() {
    if (!currentSessionId || !expertId || !selectedClient) {
      toast.error('Veuillez sauvegarder la session d\'abord');
      return;
    }

    setGenerating(true);
    try {
      const { data: expertData } = await supabase
        .from('experts')
        .select('userId')
        .eq('id', expertId)
        .single();

      let expertName = 'Expert Déclic';
      if (expertData) {
        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', expertData.userId)
          .single();

        if (userData) {
          expertName = `${userData.first_name} ${userData.last_name}`;
        }
      }

      // Compiler les notes pour le PDF
      const compiledNotes = Object.entries(rdvState).map(([sectionId, state]) => {
        return `${sectionId.toUpperCase()}:\n${state.notes || 'Aucune note'}`;
      }).join('\n\n');

      const doc = generateRDVPDF(
        clientData,
        selectedRDV,
        { notes: compiledNotes },
        expertName
      );

      const pdfBlob = getPDFBlob(doc);
      const fileName = `rdv-${selectedRDV}_${selectedClient.name}_${Date.now()}.pdf`;

      const formData = new FormData();
      formData.append('file', pdfBlob, fileName);
      formData.append('sessionId', currentSessionId);
      formData.append('clientId', selectedClient.id);
      formData.append('rdvNumber', selectedRDV.toString());

      const response = await fetch('/api/expert/upload-rdv-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ PDF généré et enregistré dans l\'espace client !');
        loadClientHistory(selectedClient.id);
        doc.save(fileName);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Erreur génération PDF:', err);
      toast.error('Erreur: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  const rdvDef = RDV_DEFINITIONS[selectedRDV as keyof typeof RDV_DEFINITIONS];
  const progress = rdvDef ? (Object.values(rdvState).filter(s => s?.completed).length / rdvDef.sections.length) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Companion RDV Expert
          </h1>
          <p className="text-slate-600 mt-2">
            Suivi structuré temps réel
          </p>
        </div>
        <FileText className="text-amber-500" size={40} />
      </div>

      {view === 'select-rdv' && selectedClient && (
        <>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="text-blue-600" />
            <AlertDescription className="text-blue-800">
              Client : <strong>{selectedClient.name}</strong>
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(num => {
              const session = sessions.find(s => s.rdv_number === num);
              const def = RDV_DEFINITIONS[num as keyof typeof RDV_DEFINITIONS];
              
              return (
                <button
                  key={num}
                  onClick={() => startRDV(num)}
                  className={`p-6 border-2 rounded-lg text-left transition-all ${
                    session?.completed
                      ? 'border-green-200 bg-green-50'
                      : session
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={session?.completed ? 'default' : 'secondary'}>
                      RDV {num}
                    </Badge>
                    {session?.completed && <CheckCircle2 size={16} className="text-green-600" />}
                    {session && !session.completed && <Clock size={16} className="text-amber-600" />}
                  </div>
                  <p className="text-xl font-bold mb-1">{def?.emoji} {def?.titre}</p>
                  <p className="text-sm text-slate-600">{def?.duree}</p>
                </button>
              );
            })}
          </div>
        </>
      )}

      {view === 'rdv-form' && rdvDef && (
        <>
          {/* Header RDV */}
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{rdvDef.emoji}</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">{rdvDef.titre}</h2>
                  <p className="text-slate-600 mt-1">⏱️ {rdvDef.duree}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-amber-600">{Math.round(progress)}%</p>
                  <p className="text-sm text-slate-600">Complété</p>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-4">
            {rdvDef.sections.map((section, idx) => {
              const sectionState = rdvState[section.id] || {};
              const checklistProgress = section.checklist 
                ? (Object.values(sectionState.checklist || {}).filter(Boolean).length / section.checklist.length) * 100 
                : 0;

              return (
                <Card key={section.id} className="border-2">
                  <CardHeader 
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl">{section.icon}</div>
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-sm font-bold">
                              {idx + 1}
                            </span>
                            {section.titre}
                          </CardTitle>
                          <p className="text-sm text-slate-600 mt-1">{section.description}</p>
                          {section.checklist && (
                            <div className="mt-2">
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${checklistProgress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sectionState.completed && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 size={14} className="mr-1" />
                            Terminé
                          </Badge>
                        )}
                        {sectionState.expanded ? <ChevronUp /> : <ChevronDown />}
                      </div>
                    </div>
                  </CardHeader>

                  {sectionState.expanded && (
                    <CardContent className="space-y-4 pt-4 border-t">
                      {/* Checklist */}
                      {section.checklist && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm font-bold text-blue-900 mb-3">📋 Points à couvrir :</p>
                          <div className="space-y-2">
                            {section.checklist.map((item, itemIdx) => {
                              const itemKey = `${section.id}-${itemIdx}`;
                              const isChecked = sectionState.checklist?.[itemKey] || false;
                              
                              return (
                                <div key={itemKey} className="flex items-center gap-3">
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => toggleChecklistItem(section.id, itemKey)}
                                  />
                                  <label 
                                    className={`text-sm cursor-pointer ${isChecked ? 'line-through text-slate-500' : 'text-slate-700'}`}
                                    onClick={() => toggleChecklistItem(section.id, itemKey)}
                                  >
                                    {item}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Zone notes */}
                      <div>
                        <Label className="text-sm font-bold text-slate-700 mb-2 block">
                          📝 Notes & observations :
                        </Label>
                        <Textarea
                          value={sectionState.notes || ''}
                          onChange={(e) => updateNotes(section.id, e.target.value)}
                          rows={6}
                          placeholder="Prendre des notes pendant l'échange..."
                          className="font-mono text-sm"
                        />
                      </div>

                      {/* Actions section */}
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                          variant={sectionState.completed ? "default" : "outline"}
                          onClick={() => markSectionComplete(section.id)}
                          className={sectionState.completed ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {sectionState.completed ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Section terminée
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Marquer comme terminé
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Actions RDV */}
          <Card className="border-2 border-slate-200">
            <CardContent className="p-6">
              <div className="flex gap-3 justify-between">
                <Button variant="outline" onClick={() => setView('select-rdv')}>
                  ← Retour
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => saveSession(false)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                    Sauvegarder
                  </Button>
                  <Button
                    onClick={() => saveSession(true)}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2" size={16} />
                    Terminer le RDV
                  </Button>
                  <Button
                    onClick={generatePDF}
                    disabled={!currentSessionId || generating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {generating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Download className="mr-2" size={16} />}
                    Générer PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}