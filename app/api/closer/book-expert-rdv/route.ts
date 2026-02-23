// app/api/closer/book-expert-rdv/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { leadId, leadName, leadEmail, scheduledAt } = await req.json();

    console.log('📅 Réservation RDV Expert par closer:', { leadId, leadEmail, scheduledAt });

    if (!leadId || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Récupérer ou créer le client
    let { data: client } = await supabase
      .from('users')
      .select('id')
      .eq('id', leadId)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 2. Trouver un expert disponible
    // Pour l'instant, on prend le premier expert actif
    // TODO: Améliorer avec vérification des disponibilités réelles
    const { data: availableExpert } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('role', 'EXPERT')
      .limit(1)
      .single();

    if (!availableExpert) {
      return NextResponse.json({ error: 'No expert available' }, { status: 404 });
    }

    console.log('👤 Expert assigné:', availableExpert.email);

    // 3. Créer le RDV dans calendly_events
    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + 60); // RDV de 60min

    const { data: calendlyEvent, error: calendlyError } = await supabase
      .from('calendly_events')
      .insert({
        calendly_event_id: `manual_${Date.now()}`, // ID manuel
        event_type: 'expert',
        user_id: client.id,
        invitee_name: leadName,
        invitee_email: leadEmail,
        scheduled_at: scheduledAt,
        end_time: endTime.toISOString(),
        status: 'scheduled',
        assigned_staff_id: availableExpert.id,
        assigned_staff_name: `${availableExpert.first_name} ${availableExpert.last_name}`,
      })
      .select()
      .single();

    if (calendlyError) {
      console.error('❌ Erreur création calendly_event:', calendlyError);
      throw calendlyError;
    }

    // 4. Créer le RDV dans expert_appointments
    const { data: existingAppointments } = await supabase
      .from('expert_appointments')
      .select('rdv_number')
      .eq('client_id', client.id)
      .order('rdv_number', { ascending: false })
      .limit(1);

    const nextRdvNumber = existingAppointments?.[0]?.rdv_number 
      ? existingAppointments[0].rdv_number + 1 
      : 1;

    const { data: appointment, error: appointmentError } = await supabase
      .from('expert_appointments')
      .insert({
        client_id: client.id,
        expert_id: availableExpert.id,
        rdv_number: nextRdvNumber,
        scheduled_at: scheduledAt,
        status: 'scheduled',
        notes: `RDV réservé par closer - Calendly Event: ${calendlyEvent.id}`,
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('❌ Erreur création appointment:', appointmentError);
      throw appointmentError;
    }

    // 5. Assigner le client à l'expert
    await supabase
      .from('expert_clients')
      .upsert({
        expert_id: availableExpert.id,
        client_id: client.id,
        status: 'active',
      }, {
        onConflict: 'expert_id,client_id',
      });

    console.log('✅ RDV expert créé:', appointment.id);

    // 6. TODO: Envoyer email de confirmation au client

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        rdv_number: nextRdvNumber,
        expert_name: `${availableExpert.first_name} ${availableExpert.last_name}`,
        scheduled_at: scheduledAt,
      },
    });

  } catch (error: any) {
    console.error('❌ Erreur réservation RDV:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}