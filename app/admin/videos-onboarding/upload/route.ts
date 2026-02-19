import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { role, loomUrl, title, description } = await request.json();

    if (!role || !loomUrl || !title) {
      return NextResponse.json(
        { error: 'Role, loomUrl et title sont requis' },
        { status: 400 }
      );
    }

    // Sauvegarder la vidéo
    const { data, error } = await supabase
      .from('onboarding_videos')
      .insert({
        role,
        loom_url: loomUrl,
        title,
        description,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('DB Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, video: data });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}