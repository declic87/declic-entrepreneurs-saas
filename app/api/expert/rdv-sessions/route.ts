import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Récupérer les sessions d'un client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const expertId = searchParams.get('expertId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
    }

    let query = supabase
      .from('expert_rdv_sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('rdv_number', { ascending: true });

    if (expertId) {
      query = query.eq('expert_id', expertId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ sessions: data || [] });
  } catch (error: any) {
    console.error('❌ GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Créer ou mettre à jour une session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId, // Si fourni, on update
      expertId,
      clientId,
      rdvNumber,
      packType,
      clientData,
      rdvData,
      completed = false,
    } = body;

    if (!expertId || !clientId || !rdvNumber || !packType) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    let result;

    if (sessionId) {
      // Update session existante
      const { data, error } = await supabase
        .from('expert_rdv_sessions')
        .update({
          client_data: clientData,
          rdv_data: rdvData,
          completed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Créer nouvelle session
      const { data, error } = await supabase
        .from('expert_rdv_sessions')
        .insert({
          expert_id: expertId,
          client_id: clientId,
          rdv_number: rdvNumber,
          pack_type: packType,
          client_data: clientData,
          rdv_data: rdvData,
          completed,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, session: result });
  } catch (error: any) {
    console.error('❌ POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Enregistrer le PDF généré
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, pdfUrl } = body;

    if (!sessionId || !pdfUrl) {
      return NextResponse.json(
        { error: 'sessionId et pdfUrl requis' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('expert_rdv_sessions')
      .update({
        pdf_url: pdfUrl,
        pdf_generated_at: new Date().toISOString(),
        completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, session: data });
  } catch (error: any) {
    console.error('❌ PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprimer une session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('expert_rdv_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}