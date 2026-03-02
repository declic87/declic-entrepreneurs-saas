import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Récupérer tous les accès clients
export async function GET() {
  console.log('🔑 SERVICE_ROLE_KEY présente:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('🔑 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('📥 API: Chargement des accès...');

  const { data, error } = await supabase
    .from('client_access')
    .select('*');

  console.log('🔍 Données:', data);
  console.log('❌ Erreur:', error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ data: [], debug: 'No data found' });
  }

  const userIds = data.map((a: any) => a.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .in('id', userIds);

  const merged = data.map((access: any) => ({
    ...access,
    user: users?.find((u: any) => u.id === access.user_id)
  }));

  return NextResponse.json({ data: merged });
}

// PUT - Mettre à jour un accès client
export async function PUT(request: Request) {
  try {
    console.log('🔄 API PUT: Mise à jour accès...');
    
    const body = await request.json();
    console.log('📝 Body reçu:', body);
    
    const { user_id, ...updateData } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id requis' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculer RDV restants si RDV total change
    if (updateData.rdv_total !== undefined) {
      const { data: currentAccess } = await supabase
        .from('client_access')
        .select('rdv_consumed')
        .eq('user_id', user_id)
        .single();

      if (currentAccess) {
        updateData.rdv_remaining = updateData.rdv_total - (currentAccess.rdv_consumed || 0);
      }
    }

    const { data, error } = await supabase
      .from('client_access')
      .update(updateData)
      .eq('user_id', user_id)
      .select();

    console.log('✅ Résultat update:', data);
    console.log('❌ Erreur update:', error);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Erreur PUT client-access:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Créer un nouvel accès client
export async function POST(request: Request) {
  try {
    console.log('➕ API POST: Création accès...');
    
    const body = await request.json();
    const { user_id, rdv_total = 0, ...accessData } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id requis' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const newAccess = {
      user_id,
      rdv_total,
      rdv_consumed: 0,
      rdv_remaining: rdv_total,
      ...accessData,
    };

    const { data, error } = await supabase
      .from('client_access')
      .insert([newAccess])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Erreur POST client-access:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}