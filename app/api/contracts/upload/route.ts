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
    const userId = formData.get('userId') as string;
    const contractType = formData.get('contractType') as string;

    if (!file || !userId || !contractType) {
      return NextResponse.json(
        { error: 'Fichier, userId et contractType requis' },
        { status: 400 }
      );
    }

    // Vérifier que c'est un PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Seuls les fichiers PDF sont acceptés' },
        { status: 400 }
      );
    }

    // Upload dans Supabase Storage
    const fileName = `contracts/contract_${userId}_${Date.now()}.pdf`;

    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return NextResponse.json({
      file_url: urlData.publicUrl,
      file_name: file.name,
      is_manual_upload: true,
    });
  } catch (error: any) {
    console.error('❌ Erreur upload:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}