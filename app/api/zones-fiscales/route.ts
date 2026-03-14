import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// BASE DE DONNÉES DES ZONES FISCALES
// ═══════════════════════════════════════════════════════════════════

// ZFRR - Zone Franche Rurale de Revitalisation
// Exonération d'impôts sur les bénéfices jusqu'à 50% pendant 5 ans
const ZFRR_DEPARTEMENTS = [
  '01', '02', '03', '04', '05', '07', '08', '09', '11', '12', '15', '16', 
  '17', '18', '19', '21', '22', '23', '24', '25', '26', '27', '28', '29', 
  '32', '36', '37', '39', '40', '41', '42', '43', '46', '47', '48', '49', 
  '50', '52', '53', '55', '56', '58', '61', '63', '64', '65', '70', '71', 
  '72', '79', '81', '82', '85', '86', '87', '88', '89', '90'
];

// AFR - Aide à la Finalité Régionale
// Subventions pour investissements productifs
const AFR_DEPARTEMENTS = [
  '01', '02', '03', '07', '08', '10', '15', '18', '19', '21', '23', '25', 
  '36', '39', '42', '43', '48', '52', '54', '55', '58', '63', '70', '71', 
  '87', '88', '89', '90'
];

// BER - Bassin d'Emploi à Redynamiser
// Aides spécifiques à l'implantation
const BER_DEPARTEMENTS = [
  '08', '52', '55', '88', '02', '59', '62'
];

// QPV - Quartiers Prioritaires de la Ville
// Base de codes postaux (à enrichir avec l'API officielle)
const QPV_CODES_POSTAUX: Record<string, string[]> = {
  '75': ['75018', '75019', '75020'], // Paris
  '93': ['93001', '93008', '93048', '93070'], // Seine-Saint-Denis
  '13': ['13001', '13002', '13003', '13014', '13015'], // Marseille
  '59': ['59000', '59100', '59200', '59300'], // Nord
  '69': ['69003', '69007', '69008', '69009'], // Lyon
  '31': ['31100', '31200', '31300'], // Toulouse
  '33': ['33000', '33100', '33200'], // Bordeaux
  '44': ['44000', '44100', '44200'], // Nantes
  '67': ['67000', '67100', '67200'], // Strasbourg
  '06': ['06000', '06100', '06200'], // Nice
};

// ═══════════════════════════════════════════════════════════════════
// FONCTION DE DÉTECTION
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const { codePostal } = await request.json();
    
    // Validation
    if (!codePostal || typeof codePostal !== 'string' || codePostal.length !== 5) {
      return NextResponse.json(
        { error: 'Code postal invalide (format attendu: 5 chiffres)' }, 
        { status: 400 }
      );
    }

    const departement = codePostal.substring(0, 2);
    
    // Détection ZFRR
    const isZFRR = ZFRR_DEPARTEMENTS.includes(departement);
    
    // Détection AFR
    const isAFR = AFR_DEPARTEMENTS.includes(departement);
    
    // Détection BER
    const isBER = BER_DEPARTEMENTS.includes(departement);
    
    // Détection QPV
    let isQPV = false;
    if (QPV_CODES_POSTAUX[departement]) {
      isQPV = QPV_CODES_POSTAUX[departement].some(cp => 
        codePostal.startsWith(cp) || cp === codePostal
      );
    }

    // Construction de la réponse
    const zones: Record<string, any> = {};
    
    if (isZFRR) {
      zones.ZFRR = {
        nom: 'Zone Franche Rurale de Revitalisation',
        description: 'Exonération d\'impôts sur les bénéfices jusqu\'à 50% pendant 5 ans',
        avantages: [
          'Exonération d\'impôts sur les bénéfices (dégressif sur 5 ans)',
          'Exonération de CFE pendant 5 ans',
          'Exonération de taxe foncière (selon communes)',
        ],
        duree: '5 ans',
        taux: '100% la 1ère année, puis dégressif',
      };
    }
    
    if (isAFR) {
      zones.AFR = {
        nom: 'Aide à la Finalité Régionale',
        description: 'Subventions pour investissements productifs',
        avantages: [
          'Subventions pour investissements (machines, bâtiments)',
          'Accompagnement financier région',
          'Aides à l\'emploi',
        ],
        montant: 'Jusqu\'à 20% de l\'investissement',
      };
    }
    
    if (isQPV) {
      zones.QPV = {
        nom: 'Quartier Prioritaire de la Ville',
        description: 'Exonérations fiscales et sociales pour implantation en QPV',
        avantages: [
          'Exonération de cotisations patronales (jusqu\'à 1,5 SMIC)',
          'Exonération d\'impôts sur les bénéfices pendant 5 ans',
          'Exonération de CFE pendant 5 ans',
        ],
        duree: '5 ans',
      };
    }
    
    if (isBER) {
      zones.BER = {
        nom: 'Bassin d\'Emploi à Redynamiser',
        description: 'Aides à l\'implantation et à l\'emploi',
        avantages: [
          'Exonération de cotisations patronales',
          'Prime à l\'aménagement du territoire',
          'Accompagnement Pôle Emploi',
        ],
      };
    }

    return NextResponse.json({
      codePostal,
      departement,
      isZFRR,
      isAFR,
      isQPV,
      isBER,
      zones,
      message: Object.keys(zones).length > 0 
        ? `✅ ${Object.keys(zones).length} zone(s) avantageuse(s) détectée(s)` 
        : 'Aucune zone fiscale avantageuse détectée',
    });

  } catch (error: any) {
    console.error('Erreur API zones fiscales:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message }, 
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// ROUTE GET - LISTE DES DÉPARTEMENTS ÉLIGIBLES
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  return NextResponse.json({
    ZFRR: {
      nom: 'Zone Franche Rurale de Revitalisation',
      departements: ZFRR_DEPARTEMENTS.length,
      liste: ZFRR_DEPARTEMENTS,
    },
    AFR: {
      nom: 'Aide à la Finalité Régionale',
      departements: AFR_DEPARTEMENTS.length,
      liste: AFR_DEPARTEMENTS,
    },
    BER: {
      nom: 'Bassin d\'Emploi à Redynamiser',
      departements: BER_DEPARTEMENTS.length,
      liste: BER_DEPARTEMENTS,
    },
    QPV: {
      nom: 'Quartiers Prioritaires de la Ville',
      departements: Object.keys(QPV_CODES_POSTAUX).length,
      info: 'Liste partielle - vérification manuelle recommandée',
    },
  });
}