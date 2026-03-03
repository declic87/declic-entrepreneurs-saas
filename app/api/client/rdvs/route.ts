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

    // Récupérer les RDV du client
    const { data: rdvs, error: rdvsError } = await supabaseAdmin
      .from('rdvs')
      .select(`
        id,
        scheduled_at,
        status,
        expert:expert_id (first_name, last_name)
      `)
      .eq('client_id', userData.id)
      .order('scheduled_at', { ascending: false });

    if (rdvsError) {
      console.error('❌ Erreur RDV:', rdvsError);
      return NextResponse.json({ error: rdvsError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      rdvs: rdvs || []
    });

  } catch (error: any) {
    console.error('❌ Erreur API client/rdvs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}