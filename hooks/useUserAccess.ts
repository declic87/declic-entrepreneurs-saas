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
    coachings: boolean;
    coachingsArchives: boolean;
    simulateurs: boolean;
    expertPayant: boolean;
    partenaire: boolean; // 🆕 NOUVEAU - Accessible à TOUS
    
    // ✅ Formations spécifiques
    formationCreateur: boolean;        // Pack FORMATION_CREATEUR uniquement
    formationAgentImmo: boolean;       // Pack FORMATION_AGENT_IMMO uniquement
    formationsAccompagnement: boolean; // Packs STARTER/PRO/EXPERT uniquement
    
    // ✅ Accompagnement uniquement
    creationSociete: boolean;
    monDossier: boolean;
    rdvGratuit: boolean;
    messagerie: boolean;
    
    // ✅ Nombre de RDV
    rdvExpertTotal: number;      // 🆕 Total de RDV inclus
    rdvExpertUtilises: number;   // 🆕 Nombre de RDV utilisés
    rdvExpertRestants: number;   // 🆕 Nombre de RDV restants
  };
  loading: boolean;
  packDuration: number | null; // Durée en mois
  daysRemaining: number | null; // Jours restants
  subscriptionId: string | null; // 🆕 ID de la subscription
}

export function useUserAccess(): UserAccess {
  const [pack, setPack] = useState<Pack>(null);
  const [packExpiresAt, setPackExpiresAt] = useState<string | null>(null);
  const [rdvExpertTotal, setRdvExpertTotal] = useState(0);
  const [rdvExpertUtilises, setRdvExpertUtilises] = useState(0);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchUserAccess() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setLoading(false);
          return;
        }

        // 1️⃣ Récupérer l'ID utilisateur
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', session.user.id)
          .single();

        if (!userData) {
          setLoading(false);
          return;
        }

        // 2️⃣ Récupérer la subscription active
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userData.id)
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString().split('T')[0]) // Pas expirée
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (subscription) {
          setPack(subscription.pack_type as Pack);
          setPackExpiresAt(subscription.end_date);
          setRdvExpertTotal(subscription.rdv_expert_included || 0);
          setRdvExpertUtilises(subscription.rdv_expert_used || 0);
          setSubscriptionId(subscription.id);
        } else {
          // Pas de subscription active, vérifier si l'ancien système existe
          const { data: oldUserData } = await supabase
            .from('users')
            .select('pack, pack_expires_at')
            .eq('auth_id', session.user.id)
            .single();

          if (oldUserData?.pack) {
            // Migration de l'ancien système vers le nouveau
            if (oldUserData.pack_expires_at) {
              const expiresAt = new Date(oldUserData.pack_expires_at);
              if (expiresAt < new Date()) {
                // Expiré
                setPack(null);
              } else {
                setPack(oldUserData.pack as Pack);
                setPackExpiresAt(oldUserData.pack_expires_at);
              }
            } else {
              setPack(oldUserData.pack as Pack);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user access:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAccess();
  }, [supabase]);

  // Types de packs
  const hasFormationCreateur = pack === 'FORMATION_CREATEUR';
  const hasFormationAgentImmo = pack === 'FORMATION_AGENT_IMMO';
  const hasFormationPack = hasFormationCreateur || hasFormationAgentImmo;
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

  // RDV Expert
  const rdvExpertRestants = Math.max(0, rdvExpertTotal - rdvExpertUtilises);

  const hasAccess = {
    // ✅ Accessible à TOUS (même sans pack)
    tutosPratiques: true,
    ateliers: true,
    ateliersArchives: true,
    coachings: true, // 🔄 CHANGÉ - Maintenant accessible à tous
    coachingsArchives: true, // 🔄 CHANGÉ - Maintenant accessible à tous
    simulateurs: true,
    expertPayant: true,
    partenaire: true, // 🆕 NOUVEAU - Accessible à TOUS

    // ✅ Formations spécifiques
    formationCreateur: hasFormationCreateur,
    formationAgentImmo: hasFormationAgentImmo,
    
    // ✅ Formations accompagnement (contenu exclusif STARTER/PRO/EXPERT)
    formationsAccompagnement: hasAccompagnement,

    // ✅ Accompagnement UNIQUEMENT
    creationSociete: hasAccompagnement,
    monDossier: hasAccompagnement,
    rdvGratuit: hasAccompagnement,
    messagerie: hasAccompagnement,

    // ✅ RDV Expert
    rdvExpertTotal,
    rdvExpertUtilises,
    rdvExpertRestants,
  };

  return {
    pack,
    hasAccess,
    loading,
    packDuration,
    daysRemaining,
    subscriptionId,
  };
}