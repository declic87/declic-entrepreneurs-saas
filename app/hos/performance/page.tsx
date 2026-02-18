'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { TrendingUp, Users, Phone, Target, Award, DollarSign } from 'lucide-react';

interface Performance {
  setter_calls: number;
  setter_rdv: number;
  closer_calls: number;
  closer_closes: number;
  total_ca: number;
  avg_conversion: number;
}

export default function HOSPerformancePage() {
  const [performance, setPerformance] = useState<Performance>({
    setter_calls: 0,
    setter_rdv: 0,
    closer_calls: 0,
    closer_closes: 0,
    total_ca: 0,
    avg_conversion: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadPerformance();
  }, []);

  async function loadPerformance() {
    // TODO: Charger vraies stats depuis team_members et leads
    setPerformance({
      setter_calls: 512,
      setter_rdv: 146,
      closer_calls: 270,
      closer_closes: 28,
      total_ca: 127800,
      avg_conversion: 28.5,
    });
    setLoading(false);
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
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Performance Équipe</h1>
          <p className="text-gray-600 mt-2">Métriques et analytics détaillés</p>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <Phone className="mb-3" size={32} />
            <p className="text-blue-100 text-sm mb-1">Appels Setters</p>
            <p className="text-4xl font-bold">{performance.setter_calls}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <Target className="mb-3" size={32} />
            <p className="text-green-100 text-sm mb-1">RDV Bookés</p>
            <p className="text-4xl font-bold">{performance.setter_rdv}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <Award className="mb-3" size={32} />
            <p className="text-purple-100 text-sm mb-1">Closes</p>
            <p className="text-4xl font-bold">{performance.closer_closes}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
            <DollarSign className="mb-3" size={32} />
            <p className="text-orange-100 text-sm mb-1">CA Total</p>
            <p className="text-4xl font-bold">{(performance.total_ca / 1000).toFixed(0)}K€</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-xl shadow-lg">
            <Phone className="mb-3" size={32} />
            <p className="text-pink-100 text-sm mb-1">Appels Closers</p>
            <p className="text-4xl font-bold">{performance.closer_calls}</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
            <TrendingUp className="mb-3" size={32} />
            <p className="text-indigo-100 text-sm mb-1">Conv. Moyenne</p>
            <p className="text-4xl font-bold">{performance.avg_conversion}%</p>
          </div>
        </div>

        {/* Ratios */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Setters - Taux de Conversion</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Appels → RDV</span>
                  <span className="text-sm font-bold text-gray-900">
                    {((performance.setter_rdv / performance.setter_calls) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(performance.setter_rdv / performance.setter_calls) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Closers - Taux de Closing</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Appels → Closes</span>
                  <span className="text-sm font-bold text-gray-900">
                    {((performance.closer_closes / performance.closer_calls) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${(performance.closer_closes / performance.closer_calls) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphique placeholder */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Évolution Mensuelle</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-400">Graphique à implémenter (Chart.js ou Recharts)</p>
          </div>
        </div>
      </div>
    </div>
  );
}