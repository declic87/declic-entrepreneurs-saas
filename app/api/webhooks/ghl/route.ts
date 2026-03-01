// app/api/webhooks/ghl/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role pour bypass RLS
);

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Vérifier la signature du webhook (sécurité)
    const signature = request.headers.get('x-ghl-signature');
    // TODO: Valider la signature avec ton GHL secret
    
    console.log('Webhook GHL reçu:', payload);

    // Identifier le type d'événement GHL
    const eventType = payload.type;

    switch (eventType) {
      case 'ContactCreate':
      case 'ContactUpdate':
        await handleContactEvent(payload);
        break;
      
      case 'OpportunityCreate':
      case 'OpportunityUpdate':
        await handleOpportunityEvent(payload);
        break;
      
      case 'AppointmentCreate':
      case 'AppointmentUpdate':
        await handleAppointmentEvent(payload);
        break;
      
      case 'InvoiceCreate':
      case 'InvoicePaid':
        await handleInvoiceEvent(payload);
        break;
      
      default:
        console.log('Type événement non géré:', eventType);
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Erreur webhook GHL:', error);
    return NextResponse.json(
      { error: 'Erreur traitement webhook' },
      { status: 500 }
    );
  }
}

// =============================================
// GESTION CONTACTS
// =============================================
async function handleContactEvent(payload: any) {
  const contact = payload.contact;
  
  // Créer ou mettre à jour l'utilisateur
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', contact.email)
    .single();

  if (existingUser) {
    // Mise à jour
    await supabase
      .from('users')
      .update({
        first_name: contact.firstName,
        last_name: contact.lastName,
        phone: contact.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id);
      
    console.log('Utilisateur mis à jour:', contact.email);
  } else {
    // Création
    const { data: newUser } = await supabase
      .from('users')
      .insert({
        email: contact.email,
        first_name: contact.firstName,
        last_name: contact.lastName,
        phone: contact.phone,
        role: 'client',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    console.log('Nouvel utilisateur créé:', contact.email);
    
    // Créer le lead
    await supabase
      .from('leads')
      .insert({
        email: contact.email,
        first_name: contact.firstName,
        last_name: contact.lastName,
        phone: contact.phone,
        source: 'ghl_webhook',
        status: 'new',
        ghl_contact_id: contact.id,
        created_at: new Date().toISOString(),
      });
  }
}

// =============================================
// GESTION OPPORTUNITÉS (DEALS)
// =============================================
async function handleOpportunityEvent(payload: any) {
  const opportunity = payload.opportunity;
  
  // Récupérer l'utilisateur associé
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', opportunity.contactEmail)
    .single();

  if (!user) {
    console.log('Utilisateur introuvable pour opportunité:', opportunity.contactEmail);
    return;
  }

  // Mettre à jour le lead
  await supabase
    .from('leads')
    .update({
      status: mapGHLStatusToLeadStatus(opportunity.status),
      pipeline_stage: opportunity.pipelineStage,
      monetary_value: opportunity.monetaryValue,
      updated_at: new Date().toISOString(),
    })
    .eq('email', opportunity.contactEmail);

  console.log('Opportunité traitée:', opportunity.name);
}

// =============================================
// GESTION RENDEZ-VOUS
// =============================================
async function handleAppointmentEvent(payload: any) {
  const appointment = payload.appointment;
  
  // Récupérer l'utilisateur
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', appointment.contactEmail)
    .single();

  if (!user) return;

  // Créer le RDV dans calendly_events ou rdvs
  await supabase
    .from('calendly_events')
    .insert({
      user_id: user.id,
      event_type: appointment.title,
      invitee_email: appointment.contactEmail,
      invitee_name: `${appointment.contactFirstName} ${appointment.contactLastName}`,
      scheduled_at: appointment.startTime,
      end_time: appointment.endTime,
      status: mapGHLAppointmentStatus(appointment.status),
      meeting_notes: appointment.notes,
      created_at: new Date().toISOString(),
    });

  console.log('RDV créé:', appointment.title);
}

// =============================================
// GESTION PAIEMENTS/FACTURES
// =============================================
async function handleInvoiceEvent(payload: any) {
  const invoice = payload.invoice;
  
  // Créer le paiement
  await supabase
    .from('payments')
    .insert({
      clientId: invoice.contactId,
      amount: invoice.amount,
      status: invoice.status === 'paid' ? 'completed' : 'pending',
      paymentMethod: invoice.paymentMethod,
      createdAt: new Date().toISOString(),
    });

  // Si payé, créer l'abonnement
  if (invoice.status === 'paid') {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', invoice.contactEmail)
      .single();

    if (user) {
      await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          pack_type: determinePackFromInvoice(invoice),
          price: invoice.amount,
          duration_months: 12,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
        });
    }
  }

  console.log('Facture traitée:', invoice.id);
}

// =============================================
// FONCTIONS UTILITAIRES
// =============================================
function mapGHLStatusToLeadStatus(ghlStatus: string): string {
  const mapping: Record<string, string> = {
    'won': 'won',
    'lost': 'lost',
    'open': 'in_progress',
    'abandoned': 'lost',
  };
  return mapping[ghlStatus] || 'new';
}

function mapGHLAppointmentStatus(ghlStatus: string): string {
  const mapping: Record<string, string> = {
    'confirmed': 'scheduled',
    'showed': 'completed',
    'no_show': 'no_show',
    'cancelled': 'canceled',
  };
  return mapping[ghlStatus] || 'scheduled';
}

function determinePackFromInvoice(invoice: any): string {
  const amount = invoice.amount;
  
  if (amount >= 800) return 'vip';
  if (amount >= 250) return 'premium';
  return 'starter';
}