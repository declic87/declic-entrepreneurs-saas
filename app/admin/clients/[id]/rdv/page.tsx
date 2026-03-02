'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';

export default function AdminClientRdvPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [rdvs, setRdvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadRdvs();
  }, [clientId]);

  async function loadRdvs() {
    const { data } = await supabase
      .from('rdvs')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false });

    setRdvs(data || []);
    setLoading(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <Button variant="ghost" onClick={() => router.push(`/admin/clients/${clientId}`)}>
        <ArrowLeft size={18} className="mr-2" />Retour
      </Button>

      <h1 className="text-3xl font-bold text-[#123055]">
        📅 Historique RDV
      </h1>

      {rdvs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucun rendez-vous</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rdvs.map(rdv => (
            <Card key={rdv.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className="text-blue-500" />
                      <p className="font-bold text-lg">
                        {new Date(rdv.scheduled_at).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-gray-400" />
                      <p>{new Date(rdv.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {rdv.expert_name && (
                      <div className="flex items-center gap-3">
                        <User size={20} className="text-gray-400" />
                        <p>{rdv.expert_name}</p>
                      </div>
                    )}
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                    rdv.status === 'completed' ? 'bg-green-100 text-green-700' :
                    rdv.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {rdv.status === 'completed' ? 'Effectué' :
                     rdv.status === 'cancelled' ? 'Annulé' : 'Prévu'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}