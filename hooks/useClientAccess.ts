import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface ClientAccess {
  id: string;
  pack_type: string;
  has_tutos: boolean;
  has_coaching: boolean;
  has_ateliers: boolean;
  has_partenaire: boolean;
  has_simulateur: boolean;
  has_formation_createur: boolean;
  has_formation_agent_immo: boolean;
  rdv_total: number;
  rdv_consumed: number;
  rdv_remaining: number;
  has_rdv_vip: boolean;
  access_expires_at: string | null;
  is_active: boolean;
}

export function useClientAccess(userId: string | null) {
  const [access, setAccess] = useState<ClientAccess | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchAccess() {
      const { data, error } = await supabase
        .from('client_access')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        setAccess(data as ClientAccess);
      }
      setLoading(false);
    }

    fetchAccess();

    // Subscribe to changes
    const channel = supabase
      .channel('client_access_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_access',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            setAccess(payload.new as ClientAccess);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return { access, loading };
}