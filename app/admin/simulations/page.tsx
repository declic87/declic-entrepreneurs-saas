'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, DollarSign } from 'lucide-react';

interface Simulation {
  id: string;
  client_name: string;
  client_email: string;
  ca_annuel: number;
  gain_annuel: number;
  is_zfrr: boolean;
  is_afr: boolean;
  created_at: string;
  closer: {
    first_name: string;
    last_name: string;
  };
}

export default function SimulationsAdminPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadSimulations();
  }, []);

  async function loadSimulations() {
    const { data } = await supabase
      .from('closer_simulations')
      .select(`
        *,
        closer:users!closer_id(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    setSimulations(data || []);
    setLoading(false);
  }

  const stats = {
    total: simulations.length,
    gainTotal: simulations.reduce((sum, s) => sum + (s.gain_annuel || 0), 0),
    caTotal: simulations.reduce((sum, s) => sum + (s.ca_annuel || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">📊 Simulations Closers</h1>
        <p className="text-slate-600 mt-2">Toutes les simulations fiscales effectuées</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="text-blue-600" size={32} />
              <div>
                <p className="text-sm text-slate-600">Total simulations</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-green-600" size={32} />
              <div>
                <p className="text-sm text-slate-600">Gain total proposé</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.gainTotal.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="text-orange-600" size={32} />
              <div>
                <p className="text-sm text-slate-600">CA total analysé</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.caTotal.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières simulations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Closer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">CA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Gain</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Zones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {simulations.map((sim) => (
                  <tr key={sim.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(sim.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{sim.client_name}</div>
                      <div className="text-xs text-slate-500">{sim.client_email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {sim.closer.first_name} {sim.closer.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {sim.ca_annuel.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">
                      +{sim.gain_annuel.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-4 py-3">
                      {sim.is_zfrr && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mr-1">ZFRR</span>}
                      {sim.is_afr && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">AFR</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}