import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, first_name, last_name, role } = await request.json();

    // Validation
    if (!email || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    const validRoles = ['HOS', 'CLOSER', 'SETTER', 'EXPERT'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Créer un mot de passe temporaire aléatoire
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

    // 1. Créer le compte Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, // Email non confirmé, il devra créer son mot de passe
      user_metadata: {
        first_name,
        last_name,
        role,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Création Auth échouée');

    // 2. Créer l'utilisateur dans users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email,
        first_name,
        last_name,
        role,
        status: 'pending', // En attente de confirmation
      })
      .select()
      .single();

    if (userError) throw userError;

    // 3. Envoyer l'email d'invitation (réinitialisation de mot de passe)
    const { error: inviteError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?role=${role}`,
    });

    if (inviteError) {
      console.error('⚠️ Erreur envoi email:', inviteError);
      // Pas critique, on continue
    }

    // 4. Créer une notification admin
    const { data: { user: adminUser } } = await supabase.auth.getUser(
      request.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (adminUser) {
      const { data: adminData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', adminUser.id)
        .single();

      if (adminData) {
        await supabase.from('notifications').insert({
          user_id: adminData.id,
          type: 'staff_invited',
          title: '✉️ Invitation envoyée',
          message: `${first_name} ${last_name} (${role}) a été invité(e)`,
        });
      }
    }

    console.log('✅ Invitation staff envoyée:', {
      email,
      role,
      userId: userData.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation envoyée avec succès',
      userId: userData.id,
    });

  } catch (error: any) {
    console.error('❌ Erreur invitation staff:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}