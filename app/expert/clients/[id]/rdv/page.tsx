'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, Save, Video, ArrowLeft, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  category: string;
  question: string;
  question_type: string;
  order_index: number;
}

interface Response {
  question_id: string;
  response_value: string;
  notes: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Appointment {
  id: string;
  rdv_number: number;
  scheduled_at: string;
  status: string;
  fathom_recording_url: string | null;
  notes: string | null;
}

export default function ExpertRDVPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fathomUrl, setFathomUrl] = useState<string>('');
  const [startingFathom, setStartingFathom] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    try {
      // Charger le client
      const { data: clientData } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('id', clientId)
        .single();

      if (clientData) setClient(clientData);

      // Charger le RDV en cours ou créer un nouveau
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (userData) {
          // Chercher RDV en cours
          let { data: appointmentData } = await supabase
            .from('expert_appointments')
            .select('*')
            .eq('client_id', clientId)
            .eq('expert_id', userData.id)
            .eq('status', 'scheduled')
            .order('scheduled_at', { ascending: false })
            .limit(1)
            .single();

          // Si pas de RDV en cours, créer un nouveau
          if (!appointmentData) {
            const { data: countData } = await supabase
              .from('expert_appointments')
              .select('rdv_number')
              .eq('client_id', clientId)
              .order('rdv_number', { ascending: false })
              .limit(1)
              .single();

            const nextNumber = countData ? countData.rdv_number + 1 : 1;

            const { data: newAppointment } = await supabase
              .from('expert_appointments')
              .insert({
                client_id: clientId,
                expert_id: userData.id,
                rdv_number: nextNumber,
                scheduled_at: new Date().toISOString(),
                status: 'scheduled',
              })
              .select()
              .single();

            appointmentData = newAppointment;
          }

          if (appointmentData) {
            setAppointment(appointmentData);
            if (appointmentData.fathom_recording_url) {
              setFathomUrl(appointmentData.fathom_recording_url);
            }

            // Charger les réponses existantes
            const { data: responsesData } = await supabase
              .from('expert_checklist_responses')
              .select('question_id, response_value, notes')
              .eq('appointment_id', appointmentData.id);

            if (responsesData) {
              const responsesMap: Record<string, Response> = {};
              responsesData.forEach(r => {
                responsesMap[r.question_id] = r;
              });
              setResponses(responsesMap);
            }
          }
        }
      }

      // Charger les questions
      const { data: questionsData } = await supabase
        .from('expert_checklist_questions')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('order_index');

      if (questionsData) setQuestions(questionsData);

    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  function updateResponse(questionId: string, field: 'response_value' | 'notes', value: string) {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        question_id: questionId,
        [field]: value,
      }
    }));
  }

  async function saveResponses() {
    if (!appointment) return;

    setSaving(true);
    try {
      // Supprimer les anciennes réponses
      await supabase
        .from('expert_checklist_responses')
        .delete()
        .eq('appointment_id', appointment.id);

      // Insérer les nouvelles
      const responsesToInsert = Object.values(responses).map(r => ({
        appointment_id: appointment.id,
        question_id: r.question_id,
        response_value: r.response_value || '',
        notes: r.notes || '',
      }));

      if (responsesToInsert.length > 0) {
        await supabase
          .from('expert_checklist_responses')
          .insert(responsesToInsert);
      }

      toast.success('Réponses enregistrées !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function startFathomRecording() {
    if (!appointment || !client) return;

    setStartingFathom(true);
    try {
      const response = await fetch('/api/fathom/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          clientName: `${client.first_name} ${client.last_name}`,
          rdvNumber: appointment.rdv_number,
        }),
      });

      const data = await response.json();

      if (data.success && data.fathom_url) {
        setFathomUrl(data.fathom_url);
        toast.success('Enregistrement Fathom créé !');
        // Ouvrir Fathom dans un nouvel onglet
        window.open(data.fathom_url, '_blank');
      } else {
        throw new Error(data.error || 'Erreur Fathom');
      }
    } catch (error: any) {
      console.error('Erreur Fathom:', error);
      toast.error('Impossible de démarrer Fathom');
    } finally {
      setStartingFathom(false);
    }
  }

  async function completeRDV() {
    if (!appointment) return;

    try {
      await supabase
        .from('expert_appointments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', appointment.id);

      toast.success('RDV terminé !');
      router.push(`/expert/clients/${clientId}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la finalisation');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  // Grouper questions par catégorie
  const questionsByCategory = questions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  const categoryLabels: Record<string, string> = {
    situation: '📋 Situation Actuelle',
    revenus: '💰 Revenus',
    charges: '📊 Charges',
    objectifs: '🎯 Objectifs',
    recommandations: '✨ Recommandations',
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/expert/clients/${clientId}`)}
          >
            <ArrowLeft size={18} className="mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#123055]">
              RDV #{appointment?.rdv_number} - {client?.first_name} {client?.last_name}
            </h1>
            <p className="text-gray-600">{client?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={saveResponses}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </Button>
          <Button
            onClick={completeRDV}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 size={18} className="mr-2" />
            Terminer le RDV
          </Button>
        </div>
      </div>

      {/* Fathom Recording */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video className="text-purple-600" size={32} />
              <div>
                <h3 className="font-bold text-[#123055]">Enregistrement Fathom</h3>
                <p className="text-sm text-gray-600">
                  Enregistrez automatiquement ce RDV avec Fathom
                </p>
              </div>
            </div>

            {fathomUrl ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <a href={fathomUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={18} className="mr-2" />
                    Ouvrir Fathom
                  </a>
                </Button>
              </div>
            ) : (
              <Button
                onClick={startFathomRecording}
                disabled={startingFathom}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Video size={18} className="mr-2" />
                {startingFathom ? 'Démarrage...' : 'Démarrer Fathom'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist par catégorie */}
      {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
        <Card key={category}>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-[#123055] mb-6">
              {categoryLabels[category] || category}
            </h2>

            <div className="space-y-6">
              {categoryQuestions.map((question) => {
                const response = responses[question.id] || { response_value: '', notes: '' };
                const isChecked = response.response_value === 'true';

                return (
                  <div key={question.id} className="border-l-4 border-orange-200 pl-4 py-2">
                    <div className="flex items-start gap-4 mb-3">
                      {question.question_type === 'checkbox' ? (
                        <button
                          onClick={() => updateResponse(question.id, 'response_value', (!isChecked).toString())}
                          className="mt-1"
                        >
                          {isChecked ? (
                            <CheckCircle2 className="text-green-600" size={24} />
                          ) : (
                            <Circle className="text-gray-400" size={24} />
                          )}
                        </button>
                      ) : null}
                      
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{question.question}</p>
                        
                        {question.question_type === 'text' && (
                          <Input
                            value={response.response_value}
                            onChange={(e) => updateResponse(question.id, 'response_value', e.target.value)}
                            placeholder="Réponse..."
                            className="mt-2"
                          />
                        )}

                        {question.question_type === 'number' && (
                          <Input
                            type="number"
                            value={response.response_value}
                            onChange={(e) => updateResponse(question.id, 'response_value', e.target.value)}
                            placeholder="Montant..."
                            className="mt-2"
                          />
                        )}

                        <Textarea
                          value={response.notes}
                          onChange={(e) => updateResponse(question.id, 'notes', e.target.value)}
                          placeholder="Notes de l'expert..."
                          className="mt-2 min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Bouton fixe de sauvegarde */}
      <div className="fixed bottom-8 right-8 flex gap-4">
        <Button
          onClick={saveResponses}
          disabled={saving}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xl"
        >
          <Save size={20} className="mr-2" />
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </Button>
        <Button
          onClick={completeRDV}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white shadow-2xl"
        >
          <CheckCircle2 size={20} className="mr-2" />
          Terminer
        </Button>
      </div>
    </div>
  );
}