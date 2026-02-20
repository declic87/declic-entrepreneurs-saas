import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Utiliser SERVICE ROLE KEY pour bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('📥 API: Chargement des accès...');

  // 1. Charger les accès
  const { data: accessData, error: accessError } = await supabase
    .from('client_access')
    .select('*')
    .order('created_at', { ascending: false });

  if (accessError) {
    console.error('❌ API: Erreur chargement accès:', accessError);
    return NextResponse.json({ error: accessError.message }, { status: 500 });
  }

  console.log('✅ API: Accès chargés:', accessData?.length);

  if (!accessData || accessData.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // 2. Charger les users
  const userIds = accessData.map((a: any) => a.user_id);
  
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .in('id', userIds);

  if (usersError) {
    console.error('❌ API: Erreur chargement users:', usersError);
  }

  console.log('✅ API: Users chargés:', usersData?.length);

  // 3. Fusionner les données
  const merged = accessData.map((access: any) => ({
    ...access,
    user: usersData?.find((u: any) => u.id === access.user_id)
  }));

  console.log('🔗 API: Données fusionnées:', merged.length);

  return NextResponse.json({ data: merged });
}

export async function PUT(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from('client_access')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}