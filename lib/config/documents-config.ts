// lib/config/documents-config.ts

export type CompanyType = 
  | 'SASU' 
  | 'SAS' 
  | 'SARL' 
  | 'EURL' 
  | 'SCI'
  | 'SELARL'
  | 'SELARLU'
  | 'SELAS'
  | 'SELASU'
  | 'SPFPL-SELARL'
  | 'SPFPL-SELAS'
  | 'SPFPL-SAS'
  | 'SPFPL-SARL'
  | 'Auto-Entrepreneur';

export type ProfessionReglementee = 
  | 'medecin'
  | 'architecte'
  | 'avocat'
  | 'expert_comptable'
  | 'kine'
  | 'infirmier'
  | 'dentiste'
  | 'veterinaire';

export interface DocumentTemplate {
  type: string;
  label: string;
  template: string; // Chemin relatif depuis public/templates/
}

export const PROFESSIONS_REGLEMENTEES: Record<ProfessionReglementee, {
  label: string;
  ordre: string;
  code_legal: string;
}> = {
  medecin: {
    label: 'Médecin',
    ordre: "l'Ordre des Médecins",
    code_legal: 'Code de la santé publique (articles L.4111-1 et suivants)',
  },
  architecte: {
    label: 'Architecte',
    ordre: "l'Ordre des Architectes",
    code_legal: 'Loi du 3 janvier 1977 sur l\'architecture',
  },
  avocat: {
    label: 'Avocat',
    ordre: 'le Barreau',
    code_legal: 'Loi n°71-1130 du 31 décembre 1971',
  },
  expert_comptable: {
    label: 'Expert-comptable',
    ordre: "l'Ordre des Experts-Comptables",
    code_legal: 'Ordonnance n°45-2138 du 19 septembre 1945',
  },
  kine: {
    label: 'Masseur-Kinésithérapeute',
    ordre: "l'Ordre des Masseurs-Kinésithérapeutes",
    code_legal: 'Code de la santé publique (articles L.4321-1 et suivants)',
  },
  infirmier: {
    label: 'Infirmier',
    ordre: "l'Ordre des Infirmiers",
    code_legal: 'Code de la santé publique (articles L.4311-1 et suivants)',
  },
  dentiste: {
    label: 'Chirurgien-dentiste',
    ordre: "l'Ordre des Chirurgiens-Dentistes",
    code_legal: 'Code de la santé publique (articles L.4141-1 et suivants)',
  },
  veterinaire: {
    label: 'Vétérinaire',
    ordre: "l'Ordre des Vétérinaires",
    code_legal: 'Code rural et de la pêche maritime (articles L.241-1 et suivants)',
  },
};

// Documents communs à tous les statuts
const DOCUMENTS_COMMUNS: DocumentTemplate[] = [
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

// Documents spécifiques par statut
export const DOCUMENTS_BY_STATUT: Record<CompanyType, DocumentTemplate[]> = {
  // ========== SASU (Associé unique) ==========
  SASU: [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_sasu',
      label: 'Statuts SASU',
      template: 'SASU/statuts_sasu.docx',
    },
    {
      type: 'pv_decision_unique',
      label: 'Procès-verbal de décision unique',
      template: 'SASU/pv_decision_unique.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription et versement',
      template: 'SASU/attestation_souscription.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SASU/declaration_beneficiaires.docx',
    },
  ],

  // ========== SAS (Multi-associés) ==========
  SAS: [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_sas',
      label: 'Statuts SAS',
      template: 'SAS/statuts_sas.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: 'Procès-verbal d\'assemblée générale constitutive',
      template: 'SAS/pv_agm_constitutive.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription et versement',
      template: 'SAS/attestation_souscription.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SAS/declaration_beneficiaires.docx',
    },
  ],

  // ========== SARL (Multi-associés) ==========
  SARL: [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_sarl',
      label: 'Statuts SARL',
      template: 'SARL/statuts_sarl.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: 'Procès-verbal d\'assemblée générale constitutive',
      template: 'SARL/pv_agm_constitutive.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription et versement',
      template: 'SARL/attestation_souscription.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SARL/declaration_beneficiaires.docx',
    },
  ],

  // ========== EURL (Associé unique) ==========
  EURL: [
    ...DOCUMENTS_COMMUNS,
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
      type: 'attestation_souscription',
      label: 'Attestation de souscription et versement',
      template: 'EURL/attestation_souscription.docx',
    },
  ],

  // ========== SCI (Multi-associés) ==========
  SCI: [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_sci',
      label: 'Statuts SCI',
      template: 'SCI/statuts_sci.docx',
    },
    {
      type: 'pv_constitution',
      label: 'Procès-verbal de constitution',
      template: 'SCI/pv_constitution.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription et libération',
      template: 'SCI/attestation_souscription.docx',
    },
  ],

  // ========== SELARL (Multi-associés + Profession réglementée) ==========
  SELARL: [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_selarl',
      label: 'Statuts SELARL',
      template: 'SELARL/statuts_selarl.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: 'Procès-verbal d\'assemblée générale constitutive',
      template: 'SELARL/pv_agm_constitutive.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription et versement',
      template: 'SELARL/attestation_souscription.docx',
    },
    {
      type: 'attestation_inscription_ordre',
      label: 'Attestation d\'inscription à l\'ordre professionnel',
      template: 'SELARL/attestation_inscription_ordre.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SELARL/declaration_beneficiaires.docx',
    },
  ],

  // ========== SELARLU (Associé unique + Profession réglementée) ==========
  SELARLU: [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_selarlu',
      label: 'Statuts SELARLU',
      template: 'SELARLU/statuts_selarlu.docx',
    },
    {
      type: 'pv_decision_unique',
      label: 'Procès-verbal de décision unique',
      template: 'SELARLU/pv_decision_unique.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription et versement',
      template: 'SELARLU/attestation_souscription.docx',
    },
    {
      type: 'attestation_inscription_ordre',
      label: 'Attestation d\'inscription à l\'ordre professionnel',
      template: 'SELARLU/attestation_inscription_ordre.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SELARLU/declaration_beneficiaires.docx',
    },
  ],

  // ========== SELAS (Multi-associés + Profession réglementée) ==========
  SELAS: [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_selas',
      label: 'Statuts SELAS',
      template: 'SELAS/statuts_selas.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: 'Procès-verbal d\'assemblée générale constitutive',
      template: 'SELAS/pv_agm_constitutive.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription et versement',
      template: 'SELAS/attestation_souscription.docx',
    },
    {
      type: 'attestation_inscription_ordre',
      label: 'Attestation d\'inscription à l\'ordre professionnel',
      template: 'SELAS/attestation_inscription_ordre.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SELAS/declaration_beneficiaires.docx',
    },
  ],

  // ========== SELASU (Associé unique + Profession réglementée) ==========
  SELASU: [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_selasu',
      label: 'Statuts SELASU',
      template: 'SELASU/statuts_selasu.docx',
    },
    {
      type: 'pv_decision_unique',
      label: 'Procès-verbal de décision unique',
      template: 'SELASU/pv_decision_unique.docx',
    },
    {
      type: 'attestation_souscription',
      label: 'Attestation de souscription et versement',
      template: 'SELASU/attestation_souscription.docx',
    },
    {
      type: 'attestation_inscription_ordre',
      label: 'Attestation d\'inscription à l\'ordre professionnel',
      template: 'SELASU/attestation_inscription_ordre.docx',
    },
    {
      type: 'declaration_beneficiaires',
      label: 'Déclaration des bénéficiaires effectifs',
      template: 'SELASU/declaration_beneficiaires.docx',
    },
  ],

  // ========== SPFPL (Sociétés de Participations Financières de Professions Libérales) ==========
  'SPFPL-SELARL': [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_spfpl_selarl',
      label: 'Statuts SPFPL-SELARL',
      template: 'SPFPL/statuts_spfpl_selarl.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: 'Procès-verbal d\'assemblée générale constitutive',
      template: 'SPFPL/pv_agm_constitutive_selarl.docx',
    },
  ],

  'SPFPL-SELAS': [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_spfpl_selas',
      label: 'Statuts SPFPL-SELAS',
      template: 'SPFPL/statuts_spfpl_selas.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: 'Procès-verbal d\'assemblée générale constitutive',
      template: 'SPFPL/pv_agm_constitutive_selas.docx',
    },
  ],

  'SPFPL-SAS': [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_spfpl_sas',
      label: 'Statuts SPFPL-SAS',
      template: 'SPFPL/statuts_spfpl_sas.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: 'Procès-verbal d\'assemblée générale constitutive',
      template: 'SPFPL/pv_agm_constitutive_sas.docx',
    },
  ],

  'SPFPL-SARL': [
    ...DOCUMENTS_COMMUNS,
    {
      type: 'statuts_spfpl_sarl',
      label: 'Statuts SPFPL-SARL',
      template: 'SPFPL/statuts_spfpl_sarl.docx',
    },
    {
      type: 'pv_agm_constitutive',
      label: 'Procès-verbal d\'assemblée générale constitutive',
      template: 'SPFPL/pv_agm_constitutive_sarl.docx',
    },
  ],

  // ========== Auto-Entrepreneur ==========
  'Auto-Entrepreneur': [
    {
      type: 'declaration_auto_entrepreneur',
      label: 'Déclaration de début d\'activité',
      template: 'Auto-Entrepreneur/declaration_debut_activite.docx',
    },
  ],
};

// ========== HELPERS ==========

export function getDocumentsForStatut(
  companyType: CompanyType,
  profession?: ProfessionReglementee
): DocumentTemplate[] {
  const docs = DOCUMENTS_BY_STATUT[companyType] || [];
  
  // Si c'est une SEL, vérifier que la profession est fournie
  if (['SELARL', 'SELARLU', 'SELAS', 'SELASU'].includes(companyType) && !profession) {
    console.warn(`Profession requise pour ${companyType} mais non fournie`);
  }
  
  return docs;
}

export function getProfessionLabel(profession: ProfessionReglementee): string {
  return PROFESSIONS_REGLEMENTEES[profession]?.label || profession;
}

export function getProfessionOrdre(profession: ProfessionReglementee): string {
  return PROFESSIONS_REGLEMENTEES[profession]?.ordre || '';
}

export function getProfessionCode(profession: ProfessionReglementee): string {
  return PROFESSIONS_REGLEMENTEES[profession]?.code_legal || '';
}

export function requiresMultipleAssocies(companyType: CompanyType): boolean {
  return ['SAS', 'SARL', 'SCI', 'SELAS', 'SELARL'].includes(companyType);
}

export function requiresProfession(companyType: CompanyType): boolean {
  return ['SELARL', 'SELARLU', 'SELAS', 'SELASU'].includes(companyType);
}