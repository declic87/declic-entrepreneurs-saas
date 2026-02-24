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
      // 1. Créer le RDV dans expert_appointments
      const { data: rdvData, error: rdvError } = await supabase
        .from('expert_appointments')
        .insert({
          lead_id: leadId,
          scheduled_at: scheduledAt,
          status: 'scheduled',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (rdvError) throw rdvError;

      // 2. Récupérer l'expert assigné (tu peux adapter la logique)
      const { data: expertData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('role', 'EXPERT')
        .limit(1)
        .single();

      const expertName = expertData 
        ? `${expertData.first_name} ${expertData.last_name}`
        : 'Notre expert';

      // 3. Extraire date et heure
      const rdvDate = new Date(scheduledAt);
      const rdvDateStr = rdvDate.toISOString().split('T')[0];
      const rdvTimeStr = rdvDate.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // 4. Envoyer l'email de confirmation
      const emailResponse = await fetch('/api/emails/rdv-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: leadName,
          clientEmail: leadEmail,
          expertName: expertName,
          rdvDate: rdvDateStr,
          rdvTime: rdvTimeStr,
          meetLink: '' // Sera envoyé 24h avant
        })
      });

      if (!emailResponse.ok) {
        console.error('Erreur envoi email, mais RDV créé');
      }

      // 5. Mettre à jour le statut du lead
      await supabase
        .from('leads')
        .update({ 
          status: 'RDV_PLANIFIE',
          rdvDate: scheduledAt,
          updatedAt: new Date().toISOString()
        })
        .eq('id', leadId);

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