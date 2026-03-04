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

    // ⭐ GÉNÉRER UN NOUVEAU LIEN MAGIQUE
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=${userData.role.toLowerCase()}`,
      },
    });

    if (error) {
      console.error('⚠️ Erreur génération lien:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ⭐ ENVOYER L'EMAIL MANUELLEMENT VIA RESEND
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DÉCLIC Entrepreneurs <noreply@declic-entrepreneurs.fr>',
        to: email,
        subject: 'Créez votre mot de passe - DÉCLIC Entrepreneurs',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1E40AF;">Bienvenue chez DÉCLIC Entrepreneurs !</h2>
            <p>Vous avez été invité(e) à rejoindre la plateforme DÉCLIC Entrepreneurs.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer votre mot de passe et accéder à votre espace :</p>
            <a href="${data.properties.action_link}" 
               style="display: inline-block; background-color: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
              Créer mon mot de passe
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Si vous n'avez pas demandé cet accès, ignorez cet email.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              DÉCLIC Entrepreneurs - Optimisation fiscale et juridique
            </p>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.json();
      console.error('⚠️ Erreur Resend:', resendError);
      return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
    }

    console.log('✅ Email renvoyé:', email);

    return NextResponse.json({
      success: true,
      message: 'Invitation renvoyée avec succès',
    });

  } catch (error: any) {
    console.error('❌ Erreur resend invite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}