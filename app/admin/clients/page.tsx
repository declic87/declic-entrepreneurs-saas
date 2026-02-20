'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, Plus, UserPlus, Mail, Phone, X } from 'lucide-react';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  status: string;
  pack?: string;
}

const PACK_OPTIONS = [
  { value: 'plateforme', label: 'Plateforme (97€/mois)', price: 97 },
  { value: 'createur', label: 'Formation Créateur (497€)', price: 497 },
  { value: 'agent_immo', label: 'Formation Agent Immo (897€)', price: 897 },
  { value: 'starter', label: 'Starter (3600€)', price: 3600 },
  { value: 'pro', label: 'Pro (4600€)', price: 4600 },
  { value: 'expert', label: 'Expert (6600€)', price: 6600 },
];

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newClient, setNewClient] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    pack: 'plateforme',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, created_at, status')
      .eq('role', 'CLIENT')
      .order('created_at', { ascending: false });

    if (usersData) {
      const userIds = usersData.map(u => u.id);
      const { data: accessData } = await supabase
        .from('client_access')
        .select('user_id, pack_type')
        .in('user_id', userIds);

      const clientsWithPack = usersData.map((user: any) => ({
        ...user,
        pack: accessData?.find((a: any) => a.user_id === user.id)?.pack_type || null,
      }));
      setClients(clientsWithPack);
    }
    setLoading(false);
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const packPrice = PACK_OPTIONS.find(p => p.value === newClient.pack)?.price || 97;
      
      const response = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newClient,
          pack_price: packPrice,
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      alert('✅ Client créé avec succès !');
      setShowAddForm(false);
      setNewClient({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        pack: 'plateforme',
      });
      loadClients();

    } catch (error: any) {
      console.error('Erreur:', error);
      alert('❌ Erreur : ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredClients = clients.filter(c => 
    c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: clients.length,
    actifs: clients.filter(c => c.status === 'active').length,
    attente: clients.filter(c => c.status === 'pending').length,
    starter: clients.filter(c => c.pack === 'starter').length,
    pro: clients.filter(c => c.pack === 'pro').length,
    expert: clients.filter(c => c.pack === 'expert').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gestion des Clients</h1>
            <p className="text-gray-600 mt-2">Vue d'ensemble de tous les clients</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
          >
            <Plus size={20} />
            Ajouter un client
          </button>
        </div>

        <div className="grid md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Actifs</p>
            <p className="text-3xl font-bold text-green-600">{stats.actifs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">En attente</p>
            <p className="text-3xl font-bold text-orange-600">{stats.attente}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Starter</p>
            <p className="text-3xl font-bold text-blue-600">{stats.starter}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Pro</p>
            <p className="text-3xl font-bold text-purple-600">{stats.pro}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Expert</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.expert}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Search className="text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-gray-900"
            />
          </div>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Ajouter un client</h2>
                    <p className="text-sm text-gray-600">Création manuelle</p>
                  </div>
                  <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddClient} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={newClient.first_name}
                        onChange={(e) => setNewClient({...newClient, first_name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                      <input
                        type="text"
                        required
                        value={newClient.last_name}
                        onChange={(e) => setNewClient({...newClient, last_name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={newClient.email}
                      onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newClient.password}
                      onChange={(e) => setNewClient({...newClient, password: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none"
                      placeholder="Min. 6 caractères"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pack *</label>
                    <select
                      value={newClient.pack}
                      onChange={(e) => setNewClient({...newClient, pack: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none"
                    >
                      {PACK_OPTIONS.map(pack => (
                        <option key={pack.value} value={pack.value}>{pack.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold disabled:opacity-50"
                    >
                      {saving ? 'Création...' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">CLIENT</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">CONTACT</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">PACK</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">STATUT</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">DATE</th>
                <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    Aucun client
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold">
                          {client.first_name?.[0]}{client.last_name?.[0]}
                        </div>
                        <p className="font-medium">{client.first_name} {client.last_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.email}</td>
                    <td className="px-6 py-4">
                      {client.pack ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          {client.pack}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {client.status === 'active' ? 'Actif' : 'Attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <a href="/admin/gestion-acces" className="text-orange-600 hover:text-orange-700 font-medium text-sm">
                        Gérer →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}