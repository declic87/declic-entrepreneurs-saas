'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar, Video, FileText, Plus, ArrowLeft, CheckCircle2, Clock,
  Mail, Phone, MessageCircle, Package, Activity, PhoneCall, User2
} from 'lucide-react';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  pack?: string;
  pack_expires_at?: string;
  current_step?: number;
  status?: string;
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

interface CloserRDV {
  id: string;
  closer_id: string;
  rdv_date: string;
  rdv_status: string;
  fathom_recording_url: string | null;
  fathom_summary: string | null;
  closer_notes: string | null;
  closer: {
    first_name: string;
    last_name: string;
  };
}

interface QuestionResponse {
  question: string;
  category: string;
  response_value: string;
  notes: string;
}

interface MessageData {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
}

interface CalendlyEvent {
  id: string;
  event_type: string;
  scheduled_at: string;
  status: string;
}

export default function ExpertFicheClientFinal() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [closerRDVs, setCloserRDVs] = useState<CloserRDV[]>([]);
  const [calendlyEvents, setCalendlyEvents] = useState<CalendlyEvent[]>([]);
  const [selectedRDV, setSelectedRDV] = useState<Appointment | null>(null);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
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
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientData) {
        setClient(clientData);

        // Charger le pack
        const { data: accessData } = await supabase
          .from('client_access')
          .select('pack_type, expires_at')
          .eq('user_id', clientId)
          .single();

        if (accessData) {
          setClient(prev => ({
            ...prev!,
            pack: accessData.pack_type,
            pack_expires_at: accessData.expires_at
          }));
        }
      }

      // Charger RDV experts
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

      // Charger RDV Closer depuis leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select(`
          id,
          closer_id,
          rdv_date,
          rdv_status,
          fathom_recording_url,
          fathom_summary,
          closer_notes,
          closer:closer_id (
            first_name,
            last_name
          )
        `)
        .eq('email', clientData?.email)
        .not('rdv_date', 'is', null)
        .order('rdv_date', { ascending: false });

      if (leadsData) {
        setCloserRDVs(leadsData as any);
      }

      // Charger RDV Calendly
      const { data: calendlyData } = await supabase
        .from('calendly_events')
        .select('*')
        .eq('user_id', clientId)
        .order('scheduled_at', { ascending: false })
        .limit(10);

      if (calendlyData) setCalendlyEvents(calendlyData);

      // Charger les messages récents
      const { data: convData } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', clientId)
        .single();

      if (convData) {
        setConversationId(convData.id);

        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (msgData) setMessages(msgData);
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

  function getPackLabel(pack: string) {
    const labels: Record<string, string> = {
      starter: "Starter",
      pro: "Pro",
      expert: "Expert",
      plateforme: "Plateforme",
      createur: "Créateur",
      agent_immo: "Agent Immobilier"
    };
    return labels[pack] || pack;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
      case 'close':
        return <Badge className="bg-green-500">✓ Terminé</Badge>;
      case 'no_show':
        return <Badge className="bg-orange-500">⚠ No-show</Badge>;
      case 'canceled':
      case 'annule':
        return <Badge className="bg-red-500">✗ Annulé</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500">📅 Programmé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <p className="text-red-500">Client introuvable</p>
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

  const totalRDV = appointments.length + calendlyEvents.length + closerRDVs.length;
  const completedRDV = appointments.filter(a => a.status === 'completed').length + 
                       closerRDVs.filter(c => c.rdv_status === 'close').length;
  const totalMessages = messages.length;

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Header avec retour */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/expert/clients')}
        >
          <ArrowLeft size={18} className="mr-2" />
          Retour
        </Button>
      </div>

      {/* Carte principale - Infos client */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600">
              <AvatarFallback className="text-white font-bold text-2xl">
                {client.first_name.charAt(0)}
                {client.last_name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {client.first_name} {client.last_name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Mail size={14} />
                  {client.email}
                </div>
                {client.phone && (
                  <div className="flex items-center gap-1">
                    <Phone size={14} />
                    {client.phone}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-3">
                {client.pack && (
                  <Badge className="bg-blue-600 text-white">
                    <Package size={12} className="mr-1" />
                    {getPackLabel(client.pack)}
                  </Badge>
                )}
                {client.pack_expires_at && (
                  <span className="text-xs text-gray-500">
                    Expire le {new Date(client.pack_expires_at).toLocaleDateString("fr-FR")}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  Client depuis {new Date(client.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => router.push(`/expert/messagerie?client=${clientId}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MessageCircle size={16} className="mr-2" />
                Envoyer un message
              </Button>
              <Button
                onClick={() => router.push(`/expert/clients/${clientId}/rdv`)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus size={18} className="mr-2" />
                Nouveau RDV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">RDV Total</p>
                <p className="text-2xl font-bold text-blue-600">{totalRDV}</p>
              </div>
              <Calendar className="text-blue-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">RDV Terminés</p>
                <p className="text-2xl font-bold text-green-600">{completedRDV}</p>
              </div>
              <CheckCircle2 className="text-green-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-purple-600">{totalMessages}</p>
              </div>
              <MessageCircle className="text-purple-400" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Progression</p>
                <p className="text-2xl font-bold text-orange-600">{client.current_step || 1}/7</p>
              </div>
              <Activity className="text-orange-400" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RDV Closer - Section spéciale */}
      {closerRDVs.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <PhoneCall size={20} />
              📞 RDV Closer ({closerRDVs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {closerRDVs.map((rdv) => (
              <Card key={rdv.id} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User2 size={16} className="text-green-600" />
                        <span className="font-bold text-gray-900">
                          {rdv.closer?.first_name} {rdv.closer?.last_name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(rdv.rdv_date).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {getStatusBadge(rdv.rdv_status)}
                  </div>

                  {rdv.fathom_recording_url && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Video className="text-purple-600" size={16} />
                          <span className="text-sm font-semibold text-purple-900">
                            Enregistrement Fathom
                          </span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={rdv.fathom_recording_url} target="_blank">
                            Voir
                          </a>
                        </Button>
                      </div>
                      {rdv.fathom_summary && (
                        <p className="text-xs text-gray-700">{rdv.fathom_summary}</p>
                      )}
                    </div>
                  )}

                  {rdv.closer_notes && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <p className="text-xs font-semibold text-amber-900 mb-1">
                        Notes du closer
                      </p>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">
                        {rdv.closer_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contenu principal - RDV Experts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne 1 : RDV Experts + Calendly */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#123055]">📅 RDV Experts</h2>

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

          {calendlyEvents.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-gray-600 mt-6">RDV Calendly</h3>
              {calendlyEvents.map((event) => (
                <Card key={event.id} className="border-blue-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-blue-900">
                        {event.event_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(event.scheduled_at).toLocaleString('fr-FR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {appointments.length === 0 && calendlyEvents.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Aucun RDV expert pour l'instant
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne 2 : Détails RDV sélectionné + Messages */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRDV ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-[#123055] mb-4">
                    RDV Expert #{selectedRDV.rdv_number}
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
                      {getStatusBadge(selectedRDV.status)}
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
                <FileText className="mx-auto mb-4 opacity-20" size={48} />
                <p>Sélectionnez un RDV pour voir les détails</p>
              </CardContent>
            </Card>
          )}

          {/* Messages récents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle size={18} />
                Messages récents ({messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Aucun message
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.sender_type === "client"
                        ? "bg-gray-100"
                        : msg.sender_type === "expert"
                        ? "bg-blue-50"
                        : "bg-purple-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {msg.sender_type === "client" ? "Client" : 
                         msg.sender_type === "expert" ? "Expert" : "IA"}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}

              {conversationId && messages.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push(`/expert/messagerie?client=${clientId}`)}
                >
                  Voir toute la conversation
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}