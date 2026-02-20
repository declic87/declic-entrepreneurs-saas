interface ContractParams {
    firstName: string;
    lastName: string;
    email: string;
    packType: string;
    packPrice: number;
    createdAt: string;
  }
  
  export function generateContract(params: ContractParams): string {
    const templates: Record<string, (p: ContractParams) => string> = {
      plateforme: generatePlatformeContract,
      createur: generateCreateurContract,
      agent_immo: generateAgentImmoContract,
      starter: generateStarterContract,
      pro: generateProContract,
      expert: generateExpertContract,
    };
  
    const generator = templates[params.packType] || generatePlatformeContract;
    return generator(params);
  }
  
  function generatePlatformeContract(params: ContractParams): string {
    return `
  CONTRAT D'ABONNEMENT - PACK PLATEFORME
  
  Entre les soussignés :
  
  DÉCLIC ENTREPRENEURS
  Société par actions simplifiée
  Siège social : [Adresse]
  SIRET : [SIRET]
  
  Ci-après dénommée « le Prestataire »
  
  D'une part,
  
  Et
  
  ${params.firstName} ${params.lastName}
  Email : ${params.email}
  
  Ci-après dénommé « le Client »
  
  D'autre part,
  
  IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :
  
  ARTICLE 1 - OBJET
  
  Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire fournit au Client un accès à la plateforme DÉCLIC Entrepreneurs - Pack Plateforme.
  
  ARTICLE 2 - SERVICES INCLUS
  
  Le Pack Plateforme comprend :
  - Accès illimité aux tutoriels vidéo
  - Coaching hebdomadaire collectif
  - Participation aux ateliers en direct
  - Accès au réseau de partenaires
  - Utilisation du simulateur fiscal
  - Support par messagerie
  
  ARTICLE 3 - DURÉE ET TARIFICATION
  
  Durée : Accès mensuel renouvelable
  Tarif : ${params.packPrice}€ HT / mois
  Date de souscription : ${new Date(params.createdAt).toLocaleDateString('fr-FR')}
  
  ARTICLE 4 - OBLIGATIONS DU CLIENT
  
  Le Client s'engage à :
  - Fournir des informations exactes et à jour
  - Utiliser les services dans le respect de la législation en vigueur
  - Ne pas partager ses identifiants d'accès
  - Régler les sommes dues aux échéances convenues
  
  ARTICLE 5 - OBLIGATIONS DU PRESTATAIRE
  
  Le Prestataire s'engage à :
  - Fournir un accès continu à la plateforme
  - Assurer la mise à jour régulière des contenus
  - Garantir la confidentialité des données du Client
  - Fournir un support technique réactif
  
  ARTICLE 6 - RÉSILIATION
  
  Le présent contrat peut être résilié par le Client à tout moment avec un préavis de 30 jours.
  Le Prestataire peut résilier en cas de non-paiement ou de manquement grave aux obligations contractuelles.
  
  ARTICLE 7 - CONFIDENTIALITÉ
  
  Les parties s'engagent à préserver la confidentialité de toutes les informations échangées dans le cadre de l'exécution du présent contrat.
  
  ARTICLE 8 - PROTECTION DES DONNÉES
  
  Le Prestataire s'engage à traiter les données personnelles du Client conformément au RGPD.
  
  ARTICLE 9 - LOI APPLICABLE
  
  Le présent contrat est soumis au droit français.
  
  Fait en deux exemplaires,
  
  À [Ville], le ${new Date(params.createdAt).toLocaleDateString('fr-FR')}
  
  Le Prestataire                    Le Client
  DÉCLIC ENTREPRENEURS              ${params.firstName} ${params.lastName}
    `.trim();
  }
  
  function generateCreateurContract(params: ContractParams): string {
    return `
  CONTRAT DE FORMATION - FORMATION CRÉATEUR D'ENTREPRISE
  
  [Structure similaire avec contenus spécifiques Formation Créateur]
  
  ARTICLE 2 - PROGRAMME DE FORMATION
  
  La formation "Créateur d'Entreprise" comprend :
  - 15 modules vidéo complets
  - Support de cours téléchargeables
  - 3 sessions de coaching personnalisées
  - Accès communauté privée
  - Templates et documents prêts à l'emploi
  - Support illimité par messagerie
  
  ARTICLE 3 - TARIFICATION
  
  Tarif unique : ${params.packPrice}€ HT
  Accès à vie aux contenus
  Date de souscription : ${new Date(params.createdAt).toLocaleDateString('fr-FR')}
  
  [Suite du contrat...]
    `.trim();
  }
  
  function generateAgentImmoContract(params: ContractParams): string {
    return `
  CONTRAT DE FORMATION - FORMATION AGENT IMMOBILIER
  
  [Structure similaire avec contenus spécifiques Agent Immo]
  
  ARTICLE 2 - PROGRAMME DE FORMATION
  
  La formation "Agent Immobilier" comprend :
  - Formation complète au statut Agent Commercial Immobilier
  - 20 modules vidéo spécialisés
  - Accompagnement création de structure
  - Outils marketing et prospection
  - Réseau de mandants partenaires
  - Modèles de contrats et documents légaux
  
  ARTICLE 3 - TARIFICATION
  
  Tarif unique : ${params.packPrice}€ HT
  Date de souscription : ${new Date(params.createdAt).toLocaleDateString('fr-FR')}
  
  [Suite du contrat...]
    `.trim();
  }
  
  function generateStarterContract(params: ContractParams): string {
    return `
  CONTRAT D'ACCOMPAGNEMENT - PACK STARTER
  
  ARTICLE 2 - SERVICES INCLUS
  
  Le Pack Starter comprend :
  - Tous les services du Pack Plateforme
  - 3 rendez-vous experts personnalisés (60 min)
  - Suivi mensuel personnalisé
  - Priorité sur le support
  - Accès anticipé aux nouveautés
  
  ARTICLE 3 - TARIFICATION
  
  Tarif unique : ${params.packPrice}€ HT
  Date de souscription : ${new Date(params.createdAt).toLocaleDateString('fr-FR')}
  
  [Suite du contrat...]
    `.trim();
  }
  
  function generateProContract(params: ContractParams): string {
    return `
  CONTRAT D'ACCOMPAGNEMENT - PACK PRO
  
  ARTICLE 2 - SERVICES INCLUS
  
  Le Pack Pro comprend :
  - Tous les services du Pack Starter
  - 6 rendez-vous experts personnalisés (60 min)
  - Accès à toutes les formations
  - Accompagnement prioritaire
  - Audit fiscal personnalisé
  - Plan d'optimisation sur mesure
  
  ARTICLE 3 - TARIFICATION
  
  Tarif unique : ${params.packPrice}€ HT
  Date de souscription : ${new Date(params.createdAt).toLocaleDateString('fr-FR')}
  
  [Suite du contrat...]
    `.trim();
  }
  
  function generateExpertContract(params: ContractParams): string {
    return `
  CONTRAT D'ACCOMPAGNEMENT VIP - PACK EXPERT
  
  ARTICLE 2 - SERVICES INCLUS
  
  Le Pack Expert comprend :
  - Accompagnement VIP complet
  - 12 rendez-vous experts personnalisés illimités
  - Toutes les formations incluses
  - Support prioritaire 7j/7
  - Coaching individualisé
  - Ligne directe avec un expert dédié
  - Audit fiscal et juridique complet
  - Suivi mensuel personnalisé
  - Accès exclusif aux événements VIP
  
  ARTICLE 3 - TARIFICATION
  
  Tarif unique : ${params.packPrice}€ HT
  Date de souscription : ${new Date(params.createdAt).toLocaleDateString('fr-FR')}
  
  [Suite du contrat...]
    `.trim();
  }