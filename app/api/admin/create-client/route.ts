import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { email, password, first_name, last_name, phone, pack, pack_price } = body;

  try {
    console.log('📥 API: Création client...', email);

    // 1. Créer le compte Auth avec admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Auth creation failed');

    console.log('✅ Auth créé:', authData.user.id);

    // 2. Créer le user dans users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email,
        first_name,
        last_name,
        phone: phone || null,
        role: 'CLIENT',
        status: 'active',
      })
      .select()
      .single();

    if (userError) throw userError;

    console.log('✅ User créé:', userData.id);

    // 3. Créer les accès
    const { error: accessError } = await supabase.rpc('create_default_access', {
      p_user_id: userData.id,
      p_pack_type: pack,
      p_pack_price: pack_price,
    });

    if (accessError) {
      console.error('⚠️ Erreur accès:', accessError);
    } else {
      console.log('✅ Accès créés');
    }

    return NextResponse.json({ success: true, user: userData });
  } catch (error: any) {
    console.error('❌ Erreur création client:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}