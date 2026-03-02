'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Mail, Phone, Calendar, Package, Building, 
  FileText, MessageSquare, User, MapPin, Video 
} from 'lucide-react';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  pack: string;
  pack_expires_at: string | null;
  rdv_total: number;
  rdv_consumed: number;
  rdv_remaining: number;
  address?: string;
  city?: string;
  postal_code?: string;
}

interface RDV {
  id: string;
  scheduled_at: string;
  status: string;
  expert_name: string;
  recording_url?: string;
}

export default function AdminClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [rdvs, setRdvs] = useState<RDV[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (clientId) {
      loadClientData();
      loadRDVs();
    }
  }, [clientId]);

  async function loadClientData() {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', clientId)
        .single();

      if (userData) {
        const { data: accessData } = await supabase
          .from('client_access')
          .select('pack_type, access_expires_at, rdv_total, rdv_consumed, rdv_remaining')
          .eq('user_id', clientId)
          .single();

        if (accessData) {
          setClient({
            ...userData,
            pack: accessData.pack_type,
            pack_expires_at: accessData.access_expires_at,
            rdv_total: accessData.rdv_total || 0,
            rdv_consumed: accessData.rdv_consumed || 0,
            rdv_remaining: accessData.rdv_remaining || 0,
          });
        } else {
          setClient(userData);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRDVs() {
    try {
      const { data } = await supabase
        .from('rdvs')
        .select(`
          id,
          scheduled_at,
          status,
          expert:expert_id (
            first_name,
            last_name
          )
        `)
        .eq('client_id', clientId)
        .order('scheduled_at', { ascending: false })
        .limit(5);

      if (data) {
        setRdvs(data.map((rdv: any) => ({
          id: rdv.id,
          scheduled_at: rdv.scheduled_at,
          status: rdv.status,
          expert_name: rdv.expert ? `${rdv.expert.first_name} ${rdv.expert.last_name}` : 'Non assigné',
        })));
      }
    } catch (error) {
      console.error('Erreur RDV:', error);
    }
  }

  const packLabels: Record<string, string> = {
    plateforme: 'Plateforme',
    createur: 'Formation Créateur',
    agent_immo: 'Formation Agent Immo',
    starter: 'Starter',
    pro: 'Pro',
    expert: 'Expert',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-slate-500">Client introuvable</p>
            <Button onClick={() => router.push('/admin/clients')} className="mt-4">
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <Button variant="ghost" onClick={() => router.push('/admin/clients')}>
        <ArrowLeft size={18} className="mr-2" />
        Retour à la liste
      </Button>

      {/* Carte principale */}
      <Card className="border-2 border-orange-200">
        <CardContent className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#123055] mb-2">
                {client.first_name} {client.last_name}
              </h1>
              {client.pack && (
                <span className="inline-block px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-bold">
                  <Package size={16} className="inline mr-2" />
                  {packLabels[client.pack] || client.pack}
                </span>
              )}
            </div>

            <Button
              onClick={() => router.push(`/admin/clients/${clientId}/messages`)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <MessageSquare size={18} className="mr-2" />
              Contacter
            </Button>
          </div>

          {/* Informations de contact */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h2 className="font-bold text-lg text-[#123055] mb-3">📧 Contact</h2>
              
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>

              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Téléphone</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Inscrit le</p>
                  <p className="font-medium">
                    {new Date(client.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* RDV Stats */}
            <div className="space-y-4">
              <h2 className="font-bold text-lg text-[#123055] mb-3">📞 Rendez-vous</h2>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{client.rdv_total || 0}</p>
                  <p className="text-xs text-blue-700">Total</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{client.rdv_consumed || 0}</p>
                  <p className="text-xs text-green-700">Effectués</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">{client.rdv_remaining || 0}</p>
                  <p className="text-xs text-orange-700">Restants</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pack expiration */}
          {client.pack_expires_at && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <p className="text-sm text-amber-800">
                  <strong>Expiration du pack :</strong>{' '}
                  {new Date(client.pack_expires_at).toLocaleDateString('fr-FR')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions rapides */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <Button
              onClick={() => router.push(`/admin/clients/${clientId}/dossier`)}
              variant="outline"
              className="h-auto py-4"
            >
              <FileText size={20} className="mr-2" />
              <div className="text-left">
                <p className="font-bold">Dossier</p>
                <p className="text-xs text-slate-500">Voir le dossier complet</p>
              </div>
            </Button>

            <Button
              onClick={() => router.push(`/admin/clients/${clientId}/rdv`)}
              variant="outline"
              className="h-auto py-4"
            >
              <Calendar size={20} className="mr-2" />
              <div className="text-left">
                <p className="font-bold">RDV</p>
                <p className="text-xs text-slate-500">Historique des rendez-vous</p>
              </div>
            </Button>

            <Button
              onClick={() => router.push(`/admin/gestion-acces`)}
              variant="outline"
              className="h-auto py-4"
            >
              <User size={20} className="mr-2" />
              <div className="text-left">
                <p className="font-bold">Accès</p>
                <p className="text-xs text-slate-500">Gérer les accès</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Derniers RDV */}
      {rdvs.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">📅 Derniers rendez-vous</h2>
            <div className="space-y-3">
              {rdvs.map(rdv => (
                <div key={rdv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-bold text-gray-900">
                      {new Date(rdv.scheduled_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">👤 {rdv.expert_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    rdv.status === 'completed' ? 'bg-green-100 text-green-700' :
                    rdv.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {rdv.status === 'completed' ? 'Effectué' :
                     rdv.status === 'cancelled' ? 'Annulé' : 'Prévu'}
                  </span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => router.push(`/admin/clients/${clientId}/rdv`)}
              variant="outline"
              className="w-full mt-4"
            >
              Voir tous les RDV
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}