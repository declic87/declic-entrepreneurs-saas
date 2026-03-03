import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    console.log('🔍 API /client/formations appelée');

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ Token manquant');
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.log('❌ Authentification échouée:', authError);
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    console.log('✅ User authentifié:', user.email);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer l'user_id
    console.log('🔍 Recherche user avec auth_id:', user.id);
    
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      console.log('❌ Utilisateur non trouvé dans table users');
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    console.log('✅ User trouvé, ID:', userData.id);

    // Récupérer les accès
    const { data: accessData } = await supabaseAdmin
      .from('client_access')
      .select('pack_type, has_formation_createur, has_formation_agent_immo')
      .eq('user_id', userData.id)
      .single();

    console.log('📦 Access data:', accessData);

    if (!accessData) {
      console.log('❌ Aucun accès trouvé');
      return NextResponse.json({ 
        success: true,
        formations: [],
        access: null 
      });
    }

    // Récupérer TOUTES les vidéos de formations
    const { data: allVideos, error: videoError } = await supabaseAdmin
      .from('onboarding_videos_client')
      .select('*, templates:video_templates(id, name, file_url, file_type)')
      .eq('section', 'formations')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    console.log('📊 Total vidéos trouvées:', allVideos?.length);
    console.log('📊 Vidéos:', JSON.stringify(allVideos, null, 2));
    console.log('❌ Erreur vidéos:', videoError);

    // Déterminer quelle catégorie afficher (1 seule)
    let category = null;
    if (accessData.has_formation_createur) {
      category = 'Créateur';
    } else if (accessData.has_formation_agent_immo) {
      category = 'Agent Immo';
    } else if (['starter', 'pro', 'expert'].includes(accessData.pack_type)) {
      category = 'Accompagnement';
    }

    console.log('🎯 Catégorie sélectionnée:', category);
    console.log('🎯 Pack type:', accessData.pack_type);
    console.log('🎯 has_formation_createur:', accessData.has_formation_createur);
    console.log('🎯 has_formation_agent_immo:', accessData.has_formation_agent_immo);

    // Filtrer les vidéos selon la catégorie
    const filteredVideos = category 
      ? (allVideos || []).filter((video: any) => {
          console.log(`🔍 Comparaison: video.category="${video.category}" vs category="${category}"`);
          return video.category === category;
        })
      : [];

    console.log('✅ Vidéos filtrées:', filteredVideos.length);
    console.log('✅ Vidéos filtrées détail:', JSON.stringify(filteredVideos, null, 2));

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