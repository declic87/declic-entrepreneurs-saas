'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, FileText, Calendar, CheckCircle } from 'lucide-react';

export default function AdminClientDossierPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [rdvHistory, setRdvHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', clientId)
        .single();

      if (userData) setClient(userData);

      const { data: rdvData } = await supabase
        .from('rdvs')
        .select('*')
        .eq('client_id', clientId)
        .order('scheduled_at', { ascending: false });

      if (rdvData) setRdvHistory(rdvData);

      const { data: notesData } = await supabase
        .from('client_notes')
        .select('notes')
        .eq('client_id', clientId)
        .single();

      if (notesData) setNotes(notesData.notes || '');
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveNotes() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('client_notes')
        .upsert({
          client_id: clientId,
          notes: notes,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert('✅ Notes sauvegardées');
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <Button variant="ghost" onClick={() => router.push(`/admin/clients/${clientId}`)}>
        <ArrowLeft size={18} className="mr-2" />Retour
      </Button>

      <h1 className="text-3xl font-bold text-[#123055]">
        📋 Dossier {client?.first_name} {client?.last_name}
      </h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Notes de suivi</h2>
            <Button onClick={saveNotes} disabled={saving} className="bg-orange-500">
              <Save size={18} className="mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-64 p-4 border rounded-lg"
            placeholder="Notes sur le client..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Historique RDV</h2>
          {rdvHistory.length === 0 ? (
            <p className="text-gray-500">Aucun RDV</p>
          ) : (
            <div className="space-y-3">
              {rdvHistory.map(rdv => (
                <div key={rdv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-blue-500" />
                    <div>
                      <p className="font-bold">{new Date(rdv.scheduled_at).toLocaleDateString('fr-FR')}</p>
                      <p className="text-sm text-gray-500">{rdv.expert_name}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    rdv.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {rdv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}