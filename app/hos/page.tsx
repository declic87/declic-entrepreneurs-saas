"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  Target,
  DollarSign,
  Phone,
  CheckCircle,
  Calendar,
  Award,
  Flame,
  BarChart3,
} from "lucide-react";

interface Stats {
  totalLeads: number;
  totalCA: number;
  conversionRate: number;
  avgTicket: number;
  closedDeals: number;
  activeClosers: number;
  activeSetters: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  leadsCount: number;
  closedCount: number;
  ca: number;
  conversionRate: number;
}

export default function DashboardHOS() {
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    totalCA: 0,
    conversionRate: 0,
    avgTicket: 0,
    closedDeals: 0,
    activeClosers: 0,
    activeSetters: 0,
  });

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // 1. Récupérer tous les leads
      const { data: leads } = await supabase
        .from("leads")
        .select("*");

      if (!leads) return;

      // 2. Calculer les stats globales
      const closedLeads = leads.filter((l) => l.status === "CLOSE");
      const totalCA = closedLeads.reduce((acc, l) => acc + (l.ca || 0), 0);
      const conversionRate = leads.length > 0 
        ? (closedLeads.length / leads.length) * 100 
        : 0;
      const avgTicket = closedLeads.length > 0 
        ? totalCA / closedLeads.length 
        : 0;

      // 3. Compter les membres actifs
      const { data: users } = await supabase
        .from("users")
        .select("id, first_name, last_name, role")
        .in("role", ["CLOSER", "SETTER"]);

      const closers = users?.filter((u) => u.role === "CLOSER") || [];
      const setters = users?.filter((u) => u.role === "SETTER") || [];

      setStats({
        totalLeads: leads.length,
        totalCA,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgTicket: Math.round(avgTicket),
        closedDeals: closedLeads.length,
        activeClosers: closers.length,
        activeSetters: setters.length,
      });

      // 4. Stats par membre d'équipe
      const teamStats: TeamMember[] = [];

      for (const user of users || []) {
        const userLeads = leads.filter((l) => 
          l.closerId === user.id || l.setterId === user.id
        );
        
        const userClosed = userLeads.filter((l) => l.status === "CLOSE");
        const userCA = userClosed.reduce((acc, l) => acc + (l.ca || 0), 0);
        const userConversion = userLeads.length > 0
          ? (userClosed.length / userLeads.length) * 100
          : 0;

        teamStats.push({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          leadsCount: userLeads.length,
          closedCount: userClosed.length,
          ca: userCA,
          conversionRate: Math.round(userConversion * 10) / 10,
        });
      }

      // Trier par CA décroissant
      teamStats.sort((a, b) => b.ca - a.ca);
      setTeam(teamStats);

    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 uppercase italic flex items-center gap-3">
          <Award className="text-orange-500" size={40} />
          Dashboard HOS
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Vue d'ensemble des performances commerciales
        </p>
      </div>

      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign size={32} className="opacity-80" />
              <div className="text-right">
                <p className="text-xs opacity-80 uppercase tracking-wider">CA Total</p>
                <p className="text-3xl font-black">{stats.totalCA.toLocaleString()}€</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs opacity-80">
              <TrendingUp size={14} />
              <span>{stats.closedDeals} deals fermés</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target size={32} className="text-blue-600" />
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Taux Conversion</p>
                <p className="text-3xl font-black text-gray-900">{stats.conversionRate}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle size={14} />
              <span>{stats.closedDeals}/{stats.totalLeads} leads</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 size={32} className="text-green-600" />
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Ticket Moyen</p>
                <p className="text-3xl font-black text-gray-900">{stats.avgTicket.toLocaleString()}€</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <DollarSign size={14} />
              <span>Par deal fermé</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users size={32} className="text-purple-600" />
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Équipe Active</p>
                <p className="text-3xl font-black text-gray-900">
                  {stats.activeClosers + stats.activeSetters}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users size={14} />
              <span>{stats.activeClosers} closers • {stats.activeSetters} setters</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classement équipe */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase italic">
            <Flame className="text-orange-500" size={28} />
            Classement Équipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {team.map((member, index) => (
              <div
                key={member.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-200"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Rang */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg"
                        : index === 1
                        ? "bg-gray-300 text-gray-700"
                        : index === 2
                        ? "bg-orange-200 text-orange-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-900 uppercase italic">
                        {member.name}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          member.role === "CLOSER"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {member.leadsCount} leads
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle size={12} />
                        {member.closedCount} fermés
                      </span>
                      <span className="flex items-center gap-1">
                        <Target size={12} />
                        {member.conversionRate}%
                      </span>
                    </div>
                  </div>

                  {/* CA */}
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-600 italic">
                      {member.ca.toLocaleString()}€
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                      Chiffre d'affaires
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {team.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>Aucune donnée disponible</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}