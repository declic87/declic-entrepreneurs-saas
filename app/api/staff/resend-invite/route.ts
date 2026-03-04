import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Récupérer le user dans la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('auth_id, role')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // ⭐ UTILISER inviteUserByEmail DIRECTEMENT (même si user existe)
    // Supabase gère automatiquement le renvoi d'invitation
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=${userData.role.toLowerCase()}`,
      }
    );

    if (inviteError) {
      console.error('⚠️ Erreur invitation:', inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    console.log('✅ Invitation renvoyée:', email);

    return NextResponse.json({
      success: true,
      message: 'Invitation renvoyée avec succès',
    });

  } catch (error: any) {
    console.error('❌ Erreur resend invite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}