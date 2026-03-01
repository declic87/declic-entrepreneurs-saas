// app/client/creation-societe/depot-capital/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import CapitalDepositStep from '@/components/creation/CapitalDepositStep';

export default function DepotCapitalPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getOrCreateCompany() {
      try {
        // Récupérer la société active de l'utilisateur
        const { data: activeCompanyId } = await supabase.rpc('get_active_company');
        
        if (activeCompanyId) {
          // L'utilisateur a déjà une société active
          setCompanyId(activeCompanyId);
        } else {
          // Créer une nouvelle société par défaut
          const { data: newCompanyId } = await supabase.rpc('create_user_company', {
            p_company_name: 'Ma Société',
            p_legal_form: 'SASU'
          });
          setCompanyId(newCompanyId);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getOrCreateCompany();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-bold">Erreur de création de société</p>
          <button 
            onClick={() => router.push('/client/creation-societe')}
            className="mt-4 text-indigo-600 underline"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <CapitalDepositStep 
      companyId={companyId}
      onComplete={() => router.push('/client/creation-societe/documents')}
    />
  );
}