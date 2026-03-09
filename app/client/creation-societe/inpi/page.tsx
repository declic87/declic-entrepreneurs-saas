"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { INPIFormulaire } from "@/components/creation/INPIFormulaire";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function INPIFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    loadCompanyData();
  }, []);

  async function loadCompanyData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) return;

      const { data: activeCompany } = await supabase
        .from('user_companies')
        .select('id, legal_form, company_name')
        .eq('is_active', true)
        .single();

      if (!activeCompany) {
        alert('❌ Aucune société active trouvée');
        router.push('/client/creation-societe');
        return;
      }

      const { data: company } = await supabase
        .from('company_creation_data')
        .select('*')
        .eq('company_id', activeCompany.id)
        .single();

      if (!company) {
        alert('❌ Données de création non trouvées');
        router.push('/client/creation-societe');
        return;
      }

      setCompanyData({
        ...company,
        legal_form: activeCompany.legal_form,
        company_name: activeCompany.company_name
      });
    } catch (err) {
      console.error('Erreur:', err);
      alert('❌ Erreur de chargement');
      router.push('/client/creation-societe');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(inpiData: any) {
    try {
      // Sauvegarder les données INPI dans company_creation_data
      const { error } = await supabase
        .from('company_creation_data')
        .update({
          inpi_data: inpiData,
          step: 'capital_deposit' // Passer à l'étape suivante
        })
        .eq('id', companyData.id);

      if (error) throw error;

      alert('✅ Formulaire INPI enregistré avec succès !');
      router.push('/client/creation-societe');
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      alert('❌ Erreur : ' + err.message);
    }
  }

  function handleBack() {
    router.push('/client/creation-societe');
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-600">Chargement du formulaire...</p>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-bold text-lg">❌ Erreur : Société non trouvée</p>
          <Button onClick={() => router.push('/client/creation-societe')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          📋 Formulaire INPI
        </h1>
        <p className="text-slate-600">
          Société : <strong>{companyData.company_name}</strong> • 
          Statut : <strong>{companyData.legal_form || companyData.company_type}</strong>
        </p>
      </div>

      <INPIFormulaire
        statut={companyData.legal_form || companyData.company_type || 'SASU'}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    </div>
  );
}