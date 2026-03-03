import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    // 1. Récupérer le token depuis le header Authorization
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

    // 2. Utiliser service_role pour récupérer les données
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer l'user_id depuis auth_id
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, assigned_expert_id, expert:assigned_expert_id(id, first_name, last_name)')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer les accès
    const { data: accessData, error: accessError } = await supabaseAdmin
      .from('client_access')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    if (accessError) {
      console.error('❌ Erreur accès:', accessError);
      return NextResponse.json({ error: accessError.message }, { status: 500 });
    }

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