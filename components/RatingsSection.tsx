'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquare, Calendar } from 'lucide-react';

interface Rating {
  id: string;
  rating_expert: number;
  rating_declic: number;
  comment_expert: string | null;
  comment_declic: string | null;
  created_at: string;
  rdvs: {
    scheduled_at: string;
  };
  experts: {
    userId: string;
    users: {
      first_name: string;
      last_name: string;
    };
  };
}

export function RatingsSection() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadRatings();
  }, []);

  async function loadRatings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) return;

      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          rdvs(scheduled_at),
          experts(
            userId,
            users(first_name, last_name)
          )
        `)
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRatings(data || []);
    } catch (error) {
      console.error('Erreur chargement notations:', error);
    } finally {
      setLoading(false);
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }
          />
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="text-orange-500" size={24} />
          Vos avis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ratings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="mx-auto mb-3 opacity-20" size={48} />
            <p>Vous n'avez pas encore donné d'avis</p>
            <p className="text-sm mt-1">Après un RDV, vous pourrez noter votre expérience</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div key={rating.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-[#123055]">
                      {rating.experts.users.first_name} {rating.experts.users.last_name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Calendar size={14} />
                      {new Date(rating.rdvs.scheduled_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(rating.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Note Expert */}
                  <div className="bg-blue-50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#123055]">Expert</span>
                      {renderStars(rating.rating_expert)}
                    </div>
                    {rating.comment_expert && (
                      <p className="text-sm text-gray-700 italic">"{rating.comment_expert}"</p>
                    )}
                  </div>

                  {/* Note Déclic */}
                  <div className="bg-orange-50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#123055]">Déclic Entrepreneurs</span>
                      {renderStars(rating.rating_declic)}
                    </div>
                    {rating.comment_declic && (
                      <p className="text-sm text-gray-700 italic">"{rating.comment_declic}"</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}