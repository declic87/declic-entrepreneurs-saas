import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  // 1. Initialisation des clients à l'intérieur pour éviter les erreurs de build
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16" as any, 
  });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.text(); // Stripe nécessite le body brut (raw)
  const signature = req.headers.get("stripe-signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Erreur Signature Webhook: ${err.message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Gestion des événements
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Mise à jour de l'utilisateur dans Supabase
      const { error } = await supabaseAdmin
        .from("clients")
        .update({ status: "PAID", stripe_customer_id: session.customer })
        .eq("email", session.customer_details?.email);

      if (error) {
        console.error("Erreur mise à jour client Stripe:", error);
      }
      break;

    case "invoice.payment_failed":
      console.log("Paiement échoué pour l'événement:", event.id);
      break;

    default:
      console.log(`Événement non géré: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}