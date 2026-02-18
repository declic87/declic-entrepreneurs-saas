'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Phone, Search, Filter, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  temperature: string;
  last_contact_at: string | null;
  created_at: string;
}

export default function SetterLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTemperature, setFilterTemperature] = useState('all');
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
      loadLeads();
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

  async function loadLeads() {
    // TODO: Charger les leads assignés à ce setter depuis la table leads
    // Pour l'instant, données de démo
    setLeads([
      {
        id: '1',
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean@test.fr',
        phone: '06 12 34 56 78',
        status: 'NOUVEAU',
        temperature: 'HOT',
        last_contact_at: null,
        created_at: new Date(Date.now() - 600000).toISOString(),
      },
      {
        id: '2',
        first_name: 'Marie',
        last_name: 'Martin',
        email: 'marie@test.fr',
        phone: '06 98 76 54 32',
        status: 'CONTACTE',
        temperature: 'WARM',
        last_contact_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: '3',
        first_name: 'Pierre',
        last_name: 'Durand',
        email: 'pierre@test.fr',
        phone: '06 11 22 33 44',
        status: 'NOUVEAU',
        temperature: 'HOT',
        last_contact_at: null,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: '4',
        first_name: 'Sophie',
        last_name: 'Bernard',
        email: 'sophie@test.fr',
        phone: '06 55 66 77 88',
        status: 'QUALIFIE',
        temperature: 'WARM',
        last_contact_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 259200000).toISOString(),
      },
    ]);
    setLoading(false);
  }

  const filteredLeads = leads.filter(lead => {
    const matchSearch = searchTerm === '' || 
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    const matchTemp = filterTemperature === 'all' || lead.temperature === filterTemperature;
    return matchSearch && matchTemp;
  });

  const stats = {
    total: leads.length,
    hot: leads.filter(l => l.temperature === 'HOT').length,
    toCall: leads.filter(l => l.status === 'NOUVEAU' || l.status === 'RELANCE').length,
    qualified: leads.filter(l => l.status === 'QUALIFIE').length,
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
          <h1 className="text-4xl font-bold text-gray-900">Mes Leads</h1>
          <p className="text-gray-600 mt-2">{stats.total} leads à traiter</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Phone className="text-blue-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Total Leads</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <AlertCircle className="text-red-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">🔥 HOT</p>
            <p className="text-3xl font-bold text-red-600">{stats.hot}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Clock className="text-orange-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">À Appeler</p>
            <p className="text-3xl font-bold text-orange-600">{stats.toCall}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <TrendingUp className="text-green-500 mb-2" size={24} />
            <p className="text-sm text-gray-600">Qualifiés</p>
            <p className="text-3xl font-bold text-green-600">{stats.qualified}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher par nom ou téléphone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={filterTemperature}
              onChange={(e) => setFilterTemperature(e.target.value)}
            >
              <option value="all">Toutes températures</option>
              <option value="HOT">🔥 HOT</option>
              <option value="WARM">WARM</option>
              <option value="COLD">COLD</option>
            </select>
          </div>
        </div>

        {/* Liste des leads */}
        <div className="space-y-4">
          {filteredLeads.map((lead) => {
            const timeSinceCreated = Date.now() - new Date(lead.created_at).getTime();
            const minutesSinceCreated = Math.floor(timeSinceCreated / 60000);
            const isUrgent = minutesSinceCreated < 30 || lead.temperature === 'HOT';

            return (
              <div
                key={lead.id}
                className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
                  isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {lead.first_name.charAt(0)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </h3>
                        {lead.temperature === 'HOT' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                            🔥 HOT
                          </span>
                        )}
                        {isUrgent && minutesSinceCreated < 30 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
                            ⚡ URGENT
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {lead.phone}
                        </span>
                        <span>{lead.email}</span>
                        {lead.last_contact_at ? (
                          <span className="text-xs text-gray-400">
                            Dernier contact : {new Date(lead.last_contact_at).toLocaleDateString('fr-FR')}
                          </span>
                        ) : (
                          <span className="text-xs text-orange-600 font-semibold">
                            Jamais contacté
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      lead.status === 'NOUVEAU' ? 'bg-blue-100 text-blue-700' :
                      lead.status === 'CONTACTE' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {lead.status}
                    </span>
                    
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                      <Phone size={18} />
                      Appeler
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}