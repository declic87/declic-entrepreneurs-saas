'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Calendar, Clock, Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface AgendaItem {
  id: string;
  type: 'call' | 'rdv' | 'relance';
  lead_name: string;
  time: string;
  status: 'pending' | 'done' | 'missed';
  notes: string;
}

export default function SetterAgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadAgenda();
  }, [selectedDate]);

  async function loadAgenda() {
    // TODO: Charger depuis une vraie table d'agenda
    // Pour l'instant, données de démo
    setAgendaItems([
      {
        id: '1',
        type: 'call',
        lead_name: 'Jean Dupont',
        time: '09:00',
        status: 'done',
        notes: 'Premier contact - intéressé',
      },
      {
        id: '2',
        type: 'relance',
        lead_name: 'Marie Martin',
        time: '10:30',
        status: 'pending',
        notes: 'Relance après envoi doc',
      },
      {
        id: '3',
        type: 'call',
        lead_name: 'Pierre Durand',
        time: '11:00',
        status: 'pending',
        notes: 'Lead HOT - à qualifier',
      },
      {
        id: '4',
        type: 'rdv',
        lead_name: 'Sophie Bernard',
        time: '14:00',
        status: 'pending',
        notes: 'RDV Closer - présenter le dossier',
      },
      {
        id: '5',
        type: 'call',
        lead_name: 'Luc Petit',
        time: '15:30',
        status: 'missed',
        notes: 'Non répondu',
      },
    ]);
    setLoading(false);
  }

  const stats = {
    total: agendaItems.length,
    done: agendaItems.filter(i => i.status === 'done').length,
    pending: agendaItems.filter(i => i.status === 'pending').length,
    missed: agendaItems.filter(i => i.status === 'missed').length,
  };

  const typeConfig = {
    call: { label: 'Appel', color: 'bg-blue-100 text-blue-700', icon: Phone },
    relance: { label: 'Relance', color: 'bg-orange-100 text-orange-700', icon: Clock },
    rdv: { label: 'RDV', color: 'bg-purple-100 text-purple-700', icon: Calendar },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Mon Agenda</h1>
          <p className="text-gray-600 mt-2">
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats du jour */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Calendar className="text-gray-400 mb-2" size={24} />
            <p className="text-sm text-gray-600">Total Activités</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <CheckCircle className="text-green-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Terminées</p>
            <p className="text-3xl font-bold text-green-600">{stats.done}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Clock className="text-orange-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">À Faire</p>
            <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <AlertCircle className="text-red-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Manquées</p>
            <p className="text-3xl font-bold text-red-600">{stats.missed}</p>
          </div>
        </div>

        {/* Sélecteur de date */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              ← Jour précédent
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Jour suivant →
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Planning du jour</h2>
          
          <div className="space-y-4">
            {agendaItems.map((item) => {
              const config = typeConfig[item.type];
              const StatusIcon = config.icon;

              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                    item.status === 'done' ? 'border-green-200 bg-green-50' :
                    item.status === 'missed' ? 'border-red-200 bg-red-50' :
                    'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {/* Heure */}
                  <div className="flex flex-col items-center min-w-[80px]">
                    <span className="text-2xl font-bold text-gray-900">{item.time}</span>
                    {item.status === 'done' && (
                      <CheckCircle className="text-green-500 mt-1" size={20} />
                    )}
                    {item.status === 'missed' && (
                      <AlertCircle className="text-red-500 mt-1" size={20} />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
                        {config.label}
                      </span>
                      <h3 className="font-bold text-gray-900 text-lg">{item.lead_name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{item.notes}</p>
                  </div>

                  {/* Action */}
                  {item.status === 'pending' && (
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Commencer
                    </button>
                  )}
                </div>
              );
            })}

            {agendaItems.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 font-medium">Aucune activité prévue ce jour</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}