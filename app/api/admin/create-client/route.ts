import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateWelcomeEmail } from '@/lib/emails/welcome-email';
import { generateContract } from '@/lib/contracts/contract-generator';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // 4. Générer le contrat
    const contractContent = generateContract({
      firstName: first_name,
      lastName: last_name,
      email,
      packType: pack,
      packPrice: pack_price,
      createdAt: new Date().toISOString(),
    });

    console.log('📄 Contrat généré pour pack:', pack);

    // TODO: Intégration YouSign pour signature électronique
    // const signatureUrl = await sendToYouSign(contractContent, email);

    // 5. Générer l'email de bienvenue
    const emailHtml = generateWelcomeEmail({
      firstName: first_name,
      email,
      password,
      packType: pack,
      loginUrl: 'https://declic-entrepreneurs-saas.vercel.app/auth/login',
    });

    // 6. Envoyer l'email de bienvenue
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'DÉCLIC Entrepreneurs <onboarding@resend.dev>',
        to: email,
        subject: '🎉 Bienvenue chez DÉCLIC Entrepreneurs !',
        html: emailHtml,
      });

      if (emailError) {
        console.error('⚠️ Erreur envoi email:', emailError);
      } else {
        console.log('📧 Email envoyé à:', email, '- ID:', emailData?.id);
      }
    } catch (emailError) {
      console.error('⚠️ Exception email:', emailError);
      // On ne bloque pas la création si l'email échoue
    }

    return NextResponse.json({ 
      success: true, 
      user: userData,
      message: 'Client créé avec succès. Email de bienvenue envoyé.'
    });

  } catch (error: any) {
    console.error('❌ Erreur création client:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}