'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Phone,
  Calendar,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';

interface AnalyticsData {
  period: string;
  totalLeads: number;
  qualifiedLeads: number;
  rdvBooked: number;
  closes: number;
  ca: number;
  conversionRate: number;
  avgDealValue: number;
  avgCycleDays: number;
}

interface TeamAnalytics {
  name: string;
  role: string;
  calls: number;
  rdv: number;
  closes: number;
  ca: number;
  conversionRate: number;
}

export default function AnalyticsCRM() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    period: 'Ce mois',
    totalLeads: 487,
    qualifiedLeads: 312,
    rdvBooked: 156,
    closes: 28,
    ca: 127800,
    conversionRate: 32.1,
    avgDealValue: 4564,
    avgCycleDays: 18,
  });
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    // TODO: Charger vraies données depuis la base
    setTeamAnalytics([
      { name: 'Sophie Martin', role: 'Closer', calls: 142, rdv: 45, closes: 12, ca: 45600, conversionRate: 31.7 },
      { name: 'Marie Lefebvre', role: 'Setter', calls: 267, rdv: 78, closes: 0, ca: 0, conversionRate: 29.2 },
      { name: 'Thomas Dubois', role: 'Closer', calls: 128, rdv: 38, closes: 9, ca: 38200, conversionRate: 29.7 },
      { name: 'Lucas Bernard', role: 'Setter', calls: 245, rdv: 68, closes: 0, ca: 0, conversionRate: 27.8 },
    ]);
    
    setLoading(false);
  }

  const funnelData = [
    { stage: 'Leads', count: analytics.totalLeads, percentage: 100 },
    { stage: 'Qualifiés', count: analytics.qualifiedLeads, percentage: (analytics.qualifiedLeads / analytics.totalLeads) * 100 },
    { stage: 'RDV', count: analytics.rdvBooked, percentage: (analytics.rdvBooked / analytics.totalLeads) * 100 },
    { stage: 'Closes', count: analytics.closes, percentage: (analytics.closes / analytics.totalLeads) * 100 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Analytics CRM</h1>
            <p className="text-gray-600 mt-2">Métriques et performances avancées</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
            {(['week', 'month', 'quarter'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range === 'week' ? '7 jours' : range === 'month' ? '30 jours' : '90 jours'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <Users size={28} />
              <span className="text-blue-100 text-sm">+12%</span>
            </div>
            <p className="text-blue-100 text-sm mb-1">Leads Total</p>
            <p className="text-4xl font-bold">{analytics.totalLeads}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <Calendar size={28} />
              <span className="text-green-100 text-sm">+8%</span>
            </div>
            <p className="text-green-100 text-sm mb-1">RDV Bookés</p>
            <p className="text-4xl font-bold">{analytics.rdvBooked}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <Target size={28} />
              <span className="text-purple-100 text-sm">+15%</span>
            </div>
            <p className="text-purple-100 text-sm mb-1">Closes</p>
            <p className="text-4xl font-bold">{analytics.closes}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <DollarSign size={28} />
              <span className="text-orange-100 text-sm">+22%</span>
            </div>
            <p className="text-orange-100 text-sm mb-1">CA Généré</p>
            <p className="text-4xl font-bold">{(analytics.ca / 1000).toFixed(0)}K€</p>
          </div>
        </div>

        {/* Funnel + Metrics */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversion Funnel */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Entonnoir de Conversion</h2>
            
            <div className="space-y-4">
              {funnelData.map((stage, index) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{stage.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900">{stage.count}</span>
                      <span className="text-sm text-gray-500">({stage.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  
                  <div className="w-full h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 flex items-center justify-end pr-4 text-white font-bold ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`}
                      style={{ width: `${stage.percentage}%` }}
                    >
                      {stage.percentage > 15 && `${stage.percentage.toFixed(0)}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Métriques Clés</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Taux de Conversion</span>
                    <span className="text-lg font-bold text-green-600">{analytics.conversionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${analytics.conversionRate}%` }} />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Valeur Moyenne</span>
                    <span className="text-lg font-bold text-gray-900">{analytics.avgDealValue}€</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cycle Moyen</span>
                    <span className="text-lg font-bold text-gray-900">{analytics.avgCycleDays}j</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-2">Objectif du Mois</h3>
              <div className="flex items-baseline gap-2 mb-3">
                <p className="text-4xl font-bold">{analytics.closes}</p>
                <span className="text-gray-400">/ 50 closes</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                  style={{ width: `${(analytics.closes / 50) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team Performance Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance par Membre</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Membre</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Appels</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">RDV</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Closes</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Conv. %</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">CA Généré</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamAnalytics.map((member, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-gray-900">{member.calls}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-gray-900">{member.rdv}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-gray-900">{member.closes || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        member.conversionRate >= 30 ? 'bg-green-100 text-green-700' :
                        member.conversionRate >= 25 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {member.conversionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-bold text-gray-900">
                        {member.ca > 0 ? `${member.ca.toLocaleString()}€` : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}