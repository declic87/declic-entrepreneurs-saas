'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Video, FileText, Plus, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

interface Appointment {
  id: string;
  rdv_number: number;
  scheduled_at: string;
  status: string;
  fathom_recording_url: string | null;
  fathom_summary: string | null;
  notes: string | null;
  completed_at: string | null;
}

interface QuestionResponse {
  question: string;
  category: string;
  response_value: string;
  notes: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedRDV, setSelectedRDV] = useState<Appointment | null>(null);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  useEffect(() => {
    if (selectedRDV) {
      loadRDVResponses(selectedRDV.id);
    }
  }, [selectedRDV]);

  async function loadClientData() {
    try {
      // Charger client
      const { data: clientData } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone')
        .eq('id', clientId)
        .single();

      if (clientData) setClient(clientData);

      // Charger RDV
      const { data: appointmentsData } = await supabase
        .from('expert_appointments')
        .select('*')
        .eq('client_id', clientId)
        .order('rdv_number', { ascending: false });

      if (appointmentsData) {
        setAppointments(appointmentsData);
        if (appointmentsData.length > 0) {
          setSelectedRDV(appointmentsData[0]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRDVResponses(appointmentId: string) {
    const { data } = await supabase
      .from('expert_checklist_responses')
      .select(`
        response_value,
        notes,
        expert_checklist_questions (
          question,
          category
        )
      `)
      .eq('appointment_id', appointmentId);

    if (data) {
      const formattedResponses: QuestionResponse[] = data.map((r: any) => ({
        question: r.expert_checklist_questions?.question || '',
        category: r.expert_checklist_questions?.category || '',
        response_value: r.response_value,
        notes: r.notes,
      }));
      setResponses(formattedResponses);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  // Grouper réponses par catégorie
  const responsesByCategory = responses.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, QuestionResponse[]>);

  const categoryLabels: Record<string, string> = {
    situation: '📋 Situation',
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
            onClick={() => router.push('/expert/clients')}
          >
            <ArrowLeft size={18} className="mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#123055]">
              {client?.first_name} {client?.last_name}
            </h1>
            <p className="text-gray-600">{client?.email}</p>
          </div>
        </div>

        <Button
          onClick={() => router.push(`/expert/clients/${clientId}/rdv`)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus size={18} className="mr-2" />
          Nouveau RDV
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Liste RDV */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#123055]">Historique RDV</h2>

          {appointments.map((rdv) => (
            <Card
              key={rdv.id}
              className={`cursor-pointer transition-all ${
                selectedRDV?.id === rdv.id
                  ? 'ring-2 ring-orange-500 border-orange-500'
                  : 'hover:border-orange-300'
              }`}
              onClick={() => setSelectedRDV(rdv)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#123055]">RDV #{rdv.rdv_number}</span>
                  {rdv.status === 'completed' ? (
                    <CheckCircle2 className="text-green-600" size={20} />
                  ) : (
                    <Clock className="text-orange-500" size={20} />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(rdv.scheduled_at).toLocaleDateString('fr-FR')}
                </p>
                {rdv.fathom_recording_url && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                    <Video size={14} />
                    Enregistrement disponible
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {appointments.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Aucun RDV pour l'instant
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne droite : Détails RDV sélectionné */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRDV ? (
            <>
              {/* Infos RDV */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-[#123055] mb-4">
                    RDV #{selectedRDV.rdv_number}
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold">
                        {new Date(selectedRDV.scheduled_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Statut</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        selectedRDV.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedRDV.status === 'completed' ? 'Terminé' : 'En cours'}
                      </span>
                    </div>
                  </div>

                  {selectedRDV.fathom_recording_url && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video className="text-purple-600" size={20} />
                          <span className="font-semibold text-purple-900">Enregistrement Fathom</span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedRDV.fathom_recording_url} target="_blank">
                            Voir
                          </a>
                        </Button>
                      </div>
                      {selectedRDV.fathom_summary && (
                        <p className="mt-3 text-sm text-gray-700">
                          {selectedRDV.fathom_summary}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedRDV.notes && (
                    <div className="mt-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <p className="text-sm font-semibold text-amber-900 mb-2">Notes de l'expert</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRDV.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Réponses aux questions */}
              {Object.entries(responsesByCategory).map(([category, categoryResponses]) => (
                <Card key={category}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-[#123055] mb-4">
                      {categoryLabels[category] || category}
                    </h3>

                    <div className="space-y-4">
                      {categoryResponses.map((response, idx) => (
                        <div key={idx} className="border-l-4 border-orange-200 pl-4">
                          <p className="font-semibold text-gray-900 mb-1">{response.question}</p>
                          {response.response_value && (
                            <p className="text-sm text-gray-700 mb-2">
                              ✓ {response.response_value}
                            </p>
                          )}
                          {response.notes && (
                            <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                              💬 {response.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {responses.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <FileText className="mx-auto mb-4 opacity-20" size={48} />
                    <p>Aucune réponse enregistrée pour ce RDV</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                Sélectionnez un RDV pour voir les détails
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}