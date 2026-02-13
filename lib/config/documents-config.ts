// Configuration complète des documents par statut juridique

export const PROFESSIONS_REGLEMENTEES = [
  'medecin',
  'architecte',
  'avocat',
  'expert_comptable',
  'kine',
  'infirmier',
  'dentiste',
  'veterinaire',
] as const;

export type ProfessionReglementee = typeof PROFESSIONS_REGLEMENTEES[number];

export const PROFESSIONS_LABELS: Record<ProfessionReglementee, string> = {
  medecin: 'Médecin',
  architecte: 'Architecte',
  avocat: 'Avocat',
  expert_comptable: 'Expert-comptable',
  kine: 'Masseur-Kinésithérapeute',
  infirmier: 'Infirmier',
  dentiste: 'Chirurgien-dentiste',
  veterinaire: 'Vétérinaire',
};

export const PROFESSIONS_ORDRES: Record<ProfessionReglementee, string> = {
  medecin: "Ordre des Médecins",
  architecte: "Ordre des Architectes",
  avocat: "Barreau",
  expert_comptable: "Ordre des Experts-Comptables",
  kine: "Ordre des Masseurs-Kinésithérapeutes",
  infirmier: "Ordre des Infirmiers",
  dentiste: "Ordre des Chirurgiens-Dentistes",
  veterinaire: "Ordre des Vétérinaires",
};

export const PROFESSIONS_CODES_SANTE: Record<ProfessionReglementee, string> = {
  medecin: "Code de la santé publique, articles L.4161-1 et suivants",
  kine: "Code de la santé publique, articles L.4321-1 et suivants",
  infirmier: "Code de la santé publique, articles L.4311-1 et suivants",
  dentiste: "Code de la santé publique, articles L.4141-1 et suivants",
  veterinaire: "Code rural et de la pêche maritime, articles L.241-1 et suivants",
  architecte: "Loi du 3 janvier 1977 sur l'architecture",
  avocat: "Loi n°71-1130 du 31 décembre 1971",
  expert_comptable: "Ordonnance n°45-2138 du 19 septembre 1945",
};

// Documents communs à tous les statuts
export const DOCUMENTS_COMMUNS = [
  {
    type: 'attestation_domiciliation',
    label: 'Attestation de domiciliation',
    template: 'communs/attestation_domiciliation.docx',
  },
  {
    type: 'attestation_non_condamnation',
    label: 'Attestation de non-condamnation',
    template: 'communs/attestation_non_condamnation.docx',
  },
  {
    type: 'etat_actes_accomplis',
    label: 'État des actes accomplis',
    template: 'communs/etat_actes_accomplis.docx',
  },
];

// Configuration des documents par statut
export const DOCUMENTS_BY_STATUT: Record<string, Array<{
  type: string;
  label: string;
  template: string;
  requiresProfession?: boolean;
}>> = {
  // ========== SASU ==========
  SASU: [
    {
      type: 'statuts_sasu',
      label: 'Statuts SASU',
      template: 'SASU/statuts_sasu.docx',
    },
    {
      type: 'pv_decision_unique',
      label: 'PV de décision unique',
      template: 'SASU/pv_decision_unique.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription du capital',
      template: 'SASU/attestation_souscription.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SASU/declaration_beneficiaires.docx',
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SASU',
      template: 'SASU/formulaire_m0.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== SAS ==========
  SAS: [
    {
      type: 'statuts_sas',
      label: 'Statuts SAS',
      template: 'SAS/statuts_sas.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: "PV d'assemblée générale constitutive",
      template: 'SAS/pv_agm_constitutive.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription du capital',
      template: 'SAS/attestation_souscription.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SAS/declaration_beneficiaires.docx',
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SAS',
      template: 'SAS/formulaire_m0.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== SARL ==========
  SARL: [
    {
      type: 'statuts_sarl',
      label: 'Statuts SARL',
      template: 'SARL/statuts_sarl.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: "PV d'assemblée générale constitutive",
      template: 'SARL/pv_agm_constitutive.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SARL/declaration_beneficiaires.docx',
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SARL',
      template: 'SARL/formulaire_m0.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== EURL ==========
  EURL: [
    {
      type: 'statuts_eurl',
      label: 'Statuts EURL',
      template: 'EURL/statuts_eurl.docx',
    },
    {
      type: 'declaration_gerance',
      label: 'Déclaration de gérance',
      template: 'EURL/declaration_gerance.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'EURL/declaration_beneficiaires.docx',
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 EURL',
      template: 'EURL/formulaire_m0.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== SCI ==========
  SCI: [
    {
      type: 'statuts_sci',
      label: 'Statuts SCI',
      template: 'SCI/statuts_sci.docx',
    },
    {
      type: 'pv_constitution',
      label: 'PV de constitution',
      template: 'SCI/pv_constitution.docx',
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SCI',
      template: 'SCI/formulaire_m0.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== SELARL ==========
  SELARL: [
    {
      type: 'statuts_selarl',
      label: 'Statuts SELARL',
      template: 'SEL/statuts_selarl.docx',
      requiresProfession: true,
    },
    {
      type: 'pv_agm_constitutive',
      label: "PV d'assemblée générale constitutive",
      template: 'SEL/pv_agm_constitutive_selarl.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SEL/declaration_beneficiaires.docx',
    },
    {
      type: 'attestation_inscription_ordre',
      label: "Attestation d'inscription à l'ordre professionnel",
      template: 'SEL/attestation_inscription_ordre.docx',
      requiresProfession: true,
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SELARL',
      template: 'SEL/formulaire_m0_selarl.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== SELARLU ==========
  SELARLU: [
    {
      type: 'statuts_selarlu',
      label: 'Statuts SELARLU',
      template: 'SEL/statuts_selarlu.docx',
      requiresProfession: true,
    },
    {
      type: 'pv_decision_unique',
      label: 'PV de décision unique',
      template: 'SEL/pv_decision_unique_selarlu.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SEL/declaration_beneficiaires.docx',
    },
    {
      type: 'attestation_inscription_ordre',
      label: "Attestation d'inscription à l'ordre professionnel",
      template: 'SEL/attestation_inscription_ordre.docx',
      requiresProfession: true,
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SELARLU',
      template: 'SEL/formulaire_m0_selarlu.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== SELAS ==========
  SELAS: [
    {
      type: 'statuts_selas',
      label: 'Statuts SELAS',
      template: 'SEL/statuts_selas.docx',
      requiresProfession: true,
    },
    {
      type: 'pv_agm_constitutive',
      label: "PV d'assemblée générale constitutive",
      template: 'SEL/pv_agm_constitutive_selas.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription du capital',
      template: 'SEL/attestation_souscription.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SEL/declaration_beneficiaires.docx',
    },
    {
      type: 'attestation_inscription_ordre',
      label: "Attestation d'inscription à l'ordre professionnel",
      template: 'SEL/attestation_inscription_ordre.docx',
      requiresProfession: true,
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SELAS',
      template: 'SEL/formulaire_m0_selas.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== SELASU ==========
  SELASU: [
    {
      type: 'statuts_selasu',
      label: 'Statuts SELASU',
      template: 'SEL/statuts_selasu.docx',
      requiresProfession: true,
    },
    {
      type: 'pv_decision_unique',
      label: 'PV de décision unique',
      template: 'SEL/pv_decision_unique_selasu.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription du capital',
      template: 'SEL/attestation_souscription.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SEL/declaration_beneficiaires.docx',
    },
    {
      type: 'attestation_inscription_ordre',
      label: "Attestation d'inscription à l'ordre professionnel",
      template: 'SEL/attestation_inscription_ordre.docx',
      requiresProfession: true,
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SELASU',
      template: 'SEL/formulaire_m0_selasu.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== SPFPL-SELARL ==========
  'SPFPL-SELARL': [
    {
      type: 'statuts_spfpl_selarl',
      label: 'Statuts SPFPL-SELARL',
      template: 'SPFPL/statuts_spfpl_selarl.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: "PV d'assemblée générale constitutive",
      template: 'SPFPL/pv_agm_constitutive.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SPFPL/declaration_beneficiaires.docx',
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SPFPL',
      template: 'SPFPL/formulaire_m0.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== SPFPL-SELAS ==========
  'SPFPL-SELAS': [
    {
      type: 'statuts_spfpl_selas',
      label: 'Statuts SPFPL-SELAS',
      template: 'SPFPL/statuts_spfpl_selas.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: "PV d'assemblée générale constitutive",
      template: 'SPFPL/pv_agm_constitutive.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SPFPL/declaration_beneficiaires.docx',
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SPFPL',
      template: 'SPFPL/formulaire_m0.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== SPFPL-SAS ==========
  'SPFPL-SAS': [
    {
      type: 'statuts_spfpl_sas',
      label: 'Statuts SPFPL-SAS',
      template: 'SPFPL/statuts_spfpl_sas.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: "PV d'assemblée générale constitutive",
      template: 'SPFPL/pv_agm_constitutive.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SPFPL/declaration_beneficiaires.docx',
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SPFPL',
      template: 'SPFPL/formulaire_m0.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== SPFPL-SARL ==========
  'SPFPL-SARL': [
    {
      type: 'statuts_spfpl_sarl',
      label: 'Statuts SPFPL-SARL',
      template: 'SPFPL/statuts_spfpl_sarl.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: "PV d'assemblée générale constitutive",
      template: 'SPFPL/pv_agm_constitutive.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SPFPL/declaration_beneficiaires.docx',
    },
    {
      type: 'formulaire_m0',
      label: 'Formulaire M0 SPFPL',
      template: 'SPFPL/formulaire_m0.docx',
    },
    ...DOCUMENTS_COMMUNS,
  ],

  // ========== AUTO-ENTREPRENEUR ==========
  'Auto-Entrepreneur': [
    {
      type: 'declaration_debut_activite',
      label: "Déclaration de début d'activité (P0)",
      template: 'Auto-Entrepreneur/declaration_debut_activite.docx',
    },
  ],
};

// Fonction helper pour récupérer les documents d'un statut
export function getDocumentsForStatut(statut: string, profession?: ProfessionReglementee) {
  const docs = DOCUMENTS_BY_STATUT[statut] || [];
  
  return docs.map(doc => ({
    ...doc,
    profession: doc.requiresProfession ? profession : undefined,
  }));
}

// Fonction pour obtenir le label d'une profession
export function getProfessionLabel(profession: ProfessionReglementee): string {
  return PROFESSIONS_LABELS[profession] || profession;
}

// Fonction pour obtenir l'ordre d'une profession
export function getProfessionOrdre(profession: ProfessionReglementee): string {
  return PROFESSIONS_ORDRES[profession] || "Ordre professionnel";
}

// Fonction pour obtenir le code légal d'une profession
export function getProfessionCode(profession: ProfessionReglementee): string {
  return PROFESSIONS_CODES_SANTE[profession] || "";
}

// Fonction pour vérifier si un statut nécessite plusieurs associés
export function requiresMultipleAssocies(companyType: string): boolean {
  return ['SAS', 'SARL', 'SCI', 'SELAS', 'SELARL'].includes(companyType);
}

// Fonction pour vérifier si un statut nécessite une profession
export function requiresProfession(companyType: string): boolean {
  return ['SELARL', 'SELARLU', 'SELAS', 'SELASU'].includes(companyType);
}