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
    // ✅ Accessible à TOUS
    tutosPratiques: boolean;
    ateliers: boolean;
    ateliersArchives: boolean;
    simulateurs: boolean;
    expertPayant: boolean;
    
    // ✅ Formations spécifiques
    formationCreateur: boolean;        // Pack FORMATION_CREATEUR uniquement
    formationAgentImmo: boolean;       // Pack FORMATION_AGENT_IMMO uniquement
    formationsAccompagnement: boolean; // Packs STARTER/PRO/EXPERT uniquement (contenu spécifique)
    
    // ✅ Coachings
    coachings: boolean;
    coachingsArchives: boolean;
    
    // ✅ Accompagnement uniquement
    creationSociete: boolean;
    monDossier: boolean;
    rdvGratuit: boolean;
    messagerie: boolean; // 🔒 RÉSERVÉ ACCOMPAGNEMENT
    
    // ✅ Nombre de RDV
    rdvExpert: number; // 0, 3, 4 ou 5
  };
  loading: boolean;
  packDuration: number | null; // Durée en mois (null si illimité/mensuel)
  daysRemaining: number | null; // Jours restants (null si pas de date d'expiration)
}

export function useUserAccess(): UserAccess {
  const [pack, setPack] = useState<Pack>(null);
  const [packExpiresAt, setPackExpiresAt] = useState<string | null>(null);
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
                setPackExpiresAt(null);
                setLoading(false);
                return;
              }
              setPackExpiresAt(userData.pack_expires_at);
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

  // Packs avec formations spécifiques
  const hasFormationCreateur = pack === 'FORMATION_CREATEUR';
  const hasFormationAgentImmo = pack === 'FORMATION_AGENT_IMMO';
  const hasFormationPack = hasFormationCreateur || hasFormationAgentImmo;

  // Packs avec accompagnement
  const hasAccompagnement = pack === 'STARTER' || pack === 'PRO' || pack === 'EXPERT';

  // Durée du pack en mois
  const packDuration = 
    pack === 'FORMATION_CREATEUR' || pack === 'FORMATION_AGENT_IMMO' ? 3 :
    pack === 'STARTER' ? 6 :
    pack === 'PRO' ? 12 :
    pack === 'EXPERT' ? 18 :
    null; // null pour PLATEFORME (mensuel)

  // Calcul jours restants
  let daysRemaining: number | null = null;
  if (packExpiresAt) {
    const expiresAt = new Date(packExpiresAt);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const hasAccess = {
    // ✅ Accessible à TOUS (même sans pack)
    tutosPratiques: true,
    ateliers: true,
    ateliersArchives: true,
    simulateurs: true,
    expertPayant: true,

    // ✅ Formations spécifiques
    formationCreateur: hasFormationCreateur || hasAccompagnement,
    formationAgentImmo: hasFormationAgentImmo || hasAccompagnement,
    formationsAccompagnement: hasAccompagnement, // Contenu spécifique aux packs accompagnement

    // ✅ Coachings (Formations OU Accompagnement)
    coachings: hasFormationPack || hasAccompagnement,
    coachingsArchives: hasFormationPack || hasAccompagnement,

    // ✅ Accompagnement UNIQUEMENT
    creationSociete: hasAccompagnement,
    monDossier: hasAccompagnement,
    rdvGratuit: hasAccompagnement,
    messagerie: hasAccompagnement, // 🔒 MESSAGERIE RÉSERVÉE ACCOMPAGNEMENT

    // ✅ Nombre de RDV gratuits
    rdvExpert: 
      pack === 'STARTER' ? 3 : 
      pack === 'PRO' ? 4 : 
      pack === 'EXPERT' ? 5 : 
      0,
  };

  return {
    pack,
    hasAccess,
    loading,
    packDuration,
    daysRemaining,
  };
}