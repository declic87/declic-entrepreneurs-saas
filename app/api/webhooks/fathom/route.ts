// app/api/webhooks/fathom/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const FATHOM_WEBHOOK_SECRET = process.env.FATHOM_WEBHOOK_SECRET;

function verifyFathomSignature(payload: string, signature: string): boolean {
  if (!FATHOM_WEBHOOK_SECRET) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', FATHOM_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-fathom-signature') || '';
    const payload = await req.text();

    // Vérifier la signature
    if (!verifyFathomSignature(payload, signature)) {
      console.error('❌ Signature Fathom invalide');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(payload);
    console.log('📹 Webhook Fathom reçu:', data.event);

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

    // Event: recording.completed
    if (data.event === 'recording.completed') {
      const { recording_id, share_url, title, summary, transcript } = data.data;

      // Trouver le RDV correspondant par titre ou URL
      // Le titre devrait être : "RDV #{rdv_number} - {client_name}"
      
      // Chercher par URL si elle existe déjà
      let { data: appointment } = await supabase
        .from('expert_appointments')
        .select('*')
        .eq('fathom_recording_url', share_url)
        .single();

      // Si pas trouvé par URL, chercher par ID Fathom
      if (!appointment) {
        const { data: appointments } = await supabase
          .from('expert_appointments')
          .select('*')
          .ilike('notes', `%${recording_id}%`)
          .limit(1);

        appointment = appointments?.[0];
      }

      if (appointment) {
        // Mettre à jour le RDV avec les infos Fathom
        await supabase
          .from('expert_appointments')
          .update({
            fathom_recording_url: share_url,
            fathom_summary: summary || null,
            fathom_transcript: transcript || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointment.id);

        console.log('✅ RDV mis à jour avec Fathom:', appointment.id);
      } else {
        console.log('⚠️ Aucun RDV trouvé pour ce Fathom:', recording_id);
      }
    }

    // Event: summary.generated
    if (data.event === 'summary.generated') {
      const { recording_id, summary } = data.data;

      // Mettre à jour tous les RDV avec cet ID Fathom
      await supabase
        .from('expert_appointments')
        .update({ fathom_summary: summary })
        .ilike('notes', `%${recording_id}%`);

      console.log('✅ Résumé Fathom mis à jour:', recording_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur webhook Fathom:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}