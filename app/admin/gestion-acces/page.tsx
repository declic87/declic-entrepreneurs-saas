'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search, UserCheck, Calendar, Award, Check, X, Edit2, Save } from 'lucide-react';

interface ClientAccess {
  id: string;
  user_id: string;
  pack_type: string;
  pack_price: number;
  has_tutos: boolean;
  has_coaching: boolean;
  has_ateliers: boolean;
  has_partenaire: boolean;
  has_simulateur: boolean;
  has_formation_createur: boolean;
  has_formation_agent_immo: boolean;
  rdv_total: number;
  rdv_consumed: number;
  rdv_remaining: number;
  has_rdv_vip: boolean;
  access_expires_at: string | null;
  is_active: boolean;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const PACK_LABELS: Record<string, { label: string; price: number; color: string }> = {
  plateforme: { label: 'Plateforme', price: 97, color: 'bg-blue-100 text-blue-700' },
  createur: { label: 'Formation Créateur', price: 497, color: 'bg-purple-100 text-purple-700' },
  agent_immo: { label: 'Formation Agent Immo', price: 897, color: 'bg-green-100 text-green-700' },
  starter: { label: 'Starter', price: 3600, color: 'bg-orange-100 text-orange-700' },
  pro: { label: 'Pro', price: 4600, color: 'bg-red-100 text-red-700' },
  expert: { label: 'Expert', price: 6600, color: 'bg-yellow-100 text-yellow-700' },
};

export default function AdminGestionAccesPage() {
  const [clients, setClients] = useState<ClientAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    const { data, error } = await supabase
      .from('client_access')
      .select(`
        *,
        user:user_id (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setClients(data as any);
    }
    setLoading(false);
  }

  async function updateAccess(access: ClientAccess) {
    setSaving(true);
    const { error } = await supabase
      .from('client_access')
      .update({
        pack_type: access.pack_type,
        pack_price: access.pack_price,
        has_tutos: access.has_tutos,
        has_coaching: access.has_coaching,
        has_ateliers: access.has_ateliers,
        has_partenaire: access.has_partenaire,
        has_simulateur: access.has_simulateur,
        has_formation_createur: access.has_formation_createur,
        has_formation_agent_immo: access.has_formation_agent_immo,
        rdv_total: access.rdv_total,
        has_rdv_vip: access.has_rdv_vip,
        is_active: access.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', access.id);

    if (!error) {
      alert('✅ Accès mis à jour !');
      setEditingId(null);
      loadClients();
    } else {
      alert('❌ Erreur : ' + error.message);
    }
    setSaving(false);
  }

  function updateLocal(id: string, field: string, value: any) {
    setClients(prev => 
      prev.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  }

  const filteredClients = clients.filter(c => 
    c.user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-4xl font-bold text-gray-900">Gestion des Accès Clients</h1>
          <p className="text-gray-600 mt-2">Modifier les contenus et durées d'accès par client</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCheck className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {clients.filter(c => c.is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Expirés</p>
                <p className="text-2xl font-bold text-orange-600">
                  {clients.filter(c => !c.is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pack Expert</p>
                <p className="text-2xl font-bold text-purple-600">
                  {clients.filter(c => c.pack_type === 'expert').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
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

        {/* Liste clients */}
        <div className="space-y-4">
          {filteredClients.map((client) => {
            const isEditing = editingId === client.id;
            const packInfo = PACK_LABELS[client.pack_type] || PACK_LABELS.plateforme;

            return (
              <div key={client.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {client.user.first_name} {client.user.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{client.user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${packInfo.color}`}>
                      {packInfo.label} - {client.pack_price}€
                    </span>
                    {isEditing ? (
                      <button
                        onClick={() => updateAccess(client)}
                        disabled={saving}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                      >
                        <Save size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingId(client.id)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    {/* Pack */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pack</label>
                      <select
                        value={client.pack_type}
                        onChange={(e) => updateLocal(client.id, 'pack_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {Object.entries(PACK_LABELS).map(([key, val]) => (
                          <option key={key} value={key}>{val.label} - {val.price}€</option>
                        ))}
                      </select>
                    </div>

                    {/* Accès de base */}
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={client.has_tutos}
                          onChange={(e) => updateLocal(client.id, 'has_tutos', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Tutos</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={client.has_coaching}
                          onChange={(e) => updateLocal(client.id, 'has_coaching', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Coaching</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={client.has_ateliers}
                          onChange={(e) => updateLocal(client.id, 'has_ateliers', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Ateliers</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={client.has_partenaire}
                          onChange={(e) => updateLocal(client.id, 'has_partenaire', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Partenaire</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={client.has_simulateur}
                          onChange={(e) => updateLocal(client.id, 'has_simulateur', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Simulateur</span>
                      </label>
                    </div>

                    {/* Formations */}
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={client.has_formation_createur}
                          onChange={(e) => updateLocal(client.id, 'has_formation_createur', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Formation Créateur</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={client.has_formation_agent_immo}
                          onChange={(e) => updateLocal(client.id, 'has_formation_agent_immo', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Formation Agent Immo</span>
                      </label>
                    </div>

                    {/* RDV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">RDV Total</label>
                        <input
                          type="number"
                          value={client.rdv_total}
                          onChange={(e) => updateLocal(client.id, 'rdv_total', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <label className="flex items-center gap-2 mt-7">
                        <input
                          type="checkbox"
                          checked={client.has_rdv_vip}
                          onChange={(e) => updateLocal(client.id, 'has_rdv_vip', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">RDV VIP (Fondateur)</span>
                      </label>
                    </div>

                    {/* Statut */}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={client.is_active}
                        onChange={(e) => updateLocal(client.id, 'is_active', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Accès actif</span>
                    </label>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 font-medium mb-2">Accès de base</p>
                      <div className="space-y-1">
                        <p className={client.has_tutos ? 'text-green-600' : 'text-gray-400'}>
                          {client.has_tutos ? '✓' : '✗'} Tutos
                        </p>
                        <p className={client.has_coaching ? 'text-green-600' : 'text-gray-400'}>
                          {client.has_coaching ? '✓' : '✗'} Coaching
                        </p>
                        <p className={client.has_ateliers ? 'text-green-600' : 'text-gray-400'}>
                          {client.has_ateliers ? '✓' : '✗'} Ateliers
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium mb-2">Formations</p>
                      <div className="space-y-1">
                        <p className={client.has_formation_createur ? 'text-green-600' : 'text-gray-400'}>
                          {client.has_formation_createur ? '✓' : '✗'} Formation Créateur
                        </p>
                        <p className={client.has_formation_agent_immo ? 'text-green-600' : 'text-gray-400'}>
                          {client.has_formation_agent_immo ? '✓' : '✗'} Formation Agent Immo
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium mb-2">RDV Expert</p>
                      <div className="space-y-1">
                        <p className="text-gray-900 font-bold">
                          {client.rdv_remaining} / {client.rdv_total} restants
                        </p>
                        {client.has_rdv_vip && (
                          <p className="text-yellow-600 font-medium">⭐ RDV VIP inclus</p>
                        )}
                        {client.access_expires_at && (
                          <p className="text-gray-600 text-xs">
                            Expire : {new Date(client.access_expires_at).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}