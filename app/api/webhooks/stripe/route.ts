import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

const PAYMENT_LINK_TO_PACK: Record<string, {
  pack: string;
  price: number;
  duration_months: number;
  rdv_expert_included: number;
}> = {};

const PRICE_ID_TO_PACK: Record<string, {
  pack: string;
  price: number;
  duration_months: number;
  rdv_expert_included: number;
}> = {
  // ========== MODE PRODUCTION ==========
  // Paiements comptants LIVE
  'price_1SudKRAl0RypxECLDunC6wcJ': { pack: 'plateforme', price: 97, duration_months: 1, rdv_expert_included: 0 },
  'price_1SusbbAl0RypxECLiGegTEuv': { pack: 'createur', price: 497, duration_months: 3, rdv_expert_included: 0 },
  'price_1SuscjAl0RypxECLdOdYsAt4': { pack: 'agent_immo', price: 897, duration_months: 3, rdv_expert_included: 0 },
  'price_1SudOrAl0RypxECLAeMgXBci': { pack: 'starter', price: 3600, duration_months: 6, rdv_expert_included: 3 },
  'price_1SudUPAl0RypxECLgiW2eN6a': { pack: 'pro', price: 4600, duration_months: 12, rdv_expert_included: 4 },
  'price_1SudWxAl0RypxECLVajytCgm': { pack: 'expert', price: 6600, duration_months: 18, rdv_expert_included: 5 },
  
  // Paiements en plusieurs fois LIVE
  'price_1TACK0Al0RypxECLF6bZlSAv': { pack: 'pro', price: 4600, duration_months: 12, rdv_expert_included: 4 },
  'price_1TACSHAl0RypxECLrNSjwD4S': { pack: 'expert', price: 6600, duration_months: 18, rdv_expert_included: 5 },
  'price_1TACSpAl0RypxECLudWSn6jZ': { pack: 'expert', price: 6600, duration_months: 18, rdv_expert_included: 5 },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('❌ Webhook signature failed:', err.message);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email || session.customer_details?.email;
  if (!customerEmail) {
    console.error('❌ No email');
    return;
  }

  console.log('💰 Paiement:', customerEmail);

  let packConfig: { pack: string; price: number; duration_months: number; rdv_expert_included: number; } | undefined;

  // 1. Essayer par Payment Link
  if (session.payment_link) {
    packConfig = PAYMENT_LINK_TO_PACK[session.payment_link as string];
    console.log('🔗 Payment Link:', session.payment_link);
  }

  // 2. Essayer par Price ID (abonnements)
  if (!packConfig && session.subscription) {
    try {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = sub.items.data[0]?.price.id;
      if (priceId) {
        packConfig = PRICE_ID_TO_PACK[priceId];
        console.log('💰 Price ID:', priceId);
      }
    } catch (e) {
      console.error('⚠️ Sub error:', e);
    }
  }

  // 3. Fallback par montant
  if (!packConfig && session.amount_total) {
    const amt = session.amount_total / 100;
    console.log('💵 Montant:', amt);
    if (amt === 97) packConfig = { pack: 'plateforme', price: 97, duration_months: 1, rdv_expert_included: 0 };
    else if (amt === 497) packConfig = { pack: 'createur', price: 497, duration_months: 3, rdv_expert_included: 0 };
    else if (amt === 897) packConfig = { pack: 'agent_immo', price: 897, duration_months: 3, rdv_expert_included: 0 };
    else if (amt === 3600) packConfig = { pack: 'starter', price: 3600, duration_months: 6, rdv_expert_included: 3 };
    else if (amt === 4600) packConfig = { pack: 'pro', price: 4600, duration_months: 12, rdv_expert_included: 4 };
    else if (amt === 6600) packConfig = { pack: 'expert', price: 6600, duration_months: 18, rdv_expert_included: 5 };
    else if (amt === 920) packConfig = { pack: 'pro', price: 4600, duration_months: 12, rdv_expert_included: 4 }; // Pro 5x
    else if (amt === 1320) packConfig = { pack: 'expert', price: 6600, duration_months: 18, rdv_expert_included: 5 }; // Expert 5x
    else if (amt === 1100) packConfig = { pack: 'expert', price: 6600, duration_months: 18, rdv_expert_included: 5 }; // Expert 6x
  }

  if (!packConfig) {
    console.error('❌ Pack non identifié');
    return;
  }

  console.log('📦 Pack:', packConfig.pack);

  let { data: user } = await supabase.from('users').select('id, auth_id, email').eq('email', customerEmail).single();
  let userId: string;
  let authId: string;
  let isNewUser = false;

  if (!user) {
    console.log('🆕 Nouveau client');
    isNewUser = true;

    const name = session.customer_details?.name || '';
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');
    const tempPassword = 'Declic2026!';

    // Créer le user avec createUser (évite rate limit)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || 'Client',
        last_name: lastName || '',
      },
    });

    if (authError || !authData.user) {
      console.error('❌ Erreur auth:', authError);
      throw authError || new Error('Auth failed');
    }

    authId = authData.user.id;
    console.log('✅ Auth:', authId);

    const { data: userData, error: userError } = await supabase.from('users').insert({
      auth_id: authId,
      email: customerEmail,
      first_name: firstName || 'Client',
      last_name: lastName || '',
      role: 'CLIENT',
      status: 'active',
    }).select().single();

    if (userError) {
      console.error('❌ User error:', userError);
      throw userError;
    }

    userId = userData.id;
    console.log('✅ User:', userId);

    console.log('🔍 Envoi email Resend...');

    try {
      await resend.emails.send({
        from: 'Déclic Entrepreneurs <noreply@declic-entrepreneurs.fr>',
        to: customerEmail,
        subject: '🎉 Bienvenue sur Déclic Entrepreneurs !',
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;background:#0F172A;margin:0;padding:0}.container{max-width:600px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}.header{background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);padding:40px 20px;text-align:center}.header h1{color:white;margin:0;font-size:28px;font-weight:bold}.content{padding:40px 30px}.content h2{color:#0F172A;font-size:22px;margin-bottom:20px}.content p{color:#475569;line-height:1.6;margin-bottom:15px}.credentials{background:#FEF3C7;border-left:4px solid #F59E0B;padding:20px;margin:25px 0;border-radius:8px}.credentials p{margin:8px 0;color:#92400E}.credentials strong{color:#78350F}.button{display:inline-block;background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);color:white!important;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;margin:20px 0}.feature{display:flex;margin:15px 0}.feature-icon{background:#FEF3C7;color:#F59E0B;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:15px;font-weight:bold}.footer{background:#F8FAFC;padding:30px;text-align:center;color:#64748B;font-size:14px}</style></head><body><div class="container"><div class="header"><h1>🎉 Bienvenue sur Déclic Entrepreneurs !</h1></div><div class="content"><h2>Bonjour ${firstName || 'Client'},</h2><p>Votre compte a été créé avec succès !</p><div class="credentials"><p><strong>📧 Email :</strong> ${customerEmail}</p><p><strong>🔑 Mot de passe :</strong> Declic2026!</p></div><p style="text-align:center"><a href="https://www.declic-entrepreneurs.fr/login" class="button">🚀 Me connecter</a></p><p style="font-size:14px;color:#64748B;text-align:center">Changez votre mot de passe dans Paramètres</p><div><p><strong>Accès :</strong></p><div class="feature"><div class="feature-icon">✓</div><div><strong>Formations vidéo</strong></div></div><div class="feature"><div class="feature-icon">✓</div><div><strong>Simulateurs fiscaux</strong></div></div><div class="feature"><div class="feature-icon">✓</div><div><strong>Support expert</strong></div></div><div class="feature"><div class="feature-icon">✓</div><div><strong>Communauté</strong></div></div></div></div><div class="footer"><p><strong>L'équipe Déclic Entrepreneurs</strong></p><p>Payez moins d'impôts. Légalement.</p></div></div></body></html>`
      });

      console.log('✅ Email Resend envoyé');
    } catch (emailError: any) {
      console.error('❌ Email error:', emailError.message);
    }

  } else {
    console.log('👤 Existing:', user.id);
    userId = user.id;
    authId = user.auth_id;
  }

  const { data: existingClient } = await supabase.from('clients').select('id').eq('user_id', userId).single();
  if (!existingClient) {
    await supabase.from('clients').insert({
      user_id: userId,
      pack_type: packConfig.pack,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string
    });
    console.log('✅ Client');
  }

  await supabase.rpc('create_default_access', {
    p_user_id: userId,
    p_pack_type: packConfig.pack,
    p_pack_price: packConfig.price,
  });
  console.log('✅ Access');

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + packConfig.duration_months);

  await supabase.from('user_subscriptions').insert({
    user_id: userId,
    pack_type: packConfig.pack.toUpperCase(),
    price: packConfig.price,
    duration_months: packConfig.duration_months,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    rdv_expert_included: packConfig.rdv_expert_included,
    rdv_expert_used: 0,
    is_active: true,
    stripe_subscription_id: session.subscription as string || session.id
  });

  await supabase.from('payments').insert({
    user_id: userId,
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent as string,
    amount: session.amount_total ? session.amount_total / 100 : packConfig.price,
    currency: session.currency || 'eur',
    pack_type: packConfig.pack,
    status: 'succeeded',
  });

  await supabase.from('notifications').insert({
    user_id: userId,
    type: isNewUser ? 'welcome' : 'payment_success',
    title: isNewUser ? '🎉 Bienvenue !' : '✅ Paiement confirmé',
    message: isNewUser ? 'Mot de passe : Declic2026!' : `Pack ${packConfig.pack} activé`,
    link: '/client',
  });

  console.log('🎉 Done:', customerEmail);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subId = invoice.subscription as string;
  if (!subId) return;
  const sub = await stripe.subscriptions.retrieve(subId);
  const email = await getCustomerEmail(sub.customer as string);
  if (!email) return;
  const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
  if (!user) return;
  const { data: existingSub } = await supabase.from('user_subscriptions').select('*').eq('user_id', user.id).eq('stripe_subscription_id', subId).single();
  if (!existingSub) return;
  const end = new Date(existingSub.end_date);
  end.setMonth(end.getMonth() + existingSub.duration_months);
  await supabase.from('user_subscriptions').update({ end_date: end.toISOString().split('T')[0], is_active: true, updated_at: new Date().toISOString() }).eq('id', existingSub.id);
  console.log(`✅ Renewed: ${email}`);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const email = await getCustomerEmail(sub.customer as string);
  if (!email) return;
  const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
  if (!user) return;
  await supabase.from('user_subscriptions').update({ is_active: false, updated_at: new Date().toISOString() }).eq('user_id', user.id).eq('stripe_subscription_id', sub.id);
  await supabase.from('client_access').update({ is_active: false }).eq('user_id', user.id);
  console.log(`❌ Cancelled: ${email}`);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const email = await getCustomerEmail(sub.customer as string);
  if (!email) return;
  const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
  if (!user) return;
  await supabase.from('user_subscriptions').update({ is_active: sub.status === 'active', updated_at: new Date().toISOString() }).eq('user_id', user.id).eq('stripe_subscription_id', sub.id);
  console.log(`🔄 Updated: ${email}`);
}

async function getCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const c = await stripe.customers.retrieve(customerId);
    return (c as Stripe.Customer).email;
  } catch {
    return null;
  }
}