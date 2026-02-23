// app/api/fathom/start/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const FATHOM_API_URL = 'https://api.fathom.video/v1';
const FATHOM_API_KEY = process.env.FATHOM_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, clientName, rdvNumber } = await req.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    // Créer l'enregistrement Fathom
    const title = `RDV #${rdvNumber} - ${clientName}`;
    
    const response = await fetch(`${FATHOM_API_URL}/recordings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        auto_start: false, // L'expert démarre manuellement
      }),
    });

    if (!response.ok) {
      throw new Error(`Fathom API error: ${response.statusText}`);
    }

    const fathomData = await response.json();

    // Mettre à jour le RDV avec l'ID Fathom dans les notes
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    await supabase
      .from('expert_appointments')
      .update({
        notes: `Fathom ID: ${fathomData.id}`,
        fathom_recording_url: fathomData.share_url || null,
      })
      .eq('id', appointmentId);

    return NextResponse.json({
      success: true,
      fathom_url: fathomData.join_url || fathomData.share_url,
      recording_id: fathomData.id,
    });

  } catch (error: any) {
    console.error('❌ Erreur démarrage Fathom:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}