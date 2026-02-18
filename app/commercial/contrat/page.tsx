'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FileText, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Contract {
  id: string;
  status: string;
  signed_at: string | null;
  created_at: string;
  yousign_signature_request_id: string | null;
}

export default function CloserContratPage() {
  const [contract, setContract] = useState<Contract | null>(null);
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
      loadContract();
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

  async function loadContract() {
    // Trouver le team_member_id
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'closer')
      .single();

    if (teamMember) {
      const { data } = await supabase
        .from('contracts')
        .select('*')
        .eq('team_member_id', teamMember.id)
        .eq('contract_type', 'closer')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setContract(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Mon Contrat</h1>
          <p className="text-gray-600 mt-2">Contrat de prestation closer</p>
        </div>

        {contract ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Status Header */}
            <div className={`p-6 ${
              contract.status === 'signed' ? 'bg-green-50 border-b border-green-200' :
              contract.status === 'sent' ? 'bg-blue-50 border-b border-blue-200' :
              'bg-gray-50 border-b border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {contract.status === 'signed' ? (
                    <CheckCircle className="text-green-600" size={32} />
                  ) : contract.status === 'sent' ? (
                    <Clock className="text-blue-600" size={32} />
                  ) : (
                    <AlertCircle className="text-gray-600" size={32} />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {contract.status === 'signed' ? 'Contrat Signé' :
                       contract.status === 'sent' ? 'En attente de signature' :
                       'Contrat en préparation'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {contract.signed_at 
                        ? `Signé le ${new Date(contract.signed_at).toLocaleDateString('fr-FR')}`
                        : `Créé le ${new Date(contract.created_at).toLocaleDateString('fr-FR')}`
                      }
                    </p>
                  </div>
                </div>

                {contract.status === 'signed' && (
                  <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    <Download size={20} />
                    Télécharger
                  </button>
                )}
              </div>
            </div>

            {/* Contract Details */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Détails du contrat</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Type</span>
                    <span className="font-semibold text-gray-900">Contrat Prestataire Closer</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Statut</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      contract.status === 'signed' ? 'bg-green-100 text-green-700' :
                      contract.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {contract.status === 'signed' ? 'Signé' :
                       contract.status === 'sent' ? 'En attente' :
                       'En préparation'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Commission</span>
                    <span className="font-semibold text-gray-900">10% HT sur encaissements</span>
                  </div>
                </div>
              </div>

              {contract.status === 'sent' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 font-medium mb-2">
                    📧 Un email de signature vous a été envoyé
                  </p>
                  <p className="text-blue-700 text-sm">
                    Vérifiez votre boîte mail pour signer électroniquement votre contrat via YouSign.
                  </p>
                </div>
              )}

              {contract.status === 'signed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-900 font-medium">
                    ✅ Votre contrat est signé et actif
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Vous pouvez suivre vos commissions dans l'onglet "Mes Commissions"
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucun contrat trouvé
            </h3>
            <p className="text-gray-600">
              Votre contrat de prestation sera disponible ici une fois créé par l'administration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}