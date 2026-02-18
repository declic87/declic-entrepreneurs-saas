// Configuration complète des packs et tarifs

export const PACKS_CONFIG = {
    // PACKS CLIENTS
    client: {
      plateforme: {
        name: "Plateforme",
        price: 97,
        duration: "monthly",
        description: "Accès formations + simulateur",
        features: [
          "Accès à toutes les formations",
          "Simulateur de création",
          "Support email",
        ],
      },
      formation_createur: {
        name: "Formation Créateur",
        price: 497,
        duration: "3 mois",
        description: "Coaching création entreprise",
        features: [
          "3 mois de coaching personnalisé",
          "Accès formations créateur",
          "Support prioritaire",
          "Groupe privé",
        ],
      },
      formation_agent_immo: {
        name: "Formation Agent Immo",
        price: 897,
        duration: "3 mois",
        description: "Coaching spécialisé immobilier",
        features: [
          "3 mois de coaching spécialisé immo",
          "Formations agent immobilier",
          "Templates documents immo",
          "Support prioritaire",
        ],
      },
      accompagnement_starter: {
        name: "Accompagnement Starter",
        price: 3600,
        duration: "6 mois",
        description: "Accompagnement complet 6 mois",
        features: [
          "6 mois d'accompagnement",
          "Toutes les formations",
          "Expert dédié",
          "Frais de débours inclus",
          "Documents juridiques",
          "Support WhatsApp",
        ],
      },
      accompagnement_pro: {
        name: "Accompagnement Pro",
        price: 4600,
        duration: "12 mois",
        description: "Accompagnement complet 12 mois",
        features: [
          "12 mois d'accompagnement",
          "Toutes les formations",
          "Expert dédié",
          "Frais de débours inclus",
          "Documents juridiques",
          "Support WhatsApp prioritaire",
          "Coaching mensuel",
        ],
      },
      accompagnement_expert: {
        name: "Accompagnement Expert",
        price: 6600,
        duration: "18 mois",
        description: "Accompagnement premium 18 mois",
        features: [
          "18 mois d'accompagnement VIP",
          "Toutes les formations",
          "Expert dédié premium",
          "Frais de débours inclus",
          "Documents juridiques premium",
          "Support WhatsApp VIP",
          "Coaching bi-mensuel",
          "Accès réseau entrepreneurs",
        ],
      },
    },
  
    // PACKS PRESTATAIRES
    prestataire: {
      closer: {
        name: "Contrat Prestataire Closer",
        commission_rate: 10,
        commission_type: "HT sur encaissements",
        description: "Commission sur chaque vente close",
      },
      setter: {
        name: "Contrat Prestataire Setter",
        commission_rate_min: 2,
        commission_rate_max: 5,
        commission_type: "HT sur encaissements",
        description: "Commission variable selon performance",
      },
      expert: {
        name: "Contrat Prestataire Expert",
        commission_rate: 10,
        commission_type: "HT sur encaissements",
        description: "Commission sur accompagnements",
      },
      hos: {
        name: "Contrat Prestataire HOS",
        commission_rate: 10,
        commission_type: "HT sur encaissements",
        description: "Commission sur équipe commerciale",
      },
    },
  };
  
  // Helper pour obtenir un pack
  export function getPackConfig(type: 'client' | 'prestataire', packName: string) {
    return PACKS_CONFIG[type][packName as keyof typeof PACKS_CONFIG[typeof type]];
  }
  
  // Helper pour formatter le prix
  export function formatPrice(price: number, duration?: string) {
    if (duration === 'monthly') {
      return `${price}€/mois`;
    }
    return `${price}€ TTC`;
  }