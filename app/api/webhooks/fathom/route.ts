import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FATHOM_API_KEY = process.env.FATHOM_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log('📨 Webhook Fathom reçu:', payload);

    // Payload Fathom contient :
    // - recording_id
    // - video_url
    // - transcript
    // - summary
    // - action_items
    // - participants

    const { 
      recording_id, 
      video_url, 
      transcript, 
      summary, 
      action_items,
      duration,
      created_at 
    } = payload;

    // 1. Récupérer l'ID du RDV associé (passé en metadata lors du démarrage)
    const rdvId = payload.metadata?.rdv_id;
    const clientId = payload.metadata?.client_id;

    if (!rdvId || !clientId) {
      console.error('❌ Pas de rdv_id ou client_id dans metadata');
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // 2. Télécharger la vidéo depuis Fathom
    const videoResponse = await fetch(video_url, {
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
      },
    });

    if (!videoResponse.ok) {
      throw new Error('Failed to download video from Fathom');
    }

    const videoBlob = await videoResponse.blob();
    const videoBuffer = await videoBlob.arrayBuffer();

    // 3. Upload vidéo dans Supabase Storage
    const videoFileName = `rdv/${clientId}/${recording_id}_${Date.now()}.mp4`;
    
    const { error: uploadError } = await supabase.storage
      .from('rdv-recordings')
      .upload(videoFileName, videoBuffer, {
        contentType: 'video/mp4',
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw uploadError;
    }

    // 4. Récupérer URL publique (ou signée)
    const { data: { publicUrl } } = supabase.storage
      .from('rdv-recordings')
      .getPublicUrl(videoFileName);

    // 5. Créer entrée dans la table rdv_recordings
    const { data: recording, error: dbError } = await supabase
      .from('rdv_recordings')
      .insert({
        rdv_id: rdvId,
        client_id: clientId,
        fathom_recording_id: recording_id,
        video_url: publicUrl,
        transcript,
        summary,
        action_items,
        duration,
        recorded_at: created_at,
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw dbError;
    }

    // 6. Générer PDF récapitulatif
    await generateRDVReport(recording.id, clientId);

    // 7. Notifier le client
    await supabase.from('notifications').insert({
      user_id: clientId,
      type: 'rdv_recording_ready',
      title: 'Enregistrement RDV disponible 🎥',
      message: 'La vidéo et le compte-rendu de votre rendez-vous sont disponibles',
      link: '/client/mes-rdv',
    });

    console.log('✅ RDV recording processed:', recording.id);

    return NextResponse.json({ success: true, recording_id: recording.id });

  } catch (error: any) {
    console.error('❌ Webhook Fathom error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function generateRDVReport(recordingId: string, clientId: string) {
  try {
    // Récupérer les données du RDV
    const { data: recording } = await supabase
      .from('rdv_recordings')
      .select('*, rdv:rdv_id(*)')
      .eq('id', recordingId)
      .single();

    if (!recording) return;

    // TODO: Générer PDF avec pdf-lib ou autre
    // Contenu :
    // - Date et durée du RDV
    // - Résumé IA
    // - Points clés abordés
    // - Actions à effectuer
    // - Transcription complète
    // - Lien vers vidéo

    const pdfContent = `
COMPTE-RENDU RDV EXPERT
========================

Date: ${new Date(recording.recorded_at).toLocaleDateString('fr-FR')}
Durée: ${recording.duration} minutes

RÉSUMÉ
------
${recording.summary}

ACTIONS À EFFECTUER
-------------------
${recording.action_items?.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}

TRANSCRIPTION
-------------
${recording.transcript}

Vidéo disponible: ${recording.video_url}
    `;

    // Upload PDF dans Supabase
    const pdfFileName = `rdv/${clientId}/rapport_${recordingId}.pdf`;
    
    // Pour l'instant, on stocke le texte (à remplacer par vraie génération PDF)
    await supabase.storage
      .from('rdv-recordings')
      .upload(pdfFileName, pdfContent, {
        contentType: 'text/plain', // Remplacer par 'application/pdf'
      });

    // Mettre à jour l'enregistrement avec le lien PDF
    const { data: { publicUrl } } = supabase.storage
      .from('rdv-recordings')
      .getPublicUrl(pdfFileName);

    await supabase
      .from('rdv_recordings')
      .update({ pdf_report_url: publicUrl })
      .eq('id', recordingId);

    console.log('✅ PDF report generated:', pdfFileName);

  } catch (error) {
    console.error('❌ PDF generation error:', error);
  }
}