import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      email, 
      firstName, 
      lastName, 
      phone, 
      pack, 
      packPrice, 
      paymentMethod = 'virement' 
    } = body;

    console.log('💰 Activation manuelle client:', email);

    // Vérifier que le user n'existe pas déjà
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Un compte existe déjà avec cet email' 
      }, { status: 400 });
    }

    // 1. Créer le compte Auth avec password temporaire
    const tempPassword = 'Declic2026!';
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError || !authData.user) {
      console.error('❌ Erreur création auth:', authError);
      throw authError || new Error('Création Auth échouée');
    }

    const authId = authData.user.id;
    console.log('✅ Auth créé:', authId);

    // 2. Créer l'utilisateur dans users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: 'CLIENT',
        status: 'active',
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Erreur création user:', userError);
      throw userError;
    }

    const userId = userData.id;
    console.log('✅ User créé:', userId);

    // 3. Créer les accès via RPC
    const { error: rpcError } = await supabase.rpc('create_default_access', {
      p_user_id: userId,
      p_pack_type: pack,
      p_pack_price: packPrice,
    });

    if (rpcError) {
      console.error('⚠️ Erreur RPC:', rpcError);
    } else {
      console.log('✅ Accès créés');
    }

    // 4. Créer l'entrée clients
    await supabase.from('clients').insert({
      user_id: userId,
      pack_type: pack,
      stripe_customer_id: null,
      stripe_subscription_id: null,
    });

    // 5. Calculer les dates
    const startDate = new Date();
    const endDate = new Date();
    const durationMonths = pack === 'plateforme' ? 1 :
                          pack === 'createur' || pack === 'agent_immo' ? 3 :
                          pack === 'starter' ? 6 :
                          pack === 'pro' ? 12 : 18;

    endDate.setMonth(endDate.getMonth() + durationMonths);

    const rdvIncluded = pack === 'starter' ? 3 :
                       pack === 'pro' ? 4 :
                       pack === 'expert' ? 5 : 0;

    // 6. Créer la subscription
    await supabase.from('user_subscriptions').insert({
      user_id: userId,
      pack_type: pack.toUpperCase(),
      price: packPrice,
      duration_months: durationMonths,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      rdv_expert_included: rdvIncluded,
      rdv_expert_used: 0,
      is_active: true,
      stripe_subscription_id: null,
    });

    // 7. Enregistrer le paiement
    await supabase.from('payments').insert({
      user_id: userId,
      stripe_session_id: null,
      stripe_payment_intent: null,
      amount: packPrice,
      currency: 'eur',
      pack_type: pack,
      status: 'succeeded',
    });

    // 8. Créer une notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'welcome',
      title: '🎉 Bienvenue sur Déclic Entrepreneurs !',
      message: `Votre compte a été créé ! Connectez-vous avec le mot de passe temporaire : Declic2026!`,
      link: '/client',
    });

    // 9. Envoyer l'email de bienvenue via Resend
    console.log('🔍 Envoi email Resend...');

    try {
      await resend.emails.send({
        from: 'Déclic Entrepreneurs <noreply@declic-entrepreneurs.fr>',
        to: email,
        subject: '🎉 Bienvenue sur Déclic Entrepreneurs !',
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;background:#0F172A;margin:0;padding:0}.container{max-width:600px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}.header{background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);padding:40px 20px;text-align:center}.header h1{color:white;margin:0;font-size:28px;font-weight:bold}.content{padding:40px 30px}.content h2{color:#0F172A;font-size:22px;margin-bottom:20px}.content p{color:#475569;line-height:1.6;margin-bottom:15px}.credentials{background:#FEF3C7;border-left:4px solid #F59E0B;padding:20px;margin:25px 0;border-radius:8px}.credentials p{margin:8px 0;color:#92400E}.credentials strong{color:#78350F}.button{display:inline-block;background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);color:white!important;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;margin:20px 0}.feature{display:flex;margin:15px 0}.feature-icon{background:#FEF3C7;color:#F59E0B;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:15px;font-weight:bold}.footer{background:#F8FAFC;padding:30px;text-align:center;color:#64748B;font-size:14px}</style></head><body><div class="container"><div class="header"><h1>🎉 Bienvenue sur Déclic Entrepreneurs !</h1></div><div class="content"><h2>Bonjour ${firstName},</h2><p>Votre compte a été créé avec succès suite à votre paiement par ${paymentMethod} !</p><div class="credentials"><p><strong>📧 Email :</strong> ${email}</p><p><strong>🔑 Mot de passe :</strong> Declic2026!</p></div><p style="text-align:center"><a href="https://www.declic-entrepreneurs.fr/login" class="button">🚀 Me connecter</a></p><p style="font-size:14px;color:#64748B;text-align:center">Changez votre mot de passe dans Paramètres</p><div><p><strong>Accès :</strong></p><div class="feature"><div class="feature-icon">✓</div><div><strong>Formations vidéo</strong></div></div><div class="feature"><div class="feature-icon">✓</div><div><strong>Simulateurs fiscaux</strong></div></div><div class="feature"><div class="feature-icon">✓</div><div><strong>Support expert</strong></div></div><div class="feature"><div class="feature-icon">✓</div><div><strong>Communauté</strong></div></div></div></div><div class="footer"><p><strong>L'équipe Déclic Entrepreneurs</strong></p><p>Payez moins d'impôts. Légalement.</p></div></div></body></html>`
      });

      console.log('✅ Email Resend envoyé');
    } catch (emailError: any) {
      console.error('❌ Email error:', emailError.message);
    }

    console.log('🎉 Client activé manuellement avec succès');

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Client créé et email envoyé avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur activation manuelle:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}