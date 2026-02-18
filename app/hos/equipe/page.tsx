'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Users, TrendingUp, Phone, Award, Search } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  total_deals: number;
  total_revenue: number;
  commission_rate: number;
  created_at: string;
}

export default function HOSEquipePage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setTeamMembers(data);
    }
    setLoading(false);
  }

  const filteredMembers = teamMembers.filter(member => {
    const matchRole = filterRole === 'all' || member.role === filterRole;
    return matchRole;
  });

  const stats = {
    total: teamMembers.length,
    setters: teamMembers.filter(m => m.role === 'setter').length,
    closers: teamMembers.filter(m => m.role === 'closer').length,
    active: teamMembers.filter(m => m.status === 'active').length,
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
          <h1 className="text-4xl font-bold text-gray-900">Mon Équipe</h1>
          <p className="text-gray-600 mt-2">Gestion des setters et closers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Users className="text-gray-400 mb-2" size={24} />
            <p className="text-sm text-gray-600">Total Équipe</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Phone className="text-blue-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Setters</p>
            <p className="text-3xl font-bold text-blue-600">{stats.setters}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Award className="text-purple-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Closers</p>
            <p className="text-3xl font-bold text-purple-600">{stats.closers}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <TrendingUp className="text-green-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Actifs</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
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
              <option value="setter">Setters</option>
              <option value="closer">Closers</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Membre</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Deals</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">CA Généré</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.role.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">{member.user_id.slice(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      member.role === 'setter' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-gray-900">{member.total_deals}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-gray-900">{Number(member.total_revenue || 0).toLocaleString()}€</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-orange-600 font-bold">{member.commission_rate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}