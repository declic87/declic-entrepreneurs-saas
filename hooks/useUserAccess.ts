'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export type Pack = 
  | 'PLATEFORME'
  | 'FORMATION_CREATEUR'
  | 'FORMATION_AGENT_IMMO'
  | 'STARTER'
  | 'PRO'
  | 'EXPERT'
  | null;

interface UserAccess {
  pack: Pack;
  hasAccess: {
    simulateurs: boolean;
    formationsTuto: boolean;
    ateliers: boolean;
    coachings: boolean;
    formationsPremium: boolean;
    accompagnement: boolean;
    rdvExpert: number; // Nombre de RDV disponibles
  };
  loading: boolean;
}

export function useUserAccess(): UserAccess {
  const [pack, setPack] = useState<Pack>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchUserPack() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('pack, pack_expires_at')
            .eq('auth_id', session.user.id)
            .single();

          if (userData?.pack) {
            // Vérifier si le pack n'est pas expiré
            if (userData.pack_expires_at) {
              const expiresAt = new Date(userData.pack_expires_at);
              if (expiresAt < new Date()) {
                setPack(null);
                setLoading(false);
                return;
              }
            }
            setPack(userData.pack as Pack);
          }
        }
      } catch (error) {
        console.error('Error fetching user pack:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserPack();
  }, [supabase]);

  // Définir les accès selon le pack
  const hasAccess = {
    simulateurs: true, // Accessible à tous
    formationsTuto: true, // Accessible à tous
    ateliers: true, // Accessible à tous
    coachings: pack === 'FORMATION_CREATEUR' || 
               pack === 'FORMATION_AGENT_IMMO' || 
               pack === 'STARTER' || 
               pack === 'PRO' || 
               pack === 'EXPERT',
    formationsPremium: pack === 'FORMATION_CREATEUR' || 
                       pack === 'FORMATION_AGENT_IMMO' || 
                       pack === 'STARTER' || 
                       pack === 'PRO' || 
                       pack === 'EXPERT',
    accompagnement: pack === 'STARTER' || 
                    pack === 'PRO' || 
                    pack === 'EXPERT',
    rdvExpert: pack === 'STARTER' ? 3 : 
               pack === 'PRO' ? 4 : 
               pack === 'EXPERT' ? 5 : 
               0,
  };

  return {
    pack,
    hasAccess,
    loading,
  };
}