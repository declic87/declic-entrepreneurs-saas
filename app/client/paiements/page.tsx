'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { OnboardingVideo } from '@/components/OnboardingVideo';
import { CreditCard, Download, CheckCircle2, AlertCircle } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  pack_type: string;
  status: string;
  created_at: string;
}

interface ClientAccess {
  pack_type: string;
  pack_price: number;
  access_expires_at: string | null;
}

const PACK_LABELS: Record<string, string> = {
  plateforme: 'Pack Plateforme',
  createur: 'Formation Créateur',
  agent_immo: 'Formation Agent Immobilier',
  starter: 'Pack Starter',
  pro: 'Pack Pro',
  expert: 'Pack Expert',
};

export default function PaiementsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [access, setAccess] = useState<ClientAccess | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Charger l'utilisateur
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Charger l'accès actuel
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userData) {
      const { data: accessData } = await supabase
        .from('client_access')
        .select('pack_type, pack_price, access_expires_at')
        .eq('user_id', userData.id)
        .single();

      if (accessData) setAccess(accessData);

      // Charger l'historique des paiements
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (paymentsData) setPayments(paymentsData);
    }

    setLoading(false);
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
      <OnboardingVideo pageSlug="paiements" />

      <h1 className="text-3xl font-bold text-[#123055]">Mes Paiements</h1>

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
              <div className="text-3xl font-black text-[#123055]">{access.pack_price}€</div>
              <p className="text-sm text-slate-600">Paiement unique</p>
            </div>
          </div>
        </div>
      )}

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
                      {new Date(payment.created_at).toLocaleDateString('fr-FR')}
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