import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    console.log('🔍 API /client/access appelée');

    // 1. Récupérer le token depuis le header Authorization
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

    // 2. Utiliser service_role pour récupérer les données
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer l'user_id depuis auth_id
    console.log('🔍 Recherche user avec auth_id:', user.id);

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, assigned_expert_id, expert:assigned_expert_id(id, first_name, last_name)')
      .eq('auth_id', user.id)
      .single();

    console.log('🔍 User data:', userData);
    console.log('❌ User error:', userError);

    if (!userData) {
      console.log('❌ Utilisateur non trouvé dans table users');
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    console.log('✅ User trouvé:', userData.id);

    // Récupérer les accès
    console.log('🔍 Recherche accès pour user_id:', userData.id);

    const { data: accessData, error: accessError } = await supabaseAdmin
      .from('client_access')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    console.log('🔍 Access data:', accessData);
    console.log('❌ Access error:', accessError);

    if (accessError) {
      console.error('❌ Erreur accès:', accessError);
      return NextResponse.json({ error: accessError.message }, { status: 500 });
    }

    if (!accessData) {
      console.log('❌ Aucun accès trouvé pour ce user');
      return NextResponse.json({ error: 'Aucun accès configuré' }, { status: 404 });
    }

    console.log('✅ Accès trouvé:', accessData.pack_type);

    return NextResponse.json({ 
      success: true, 
      user_id: userData.id,
      assigned_expert: userData.expert || null,
      access: accessData 
    });

  } catch (error: any) {
    console.error('❌ Erreur API client/access:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}