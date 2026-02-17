'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Award
} from 'lucide-react';

interface DashboardStats {
  totalLeads: number;
  leadsQualifies: number;
  rdvPris: number;
  signes: number;
  perdus: number;
  caTotal: number;
  commissionsTotal: number;
  tauxConversion: number;
  teamMembers: number;
}

interface TeamMember {
  name: string;
  role: string;
  deals: number;
  ca: number;
  commission: number;
}

export default function CRMDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    leadsQualifies: 0,
    rdvPris: 0,
    signes: 0,
    perdus: 0,
    caTotal: 0,
    commissionsTotal: 0,
    tauxConversion: 0,
    teamMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      // Charger les stats réelles depuis les tables
      const { data: teamData } = await supabase
        .from('team_members')
        .select('*')
        .eq('status', 'active');

      const { data: commissionsData } = await supabase
        .from('commissions')
        .select('amount, commission_amount');

      const { data: subsData } = await supabase
        .from('user_subscriptions')
        .select('price')
        .eq('is_active', true);

      const teamCount = teamData?.length || 0;
      const commissionsTotal = commissionsData?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const caTotal = subsData?.reduce((sum, s) => sum + Number(s.price), 0) || 0;

      // TODO: Implémenter les leads quand la table sera créée
      // Pour l'instant, stats de démonstration
      setStats({
        totalLeads: 127,
        leadsQualifies: 89,
        rdvPris: 56,
        signes: subsData?.length || 0,
        perdus: 15,
        caTotal,
        commissionsTotal,
        tauxConversion: subsData?.length ? ((subsData.length / 127) * 100) : 0,
        teamMembers: teamCount,
      });

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      setLoading(false);
    }
  };

  const kpis = [
    {
      title: 'Leads Total',
      value: stats.totalLeads,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Taux de Conversion',
      value: `${stats.tauxConversion.toFixed(1)}%`,
      icon: Target,
      color: 'bg-green-500',
      change: '+5.2%',
    },
    {
      title: 'CA Généré',
      value: `${stats.caTotal.toLocaleString()}€`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+18%',
    },
    {
      title: 'Commissions',
      value: `${stats.commissionsTotal.toLocaleString()}€`,
      icon: Award,
      color: 'bg-orange-500',
      change: '+22%',
    },
  ];

  const pipelineStages = [
    { 
      name: 'Nouveaux Leads', 
      count: stats.totalLeads - stats.leadsQualifies, 
      icon: Phone, 
      color: 'border-blue-500 bg-blue-50' 
    },
    { 
      name: 'Qualifiés', 
      count: stats.leadsQualifies, 
      icon: CheckCircle, 
      color: 'border-green-500 bg-green-50' 
    },
    { 
      name: 'RDV Pris', 
      count: stats.rdvPris, 
      icon: Calendar, 
      color: 'border-purple-500 bg-purple-50' 
    },
    { 
      name: 'Signés', 
      count: stats.signes, 
      icon: TrendingUp, 
      color: 'border-emerald-500 bg-emerald-50' 
    },
    { 
      name: 'Perdus', 
      count: stats.perdus, 
      icon: XCircle, 
      color: 'border-red-500 bg-red-50' 
    },
  ];

  const topPerformers: TeamMember[] = [
    { name: 'Sophie Martin', role: 'Closer', deals: 12, ca: 45600, commission: 9120 },
    { name: 'Thomas Dubois', role: 'Closer', deals: 9, ca: 38200, commission: 7640 },
    { name: 'Marie Lefebvre', role: 'Setter', deals: 24, ca: 15800, commission: 1580 },
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
            <h1 className="text-4xl font-bold text-gray-900">CRM Master</h1>
            <p className="text-gray-600 mt-2">Dashboard de performance commerciale</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
              + Nouveau Lead
            </button>
            <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Exporter Rapport
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${kpi.color} p-3 rounded-lg`}>
                  <kpi.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600">{kpi.change}</span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{kpi.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Pipeline Visual */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pipeline Commercial</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {pipelineStages.map((stage, index) => (
              <div
                key={index}
                className={`border-2 ${stage.color} rounded-lg p-6 text-center transition-all hover:scale-105 cursor-pointer`}
              >
                <stage.icon className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                <h3 className="font-semibold text-gray-900 mb-2">{stage.name}</h3>
                <p className="text-4xl font-bold text-gray-900">{stage.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Équipe Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Top Performers</h2>
            <a href="/admin/crm/equipe" className="text-orange-600 hover:text-orange-700 font-medium">
              Voir tout →
            </a>
          </div>
          <div className="space-y-4">
            {topPerformers.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>
                <div className="flex gap-8 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Deals</p>
                    <p className="text-xl font-bold text-gray-900">{member.deals}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CA</p>
                    <p className="text-xl font-bold text-gray-900">{member.ca.toLocaleString()}€</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Commission</p>
                    <p className="text-xl font-bold text-orange-600">{member.commission.toLocaleString()}€</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/admin/crm/pipeline"
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Target className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Pipeline Kanban</h3>
            <p className="text-blue-100">Gérer les deals en cours</p>
          </a>
          <a
            href="/admin/crm/equipe"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Users className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Gestion Équipe</h3>
            <p className="text-purple-100">Setters, Closers, Experts</p>
          </a>
          <a
            href="/admin/crm/commissions"
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
          >
            <DollarSign className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Commissions</h3>
            <p className="text-orange-100">Suivi et paiements</p>
          </a>
        </div>
      </div>
    </div>
  );
}