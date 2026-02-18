// lib/yousign/yousignService.ts
import { createClient } from '@supabase/supabase-js';

const YOUSIGN_API_KEY = process.env.YOUSIGN_API_KEY!;
const YOUSIGN_BASE_URL = 'https://api.yousign.app/v3';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// AJOUT : Fonction pour contrats (closer, setter, expert, client)
// ============================================
export async function sendContractToYouSign(
  email: string,
  name: string,
  pdfPath: string,
  packName: string
) {
  try {
    const { data: fileData } = await supabase.storage
      .from('contracts')
      .download(pdfPath);

    if (!fileData) throw new Error('PDF not found');

    const formData = new FormData();
    formData.append('file', new Blob([await fileData.arrayBuffer()]), 'contract.pdf');
    formData.append('nature', 'signable_document');

    const uploadResponse = await fetch(`${YOUSIGN_BASE_URL}/documents`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${YOUSIGN_API_KEY}` },
      body: formData,
    });

    if (!uploadResponse.ok) throw new Error('Failed to upload to YouSign');
    const document = await uploadResponse.json();

    const signatureResponse = await fetch(`${YOUSIGN_BASE_URL}/signature_requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Contrat ${packName}`,
        delivery_mode: 'email',
        documents: [document.id],
        signers: [{
          info: {
            first_name: name.split(' ')[0],
            last_name: name.split(' ').slice(1).join(' ') || name,
            email: email,
          },
          signature_level: 'electronic_signature',
          signature_authentication_mode: 'otp_email',
        }],
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/yousign`,
      }),
    });

    if (!signatureResponse.ok) throw new Error('Failed to create signature request');
    const signatureData = await signatureResponse.json();

    return {
      id: signatureData.id,
      url: signatureData.signers[0].signature_link,
    };
  } catch (error: any) {
    console.error('❌ YouSign send error:', error);
    throw error;
  }
}

// ============================================
// TON CODE ORIGINAL POUR DOCUMENTS SOCIÉTÉ
// ============================================

interface SignatureRequest {
  userId: string;
  companyId: string;
  documentIds: string[];
  signerEmail: string;
  signerName: string;
}

interface YouSignDocument {
  file: string;
  name: string;
}

interface YouSignSigner {
  info: {
    first_name: string;
    last_name: string;
    email: string;
  };
  signature_level: 'electronic_signature' | 'advanced_electronic_signature';
  signature_authentication_mode: 'otp_sms' | 'otp_email';
}

export async function createSignatureRequest(params: SignatureRequest): Promise<{
  success: boolean;
  signatureRequestId?: string;
  signatureUrl?: string;
  error?: string;
}> {
  try {
    console.log('🔐 Création demande de signature YouSign...');

    const documents: YouSignDocument[] = [];
    
    for (const docId of params.documentIds) {
      const { data: docData, error: docError } = await supabase
        .from('company_documents')
        .select('*')
        .eq('id', docId)
        .single();

      if (docError || !docData) {
        console.error(`❌ Document ${docId} introuvable`);
        continue;
      }

      const { data: fileData, error: fileError } = await supabase.storage
        .from('company-documents')
        .download(docData.file_path);

      if (fileError || !fileData) {
        console.error(`❌ Erreur téléchargement ${docData.file_path}`);
        continue;
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const base64 = buffer.toString('base64');

      documents.push({
        file: base64,
        name: docData.file_name,
      });
    }

    if (documents.length === 0) {
      return {
        success: false,
        error: 'Aucun document à signer',
      };
    }

    const nameParts = params.signerName.split(' ');
    const firstName = nameParts[0] || 'Client';
    const lastName = nameParts.slice(1).join(' ') || 'Déclic';

    const payload = {
      name: `Signature documents - ${params.companyId}`,
      delivery_mode: 'email',
      timezone: 'Europe/Paris',
      email_notification: {
        sender_name: 'Déclic Entrepreneurs',
        subject: '📄 Documents à signer - Déclic Entrepreneurs',
        message: 'Merci de signer les documents de création de votre société.',
      },
      documents: documents,
      signers: [
        {
          info: {
            first_name: firstName,
            last_name: lastName,
            email: params.signerEmail,
            phone_number: '+33600000000',
          },
          signature_level: 'electronic_signature',
          signature_authentication_mode: 'otp_email',
          fields: [
            {
              type: 'signature',
              page: 1,
              x: 100,
              y: 650,
              width: 150,
              height: 50,
            },
          ],
        } as YouSignSigner,
      ],
      external_id: params.companyId,
      custom_experience_id: null,
    };

    const response = await fetch(`${YOUSIGN_BASE_URL}/signature_requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erreur YouSign:', errorData);
      return {
        success: false,
        error: `Erreur YouSign: ${errorData.message || response.statusText}`,
      };
    }

    const result = await response.json();
    console.log('✅ Demande de signature créée:', result.id);

    await supabase
      .from('signature_requests')
      .insert({
        user_id: params.userId,
        company_id: params.companyId,
        yousign_signature_request_id: result.id,
        status: 'pending',
        signature_url: result.signers[0].signature_link,
        documents_ids: params.documentIds,
        created_at: new Date().toISOString(),
      });

    await supabase
      .from('company_documents')
      .update({
        status: 'pending_signature',
        updated_at: new Date().toISOString(),
      })
      .in('id', params.documentIds);

    return {
      success: true,
      signatureRequestId: result.id,
      signatureUrl: result.signers[0].signature_link,
    };

  } catch (error: any) {
    console.error('❌ Erreur createSignatureRequest:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue',
    };
  }
}

export async function handleYouSignWebhook(payload: any): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log('📨 Webhook YouSign reçu:', payload.event_name);

    const eventName = payload.event_name;
    const signatureRequestId = payload.signature_request?.id;

    if (!signatureRequestId) {
      return { success: false, error: 'Pas de signature_request_id' };
    }

    const { data: signatureRequest, error: dbError } = await supabase
      .from('signature_requests')
      .select('*')
      .eq('yousign_signature_request_id', signatureRequestId)
      .single();

    if (dbError || !signatureRequest) {
      console.error('❌ Signature request introuvable');
      return { success: false, error: 'Signature request introuvable' };
    }

    switch (eventName) {
      case 'signature_request.done':
        console.log('✅ Tous les documents signés !');

        const signedDocuments = await downloadSignedDocuments(signatureRequestId);

        for (const doc of signedDocuments) {
          const filePath = `${signatureRequest.user_id}/signed/${doc.name}`;

          await supabase.storage
            .from('company-documents')
            .upload(filePath, doc.buffer, {
              contentType: 'application/pdf',
              upsert: true,
            });

          await supabase
            .from('company_documents')
            .insert({
              user_id: signatureRequest.user_id,
              document_type: doc.type,
              file_name: doc.name,
              file_path: filePath,
              source: 'signed',
              status: 'signed',
              signed_at: new Date().toISOString(),
            });
        }

        await supabase
          .from('signature_requests')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', signatureRequest.id);

        await supabase
          .from('company_creation_data')
          .update({
            step: 'inpi',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', signatureRequest.user_id);

        console.log('✅ Documents signés téléchargés et enregistrés');
        break;

      case 'signature_request.declined':
        console.log('❌ Signature refusée');
        await supabase
          .from('signature_requests')
          .update({ status: 'declined' })
          .eq('id', signatureRequest.id);
        break;

      case 'signature_request.expired':
        console.log('⏰ Signature expirée');
        await supabase
          .from('signature_requests')
          .update({ status: 'expired' })
          .eq('id', signatureRequest.id);
        break;

      default:
        console.log(`ℹ️ Événement non géré: ${eventName}`);
    }

    return { success: true };

  } catch (error: any) {
    console.error('❌ Erreur handleYouSignWebhook:', error);
    return { success: false, error: error.message };
  }
}

async function downloadSignedDocuments(signatureRequestId: string): Promise<Array<{
  name: string;
  type: string;
  buffer: Buffer;
}>> {
  try {
    const response = await fetch(
      `${YOUSIGN_BASE_URL}/signature_requests/${signatureRequestId}`,
      {
        headers: {
          'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur récupération signature request');
    }

    const signatureRequest = await response.json();
    const documents = signatureRequest.documents || [];

    const signedDocs = [];

    for (const doc of documents) {
      const downloadResponse = await fetch(
        `${YOUSIGN_BASE_URL}/documents/${doc.id}/download`,
        {
          headers: {
            'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
          },
        }
      );

      if (downloadResponse.ok) {
        const buffer = Buffer.from(await downloadResponse.arrayBuffer());
        signedDocs.push({
          name: `${doc.name}_signe.pdf`,
          type: extractDocType(doc.name),
          buffer,
        });
      }
    }

    return signedDocs;

  } catch (error) {
    console.error('❌ Erreur downloadSignedDocuments:', error);
    return [];
  }
}

function extractDocType(filename: string): string {
  if (filename.includes('statuts')) return 'statuts_signed';
  if (filename.includes('pv_decision')) return 'pv_decision_signed';
  if (filename.includes('pv_ag')) return 'pv_ag_signed';
  if (filename.includes('domiciliation')) return 'attestation_domiciliation_signed';
  if (filename.includes('non_condamnation')) return 'attestation_non_condamnation_signed';
  if (filename.includes('beneficiaires')) return 'declaration_beneficiaires_signed';
  if (filename.includes('m0')) return 'formulaire_m0_signed';
  if (filename.includes('actes')) return 'etat_actes_signed';
  return 'document_signed';
}

export async function checkSignatureStatus(signatureRequestId: string): Promise<{
  status: string;
  signers: any[];
}> {
  try {
    const response = await fetch(
      `${YOUSIGN_BASE_URL}/signature_requests/${signatureRequestId}`,
      {
        headers: {
          'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur vérification statut');
    }

    const data = await response.json();

    return {
      status: data.status,
      signers: data.signers || [],
    };

  } catch (error) {
    console.error('❌ Erreur checkSignatureStatus:', error);
    throw error;
  }
}

export async function remindSigner(signatureRequestId: string, signerId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${YOUSIGN_BASE_URL}/signature_requests/${signatureRequestId}/signers/${signerId}/send_reminder`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('❌ Erreur remindSigner:', error);
    return false;
  }
}