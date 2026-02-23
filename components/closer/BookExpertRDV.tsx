// components/closer/BookExpertRDV.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BookExpertRDVProps {
  leadId: string;
  leadName: string;
  leadEmail: string;
  onSuccess?: () => void;
}

export function BookExpertRDV({ leadId, leadName, leadEmail, onSuccess }: BookExpertRDVProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'payment' | 'booking'>('payment');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
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
          successUrl: window.location.href,
          cancelUrl: window.location.href,
          metadata: {
            leadId,
            leadEmail,
            type: 'rdv_expert',
          },
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        // Ouvrir Stripe dans un nouvel onglet
        window.open(url, '_blank');
        
        // Passer à l'étape suivante après quelques secondes
        setTimeout(() => {
          setStep('booking');
          toast.success('Paiement en cours... Choisissez maintenant la date du RDV');
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      toast.error('Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  }

  async function handleBooking() {
    if (!selectedDate || !selectedTime) {
      toast.error('Veuillez choisir une date et une heure');
      return;
    }

    setLoading(true);

    try {
      // Créer le RDV
      const response = await fetch('/api/closer/book-expert-rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          leadName,
          leadEmail,
          scheduledAt: `${selectedDate}T${selectedTime}:00.000Z`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('RDV expert réservé avec succès !');
        setIsOpen(false);
        onSuccess?.();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Erreur réservation:', error);
      toast.error('Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
      >
        <Calendar size={18} className="mr-2" />
        Réserver 1er RDV Expert
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {step === 'payment' ? 'Paiement RDV Expert' : 'Choisir la date du RDV'}
            </DialogTitle>
          </DialogHeader>

          {step === 'payment' ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-xl border-2 border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Client</p>
                    <p className="font-bold text-gray-900">{leadName}</p>
                    <p className="text-sm text-gray-600">{leadEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-orange-600">250€</p>
                    <p className="text-sm text-gray-600">RDV Expert 60min</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="text-green-600" size={16} />
                  <span>Analyse fiscale complète</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="text-green-600" size={16} />
                  <span>Recommandations personnalisées</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="text-green-600" size={16} />
                  <span>Enregistrement Fathom inclus</span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                <CreditCard size={18} className="mr-2" />
                {loading ? 'Redirection...' : 'Procéder au paiement (250€)'}
              </Button>

              <p className="text-xs text-center text-gray-500">
                Le paiement s'ouvrira dans un nouvel onglet. Revenez ici après le paiement.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-900">✅ Paiement en cours de traitement</p>
                <p className="text-xs text-green-700 mt-1">Choisissez maintenant la date du RDV</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Date du RDV
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 ring-orange-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Heure du RDV
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 ring-orange-500/20 outline-none"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  💡 Un expert disponible sera automatiquement assigné pour ce créneau
                </p>
              </div>

              <Button
                onClick={handleBooking}
                disabled={loading || !selectedDate || !selectedTime}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <CheckCircle size={18} className="mr-2" />
                {loading ? 'Réservation...' : 'Confirmer le RDV'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}