'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Loader2, X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

interface ScheduleExpertRDVProps {
  leadId: string;
  leadName: string;
  leadEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ScheduleExpertRDV({
  leadId,
  leadName,
  leadEmail,
  onSuccess,
  onCancel
}: ScheduleExpertRDVProps) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSchedule() {
    if (!scheduledAt) {
      toast.error('Sélectionnez une date et heure');
      return;
    }

    setLoading(true);

    try {
      // Appeler l'API pour créer le RDV
      const response = await fetch('/api/closer/book-expert-rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          scheduledAt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réservation');
      }

      toast.success('RDV expert réservé avec succès !');
      onSuccess();
      
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📅 Réserver RDV Expert</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Info client */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-900">{leadName}</p>
            <p className="text-xs text-slate-600">{leadEmail}</p>
          </div>

          {/* Date et heure */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              📆 Date et heure du RDV
            </label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-slate-500 mt-1">
              Choisissez un créneau avec le client au téléphone
            </p>
          </div>

          {/* Info importante */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-xs text-blue-800 font-medium">
              ℹ️ Le client a déjà payé son offre d'accompagnement. 
              Ce RDV expert est inclus dans son pack.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSchedule}
              disabled={loading || !scheduledAt}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Réservation...
                </>
              ) : (
                <>
                  <Calendar className="mr-2" size={18} />
                  Confirmer le RDV
                </>
              )}
            </Button>

            <Button
              onClick={onCancel}
              variant="outline"
              disabled={loading}
            >
              <X size={18} className="mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}