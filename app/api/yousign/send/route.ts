import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUSIGN_API_URL = 'https://api.yousign.app/v3';
const YOUSIGN_API_KEY = process.env.YOUSIGN_API_KEY!;

/**
 * Envoie un contrat à YouSign pour signature
 */
export async function POST(req: NextRequest) {
  try {
    const { contractId } = await req.json();

    if (!contractId) {
      return NextResponse.json({ error: 'contractId requis' }, { status: 400 });
    }

    // Récupérer le contrat
    const { data: contract } = await supabase
      .from('contracts')
      .select('*, users!inner(first_name, last_name, email)')
      .eq('id', contractId)
      .single();

    if (!contract) {
      return NextResponse.json({ error: 'Contrat non trouvé' }, { status: 404 });
    }

    if (!contract.pdf_url) {
      return NextResponse.json({ error: 'PDF non généré' }, { status: 400 });
    }

    const user = contract.users;

    // Télécharger le PDF depuis Supabase
    const pdfResponse = await fetch(contract.pdf_url);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    // Créer la demande de signature sur YouSign
    const yousignResponse = await fetch(`${YOUSIGN_API_URL}/signature_requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Contrat ${contract.contract_type} - ${user.first_name} ${user.last_name}`,
        delivery_mode: 'email',
        timezone: 'Europe/Paris',
        email_custom_note: `Bonjour ${user.first_name},\n\nVeuillez signer ce contrat pour finaliser votre inscription.\n\nCordialement,\nL'équipe DÉCLIC Entrepreneurs`,
        
        // Document
        documents: [
          {
            nature: 'signable_document',
            file: {
              name: `contrat_${contractId}.pdf`,
              content: pdfBase64,
            },
          },
        ],

        // Signataires
        signers: [
          {
            info: {
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              locale: 'fr',
            },
            signature_level: 'electronic_signature',
            signature_authentication_mode: 'otp_email',
            fields: [
              {
                type: 'signature',
                page: 1,
                x: 100,
                y: 100,
              },
            ],
          },
        ],

        // Notifications
        external_id: contractId,
        custom_experience_id: null,
      }),
    });

    if (!yousignResponse.ok) {
      const error = await yousignResponse.text();
      console.error('Erreur YouSign:', error);
      return NextResponse.json({ error: 'Erreur YouSign' }, { status: 500 });
    }

    const yousignData = await yousignResponse.json();

    // Mettre à jour le contrat avec l'ID YouSign
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        yousign_signature_request_id: yousignData.id,
        yousign_signer_id: yousignData.signers[0].id,
        status: 'pending_signature',
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('Erreur update contract:', updateError);
    }

    return NextResponse.json({
      success: true,
      yousignId: yousignData.id,
      message: 'Contrat envoyé pour signature',
    });
  } catch (error: any) {
    console.error('Erreur envoi YouSign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}