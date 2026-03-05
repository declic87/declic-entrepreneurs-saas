import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Liste des templates d'une vidéo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('formation_templates')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ templates: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Upload un fichier
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const videoId = formData.get('videoId') as string;
    const name = formData.get('name') as string;

    if (!file || !videoId) {
      return NextResponse.json(
        { error: 'Fichier et videoId requis' },
        { status: 400 }
      );
    }

    // Déterminer le type de fichier
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    
    // Upload dans Supabase Storage
    const fileName = `formations/${videoId}/${Date.now()}_${file.name}`;
    
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Enregistrer dans la table
    const { data, error } = await supabase
      .from('formation_templates')
      .insert({
        video_id: videoId,
        name: name || file.name,
        file_url: urlData.publicUrl,
        file_type: fileType,
        file_size: file.size,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, template: data });
  } catch (error: any) {
    console.error('❌ Erreur upload:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprimer un fichier
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('formation_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}