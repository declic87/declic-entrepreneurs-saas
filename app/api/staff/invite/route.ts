import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, first_name, last_name, role } = await request.json();

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

    // ⭐ 1. UTILISER inviteUserByEmail DIRECTEMENT (crée le user ET envoie l'email)
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=${role.toLowerCase()}`,
        data: {
          first_name,
          last_name,
          role,
        },
      }
    );

    if (inviteError) throw inviteError;
    if (!inviteData.user) throw new Error('Invitation échouée');

    // 2. Créer l'utilisateur dans users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: inviteData.user.id,
        email,
        first_name,
        last_name,
        role,
        status: 'pending',
      })
      .select()
      .single();

    if (userError) throw userError;

    // 3. Si EXPERT, créer l'entrée dans experts
    if (role === 'EXPERT') {
      const { error: expertError } = await supabase.from('experts').insert({
        userId: userData.id,
        specialty: 'À définir',
        bio: '',
        rating: 0,
        totalReviews: 0,
        totalClients: 0,
        completedSessions: 0,
        isAvailable: true,
      });

      if (expertError) {
        console.error('⚠️ Erreur création expert:', expertError);
      }
    }

    // 4. Ajouter à la messagerie #general
    const { data: generalConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('channel_name', '#general')
      .single();

    if (generalConv) {
      await supabase.from('conversation_members').insert({
        conversation_id: generalConv.id,
        user_id: userData.id,
      });
    }

    // 5. Créer une notification admin
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
      invitedAt: inviteData.user.invited_at,
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