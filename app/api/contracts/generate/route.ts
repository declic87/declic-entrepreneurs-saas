import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Génère un contrat PDF selon le type
 * Types : client_subscription, team_onboarding
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, contractType, packType, teamRole, contractData } = await req.json();

    if (!userId || !contractType) {
      return NextResponse.json({ error: 'userId et contractType requis' }, { status: 400 });
    }

    // Récupérer les infos utilisateur
    const { data: user } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    let pdfBytes: Uint8Array;

    // Générer le bon type de contrat
    if (contractType === 'client_subscription') {
      pdfBytes = await generateClientContract(user, packType, contractData);
    } else if (contractType === 'team_onboarding') {
      pdfBytes = await generateTeamContract(user, teamRole, contractData);
    } else {
      return NextResponse.json({ error: 'Type de contrat invalide' }, { status: 400 });
    }

    // Upload vers Supabase Storage
    const fileName = `contract_${userId}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Erreur upload PDF:', uploadError);
      return NextResponse.json({ error: 'Erreur upload PDF' }, { status: 500 });
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('contracts')
      .getPublicUrl(fileName);

    // Créer l'entrée dans la table contracts
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        user_id: userId,
        contract_type: contractType,
        pack_type: packType,
        team_role: teamRole,
        pdf_url: publicUrl,
        status: 'draft',
        contract_data: contractData,
      })
      .select()
      .single();

    if (contractError) {
      console.error('Erreur création contract:', contractError);
      return NextResponse.json({ error: 'Erreur création contrat' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      contract,
      pdfUrl: publicUrl,
    });
  } catch (error: any) {
    console.error('Erreur génération contrat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// GÉNÉRATION CONTRAT CLIENT
// ============================================
async function generateClientContract(
  user: any,
  packType: string,
  contractData: any
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let yPosition = height - 50;

  // Fonction helper pour ajouter du texte
  const addText = (text: string, size: number, isBold = false) => {
    page.drawText(text, {
      x: 50,
      y: yPosition,
      size,
      font: isBold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
    yPosition -= size + 10;
  };

  // Header
  addText('CONTRAT D\'ABONNEMENT', 18, true);
  addText('DÉCLIC ENTREPRENEURS', 14, true);
  yPosition -= 20;

  // Infos contrat
  addText(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 10);
  addText(`Référence : ${Date.now()}`, 10);
  yPosition -= 20;

  // Parties
  addText('ENTRE LES SOUSSIGNÉS :', 12, true);
  yPosition -= 10;
  addText('DÉCLIC ENTREPRENEURS', 11, true);
  addText('SARL au capital de 10 000€', 10);
  addText('SIRET : 123 456 789 00010', 10);
  addText('Siège social : 123 Avenue de la République, 75011 Paris', 10);
  yPosition -= 15;

  addText('ET', 11, true);
  yPosition -= 10;
  addText(`${user.first_name} ${user.last_name}`, 11, true);
  addText(`Email : ${user.email}`, 10);
  yPosition -= 20;

  // Objet
  addText('OBJET DU CONTRAT', 12, true);
  yPosition -= 10;

  const packDetails = getPackDetails(packType);
  addText(`Pack souscrit : ${packDetails.name}`, 11);
  addText(`Montant : ${packDetails.price}€`, 11);
  addText(`Durée : ${packDetails.duration}`, 11);
  yPosition -= 15;

  // Prestations incluses
  addText('PRESTATIONS INCLUSES :', 12, true);
  yPosition -= 10;
  packDetails.features.forEach((feature: string) => {
    addText(`• ${feature}`, 10);
  });
  yPosition -= 20;

  // Conditions
  addText('CONDITIONS GÉNÉRALES', 12, true);
  yPosition -= 10;
  addText('1. Le présent contrat prend effet à la date de signature.', 10);
  addText('2. Le paiement s\'effectue par prélèvement automatique.', 10);
  addText('3. Résiliation possible avec préavis de 30 jours.', 10);
  addText('4. Les prestations sont accessibles dès validation du paiement.', 10);
  yPosition -= 30;

  // Signatures
  addText('SIGNATURES', 12, true);
  yPosition -= 10;
  addText('Pour DÉCLIC ENTREPRENEURS', 10);
  addText('(Signature électronique)', 9);
  yPosition -= 40;
  addText(`Pour ${user.first_name} ${user.last_name}`, 10);
  addText('(Signature électronique via YouSign)', 9);

  return await pdfDoc.save();
}

// ============================================
// GÉNÉRATION CONTRAT ÉQUIPE
// ============================================
async function generateTeamContract(
  user: any,
  teamRole: string,
  contractData: any
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let yPosition = height - 50;

  const addText = (text: string, size: number, isBold = false) => {
    page.drawText(text, {
      x: 50,
      y: yPosition,
      size,
      font: isBold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
    yPosition -= size + 10;
  };

  // Header
  addText('CONTRAT DE COLLABORATION', 18, true);
  addText('DÉCLIC ENTREPRENEURS', 14, true);
  yPosition -= 20;

  // Infos
  addText(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 10);
  addText(`Poste : ${getRoleName(teamRole)}`, 10);
  yPosition -= 20;

  // Parties
  addText('ENTRE LES SOUSSIGNÉS :', 12, true);
  yPosition -= 10;
  addText('DÉCLIC ENTREPRENEURS', 11, true);
  addText('SARL au capital de 10 000€', 10);
  yPosition -= 15;

  addText('ET', 11, true);
  yPosition -= 10;
  addText(`${user.first_name} ${user.last_name}`, 11, true);
  addText(`Email : ${user.email}`, 10);
  yPosition -= 20;

  // Mission
  addText('MISSION', 12, true);
  yPosition -= 10;
  const roleDetails = getRoleDetails(teamRole);
  roleDetails.missions.forEach((mission: string) => {
    addText(`• ${mission}`, 10);
  });
  yPosition -= 20;

  // Rémunération
  addText('RÉMUNÉRATION', 12, true);
  yPosition -= 10;
  addText(`Commission : ${roleDetails.commission}% sur les ventes générées`, 11);
  addText('Paiement mensuel le 5 du mois suivant', 10);
  yPosition -= 20;

  // Obligations
  addText('OBLIGATIONS', 12, true);
  yPosition -= 10;
  addText('1. Respecter la confidentialité des données clients', 10);
  addText('2. Utiliser les outils fournis par DÉCLIC ENTREPRENEURS', 10);
  addText('3. Rendre compte de l\'activité mensuellement', 10);
  yPosition -= 30;

  // Signatures
  addText('SIGNATURES', 12, true);
  yPosition -= 10;
  addText('Pour DÉCLIC ENTREPRENEURS', 10);
  addText('(Signature électronique)', 9);
  yPosition -= 40;
  addText(`Pour ${user.first_name} ${user.last_name}`, 10);
  addText('(Signature électronique via YouSign)', 9);

  return await pdfDoc.save();
}

// ============================================
// HELPERS
// ============================================
function getPackDetails(packType: string) {
  const packs: Record<string, any> = {
    PLATEFORME: {
      name: 'Plateforme',
      price: 97,
      duration: 'Mensuel',
      features: [
        'Accès aux simulateurs',
        'Tutos pratiques',
        'Coachings en live',
        'Ateliers thématiques',
      ],
    },
    FORMATION_CREATEUR: {
      name: 'Formation Créateur',
      price: 497,
      duration: '3 mois',
      features: [
        'Formation complète créateur d\'entreprise',
        'Accès plateforme pendant 3 mois',
        'Support par email',
      ],
    },
    FORMATION_AGENT_IMMO: {
      name: 'Formation Agent Immobilier',
      price: 897,
      duration: '3 mois',
      features: [
        'Formation spécialisée agent immobilier',
        'Optimisation fiscale immobilier',
        'Accès plateforme pendant 3 mois',
      ],
    },
    STARTER: {
      name: 'STARTER',
      price: 3600,
      duration: '6 mois',
      features: [
        'Accès plateforme complet',
        '3 RDV experts',
        'Création de société assistée',
        'Messagerie prioritaire',
      ],
    },
    PRO: {
      name: 'PRO',
      price: 4600,
      duration: '12 mois',
      features: [
        'Accès plateforme complet',
        '4 RDV experts',
        'Création de société assistée',
        'Suivi personnalisé',
      ],
    },
    EXPERT: {
      name: 'EXPERT',
      price: 6600,
      duration: '18 mois',
      features: [
        'Accès plateforme complet',
        '5 RDV experts dont 1 avec le fondateur',
        'Création de société assistée',
        'Accompagnement VIP',
      ],
    },
  };

  return packs[packType] || packs.PLATEFORME;
}

function getRoleName(role: string): string {
  const names: Record<string, string> = {
    setter: 'Apporteur d\'affaires',
    closer: 'Commercial',
    expert: 'Expert Consultant',
  };
  return names[role] || role;
}

function getRoleDetails(role: string) {
  const details: Record<string, any> = {
    setter: {
      missions: [
        'Qualification de leads entrants',
        'Prise de RDV pour les closers',
        'Suivi des prospects qualifiés',
      ],
      commission: 10,
    },
    closer: {
      missions: [
        'Conversion des leads qualifiés',
        'Présentation des offres',
        'Signature des contrats',
      ],
      commission: 20,
    },
    expert: {
      missions: [
        'Accompagnement des clients',
        'Conseil fiscal et juridique',
        'Formation et coaching',
      ],
      commission: 15,
    },
  };
  return details[role] || details.setter;
}