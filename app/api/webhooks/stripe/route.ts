import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mapping des Payment Links Stripe vers les packs
const PAYMENT_LINK_TO_PACK: Record<string, {
  pack: string;
  price: number;
  duration_months: number;
  rdv_expert_included: number;
}> = {
  'plink_1SvfQEAl0RypxECL30FQAkFp': {
    pack: 'plateforme',
    price: 97,
    duration_months: 1,
    rdv_expert_included: 0
  },
  'plink_1SvfP8Al0RypxECLOmBfTPBw': {
    pack: 'createur',
    price: 497,
    duration_months: 3,
    rdv_expert_included: 0
  },
  'plink_1SvfOrAl0RypxECLKQZR0Io1': {
    pack: 'agent_immo',
    price: 897,
    duration_months: 3,
    rdv_expert_included: 0
  },
  'plink_1SvfQ4Al0RypxECLUaOUG52Y': {
    pack: 'starter',
    price: 3600,
    duration_months: 6,
    rdv_expert_included: 3
  },
  'plink_1SvfPsAl0RypxECLoXQfpyag': {
    pack: 'pro',
    price: 4600,
    duration_months: 12,
    rdv_expert_included: 4
  },
  'plink_1SvfPiAl0RypxECLvjfNr4wv': {
    pack: 'expert',
    price: 6600,
    duration_months: 18,
    rdv_expert_included: 5
  }
};

// Mapping des Price IDs Stripe (pour paiements directs sans payment_link)
const PRICE_ID_TO_PACK: Record<string, {
  pack: string;
  price: number;
  duration_months: number;
  rdv_expert_included: number;
}> = {
  'price_1SudKRAl0RypxECLDunC6wcJ': {
    pack: 'plateforme',
    price: 97,
    duration_months: 1,
    rdv_expert_included: 0
  },
  // AJOUTE ICI TES AUTRES PRICE_ID QUAND TU LES AURAS
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
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
    console.error('❌ Error handling webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// GESTION PAIEMENT INITIAL
// ==========================================
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email || session.customer_details?.email;
  
  if (!customerEmail) {
    console.error('❌ No customer email found');
    return;
  }

  console.log('💰 Paiement reçu pour:', customerEmail);

  // NOUVELLE LOGIQUE : Chercher le pack par payment_link OU par price_id
  let packConfig: {
    pack: string;
    price: number;
    duration_months: number;
    rdv_expert_included: number;
  } | undefined;

  // Méthode 1 : Via Payment Link
  if (session.payment_link) {
    packConfig = PAYMENT_LINK_TO_PACK[session.payment_link as string];
    console.log('🔗 Payment Link détecté:', session.payment_link);
  }

  // Méthode 2 : Via Price ID (si pas de payment_link)
  if (!packConfig && session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      
      if (priceId) {
        packConfig = PRICE_ID_TO_PACK[priceId];
        console.log('💰 Price ID détecté:', priceId);
      }
    } catch (error) {
      console.error('⚠️ Erreur récupération subscription:', error);
    }
  }

  // Méthode 3 : Via montant (fallback - si ni payment_link ni price_id connus)
  if (!packConfig && session.amount_total) {
    const amount = session.amount_total / 100; // Convertir centimes en euros
    console.log('💵 Détection par montant:', amount);
    
    if (amount === 97) {
      packConfig = { pack: 'plateforme', price: 97, duration_months: 1, rdv_expert_included: 0 };
    } else if (amount === 497) {
      packConfig = { pack: 'createur', price: 497, duration_months: 3, rdv_expert_included: 0 };
    } else if (amount === 897) {
      packConfig = { pack: 'agent_immo', price: 897, duration_months: 3, rdv_expert_included: 0 };
    } else if (amount === 3600) {
      packConfig = { pack: 'starter', price: 3600, duration_months: 6, rdv_expert_included: 3 };
    } else if (amount === 4600) {
      packConfig = { pack: 'pro', price: 4600, duration_months: 12, rdv_expert_included: 4 };
    } else if (amount === 6600) {
      packConfig = { pack: 'expert', price: 6600, duration_months: 18, rdv_expert_included: 5 };
    }
  }

  if (!packConfig) {
    console.error('❌ Pack non identifié pour:', {
      payment_link: session.payment_link,
      subscription: session.subscription,
      amount: session.amount_total
    });
    return;
  }

  console.log('📦 Pack identifié:', packConfig.pack);

  // Récupérer ou créer l'utilisateur
  let { data: user } = await supabase
    .from('users')
    .select('id, auth_id, email')
    .eq('email', customerEmail)
    .single();

  let userId: string;
  let authId: string;
  let isNewUser = false;

  if (!user) {
    // 🆕 NOUVEAU CLIENT - Créer le compte
    console.log('🆕 Création nouveau client...');
    isNewUser = true;

    // Extraire prénom/nom
    const name = session.customer_details?.name || '';
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');

    // Mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

    // 1. Créer compte Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || 'Client',
        last_name: lastName || '',
      },
    });

    if (authError) {
      console.error('❌ Erreur création auth:', authError);
      throw authError;
    }
    
    if (!authData.user) {
      throw new Error('Création Auth échouée');
    }

    authId = authData.user.id;
    console.log('✅ Auth créé:', authId);

    // 2. Créer l'utilisateur dans users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authId,
        email: customerEmail,
        first_name: firstName || 'Client',
        last_name: lastName || '',
        role: 'CLIENT',
        status: 'active',
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Erreur création user:', userError);
      throw userError;
    }
    
    userId = userData.id;
    console.log('✅ User créé:', userId);

    // 3. Envoyer email de bienvenue avec création mot de passe
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(customerEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (resetError) {
      console.error('⚠️ Erreur envoi email:', resetError);
    } else {
      console.log('📧 Email de création de mot de passe envoyé à', customerEmail);
    }

  } else {
    // ✅ CLIENT EXISTANT
    console.log('👤 Client existant trouvé:', user.id);
    userId = user.id;
    authId = user.auth_id;
  }

  // 4. Créer l'entrée dans clients si elle n'existe pas
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!existingClient) {
    console.log('📝 Création entrée clients...');
    
    await supabase
      .from('clients')
      .insert({
        user_id: userId,
        pack_type: packConfig.pack,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string
      });
      
    console.log('✅ Entrée clients créée');
  } else {
    console.log('✅ Entrée clients existe déjà');
  }

  // 5. Créer/Mettre à jour les accès via client_access
  console.log('🔐 Création des accès via RPC...');
  
  const { error: rpcError } = await supabase.rpc('create_default_access', {
    p_user_id: userId,
    p_pack_type: packConfig.pack,
    p_pack_price: packConfig.price,
  });

  if (rpcError) {
    console.error('⚠️ Erreur RPC create_default_access:', rpcError);
  } else {
    console.log('✅ Accès créés via RPC');
  }

  // 6. Calculer les dates
  const startDate = new Date();
  const endDate = new Date();
  
  if (packConfig.pack === 'plateforme') {
    // Plateforme = mensuel
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + packConfig.duration_months);
  }

  // 7. Créer la subscription dans user_subscriptions
  const { error: subError } = await supabase
    .from('user_subscriptions')
    .insert({
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

  if (subError) {
    console.error('⚠️ Erreur création subscription:', subError);
  } else {
    console.log('✅ Subscription créée');
  }

  // 8. Enregistrer le paiement
  await supabase.from('payments').insert({
    user_id: userId,
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent as string,
    amount: session.amount_total ? session.amount_total / 100 : packConfig.price,
    currency: session.currency || 'eur',
    pack_type: packConfig.pack,
    status: 'succeeded',
  });

  console.log('✅ Paiement enregistré');

  // 9. Créer une notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: isNewUser ? 'welcome' : 'payment_success',
    title: isNewUser ? '🎉 Bienvenue sur Déclic Entrepreneurs !' : '✅ Paiement confirmé',
    message: isNewUser 
      ? `Votre compte a été créé avec succès. Consultez votre email ${customerEmail} pour créer votre mot de passe.`
      : `Votre pack ${packConfig.pack} a été activé avec succès !`,
    link: '/client',
  });

  console.log('✅ Notification créée');

  console.log('🎉 Paiement traité avec succès pour', customerEmail);

  // 10. Générer et envoyer le contrat (optionnel)
  try {
    const contractResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/contracts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        contractType: 'client_subscription',
        packType: packConfig.pack,
        contractData: {
          price: packConfig.price,
          duration: packConfig.duration_months,
        },
      }),
    });

    const contractData = await contractResponse.json();

    if (contractData.success && process.env.YOUSIGN_API_KEY) {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/yousign/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contractData.contract.id,
        }),
      });
      
      console.log('✅ Contrat généré et envoyé à YouSign');
    }
  } catch (error) {
    console.error('⚠️ Erreur génération contrat:', error);
  }
}

// ==========================================
// GESTION RENOUVELLEMENT
// ==========================================
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerEmail = await getCustomerEmail(subscription.customer as string);

  if (!customerEmail) return;

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (!user) return;

  const { data: existingSub } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!existingSub) return;

  // Prolonger la subscription
  const currentEndDate = new Date(existingSub.end_date);
  const newEndDate = new Date(currentEndDate);
  newEndDate.setMonth(newEndDate.getMonth() + existingSub.duration_months);

  await supabase
    .from('user_subscriptions')
    .update({
      end_date: newEndDate.toISOString().split('T')[0],
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', existingSub.id);

  console.log(`✅ Subscription renewed for ${customerEmail}`);
}

// ==========================================
// GESTION ANNULATION
// ==========================================
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerEmail = await getCustomerEmail(subscription.customer as string);
  
  if (!customerEmail) return;

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (!user) return;

  await supabase
    .from('user_subscriptions')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('stripe_subscription_id', subscription.id);

  // Désactiver aussi client_access
  await supabase
    .from('client_access')
    .update({ is_active: false })
    .eq('user_id', user.id);

  console.log(`❌ Subscription cancelled for ${customerEmail}`);
}

// ==========================================
// GESTION MISE À JOUR SUBSCRIPTION
// ==========================================
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerEmail = await getCustomerEmail(subscription.customer as string);
  
  if (!customerEmail) return;

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (!user) return;

  await supabase
    .from('user_subscriptions')
    .update({ 
      is_active: subscription.status === 'active',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('stripe_subscription_id', subscription.id);

  console.log(`🔄 Subscription updated for ${customerEmail}`);
}

// ==========================================
// UTILITAIRES
// ==========================================
async function getCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return (customer as Stripe.Customer).email;
  } catch (error) {
    console.error('Error retrieving customer:', error);
    return null;
  }
}