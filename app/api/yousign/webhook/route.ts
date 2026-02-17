import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Webhook YouSign - Reçoit les événements de signature
 * URL à configurer dans YouSign : https://ton-domaine.vercel.app/api/yousign/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    console.log('📨 Webhook YouSign reçu:', event.event_name);

    // Vérifier la signature du webhook (recommandé en production)
    // const signature = req.headers.get('x-yousign-signature');
    // if (!verifySignature(signature, event)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const eventName = event.event_name;
    const signatureRequestId = event.signature_request?.id;
    const externalId = event.signature_request?.external_id; // = contractId

    if (!signatureRequestId) {
      return NextResponse.json({ error: 'Pas de signature_request_id' }, { status: 400 });
    }

    // Gérer les différents événements
    switch (eventName) {
      case 'signature_request.done':
        // Tous les signataires ont signé
        await handleSignatureDone(externalId, signatureRequestId);
        break;

      case 'signature_request.declined':
        // Signature refusée
        await handleSignatureDeclined(externalId, signatureRequestId);
        break;

      case 'signature_request.expired':
        // Signature expirée
        await handleSignatureExpired(externalId, signatureRequestId);
        break;

      case 'signer.done':
        // Un signataire a signé
        await handleSignerDone(externalId, signatureRequestId, event.signer);
        break;

      default:
        console.log(`📌 Événement non géré: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erreur webhook YouSign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// HANDLERS
// ============================================

async function handleSignatureDone(contractId: string, yousignId: string) {
  console.log('✅ Signature complétée:', contractId);

  // Mettre à jour le contrat
  const { error } = await supabase
    .from('contracts')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (error) {
    console.error('Erreur update contrat signé:', error);
    return;
  }

  // Récupérer le contrat pour déterminer les actions à faire
  const { data: contract } = await supabase
    .from('contracts')
    .select('*, users!inner(id, auth_id, email, first_name)')
    .eq('id', contractId)
    .single();

  if (!contract) return;

  // Actions selon le type de contrat
  if (contract.contract_type === 'client_subscription') {
    // Activer la subscription si elle existe déjà
    await supabase
      .from('user_subscriptions')
      .update({ is_active: true })
      .eq('user_id', contract.user_id)
      .eq('pack_type', contract.pack_type);

    console.log('✅ Subscription activée pour:', contract.users.email);
  } else if (contract.contract_type === 'team_onboarding') {
    // Marquer le contrat comme signé dans team_members
    await supabase
      .from('team_members')
      .update({ 
        contract_signed: true,
        status: 'active',
      })
      .eq('user_id', contract.user_id);

    console.log('✅ Contrat équipe signé pour:', contract.users.email);
  }

  // TODO: Envoyer email de confirmation
}

async function handleSignatureDeclined(contractId: string, yousignId: string) {
  console.log('❌ Signature refusée:', contractId);

  await supabase
    .from('contracts')
    .update({
      status: 'refused',
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  // TODO: Envoyer email de notification admin
}

async function handleSignatureExpired(contractId: string, yousignId: string) {
  console.log('⏰ Signature expirée:', contractId);

  await supabase
    .from('contracts')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  // TODO: Envoyer rappel ou générer nouveau contrat
}

async function handleSignerDone(contractId: string, yousignId: string, signer: any) {
  console.log('📝 Signataire a signé:', signer.email);

  // Pour tracking intermédiaire si plusieurs signataires
  // Dans notre cas (1 seul signataire), cet événement précède signature_request.done
}