'use client';

import { useState } from 'react';
import { Check, Clock, FileText, AlertCircle, User, Building, Briefcase, DollarSign, Calendar, Info } from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: string;
  question: string;
  required: boolean;
  checked: boolean;
  notes: string;
  info?: string;
}

export default function ExpertRDVTemplateCompletPage() {
  const [clientName, setClientName] = useState('');
  const [rdvDate, setRdvDate] = useState('');
  const [duration, setDuration] = useState(90); // 1h30 pour RDV complet
  const [fathomRecording, setFathomRecording] = useState(false);
  
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    // 1. INFORMATIONS PERSONNELLES
    { id: '1.1', category: '👤 Informations Personnelles', question: 'Nom, prénom, date et lieu de naissance', required: true, checked: false, notes: '' },
    { id: '1.2', category: '👤 Informations Personnelles', question: 'Adresse personnelle complète', required: true, checked: false, notes: '' },
    { id: '1.3', category: '👤 Informations Personnelles', question: 'Téléphone et email', required: true, checked: false, notes: '' },
    { id: '1.4', category: '👤 Informations Personnelles', question: 'Situation familiale (marié, pacsé, célibataire, régime matrimonial)', required: true, checked: false, notes: '', info: 'Séparation de biens recommandée pour entrepreneurs' },
    { id: '1.5', category: '👤 Informations Personnelles', question: 'Nombre d\'enfants à charge et âges', required: false, checked: false, notes: '' },
    { id: '1.6', category: '👤 Informations Personnelles', question: 'Nationalité(s)', required: true, checked: false, notes: '', info: 'Important pour certaines activités réglementées' },

    // 2. SITUATION PROFESSIONNELLE ACTUELLE
    { id: '2.1', category: '💼 Situation Professionnelle', question: 'Statut actuel (salarié, indépendant, demandeur d\'emploi, autre)', required: true, checked: false, notes: '' },
    { id: '2.2', category: '💼 Situation Professionnelle', question: 'Si salarié : employeur, poste, salaire brut mensuel, ancienneté', required: false, checked: false, notes: '' },
    { id: '2.3', category: '💼 Situation Professionnelle', question: 'Clause de non-concurrence ? Secteur interdit ? Durée ?', required: true, checked: false, notes: '', info: 'Vérifier compatibilité avec activité envisagée' },
    { id: '2.4', category: '💼 Situation Professionnelle', question: 'Préavis à respecter ? Démission ou rupture conventionnelle ?', required: true, checked: false, notes: '' },
    { id: '2.5', category: '💼 Situation Professionnelle', question: 'Date de fin de contrat prévue / disponibilité', required: false, checked: false, notes: '' },
    { id: '2.6', category: '💼 Situation Professionnelle', question: 'Droits ARE Pôle Emploi ? Montant ? Durée restante ?', required: false, checked: false, notes: '', info: 'Maintien ARE possible sous conditions' },

    // 3. PROJET D'ENTREPRISE
    { id: '3.1', category: '🚀 Projet Entreprise', question: 'Activité envisagée (description précise)', required: true, checked: false, notes: '' },
    { id: '3.2', category: '🚀 Projet Entreprise', question: 'Code APE / NAF pressenti', required: false, checked: false, notes: '' },
    { id: '3.3', category: '🚀 Projet Entreprise', question: 'Activité réglementée ? Diplômes/qualifications nécessaires ?', required: true, checked: false, notes: '', info: 'Certaines activités nécessitent autorisation/qualification' },
    { id: '3.4', category: '🚀 Projet Entreprise', question: 'Clients cibles (B2B, B2C, B2B2C)', required: true, checked: false, notes: '' },
    { id: '3.5', category: '🚀 Projet Entreprise', question: 'Concurrence existante ? USP (proposition de valeur unique) ?', required: false, checked: false, notes: '' },
    { id: '3.6', category: '🚀 Projet Entreprise', question: 'Date de début d\'activité souhaitée', required: true, checked: false, notes: '' },

    // 4. FORME JURIDIQUE ET ASSOCIÉS
    { id: '4.1', category: '⚖️ Forme Juridique', question: 'Forme juridique souhaitée (SASU, EURL, SAS, SARL, SNC, autres)', required: true, checked: false, notes: '' },
    { id: '4.2', category: '⚖️ Forme Juridique', question: 'SASU : Souplesse, IS, assimilé salarié, dividendes taxés 30%', required: false, checked: false, notes: '', info: 'Idéal pour projet solo avec croissance' },
    { id: '4.3', category: '⚖️ Forme Juridique', question: 'EURL : Simplicité, IR ou IS, TNS, charges sociales ~45%', required: false, checked: false, notes: '', info: 'Économique en début d\'activité' },
    { id: '4.4', category: '⚖️ Forme Juridique', question: 'SAS : Plusieurs associés, flexibilité statutaire, IS', required: false, checked: false, notes: '', info: 'Parfait pour levée de fonds future' },
    { id: '4.5', category: '⚖️ Forme Juridique', question: 'SARL : Classique, gérant majoritaire TNS ou minoritaire salarié', required: false, checked: false, notes: '', info: 'Sécurisant pour activités traditionnelles' },
    { id: '4.6', category: '⚖️ Forme Juridique', question: 'Associés prévus ? Nombre ? Répartition capital ?', required: true, checked: false, notes: '', info: 'Prévoir pacte d\'associés si plusieurs' },
    { id: '4.7', category: '⚖️ Forme Juridique', question: 'Clauses importantes : agrément, préemption, exclusion ?', required: false, checked: false, notes: '' },
    { id: '4.8', category: '⚖️ Forme Juridique', question: 'Holding envisagée ? Pourquoi ?', required: false, checked: false, notes: '', info: 'Utile pour optimisation fiscale et patrimoine' },

    // 5. ASPECTS FINANCIERS
    { id: '5.1', category: '💰 Aspects Financiers', question: 'Capital social envisagé', required: true, checked: false, notes: '', info: 'Minimum 1€ mais crédibilité client/banque' },
    { id: '5.2', category: '💰 Aspects Financiers', question: 'Apport en numéraire / apport en nature / apport en industrie', required: true, checked: false, notes: '' },
    { id: '5.3', category: '💰 Aspects Financiers', question: 'CA prévisionnel année 1, 2, 3', required: true, checked: false, notes: '' },
    { id: '5.4', category: '💰 Aspects Financiers', question: 'Charges fixes mensuelles (loyer, assurances, abonnements)', required: true, checked: false, notes: '' },
    { id: '5.5', category: '💰 Aspects Financiers', question: 'Charges variables (achat marchandises, sous-traitance)', required: true, checked: false, notes: '' },
    { id: '5.6', category: '💰 Aspects Financiers', question: 'Investissements de départ (matériel, stock, communication)', required: true, checked: false, notes: '' },
    { id: '5.7', category: '💰 Aspects Financiers', question: 'Besoin financement externe ? Prêt bancaire, love money, levée fonds ?', required: false, checked: false, notes: '' },
    { id: '5.8', category: '💰 Aspects Financiers', question: 'Rémunération dirigeant souhaitée (net mensuel)', required: true, checked: false, notes: '', info: 'Prévoir trésorerie 6-12 mois' },
    { id: '5.9', category: '💰 Aspects Financiers', question: 'Dividendes envisagés ? Fréquence ? Montant ?', required: false, checked: false, notes: '', info: 'Flat tax 30% ou barème IR' },
    { id: '5.10', category: '💰 Aspects Financiers', question: 'Besoins financiers personnels mensuels incompressibles', required: true, checked: false, notes: '', info: 'CRITIQUE : loyer, crédits, charges, nourriture' },

    // 6. FISCALITÉ ET OPTIMISATION
    { id: '6.1', category: '🏛️ Fiscalité', question: 'Régime fiscal : IS (15% puis 25%) ou IR (barème progressif)', required: true, checked: false, notes: '', info: 'IS avantageux si bénéfices >60k€/an' },
    { id: '6.2', category: '🏛️ Fiscalité', question: 'TVA : franchise (seuils) ou régime réel (normal/simplifié)', required: true, checked: false, notes: '', info: 'Franchise = pas de TVA mais pas de déduction' },
    { id: '6.3', category: '🏛️ Fiscalité', question: 'ACRE : exonération charges 1ère année (sous conditions)', required: true, checked: false, notes: '', info: '50% réduction charges sociales an 1' },
    { id: '6.4', category: '🏛️ Fiscalité', question: 'JEI (Jeune Entreprise Innovante) : exonérations fiscales et sociales', required: false, checked: false, notes: '', info: 'Si R&D >15% des charges' },
    { id: '6.5', category: '🏛️ Fiscalité', question: 'CIR (Crédit Impôt Recherche) : 30% dépenses R&D', required: false, checked: false, notes: '' },

    // 7. ZONES FISCALES AVANTAGEUSES
    { id: '7.1', category: '📍 Zones Fiscales', question: 'Adresse dans ZFU (Zone Franche Urbaine) ?', required: true, checked: false, notes: '', info: 'Exonération IS + taxes foncières 5 ans' },
    { id: '7.2', category: '📍 Zones Fiscales', question: 'Adresse dans ZFRR (Zone de Revitalisation Rurale) ?', required: true, checked: false, notes: '', info: 'Exonération IS 5 ans si création emplois' },
    { id: '7.3', category: '📍 Zones Fiscales', question: 'Adresse dans QPV (Quartier Prioritaire de la Ville) ?', required: true, checked: false, notes: '', info: 'Exonérations sociales et fiscales' },
    { id: '7.4', category: '📍 Zones Fiscales', question: 'Adresse dans BER (Bassin d\'Emploi à Redynamiser) ?', required: true, checked: false, notes: '', info: 'Aides à l\'embauche et exonérations' },
    { id: '7.5', category: '📍 Zones Fiscales', question: 'Adresse dans ZRR (Zone de Restructuration Défense) ?', required: false, checked: false, notes: '' },
    { id: '7.6', category: '📍 Zones Fiscales', question: 'Vérification éligibilité zones : géoportail + ANIL', required: true, checked: false, notes: '', info: 'Économies potentielles 10-50k€/an' },

    // 8. SOCIAL ET PROTECTION
    { id: '8.1', category: '🛡️ Social', question: 'Régime social dirigeant : assimilé salarié (SASU) ou TNS (EURL)', required: true, checked: false, notes: '', info: 'Assimilé = 70% charges, TNS = 45% charges' },
    { id: '8.2', category: '🛡️ Social', question: 'Cotisations sociales estimées sur rémunération prévue', required: true, checked: false, notes: '' },
    { id: '8.3', category: '🛡️ Social', question: 'Mutuelle obligatoire : coût mensuel ~100-300€', required: true, checked: false, notes: '', info: 'Madelin déductible pour TNS' },
    { id: '8.4', category: '🛡️ Social', question: 'Prévoyance (arrêt travail, invalidité, décès)', required: true, checked: false, notes: '', info: 'ESSENTIEL entrepreneur = pas congés maladie' },
    { id: '8.5', category: '🛡️ Social', question: 'Client croit-il en la retraite par répartition (État) ?', required: true, checked: false, notes: '', info: 'Si NON : prévoir épargne retraite privée' },
    { id: '8.6', category: '🛡️ Social', question: 'PER (Plan Épargne Retraite) : déduction fiscale + épargne', required: false, checked: false, notes: '', info: 'Jusqu\'à 10% revenus déductibles' },
    { id: '8.7', category: '🛡️ Social', question: 'Embauche de salariés prévue ? Quand ? Combien ?', required: false, checked: false, notes: '' },

    // 9. PATRIMOINE ET INVESTISSEMENT
    { id: '9.1', category: '💎 Patrimoine', question: 'Client connaît-il l\'investissement (immo, bourse, crypto) ?', required: true, checked: false, notes: '', info: 'Expliquer diversification patrimoine' },
    { id: '9.2', category: '💎 Patrimoine', question: 'Patrimoine existant : immobilier, épargne, placements ?', required: false, checked: false, notes: '' },
    { id: '9.3', category: '💎 Patrimoine', question: 'Projets immobiliers : résidence principale, investissement locatif ?', required: false, checked: false, notes: '', info: 'SCI pour optimisation' },
    { id: '9.4', category: '💎 Patrimoine', question: 'Assurance vie : montant, rendement, bénéficiaires ?', required: false, checked: false, notes: '', info: 'Fiscalité avantageuse après 8 ans' },
    { id: '9.5', category: '💎 Patrimoine', question: 'PEA (Plan Épargne Actions) : exonération IR après 5 ans', required: false, checked: false, notes: '' },
    { id: '9.6', category: '💎 Patrimoine', question: 'Stratégie dividendes vs rémunération (optimisation fiscale)', required: false, checked: false, notes: '', info: 'Mix optimal selon situation' },

    // 10. DOMICILIATION ET LOCAUX
    { id: '10.1', category: '🏢 Domiciliation', question: 'Domiciliation : domicile, local commercial, société domiciliation, pépinière ?', required: true, checked: false, notes: '' },
    { id: '10.2', category: '🏢 Domiciliation', question: 'Si domicile : autorisation copropriété/propriétaire obtenue ?', required: false, checked: false, notes: '', info: 'Obligatoire selon règlement copro' },
    { id: '10.3', category: '🏢 Domiciliation', question: 'Si bail commercial : durée, loyer, charges, dépôt garantie ?', required: false, checked: false, notes: '' },
    { id: '10.4', category: '🏢 Domiciliation', question: 'Télétravail/nomade ? Besoin espace coworking ?', required: false, checked: false, notes: '' },

    // 11. BANQUE ET ASSURANCES
    { id: '11.1', category: '🏦 Banque', question: 'Compte professionnel ouvert ? Banque ? Tarifs ?', required: true, checked: false, notes: '', info: 'Néobanques vs banques trad' },
    { id: '11.2', category: '🏦 Banque', question: 'Moyens de paiement : CB pro, terminal, virement, chèque ?', required: true, checked: false, notes: '' },
    { id: '11.3', category: '🏦 Banque', question: 'RC Pro (Responsabilité Civile Professionnelle) obligatoire ?', required: true, checked: false, notes: '', info: 'Obligatoire certaines activités' },
    { id: '11.4', category: '🏦 Banque', question: 'Garantie décennale (si BTP/construction)', required: false, checked: false, notes: '' },
    { id: '11.5', category: '🏦 Banque', question: 'Protection juridique professionnelle', required: false, checked: false, notes: '', info: '~200€/an pour litiges clients' },
    { id: '11.6', category: '🏦 Banque', question: 'Cyber-assurance (si activité numérique)', required: false, checked: false, notes: '' },

    // 12. PROPRIÉTÉ INTELLECTUELLE
    { id: '12.1', category: '©️ Propriété Intellectuelle', question: 'Nom commercial/marque à protéger ?', required: true, checked: false, notes: '', info: 'Dépôt INPI marque ~250€' },
    { id: '12.2', category: '©️ Propriété Intellectuelle', question: 'Recherche d\'antériorité effectuée (pas de marque similaire) ?', required: true, checked: false, notes: '', info: 'base-marques.inpi.fr' },
    { id: '12.3', category: '©️ Propriété Intellectuelle', question: 'Classes INPI à déposer (produits/services concernés)', required: false, checked: false, notes: '', info: '225€ par classe supplémentaire' },
    { id: '12.4', category: '©️ Propriété Intellectuelle', question: 'Nom de domaine réservé ? Extensions (.fr, .com) ?', required: true, checked: false, notes: '' },
    { id: '12.5', category: '©️ Propriété Intellectuelle', question: 'Droit à l\'image : photos, vidéos, logo protégés ?', required: false, checked: false, notes: '', info: 'Contrats cession droits si prestataires' },
    { id: '12.6', category: '©️ Propriété Intellectuelle', question: 'Brevets, modèles, dessins à déposer ?', required: false, checked: false, notes: '' },

    // 13. RÉGLEMENTATION ET CONFORMITÉ
    { id: '13.1', category: '📜 Réglementation', question: 'RGPD : traitement données personnelles ? DPO nécessaire ?', required: true, checked: false, notes: '', info: 'Mentions légales + politique confidentialité' },
    { id: '13.2', category: '📜 Réglementation', question: 'CGV (Conditions Générales de Vente) rédigées ?', required: true, checked: false, notes: '', info: 'Obligatoire B2B et B2C' },
    { id: '13.3', category: '📜 Réglementation', question: 'CGU (Conditions Générales d\'Utilisation) si site web ?', required: false, checked: false, notes: '' },
    { id: '13.4', category: '📜 Réglementation', question: 'Mentions légales site web conformes ?', required: false, checked: false, notes: '' },
    { id: '13.5', category: '📜 Réglementation', question: 'Déclaration CNIL si données sensibles ?', required: false, checked: false, notes: '' },

    // 14. FRAIS ET CHARGES EXPLIQUÉS
    { id: '14.1', category: '💸 Frais Détaillés', question: 'FRAIS CRÉATION : honoraires expert-comptable, greff, annonce légale (~1500-2500€)', required: true, checked: false, notes: '', info: 'Frais débours inclus dans nos packs' },
    { id: '14.2', category: '💸 Frais Détaillés', question: 'FRAIS ANNUELS : comptable (1200-3000€), assurances (500-2000€)', required: true, checked: false, notes: '' },
    { id: '14.3', category: '💸 Frais Détaillés', question: 'CHARGES SOCIALES : ~45% TNS ou ~70% assimilé salarié', required: true, checked: false, notes: '', info: 'Sur rémunération brute' },
    { id: '14.4', category: '💸 Frais Détaillés', question: 'IMPÔTS SOCIÉTÉ : IS 15% <42.5k€ puis 25% au-delà', required: true, checked: false, notes: '' },
    { id: '14.5', category: '💸 Frais Détaillés', question: 'CFE (Cotisation Foncière Entreprises) : ~200-2000€/an selon CA', required: true, checked: false, notes: '', info: 'Exonération 1ère année' },
    { id: '14.6', category: '💸 Frais Détaillés', question: 'CVAE (si CA >500k€) : 0.5-1.5% valeur ajoutée', required: false, checked: false, notes: '' },

    // 15. DOCUMENTS À FOURNIR
    { id: '15.1', category: '📄 Documents', question: 'Pièce d\'identité (CNI, passeport) recto-verso', required: true, checked: false, notes: '' },
    { id: '15.2', category: '📄 Documents', question: 'Justificatif de domicile (-3 mois)', required: true, checked: false, notes: '' },
    { id: '15.3', category: '📄 Documents', question: 'Attestation de non-condamnation signée', required: true, checked: false, notes: '' },
    { id: '15.4', category: '📄 Documents', question: 'Diplômes/qualifications (si activité réglementée)', required: false, checked: false, notes: '' },
    { id: '15.5', category: '📄 Documents', question: 'Kbis société existante (si holding ou fusion)', required: false, checked: false, notes: '' },
    { id: '15.6', category: '📄 Documents', question: 'RIB compte professionnel', required: true, checked: false, notes: '' },
    { id: '15.7', category: '📄 Documents', question: 'Autorisation conjoint si marié (régime communauté)', required: false, checked: false, notes: '' },

    // 16. PROCHAINES ÉTAPES
    { id: '16.1', category: '✅ Prochaines Étapes', question: 'Rédaction statuts personnalisés', required: true, checked: false, notes: '' },
    { id: '16.2', category: '✅ Prochaines Étapes', question: 'Dépôt capital à la banque (attestation)', required: true, checked: false, notes: '' },
    { id: '16.3', category: '✅ Prochaines Étapes', question: 'Publication annonce légale (JAL)', required: true, checked: false, notes: '' },
    { id: '16.4', category: '✅ Prochaines Étapes', question: 'Dossier INPI (M0, statuts, pièces justificatives)', required: true, checked: false, notes: '' },
    { id: '16.5', category: '✅ Prochaines Étapes', question: 'Immatriculation : délai 5-15 jours', required: true, checked: false, notes: '' },
    { id: '16.6', category: '✅ Prochaines Étapes', question: 'Réception Kbis et SIRET', required: true, checked: false, notes: '' },
    { id: '16.7', category: '✅ Prochaines Étapes', question: 'Choix expert-comptable et logiciel facturation', required: true, checked: false, notes: '' },
    { id: '16.8', category: '✅ Prochaines Étapes', question: 'Date RDV de suivi post-création (J+30)', required: true, checked: false, notes: '' },
  ]);

  const categories = Array.from(new Set(checklist.map(item => item.category)));

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const updateNotes = (id: string, notes: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, notes } : item
    ));
  };

  const startFathomRecording = () => {
    setFathomRecording(true);
    alert('🎥 Enregistrement Fathom démarré !');
  };

  const stopFathomRecording = () => {
    setFathomRecording(false);
    alert('✅ Enregistrement terminé ! Génération du rapport...');
  };

  const generateReport = () => {
    alert('📄 Rapport PDF en cours de génération...');
  };

  const progress = Math.round((checklist.filter(i => i.checked).length / checklist.length) * 100);
  const requiredItems = checklist.filter(i => i.required);
  const requiredCompleted = requiredItems.filter(i => i.checked).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold">RDV Expert R1 - Template ULTRA Complet</h1>
              <p className="text-blue-100 mt-2">Checklist exhaustive de 100+ points pour ne RIEN oublier</p>
            </div>
            {fathomRecording && (
              <div className="flex items-center gap-2 bg-red-500 px-4 py-2 rounded-lg">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="font-bold">REC</span>
              </div>
            )}
          </div>

          {/* Infos RDV */}
          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nom du client"
              className="px-4 py-2 rounded-lg text-gray-900 font-medium"
            />
            <input
              type="date"
              value={rdvDate}
              onChange={(e) => setRdvDate(e.target.value)}
              className="px-4 py-2 rounded-lg text-gray-900"
            />
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="px-4 py-2 rounded-lg text-gray-900"
            />
            {!fathomRecording ? (
              <button
                onClick={startFathomRecording}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold transition-colors"
              >
                🎥 Démarrer Fathom
              </button>
            ) : (
              <button
                onClick={stopFathomRecording}
                className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded-lg font-bold transition-colors"
              >
                ⏹️ Stop
              </button>
            )}
          </div>
        </div>

        {/* Progression */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
          <div className="flex justify-between mb-3">
            <div>
              <span className="text-2xl font-bold text-gray-900">{progress}%</span>
              <span className="text-gray-600 ml-2">complété</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">{requiredCompleted}/{requiredItems.length}</div>
              <div className="text-xs text-gray-600">Obligatoires</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Checklist par catégorie */}
        {categories.map(category => {
          const categoryItems = checklist.filter(item => item.category === category);
          const categoryProgress = Math.round((categoryItems.filter(i => i.checked).length / categoryItems.length) * 100);

          return (
            <div key={category} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-blue-600">{categoryProgress}%</span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full transition-all"
                      style={{ width: `${categoryProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {categoryItems.map(item => (
                  <div key={item.id} className={`p-4 rounded-lg border-2 transition-all ${
                    item.checked 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}>
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleCheck(item.id)}
                        className={`mt-1 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          item.checked 
                            ? 'bg-green-500 text-white shadow-lg' 
                            : 'bg-white border-2 border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {item.checked && <Check size={18} />}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <span className={`font-medium flex-1 ${item.checked ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                            {item.question}
                          </span>
                          {item.required && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold whitespace-nowrap">
                              OBLIGATOIRE
                            </span>
                          )}
                        </div>
                        
                        {item.info && (
                          <div className="flex items-start gap-2 mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-blue-900">{item.info}</span>
                          </div>
                        )}
                        
                        <textarea
                          value={item.notes}
                          onChange={(e) => updateNotes(item.id, e.target.value)}
                          placeholder="Notes détaillées..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={generateReport}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              📄 Générer Rapport PDF Complet
            </button>
            <button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              💾 Sauvegarder dans Espace Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}