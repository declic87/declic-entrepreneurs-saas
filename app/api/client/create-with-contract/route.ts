import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, first_name, last_name, packType } = await request.json();

    // 1. Créer le client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      user_metadata: { first_name, last_name },
    });

    if (authError) throw authError;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email,
        first_name,
        last_name,
        role: 'CLIENT',
        status: 'pending',
      })
      .select()
      .single();

    if (userError) throw userError;

    // 2. Générer et envoyer le contrat
    const generateResponse = await fetch(`${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL}/api/contracts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        contractType: 'client_subscription',
        packType: packType || 'STARTER',
        contractData: {
          email,
          first_name,
          last_name,
          packType,
        },
      }),
    });

    const generateData = await generateResponse.json();

    return NextResponse.json({
      success: true,
      user: userData,
      contract: generateData.contract,
      yousignUrl: generateData.yousignUrl,
    });

  } catch (error: any) {
    console.error('❌ Erreur création client:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}