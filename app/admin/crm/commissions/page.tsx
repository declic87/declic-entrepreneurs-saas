'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  Filter,
  Download
} from 'lucide-react';

interface Commission {
  id: string;
  team_member_id: string;
  deal_type: string;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      console.error('Erreur chargement commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommissions = filterStatus === 'all' 
    ? commissions 
    : commissions.filter(c => c.status === filterStatus);

  const stats = {
    total: commissions.reduce((sum, c) => sum + c.commission_amount, 0),
    pending: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0),
    approved: commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commission_amount, 0),
    paid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0),
    count: commissions.length,
    countPending: commissions.filter(c => c.status === 'pending').length,
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-blue-100 text-blue-700 border-blue-200',
    paid: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    paid: 'Payé',
    cancelled: 'Annulé',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Commissions</h1>
          <p className="text-gray-600 mt-2">Suivi et validation des paiements</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          <Download size={20} />
          Exporter
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Total</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}€</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">En attente</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending.toLocaleString()}€</p>
          <p className="text-xs text-gray-500 mt-1">{stats.countPending} commission(s)</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle size={20} className="text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Approuvé</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.approved.toLocaleString()}€</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Payé</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.paid.toLocaleString()}€</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Filter size={20} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Total</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'paid'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === status
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Tous' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Type de Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Montant Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Taux
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCommissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-500">
                      {commission.id.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                      {commission.deal_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      {commission.amount.toLocaleString()}€
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-orange-600">
                      {commission.commission_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-green-600">
                      {commission.commission_amount.toLocaleString()}€
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[commission.status]}`}>
                      {statusLabels[commission.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(commission.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {commission.status === 'pending' && (
                        <>
                          <button className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold transition-colors">
                            Approuver
                          </button>
                          <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors">
                            Refuser
                          </button>
                        </>
                      )}
                      {commission.status === 'approved' && (
                        <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition-colors">
                          Marquer payé
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCommissions.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Aucune commission trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}