import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            cookie: cookieStore.toString(),
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer l'user_id
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer les accès pour savoir quelles formations afficher
    const { data: accessData } = await supabaseAdmin
      .from('client_access')
      .select('pack_type, has_formation_createur, has_formation_agent_immo')
      .eq('user_id', userData.id)
      .single();

    if (!accessData) {
      return NextResponse.json({ videos: [] });
    }

    // Récupérer toutes les vidéos de formations
    const { data: allVideos, error: videosError } = await supabaseAdmin
      .from('onboarding_videos_client')
      .select('*')
      .eq('section', 'formations')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (videosError) {
      console.error('❌ Erreur vidéos:', videosError);
      return NextResponse.json({ error: videosError.message }, { status: 500 });
    }

    // Filtrer selon les accès
    const filteredVideos = (allVideos || []).filter((video: any) => {
      // Formation Créateur
      if (video.category === 'Créateur') {
        return accessData.has_formation_createur;
      }
      // Formation Agent Immo
      if (video.category === 'Agent Immo') {
        return accessData.has_formation_agent_immo;
      }
      // Formation Accompagnement (Starter/Pro/Expert)
      if (video.category === 'Accompagnement') {
        return ['starter', 'pro', 'expert'].includes(accessData.pack_type);
      }
      return false;
    });

    return NextResponse.json({ 
      success: true,
      videos: filteredVideos,
      access: {
        pack_type: accessData.pack_type,
        has_formation_createur: accessData.has_formation_createur,
        has_formation_agent_immo: accessData.has_formation_agent_immo
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur API client/videos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}