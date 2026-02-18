import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUSIGN_API_KEY = process.env.YOUSIGN_API_KEY!;
const YOUSIGN_API_URL = 'https://api.yousign.app/v3';

export async function handleYouSignWebhook(payload: any) {
  try {
    const eventName = payload.event_name;
    const signatureRequest = payload.signature_request;

    console.log('📨 Processing event:', eventName);

    switch (eventName) {
      case 'signature_request.done':
        return await handleSignatureDone(signatureRequest);
      
      case 'signature_request.signed':
        return await handleSignatureSigned(signatureRequest);
      
      case 'signature_request.declined':
        return await handleSignatureDeclined(signatureRequest);
      
      case 'signature_request.expired':
        return await handleSignatureExpired(signatureRequest);
      
      default:
        console.log('⚠️ Unhandled event:', eventName);
        return { success: true };
    }
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return { success: false, error: error.message };
  }
}

async function handleSignatureDone(signatureRequest: any) {
  const signatureRequestId = signatureRequest.id;

  // 1. Mettre à jour le contrat
  const { error } = await supabase
    .from('contracts')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
    })
    .eq('yousign_signature_request_id', signatureRequestId);

  if (error) {
    console.error('❌ Failed to update contract:', error);
    return { success: false, error: error.message };
  }

  console.log('✅ Contract marked as signed:', signatureRequestId);

  // 2. Télécharger le PDF signé
  if (signatureRequest.documents && signatureRequest.documents.length > 0) {
    await downloadSignedPDF(signatureRequestId, signatureRequest.documents[0].id);
  }

  // 3. Créer une notification
  await createSignatureNotification(signatureRequestId, 'contract_signed');

  return { success: true };
}

async function handleSignatureSigned(signatureRequest: any) {
  console.log('✅ Partial signature received:', signatureRequest.id);
  
  // Notif optionnelle "signature en cours"
  return { success: true };
}

async function handleSignatureDeclined(signatureRequest: any) {
  const signatureRequestId = signatureRequest.id;

  await supabase
    .from('contracts')
    .update({ status: 'declined' })
    .eq('yousign_signature_request_id', signatureRequestId);

  console.log('❌ Contract declined:', signatureRequestId);

  // Notifier les admins
  await notifyAdmins('contract_declined', signatureRequestId);

  return { success: true };
}

async function handleSignatureExpired(signatureRequest: any) {
  const signatureRequestId = signatureRequest.id;

  await supabase
    .from('contracts')
    .update({ status: 'expired' })
    .eq('yousign_signature_request_id', signatureRequestId);

  console.log('⏰ Contract expired:', signatureRequestId);

  return { success: true };
}

async function downloadSignedPDF(signatureRequestId: string, documentId: string) {
  try {
    const response = await fetch(
      `${YOUSIGN_API_URL}/documents/${documentId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to download PDF');

    const pdfBuffer = await response.arrayBuffer();
    const fileName = `contracts/signed_${signatureRequestId}_${Date.now()}.pdf`;
    
    const { error } = await supabase.storage
      .from('contracts')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
      });

    if (error) throw error;

    await supabase
      .from('contracts')
      .update({ signed_pdf_url: fileName })
      .eq('yousign_signature_request_id', signatureRequestId);

    console.log('✅ Signed PDF stored:', fileName);
  } catch (error) {
    console.error('❌ Failed to download signed PDF:', error);
  }
}

async function createSignatureNotification(signatureRequestId: string, type: string) {
  const { data: contract } = await supabase
    .from('contracts')
    .select('user_id, team_member_id, contract_type')
    .eq('yousign_signature_request_id', signatureRequestId)
    .single();

  if (!contract) return;

  const userId = contract.user_id || contract.team_member_id;
  const link = contract.user_id ? '/client/contrat' : 
               contract.contract_type === 'closer' ? '/commercial/contrat' :
               contract.contract_type === 'setter' ? '/setter/contrat' :
               contract.contract_type === 'expert' ? '/expert/contrat' :
               '/hos/contrat';

  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title: 'Contrat signé ✅',
    message: 'Votre contrat a été signé avec succès',
    link,
  });
}

async function notifyAdmins(type: string, signatureRequestId: string) {
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'ADMIN');

  if (!admins) return;

  for (const admin of admins) {
    await supabase.from('notifications').insert({
      user_id: admin.id,
      type,
      title: 'Contrat refusé',
      message: `Un contrat a été refusé (ID: ${signatureRequestId})`,
      link: '/admin/contrats',
    });
  }
}

// Fonction pour envoyer un contrat via YouSign
export async function sendContractToYouSign(
  email: string,
  name: string,
  pdfPath: string,
  packName: string
) {
  try {
    // 1. Télécharger le PDF depuis Supabase
    const { data: fileData } = await supabase.storage
      .from('contracts')
      .download(pdfPath);

    if (!fileData) throw new Error('PDF not found');

    // 2. Upload vers YouSign
    const formData = new FormData();
    formData.append('file', new Blob([await fileData.arrayBuffer()]), 'contract.pdf');
    formData.append('nature', 'signable_document');

    const uploadResponse = await fetch(`${YOUSIGN_API_URL}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) throw new Error('Failed to upload to YouSign');
    const document = await uploadResponse.json();

    // 3. Créer la demande de signature
    const signatureResponse = await fetch(`${YOUSIGN_API_URL}/signature_requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Contrat ${packName}`,
        delivery_mode: 'email',
        documents: [document.id],
        signers: [
          {
            info: {
              first_name: name.split(' ')[0],
              last_name: name.split(' ').slice(1).join(' ') || name,
              email: email,
            },
            signature_level: 'electronic_signature',
            signature_authentication_mode: 'otp_email',
          },
        ],
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