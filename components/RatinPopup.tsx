'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Sparkles } from 'lucide-react';

interface RatingPopupProps {
  rdvId: string;
  expertName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RatingPopup({ rdvId, expertName, isOpen, onClose }: RatingPopupProps) {
  const [ratingExpert, setRatingExpert] = useState(0);
  const [ratingDeclic, setRatingDeclic] = useState(0);
  const [commentExpert, setCommentExpert] = useState('');
  const [commentDeclic, setCommentDeclic] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function submitRating() {
    if (ratingExpert === 0 || ratingDeclic === 0) {
      alert('Veuillez donner une note pour l\'expert et pour Déclic Entrepreneurs');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) return;

      // Récupérer l'expert_id du RDV
      const { data: rdvData } = await supabase
        .from('rdvs')
        .select('expert_id')
        .eq('id', rdvId)
        .single();

      if (!rdvData) throw new Error('RDV non trouvé');

      // Insérer la notation
      const { error } = await supabase
        .from('ratings')
        .insert({
          user_id: userData.id,
          expert_id: rdvData.expert_id,
          rdv_id: rdvId,
          rating_expert: ratingExpert,
          rating_declic: ratingDeclic,
          comment_expert: commentExpert.trim() || null,
          comment_declic: commentDeclic.trim() || null,
        });

      if (error) throw error;

      alert('Merci pour votre avis ! 🎉');
      onClose();
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#123055]">
            Comment s'est passé votre RDV ?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Notation Expert */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3 text-[#123055]">
              Votre expert : {expertName}
            </h3>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingExpert(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={
                      star <= ratingExpert
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Commentaire sur l'expert (optionnel)"
              value={commentExpert}
              onChange={(e) => setCommentExpert(e.target.value)}
              rows={3}
            />
          </div>

          {/* Notation Déclic */}
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3 text-[#123055] flex items-center gap-2">
              <Sparkles className="text-orange-500" size={24} />
              Déclic Entrepreneurs
            </h3>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingDeclic(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={
                      star <= ratingDeclic
                        ? 'fill-orange-400 text-orange-400'
                        : 'text-gray-300'
                    }
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Votre avis sur notre plateforme (optionnel)"
              value={commentDeclic}
              onChange={(e) => setCommentDeclic(e.target.value)}
              rows={3}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <Button
              onClick={submitRating}
              disabled={submitting || ratingExpert === 0 || ratingDeclic === 0}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? 'Envoi...' : 'Envoyer mon avis'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Plus tard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}