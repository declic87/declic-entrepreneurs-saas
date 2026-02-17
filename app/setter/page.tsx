'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Users, 
  Phone, 
  Calendar, 
  Clock, 
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle2,
  Zap
} from 'lucide-react';

interface SetterStats {
  leadsAssigned: number;
  callsToday: number;
  callsTarget: number;
  rdvBooked: number;
  conversionRate: number;
  avgCallDuration: string;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  temperature: string;
  created_at: string;
  last_contact: string | null;
}

export default function SetterDashboard() {
  const [stats, setStats] = useState<SetterStats>({
    leadsAssigned: 0,
    callsToday: 0,
    callsTarget: 40,
    rdvBooked: 0,
    conversionRate: 0,
    avgCallDuration: '0:00',
  });
  const [priorityLeads, setPriorityLeads] = useState<Lead[]>([]);
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
      loadStats();
      loadPriorityLeads();
    }
  }, [userId]);

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

  async function loadStats() {
    // TODO: Implémenter les vraies stats depuis la base
    // Pour l'instant, données de démonstration
    setStats({
      leadsAssigned: 62,
      callsToday: 28,
      callsTarget: 40,
      rdvBooked: 12,
      conversionRate: 19.4,
      avgCallDuration: '3:24',
    });
    setLoading(false);
  }

  async function loadPriorityLeads() {
    // TODO: Charger les vrais leads depuis la table
    // Pour l'instant, données de démo
    setPriorityLeads([
      {
        id: '1',
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean@test.fr',
        phone: '06 12 34 56 78',
        status: 'NOUVEAU',
        temperature: 'HOT',
        created_at: new Date(Date.now() - 600000).toISOString(),
        last_contact: null,
      },
      {
        id: '2',
        first_name: 'Marie',
        last_name: 'Martin',
        email: 'marie@test.fr',
        phone: '06 98 76 54 32',
        status: 'RELANCE',
        temperature: 'WARM',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        last_contact: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '3',
        first_name: 'Pierre',
        last_name: 'Durand',
        email: 'pierre@test.fr',
        phone: '06 11 22 33 44',
        status: 'NOUVEAU',
        temperature: 'HOT',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        last_contact: null,
      },
    ]);
  }

  const callProgress = (stats.callsToday / stats.callsTarget) * 100;

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard Setter</h1>
            <p className="text-gray-600 mt-2">
              Objectif du jour : {stats.callsTarget} appels ({callProgress.toFixed(0)}% complété)
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            <Phone size={20} />
            Nouvel Appel
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Progression Journalière</span>
            <span className="text-2xl font-bold text-gray-900">
              {stats.callsToday} / {stats.callsTarget}
            </span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${Math.min(callProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Leads à Appeler</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.leadsAssigned}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Phone size={24} className="text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Appels Aujourd'hui</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.callsToday}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar size={24} className="text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">RDV Bookés</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.rdvBooked}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Taux de Conv.</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
          </div>
        </div>

        {/* Priority Leads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Leads Prioritaires</h2>
            </div>
            <a href="/setter/leads" className="text-blue-600 hover:text-blue-700 font-medium">
              Voir tous →
            </a>
          </div>

          <div className="space-y-4">
            {priorityLeads.map((lead) => {
              const timeAgo = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 60000);
              const isUrgent = timeAgo < 30 || lead.temperature === 'HOT';

              return (
                <div
                  key={lead.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                    isUrgent
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {lead.first_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-lg">
                          {lead.first_name} {lead.last_name}
                        </p>
                        {lead.temperature === 'HOT' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                            🔥 HOT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500">{lead.phone}</span>
                        <span className="text-xs text-gray-400">
                          {timeAgo < 60 ? `Il y a ${timeAgo} min` : 'Il y a plusieurs heures'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      lead.status === 'NOUVEAU' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {lead.status}
                    </span>
                    <button className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      <Phone size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={20} />
              Temps Moyen d'Appel
            </h3>
            <p className="text-4xl font-bold text-gray-900">{stats.avgCallDuration}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap size={20} />
              Objectif du Mois
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold">{stats.rdvBooked * 2.5}</p>
              <span className="text-blue-100">/ 200 RDV</span>
            </div>
            <div className="mt-4 w-full h-2 bg-blue-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: `${(stats.rdvBooked * 2.5 / 200) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}