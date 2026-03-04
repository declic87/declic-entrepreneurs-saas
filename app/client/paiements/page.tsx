'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { OnboardingVideo } from '@/components/OnboardingVideo';
import { CreditCard, Download, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Payment {
  id: string;
  amount: number;
  pack_type: string;
  status: string;
  createdAt: string;
}

interface ClientAccess {
  pack_type: string;
  pack_price: number;
  access_expires_at: string | null;
}

interface RefundRequest {
  id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
}

const PACK_LABELS: Record<string, string> = {
  plateforme: 'Pack Plateforme',
  createur: 'Formation Créateur',
  agent_immo: 'Formation Agent Immobilier',
  starter: 'Pack Starter',
  pro: 'Pack Pro',
  expert: 'Pack Expert',
};

const PACK_PRICES: Record<string, number> = {
  plateforme: 97,
  createur: 497,
  agent_immo: 897,
  starter: 3600,
  pro: 4600,
  expert: 6600,
};

export default function PaiementsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [access, setAccess] = useState<ClientAccess | null>(null);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userData) {
      // Charger l'accès client
      const { data: accessData } = await supabase
        .from('client_access')
        .select('pack_type, pack_price, access_expires_at')
        .eq('user_id', userData.id)
        .single();

      if (accessData) {
        setAccess(accessData);
      }

      // Charger les paiements
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userData.id)
        .order('createdAt', { ascending: false });

      if (paymentsData) {
        setPayments(paymentsData);
      }

      // Charger les demandes de remboursement
      const { data: refundsData } = await supabase
        .from('refund_requests')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (refundsData) {
        setRefundRequests(refundsData);
      }
    }

    setLoading(false);
  }

  async function submitRefundRequest() {
    if (!refundAmount || !refundReason.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) return;

      const { error } = await supabase
        .from('refund_requests')
        .insert({
          user_id: userData.id,
          amount: parseFloat(refundAmount),
          reason: refundReason.trim(),
          status: 'pending',
        });

      if (error) throw error;

      alert('Demande de remboursement envoyée avec succès !');
      setShowRefundForm(false);
      setRefundAmount('');
      setRefundReason('');
      loadData();
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <OnboardingVideo pageSlug="paiements" role="CLIENT" />

      <h1 className="text-3xl font-bold text-[#123055]">Mes Paiements</h1>

      {/* Pack actif */}
      {access && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#123055] mb-2">
                {PACK_LABELS[access.pack_type] || 'Pack'}
              </h2>
              {access.access_expires_at ? (
                <p className="text-slate-600">
                  Abonnement actif jusqu'au {new Date(access.access_expires_at).toLocaleDateString('fr-FR')}
                </p>
              ) : (
                <p className="text-slate-600">Accès actif</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-[#123055]">
                {access.pack_price || PACK_PRICES[access.pack_type] || 0}€
              </div>
              <p className="text-sm text-slate-600">Paiement unique</p>
            </div>
          </div>
        </div>
      )}

      {/* Demandes de remboursement */}
      {refundRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw size={20} className="text-orange-600" />
              Demandes de remboursement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {refundRequests.map((refund) => (
              <div
                key={refund.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
              >
                <div>
                  <p className="font-semibold">{refund.amount}€</p>
                  <p className="text-sm text-gray-600">{refund.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(refund.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  {refund.status === 'pending' && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      En attente
                    </span>
                  )}
                  {refund.status === 'approved' && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Approuvé
                    </span>
                  )}
                  {refund.status === 'rejected' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      Refusé
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Formulaire demande remboursement */}
      {showRefundForm && (
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle>Demande de remboursement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Montant (€)</label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Motif de la demande</label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Expliquez pourquoi vous demandez un remboursement..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={submitRefundRequest}
                disabled={submitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {submitting ? 'Envoi...' : 'Envoyer la demande'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRefundForm(false)}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton demande remboursement */}
      {!showRefundForm && (
        <Button
          onClick={() => setShowRefundForm(true)}
          variant="outline"
          className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
        >
          <RefreshCw size={16} className="mr-2" />
          Demander un remboursement
        </Button>
      )}

      {/* Historique paiements */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold text-[#123055] mb-6">Historique des paiements</h2>

        {payments.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">Aucun paiement enregistré</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {PACK_LABELS[payment.pack_type] || 'Paiement'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#123055]">{payment.amount}€</p>
                  <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1">
                    <Download size={14} />
                    Facture
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upsell */}
      <div className="border-2 border-dashed border-amber-300 rounded-xl p-6 text-center bg-white">
        <CreditCard className="mx-auto text-amber-500 mb-4" size={48} />
        <h3 className="text-xl font-bold text-[#123055] mb-2">
          Besoin d'un accompagnement supplémentaire ?
        </h3>
        <p className="text-slate-600 mb-4">
          Ajoutez des RDV experts ou des formations complémentaires
        </p>
        <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-bold">
          Voir les options
        </button>
      </div>
    </div>
  );
}