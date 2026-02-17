'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Award,
  AlertTriangle,
  Phone,
  Calendar,
  Activity
} from 'lucide-react';

interface HOSStats {
  totalLeads: number;
  activeClosers: number;
  activeSetters: number;
  caMonth: number;
  rdvMonth: number;
  conversionRate: number;
  closingRate: number;
}

interface TeamPerformance {
  id: string;
  name: string;
  role: string;
  calls: number;
  rdv: number;
  closes: number;
  ca: number;
}

export default function HOSDashboard() {
  const [stats, setStats] = useState<HOSStats>({
    totalLeads: 0,
    activeClosers: 0,
    activeSetters: 0,
    caMonth: 0,
    rdvMonth: 0,
    conversionRate: 0,
    closingRate: 0,
  });
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadStats();
    loadTeamPerformance();
  }, []);

  async function loadStats() {
    // TODO: Charger vraies stats depuis team_members
    setStats({
      totalLeads: 487,
      activeClosers: 4,
      activeSetters: 3,
      caMonth: 127800,
      rdvMonth: 156,
      conversionRate: 32.1,
      closingRate: 18.5,
    });
    setLoading(false);
  }

  async function loadTeamPerformance() {
    // TODO: Charger depuis team_members avec leurs stats
    setTeamPerformance([
      { id: '1', name: 'Sophie Martin', role: 'Closer', calls: 142, rdv: 45, closes: 12, ca: 45600 },
      { id: '2', name: 'Thomas Dubois', role: 'Closer', calls: 128, rdv: 38, closes: 9, ca: 38200 },
      { id: '3', name: 'Marie Lefebvre', role: 'Setter', calls: 267, rdv: 78, closes: 0, ca: 0 },
      { id: '4', name: 'Lucas Bernard', role: 'Setter', calls: 245, rdv: 68, closes: 0, ca: 0 },
      { id: '5', name: 'Emma Rousseau', role: 'Closer', calls: 115, rdv: 32, closes: 7, ca: 28400 },
    ]);
  }

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
            <h1 className="text-4xl font-bold text-gray-900">Dashboard HOS</h1>
            <p className="text-gray-600 mt-2">Vue d'ensemble de la performance commerciale</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/hos/equipe"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Gérer l'Équipe
            </a>
            <a
              href="/hos/pipeline"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Pipeline Global
            </a>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target size={24} className="text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Leads Actifs</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar size={24} className="text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">RDV ce Mois</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.rdvMonth}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign size={24} className="text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">CA du Mois</h3>
            <p className="text-3xl font-bold text-gray-900">{(stats.caMonth / 1000).toFixed(0)}K€</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Taux Closing</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.closingRate}%</p>
          </div>
        </div>

        {/* Team Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Users size={20} />
              Setters
            </h3>
            <p className="text-5xl font-bold mb-2">{stats.activeSetters}</p>
            <p className="text-blue-100 text-sm">Actifs ce mois</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Award size={20} />
              Closers
            </h3>
            <p className="text-5xl font-bold mb-2">{stats.activeClosers}</p>
            <p className="text-purple-100 text-sm">Actifs ce mois</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Activity size={20} />
              Taux Conversion
            </h3>
            <p className="text-5xl font-bold mb-2">{stats.conversionRate}%</p>
            <p className="text-green-100 text-sm">Lead → RDV</p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🏆 Classement de l'Équipe</h2>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
              <option>Ce mois</option>
              <option>Cette semaine</option>
              <option>Aujourd'hui</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Rang
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Commercial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                    Appels
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                    RDV
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                    Closes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                    CA Généré
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamPerformance.map((member, index) => {
                  const isTop3 = index < 3;
                  const medalColors = ['text-yellow-500', 'text-gray-400', 'text-orange-600'];

                  return (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isTop3 && (
                            <Award className={medalColors[index]} size={20} fill="currentColor" />
                          )}
                          <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          member.role === 'Closer'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">{member.calls}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">{member.rdv}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900">{member.closes}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-green-600">
                          {member.ca > 0 ? `${member.ca.toLocaleString()}€` : '-'}
                        </span>
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