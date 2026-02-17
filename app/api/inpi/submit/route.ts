import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuration API INPI Service
// Note: INPIService n'a pas d'API publique directe
// On utilise ici un exemple générique - à adapter selon votre intégration
const INPI_API_URL = process.env.INPI_API_URL || 'https://api.inpiservice.fr/v1';
const INPI_API_KEY = process.env.INPI_API_KEY!;

/**
 * Soumettre un dossier de création de société à l'INPI
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, companyData } = await req.json();

    if (!userId || !companyData) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Validation des données minimales
    const { companyName, companyType, capital, activity, address, managers } = companyData;

    if (!companyName || !companyType || !capital || !address || !managers?.length) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const { data: user } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Créer le dossier INPI dans la base
    const { data: inpiDossier, error: dossierError } = await supabase
      .from('inpi_dossiers')
      .insert({
        user_id: userId,
        company_name: companyName,
        company_type: companyType,
        activity_code: companyData.activityCode,
        capital,
        address,
        managers: JSON.stringify(managers),
        inpi_status: 'draft',
      })
      .select()
      .single();

    if (dossierError) {
      console.error('Erreur création dossier:', dossierError);
      return NextResponse.json({ error: 'Erreur création dossier' }, { status: 500 });
    }

    // Préparer les données pour l'INPI
    const inpiPayload = formatINPIPayload(companyData, user);

    // Soumettre à l'INPI Service
    // NOTE: Ceci est un exemple - adapter selon l'API réelle
    try {
      const inpiResponse = await fetch(`${INPI_API_URL}/declarations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${INPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inpiPayload),
      });

      if (!inpiResponse.ok) {
        const error = await inpiResponse.text();
        console.error('Erreur INPI:', error);
        throw new Error('Erreur soumission INPI');
      }

      const inpiData = await inpiResponse.json();

      // Mettre à jour le dossier avec la référence INPI
      await supabase
        .from('inpi_dossiers')
        .update({
          inpi_status: 'submitted',
          inpi_reference: inpiData.reference,
          inpi_submitted_at: new Date().toISOString(),
          inpi_response: JSON.stringify(inpiData),
        })
        .eq('id', inpiDossier.id);

      return NextResponse.json({
        success: true,
        dossierId: inpiDossier.id,
        inpiReference: inpiData.reference,
        message: 'Dossier soumis à l\'INPI avec succès',
      });
    } catch (inpiError: any) {
      // Marquer le dossier comme erreur
      await supabase
        .from('inpi_dossiers')
        .update({
          inpi_status: 'draft',
          inpi_response: JSON.stringify({ error: inpiError.message }),
        })
        .eq('id', inpiDossier.id);

      return NextResponse.json({
        success: false,
        dossierId: inpiDossier.id,
        error: inpiError.message,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erreur soumission INPI:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Récupérer le statut d'un dossier INPI
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dossierId = searchParams.get('dossierId');

    if (!dossierId) {
      return NextResponse.json({ error: 'dossierId requis' }, { status: 400 });
    }

    // Récupérer le dossier
    const { data: dossier } = await supabase
      .from('inpi_dossiers')
      .select('*')
      .eq('id', dossierId)
      .single();

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    }

    // Si le dossier est soumis, vérifier le statut auprès de l'INPI
    if (dossier.inpi_reference && dossier.inpi_status === 'submitted') {
      try {
        const statusResponse = await fetch(
          `${INPI_API_URL}/declarations/${dossier.inpi_reference}/status`,
          {
            headers: {
              'Authorization': `Bearer ${INPI_API_KEY}`,
            },
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();

          // Mettre à jour si le statut a changé
          if (statusData.status !== dossier.inpi_status) {
            await supabase
              .from('inpi_dossiers')
              .update({
                inpi_status: statusData.status,
                siren: statusData.siren || dossier.siren,
                siret: statusData.siret || dossier.siret,
                inpi_approved_at: statusData.status === 'approved' ? new Date().toISOString() : null,
                inpi_response: JSON.stringify(statusData),
              })
              .eq('id', dossierId);

            dossier.inpi_status = statusData.status;
            dossier.siren = statusData.siren || dossier.siren;
            dossier.siret = statusData.siret || dossier.siret;
          }
        }
      } catch (error) {
        console.error('Erreur vérification statut INPI:', error);
      }
    }

    return NextResponse.json({
      success: true,
      dossier,
    });
  } catch (error: any) {
    console.error('Erreur récupération dossier:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// HELPERS
// ============================================

function formatINPIPayload(companyData: any, user: any) {
  // Format spécifique INPI - à adapter selon l'API réelle
  return {
    forme_juridique: mapCompanyType(companyData.companyType),
    denomination: companyData.companyName,
    capital: {
      montant: companyData.capital,
      devise: 'EUR',
    },
    objet_social: companyData.activity,
    siege_social: {
      adresse: companyData.address,
      code_postal: companyData.postalCode,
      ville: companyData.city,
    },
    dirigeants: companyData.managers.map((manager: any) => ({
      civilite: manager.civility,
      nom: manager.lastName,
      prenom: manager.firstName,
      date_naissance: manager.birthDate,
      lieu_naissance: manager.birthPlace,
      nationalite: manager.nationality,
      fonction: manager.role,
    })),
    contact: {
      email: user.email,
      nom: user.last_name,
      prenom: user.first_name,
    },
  };
}

function mapCompanyType(type: string): string {
  const mapping: Record<string, string> = {
    'SASU': '5710',
    'EURL': '5498',
    'SAS': '5710',
    'SARL': '5498',
    'SCI': '6540',
    'SELARL': '5498',
    'SELARLU': '5498',
    'SELAS': '5710',
    'SELASU': '5710',
  };
  return mapping[type] || '5710';
}