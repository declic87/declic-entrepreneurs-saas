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
  FileText, Download, Save, Play, Clock, CheckCircle2,
  AlertCircle, Loader2, Plus, History, ArrowRight, Upload
} from "lucide-react";
import { toast } from "sonner";
import { generateRDVPDF, getPDFBlob } from "@/lib/pdf-generator";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PACKS = {
  starter: {
    name: 'Starter',
    rdvs: [
      { num: 1, label: 'Installation & Formation plateforme' },
      { num: 2, label: 'Pilotage & Gestion quotidienne' },
      { num: 3, label: 'Point fiscal trimestriel' },
    ],
  },
  pro: {
    name: 'Pro',
    rdvs: [
      { num: 1, label: 'Installation & Formation plateforme' },
      { num: 2, label: 'Pilotage & Gestion quotidienne' },
      { num: 3, label: 'Optimisation fiscale & Réglementation' },
      { num: 4, label: 'Point trimestriel & Ajustements' },
    ],
  },
  expert: {
    name: 'Expert',
    rdvs: [
      { num: 1, label: 'Installation & Formation plateforme' },
      { num: 2, label: 'Pilotage & Gestion quotidienne' },
      { num: 3, label: 'Optimisation fiscale & Réglementation' },
      { num: 4, label: 'Point trimestriel & Ajustements' },
      { num: 5, label: 'Stratégie patrimoniale' },
      { num: 6, label: 'Bilan annuel complet' },
    ],
  },
};

interface ClientData {
  firstName: string;
  lastName: string;
  company: string;
  pack: 'starter' | 'pro' | 'expert';
}

interface RDVData {
  [key: string]: string;
}

export default function ExpertRDVCompanionPage() {
  const [view, setView] = useState<'select-client' | 'select-rdv' | 'rdv-form' | 'history'>('select-client');
  
  // État client
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientData, setClientData] = useState<ClientData>({
    firstName: '',
    lastName: '',
    company: '',
    pack: 'starter',
  });

  // État RDV
  const [selectedRDV, setSelectedRDV] = useState<number>(1);
  const [rdvData, setRDVData] = useState<RDVData>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // État historique
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // État expert
  const [expertId, setExpertId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadExpertId();
    loadClients();
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

  async function loadClients() {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('role', 'client')
        .order('first_name');

      setClients(data || []);
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

  function selectClient(client: any) {
    setSelectedClient(client);
    setClientData({
      firstName: client.first_name || '',
      lastName: client.last_name || '',
      company: '',
      pack: 'starter',
    });
    loadClientHistory(client.id);
    setView('select-rdv');
  }

  async function startRDV(rdvNum: number) {
    setSelectedRDV(rdvNum);
    
    // Charger la dernière session pour ce RDV si elle existe
    const existingSession = sessions.find(s => s.rdv_number === rdvNum);
    
    if (existingSession) {
      setCurrentSessionId(existingSession.id);
      setClientData(existingSession.client_data);
      setRDVData(existingSession.rdv_data || {});
      toast.info('Session précédente chargée !');
    } else {
      setCurrentSessionId(null);
      setRDVData({});
    }
    
    setView('rdv-form');
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
          rdvData,
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
      // 1. Charger info expert
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

      // 2. Générer le PDF avec jsPDF
      const doc = generateRDVPDF(
        clientData,
        selectedRDV,
        rdvData,
        expertName
      );

      // 3. Convertir en Blob
      const pdfBlob = getPDFBlob(doc);
      const fileName = `rdv-${selectedRDV}_${selectedClient.first_name}_${selectedClient.last_name}_${Date.now()}.pdf`;

      // 4. Upload vers Supabase + ajout dans documents client
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
        
        // Option : télécharger aussi en local
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

  const packInfo = PACKS[clientData.pack];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Companion RDV Expert
          </h1>
          <p className="text-slate-600 mt-2">
            Suivi structuré de vos rendez-vous clients
          </p>
        </div>
        <FileText className="text-amber-500" size={40} />
      </div>

      {/* ÉCRAN 1 : SÉLECTION CLIENT */}
      {view === 'select-client' && (
        <Card>
          <CardHeader>
            <CardTitle>Sélectionner un client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => selectClient(client)}
                  className="p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <p className="font-bold text-slate-900">
                    {client.first_name} {client.last_name}
                  </p>
                  <p className="text-sm text-slate-600">{client.email}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ÉCRAN 2 : SÉLECTION RDV */}
      {view === 'select-rdv' && selectedClient && (
        <>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="text-blue-600" />
            <AlertDescription className="text-blue-800">
              Client : <strong>{selectedClient.first_name} {selectedClient.last_name}</strong>
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-3 gap-4">
            {['starter', 'pro', 'expert'].map((pack) => (
              <Card
                key={pack}
                className={`cursor-pointer border-2 transition-all ${
                  clientData.pack === pack
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setClientData({ ...clientData, pack: pack as any })}
              >
                <CardHeader>
                  <CardTitle className="text-xl">
                    {PACKS[pack as keyof typeof PACKS].name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {PACKS[pack as keyof typeof PACKS].rdvs.map((rdv) => (
                      <div key={rdv.num} className="text-sm text-slate-600">
                        <span className="font-bold">RDV {rdv.num}:</span> {rdv.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique RDV</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-slate-500 text-center p-8">Aucun RDV enregistré</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-3">
                  {packInfo.rdvs.map((rdv) => {
                    const session = sessions.find(s => s.rdv_number === rdv.num);
                    return (
                      <button
                        key={rdv.num}
                        onClick={() => startRDV(rdv.num)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          session?.completed
                            ? 'border-green-200 bg-green-50'
                            : session
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant={session?.completed ? 'default' : 'secondary'}>
                            RDV {rdv.num}
                          </Badge>
                          {session?.completed && <CheckCircle2 size={16} className="text-green-600" />}
                          {session && !session.completed && <Clock size={16} className="text-amber-600" />}
                        </div>
                        <p className="text-sm font-medium text-slate-900">{rdv.label}</p>
                        {session && (
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(session.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setView('select-client')}>
              ← Changer de client
            </Button>
          </div>
        </>
      )}

      {/* ÉCRAN 3 : FORMULAIRE RDV */}
      {view === 'rdv-form' && (
        <>
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>RDV {selectedRDV}</strong> avec {selectedClient?.first_name} {selectedClient?.last_name}
              {currentSessionId && ' • Session existante chargée'}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Informations Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Prénom</Label>
                  <Input
                    value={clientData.firstName}
                    onChange={(e) => setClientData({ ...clientData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={clientData.lastName}
                    onChange={(e) => setClientData({ ...clientData, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Entreprise</Label>
                  <Input
                    value={clientData.company}
                    onChange={(e) => setClientData({ ...clientData, company: e.target.value })}
                    placeholder="SASU, EURL..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contenu du RDV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Objectifs du RDV</Label>
                <Textarea
                  value={rdvData.objectifs || ''}
                  onChange={(e) => setRDVData({ ...rdvData, objectifs: e.target.value })}
                  rows={3}
                  placeholder="Points à aborder..."
                />
              </div>

              <div>
                <Label>Notes & Actions</Label>
                <Textarea
                  value={rdvData.notes || ''}
                  onChange={(e) => setRDVData({ ...rdvData, notes: e.target.value })}
                  rows={5}
                  placeholder="Prises de notes pendant le RDV..."
                />
              </div>

              <div>
                <Label>Prochaines étapes</Label>
                <Textarea
                  value={rdvData.next_steps || ''}
                  onChange={(e) => setRDVData({ ...rdvData, next_steps: e.target.value })}
                  rows={3}
                  placeholder="Actions à réaliser avant le prochain RDV..."
                />
              </div>
            </CardContent>
          </Card>

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
        </>
      )}
    </div>
  );
}