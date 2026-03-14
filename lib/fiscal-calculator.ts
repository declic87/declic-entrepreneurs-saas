interface FiscalInput {
    ca: number;
    charges: number;
    fraisComptable: number;
    statut: string;
    situationFamiliale: {
      marie: boolean;
      enfants: number;
    };
    codePostal: string;
  }
  
  interface FiscalResult {
    situationActuelle: {
      ca: number;
      charges: number;
      remunerationBrute: number;
      chargesSociales: number;
      impots: number;
      netCash: number;
    };
    situationOptimisee: {
      ca: number;
      charges: number;
      ik: number;
      mda: number;
      remunerationBrute: number;
      chargesSociales: number;
      impots: number;
      netCash: number;
    };
    gain: number;
    recommandations: string[];
  }
  
  export function calculateOptimization(input: FiscalInput): FiscalResult {
    const { ca, charges, fraisComptable, statut, situationFamiliale } = input;
    
    // ===== SITUATION ACTUELLE =====
    
    let chargesSocialesActuelles = 0;
    let impotsActuels = 0;
    let remunerationBruteActuelle = ca - charges;
    
    switch (statut) {
      case 'EI':
        // Auto-entrepreneur ou micro
        chargesSocialesActuelles = ca * 0.22; // 22% du CA
        const revenuImposable = ca * 0.66; // Abattement 34%
        impotsActuels = calculateImpotRevenu(revenuImposable, situationFamiliale);
        break;
        
      case 'EURL':
        // EURL à l'IR
        chargesSocialesActuelles = remunerationBruteActuelle * 0.45; // TNS
        impotsActuels = calculateImpotRevenu(remunerationBruteActuelle - chargesSocialesActuelles, situationFamiliale);
        break;
        
      case 'SASU_IS':
        // SASU à l'IS
        const is = (ca - charges) * 0.15; // IS à 15% jusqu'à 42 500€
        const dividendes = (ca - charges - is) * 0.5; // 50% en dividendes
        const salaire = (ca - charges - is) * 0.5; // 50% en salaire
        chargesSocialesActuelles = salaire * 0.82; // Assimilé salarié
        const flatTax = dividendes * 0.30; // Flat tax 30%
        impotsActuels = is + flatTax;
        remunerationBruteActuelle = salaire;
        break;
        
      case 'SASU_IR':
        // SASU à l'IR
        chargesSocialesActuelles = remunerationBruteActuelle * 0.82;
        impotsActuels = calculateImpotRevenu(remunerationBruteActuelle - chargesSocialesActuelles, situationFamiliale);
        break;
        
      default:
        chargesSocialesActuelles = remunerationBruteActuelle * 0.45;
        impotsActuels = calculateImpotRevenu(remunerationBruteActuelle - chargesSocialesActuelles, situationFamiliale);
    }
    
    const netCashActuel = remunerationBruteActuelle - chargesSocialesActuelles - impotsActuels;
    
    // ===== SITUATION OPTIMISÉE =====
    
    const ikOptimal = 12000;
    const mdaOptimal = 8000;
    const fraisOptimises = charges + ikOptimal + mdaOptimal;
    
    const remunerationBruteOptimisee = ca - fraisOptimises;
    
    // Passage en SASU à l'IR optimisé
    const chargesSocialesOptimisees = remunerationBruteOptimisee * 0.25; // Optimisé via Déclic
    const impotsOptimises = calculateImpotRevenu(remunerationBruteOptimisee - chargesSocialesOptimisees, situationFamiliale);
    
    // Le net cash inclut les remboursements IK + MDA (non imposés)
    const netCashOptimise = remunerationBruteOptimisee - chargesSocialesOptimisees - impotsOptimises + ikOptimal + mdaOptimal;
    
    const gain = netCashOptimise - netCashActuel;
    
    // ===== RECOMMANDATIONS =====
    
    const recommandations: string[] = [];
    
    // IK
    recommandations.push(`🚗 Indemnités Kilométriques: 12 000€/an de remboursement cash non imposé (barème fiscal 7CV)`);
    
    // MDA
    recommandations.push(`🏠 Mise à disposition habitation: 8 000€/an de remboursement cash non imposé (bureau à domicile)`);
    
    // Comptable
    if (fraisComptable > 3000) {
      recommandations.push(`💰 Optimisation comptable: économisez ${fraisComptable - 1200}€/an en changeant de cabinet (notre partenaire: 1200€/an)`);
    }
    
    // Statut
    if (statut === 'EI') {
      recommandations.push(`🏢 Passage en SASU à l'IR recommandé: économie de charges sociales de ${(chargesSocialesActuelles - chargesSocialesOptimisees).toFixed(0)}€/an`);
    }
    
    if (statut === 'SASU_IS' && ca < 150000) {
      recommandations.push(`📊 SASU à l'IR plus avantageuse pour votre CA: économie de ${(impotsActuels - impotsOptimises).toFixed(0)}€/an`);
    }
    
    // Frais réels
    if (charges < ca * 0.15) {
      recommandations.push(`📝 Vos charges semblent faibles (${((charges / ca) * 100).toFixed(0)}%). Pensez à déduire: repas, formations, téléphone, internet, équipement...`);
    }
    
    return {
      situationActuelle: {
        ca,
        charges,
        remunerationBrute: remunerationBruteActuelle,
        chargesSociales: chargesSocialesActuelles,
        impots: impotsActuels,
        netCash: netCashActuel,
      },
      situationOptimisee: {
        ca,
        charges: fraisOptimises,
        ik: ikOptimal,
        mda: mdaOptimal,
        remunerationBrute: remunerationBruteOptimisee,
        chargesSociales: chargesSocialesOptimisees,
        impots: impotsOptimises,
        netCash: netCashOptimise,
      },
      gain,
      recommandations,
    };
  }
  
  // Calcul impôt sur le revenu (barème 2024)
  function calculateImpotRevenu(revenu: number, situationFamiliale: { marie: boolean; enfants: number }): number {
    const parts = 1 + (situationFamiliale.marie ? 1 : 0) + (situationFamiliale.enfants * 0.5);
    const quotientFamilial = revenu / parts;
    
    let impot = 0;
    
    if (quotientFamilial <= 10777) {
      impot = 0;
    } else if (quotientFamilial <= 27478) {
      impot = (quotientFamilial - 10777) * 0.11;
    } else if (quotientFamilial <= 78570) {
      impot = 1837 + (quotientFamilial - 27478) * 0.30;
    } else if (quotientFamilial <= 168994) {
      impot = 17165 + (quotientFamilial - 78570) * 0.41;
    } else {
      impot = 54209 + (quotientFamilial - 168994) * 0.45;
    }
    
    return impot * parts;
  }