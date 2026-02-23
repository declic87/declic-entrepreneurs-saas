'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Calendar } from 'lucide-react';
import { CALENDLY_LINKS } from '@/lib/calendly/calendlyService';

export default function RDVExpertPayantPage() {
  const router = useRouter();
  const [step, setStep] = useState<'payment' | 'calendly'>('payment');
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    setLoading(true);
    
    try {
      // Créer une session Stripe
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_RDV_EXPERT_PRICE_ID,
          successUrl: `${window.location.origin}/rdv-expert-payant?step=calendly`,
          cancelUrl: `${window.location.origin}/rdv-expert-payant`,
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        // Rediriger vers Stripe
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      alert('Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  }

  // Si retour de paiement réussi
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('step') === 'calendly' && step === 'payment') {
      setStep('calendly');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#123055] mb-4">
            RDV Expert Fiscal - Payant
          </h1>
          <p className="text-lg text-gray-600">
            Consultation approfondie avec un expert fiscal certifié
          </p>
        </div>

        {/* Étapes */}
        <div className="flex items-center justify-center gap-8 mb-12">
          <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-orange-600' : 'text-green-600'}`}>
            {step === 'calendly' ? (
              <CheckCircle size={24} />
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
                <span className="text-sm">1</span>
              </div>
            )}
            <span className="font-semibold">Paiement</span>
          </div>
          
          <div className="w-24 h-0.5 bg-gray-300" />
          
          <div className={`flex items-center gap-2 ${step === 'calendly' ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
              <span className="text-sm">2</span>
            </div>
            <span className="font-semibold">Réservation</span>
          </div>
        </div>

        {/* Contenu selon l'étape */}
        {step === 'payment' ? (
          <Card className="border-2 border-orange-200">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-3xl font-bold mb-4">
                  €
                </div>
                <h2 className="text-3xl font-bold text-[#123055] mb-2">
                  250€
                </h2>
                <p className="text-gray-600">Consultation Expert Fiscal (60 min)</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900">Analyse complète de votre situation</p>
                    <p className="text-sm text-gray-600">Diagnostic fiscal personnalisé</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900">Recommandations sur-mesure</p>
                    <p className="text-sm text-gray-600">Statut juridique optimal pour votre cas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900">Plan d'action détaillé</p>
                    <p className="text-sm text-gray-600">Feuille de route pour optimiser votre fiscalité</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900">Enregistrement Fathom inclus</p>
                    <p className="text-sm text-gray-600">Accès illimité au replay de votre consultation</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg py-6"
              >
                <CreditCard size={20} className="mr-2" />
                {loading ? 'Redirection...' : 'Payer 250€ et réserver'}
              </Button>

              <p className="text-center text-sm text-gray-500 mt-4">
                🔒 Paiement sécurisé par Stripe
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-green-200">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white mb-4">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-[#123055] mb-2">
                  Paiement confirmé !
                </h2>
                <p className="text-gray-600">Choisissez maintenant votre créneau avec un expert</p>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-xl border-2 border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="text-orange-600" size={32} />
                  <div>
                    <h3 className="font-bold text-[#123055]">Réservez votre créneau</h3>
                    <p className="text-sm text-gray-600">Un expert sera automatiquement assigné selon les disponibilités</p>
                  </div>
                </div>

                <iframe
                  src={CALENDLY_LINKS.EXPERT_TEAM}
                  width="100%"
                  height="700"
                  frameBorder="0"
                  className="rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}