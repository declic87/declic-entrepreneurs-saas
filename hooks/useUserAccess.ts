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
    tutosPratiques: boolean;
    tutosPratiquesLoom: boolean;
    ateliers: boolean;
    ateliersArchives: boolean;
    simulateurs: boolean;
    expertPayant: boolean;
    formationsPremium: boolean;
    coachings: boolean;
    coachingsArchives: boolean;
    creationSociete: boolean;
    monDossier: boolean;
    rdvGratuit: boolean;
    rdvExpert: number;
    packDuration: number | null;
    showFormationCreateur: boolean;
    showFormationAgentImmo: boolean;
  };
  loading: boolean;
  packExpired: boolean;
  daysRemaining: number | null;
}

export function useUserAccess(): UserAccess {
  const [pack, setPack] = useState<Pack>(null);
  const [loading, setLoading] = useState(true);
  const [packExpired, setPackExpired] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

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
            // Vérifier expiration pour les packs avec durée limitée
            if (userData.pack_expires_at) {
              const expiresAt = new Date(userData.pack_expires_at);
              const now = new Date();
              
              if (expiresAt < now) {
                // Pack expiré
                setPack(null);
                setPackExpired(true);
                setDaysRemaining(0);
                setLoading(false);
                return;
              }
              
              // Calculer jours restants
              const diffTime = expiresAt.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setDaysRemaining(diffDays);
            } else {
              // Pack sans expiration (packs accompagnement)
              setDaysRemaining(null);
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

  // Packs avec formations (durée 3 mois)
  const hasFormationPack = pack === 'FORMATION_CREATEUR' || 
                           pack === 'FORMATION_AGENT_IMMO';

  // Packs avec accompagnement (durée 6/12/18 mois)
  const hasAccompagnement = pack === 'STARTER' || 
                            pack === 'PRO' || 
                            pack === 'EXPERT';

  const hasAccess = {
    // ✅ Accessible à TOUS (toujours)
    tutosPratiques: true,
    tutosPratiquesLoom: true,
    ateliers: true,
    ateliersArchives: true,
    expertPayant: true,

    // ✅ Simulateurs : TOUS (3 mois pour formations, selon durée pour accompagnement)
    simulateurs: pack === 'PLATEFORME' || hasFormationPack || hasAccompagnement,

    // ✅ Formations ou Accompagnement
    formationsPremium: hasFormationPack || hasAccompagnement,
    
    // ✅ Coachings : Formations (3 mois) ou Accompagnement (6/12/18 mois)
    coachings: hasFormationPack || hasAccompagnement,
    coachingsArchives: hasFormationPack || hasAccompagnement,

    // ✅ Accompagnement UNIQUEMENT (6/12/18 mois selon pack)
    creationSociete: hasAccompagnement,
    monDossier: hasAccompagnement,
    rdvGratuit: hasAccompagnement,

    // Nombre de RDV gratuits
    rdvExpert: pack === 'STARTER' ? 3 : 
               pack === 'PRO' ? 4 : 
               pack === 'EXPERT' ? 5 : 
               0,

    // Durée du pack (en mois)
    packDuration: pack === 'FORMATION_CREATEUR' || pack === 'FORMATION_AGENT_IMMO' ? 3 :
                  pack === 'STARTER' ? 6 :
                  pack === 'PRO' ? 12 :
                  pack === 'EXPERT' ? 18 :
                  null,

    // Quelle formation afficher
    showFormationCreateur: pack === 'FORMATION_CREATEUR' || hasAccompagnement,
    showFormationAgentImmo: pack === 'FORMATION_AGENT_IMMO' || hasAccompagnement,
  };

  return {
    pack,
    hasAccess,
    loading,
    packExpired,
    daysRemaining,
  };
}