'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FileText, Send, Check } from 'lucide-react';
import { PACKS_CONFIG, formatPrice } from '@/lib/packs-config';

export default function AdminGenererContratPage() {
  const [step, setStep] = useState(1);
  const [contractType, setContractType] = useState<'client' | 'prestataire'>('client');
  const [selectedPack, setSelectedPack] = useState('');
  const [userId, setUserId] = useState('');
  const [generating, setGenerating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleGenerate() {
    setGenerating(true);

    try {
      // 1. Générer le contrat PDF avec template
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractType,
          pack: selectedPack,
          userId,
        }),
      });

      const { contractId, yousignUrl } = await response.json();

      // 2. Créer l'entrée dans la BDD
      const packConfig = PACKS_CONFIG[contractType][selectedPack as keyof typeof PACKS_CONFIG[typeof contractType]];

      await supabase.from('contracts').insert({
        contract_type: contractType === 'client' ? 'client' : selectedPack,
        user_id: contractType === 'client' ? userId : null,
        team_member_id: contractType === 'prestataire' ? userId : null,
        status: 'sent',
        amount: contractType === 'client' ? (packConfig as any).price : null,
        subscription_pack: contractType === 'client' ? selectedPack : null,
        yousign_signature_request_id: contractId,
      });

      alert('✅ Contrat généré et envoyé pour signature !');
      setStep(1);
      setSelectedPack('');
      setUserId('');
    } catch (error) {
      console.error(error);
      alert('❌ Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Générer un Contrat</h1>
          <p className="text-gray-600 mt-2">Assistant de création de contrats</p>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Type */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">1. Type de contrat</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setContractType('client');
                    setStep(2);
                  }}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                >
                  <FileText className="text-orange-500 mb-3" size={32} />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Contrat Client</h3>
                  <p className="text-sm text-gray-600">
                    Abonnement, formation ou accompagnement
                  </p>
                </button>

                <button
                  onClick={() => {
                    setContractType('prestataire');
                    setStep(2);
                  }}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                >
                  <FileText className="text-purple-500 mb-3" size={32} />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Contrat Prestataire</h3>
                  <p className="text-sm text-gray-600">
                    Closer, Setter, Expert ou HOS
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Pack */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  2. Choisir le pack {contractType === 'client' ? 'client' : 'prestataire'}
                </h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Retour
                </button>
              </div>

              <div className="grid gap-4">
                {Object.entries(PACKS_CONFIG[contractType]).map(([key, pack]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedPack(key);
                      setStep(3);
                    }}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">{pack.name}</h3>
                        <p className="text-sm text-gray-600">{pack.description}</p>
                      </div>
                      {contractType === 'client' && (
                        <span className="text-xl font-bold text-blue-600">
                          {formatPrice((pack as any).price, (pack as any).duration)}
                        </span>
                      )}
                      {contractType === 'prestataire' && (
                        <span className="text-xl font-bold text-purple-600">
                          {(pack as any).commission_rate || `${(pack as any).commission_rate_min}-${(pack as any).commission_rate_max}`}%
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: User */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  3. Sélectionner {contractType === 'client' ? 'le client' : 'le prestataire'}
                </h2>
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Retour
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email ou ID utilisateur
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={contractType === 'client' ? 'client@example.com' : 'prestataire@example.com'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!userId || generating}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Générer et envoyer le contrat
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}