'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    leads: 0,
    experts: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchStats() {
      try {
        // Vérifier auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Compter clients
        const { count: clientsCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });

        // Compter leads
        const { count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true });

        // Compter experts
        const { count: expertsCount } = await supabase
          .from('experts')
          .select('*', { count: 'exact', head: true });

        // Calculer revenus (si table payments existe)
        const { data: payments } = await supabase
          .from('payments')
          .select('amount');

        const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        setStats({
          clients: clientsCount || 0,
          leads: leadsCount || 0,
          experts: expertsCount || 0,
          revenue: totalRevenue
        });

        setLoading(false);
      } catch (error) {
        console.error('Erreur fetch stats:', error);
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#123055] mb-8">Dashboard Admin</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-600 mb-2">Clients</div>
          <div className="text-3xl font-bold text-[#123055]">{stats.clients}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-600 mb-2">Leads</div>
          <div className="text-3xl font-bold text-[#F59E0B]">{stats.leads}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-600 mb-2">Experts</div>
          <div className="text-3xl font-bold text-[#123055]">{stats.experts}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-600 mb-2">Revenus</div>
          <div className="text-3xl font-bold text-[#10B981]">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.revenue)}
          </div>
        </div>
      </div>

      {/* Navigation rapide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => router.push('/admin/clients')}
          className="bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-[#F59E0B] transition-all"
        >
          <div className="text-lg font-semibold text-[#123055] mb-2">Clients</div>
          <div className="text-sm text-slate-600">Gérer les clients</div>
        </button>

        <button
          onClick={() => router.push('/admin/equipe')}
          className="bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-[#F59E0B] transition-all"
        >
          <div className="text-lg font-semibold text-[#123055] mb-2">Équipe</div>
          <div className="text-sm text-slate-600">Gérer l'équipe</div>
        </button>

        <button
          onClick={() => router.push('/admin/paiements')}
          className="bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-[#F59E0B] transition-all"
        >
          <div className="text-lg font-semibold text-[#123055] mb-2">Paiements</div>
          <div className="text-sm text-slate-600">Voir les transactions</div>
        </button>
      </div>
    </div>
  );
}