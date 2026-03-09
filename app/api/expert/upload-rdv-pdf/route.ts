import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;
    const clientId = formData.get('clientId') as string;
    const rdvNumber = formData.get('rdvNumber') as string;

    if (!file || !sessionId || !clientId || !rdvNumber) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // 1. Upload PDF dans Supabase Storage
    const fileName = `rdv-${rdvNumber}_${sessionId}_${Date.now()}.pdf`;
    const filePath = `rdv-pdfs/${clientId}/${fileName}`;

    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 2. Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const pdfUrl = urlData.publicUrl;

    // 3. Mettre à jour la session RDV
    const { error: sessionError } = await supabase
      .from('expert_rdv_sessions')
      .update({
        pdf_url: pdfUrl,
        pdf_generated_at: new Date().toISOString(),
        completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (sessionError) throw sessionError;

    // 4. Ajouter dans client_documents
    const { error: docError } = await supabase
      .from('client_documents')
      .insert({
        user_id: clientId,
        document_type: 'rdv_expert',
        title: `Compte-rendu RDV Expert #${rdvNumber}`,
        file_url: pdfUrl,
        file_name: fileName,
        file_size: file.size,
        status: 'validated',
        uploaded_by: 'expert',
      });

    if (docError) throw docError;

    return NextResponse.json({
      success: true,
      pdfUrl,
      fileName,
    });
  } catch (error: any) {
    console.error('❌ Upload PDF error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}