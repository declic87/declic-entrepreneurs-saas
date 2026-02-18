'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { TrendingUp, Phone, Calendar, Target, Award, Clock } from 'lucide-react';

interface SetterStats {
  callsToday: number;
  callsWeek: number;
  callsMonth: number;
  rdvBooked: number;
  conversionRate: number;
  avgCallDuration: string;
  bestDay: string;
  totalLeads: number;
}

export default function SetterStatsPage() {
  const [stats, setStats] = useState<SetterStats>({
    callsToday: 0,
    callsWeek: 0,
    callsMonth: 0,
    rdvBooked: 0,
    conversionRate: 0,
    avgCallDuration: '0:00',
    bestDay: 'Lundi',
    totalLeads: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    // TODO: Charger vraies stats depuis la base
    setStats({
      callsToday: 28,
      callsWeek: 156,
      callsMonth: 623,
      rdvBooked: 42,
      conversionRate: 26.9,
      avgCallDuration: '3:24',
      bestDay: 'Mardi',
      totalLeads: 156,
    });
    setLoading(false);
  }

  const weeklyData = [
    { day: 'Lun', calls: 32, rdv: 8 },
    { day: 'Mar', calls: 38, rdv: 11 },
    { day: 'Mer', calls: 29, rdv: 7 },
    { day: 'Jeu', calls: 35, rdv: 9 },
    { day: 'Ven', calls: 22, rdv: 7 },
  ];

  const maxCalls = Math.max(...weeklyData.map(d => d.calls));

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
          <h1 className="text-4xl font-bold text-gray-900">Mes Performances</h1>
          <p className="text-gray-600 mt-2">Analyse détaillée de votre activité</p>
        </div>

        {/* KPIs Principaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <Phone className="mb-3" size={28} />
            <p className="text-blue-100 text-sm mb-1">Appels Aujourd'hui</p>
            <p className="text-4xl font-bold">{stats.callsToday}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <Calendar className="mb-3" size={28} />
            <p className="text-green-100 text-sm mb-1">RDV Bookés</p>
            <p className="text-4xl font-bold">{stats.rdvBooked}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <Target className="mb-3" size={28} />
            <p className="text-purple-100 text-sm mb-1">Taux Conversion</p>
            <p className="text-4xl font-bold">{stats.conversionRate}%</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
            <Clock className="mb-3" size={28} />
            <p className="text-orange-100 text-sm mb-1">Temps Moyen</p>
            <p className="text-4xl font-bold">{stats.avgCallDuration}</p>
          </div>
        </div>

        {/* Stats Détaillées */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Activité Période</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Cette semaine</span>
                <span className="text-2xl font-bold text-gray-900">{stats.callsWeek} appels</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Ce mois</span>
                <span className="text-2xl font-bold text-gray-900">{stats.callsMonth} appels</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Leads actifs</span>
                <span className="text-2xl font-bold text-gray-900">{stats.totalLeads}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Record & Objectifs</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Meilleur jour</span>
                <span className="text-2xl font-bold text-blue-600">{stats.bestDay}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Objectif journalier</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">{stats.callsToday}/40</span>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${(stats.callsToday / 40) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphique de la semaine */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Activité de la Semaine</h3>
          
          <div className="flex items-end justify-between gap-4 h-64">
            {weeklyData.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1">
                  {/* Barre Appels */}
                  <div
                    className="w-full bg-blue-500 rounded-t-lg flex items-end justify-center text-white font-bold text-sm pb-2"
                    style={{ height: `${(day.calls / maxCalls) * 200}px` }}
                  >
                    {day.calls}
                  </div>
                  {/* Barre RDV */}
                  <div className="w-full bg-green-500 rounded-lg h-12 flex items-center justify-center text-white font-bold text-xs">
                    {day.rdv} RDV
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600">{day.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Appels</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">RDV Bookés</span>
            </div>
          </div>
        </div>

        {/* Progression mensuelle */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">🎯 Objectif du Mois</h3>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-5xl font-bold">{stats.rdvBooked * 2.5}</span>
            <span className="text-gray-400 text-lg">/ 200 RDV</span>
          </div>
          <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600"
              style={{ width: `${(stats.rdvBooked * 2.5 / 200) * 100}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {((stats.rdvBooked * 2.5 / 200) * 100).toFixed(1)}% de l'objectif atteint
          </p>
        </div>
      </div>
    </div>
  );
}