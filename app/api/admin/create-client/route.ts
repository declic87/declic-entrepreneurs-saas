import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateWelcomeEmail } from '@/lib/emails/welcome-email';
import { generateContract } from '@/lib/contracts/contract-generator';
import { sendContractToYouSign } from '@/lib/yousign/yousignService';

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

    // 1. Créer le compte Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Auth creation failed');
    console.log('✅ Auth créé:', authData.user.id);

    // 2. Créer le user
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

    // 5. Convertir contrat en PDF et uploader vers storage
    const pdfBuffer = Buffer.from(contractContent);
    const pdfPath = `${userData.id}/contrat_${pack}_${Date.now()}.txt`;

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'text/plain',
        upsert: true,
      });

    if (uploadError) {
      console.error('⚠️ Erreur upload contrat:', uploadError);
    } else {
      console.log('✅ Contrat uploadé:', pdfPath);
    }

    // 6. Stocker le contrat en base
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .insert({
        clientId: userData.id,
        type: 'pack',
        contract_type: pack,
        url: pdfPath,
      })
      .select()
      .single();

    if (contractError) {
      console.error('⚠️ Erreur stockage contrat:', contractError);
    } else {
      console.log('✅ Contrat stocké en base:', contractData.id);
    }

    // 7. Envoyer le contrat à YouSign
    if (pdfPath && process.env.YOUSIGN_API_KEY) {
      try {
        const youSignResult = await sendContractToYouSign(
          email,
          `${first_name} ${last_name}`,
          pdfPath,
          pack
        );

        console.log('✅ Contrat envoyé à YouSign:', youSignResult.id);

        // Mettre à jour le contrat avec l'ID YouSign
        await supabase
          .from('contracts')
          .update({ signedAt: youSignResult.id })
          .eq('id', contractData.id);

      } catch (youSignError) {
        console.error('⚠️ Exception YouSign:', youSignError);
      }
    }

    // 8. Envoyer l'email de bienvenue
    const emailHtml = generateWelcomeEmail({
      firstName: first_name,
      email,
      password,
      packType: pack,
      loginUrl: 'https://declic-entrepreneurs-saas.vercel.app/auth/login',
    });

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
    }

    return NextResponse.json({ 
      success: true, 
      user: userData,
      contract: contractData,
      message: 'Client créé avec succès. Email et contrat envoyés.'
    });

  } catch (error: any) {
    console.error('❌ Erreur création client:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}