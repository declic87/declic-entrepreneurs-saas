import { NextRequest, NextResponse } from 'next/server';
import { handleYouSignWebhook } from '@/lib/yousign/yousignService';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log('📨 Webhook YouSign reçu:', {
      event: payload.event_name,
      signature_request_id: payload.signature_request?.id,
    });

    const result = await handleYouSignWebhook(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur inconnue' },
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