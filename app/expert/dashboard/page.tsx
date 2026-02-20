'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, CheckCircle2, Video, ArrowRight } from 'lucide-react';

interface Appointment {
  id: string;
  rdv_number: number;
  scheduled_at: string;
  status: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Stats {
  total_clients: number;
  rdv_completed: number;
  rdv_scheduled: number;
  rdv_this_month: number;
}

export default function ExpertDashboard() {
  const router = useRouter();
  const [todayRDV, setTodayRDV] = useState<Appointment[]>([]);
  const [upcomingRDV, setUpcomingRDV] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_clients: 0,
    rdv_completed: 0,
    rdv_scheduled: 0,
    rdv_this_month: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) return;

      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // RDV aujourd'hui
      const { data: todayData } = await supabase
        .from('expert_appointments')
        .select(`
          id,
          rdv_number,
          scheduled_at,
          status,
          client:users!expert_appointments_client_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('expert_id', userData.id)
        .gte('scheduled_at', today)
        .lt('scheduled_at', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString())
        .order('scheduled_at');

      if (todayData) setTodayRDV(todayData as any);

      // RDV à venir (7 prochains jours)
      const { data: upcomingData } = await supabase
        .from('expert_appointments')
        .select(`
          id,
          rdv_number,
          scheduled_at,
          status,
          client:users!expert_appointments_client_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('expert_id', userData.id)
        .gte('scheduled_at', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString())
        .lte('scheduled_at', new Date(new Date().setDate(new Date().getDate() + 7)).toISOString())
        .order('scheduled_at')
        .limit(5);

      if (upcomingData) setUpcomingRDV(upcomingData as any);

      // Stats
      const { count: totalClients } = await supabase
        .from('expert_appointments')
        .select('client_id', { count: 'exact', head: true })
        .eq('expert_id', userData.id);

      const { count: rdvCompleted } = await supabase
        .from('expert_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('expert_id', userData.id)
        .eq('status', 'completed');

      const { count: rdvScheduled } = await supabase
        .from('expert_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('expert_id', userData.id)
        .eq('status', 'scheduled');

      const { count: rdvThisMonth } = await supabase
        .from('expert_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('expert_id', userData.id)
        .gte('scheduled_at', startOfMonth);

      setStats({
        total_clients: totalClients || 0,
        rdv_completed: rdvCompleted || 0,
        rdv_scheduled: rdvScheduled || 0,
        rdv_this_month: rdvThisMonth || 0,
      });

    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#123055]">Dashboard Expert</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clients Total</p>
                <p className="text-3xl font-bold text-[#123055] mt-2">{stats.total_clients}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">RDV Terminés</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.rdv_completed}</p>
              </div>
              <CheckCircle2 className="text-green-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">RDV Programmés</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.rdv_scheduled}</p>
              </div>
              <Clock className="text-orange-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">RDV ce mois</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.rdv_this_month}</p>
              </div>
              <Calendar className="text-purple-500" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RDV Aujourd'hui */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#123055]">📅 RDV Aujourd'hui</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/expert/agenda')}
            >
              Voir agenda complet
            </Button>
          </div>

          {todayRDV.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun RDV aujourd'hui</p>
          ) : (
            <div className="space-y-4">
              {todayRDV.map((rdv) => (
                <div
                  key={rdv.id}
                  className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg hover:border-orange-400 transition-all cursor-pointer"
                  onClick={() => router.push(`/expert/clients/${(rdv.client as any).id}/rdv`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                      {rdv.client?.first_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {rdv.client?.first_name} {rdv.client?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(rdv.scheduled_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} • RDV #{rdv.rdv_number}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="text-orange-500" size={20} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RDV À Venir */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-[#123055] mb-6">🔜 Prochains RDV</h2>

          {upcomingRDV.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun RDV programmé</p>
          ) : (
            <div className="space-y-3">
              {upcomingRDV.map((rdv) => (
                <div
                  key={rdv.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="text-gray-400" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {rdv.client?.first_name} {rdv.client?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(rdv.scheduled_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                        })} à {new Date(rdv.scheduled_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">RDV #{rdv.rdv_number}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}