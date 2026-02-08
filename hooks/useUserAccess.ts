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
    tutosPratiques: boolean; // Accessible à TOUS
    ateliers: boolean; // Accessible à TOUS
    simulateurs: boolean; // Accessible à TOUS
    expertPayant: boolean; // Accessible à TOUS
    formationsPremium: boolean; // Formations ou Accompagnement
    coachings: boolean; // Formations ou Accompagnement
    creationSociete: boolean; // Accompagnement uniquement
    monDossier: boolean; // Accompagnement uniquement
    rdvGratuit: boolean; // Accompagnement uniquement
    rdvExpert: number; // 0, 3, 4 ou 5
    showFormationCreateur: boolean;
    showFormationAgentImmo: boolean;
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

  // Packs avec formations
  const hasFormationPack = pack === 'FORMATION_CREATEUR' || 
                           pack === 'FORMATION_AGENT_IMMO';

  // Packs avec accompagnement
  const hasAccompagnement = pack === 'STARTER' || 
                            pack === 'PRO' || 
                            pack === 'EXPERT';

  const hasAccess = {
    // Accessible à TOUS
    tutosPratiques: true,
    ateliers: true,
    simulateurs: true,
    expertPayant: true,

    // Formations ou Accompagnement
    formationsPremium: hasFormationPack || hasAccompagnement,
    coachings: hasFormationPack || hasAccompagnement,

    // Accompagnement UNIQUEMENT
    creationSociete: hasAccompagnement,
    monDossier: hasAccompagnement,
    rdvGratuit: hasAccompagnement,

    // Nombre de RDV gratuits
    rdvExpert: pack === 'STARTER' ? 3 : 
               pack === 'PRO' ? 4 : 
               pack === 'EXPERT' ? 5 : 
               0,

    // Quelle formation afficher
    showFormationCreateur: pack === 'FORMATION_CREATEUR' || hasAccompagnement,
    showFormationAgentImmo: pack === 'FORMATION_AGENT_IMMO' || hasAccompagnement,
  };

  return {
    pack,
    hasAccess,
    loading,
  };
}