'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface RDV {
  id: string;
  lead_name: string;
  closer_name: string;
  date: string;
  time: string;
  status: string;
  type: string;
}

export default function HOSRDVPage() {
  const [rdvs, setRDVs] = useState<RDV[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadRDVs();
  }, []);

  async function loadRDVs() {
    // TODO: Charger depuis la vraie table rdvs quand elle existera
    // Pour l'instant, données de démo
    setRDVs([
      {
        id: '1',
        lead_name: 'Jean Dupont',
        closer_name: 'Sophie Martin',
        date: '2024-02-20',
        time: '10:00',
        status: 'PLANIFIE',
        type: 'Découverte',
      },
      {
        id: '2',
        lead_name: 'Marie Bernard',
        closer_name: 'Thomas Dubois',
        date: '2024-02-20',
        time: '14:30',
        status: 'EFFECTUE',
        type: 'Closing',
      },
      {
        id: '3',
        lead_name: 'Pierre Martin',
        closer_name: 'Sophie Martin',
        date: '2024-02-21',
        time: '09:00',
        status: 'PLANIFIE',
        type: 'Découverte',
      },
      {
        id: '4',
        lead_name: 'Lucie Petit',
        closer_name: 'Thomas Dubois',
        date: '2024-02-19',
        time: '16:00',
        status: 'NO_SHOW',
        type: 'Découverte',
      },
    ]);
    setLoading(false);
  }

  const filteredRDVs = rdvs.filter(rdv => 
    filterStatus === 'all' || rdv.status === filterStatus
  );

  const stats = {
    total: rdvs.length,
    planifies: rdvs.filter(r => r.status === 'PLANIFIE').length,
    effectues: rdvs.filter(r => r.status === 'EFFECTUE').length,
    noShows: rdvs.filter(r => r.status === 'NO_SHOW').length,
  };

  const statusConfig = {
    PLANIFIE: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    EFFECTUE: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    NO_SHOW: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    ANNULE: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle },
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
            <h1 className="text-4xl font-bold text-gray-900">Rendez-vous</h1>
            <p className="text-gray-600 mt-2">Gestion et suivi des RDV</p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            + Planifier RDV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Calendar className="text-gray-400 mb-2" size={24} />
            <p className="text-sm text-gray-600">Total RDV</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Clock className="text-blue-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Planifiés</p>
            <p className="text-3xl font-bold text-blue-600">{stats.planifies}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <CheckCircle className="text-green-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Effectués</p>
            <p className="text-3xl font-bold text-green-600">{stats.effectues}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <XCircle className="text-red-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">No-Shows</p>
            <p className="text-3xl font-bold text-red-600">{stats.noShows}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex gap-2">
            {['all', 'PLANIFIE', 'EFFECTUE', 'NO_SHOW'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Tous' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Liste RDV */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Closer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date & Heure</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRDVs.map((rdv) => {
                  const StatusIcon = statusConfig[rdv.status as keyof typeof statusConfig]?.icon || Clock;
                  const statusColor = statusConfig[rdv.status as keyof typeof statusConfig]?.color || 'bg-gray-100';

                  return (
                    <tr key={rdv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {rdv.lead_name.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-900">{rdv.lead_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{rdv.closer_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {new Date(rdv.date).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-sm text-gray-500">{rdv.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                          {rdv.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor} flex items-center gap-1 w-fit`}>
                          <StatusIcon size={14} />
                          {rdv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                            Voir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}