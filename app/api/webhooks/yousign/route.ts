// app/api/webhooks/yousign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleYouSignWebhook } from '@/lib/yousign/yousignService';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log('📨 Webhook YouSign reçu:', {
      event: payload.event_name,
      signature_request_id: payload.signature_request?.id,
    });

    // Vérifier la signature du webhook (sécurité)
    const signature = request.headers.get('x-yousign-signature');
    
    // TODO: Implémenter la vérification de signature
    // const isValid = verifyYouSignSignature(payload, signature);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Traiter le webhook
    const result = await handleYouSignWebhook(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erreur webhook YouSign:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}