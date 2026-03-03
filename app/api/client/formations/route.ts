import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    console.log('🔍 API /client/formations appelée');

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

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

    // Récupérer les accès
    const { data: accessData } = await supabaseAdmin
      .from('client_access')
      .select('pack_type, has_formation_createur, has_formation_agent_immo')
      .eq('user_id', userData.id)
      .single();

    if (!accessData) {
      return NextResponse.json({ 
        success: true,
        formations: [],
        access: null 
      });
    }

    // Récupérer TOUTES les vidéos de formations
    const { data: allVideos } = await supabaseAdmin
      .from('onboarding_videos_client')
      .select('*, templates:video_templates(id, name, file_url, file_type)')
      .eq('section', 'formations')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Déterminer quelle catégorie afficher (1 seule)
    let category = null;
    if (accessData.has_formation_createur) {
      category = 'Créateur';
    } else if (accessData.has_formation_agent_immo) {
      category = 'Agent Immo';
    } else if (['starter', 'pro', 'expert'].includes(accessData.pack_type)) {
      category = 'Accompagnement';
    }

    // Filtrer les vidéos selon la catégorie
    const filteredVideos = category 
      ? (allVideos || []).filter((video: any) => video.category === category)
      : [];

    return NextResponse.json({ 
      success: true,
      formations: filteredVideos,
      category: category,
      pack_type: accessData.pack_type
    });

  } catch (error: any) {
    console.error('❌ Erreur API client/formations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}