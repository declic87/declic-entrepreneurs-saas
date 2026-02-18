'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FileText, Download, Eye, Filter, Search, Users } from 'lucide-react';

interface Contract {
  id: string;
  contract_type: string;
  team_member_id: string;
  status: string;
  signed_at: string | null;
  created_at: string;
  member_name: string;
  member_role: string;
}

export default function HOSContratsEquipePage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filterRole, setFilterRole] = useState('all');
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
    // Charger tous les contrats prestataires (closer, setter, expert)
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        team_members!inner (
          role,
          users:user_id (first_name, last_name)
        )
      `)
      .in('contract_type', ['closer', 'setter', 'expert'])
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map(c => ({
        ...c,
        member_name: `${c.team_members.users.first_name} ${c.team_members.users.last_name}`,
        member_role: c.team_members.role,
      }));
      setContracts(formatted);
    }
    setLoading(false);
  }

  const filteredContracts = contracts.filter(contract => {
    const matchRole = filterRole === 'all' || contract.member_role === filterRole;
    const matchStatus = filterStatus === 'all' || contract.status === filterStatus;
    const matchSearch = searchTerm === '' || 
      contract.member_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchStatus && matchSearch;
  });

  const stats = {
    total: contracts.length,
    closers: contracts.filter(c => c.member_role === 'closer').length,
    setters: contracts.filter(c => c.member_role === 'setter').length,
    experts: contracts.filter(c => c.member_role === 'expert').length,
    signed: contracts.filter(c => c.status === 'signed').length,
  };

  const roleLabels: Record<string, { label: string; color: string }> = {
    closer: { label: 'Closer', color: 'bg-purple-100 text-purple-700' },
    setter: { label: 'Setter', color: 'bg-green-100 text-green-700' },
    expert: { label: 'Expert', color: 'bg-orange-100 text-orange-700' },
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
          <h1 className="text-4xl font-bold text-gray-900">Contrats Équipe</h1>
          <p className="text-gray-600 mt-2">
            Gestion des contrats prestataires (closers, setters, experts)
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">Tous les rôles</option>
              <option value="closer">Closers</option>
              <option value="setter">Setters</option>
              <option value="expert">Experts</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
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
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date signature</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContracts.map((contract) => {
                const roleConfig = roleLabels[contract.member_role] || roleLabels.closer;
                
                return (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleConfig.color}`}>
                        {roleConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {contract.member_name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900">{contract.member_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        contract.status === 'signed' ? 'bg-green-100 text-green-700' :
                        contract.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {contract.status === 'signed' ? 'Signé' :
                         contract.status === 'sent' ? 'Envoyé' : 'En attente'}
                      </span>
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

              {filteredContracts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="mx-auto text-gray-300 mb-4" size={64} />
                    <p className="text-gray-500 font-medium">Aucun contrat trouvé</p>
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