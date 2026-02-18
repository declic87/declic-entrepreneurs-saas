'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { DollarSign, TrendingUp, Clock, CheckCircle, Calendar } from 'lucide-react';

interface Commission {
  id: string;
  deal_type: string;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export default function CloserCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadCommissions();
    }
  }, [userId]);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (profile) {
        setUserId(profile.id);
      }
    }
  }

  async function loadCommissions() {
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (teamMember) {
      const { data } = await supabase
        .from('commissions')
        .select('*')
        .eq('team_member_id', teamMember.id)
        .order('created_at', { ascending: false });

      setCommissions(data || []);
    }
    setLoading(false);
  }

  const stats = {
    total: commissions.reduce((sum, c) => sum + c.commission_amount, 0),
    pending: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0),
    approved: commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commission_amount, 0),
    paid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0),
    count: commissions.length,
  };

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
          <h1 className="text-4xl font-bold text-gray-900">Mes Commissions</h1>
          <p className="text-gray-600 mt-2">10% HT sur tous les encaissements</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <DollarSign className="mb-3" size={28} />
            <p className="text-purple-100 text-sm mb-1">Total Commissions</p>
            <p className="text-4xl font-bold">{stats.total.toLocaleString()}€</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Clock className="text-orange-500 mb-3" size={24} />
            <p className="text-sm text-gray-600">En attente</p>
            <p className="text-3xl font-bold text-orange-600">{stats.pending.toLocaleString()}€</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <CheckCircle className="text-green-500 mb-3" size={24} />
            <p className="text-sm text-gray-600">Approuvé</p>
            <p className="text-3xl font-bold text-green-600">{stats.approved.toLocaleString()}€</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <TrendingUp className="text-blue-500 mb-3" size={24} />
            <p className="text-sm text-gray-600">Payé</p>
            <p className="text-3xl font-bold text-blue-600">{stats.paid.toLocaleString()}€</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Historique des commissions</h2>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Montant HT</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Taux</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Commission</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(commission.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{commission.deal_type}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-gray-900">
                      {commission.amount.toLocaleString()}€
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-purple-600 font-bold">{commission.commission_rate}%</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-bold text-green-600">
                      {commission.commission_amount.toLocaleString()}€
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      commission.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                      commission.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {commission.status === 'paid' ? 'Payé' :
                       commission.status === 'approved' ? 'Approuvé' :
                       'En attente'}
                    </span>
                  </td>
                </tr>
              ))}

              {commissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
                    <p className="text-gray-500 font-medium">Aucune commission pour le moment</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Vos commissions apparaîtront ici une fois les deals encaissés
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}