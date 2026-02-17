'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Phone,
  Edit,
  Trash2,
  Award,
  TrendingUp
} from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  auth_id: string;
  role: string;
  status: string;
  commission_rate: number;
  total_deals: number;
  total_revenue: number;
  contract_signed: boolean;
  created_at: string;
}

export default function EquipePage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Erreur chargement équipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchSearch = searchTerm === '' || 
      member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || member.role === filterRole;
    const matchStatus = filterStatus === 'all' || member.status === filterStatus;
    
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter(m => m.status === 'active').length,
    setters: teamMembers.filter(m => m.role === 'setter').length,
    closers: teamMembers.filter(m => m.role === 'closer').length,
    experts: teamMembers.filter(m => m.role === 'expert').length,
    totalRevenue: teamMembers.reduce((sum, m) => sum + Number(m.total_revenue || 0), 0),
  };

  const roleColors: Record<string, string> = {
    setter: 'bg-blue-100 text-blue-700',
    closer: 'bg-purple-100 text-purple-700',
    expert: 'bg-green-100 text-green-700',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
    terminated: 'bg-gray-100 text-gray-700',
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion de l'Équipe</h1>
          <p className="text-gray-600 mt-2">Gérer les setters, closers et experts</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          <Plus size={20} />
          Ajouter un membre
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Actifs</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Setters</p>
          <p className="text-2xl font-bold text-blue-600">{stats.setters}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Closers</p>
          <p className="text-2xl font-bold text-purple-600">{stats.closers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Experts</p>
          <p className="text-2xl font-bold text-green-600">{stats.experts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">CA Total</p>
          <p className="text-xl font-bold text-orange-600">{stats.totalRevenue.toLocaleString()}€</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Tous les rôles</option>
            <option value="setter">Setter</option>
            <option value="closer">Closer</option>
            <option value="expert">Expert</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="pending">En attente</option>
            <option value="suspended">Suspendu</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Deals
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  CA Généré
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.role.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.role}</p>
                        <p className="text-sm text-gray-500">{member.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleColors[member.role] || 'bg-gray-100 text-gray-700'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[member.status] || 'bg-gray-100 text-gray-700'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-orange-500" />
                      <span className="font-semibold text-gray-900">{member.commission_rate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-green-500" />
                      <span className="font-semibold text-gray-900">{member.total_deals}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{Number(member.total_revenue || 0).toLocaleString()}€</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Aucun membre trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}