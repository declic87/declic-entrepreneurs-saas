import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key (pas anon key)
);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    console.log('📥 Webhook Calendly reçu:', payload);
    
    // Vérifier que c'est un nouveau RDV
    if (payload.event !== 'invitee.created') {
      return NextResponse.json({ skipped: true });
    }
    
    const inviteeData = payload.payload;
    
    // Extraire les données
    const clientEmail = inviteeData.email;
    const clientName = inviteeData.name;
    const [firstName, ...lastNameParts] = clientName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;
    
    // Récupérer l'expert assigné par Calendly
    const eventUri = inviteeData.event;
    
    // Appeler l'API Calendly pour récupérer les détails de l'event
    const calendlyToken = process.env.CALENDLY_API_TOKEN!;
    
    const eventResponse = await fetch(eventUri, {
      headers: {
        'Authorization': `Bearer ${calendlyToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const eventData = await eventResponse.json();
    const assignedExpertEmail = eventData.resource.event_memberships[0]?.user_email;
    
    console.log('📧 Email client:', clientEmail);
    console.log('👤 Expert assigné:', assignedExpertEmail);
    
    // 1. Vérifier si le client existe déjà
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
      // 2. Créer le compte Auth si nouveau client
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
      
      // 3. Créer l'utilisateur dans la table users
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          auth_id: authData.user.id,
          email: clientEmail,
          first_name: firstName,
          last_name: lastName,
          role: 'client'
        })
        .select()
        .single();
      
      if (userError) {
        console.error('❌ Erreur création user:', userError);
        throw userError;
      }
      
      clientUserId = newUser.id;
      console.log('✅ Nouveau client créé:', clientUserId);
      
      // TODO: Envoyer email avec lien de réinitialisation de mot de passe
    }
    
    // 4. Trouver l'expert dans la base
    const { data: expertData } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('email', assignedExpertEmail)
      .eq('role', 'expert')
      .single();
    
    if (!expertData) {
      console.error('❌ Expert non trouvé:', assignedExpertEmail);
      return NextResponse.json({ 
        error: 'Expert not found',
        expertEmail: assignedExpertEmail 
      }, { status: 404 });
    }
    
    // 5. Assigner le client à l'expert
    const { error: assignError } = await supabase
      .from('expert_clients')
      .insert({
        expert_id: expertData.id,
        client_id: clientUserId
      })
      .select()
      .single();
    
    if (assignError && assignError.code !== '23505') { // Ignore duplicate
      console.error('❌ Erreur assignation:', assignError);
      throw assignError;
    }
    
    console.log('✅ Client assigné à l\'expert:', expertData.email);
    
    // 6. Créer l'entrée company_creation_data
    const { error: companyError } = await supabase
      .from('company_creation_data')
      .insert({
        user_id: clientUserId,
        step: 'rdv_expert'
      });
    
    if (companyError && companyError.code !== '23505') {
      console.error('⚠️ Erreur création company_data:', companyError);
    }
    
    return NextResponse.json({ 
      success: true,
      client: clientEmail,
      expert: expertData.email
    });
    
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