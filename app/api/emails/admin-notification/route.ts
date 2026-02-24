// app/api/emails/admin-notification/route.ts
import { NextResponse } from 'next/server';
import { sendAdminNewClientNotification } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, clientEmail, pack, amount } = body;

    if (!clientName || !clientEmail || !pack || !amount) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const result = await sendAdminNewClientNotification({
      clientName,
      clientEmail,
      pack,
      amount,
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      throw new Error('Erreur envoi email');
    }
  } catch (error: any) {
    console.error('Erreur API:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}