'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Calendar, Clock, Phone, CheckCircle, AlertCircle, Video, MapPin, User } from 'lucide-react';

interface RDV {
  id: string;
  lead_name: string;
  lead_phone: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  notes: string;
  location: string;
}

export default function CommercialAgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rdvs, setRDVs] = useState<RDV[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadRDVs();
    }
  }, [userId, selectedDate]);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (profile) {
        setUserId(profile.id);
      }
    }
  }

  async function loadRDVs() {
    // TODO: Charger depuis une vraie table rdvs
    // Pour l'instant, données de démo
    setRDVs([
      {
        id: '1',
        lead_name: 'Jean Dupont',
        lead_phone: '06 12 34 56 78',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        duration: 45,
        type: 'Découverte',
        status: 'pending',
        notes: 'Premier contact - Projet création SASU',
        location: 'Visio',
      },
      {
        id: '2',
        lead_name: 'Marie Martin',
        lead_phone: '06 98 76 54 32',
        date: new Date().toISOString().split('T')[0],
        time: '14:30',
        duration: 60,
        type: 'Closing',
        status: 'pending',
        notes: 'Prêt à signer - Pack Expert',
        location: 'Google Meet',
      },
      {
        id: '3',
        lead_name: 'Pierre Durand',
        lead_phone: '06 11 22 33 44',
        date: new Date().toISOString().split('T')[0],
        time: '16:00',
        duration: 30,
        type: 'Suivi',
        status: 'pending',
        notes: 'Relance après envoi devis',
        location: 'Téléphone',
      },
    ]);
    setLoading(false);
  }

  const stats = {
    total: rdvs.length,
    done: rdvs.filter(r => r.status === 'done').length,
    pending: rdvs.filter(r => r.status === 'pending').length,
    totalDuration: rdvs.reduce((sum, r) => sum + r.duration, 0),
  };

  const typeConfig = {
    Découverte: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: User },
    Closing: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    Suivi: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Phone },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Mon Agenda</h1>
            <p className="text-gray-600 mt-2">
              {selectedDate.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            <Calendar size={20} />
            Ajouter un RDV
          </button>
        </div>

        {/* Stats du jour */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Calendar className="text-gray-400 mb-2" size={24} />
            <p className="text-sm text-gray-600">RDV du jour</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Clock className="text-orange-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Temps prévu</p>
            <p className="text-3xl font-bold text-orange-600">{stats.totalDuration} min</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <CheckCircle className="text-green-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Terminés</p>
            <p className="text-3xl font-bold text-green-600">{stats.done}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <AlertCircle className="text-blue-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">À venir</p>
            <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
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
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Jour suivant →
            </button>
            <div className="ml-auto flex items-center gap-2">
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Calendar size={16} />
                Ouvrir Google Calendar
              </a>
            </div>
          </div>
        </div>

        {/* Timeline des RDV */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Planning du jour</h2>
          
          <div className="space-y-4">
            {rdvs.map((rdv) => {
              const config = typeConfig[rdv.type as keyof typeof typeConfig] || typeConfig.Découverte;
              const TypeIcon = config.icon;

              return (
                <div
                  key={rdv.id}
                  className="flex items-start gap-4 p-5 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  {/* Heure et durée */}
                  <div className="flex flex-col items-center min-w-[100px]">
                    <span className="text-2xl font-bold text-gray-900">{rdv.time}</span>
                    <span className="text-xs text-gray-500">{rdv.duration} min</span>
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                        {rdv.type}
                      </span>
                      <TypeIcon size={16} className="text-gray-400" />
                    </div>
                    
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{rdv.lead_name}</h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {rdv.lead_phone}
                      </span>
                      <span className="flex items-center gap-1">
                        {rdv.location === 'Visio' || rdv.location === 'Google Meet' ? (
                          <Video size={14} />
                        ) : (
                          <MapPin size={14} />
                        )}
                        {rdv.location}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600">{rdv.notes}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {rdv.status === 'pending' ? (
                      <>
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Démarrer
                        </button>
                        <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                          Modifier
                        </button>
                      </>
                    ) : (
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold">
                        ✓ Terminé
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {rdvs.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 font-medium">Aucun RDV prévu ce jour</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}