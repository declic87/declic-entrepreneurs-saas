'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, Search, Plus, Mail, Phone, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Client {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  status?: string;
  pack?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erreur fetch clients:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name} ${client.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    pending: clients.filter(c => c.status === 'pending').length,
    starter: clients.filter(c => c.pack === 'STARTER').length,
    pro: clients.filter(c => c.pack === 'PRO').length,
    expert: clients.filter(c => c.pack === 'EXPERT').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Chargement des clients...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#123055]">Gestion des Clients</h1>
            <p className="text-slate-600 text-sm mt-1">Vue d'ensemble de tous les clients</p>
          </div>
        </div>

        <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
          <Plus size={18} className="mr-2" />
          Ajouter un client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-600 mb-1">Total</div>
          <div className="text-2xl font-bold text-[#123055]">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-600 mb-1">Actifs</div>
          <div className="text-2xl font-bold text-[#10B981]">{stats.active}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-600 mb-1">En attente</div>
          <div className="text-2xl font-bold text-[#F59E0B]">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-600 mb-1">Starter</div>
          <div className="text-2xl font-bold text-[#3B82F6]">{stats.starter}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-600 mb-1">Pro</div>
          <div className="text-2xl font-bold text-[#8B5CF6]">{stats.pro}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-600 mb-1">Expert</div>
          <div className="text-2xl font-bold text-[#F59E0B]">{stats.expert}</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <Input
          placeholder="Rechercher un client (nom, email)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase">Client</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase">Contact</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase">Pack</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase">Statut</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase">Date</th>
              <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center font-bold">
                        {client.first_name?.[0]}{client.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-[#123055]">
                          {client.first_name} {client.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail size={14} />
                        {client.email}
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={14} />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      client.pack === 'STARTER' 
                        ? 'bg-blue-100 text-blue-700'
                        : client.pack === 'PRO'
                        ? 'bg-purple-100 text-purple-700'
                        : client.pack === 'EXPERT'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {client.pack || 'Non défini'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {client.status === 'active' ? 'Actif' : 'En attente'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/clients/${client.id}`)}
                      className="text-xs"
                    >
                      Voir détails
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  {search ? 'Aucun client trouvé pour cette recherche' : 'Aucun client dans la base'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}