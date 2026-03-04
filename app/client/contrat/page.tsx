'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FileText, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Contract {
  id: string;
  contract_type: string;
  status: string;
  amount: number;
  signed_at: string;
  created_at: string;
  file_url: string;
  is_manual_upload: boolean;
}

export default function ClientContratsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) return;

    const { data } = await supabase
      .from('contracts')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    setContracts(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      client_subscription: 'Contrat d\'abonnement',
      team_onboarding: 'Contrat de collaboration',
      client: 'Contrat client',
      closer: 'Contrat Closer',
      setter: 'Contrat Setter',
      expert: 'Contrat Expert',
    };
    return labels[type] || 'Contrat';
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { icon: any; color: string; label: string }> = {
      signed: { icon: CheckCircle, color: 'text-green-600', label: 'Signé' },
      pending_signature: { icon: Clock, color: 'text-orange-600', label: 'À signer' },
      sent: { icon: AlertCircle, color: 'text-blue-600', label: 'Envoyé' },
      pending: { icon: Clock, color: 'text-gray-600', label: 'En attente' },
    };
    return statusMap[status] || statusMap.pending;
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mes Contrats</h1>
        <p className="text-gray-600 mt-2">Consultez et téléchargez vos contrats</p>
      </div>

      <div className="space-y-4">
        {contracts.map((contract) => {
          const statusInfo = getStatusInfo(contract.status);
          const StatusIcon = statusInfo.icon;

          return (
            <div 
              key={contract.id} 
              className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-blue-50">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {getContractTypeLabel(contract.contract_type)}
                    </h3>
                    
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Créé le :</span>{' '}
                        {new Date(contract.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      
                      {contract.signed_at && (
                        <p className="text-sm text-green-600">
                          <span className="font-medium">Signé le :</span>{' '}
                          {new Date(contract.signed_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}

                      {contract.amount && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Montant :</span> {contract.amount.toFixed(2)} €
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <StatusIcon className={statusInfo.color} size={18} />
                      <span className={`font-medium text-sm ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {contract.file_url && (
                    
                    <a href={contract.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                      <Download size={16} />
                      Télécharger
                    </a>
                  )}
                  
                  {contract.is_manual_upload && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium text-center">
                      Upload manuel
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {contracts.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <FileText className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun contrat pour le moment
            </h3>
            <p className="text-gray-600">
              Vos contrats apparaîtront ici une fois qu'ils seront générés
            </p>
          </div>
        )}
      </div>
    </div>
  );
}