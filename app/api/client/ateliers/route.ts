import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Récupérer les ateliers + inscriptions du client
export async function GET(request: Request) {
  try {
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

    const today = new Date().toISOString().split('T')[0];

    // Récupérer les ateliers à venir
    const { data: ateliersLive } = await supabaseAdmin
      .from('ateliers')
      .select('*')
      .gte('atelier_date', today)
      .order('atelier_date', { ascending: true });

    // Récupérer les ateliers passés (archives)
    const { data: ateliersArchives } = await supabaseAdmin
      .from('ateliers')
      .select('*')
      .lt('atelier_date', today)
      .order('atelier_date', { ascending: false });

    // Récupérer les inscriptions du client
    const { data: inscriptions } = await supabaseAdmin
      .from('atelier_inscriptions')
      .select('atelier_id, inscrit_le')
      .eq('user_id', userData.id);

    const inscriptionsMap = new Map(
      (inscriptions || []).map((i: any) => [i.atelier_id, i.inscrit_le])
    );

    // Enrichir les ateliers avec info inscription
    const enrichAteliers = (ateliers: any[]) => 
      (ateliers || []).map(atelier => ({
        ...atelier,
        is_inscrit: inscriptionsMap.has(atelier.id),
        inscrit_le: inscriptionsMap.get(atelier.id) || null,
        est_complet: atelier.places_prises >= atelier.max_places,
        peut_rejoindre: canJoinNow(atelier.atelier_date, atelier.time_slot)
      }));

    return NextResponse.json({
      success: true,
      ateliers_live: enrichAteliers(ateliersLive || []),
      ateliers_archives: enrichAteliers(ateliersArchives || [])
    });

  } catch (error: any) {
    console.error('❌ Erreur API ateliers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Inscrire le client à un atelier
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { atelier_id } = body;

    if (!atelier_id) {
      return NextResponse.json({ error: 'atelier_id requis' }, { status: 400 });
    }

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

    // Vérifier si atelier existe et n'est pas complet
    const { data: atelier } = await supabaseAdmin
      .from('ateliers')
      .select('*')
      .eq('id', atelier_id)
      .single();

    if (!atelier) {
      return NextResponse.json({ error: 'Atelier non trouvé' }, { status: 404 });
    }

    if (atelier.places_prises >= atelier.max_places) {
      return NextResponse.json({ error: 'Atelier complet' }, { status: 400 });
    }

    // Créer l'inscription
    const { data, error } = await supabaseAdmin
      .from('atelier_inscriptions')
      .insert([{
        atelier_id,
        user_id: userData.id
      }])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Déjà inscrit à cet atelier' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Inscription réussie',
      data 
    });

  } catch (error: any) {
    console.error('❌ Erreur inscription atelier:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Désinscrire le client d'un atelier
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const atelier_id = searchParams.get('atelier_id');

    if (!atelier_id) {
      return NextResponse.json({ error: 'atelier_id requis' }, { status: 400 });
    }

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

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('atelier_inscriptions')
      .delete()
      .eq('atelier_id', atelier_id)
      .eq('user_id', userData.id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Désinscription réussie' 
    });

  } catch (error: any) {
    console.error('❌ Erreur désinscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fonction helper : Vérifier si l'atelier peut être rejoint (1h avant)
function canJoinNow(atelierDate: string, timeSlot: string): boolean {
  const now = new Date();
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const atelierDateTime = new Date(atelierDate);
  atelierDateTime.setHours(hours, minutes, 0);
  
  const oneHourBefore = new Date(atelierDateTime.getTime() - 60 * 60 * 1000);
  const oneHourAfter = new Date(atelierDateTime.getTime() + 60 * 60 * 1000);
  
  return now >= oneHourBefore && now <= oneHourAfter;
}