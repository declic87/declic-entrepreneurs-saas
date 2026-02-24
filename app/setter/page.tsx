"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Phone,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  Flame,
  Users,
  BarChart3,
} from "lucide-react";

interface SetterStats {
  totalLeads: number;
  qualifiedLeads: number;
  rdvBooked: number;
  conversionRate: number;
  todayCalls: number;
  weekTarget: number;
  weekProgress: number;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  activite: string;
  status: string;
  temperature: string;
  createdAt: string;
}

export default function DashboardSetter() {
  const [stats, setStats] = useState<SetterStats>({
    totalLeads: 0,
    qualifiedLeads: 0,
    rdvBooked: 0,
    conversionRate: 0,
    todayCalls: 0,
    weekTarget: 50,
    weekProgress: 0,
  });

  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      // 1. Récupérer l'ID du setter connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("authId", session.user.id)
        .single();

      if (!profile) return;
      setUserId(profile.id);

      // 2. Récupérer les leads du setter
      const { data: leads } = await supabase
        .from("leads")
        .select("*")
        .eq("setterId", profile.id)
        .order("createdAt", { ascending: false });

      if (!leads) return;
      setMyLeads(leads);

      // 3. Calculer les stats
      const qualified = leads.filter((l) => 
        ["QUALIFIE", "RDV_PLANIFIE", "RDV_EFFECTUE", "PROPOSITION", "NEGOCIE", "CLOSE"].includes(l.status)
      );
      
      const rdvBooked = leads.filter((l) => 
        ["RDV_PLANIFIE", "RDV_EFFECTUE", "PROPOSITION", "NEGOCIE", "CLOSE"].includes(l.status)
      );

      const conversionRate = leads.length > 0 
        ? (qualified.length / leads.length) * 100 
        : 0;

      // Leads créés cette semaine
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const weekLeads = leads.filter((l) => 
        new Date(l.createdAt) >= startOfWeek
      );

      // Leads créés aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLeads = leads.filter((l) => 
        new Date(l.createdAt) >= today
      );

      setStats({
        totalLeads: leads.length,
        qualifiedLeads: qualified.length,
        rdvBooked: rdvBooked.length,
        conversionRate: Math.round(conversionRate * 10) / 10,
        todayCalls: todayLeads.length,
        weekTarget: 50,
        weekProgress: weekLeads.length,
      });

    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  const weekProgressPercent = (stats.weekProgress / stats.weekTarget) * 100;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 uppercase italic flex items-center gap-3">
          <Phone className="text-blue-500" size={40} />
          Mon Dashboard Setter
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Tes performances et leads en cours
        </p>
      </div>

      {/* KPIs Personnels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Phone size={32} className="opacity-80" />
              <div className="text-right">
                <p className="text-xs opacity-80 uppercase tracking-wider">Appels Aujourd'hui</p>
                <p className="text-3xl font-black">{stats.todayCalls}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs opacity-80">
              <Clock size={14} />
              <span>Continue comme ça ! 🔥</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users size={32} className="text-purple-600" />
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Leads</p>
                <p className="text-3xl font-black text-gray-900">{stats.totalLeads}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <BarChart3 size={14} />
              <span>{stats.qualifiedLeads} qualifiés</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar size={32} className="text-green-600" />
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">RDV Bookés</p>
                <p className="text-3xl font-black text-gray-900">{stats.rdvBooked}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle size={14} />
              <span>Mission accomplie !</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target size={32} className="text-orange-600" />
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Taux Qualification</p>
                <p className="text-3xl font-black text-gray-900">{stats.conversionRate}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp size={14} />
              <span>En progression</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Objectif de la semaine */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase italic">
            <Award className="text-purple-600" size={28} />
            Objectif de la Semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-semibold">Progression</span>
              <span className="text-2xl font-black text-purple-600">
                {stats.weekProgress} / {stats.weekTarget} leads
              </span>
            </div>

            {/* Barre de progression */}
            <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(weekProgressPercent, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-white drop-shadow">
                  {Math.round(weekProgressPercent)}%
                </span>
              </div>
            </div>

            {weekProgressPercent >= 100 ? (
              <div className="bg-green-100 border border-green-200 p-4 rounded-lg text-center">
                <p className="text-green-800 font-bold text-lg">
                  🎉 Objectif atteint ! Bravo champion ! 🏆
                </p>
              </div>
            ) : (
              <p className="text-gray-600 text-sm text-center">
                Plus que <strong>{stats.weekTarget - stats.weekProgress} leads</strong> pour atteindre ton objectif !
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mes Leads en Cours */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-3 text-2xl font-black uppercase italic">
              <Flame className="text-orange-500" size={28} />
              Mes Leads en Cours
            </span>
            <span className="text-sm font-normal text-gray-500">
              {myLeads.length} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myLeads.slice(0, 10).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-lg">
                    {lead.firstName.charAt(0)}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </p>
                      {lead.temperature === "HOT" && (
                        <Flame size={16} className="text-red-500 fill-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {lead.activite} • {lead.phone}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      lead.status === "NOUVEAU"
                        ? "bg-blue-100 text-blue-700"
                        : lead.status === "CONTACTE"
                        ? "bg-cyan-100 text-cyan-700"
                        : lead.status === "QUALIFIE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {lead.status}
                  </span>

                  <Button
                    size="sm"
                    onClick={() => window.location.href = `/commercial/pipeline`}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Voir
                  </Button>
                </div>
              </div>
            ))}

            {myLeads.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>Aucun lead assigné pour le moment</p>
              </div>
            )}

            {myLeads.length > 10 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `/commercial/pipeline`}
                >
                  Voir tous mes leads ({myLeads.length})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}