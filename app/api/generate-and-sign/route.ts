// app/api/generate-and-sign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAllDocuments } from '@/lib/pdf/pdfGenerator';
import { createSignatureRequest } from '@/lib/yousign/yousignService';

// ✅ UTILISER LE SERVICE ROLE (bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { company_id, user_email } = await request.json();

    if (!company_id || !user_email) {
      return NextResponse.json(
        { error: 'company_id et user_email requis' },
        { status: 400 }
      );
    }

    console.log('🚀 Génération PDF + Signature pour company:', company_id);

    // 1️⃣ Récupérer les données de création
    const { data: companyData, error: dataError } = await supabase
      .from('company_creation_data')
      .select('*')
      .eq('id', company_id)
      .single();

    if (dataError || !companyData) {
      console.error('❌ Erreur récupération données:', dataError);
      return NextResponse.json(
        { error: 'Données de création introuvables' },
        { status: 404 }
      );
    }

    const userId = companyData.user_id;
    const companyType = companyData.company_type;

    // 2️⃣ Récupérer les associés (si nécessaire)
    const requiresMultiple = ['SAS', 'SARL', 'SCI', 'SELAS', 'SELARL'].includes(companyType);
    let shareholders = [];

    if (requiresMultiple) {
      const { data: shareholdersData } = await supabase
        .from('company_shareholders')
        .select('*')
        .eq('user_id', userId)
        .order('shares_percentage', { ascending: false });

      shareholders = shareholdersData || [];
    }

    // 3️⃣ Générer TOUS les PDFs
    console.log('📄 Génération des PDFs...');
    
    const pdfs = generateAllDocuments({
      companyData: companyData,
      shareholders: shareholders,
    });

    console.log(`✅ ${Object.keys(pdfs).length} PDFs générés`);

    // 4️⃣ Uploader les PDFs dans Supabase Storage
    const uploadedDocIds: string[] = [];
    const uploadErrors: string[] = [];

    for (const [docType, pdfDoc] of Object.entries(pdfs)) {
      try {
        // Convertir le PDF en buffer
        const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

        const fileName = `${docType}_${Date.now()}.pdf`;
        const filePath = `${userId}/generated/${fileName}`;

        // Upload dans Storage
        const { error: uploadError } = await supabase.storage
          .from('company-documents')
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false,
          });

        if (uploadError) {
          console.error(`❌ Erreur upload ${docType}:`, uploadError);
          uploadErrors.push(`Upload ${docType}: ${uploadError.message}`);
          continue;
        }

        console.log(`✅ ${docType} uploadé dans Storage`);

        // Insérer dans la DB avec SERVICE ROLE (bypass RLS)
        const { data: dbDoc, error: dbError } = await supabase
          .from('company_documents')
          .insert({
            user_id: userId,
            document_type: docType,
            file_name: getDocumentLabel(docType) + '.pdf',
            file_path: filePath,
            file_size: pdfBuffer.length,
            mime_type: 'application/pdf',
            source: 'generated',
            status: 'pending',
            generated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (dbError) {
          console.error(`❌ Erreur DB ${docType}:`, JSON.stringify(dbError, null, 2));
          uploadErrors.push(`DB ${docType}: ${dbError.message}`);
          continue;
        }

        if (dbDoc) {
          uploadedDocIds.push(dbDoc.id);
          console.log(`✅ ${docType} enregistré en DB`);
        }

      } catch (error: any) {
        console.error(`❌ Erreur traitement ${docType}:`, error);
        uploadErrors.push(`${docType}: ${error.message}`);
      }
    }

    if (uploadedDocIds.length === 0) {
      console.error('❌ Aucun document généré avec succès');
      return NextResponse.json(
        { 
          error: 'Aucun document généré avec succès',
          details: uploadErrors 
        },
        { status: 500 }
      );
    }

    console.log(`✅ ${uploadedDocIds.length} documents uploadés et enregistrés`);

    // 5️⃣ Créer la demande de signature YouSign
    console.log('🔐 Envoi en signature via YouSign...');

    const signatureResult = await createSignatureRequest({
      userId: userId,
      companyId: company_id,
      documentIds: uploadedDocIds,
      signerEmail: user_email,
      signerName: `${companyData.president_first_name} ${companyData.president_last_name}`,
    });

    if (!signatureResult.success) {
      console.error('❌ Erreur YouSign:', signatureResult.error);
      
      // Même si YouSign échoue, on retourne les docs générés
      return NextResponse.json({
        success: true,
        warning: 'Documents générés mais erreur signature',
        signature_error: signatureResult.error,
        documents_count: uploadedDocIds.length,
        signature_url: null,
      });
    }

    // 6️⃣ Mettre à jour le workflow
    await supabase
      .from('company_creation_data')
      .update({
        step: 'signature',
        updated_at: new Date().toISOString(),
      })
      .eq('id', company_id);

    console.log('✅ Processus terminé avec succès');

    return NextResponse.json({
      success: true,
      message: `${uploadedDocIds.length} documents générés et envoyés en signature`,
      signature_url: signatureResult.signatureUrl,
      signature_request_id: signatureResult.signatureRequestId,
      documents_count: uploadedDocIds.length,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined,
    });

  } catch (error: any) {
    console.error('❌ Erreur generate-and-sign:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur de génération',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper pour les labels
function getDocumentLabel(docType: string): string {
  const labels: Record<string, string> = {
    statuts: 'Statuts',
    pv_decision_unique: 'PV de décision unique',
    pv_ag_constitutive: 'PV d\'assemblée générale constitutive',
    attestation_domiciliation: 'Attestation de domiciliation',
    attestation_non_condamnation: 'Attestation de non-condamnation',
    declaration_beneficiaires: 'Déclaration des bénéficiaires effectifs',
    formulaire_m0: 'Formulaire M0',
    etat_actes_accomplis: 'État des actes accomplis',
  };

  return labels[docType] || docType;
}