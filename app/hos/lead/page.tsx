'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Filter, Users, Phone, Mail } from 'lucide-react';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  temperature: string;
  created_at: string;
}

export default function HOSLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setLeads(data);
    } else {
      // Données de démo si table vide
      setLeads([
        {
          id: '1',
          first_name: 'Jean',
          last_name: 'Dupont',
          email: 'jean@test.fr',
          phone: '06 12 34 56 78',
          status: 'NOUVEAU',
          temperature: 'HOT',
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setLoading(false);
  }

  const filteredLeads = leads.filter(lead => {
    const matchSearch = searchTerm === '' || 
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchSearch && matchStatus;
  });

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestion des Leads</h1>
            <p className="text-gray-600 mt-2">{leads.length} leads dans la base</p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            + Nouveau Lead
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un lead..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="NOUVEAU">Nouveau</option>
              <option value="CONTACTE">Contacté</option>
              <option value="QUALIFIE">Qualifié</option>
              <option value="RDV_PLANIFIE">RDV Planifié</option>
            </select>
          </div>
        </div>

        {/* Liste des leads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Température</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {lead.first_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} />
                        {lead.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        {lead.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      lead.temperature === 'HOT' ? 'bg-red-100 text-red-700' :
                      lead.temperature === 'WARM' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {lead.temperature === 'HOT' && '🔥'} {lead.temperature}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Voir
                      </button>
                    </div>
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