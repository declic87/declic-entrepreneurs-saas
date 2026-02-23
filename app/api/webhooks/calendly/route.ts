// app/api/webhooks/calendly/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { determineEventType } from '@/lib/calendly/calendlyService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CALENDLY_API_TOKEN = process.env.CALENDLY_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    console.log('📥 Webhook Calendly reçu:', payload.event);
    
    const eventType = payload.event;
    const inviteeData = payload.payload;

    // ========================================
    // NOUVEAU RDV CRÉÉ (invitee.created)
    // ========================================
    if (eventType === 'invitee.created') {
      const clientEmail = inviteeData.email;
      const clientName = inviteeData.name;
      const [firstName, ...lastNameParts] = clientName.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;
      
      const eventUri = inviteeData.event;
      const inviteeUri = inviteeData.invitee;
      
      // Récupérer les détails de l'événement via API Calendly
      const eventResponse = await fetch(eventUri, {
        headers: {
          'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const eventData = await eventResponse.json();
      const event = eventData.resource;
      
      const calendlyEventType = determineEventType(eventUri);
      
      // Récupérer l'expert assigné
      let assignedExpertEmail = null;
      let assignedExpertName = null;
      
      if (event.event_memberships && event.event_memberships.length > 0) {
        assignedExpertEmail = event.event_memberships[0].user_email;
        assignedExpertName = event.event_memberships[0].user_name;
      }
      
      console.log('📧 Email client:', clientEmail);
      console.log('👤 Expert assigné:', assignedExpertEmail);
      console.log('🏷️ Type événement:', calendlyEventType);
      
      // ========================================
      // 1. VÉRIFIER/CRÉER LE CLIENT
      // ========================================
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, auth_id')
        .eq('email', clientEmail)
        .single();
      
      let clientUserId;
      
      if (existingUser) {
        clientUserId = existingUser.id;
        console.log('✅ Client existant:', clientUserId);
      } else {
        // Créer le compte Auth
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: clientEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
          }
        });
        
        if (authError) {
          console.error('❌ Erreur création Auth:', authError);
          throw authError;
        }
        
        // Créer l'utilisateur dans users
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id,
            email: clientEmail,
            first_name: firstName,
            last_name: lastName,
            role: 'CLIENT'
          })
          .select()
          .single();
        
        if (userError) {
          console.error('❌ Erreur création user:', userError);
          throw userError;
        }
        
        clientUserId = newUser.id;
        console.log('✅ Nouveau client créé:', clientUserId);
        
        // Créer company_creation_data
        await supabase
          .from('company_creation_data')
          .insert({
            user_id: clientUserId,
            step: 'rdv_expert'
          });
      }
      
      // ========================================
      // 2. TROUVER L'EXPERT ASSIGNÉ
      // ========================================
      let assignedStaffId = null;
      
      if (assignedExpertEmail) {
        const { data: expertData } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
          .eq('email', assignedExpertEmail)
          .single();
        
        if (expertData) {
          assignedStaffId = expertData.id;
          
          // Assigner le client à l'expert
          await supabase
            .from('expert_clients')
            .upsert({
              expert_id: expertData.id,
              client_id: clientUserId,
              status: 'active'
            }, {
              onConflict: 'expert_id,client_id'
            });
          
          console.log('✅ Client assigné à l\'expert:', expertData.email);
        }
      }
      
      // ========================================
      // 3. STOCKER L'ÉVÉNEMENT CALENDLY
      // ========================================
      const { data: calendlyEvent, error: eventInsertError } = await supabase
        .from('calendly_events')
        .insert({
          calendly_event_id: eventUri,
          event_type: calendlyEventType,
          user_id: clientUserId,
          invitee_name: clientName,
          invitee_email: clientEmail,
          scheduled_at: event.start_time,
          end_time: event.end_time,
          status: 'scheduled',
          calendly_uri: eventUri,
          reschedule_url: inviteeData.reschedule_url || null,
          cancel_url: inviteeData.cancel_url || null,
          assigned_staff_id: assignedStaffId,
          assigned_staff_name: assignedExpertName,
        })
        .select()
        .single();
      
      if (eventInsertError) {
        console.error('❌ Erreur insertion calendly_events:', eventInsertError);
      } else {
        console.log('✅ Événement Calendly stocké:', calendlyEvent.id);
      }
      
      // ========================================
      // 4. CRÉER EXPERT_APPOINTMENT (si RDV expert)
      // ========================================
      if (calendlyEventType === 'expert' && clientUserId && assignedStaffId) {
        const { data: existingAppointments } = await supabase
          .from('expert_appointments')
          .select('rdv_number')
          .eq('client_id', clientUserId)
          .order('rdv_number', { ascending: false })
          .limit(1);
        
        const nextRdvNumber = existingAppointments?.[0]?.rdv_number 
          ? existingAppointments[0].rdv_number + 1 
          : 1;
        
        const { error: appointmentError } = await supabase
          .from('expert_appointments')
          .insert({
            client_id: clientUserId,
            expert_id: assignedStaffId,
            rdv_number: nextRdvNumber,
            scheduled_at: event.start_time,
            status: 'scheduled',
            notes: `RDV programmé via Calendly - ${calendlyEvent?.id || eventUri}`,
          });
        
        if (appointmentError) {
          console.error('❌ Erreur création expert_appointment:', appointmentError);
        } else {
          console.log('✅ Expert appointment créé - RDV #' + nextRdvNumber);
        }
      }
      
      return NextResponse.json({ 
        success: true,
        client: clientEmail,
        expert: assignedExpertEmail,
        eventType: calendlyEventType
      });
    }
    
    // ========================================
    // RDV ANNULÉ (invitee.canceled)
    // ========================================
    if (eventType === 'invitee.canceled') {
      const eventUri = inviteeData.event;
      
      // Mettre à jour calendly_events
      await supabase
        .from('calendly_events')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('calendly_event_id', eventUri);
      
      // Mettre à jour expert_appointments si existe
      const { data: calendlyEvent } = await supabase
        .from('calendly_events')
        .select('id')
        .eq('calendly_event_id', eventUri)
        .single();
      
      if (calendlyEvent) {
        await supabase
          .from('expert_appointments')
          .update({ status: 'cancelled' })
          .ilike('notes', `%${calendlyEvent.id}%`);
      }
      
      console.log('✅ RDV Calendly annulé');
      
      return NextResponse.json({ success: true, action: 'cancelled' });
    }
    
    return NextResponse.json({ skipped: true });
    
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

// Webhook de vérification Calendly
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get('challenge');
  
  if (challenge) {
    return new NextResponse(challenge, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return NextResponse.json({ status: 'Webhook endpoint ready' });
}