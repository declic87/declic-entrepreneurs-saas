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

    // ⭐ GÉNÉRER UN LIEN DE RÉCUPÉRATION (recovery = reset password)
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL}/auth/set-password`,
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1E40AF; margin: 0;">DÉCLIC Entrepreneurs</h1>
            </div>
            
            <div style="background-color: #F3F4F6; border-radius: 10px; padding: 30px; margin-bottom: 30px;">
              <h2 style="color: #1F2937; margin-top: 0;">Bienvenue dans l'équipe !</h2>
              <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                Vous avez été invité(e) à rejoindre la plateforme DÉCLIC Entrepreneurs en tant que <strong>${userData.role}</strong>.
              </p>
              <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                Pour commencer, créez votre mot de passe en cliquant sur le bouton ci-dessous :
              </p>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.properties.action_link}" 
                 style="display: inline-block; background-color: #F59E0B; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                ✨ Créer mon mot de passe
              </a>
            </div>

            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 30px 0; border-radius: 4px;">
              <p style="color: #92400E; margin: 0; font-size: 14px;">
                <strong>💡 Conseil :</strong> Choisissez un mot de passe sécurisé avec au moins 8 caractères.
              </p>
            </div>

            <div style="border-top: 2px solid #E5E7EB; padding-top: 20px; margin-top: 40px;">
              <p style="color: #6B7280; font-size: 14px; line-height: 1.5;">
                Si vous n'avez pas demandé cet accès, vous pouvez ignorer cet email en toute sécurité.
              </p>
              <p style="color: #6B7280; font-size: 14px; margin-top: 15px;">
                Ce lien est valable pendant <strong>24 heures</strong>.
              </p>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 5px 0;">
                DÉCLIC Entrepreneurs
              </p>
              <p style="color: #9CA3AF; font-size: 12px; margin: 5px 0;">
                Optimisation fiscale et juridique pour entrepreneurs
              </p>
            </div>
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