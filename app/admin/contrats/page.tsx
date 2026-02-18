'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FileText, Download, Eye, Filter, Search } from 'lucide-react';

interface Contract {
  id: string;
  contract_type: string;
  user_id?: string;
  team_member_id?: string;
  status: string;
  amount?: number;
  signed_at?: string;
  created_at: string;
  user_name?: string;
  yousign_signature_request_id?: string;
}

export default function AdminContratsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        users:user_id (first_name, last_name),
        team_members:team_member_id (
          users:user_id (first_name, last_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map(c => ({
        ...c,
        user_name: c.users 
          ? `${c.users.first_name} ${c.users.last_name}`
          : c.team_members?.users 
          ? `${c.team_members.users.first_name} ${c.team_members.users.last_name}`
          : 'N/A'
      }));
      setContracts(formatted);
    }
    setLoading(false);
  }

  const filteredContracts = contracts.filter(contract => {
    const matchType = filterType === 'all' || contract.contract_type === filterType;
    const matchStatus = filterStatus === 'all' || contract.status === filterStatus;
    const matchSearch = searchTerm === '' || 
      contract.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  const stats = {
    total: contracts.length,
    clients: contracts.filter(c => c.contract_type === 'client').length,
    closers: contracts.filter(c => c.contract_type === 'closer').length,
    setters: contracts.filter(c => c.contract_type === 'setter').length,
    experts: contracts.filter(c => c.contract_type === 'expert').length,
    signed: contracts.filter(c => c.status === 'signed').length,
  };

  const typeLabels: Record<string, { label: string; color: string }> = {
    client: { label: 'Client', color: 'bg-blue-100 text-blue-700' },
    closer: { label: 'Closer', color: 'bg-purple-100 text-purple-700' },
    setter: { label: 'Setter', color: 'bg-green-100 text-green-700' },
    expert: { label: 'Expert', color: 'bg-orange-100 text-orange-700' },
  };

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
          <h1 className="text-4xl font-bold text-gray-900">Tous les Contrats</h1>
          <p className="text-gray-600 mt-2">
            Gestion des contrats clients et prestataires
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Clients</p>
            <p className="text-2xl font-bold text-blue-600">{stats.clients}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Closers</p>
            <p className="text-2xl font-bold text-purple-600">{stats.closers}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Setters</p>
            <p className="text-2xl font-bold text-green-600">{stats.setters}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Experts</p>
            <p className="text-2xl font-bold text-orange-600">{stats.experts}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Signés</p>
            <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher par nom..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="client">Clients</option>
              <option value="closer">Closers</option>
              <option value="setter">Setters</option>
              <option value="expert">Experts</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="sent">Envoyé</option>
              <option value="signed">Signé</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date signature</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContracts.map((contract) => {
                const typeConfig = typeLabels[contract.contract_type] || typeLabels.client;
                
                return (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{contract.user_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        contract.status === 'signed' ? 'bg-green-100 text-green-700' :
                        contract.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {contract.amount ? (
                        <span className="font-bold text-gray-900">{contract.amount}€</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {contract.signed_at 
                        ? new Date(contract.signed_at).toLocaleDateString('fr-FR')
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye size={18} />
                        </button>
                        {contract.status === 'signed' && (
                          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Download size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}