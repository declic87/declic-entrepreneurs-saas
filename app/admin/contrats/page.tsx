'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Upload, Download, Trash2, Plus, Loader2 } from 'lucide-react';

interface Contract {
  id: string;
  user_id: string;
  contract_type: string;
  status: string;
  amount: number;
  signed_at: string;
  file_url: string;
  file_name: string;
  created_at: string;
  is_manual_upload: boolean;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

export default function ContratsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form
  const [selectedUser, setSelectedUser] = useState('');
  const [contractType, setContractType] = useState('client');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('pending');
  const [file, setFile] = useState<File | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadContracts();
    loadUsers();
  }, []);

  async function loadContracts() {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          user:users(first_name, last_name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .in('role', ['CLIENT', 'CLOSER', 'SETTER', 'EXPERT', 'HOS'])
      .order('first_name');
    
    setUsers(data || []);
  }

  async function handleUpload() {
    if (!selectedUser || !file) {
      alert('Veuillez sélectionner un utilisateur et un fichier');
      return;
    }

    setUploading(true);

    try {
      // Upload fichier
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', selectedUser);
      formData.append('contractType', contractType);

      const uploadResponse = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.error) throw new Error(uploadData.error);

      // Créer le contrat
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert({
          user_id: selectedUser,
          contract_type: contractType,
          amount: amount ? parseFloat(amount) : null,
          status,
          file_url: uploadData.file_url,
          file_name: uploadData.file_name,
          is_manual_upload: true,
        })
        .select(`
          *,
          user:users(first_name, last_name, email, role)
        `)
        .single();

      if (contractError) throw contractError;

      alert('Contrat ajouté avec succès !');
      setShowForm(false);
      resetForm();
      loadContracts();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce contrat ?')) return;

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Contrat supprimé');
      loadContracts();
    } catch (error: any) {
      alert(error.message);
    }
  }

  function resetForm() {
    setSelectedUser('');
    setContractType('client');
    setAmount('');
    setStatus('pending');
    setFile(null);
  }

  const filtered = contracts.filter((c) => {
    const typeMatch = filterType === 'all' || c.contract_type === filterType;
    const statusMatch = filterStatus === 'all' || c.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const stats = {
    total: contracts.length,
    clients: contracts.filter((c) => c.contract_type === 'client' || c.contract_type === 'client_subscription').length,
    closers: contracts.filter((c) => c.contract_type === 'closer').length,
    setters: contracts.filter((c) => c.contract_type === 'setter').length,
    experts: contracts.filter((c) => c.contract_type === 'expert').length,
    signed: contracts.filter((c) => c.status === 'signed').length,
  };

  const TYPE_LABELS: Record<string, string> = {
    client: 'Client',
    client_subscription: 'Client',
    team_onboarding: 'Équipe',
    closer: 'Closer',
    setter: 'Setter',
    expert: 'Expert',
  };

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
    sent: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700' },
    pending_signature: { label: 'À signer', color: 'bg-orange-100 text-orange-700' },
    signed: { label: 'Signé', color: 'bg-green-100 text-green-700' },
    refused: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
    expired: { label: 'Expiré', color: 'bg-gray-100 text-gray-700' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tous les Contrats</h1>
          <p className="text-gray-600 mt-2">
            Gestion des contrats clients et prestataires
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2" size={16} />
          {showForm ? 'Annuler' : 'Ajouter un contrat'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-1">Clients</div>
            <div className="text-3xl font-bold text-blue-600">{stats.clients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-1">Closers</div>
            <div className="text-3xl font-bold text-purple-600">{stats.closers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-1">Setters</div>
            <div className="text-3xl font-bold text-cyan-600">{stats.setters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-1">Experts</div>
            <div className="text-3xl font-bold text-emerald-600">{stats.experts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-1">Signés</div>
            <div className="text-3xl font-bold text-green-600">{stats.signed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Ajouter un contrat manuel</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Utilisateur *</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de contrat *</Label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="closer">Closer</SelectItem>
                    <SelectItem value="setter">Setter</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Montant (€)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Statut *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="sent">Envoyé</SelectItem>
                    <SelectItem value="signed">Signé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Fichier PDF *</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedUser || !file}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Upload...
                </>
              ) : (
                <>
                  <Upload className="mr-2" size={16} />
                  Ajouter le contrat
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <div className="flex gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="client_subscription">Clients (abonnement)</SelectItem>
            <SelectItem value="team_onboarding">Équipe</SelectItem>
            <SelectItem value="closer">Closers</SelectItem>
            <SelectItem value="setter">Setters</SelectItem>
            <SelectItem value="expert">Experts</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="pending_signature">À signer</SelectItem>
            <SelectItem value="signed">Signé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date signature</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <FileText className="mx-auto mb-2 opacity-20" size={48} />
                  Aucun contrat
                </td>
              </tr>
            ) : (
              filtered.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {TYPE_LABELS[contract.contract_type] || contract.contract_type}
                    </span>
                    {contract.is_manual_upload && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                        Manuel
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {contract.user.first_name} {contract.user.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{contract.user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_LABELS[contract.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[contract.status]?.label || contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {contract.amount ? `${contract.amount.toFixed(2)} €` : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {contract.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(contract.file_url, '_blank')}
                        >
                          <Download size={14} />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(contract.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}