import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Important : utiliser la service role key
);

// Mapping des Payment Links Stripe vers les packs
const PAYMENT_LINK_TO_PACK: Record<string, {
  pack: string;
  price: number;
  duration_months: number;
  rdv_expert_included: number;
}> = {
  // 🔵 Plateforme - 97€/mois (illimité)
  'plink_1SvfQEAl0RypxECL30FQAkFp': {
    pack: 'PLATEFORME',
    price: 97,
    duration_months: 1, // Mensuel
    rdv_expert_included: 0
  },
  
  // 🚀 Formation Créateur - 497€ (3 mois)
  'plink_1SvfP8Al0RypxECLOmBfTPBw': {
    pack: 'FORMATION_CREATEUR',
    price: 497,
    duration_months: 3,
    rdv_expert_included: 0
  },
  
  // 🏠 Formation Agent Immo - 897€ (3 mois)
  'plink_1SvfOrAl0RypxECLKQZR0Io1': {
    pack: 'FORMATION_AGENT_IMMO',
    price: 897,
    duration_months: 3,
    rdv_expert_included: 0
  },
  
  // 💼 STARTER - 3600€ (6 mois, 3 RDV)
  'plink_1SvfQ4Al0RypxECLUaOUG52Y': {
    pack: 'STARTER',
    price: 3600,
    duration_months: 6,
    rdv_expert_included: 3
  },
  
  // 🔥 PRO - 4600€ (12 mois, 4 RDV)
  'plink_1SvfPsAl0RypxECLoXQfpyag': {
    pack: 'PRO',
    price: 4600,
    duration_months: 12,
    rdv_expert_included: 4
  },
  
  // ⭐ EXPERT - 6600€ (18 mois, 5 RDV)
  'plink_1SvfPiAl0RypxECLvjfNr4wv': {
    pack: 'EXPERT',
    price: 6600,
    duration_months: 18,
    rdv_expert_included: 5
  }
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
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  // Gérer les événements Stripe
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
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// GESTION PAIEMENT INITIAL
// ==========================================
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email || session.customer_details?.email;
  
  if (!customerEmail) {
    console.error('No customer email found');
    return;
  }

  // Récupérer l'utilisateur depuis Supabase
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', customerEmail)
    .single();

  if (!user) {
    console.error('User not found:', customerEmail);
    return;
  }

  // Récupérer les détails du Payment Link
  const paymentLink = session.payment_link;
  const packConfig = PAYMENT_LINK_TO_PACK[paymentLink as string];

  if (!packConfig) {
    console.error('Unknown payment link:', paymentLink);
    return;
  }

  // Calculer les dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + packConfig.duration_months);

  // Créer la subscription dans Supabase
  const { error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: user.id,
      pack_type: packConfig.pack,
      price: packConfig.price,
      duration_months: packConfig.duration_months,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      rdv_expert_included: packConfig.rdv_expert_included,
      rdv_expert_used: 0,
      is_active: true,
      stripe_subscription_id: session.subscription as string || session.id
    });

  if (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }

  console.log(`✅ Subscription created for ${customerEmail}: ${packConfig.pack}`);

  // Générer et envoyer le contrat automatiquement
  try {
    const contractResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/contracts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
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
      // Envoyer à YouSign pour signature
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/yousign/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contractData.contract.id,
        }),
      });
      
      console.log('✅ Contrat généré et envoyé à YouSign pour signature');
    }
  } catch (error) {
    console.error('❌ Erreur génération contrat:', error);
    // On ne bloque pas le processus principal si le contrat échoue
  }
}

// ==========================================
// GESTION RENOUVELLEMENT
// ==========================================
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) return;

  // Récupérer la subscription Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerEmail = await getCustomerEmail(subscription.customer as string);

  if (!customerEmail) return;

  // Récupérer l'utilisateur
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (!user) return;

  // Récupérer la subscription existante
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

  console.log(`✅ Subscription renewed for ${customerEmail} until ${newEndDate.toISOString()}`);
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

  // Désactiver la subscription
  await supabase
    .from('user_subscriptions')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('stripe_subscription_id', subscription.id);

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

  // Mettre à jour le statut
  await supabase
    .from('user_subscriptions')
    .update({ 
      is_active: subscription.status === 'active',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('stripe_subscription_id', subscription.id);

  console.log(`🔄 Subscription updated for ${customerEmail}: ${subscription.status}`);
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