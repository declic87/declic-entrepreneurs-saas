import { NextResponse } from 'next/server';

// Base de données des codes postaux ZFRR (à compléter)
const ZFRR_CODES: Record<string, string[]> = {
  '09': ['09000', '09100', '09200'], // Ariège (exemple)
  '11': ['11000', '11100'], // Aude
  '15': ['15000', '15100'], // Cantal
  '19': ['19000', '19100'], // Corrèze
  '23': ['23000', '23100'], // Creuse
  '48': ['48000', '48100'], // Lozère
  '63': ['63000', '63100'], // Puy-de-Dôme (zones rurales)
  '87': ['87000', '87100'], // Haute-Vienne
};

// Zones AFR (départements éligibles)
const AFR_DEPARTEMENTS = [
  '01', '02', '03', '07', '08', '10', '15', '19', '23', '25', '36', '39', '42', 
  '43', '48', '52', '54', '55', '58', '63', '70', '71', '87', '88', '89', '90'
];

// Zones QPV (Quartiers Prioritaires de la Ville) - à enrichir
const QPV_COMMUNES: string[] = [
  '75018', '75019', '75020', // Paris
  '93001', '93008', '93048', // Seine-Saint-Denis
  '13001', '13002', '13003', // Marseille
];

export async function POST(request: Request) {
  try {
    const { codePostal } = await request.json();
    
    if (!codePostal || codePostal.length < 5) {
      return NextResponse.json({ error: 'Code postal invalide' }, { status: 400 });
    }

    const departement = codePostal.substring(0, 2);
    
    // Détection ZFRR
    let isZFRR = false;
    if (ZFRR_CODES[departement]) {
      isZFRR = ZFRR_CODES[departement].some(cp => codePostal.startsWith(cp.substring(0, 3)));
    }
    
    // Détection AFR
    const isAFR = AFR_DEPARTEMENTS.includes(departement);
    
    // Détection QPV
    const isQPV = QPV_COMMUNES.some(cp => codePostal.startsWith(cp));
    
    // BER (Bassins d'Emploi à Redynamiser) - approximation
    const isBER = ['08', '52', '55', '88'].includes(departement);

    return NextResponse.json({
      codePostal,
      departement,
      isZFRR,
      isAFR,
      isQPV,
      isBER,
      zones: {
        ...(isZFRR && { ZFRR: 'Zone Franche Rurale - Exonération fiscale jusqu\'à 50% pendant 5 ans' }),
        ...(isAFR && { AFR: 'Aide à la Finalité Régionale - Subventions pour investissements' }),
        ...(isQPV && { QPV: 'Quartier Prioritaire de la Ville - Exonérations fiscales et sociales' }),
        ...(isBER && { BER: 'Bassin d\'Emploi à Redynamiser - Aides à l\'implantation' }),
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}