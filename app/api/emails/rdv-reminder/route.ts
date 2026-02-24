// app/api/emails/rdv-reminder/route.ts
import { NextResponse } from 'next/server';
import { sendExpertRDVReminder } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, clientEmail, expertName, rdvDate, rdvTime, meetLink } = body;

    if (!clientName || !clientEmail || !expertName || !rdvDate || !rdvTime || !meetLink) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const result = await sendExpertRDVReminder({
      clientName,
      clientEmail,
      expertName,
      rdvDate,
      rdvTime,
      meetLink,
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