import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID requis' }, { status: 400 });
    }

    console.log('🚀 Génération des documents pour user:', userId);

    // 1️⃣ Récupérer les données de création
    const { data: companyData, error: dataError } = await supabase
      .from('company_creation_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (dataError || !companyData) {
      return NextResponse.json({ error: 'Données introuvables' }, { status: 404 });
    }

    // 2️⃣ Préparer les données pour les templates
    const templateData = {
      company_name: companyData.company_name || 'NOM DE LA SOCIÉTÉ',
      company_type: companyData.company_type || 'SCI',
      capital_amount: companyData.capital_amount || '0',
      activity_description: companyData.activity_description || 'Activité non définie',
      address_line1: companyData.address_line1 || '',
      address_line2: companyData.address_line2 || '',
      postal_code: companyData.postal_code || '',
      city: companyData.city || '',
      country: companyData.country || 'France',
      president_first_name: companyData.president_first_name || '',
      president_last_name: companyData.president_last_name || '',
      president_birth_date: companyData.president_birth_date || '',
      president_birth_place: companyData.president_birth_place || '',
      president_nationality: companyData.president_nationality || 'Française',
      president_address: companyData.president_address || '',
      bank_name: companyData.bank_name || '',
      iban: companyData.iban || '',
      today_date: new Date().toLocaleDateString('fr-FR'),
      year: new Date().getFullYear().toString(),
    };

    // 3️⃣ Générer les 3 documents
    const documents = [
      {
        type: 'statuts',
        name: 'Statuts',
        content: generateStatutsSCI(templateData),
      },
      {
        type: 'attestation_souscription',
        name: 'Attestation de souscription',
        content: generateAttestationSouscription(templateData),
      },
      {
        type: 'pv_constitution',
        name: 'PV de constitution',
        content: generatePVConstitution(templateData),
      },
    ];

    // 4️⃣ Sauvegarder dans Supabase Storage et DB
    const generatedDocs = [];

    for (const doc of documents) {
      const fileName = `${doc.type}_${Date.now()}.txt`;
      const filePath = `${userId}/generated/${fileName}`;

      // Upload dans Storage
      const { error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(filePath, Buffer.from(doc.content), {
          contentType: 'text/plain',
          upsert: false,
        });

      if (uploadError) {
        console.error(`Erreur upload ${doc.type}:`, uploadError);
        continue;
      }

      // Insérer dans la DB
      const { data: dbDoc, error: dbError } = await supabase
        .from('company_documents')
        .insert({
          user_id: userId,
          document_type: doc.type,
          file_name: `${doc.name}.txt`,
          file_path: filePath,
          source: 'generated',
          status: 'pending',
          generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!dbError && dbDoc) {
        generatedDocs.push(dbDoc);
      }
    }

    // 5️⃣ Mettre à jour le workflow
    await supabase
      .from('company_creation_data')
      .update({
        step: 'signature',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    console.log('✅ Génération terminée:', generatedDocs.length, 'documents');

    return NextResponse.json({
      success: true,
      documents: generatedDocs,
      message: `${generatedDocs.length} documents générés avec succès`,
    });

  } catch (error: any) {
    console.error('❌ Erreur génération:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur de génération' },
      { status: 500 }
    );
  }
}

// 📄 Templates de documents

function generateStatutsSCI(data: any): string {
  return `
STATUTS DE LA SOCIÉTÉ ${data.company_name}

SOCIÉTÉ CIVILE IMMOBILIÈRE

Article 1 - FORME
Il est formé une société civile immobilière régie par les articles 1832 et suivants du Code civil.

Article 2 - OBJET
La société a pour objet :
${data.activity_description}

Article 3 - DÉNOMINATION SOCIALE
La dénomination sociale de la société est : ${data.company_name}

Article 4 - SIÈGE SOCIAL
Le siège social est fixé à :
${data.address_line1}
${data.address_line2 ? data.address_line2 + '\n' : ''}${data.postal_code} ${data.city}

Article 5 - DURÉE
La durée de la société est fixée à 99 années à compter de son immatriculation au Registre du Commerce et des Sociétés.

Article 6 - CAPITAL SOCIAL
Le capital social est fixé à ${data.capital_amount} euros.

Article 7 - GÉRANCE
La société est gérante par :
${data.president_first_name} ${data.president_last_name}
Né(e) le ${data.president_birth_date} à ${data.president_birth_place}
Nationalité : ${data.president_nationality}
Domicilié(e) : ${data.president_address}

Fait à ${data.city}, le ${data.today_date}

Signature du gérant
${data.president_first_name} ${data.president_last_name}
`;
}

function generateAttestationSouscription(data: any): string {
  return `
ATTESTATION DE SOUSCRIPTION DU CAPITAL

Je soussigné(e), ${data.president_first_name} ${data.president_last_name}, agissant en qualité de gérant de la société ${data.company_name}, atteste par la présente que :

Le capital social de la société s'élève à ${data.capital_amount} euros.

Ce capital a été intégralement souscrit et libéré par les associés.

Les fonds correspondants ont été déposés auprès de l'établissement bancaire ${data.bank_name}.

Compte bancaire : ${data.iban}

La présente attestation est délivrée pour servir et valoir ce que de droit.

Fait à ${data.city}, le ${data.today_date}

Le gérant,
${data.president_first_name} ${data.president_last_name}
`;
}

function generatePVConstitution(data: any): string {
  return `
PROCÈS-VERBAL DE CONSTITUTION
${data.company_name}

L'an ${data.year}, le ${data.today_date}

Les soussignés :

${data.president_first_name} ${data.president_last_name}
Né(e) le ${data.president_birth_date} à ${data.president_birth_place}
De nationalité ${data.president_nationality}
Demeurant : ${data.president_address}

Ont décidé de constituer une Société Civile Immobilière ayant les caractéristiques suivantes :

DÉNOMINATION : ${data.company_name}
FORME : Société Civile Immobilière (SCI)
OBJET : ${data.activity_description}
SIÈGE SOCIAL : ${data.address_line1}, ${data.postal_code} ${data.city}
DURÉE : 99 années
CAPITAL SOCIAL : ${data.capital_amount} euros

NOMINATION DU GÉRANT :
${data.president_first_name} ${data.president_last_name} est nommé(e) gérant(e) de la société pour une durée illimitée.

POUVOIRS :
Le gérant dispose de tous les pouvoirs nécessaires pour agir au nom et pour le compte de la société.

DÉPÔT DES FONDS :
Les fonds ont été déposés auprès de ${data.bank_name} (IBAN : ${data.iban}).

Fait à ${data.city}, le ${data.today_date}

Le gérant,
${data.president_first_name} ${data.president_last_name}
`;
}